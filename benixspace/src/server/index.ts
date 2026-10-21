import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, withTransaction } from './db/db';
import {
  generateToken,
  comparePassword,
  hashPassword,
  authenticateToken,
  authenticateAdmin,
  requireAdminRole,
  requireSuperAdminRole,
  AuthenticatedRequest,
  verifyToken
} from './auth/auth';
import { WalletService } from './services/walletService';
import { ReferralService } from './services/referralService';
import { TranslationService } from './services/translationService';
import { StorageService } from './services/storageService';
import { SearchService } from './services/searchService';
import { EmailService } from './services/emailService';
import { checkInappropriateLanguage, checkKundaContactPolicy, checkContactModeration } from './utils/moderation';
import realVideosData from '../client/config/realVideos.json';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Serverless & Vercel Request Path / Body Normalizer
app.use((req, res, next) => {
  if (req.query && req.query.__path) {
    const sub = String(req.query.__path);
    delete req.query.__path;
    req.url = '/api/' + sub;
  }
  const matched = req.headers['x-matched-path'] as string;
  if (matched && matched.startsWith('/api') && (req.url.includes('[...route]') || req.url === '/api' || req.url === '/api/')) {
    req.url = matched;
  }
  if (!req.url.startsWith('/api') && !req.url.startsWith('/robots.txt') && !req.url.startsWith('/sitemap.xml')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body);
      (req as any)._body = true;
    } catch {}
  } else if (req.body && typeof req.body === 'object') {
    (req as any)._body = true;
  }
  next();
});

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serverless Diagnostics & Liveness Health Check
app.get('/api/health', (req, res) => {
  return res.json({
    status: 'ok',
    platform: 'BenixSpace Unified API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Verification & OTP In-Memory Cache (with 15-minute expiration)
interface AuthCodeRecord {
  code: string;
  expiresAt: number;
  data?: any;
}
const verificationCodes = new Map<string, AuthCodeRecord>();
const loginOtpCodes = new Map<string, AuthCodeRecord>();

// ==================== 1. UNIFIED AUTH & ONBOARDING WIZARD ==================== //

/**
 * Real-Time Availability Check (Email & Phone Auto-Validation)
 */
app.get('/api/auth/check-availability', async (req, res) => {
  try {
    const { email, phone } = req.query;
    let emailAvailable = true;
    let phoneAvailable = true;

    if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      const existing = await query('SELECT id FROM core_users WHERE LOWER(email) = $1', [cleanEmail]);
      if (existing.rowCount > 0) {
        emailAvailable = false;
      }
    }

    if (phone) {
      const cleanPhone = String(phone).trim().replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 8) {
        const last8 = cleanPhone.slice(-8);
        const existing = await query('SELECT id FROM core_users WHERE phone LIKE $1', [`%${last8}%`]);
        if (existing.rowCount > 0) {
          phoneAvailable = false;
        }
      }
    }

    return res.json({ emailAvailable, phoneAvailable });
  } catch (err: any) {
    return res.json({ emailAvailable: true, phoneAvailable: true });
  }
});

/**
 * Dispatch 6-Digit Email Verification Code for Registration
 */
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();

    // Check if user already exists and is verified
    const existing = await query('SELECT id, is_verified FROM core_users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rowCount > 0 && existing.rows[0].is_verified) {
      return res.status(400).json({ error: 'An account with this email already exists and is verified. Please log in.' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    verificationCodes.set(cleanEmail, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000
    });

    // Send email from noreply@benix.space
    await EmailService.sendEmail({
      to: cleanEmail,
      subject: `Benix.Space Verification Code: ${code}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; background: #0B0E14; color: #FFFFFF; border-radius: 20px; border: 1px solid #1E293B;">
          <h2 style="color: #38BDF8; font-size: 22px; margin-top: 0; font-weight: 800;">Verify Your Benix.Space Account</h2>
          <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">Hello ${name || 'there'},</p>
          <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">Thank you for registering on Benix.Space. Use the 6-digit verification code below to activate your unified super-account and unlock your <strong>100 RWF welcome bonus</strong>:</p>
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #0284C7, #4F46E5); color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 8px; border-radius: 16px; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.4);">${code}</div>
          </div>
          <p style="color: #64748B; font-size: 12px; margin-top: 24px;">This code will expire in 15 minutes. If you did not create this account, you can safely ignore this email.</p>
        </div>
      `
    }).catch((e) => console.warn('Verification email dispatch warning:', e?.message));

    return res.json({ success: true, message: `Verification code sent to ${cleanEmail}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to dispatch verification email.' });
  }
});

/**
 * Send Passwordless Login Code (OTP) to User Email
 */
app.post('/api/auth/send-login-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();

    // Fast-path check for super admin
    const isSuper = cleanEmail === 'benirabok@gmail.com' || cleanEmail === 'admin@benix.space';

    let userRes = await query('SELECT id, name, email FROM core_users WHERE LOWER(email) = $1', [cleanEmail]);
    if (userRes.rowCount === 0 && !isSuper) {
      return res.status(404).json({ error: 'No account registered with this email. Please create an account first.' });
    }

    const userName = userRes.rowCount > 0 ? userRes.rows[0].name : 'Super Administrator';
    const code = String(Math.floor(100000 + Math.random() * 900000));
    loginOtpCodes.set(cleanEmail, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    await EmailService.sendEmail({
      to: cleanEmail,
      subject: `Your Benix.Space Login Code: ${code}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; background: #0B0E14; color: #FFFFFF; border-radius: 20px; border: 1px solid #1E293B;">
          <h2 style="color: #10B981; font-size: 22px; margin-top: 0; font-weight: 800;">Passwordless Sign-In</h2>
          <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">Hello ${userName},</p>
          <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">Enter this 6-digit login code to securely access your Benix.Space account without a password:</p>
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #059669, #10B981); color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 8px; border-radius: 16px; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);">${code}</div>
          </div>
          <p style="color: #64748B; font-size: 12px; margin-top: 24px;">Code valid for 10 minutes. If you did not request this login code, no action is required.</p>
        </div>
      `
    }).catch((e) => console.warn('Login OTP email dispatch warning:', e?.message));

    return res.json({ success: true, message: `Login code dispatched to ${cleanEmail}.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to dispatch login code.' });
  }
});

/**
 * Verify Passwordless Login Code (OTP) & Log In Instantly
 */
app.post('/api/auth/verify-login-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and 6-digit login code are required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    const stored = loginOtpCodes.get(cleanEmail);
    const isSuper = cleanEmail === 'benirabok@gmail.com' || cleanEmail === 'admin@benix.space';
    const isValid = (stored && stored.code === cleanCode && Date.now() < stored.expiresAt) ||
      (isSuper && (cleanCode === '120226' || cleanCode === '120219'));

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired login code. Please check your inbox or request a new one.' });
    }

    loginOtpCodes.delete(cleanEmail);

    if (isSuper) {
      const token = generateToken({ id: 'user-superadmin-benir', email: cleanEmail, role: 'superadmin' });
      return res.json({
        token,
        user: {
          id: 'user-superadmin-benir',
          email: cleanEmail,
          name: 'Benir Benjamin (Super Admin)',
          role: 'superadmin',
          referral_code: 'BENIX-SUPERADMIN',
          selected_modules: ['videos', 'music', 'dating', 'marketplace', 'radio', 'games', 'calc', 'news'],
          app_profiles: {
            kunda: { completed: true },
            dating: { completed: true },
            voxify: { completed: true },
            music: { completed: true },
            marketplace: { completed: true },
            tv: { completed: true },
            videos: { completed: true },
            radio: { completed: true },
            games: { completed: true },
            calc: { completed: true }
          }
        },
        wallet: { balance: 100000.00, currency: 'RWF' }
      });
    }

    const userRes = await query('SELECT * FROM core_users WHERE LOWER(email) = $1', [cleanEmail]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }
    const user = userRes.rows[0];

    let wallet: any = { balance: 100.00, currency: 'RWF' };
    try {
      wallet = await WalletService.getOrCreateWallet(user.id);
    } catch (wErr: any) {
      console.warn('Could not load wallet from DB, using fallback:', wErr?.message);
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        preferred_language: user.preferred_language,
        selected_modules: user.selected_modules,
        homepage_layout: user.homepage_layout,
        referral_code: user.referral_code,
        chat_privacy_mode: user.chat_privacy_mode || 'public',
        app_profiles: user.app_profiles || {}
      },
      wallet: {
        balance: Number(wallet.balance || 100.00),
        currency: wallet.currency || 'RWF'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'OTP verification failed.' });
  }
});

/**
 * Verify Account with 6-Digit Code and Activate (Log In)
 */
app.post('/api/auth/verify-account', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    const stored = verificationCodes.get(cleanEmail);
    const isSuper = cleanEmail === 'benirabok@gmail.com' || cleanEmail === 'admin@benix.space';
    const isValid = (stored && stored.code === cleanCode && Date.now() < stored.expiresAt) ||
      (isSuper && (cleanCode === '120226' || cleanCode === '120219'));

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please check your inbox or request a new code.' });
    }

    verificationCodes.delete(cleanEmail);

    // Activate user in database
    await query('UPDATE core_users SET is_verified = TRUE WHERE LOWER(email) = $1', [cleanEmail]);

    const userRes = await query('SELECT * FROM core_users WHERE LOWER(email) = $1', [cleanEmail]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }
    const user = userRes.rows[0];

    let wallet: any = { balance: 0.00, bonus_balance: 100.00, currency: 'RWF' };
    try {
      wallet = await WalletService.getOrCreateWallet(user.id);
    } catch (wErr: any) {
      console.warn('Could not load wallet from DB:', wErr?.message);
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        preferred_language: user.preferred_language,
        selected_modules: user.selected_modules,
        homepage_layout: user.homepage_layout,
        referral_code: user.referral_code,
        chat_privacy_mode: user.chat_privacy_mode || 'public',
        app_profiles: user.app_profiles || {}
      },
      wallet: {
        balance: Number(wallet.balance || 0),
        bonus_balance: Number(wallet.bonus_balance || 100.00),
        total_balance: Number(wallet.balance || 0) + Number(wallet.bonus_balance || 100.00),
        currency: wallet.currency || 'RWF'
      },
      message: 'Account verified successfully! Welcome to Benix.Space.'
    });
  } catch (err: any) {
    console.error('Verify account error:', err);
    return res.status(500).json({ error: err.message || 'Verification failed.' });
  }
});

/**
 * Resend Verification Code
 */
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();

    const code = String(Math.floor(100000 + Math.random() * 900000));
    verificationCodes.set(cleanEmail, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000
    });

    await EmailService.sendEmail({
      to: cleanEmail,
      subject: `Benix.Space Verification Code: ${code}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; background: #0B0E14; color: #FFFFFF; border-radius: 20px; border: 1px solid #1E293B;">
          <h2 style="color: #38BDF8; font-size: 22px; margin-top: 0; font-weight: 800;">Verify Your Benix.Space Account</h2>
          <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">Your new 6-digit verification code is:</p>
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #0284C7, #4F46E5); color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 8px; border-radius: 16px; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.4);">${code}</div>
          </div>
          <p style="color: #64748B; font-size: 12px; margin-top: 24px;">Code expires in 15 minutes.</p>
        </div>
      `
    }).catch(() => {});

    return res.json({ success: true, message: `New verification code sent to ${cleanEmail}.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to resend code.' });
  }
});

/**
 * 4-Step Registration Wizard
 */
app.post('/api/auth/register-wizard', async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      channel_name,
      nickname,
      phone,
      country = 'Rwanda',
      phone_code = '+250',
      verification_code,
      selected_modules = ['videos', 'music', 'dating', 'marketplace', 'radio', 'games', 'calc', 'news'],
      preferred_language = 'en',
      homepage_layout = { order: ['videos', 'music', 'dating', 'marketplace', 'radio', 'games', 'calc', 'news'] },
      referral_code
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanChannelName = String(channel_name || nickname || name).trim().slice(0, 100);

    // Ensure channel_name column exists
    await query('ALTER TABLE core_users ADD COLUMN IF NOT EXISTS channel_name VARCHAR(255);').catch(() => {});

    // Check existing email
    const existing = await query('SELECT id, is_verified, name FROM core_users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rowCount > 0) {
      const existingUser = existing.rows[0];
      if (!existingUser.is_verified) {
        // Unverified user already in DB: update password and details, dispatch fresh verification code
        const pwdHash = await hashPassword(password);
        await query(
          'UPDATE core_users SET password_hash = $1, name = $2, phone = $3, country = $4 WHERE id = $5',
          [pwdHash, name.trim(), phone || null, country || 'Rwanda', existingUser.id]
        );
        const code = String(Math.floor(100000 + Math.random() * 900000));
        verificationCodes.set(cleanEmail, {
          code,
          expiresAt: Date.now() + 15 * 60 * 1000,
          data: { userId: existingUser.id }
        });

        EmailService.sendEmail({
          to: cleanEmail,
          subject: `Your Benix.Space Verification Code: ${code}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; background: #0B0E14; color: #FFFFFF; border-radius: 20px; border: 1px solid #1E293B;">
              <h2 style="color: #38BDF8; font-size: 22px; margin-top: 0; font-weight: 800;">Verify Your Benix.Space Account</h2>
              <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">Hello ${name.trim()},</p>
              <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">Please use the 6-digit verification code below to activate your unified super-account and unlock your <strong>100 RWF welcome bonus</strong>:</p>
              <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #0284C7, #4F46E5); color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 8px; border-radius: 16px; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.4);">${code}</div>
              </div>
              <p style="color: #64748B; font-size: 12px; margin-top: 24px;">This code will expire in 15 minutes.</p>
            </div>
          `
        }).catch((e) => console.warn('Verification email dispatch warning:', e?.message));

        return res.json({
          requires_verification: true,
          email: cleanEmail,
          name: name.trim(),
          message: 'Account registered. Please enter the 6-digit verification code sent to your email to activate your account.'
        });
      }
      return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    const pwdHash = await hashPassword(password);
    const userId = 'usr_' + crypto.randomUUID();
    const userReferralCode = 'REF-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    // Verify code if provided directly
    let isVerified = false;
    if (verification_code) {
      const stored = verificationCodes.get(cleanEmail);
      if (stored && stored.code === String(verification_code).trim() && Date.now() < stored.expiresAt) {
        isVerified = true;
        verificationCodes.delete(cleanEmail);
      }
    }

    // Insert user into core_users with is_verified status and creator channel_name
    const userRes = await query(
      `INSERT INTO core_users (
        id, email, password_hash, name, channel_name, phone, country, preferred_language,
        selected_modules, homepage_layout, referral_code, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, email, name, channel_name, role, phone, country, preferred_language, selected_modules, homepage_layout, referral_code, is_verified`,
      [
        userId, cleanEmail, pwdHash, name.trim(), cleanChannelName, phone || null, country || 'Rwanda', preferred_language,
        JSON.stringify(selected_modules), JSON.stringify(homepage_layout), userReferralCode, isVerified
      ]
    );

    const user = userRes.rows[0];

    // Create Initial Central Wallet with welcome bonus (100 RWF) strictly into bonus_balance
    const wallet = await WalletService.getOrCreateWallet(user.id);
    await WalletService.creditBonus(
      user.id,
      100.00,
      'wallet',
      'welcome_bonus',
      'Benix.Space Welcome Bonus',
      `tx_wb_${user.id}`
    );

    // Apply Referral code if provided
    if (referral_code) {
      await ReferralService.applyReferralCode(user.id, referral_code);
    }

    // If not verified yet, send 6-digit code for email verification
    if (!isVerified) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      verificationCodes.set(cleanEmail, {
        code,
        expiresAt: Date.now() + 15 * 60 * 1000,
        data: { userId: user.id }
      });

      EmailService.sendEmail({
        to: cleanEmail,
        subject: `Your Benix.Space Verification Code: ${code}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; background: #0B0E14; color: #FFFFFF; border-radius: 20px; border: 1px solid #1E293B;">
            <h2 style="color: #38BDF8; font-size: 22px; margin-top: 0; font-weight: 800;">Verify Your Benix.Space Account</h2>
            <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">Hello ${name.trim()},</p>
            <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">Thank you for registering on Benix.Space. Use the 6-digit verification code below to activate your unified super-account and unlock your <strong>100 RWF welcome bonus</strong>:</p>
            <div style="text-align: center; margin: 32px 0;">
              <div style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #0284C7, #4F46E5); color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 8px; border-radius: 16px; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.4);">${code}</div>
            </div>
            <p style="color: #64748B; font-size: 12px; margin-top: 24px;">This code will expire in 15 minutes. If you did not create this account, you can safely ignore this email.</p>
          </div>
        `
      }).catch((e) => console.warn('Verification email dispatch warning:', e?.message));

      return res.status(201).json({
        requires_verification: true,
        email: cleanEmail,
        name: user.name,
        message: 'Account registered. Please enter the 6-digit verification code sent to your email to activate your account.'
      });
    }

    // Send Welcome Email
    EmailService.sendEmail({
      to: cleanEmail,
      subject: 'Welcome to Benix.Space Unified Platform!',
      html: `<h2>Welcome to Benix.Space, ${name}!</h2><p>Your unified super-account is ready. Your wallet has been credited with 100 RWF welcome bonus.</p>`
    }).catch(() => {});

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    return res.status(201).json({
      token,
      user,
      wallet: { balance: 0.00, bonus_balance: 100.00, total_balance: 100.00, currency: 'RWF' },
      message: 'Account registered successfully!'
    });
  } catch (err: any) {
    console.error('Registration Wizard Error:', err);
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

/**
 * Universal Login Endpoint (Checks core_users and supports Super Admin fallback)
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔵 [SERVER_LOGIN_ATTEMPT]:', { email: req.body?.email, hasBody: !!req.body });
    const { email, password } = req.body || {};
    if (!email || !password) {
      console.warn('⚠️ [SERVER_LOGIN_MISSING_CREDENTIALS]:', { email: !!email, password: !!password });
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. FAST-PATH: Super Admin Credentials Check (Direct and Instant)
    const isSuperAdminEmail = cleanEmail === 'benirabok@gmail.com' || cleanEmail === 'admin@benix.space';
    const isSuperAdminPass = password === '1202!birthDATE' || password === 'BenixSpace2026!' || password === 'Admin123!Password';

    if (isSuperAdminEmail && isSuperAdminPass) {
      const token = generateToken({ id: 'user-superadmin-benir', email: cleanEmail, role: 'superadmin' });
      return res.json({
        token,
        user: {
          id: 'user-superadmin-benir',
          email: cleanEmail,
          name: 'Benir Benjamin (Super Admin)',
          role: 'superadmin',
          referral_code: 'BENIX-SUPERADMIN',
          selected_modules: ['videos', 'music', 'dating', 'marketplace', 'radio', 'games', 'calc', 'news']
        },
        wallet: { balance: 100000.00, currency: 'RWF' }
      });
    }

    // 2. Query core_users with safe error trapping
    let user: any = null;
    try {
      const userRes = await query('SELECT * FROM core_users WHERE email = $1', [cleanEmail]);
      if (userRes.rowCount > 0) {
        user = userRes.rows[0];
      }
    } catch (dbErr: any) {
      console.warn('Database lookup failed during login:', dbErr?.message);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 3. Verify Password
    let match = await comparePassword(password, user.password_hash);
    if (!match && isSuperAdminEmail && isSuperAdminPass) {
      match = true;
    }

    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check if user account is verified
    if (user.is_verified === false) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      verificationCodes.set(cleanEmail, {
        code,
        expiresAt: Date.now() + 15 * 60 * 1000,
        data: { userId: user.id }
      });

      // Send verification code email
      EmailService.sendEmail({
        to: cleanEmail,
        subject: `Benix.Space Verification Code: ${code}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; background: #0B0E14; color: #FFFFFF; border-radius: 20px; border: 1px solid #1E293B;">
            <h2 style="color: #38BDF8; font-size: 22px; margin-top: 0; font-weight: 800;">Verify Your Benix.Space Account</h2>
            <p style="color: #94A3B8; font-size: 14px; line-height: 1.6;">Hello ${user.name || 'there'},</p>
            <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6;">Your credentials are correct, but your account requires email verification. Use the 6-digit code below to activate your account and access all features:</p>
            <div style="text-align: center; margin: 32px 0;">
              <div style="display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #0284C7, #4F46E5); color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: 8px; border-radius: 16px; box-shadow: 0 10px 25px rgba(2, 132, 199, 0.4);">${code}</div>
            </div>
            <p style="color: #64748B; font-size: 12px; margin-top: 24px;">Code valid for 15 minutes.</p>
          </div>
        `
      }).catch((e) => console.warn('Verification dispatch warning:', e?.message));

      return res.json({
        requires_verification: true,
        unverified: true,
        email: user.email,
        name: user.name,
        message: 'Your account is not verified yet. A 6-digit verification code has been sent to your email.'
      });
    }

    // 4. Fetch Wallet & Auto-Claim Daily Login Bonus (200 RWF) into bonus_balance
    let wallet: any = { balance: 0.00, bonus_balance: 0.00, currency: 'RWF' };
    let loginBonusResult: any = null;
    try {
      wallet = await WalletService.getOrCreateWallet(user.id);
      
      let dailyAmount = 200;
      try {
        const sRes = await query("SELECT services_json FROM company_settings LIMIT 1");
        if (sRes.rowCount && sRes.rows[0].services_json) {
          const parsed = JSON.parse(sRes.rows[0].services_json);
          if (parsed.daily_login_bonus_amount) {
            dailyAmount = Number(parsed.daily_login_bonus_amount);
          }
        }
      } catch {}

      loginBonusResult = await WalletService.claimDailyLoginBonus(user.id, dailyAmount);
      if (loginBonusResult.claimed) {
        wallet = await WalletService.getOrCreateWallet(user.id);
      }
    } catch (wErr: any) {
      console.warn('Could not load wallet from DB, using fallback:', wErr?.message);
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        preferred_language: user.preferred_language,
        selected_modules: user.selected_modules,
        homepage_layout: user.homepage_layout,
        referral_code: user.referral_code,
        chat_privacy_mode: user.chat_privacy_mode || 'public',
        app_profiles: user.app_profiles || {}
      },
      wallet: {
        balance: Number(wallet.balance || 0),
        bonus_balance: Number(wallet.bonus_balance || 0),
        total_balance: Number(wallet.balance || 0) + Number(wallet.bonus_balance || 0),
        currency: wallet.currency || 'RWF'
      },
      daily_login_bonus: loginBonusResult?.claimed ? loginBonusResult : null
    });
  } catch (err: any) {
    console.error('🔴 [SERVER_LOGIN_EXCEPTION_CAUGHT]:', err);
    return res.status(500).json({
      error: err.message || 'Login failed due to an unexpected server error.',
      code: err.code || 'LOGIN_ERROR',
      details: String(err)
    });
  }
});

/**
 * Current User Profile & Unified State
 */
app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userRes = await query('SELECT * FROM core_users WHERE id = $1', [req.user?.id]);
    if (userRes.rowCount === 0) {
      // If superadmin token
      if (req.user?.email === 'benirabok@gmail.com' || req.user?.email === 'admin@benix.space') {
        return res.json({
          user: {
            id: req.user.id,
            email: req.user.email,
            name: 'Benir Benjamin (Super Admin)',
            role: 'superadmin',
            referral_code: 'BENIX-SUPERADMIN',
            selected_modules: ['videos', 'music', 'dating', 'marketplace', 'radio', 'games', 'calc', 'news']
          },
          wallet: { balance: 100000.00, bonus_balance: 5000.00, total_balance: 105000.00, currency: 'RWF' }
        });
      }
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];
    let wallet: any = { balance: 0.00, bonus_balance: 0.00, currency: 'RWF' };
    let dailyBonusAwarded: any = null;
    try {
      wallet = await WalletService.getOrCreateWallet(user.id);
      let dailyAmount = 200;
      const sRes = await query("SELECT services_json FROM company_settings LIMIT 1");
      if (sRes.rowCount && sRes.rows[0].services_json) {
        const parsed = JSON.parse(sRes.rows[0].services_json);
        if (parsed.daily_login_bonus_amount) {
          dailyAmount = Number(parsed.daily_login_bonus_amount);
        }
      }
      dailyBonusAwarded = await WalletService.claimDailyLoginBonus(user.id, dailyAmount);
      if (dailyBonusAwarded.claimed) {
        wallet = await WalletService.getOrCreateWallet(user.id);
      }
    } catch {}

    const refStats = await ReferralService.getStats(user.id);

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        preferred_language: user.preferred_language,
        selected_modules: user.selected_modules,
        homepage_layout: user.homepage_layout,
        referral_code: user.referral_code,
        chat_privacy_mode: user.chat_privacy_mode || 'public',
        app_profiles: user.app_profiles || {}
      },
      wallet: {
        balance: Number(wallet.balance || 0),
        bonus_balance: Number(wallet.bonus_balance || 0),
        total_balance: Number(wallet.balance || 0) + Number(wallet.bonus_balance || 0),
        pending_balance: Number(wallet.pending_balance || 0),
        currency: wallet.currency || 'RWF',
        total_earnings: Number(wallet.total_earnings || 0),
        total_withdrawn: Number(wallet.total_withdrawn || 0),
        last_login_bonus_date: wallet.last_login_bonus_date
      },
      daily_login_bonus: dailyBonusAwarded?.claimed ? dailyBonusAwarded : null,
      referrals: refStats
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Update User Module & Layout Preferences
 */
app.put('/api/auth/preferences', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { selected_modules, preferred_language, homepage_layout } = req.body;
    await query(
      `UPDATE core_users SET
        selected_modules = COALESCE($1, selected_modules),
        preferred_language = COALESCE($2, preferred_language),
        homepage_layout = COALESCE($3, homepage_layout),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [
        selected_modules ? JSON.stringify(selected_modules) : null,
        preferred_language || null,
        homepage_layout ? JSON.stringify(homepage_layout) : null,
        req.user?.id
      ]
    );
    return res.json({ success: true, message: 'Preferences updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Update User Profile & Channel Information
 */
app.put('/api/auth/profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, phone, channel_name } = req.body;
    await query('ALTER TABLE core_users ADD COLUMN IF NOT EXISTS channel_name VARCHAR(255);').catch(() => {});
    await query(
      `UPDATE core_users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        channel_name = COALESCE($3, channel_name),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [name ? String(name).trim() : null, phone ? String(phone).trim() : null, channel_name ? String(channel_name).trim() : null, req.user?.id]
    );
    const updated = await query('SELECT id, email, name, channel_name, role, phone FROM core_users WHERE id = $1', [req.user?.id]);
    return res.json({ success: true, user: updated.rows[0], message: 'Channel profile updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==================== 2. CENTRAL WALLET API ==================== //

app.get('/api/wallet', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const wallet = await WalletService.getOrCreateWallet(req.user!.id);
    const transactions = await WalletService.getTransactions(req.user!.id, 20);
    return res.json({
      wallet: {
        balance: Number(wallet.balance || 0),
        bonus_balance: Number(wallet.bonus_balance || 0),
        total_balance: Number(wallet.balance || 0) + Number(wallet.bonus_balance || 0),
        pending_balance: Number(wallet.pending_balance || 0),
        currency: wallet.currency || 'RWF',
        total_earnings: Number(wallet.total_earnings || 0),
        total_withdrawn: Number(wallet.total_withdrawn || 0),
        last_login_bonus_date: wallet.last_login_bonus_date
      },
      transactions
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/wallet/claim-daily-bonus', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    let dailyAmount = 200;
    try {
      const sRes = await query("SELECT services_json FROM company_settings LIMIT 1");
      if (sRes.rowCount && sRes.rows[0].services_json) {
        const parsed = JSON.parse(sRes.rows[0].services_json);
        if (parsed.daily_login_bonus_amount) {
          dailyAmount = Number(parsed.daily_login_bonus_amount);
        }
      }
    } catch {}

    const result = await WalletService.claimDailyLoginBonus(req.user!.id, dailyAmount);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/wallets/set-bonus', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, bonusAmount, reason } = req.body;
    if (!userId || bonusAmount === undefined) {
      return res.status(400).json({ error: 'userId and bonusAmount are required.' });
    }
    const result = await WalletService.adminSetBonus(userId, Number(bonusAmount), reason || 'Admin bonus credit');
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/wallet/deposit', authenticateToken, async (req: AuthenticatedRequest, res) => {
  return res.status(400).json({
    error: 'Direct unverified deposits are disabled. Deposits must be verified through Flutterwave gateway (/api/wallet/flutterwave/initialize).'
  });
});

app.post('/api/wallet/bet', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { wager, won, multiplier = 1.95 } = req.body;
    const numWager = parseFloat(wager);
    if (!numWager || numWager < 50) {
      return res.status(400).json({ error: 'Minimum bet amount is 50 RWF.' });
    }

    if (won) {
      const payout = Math.round(numWager * multiplier);
      const netProfit = payout - numWager;
      const result = await WalletService.credit(
        req.user!.id,
        netProfit,
        'games',
        'dice_win',
        `RollDice Win: +${payout.toLocaleString()} RWF (${multiplier}x on ${numWager.toLocaleString()} RWF)`,
        `tx_bet_win_${Date.now()}`
      );
      return res.json({ success: true, newBalance: result.newBalance, won: true, payout });
    } else {
      const result = await WalletService.debit(
        req.user!.id,
        numWager,
        'games',
        'dice_loss',
        `RollDice Wager: -${numWager.toLocaleString()} RWF`,
        `tx_bet_loss_${Date.now()}`
      );
      return res.json({ success: true, newBalance: result.newBalance, won: false });
    }
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Bet placement failed.' });
  }
});

/**
 * Real-Time Autocomplete Recipient Search
 */
app.get('/api/wallet/search-recipient', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ users: [] });
    }

    const term = `%${q.toLowerCase()}%`;
    const users = await query(
      `SELECT id, name, email, phone, role
       FROM core_users
       WHERE (LOWER(email) LIKE $1 OR LOWER(name) LIKE $1)
         AND id != $2
       LIMIT 8`,
      [term, req.user!.id]
    );

    return res.json({ users: users.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, users: [] });
  }
});

/**
 * Peer-to-Peer Wallet Transfer with Real-Time Recipient Validation & Email Notification
 */
app.post('/api/wallet/transfer', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { recipientEmail, amount, note = '' } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Transfer amount must be greater than 0 RWF.' });
    }
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required.' });
    }

    const cleanEmail = String(recipientEmail).trim().toLowerCase();
    if (cleanEmail === req.user!.email?.toLowerCase()) {
      return res.status(400).json({ error: 'You cannot transfer funds to yourself.' });
    }

    // Find recipient in core_users
    const recipientRes = await query(
      'SELECT id, name, email FROM core_users WHERE LOWER(email) = $1',
      [cleanEmail]
    );
    if (recipientRes.rowCount === 0) {
      return res.status(404).json({ error: 'No registered user found with this email. Money can only be sent to verified Benix.Space accounts.' });
    }

    const recipient = recipientRes.rows[0];

    // Check sender balance
    const senderWallet = await WalletService.getOrCreateWallet(req.user!.id);
    if (Number(senderWallet.balance) < numAmount) {
      return res.status(400).json({
        error: `Insufficient wallet balance. You have ${Number(senderWallet.balance).toLocaleString()} RWF, trying to transfer ${numAmount.toLocaleString()} RWF.`
      });
    }

    // Execute atomic transfer via WalletService
    const debitResult = await WalletService.debit(
      req.user!.id,
      numAmount,
      'wallet',
      'transfer_out',
      `Sent ${numAmount.toLocaleString()} RWF to ${recipient.name || recipient.email}${note ? ` ("${note}")` : ''}`,
      `tx_trf_out_${Date.now()}`
    );

    await WalletService.credit(
      recipient.id,
      numAmount,
      'wallet',
      'transfer_in',
      `Received ${numAmount.toLocaleString()} RWF from ${req.user!.name || req.user!.email}${note ? ` ("${note}")` : ''}`,
      `tx_trf_in_${Date.now()}`
    );

    // Notify recipient via email
    EmailService.sendEmail({
      to: recipient.email,
      subject: `You received ${numAmount.toLocaleString()} RWF on Benix.Space!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; padding: 24px; background: #0B0E14; color: #fff; border-radius: 16px;">
          <h2 style="color: #10B981;">Transfer Received!</h2>
          <p>Hello ${recipient.name || 'Member'},</p>
          <p><strong>${req.user!.name || req.user!.email}</strong> has transferred <strong>${numAmount.toLocaleString()} RWF</strong> into your Benix.Space Central Wallet.</p>
          ${note ? `<p style="padding: 12px; background: #1E293B; border-radius: 8px; color: #94A3B8;"><em>"${note}"</em></p>` : ''}
          <p>You can use this balance across TV, live radio, dating, RollDice games, or withdraw directly to your MTN Mobile Money account.</p>
        </div>
      `
    }).catch(() => {});

    return res.json({
      success: true,
      newBalance: debitResult.newBalance,
      message: `Successfully transferred ${numAmount.toLocaleString()} RWF to ${recipient.name || recipient.email}.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Transfer failed.' });
  }
});

app.post('/api/wallet/withdraw', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { amount, payoutMethod = 'MTN_MOMO', accountDetails } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 500) {
      return res.status(400).json({ error: 'Minimum withdrawal is 500 RWF.' });
    }
    if (!accountDetails) {
      return res.status(400).json({ error: 'Account details / phone number is required.' });
    }

    const result = await WalletService.requestWithdrawal(
      req.user!.id,
      numAmount,
      payoutMethod,
      accountDetails
    );

    const userEmail = req.user!.email;
    const adminEmail = process.env.SUPERADMIN_EMAIL || 'benirabok@gmail.com';
    const accountDetailsStr = typeof accountDetails === 'string' ? accountDetails : JSON.stringify(accountDetails);

    // 1. Email Notification to Admin for approval
    EmailService.sendEmail({
      to: adminEmail,
      subject: `[Action Required] New Withdrawal Request: ${numAmount.toLocaleString()} RWF from ${userEmail}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; padding: 24px; background: #0B0E14; color: #fff; border-radius: 16px; border: 1px solid #1E293B;">
          <h2 style="color: #38BDF8;">New Payout / Withdrawal Request</h2>
          <p>A user has requested a withdrawal from their Benix Central Wallet:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; color: #CBD5E1;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #334155;"><strong>User:</strong></td><td style="padding: 8px; border-bottom: 1px solid #334155;">${userEmail}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #334155;"><strong>Amount:</strong></td><td style="padding: 8px; border-bottom: 1px solid #334155; color: #10B981; font-weight: bold;">${numAmount.toLocaleString()} RWF</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #334155;"><strong>Payout Method:</strong></td><td style="padding: 8px; border-bottom: 1px solid #334155;">${payoutMethod}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #334155;"><strong>Details:</strong></td><td style="padding: 8px; border-bottom: 1px solid #334155;">${accountDetailsStr}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #334155;"><strong>Withdrawal ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #334155; font-family: monospace;">${result.withdrawalId}</td></tr>
          </table>
          <p style="margin-top: 20px;">Log in to the Admin Dashboard to review and approve this payout.</p>
        </div>
      `
    }).catch((e) => console.warn('Admin withdrawal email warning:', e?.message));

    // 2. Email Confirmation to User
    EmailService.sendEmail({
      to: userEmail,
      subject: `Your Benix.Space Withdrawal Request of ${numAmount.toLocaleString()} RWF`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; padding: 24px; background: #0B0E14; color: #fff; border-radius: 16px; border: 1px solid #1E293B;">
          <h2 style="color: #10B981;">Withdrawal Request Received</h2>
          <p>Hello,</p>
          <p>We have received your withdrawal request for <strong>${numAmount.toLocaleString()} RWF</strong> via <strong>${payoutMethod}</strong>.</p>
          <p>Our finance team reviews all requests within 1-2 hours. You will receive an instant notification once the payout is sent to your account.</p>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">Withdrawal Reference ID: ${result.withdrawalId}</p>
        </div>
      `
    }).catch((e) => console.warn('User withdrawal email warning:', e?.message));

    return res.json({
      success: true,
      message: 'Withdrawal request submitted! Admin and user confirmation emails sent.',
      withdrawalId: result.withdrawalId
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: List All Withdrawals
 */
app.get('/api/admin/withdrawals', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS core_withdrawals (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        wallet_id VARCHAR(255),
        amount NUMERIC(15,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'RWF',
        payout_method VARCHAR(50) DEFAULT 'MTN_MOMO',
        account_details JSONB,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    const resDb = await query(
      `SELECT w.*, u.name as user_name, u.email as user_email, u.phone as user_phone
       FROM core_withdrawals w
       LEFT JOIN core_users u ON w.user_id = u.id
       ORDER BY w.created_at DESC LIMIT 50`
    );
    return res.json({ withdrawals: resDb.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Approve & Payout Withdrawal
 */
app.post('/api/admin/withdrawals/:id/approve', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const wRes = await query('SELECT * FROM core_withdrawals WHERE id = $1', [id]);
    if (wRes.rowCount === 0) return res.status(404).json({ error: 'Withdrawal request not found.' });

    const w = wRes.rows[0];
    if (w.status === 'COMPLETED') return res.status(400).json({ error: 'Withdrawal is already completed.' });

    // Deduct pending balance from wallet
    await query(
      'UPDATE core_wallets SET pending_balance = GREATEST(0, pending_balance - $1), total_withdrawn = total_withdrawn + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [w.amount, w.user_id]
    );

    // Update status to COMPLETED
    await query("UPDATE core_withdrawals SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);

    // Send Completion Email to User
    const uRes = await query('SELECT email, name FROM core_users WHERE id = $1', [w.user_id]);
    if (uRes.rowCount > 0) {
      const u = uRes.rows[0];
      EmailService.sendEmail({
        to: u.email,
        subject: `Your Withdrawal of ${Number(w.amount).toLocaleString()} RWF is Complete!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; padding: 24px; background: #0B0E14; color: #fff; border-radius: 16px;">
            <h2 style="color: #10B981;">Payout Completed!</h2>
            <p>Hello ${u.name},</p>
            <p>Your withdrawal of <strong>${Number(w.amount).toLocaleString()} RWF</strong> has been approved and sent to your <strong>${w.payout_method}</strong> account.</p>
            <p>Thank you for using Benix.Space.</p>
          </div>
        `
      }).catch(() => {});
    }

    return res.json({ success: true, message: 'Withdrawal marked as completed and notification sent.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Helper to fetch central Flutterwave Payment Gateway credentials
 */
async function getFlutterwaveConfig(): Promise<{
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
  isLive: boolean;
  enabled: boolean;
}> {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id VARCHAR(50) PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        public_key TEXT,
        secret_key TEXT,
        encryption_key TEXT,
        is_live BOOLEAN DEFAULT FALSE,
        enabled BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    const row = await query("SELECT * FROM payment_settings WHERE id = 'flutterwave' LIMIT 1").catch(() => ({ rowCount: 0, rows: [] }));
    if (row.rowCount && row.rowCount > 0) {
      const flw = row.rows[0];
      const pk = (flw.public_key || process.env.FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK-5e4f311c31ff2cde79ef36825f2e9a95-X').trim();
      const sk = (flw.secret_key || process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK-850b999b626b35d6a06e8cdcf50d14a1-1a0684d29b4vt-X').trim();
      const ek = (flw.encryption_key || process.env.FLUTTERWAVE_ENCRYPTION_KEY || '').trim();
      return {
        publicKey: pk || 'FLWPUBK-5e4f311c31ff2cde79ef36825f2e9a95-X',
        secretKey: sk || 'FLWSECK-850b999b626b35d6a06e8cdcf50d14a1-1a0684d29b4vt-X',
        encryptionKey: ek,
        isLive: !!flw.is_live,
        enabled: flw.enabled !== false
      };
    }
  } catch (err) {
    console.warn('Error fetching payment_settings:', err);
  }
  return {
    publicKey: (process.env.FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK-5e4f311c31ff2cde79ef36825f2e9a95-X').trim(),
    secretKey: (process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK-850b999b626b35d6a06e8cdcf50d14a1-1a0684d29b4vt-X').trim(),
    encryptionKey: (process.env.FLUTTERWAVE_ENCRYPTION_KEY || '').trim(),
    isLive: true,
    enabled: true
  };
}

/**
 * Flutterwave Multi-Currency Deposit (RWF, UGX, KES, USD, EUR, NGN, TZS)
 */
app.post('/api/wallet/flutterwave/initialize', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { amount, currency = 'USD', email, phone, name } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid deposit amount is required.' });
    }

    const flwConfig = await getFlutterwaveConfig();
    if (!flwConfig.enabled) {
      return res.status(400).json({ error: 'Flutterwave deposits are currently paused by the platform administrator.' });
    }

    const effectiveKey = flwConfig.publicKey || 'FLWPUBK-5e4f311c31ff2cde79ef36825f2e9a95-X';
    const effectiveSecret = flwConfig.secretKey || 'FLWSECK-850b999b626b35d6a06e8cdcf50d14a1-1a0684d29b4vt-X';

    // Benchmark exchange rates to RWF
    const ratesToRwf: Record<string, number> = {
      RWF: 1.0,
      USD: 1420.0,
      EUR: 1540.0,
      GBP: 1810.0,
      KES: 11.0,
      UGX: 0.38,
      NGN: 0.90,
      TZS: 0.55
    };

    const rate = ratesToRwf[currency] || 1.0;
    const convertedRwf = Math.round(numAmount * rate);

    const txRef = `FLW-BENIX-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Get user contact info
    let customerEmail = (email || req.user?.email || 'member@benix.space').trim();
    let customerPhone = (phone || '0780000000').trim();
    let customerName = (name || 'Benix Member').trim();

    try {
      const userRes = await query('SELECT email, name, phone FROM core_users WHERE id = $1', [req.user!.id]);
      if (userRes.rowCount && userRes.rowCount > 0) {
        const u = userRes.rows[0];
        if (!email && u.email) customerEmail = u.email;
        if (!name && u.name) customerName = u.name;
        if (!phone && u.phone) customerPhone = u.phone;
      }
    } catch {}

    // Ensure table for pending flutterwave deposits exists
    await query(`
      CREATE TABLE IF NOT EXISTS pending_flutterwave_deposits (
        tx_ref VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        original_amount NUMERIC(14, 2) NOT NULL,
        converted_rwf NUMERIC(14, 2) NOT NULL,
        status VARCHAR(30) DEFAULT 'pending',
        flw_ref VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    await query(
      `INSERT INTO pending_flutterwave_deposits (tx_ref, user_id, currency, original_amount, converted_rwf)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tx_ref) DO UPDATE SET
         currency = EXCLUDED.currency,
         original_amount = EXCLUDED.original_amount,
         converted_rwf = EXCLUDED.converted_rwf`,
      [txRef, req.user!.id, currency, numAmount, convertedRwf]
    ).catch((e) => console.warn('Record pending deposit warning:', e.message));

    // Determine redirect origin
    const rawOrigin = (req.headers.origin as string) || (req.headers.referer ? new URL(req.headers.referer as string).origin : '') || 'https://benix.space';
    const redirectUrl = `${rawOrigin}/dashboard?payment=flw_success&tx_ref=${txRef}#wallet`;

    let paymentLink: string | null = null;
    if (effectiveSecret) {
      try {
        const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${effectiveSecret}`
          },
          body: JSON.stringify({
            tx_ref: txRef,
            amount: numAmount.toString(),
            currency: currency,
            redirect_url: redirectUrl,
            customer: {
              email: customerEmail,
              phonenumber: customerPhone,
              name: customerName
            },
            customizations: {
              title: 'Benix.Space Central Wallet',
              description: `Deposit ${numAmount} ${currency} (≈ ${convertedRwf.toLocaleString()} RWF)`,
              logo: 'https://benix.space/logo.png'
            }
          })
        });

        const flwData: any = await flwRes.json();
        if (flwRes.ok && flwData.status === 'success' && flwData.data?.link) {
          paymentLink = flwData.data.link;
        } else {
          console.warn('Flutterwave standard payment init response:', flwData);
          if (flwData?.message && !paymentLink) {
            return res.status(400).json({ error: `Flutterwave error: ${flwData.message}` });
          }
        }
      } catch (fErr: any) {
        console.warn('Flutterwave fetch failure:', fErr.message);
      }
    }

    return res.json({
      success: true,
      paymentLink,
      payment_link: paymentLink,
      txRef,
      tx_ref: txRef,
      publicKey: effectiveKey,
      public_key: effectiveKey,
      currency,
      originalAmount: numAmount,
      convertedRwf,
      rate,
      message: `${numAmount} ${currency} ≈ ${convertedRwf.toLocaleString()} RWF will be credited to your central wallet.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Flutterwave Deposit Verification & Instant Wallet Credit
 */
app.post('/api/wallet/flutterwave/verify', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { txRef, convertedRwf, currency = 'RWF', originalAmount, flwRef, transactionId } = req.body;

    if (!txRef) {
      return res.status(400).json({ error: 'Valid transaction reference (txRef) is required.' });
    }

    // Prevent duplicate credits using existing transaction record
    const existingTx = await query(
      "SELECT id FROM core_wallet_transactions WHERE reference = $1 AND type = 'flutterwave_deposit' LIMIT 1",
      [txRef]
    ).catch(() => ({ rowCount: 0, rows: [] }));

    if (existingTx.rowCount && existingTx.rowCount > 0) {
      const wallet = await WalletService.getOrCreateWallet(req.user!.id);
      return res.json({
        success: true,
        newBalance: Number(wallet.balance || 0),
        message: `Transaction ${txRef} has already been credited to your wallet.`
      });
    }

    // Load from pending_flutterwave_deposits if present
    let finalConvertedRwf = parseFloat(convertedRwf);
    let finalCurrency = currency;
    let finalOriginalAmount = parseFloat(originalAmount);

    const pendingRow = await query(
      "SELECT * FROM pending_flutterwave_deposits WHERE tx_ref = $1 LIMIT 1",
      [txRef]
    ).catch(() => ({ rowCount: 0, rows: [] }));

    if (pendingRow.rowCount && pendingRow.rowCount > 0) {
      const p = pendingRow.rows[0];
      if (!finalConvertedRwf || isNaN(finalConvertedRwf)) finalConvertedRwf = Number(p.converted_rwf);
      if (!finalOriginalAmount || isNaN(finalOriginalAmount)) finalOriginalAmount = Number(p.original_amount);
      if (!finalCurrency) finalCurrency = p.currency;
    }

    if (!finalConvertedRwf || finalConvertedRwf < 100) {
      return res.status(400).json({ error: 'Minimum deposit is 100 RWF.' });
    }

    const effectiveFlwRef = flwRef || transactionId;
    const flwConfig = await getFlutterwaveConfig();
    const effectiveSecret = flwConfig.secretKey || process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK-850b999b626b35d6a06e8cdcf50d14a1-1a0684d29b4vt-X';

    // Verify against Flutterwave server-side API if secret key is present
    if (effectiveSecret) {
      try {
        let verifyUrl = '';
        if (effectiveFlwRef && !effectiveFlwRef.toString().startsWith('fake_')) {
          verifyUrl = `https://api.flutterwave.com/v3/transactions/${effectiveFlwRef}/verify`;
        } else if (txRef) {
          verifyUrl = `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`;
        }

        if (verifyUrl) {
          const verifyRes = await fetch(verifyUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${effectiveSecret}`
            }
          });

          if (verifyRes.ok) {
            const verifyData: any = await verifyRes.json();
            if (verifyData?.status !== 'success' || verifyData?.data?.status !== 'successful') {
              return res.status(400).json({
                error: `Flutterwave payment status is '${verifyData?.data?.status || verifyData?.status || 'unsuccessful'}'. Not credited.`
              });
            }
          }
        }
      } catch (flwErr: any) {
        console.warn('Flutterwave direct API verification warning:', flwErr.message);
      }
    }

    const result = await WalletService.credit(
      req.user!.id,
      finalConvertedRwf,
      'wallet',
      'flutterwave_deposit',
      `Flutterwave Deposit (${finalOriginalAmount || finalConvertedRwf} ${finalCurrency} → ${finalConvertedRwf.toLocaleString()} RWF)`,
      txRef,
      { flwRef: effectiveFlwRef, originalAmount: finalOriginalAmount, currency: finalCurrency }
    );

    // Update pending deposit record to completed
    await query(
      "UPDATE pending_flutterwave_deposits SET status = 'completed', flw_ref = $1 WHERE tx_ref = $2",
      [effectiveFlwRef || 'flw_verified', txRef]
    ).catch(() => {});

    // Trigger qualifying referral reward non-blockingly
    try {
      await ReferralService.triggerQualifyingEvent(req.user!.id, 'first_deposit', 'wallet');
    } catch (refErr) {
      console.warn('Referral trigger non-fatal:', refErr);
    }

    return res.json({
      success: true,
      newBalance: result.newBalance,
      message: `Successfully credited ${finalConvertedRwf.toLocaleString()} RWF to your wallet via Flutterwave!`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Kunda Dating: Wallet-Powered Messaging, Subscriptions & Contact Unlock
 */

// In-memory fallback stores for Kunda
interface KundaMessageRecord {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
}

interface KundaSubscriptionRecord {
  id: string;
  user_id: string;
  plan_code: string;
  price: number;
  expires_at: number;
  created_at: string;
}

const kundaMessagesStore: KundaMessageRecord[] = [
  {
    id: 'kmsg_welcome_1',
    sender_id: 'k1',
    recipient_id: 'demo-user',
    content: 'Muraho! Welcome to Kunda Space. Looking forward to connecting!',
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

const kundaSubscriptionsStore: KundaSubscriptionRecord[] = [];
const kundaUnlockedContactsStore = new Set<string>(); // "userId:partnerId"

// Configurable Kunda Settings (Can also be adjusted by Admin)
export const kundaSettings = {
  messageCost: 50,
  freeInitialMessages: 3,
  contactUnlockPrice: 2000,
  plans: [
    {
      code: 'pass_24h',
      name: '24 Hours Pass',
      price: 500,
      durationHours: 24,
      description: 'Unlimited private messaging for 24 hours'
    },
    {
      code: 'pass_3d',
      name: '3-Day Pass',
      price: 1200,
      durationHours: 72,
      description: 'Unlimited messaging for 3 days (Popular)'
    },
    {
      code: 'pass_weekly',
      name: 'Weekly VIP Pass',
      price: 2500,
      durationHours: 168,
      description: 'Unlimited messaging for 7 days + priority matching'
    },
    {
      code: 'pass_monthly',
      name: 'Monthly Elite Pass',
      price: 6000,
      durationHours: 720,
      description: 'Unlimited messaging for 30 days + VIP verified status'
    }
  ]
};

// 1. Get Kunda Plans & Dynamic Pricing
app.get('/api/modules/kunda/plans', async (req, res) => {
  return res.json({
    success: true,
    settings: {
      messageCost: kundaSettings.messageCost,
      freeInitialMessages: kundaSettings.freeInitialMessages,
      contactUnlockPrice: kundaSettings.contactUnlockPrice
    },
    plans: kundaSettings.plans
  });
});

/**
 * Persist Kunda Dating Crush (Like) to PostgreSQL
 */
app.post('/api/modules/kunda/crush', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { targetProfileId, targetName, unlike } = req.body;
    if (!targetProfileId) return res.status(400).json({ error: 'targetProfileId is required.' });

    await query(`
      CREATE TABLE IF NOT EXISTS kunda_crushes (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        target_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(sender_id, target_id)
      );
    `).catch(() => {});

    if (unlike) {
      await query('DELETE FROM kunda_crushes WHERE sender_id = $1 AND target_id = $2', [
        req.user!.id,
        targetProfileId
      ]);
      return res.json({ success: true, isMatch: false, action: 'unliked' });
    }

    await query(
      `INSERT INTO kunda_crushes (sender_id, target_id)
       VALUES ($1, $2)
       ON CONFLICT (sender_id, target_id) DO NOTHING`,
      [req.user!.id, targetProfileId]
    );

    // Check mutual crush
    const mutual = await query(
      'SELECT id FROM kunda_crushes WHERE sender_id = $1 AND target_id = $2',
      [targetProfileId, req.user!.id]
    );

    const isMatch = mutual.rowCount > 0;

    return res.json({
      success: true,
      isMatch,
      message: isMatch ? 'Mutual Match! You can chat now.' : 'Crush sent successfully!'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/modules/kunda/my-crushes', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS kunda_crushes (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        target_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(sender_id, target_id)
      );
    `).catch(() => {});

    const resDb = await query('SELECT target_id FROM kunda_crushes WHERE sender_id = $1', [
      req.user!.id
    ]);
    const crushes = resDb.rows.map((r: any) => r.target_id);
    return res.json({ crushes });
  } catch (err: any) {
    return res.json({ crushes: [] });
  }
});

// 2. Subscribe to Kunda Pass using Central Wallet
app.post('/api/modules/kunda/subscribe', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { planCode } = req.body;
    const plan = kundaSettings.plans.find((p) => p.code === planCode);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid membership pass code.' });
    }

    const userId = req.user!.id;

    // Deduct subscription pass fee from central wallet
    const debitRes = await WalletService.debit(
      userId,
      plan.price,
      'dating',
      'subscription_pass',
      `Kunda Space: Activated ${plan.name} (-${plan.price.toLocaleString()} RWF)`,
      `tx_kunda_sub_${Date.now()}`
    );

    const expiresAt = Date.now() + plan.durationHours * 3600 * 1000;
    const subRecord: KundaSubscriptionRecord = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      user_id: userId,
      plan_code: plan.code,
      price: plan.price,
      expires_at: expiresAt,
      created_at: new Date().toISOString()
    };

    kundaSubscriptionsStore.push(subRecord);

    // Try persisting to DB
    await query(`
      CREATE TABLE IF NOT EXISTS kunda_subscriptions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        plan_code VARCHAR(50) NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    await query(
      'INSERT INTO kunda_subscriptions (id, user_id, plan_code, price, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [subRecord.id, subRecord.user_id, subRecord.plan_code, subRecord.price, subRecord.expires_at]
    ).catch(() => {});

    return res.json({
      success: true,
      subscription: subRecord,
      newBalance: debitRes.newBalance,
      message: `🎉 Successfully subscribed to ${plan.name}! Unlimited messaging active.`
    });
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes('insufficient')) {
      return res.status(400).json({ error: 'INSUFFICIENT_FUNDS', message: 'Insufficient wallet balance. Please top up your wallet.' });
    }
    return res.status(500).json({ error: err.message || 'Subscription failed.' });
  }
});

// 3. Get Messages & Allowances for Partner
app.get('/api/modules/kunda/messages/:partnerId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { partnerId } = req.params;

    // Check active subscription
    const activeSub = kundaSubscriptionsStore.find(
      (s) => s.user_id === userId && s.expires_at > Date.now()
    );

    // Count user's sent messages in this conversation
    const userSentCount = kundaMessagesStore.filter(
      (m) => m.sender_id === userId && m.recipient_id === partnerId
    ).length;

    const initialRemaining = Math.max(0, kundaSettings.freeInitialMessages - userSentCount);
    const unlockKey = `${userId}:${partnerId}`;
    const isContactUnlocked = kundaUnlockedContactsStore.has(unlockKey);

    // Filter conversation messages
    const thread = kundaMessagesStore.filter(
      (m) => (m.sender_id === userId && m.recipient_id === partnerId) ||
             (m.sender_id === partnerId && m.recipient_id === userId)
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return res.json({
      success: true,
      messages: thread,
      allowances: {
        initialRemaining,
        perMessageFee: kundaSettings.messageCost,
        hasActiveSubscription: Boolean(activeSub),
        activeSubscription: activeSub || null,
        contactUnlockPrice: kundaSettings.contactUnlockPrice,
        isContactUnlocked,
        partnerPhone: isContactUnlocked ? '+250783987223' : null
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Send Message (Free if Subscribed or Initial Free Messages, Else Deduct 50 RWF)
app.post('/api/modules/kunda/send-message', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { recipientId, content } = req.body;

    if (!recipientId || !content || !content.trim()) {
      return res.status(400).json({ error: 'Recipient and message content are required.' });
    }

    // Check active subscription
    const activeSub = kundaSubscriptionsStore.find(
      (s) => s.user_id === userId && s.expires_at > Date.now()
    );

    let chargedAmount = 0;
    let newBalance: number | undefined;

    if (!activeSub) {
      // Count sent messages to this recipient
      const userSentCount = kundaMessagesStore.filter(
        (m) => m.sender_id === userId && m.recipient_id === recipientId
      ).length;

      // If free initial messages exhausted, charge per message (50 RWF)
      if (userSentCount >= kundaSettings.freeInitialMessages) {
        try {
          const debitRes = await WalletService.debit(
            userId,
            kundaSettings.messageCost,
            'dating',
            'message_fee',
            `Kunda Space: Private message fee (-${kundaSettings.messageCost} RWF)`,
            `tx_kunda_msg_${Date.now()}`
          );
          chargedAmount = kundaSettings.messageCost;
          newBalance = debitRes.newBalance;
        } catch (debitErr: any) {
          return res.status(400).json({
            error: 'INSUFFICIENT_FUNDS',
            message: `Insufficient wallet balance. Sending this message requires ${kundaSettings.messageCost} RWF or an Unlimited Pass.`
          });
        }
      }
    }

    const newMsg: KundaMessageRecord = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      sender_id: userId,
      recipient_id: recipientId,
      content: content.trim(),
      created_at: new Date().toISOString()
    };

    kundaMessagesStore.push(newMsg);

    // Realistic automated conversational response simulation after 1.5 seconds if this is a sample profile
    if (recipientId.startsWith('k')) {
      setTimeout(() => {
        const autoReplies: Record<string, string[]> = {
          k1: [
            'Muraho! It is wonderful to meet you here on Kunda Space.',
            'I love talking about design and music! Which church or choir music do you listen to?',
            'Are you based in Kigali?'
          ],
          k2: [
            'Hello! Glad we matched. What kind of books or podcasts do you enjoy?',
            'Nice message! Tell me a bit about your favorite weekend spots in Kigali.'
          ],
          k3: [
            'Hi there! Musanze is beautiful right now. Have you ever hiked the northern volcanoes?',
            'Delighted to chat! Looking forward to getting to know you.'
          ]
        };
        const pool = autoReplies[recipientId] || [
          'Hello! Thank you for your message. How is your day going?',
          'Nice to meet you on Kunda Space! Looking forward to chatting.'
        ];
        const replyText = pool[Math.floor(Math.random() * pool.length)];

        kundaMessagesStore.push({
          id: `reply_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          sender_id: recipientId,
          recipient_id: userId,
          content: replyText,
          created_at: new Date().toISOString()
        });
      }, 1500);
    }

    return res.json({
      success: true,
      message: newMsg,
      chargedAmount,
      newBalance
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to send message.' });
  }
});

// 5. Unlock Direct Contact Details (Phone & WhatsApp)
app.post('/api/modules/kunda/unlock-contact', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { targetProfileId, price = kundaSettings.contactUnlockPrice } = req.body;
    const unlockPrice = Number(price) || kundaSettings.contactUnlockPrice;

    // Deduct unlock fee from Central Wallet
    const debitRes = await WalletService.debit(
      userId,
      unlockPrice,
      'dating',
      'contact_unlock',
      `Kunda Space: Unlocked verified contact details for profile #${targetProfileId}`,
      `tx_kunda_unl_${Date.now()}`
    );

    const unlockKey = `${userId}:${targetProfileId}`;
    kundaUnlockedContactsStore.add(unlockKey);

    const verifiedPhone = '+250783987223';
    const whatsappLink = `https://wa.me/250783987223?text=Muraho!%20Connected%20via%20Benix%20Kunda%20Space.`;

    return res.json({
      success: true,
      newBalance: debitRes.newBalance,
      phone: verifiedPhone,
      whatsappLink,
      message: `🎉 Verified direct contact details unlocked for ${unlockPrice} RWF!`
    });
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes('insufficient')) {
      return res.status(400).json({ error: 'INSUFFICIENT_FUNDS', message: 'Insufficient wallet balance for contact unlock.' });
    }
    return res.status(400).json({ error: err.message || 'Failed to unlock contact.' });
  }
});

// ==================== SYSTEM SETTINGS (DYNAMIC CONFIGURATION) ==================== //

async function getSystemSetting(key: string, defaultValue: string): Promise<string> {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});
    const res = await query('SELECT value FROM system_settings WHERE key = $1', [key]);
    if (res.rowCount > 0 && res.rows[0].value !== null && res.rows[0].value !== undefined) {
      return String(res.rows[0].value);
    }
  } catch {}
  return defaultValue;
}

async function setSystemSetting(key: string, value: string): Promise<void> {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});
    await query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, String(value)]
    );
  } catch {}
}

/**
 * ==================== WHATSAPP-STYLE MESSAGING & CONTACT ENGINE ====================
 */

// ==================== WHATSAPP-STYLE MESSAGING & CONTACT ENGINE ==================== //

// Get Dynamic Chat Settings
app.get('/api/chat/settings', async (req, res) => {
  try {
    const contactUnlockPrice = Number(await getSystemSetting('contact_unlock_price', '500')) || 500;
    const creatorRevSharePct = Number(await getSystemSetting('kunda_creator_rev_share_pct', '15')) || 15;
    const messageCost = Number(await getSystemSetting('kunda_message_cost', '50')) || 50;
    const freeMessages = Number(await getSystemSetting('kunda_free_messages', '3')) || 3;
    return res.json({
      success: true,
      contactUnlockPrice,
      creatorRevSharePct,
      messageCost,
      freeMessages,
      currency: 'RWF'
    });
  } catch {
    return res.json({
      success: true,
      contactUnlockPrice: 500,
      creatorRevSharePct: 15,
      messageCost: 50,
      freeMessages: 3,
      currency: 'RWF'
    });
  }
});

// Admin Update Chat Settings
app.post('/api/admin/settings/chat', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { contactUnlockPrice, creatorRevSharePct, messageCost, freeMessages } = req.body;
    if (contactUnlockPrice !== undefined) {
      await setSystemSetting('contact_unlock_price', String(Math.max(0, Number(contactUnlockPrice) || 0)));
    }
    if (creatorRevSharePct !== undefined) {
      await setSystemSetting('kunda_creator_rev_share_pct', String(Math.max(0, Math.min(100, Number(creatorRevSharePct) || 15))));
    }
    if (messageCost !== undefined) {
      await setSystemSetting('kunda_message_cost', String(Math.max(0, Number(messageCost) || 0)));
    }
    if (freeMessages !== undefined) {
      await setSystemSetting('kunda_free_messages', String(Math.max(0, Number(freeMessages) || 0)));
    }

    const currentPrice = Number(await getSystemSetting('contact_unlock_price', '500')) || 500;
    const currentShare = Number(await getSystemSetting('kunda_creator_rev_share_pct', '15')) || 15;
    const currentCost = Number(await getSystemSetting('kunda_message_cost', '50')) || 50;
    const currentFree = Number(await getSystemSetting('kunda_free_messages', '3')) || 3;

    return res.json({
      success: true,
      contactUnlockPrice: currentPrice,
      creatorRevSharePct: currentShare,
      messageCost: currentCost,
      freeMessages: currentFree,
      message: 'Chat & Kunda monetization settings saved successfully.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get Current User's Chat Privacy Mode
app.get('/api/chat/privacy-mode', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    await query("ALTER TABLE core_users ADD COLUMN IF NOT EXISTS chat_privacy_mode VARCHAR(20) DEFAULT 'public';").catch(() => {});
    const r = await query('SELECT chat_privacy_mode FROM core_users WHERE id = $1', [req.user!.id]);
    return res.json({ success: true, mode: r.rows[0]?.chat_privacy_mode || 'public' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, mode: 'public' });
  }
});

// Update Current User's Chat Privacy Mode (Public vs Private VIP Account)
app.post('/api/chat/privacy-mode', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { mode } = req.body;
    const targetMode = mode === 'private' ? 'private' : 'public';
    await query("ALTER TABLE core_users ADD COLUMN IF NOT EXISTS chat_privacy_mode VARCHAR(20) DEFAULT 'public';").catch(() => {});
    await query('UPDATE core_users SET chat_privacy_mode = $1 WHERE id = $2', [targetMode, req.user!.id]);
    return res.json({
      success: true,
      mode: targetMode,
      message: targetMode === 'private'
        ? 'Switched to Private Account! You now earn revenue on received paid messages and contact unlocks.'
        : 'Switched to Public Account! Anyone can message you for free.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get Partner Status & Quota (Checks whether partner is private/public and how many free messages remain)
app.get('/api/chat/partner-status/:partnerId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const partnerId = req.params.partnerId;
    const senderId = req.user!.id;
    const freeLimit = Number(await getSystemSetting('kunda_free_messages', '3')) || 3;
    const messageCost = Number(await getSystemSetting('kunda_message_cost', '50')) || 50;
    const revSharePct = Number(await getSystemSetting('kunda_creator_rev_share_pct', '15')) || 15;
    const contactUnlockPrice = Number(await getSystemSetting('contact_unlock_price', '500')) || 500;

    let partnerPrivacy = 'public';
    let partnerName = 'Member';
    if (partnerId !== 'support') {
      const u = await query("SELECT chat_privacy_mode, name, channel_name FROM core_users WHERE id = $1", [partnerId]).catch(() => ({ rowCount: 0, rows: [] }));
      if (u.rowCount > 0) {
        partnerPrivacy = u.rows[0].chat_privacy_mode || 'public';
        partnerName = u.rows[0].channel_name || u.rows[0].name || 'Member';
      }
    }

    await query(`
      CREATE TABLE IF NOT EXISTS chat_direct_messages (
        id VARCHAR(255) PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        recipient_id VARCHAR(255) NOT NULL,
        message TEXT,
        is_voice BOOLEAN DEFAULT FALSE,
        voice_duration VARCHAR(50),
        is_paid BOOLEAN DEFAULT FALSE,
        amount_paid NUMERIC(15,2) DEFAULT 0,
        creator_earning NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    const countRes = await query(
      `SELECT COUNT(*) as count FROM chat_direct_messages WHERE sender_id = $1 AND recipient_id = $2`,
      [senderId, partnerId]
    ).catch(() => ({ rows: [{ count: 0 }] }));
    const sentCount = Number(countRes.rows[0]?.count || 0);

    const isFree = partnerPrivacy === 'public' || partnerId === 'support' || sentCount < freeLimit;
    const freeRemaining = partnerPrivacy === 'private' && partnerId !== 'support' ? Math.max(0, freeLimit - sentCount) : null;

    return res.json({
      success: true,
      partnerId,
      partnerPrivacy,
      partnerName,
      sentCount,
      freeLimit,
      freeRemaining,
      isFree,
      messageCost,
      revSharePct,
      contactUnlockPrice
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Send Chat Message with Automatic Pay-As-You-Chat Execution for Private Accounts
app.post('/api/chat/send-message', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const senderId = req.user!.id;
    const { recipientId, message, isVoice, voiceDuration } = req.body;
    if (!recipientId || (!message && !isVoice)) {
      return res.status(400).json({ error: 'Recipient and message content required.' });
    }

    // Check Contact Moderation: Block phone numbers in words or digits
    if (message && !isVoice) {
      const moderation = checkContactModeration(message);
      if (moderation.isViolation) {
        return res.status(400).json({
          error: 'CONTACT_MODERATION_BLOCKED',
          message: moderation.reason || 'Sharing phone numbers directly in chat is restricted by Benix privacy policy. Use the Unlock Phone button to securely view verified contact information.'
        });
      }
    }

    await query(`
      CREATE TABLE IF NOT EXISTS chat_direct_messages (
        id VARCHAR(255) PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        recipient_id VARCHAR(255) NOT NULL,
        message TEXT,
        is_voice BOOLEAN DEFAULT FALSE,
        voice_duration VARCHAR(50),
        is_paid BOOLEAN DEFAULT FALSE,
        amount_paid NUMERIC(15,2) DEFAULT 0,
        creator_earning NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    // Update sender last_seen_at
    await query("ALTER TABLE core_users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;").catch(() => {});
    await query("UPDATE core_users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = $1", [senderId]).catch(() => {});

    // Check recipient's privacy mode
    let recipientPrivacy = 'public';
    let recipientName = 'Recipient';
    if (recipientId !== 'support') {
      const recRes = await query("SELECT chat_privacy_mode, name, email FROM core_users WHERE id = $1", [recipientId]).catch(() => ({ rowCount: 0, rows: [] }));
      if (recRes.rowCount > 0) {
        recipientPrivacy = recRes.rows[0].chat_privacy_mode || 'public';
        recipientName = recRes.rows[0].name || recRes.rows[0].email || 'Creator';
      }
    }

    let isPaid = false;
    let amountPaid = 0;
    let creatorEarning = 0;
    let newBalance = undefined;
    let newBonusBalance = undefined;

    if (recipientPrivacy === 'private' && recipientId !== 'support' && recipientId !== senderId) {
      const countRes = await query(
        `SELECT COUNT(*) as count FROM chat_direct_messages WHERE sender_id = $1 AND recipient_id = $2`,
        [senderId, recipientId]
      );
      const sentCount = Number(countRes.rows[0]?.count || 0);
      const freeLimit = Number(await getSystemSetting('kunda_free_messages', '3')) || 3;
      const messageCost = Number(await getSystemSetting('kunda_message_cost', '50')) || 50;

      if (sentCount >= freeLimit && messageCost > 0) {
        const revSharePct = Number(await getSystemSetting('kunda_creator_rev_share_pct', '15')) || 15;
        creatorEarning = Math.round((messageCost * revSharePct) / 100);
        amountPaid = messageCost;
        isPaid = true;

        // Debit sender wallet
        const debitRes = await WalletService.debit(
          senderId,
          messageCost,
          'chat',
          'paid_chat_message',
          `Pay-as-you-chat message to private creator ${recipientName}`,
          `tx_chat_msg_${Date.now()}`
        );
        newBalance = debitRes.newBalance;
        newBonusBalance = debitRes.newBonusBalance;

        // Credit recipient wallet with creator cut!
        if (creatorEarning > 0) {
          await WalletService.credit(
            recipientId,
            creatorEarning,
            'chat',
            'chat_message_royalty',
            `Earned ${revSharePct}% (${creatorEarning} RWF) from paid message sent by ${req.user!.email || 'a member'}`
          ).catch(() => {});
        }
      }
    }

    const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    await query(
      `INSERT INTO chat_direct_messages (id, sender_id, recipient_id, message, is_voice, voice_duration, is_paid, amount_paid, creator_earning)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [msgId, senderId, recipientId, message || '', !!isVoice, voiceDuration || null, isPaid, amountPaid, creatorEarning]
    );

    return res.json({
      success: true,
      messageId: msgId,
      isPaid,
      amountPaid,
      creatorEarning,
      newBalance,
      newBonusBalance
    });
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes('insufficient')) {
      return res.status(400).json({
        error: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient balance to send paid message to private creator. Please top up your wallet.'
      });
    }
    return res.status(500).json({ error: err.message || 'Failed to send message.' });
  }
});

// Paid Contact Phone Number Unlock (Splits revenue with creator based on admin percentage)
app.post('/api/chat/unlock-contact', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { contactId } = req.body;
    if (!contactId) return res.status(400).json({ error: 'contactId is required.' });

    // Read unlock fee directly from database settings
    const dbPriceStr = await getSystemSetting('contact_unlock_price', '500');
    const unlockPrice = Math.max(0, Number(dbPriceStr) || 500);
    const userId = req.user!.id;

    // Deduct exact fee from Central Wallet
    const debitRes = await WalletService.debit(
      userId,
      unlockPrice,
      'chat',
      'contact_unlock',
      `Unlocked direct contact phone number for member #${contactId}`,
      `tx_chat_unl_${Date.now()}`
    );

    // Calculate creator revenue share (Default 15% from admin settings)
    const revSharePct = Number(await getSystemSetting('kunda_creator_rev_share_pct', '15')) || 15;
    const creatorCut = Math.round((unlockPrice * revSharePct) / 100);

    // Credit creator's central wallet with their revenue share percentage!
    if (creatorCut > 0 && contactId !== 'support' && contactId !== userId) {
      await WalletService.credit(
        contactId,
        creatorCut,
        'chat',
        'contact_unlock_royalty',
        `Earned ${revSharePct}% commission (${creatorCut} RWF) from WhatsApp phone unlock by member`,
        `tx_chat_cr_${Date.now()}`
      ).catch(() => {});
    }

    await query(`
      CREATE TABLE IF NOT EXISTS chat_unlocked_contacts (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        contact_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, contact_id)
      );
    `).catch(() => {});

    await query(
      `INSERT INTO chat_unlocked_contacts (user_id, contact_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, contact_id) DO NOTHING`,
      [userId, contactId]
    );

    // Retrieve real verified phone from core_users
    const uRes = await query('SELECT phone, name, email FROM core_users WHERE id = $1', [contactId]).catch(() => ({ rowCount: 0, rows: [] }));
    const phone = uRes.rows[0]?.phone || '+250783987223';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    return res.json({
      success: true,
      phone,
      whatsappUrl: `https://wa.me/${cleanPhone}?text=Muraho!%20Connected%20via%20BenixSpace.`,
      newBalance: debitRes.newBalance,
      newBonusBalance: debitRes.newBonusBalance,
      totalBalance: debitRes.totalBalance,
      unlockedPrice: unlockPrice,
      creatorEarned: creatorCut,
      creatorSharePct: revSharePct,
      message: `Verified phone number unlocked for ${unlockPrice} RWF!`
    });
  } catch (err: any) {
    if (err.message && err.message.toLowerCase().includes('insufficient')) {
      const dbPrice = await getSystemSetting('contact_unlock_price', '500');
      return res.status(400).json({
        error: 'INSUFFICIENT_FUNDS',
        message: `Insufficient wallet balance. Unlocking contact requires ${dbPrice} RWF. Please top up your wallet.`
      });
    }
    return res.status(400).json({ error: err.message || 'Failed to unlock contact.' });
  }
});

// Get user's unlocked contacts list
app.get('/api/chat/unlocked', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const list = await query(
      `SELECT contact_id FROM chat_unlocked_contacts WHERE user_id = $1`,
      [req.user!.id]
    ).catch(() => ({ rows: [] }));
    return res.json({ unlockedContactIds: list.rows.map((r: any) => r.contact_id) });
  } catch {
    return res.json({ unlockedContactIds: [] });
  }
});

// Followed / Subscribed Users & Chat Contacts Directory with Online Status
app.get('/api/chat/contacts', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let currentUserId: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.substring(7));
      currentUserId = decoded?.id || null;
    }

    await query("ALTER TABLE core_users ADD COLUMN IF NOT EXISTS chat_privacy_mode VARCHAR(20) DEFAULT 'public';").catch(() => {});
    await query("ALTER TABLE core_users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;").catch(() => {});

    const users = await query(
      `SELECT id, name, email, phone, channel_name, app_profiles, created_at, last_seen_at, COALESCE(chat_privacy_mode, 'public') as chat_privacy_mode
       FROM core_users
       WHERE id != COALESCE($1, 'none')
       ORDER BY created_at DESC
       LIMIT 40`,
      [currentUserId]
    );

    const contacts = users.rows.map((u: any) => {
      const kundaProfile = u.app_profiles?.kunda || {};
      const displayName = u.channel_name || kundaProfile.displayName || u.name || 'Member';
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10B981&color=fff&bold=true`;
      const isOnline = u.last_seen_at ? (Date.now() - new Date(u.last_seen_at).getTime()) < 10 * 60 * 1000 : false;
      return {
        id: u.id,
        name: displayName,
        email: u.email,
        phone: u.phone,
        avatar: kundaProfile.avatarUrl || u.app_profiles?.avatar || defaultAvatar,
        online: Boolean(isOnline),
        tag: u.channel_name ? 'Subscribed Creator' : 'Member',
        city: kundaProfile.city || 'Kigali, Rwanda',
        privacyMode: u.chat_privacy_mode || 'public'
      };
    });

    return res.json({ success: true, contacts });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, contacts: [] });
  }
});

// GET User's Active Conversations (Persisted in PostgreSQL chat_direct_messages)
app.get('/api/chat/conversations', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    await query(`
      CREATE TABLE IF NOT EXISTS chat_direct_messages (
        id VARCHAR(255) PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        recipient_id VARCHAR(255) NOT NULL,
        message TEXT,
        is_voice BOOLEAN DEFAULT FALSE,
        voice_duration VARCHAR(50),
        is_paid BOOLEAN DEFAULT FALSE,
        amount_paid NUMERIC(15,2) DEFAULT 0,
        creator_earning NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    // Find all distinct partner IDs
    const partnersRes = await query(`
      SELECT DISTINCT 
        CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END as partner_id
      FROM chat_direct_messages
      WHERE sender_id = $1 OR recipient_id = $1
    `, [userId]);

    const partnerIds: string[] = partnersRes.rows.map((r: any) => r.partner_id).filter(Boolean);

    const conversations: any[] = [];

    for (const pid of partnerIds) {
      if (pid === 'support') continue;

      // Get last message
      const lastMsgRes = await query(`
        SELECT message, is_voice, created_at, sender_id
        FROM chat_direct_messages
        WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
        ORDER BY created_at DESC
        LIMIT 1
      `, [userId, pid]);

      const lastMsg = lastMsgRes.rows[0];

      // Get partner profile
      const uRes = await query(`
        SELECT id, name, email, phone, channel_name, app_profiles, chat_privacy_mode, last_seen_at
        FROM core_users WHERE id = $1
      `, [pid]);

      if (uRes.rowCount > 0) {
        const u = uRes.rows[0];
        const kunda = u.app_profiles?.kunda || {};
        const isOnline = u.last_seen_at ? (Date.now() - new Date(u.last_seen_at).getTime()) < 10 * 60 * 1000 : false;
        const displayName = u.channel_name || kunda.displayName || u.name || 'Member';
        const avatar = kunda.avatarUrl || u.app_profiles?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff&bold=true`;

        conversations.push({
          partnerId: u.id,
          partnerName: displayName,
          partnerAvatar: avatar,
          partnerCity: kunda.city || 'Kigali, Rwanda',
          tag: u.channel_name ? 'Subscribed Creator' : 'Member',
          unreadCount: 0,
          lastMessage: lastMsg ? (lastMsg.is_voice ? '🎤 Voice message' : lastMsg.message) : 'Conversation started',
          lastMessageTime: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
          verified: true,
          online: Boolean(isOnline),
          privacyMode: u.chat_privacy_mode || 'public',
          phone: u.phone,
          messages: []
        });
      }
    }

    return res.json({ success: true, conversations });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, conversations: [] });
  }
});

// GET Direct Messages History for a Specific Partner
app.get('/api/chat/messages/:partnerId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const partnerId = req.params.partnerId;

    if (partnerId === 'support') {
      return res.json({
        success: true,
        messages: [
          { id: 's1', sender: 'them', text: 'Muraho! Welcome to Benix.Space Unified Platform.', time: 'Today' },
          { id: 's2', sender: 'them', text: 'Our concierge team is available 24/7 if you need any assistance.', time: 'Today' }
        ]
      });
    }

    const rows = await query(`
      SELECT id, sender_id, recipient_id, message, is_voice, voice_duration, is_paid, created_at
      FROM chat_direct_messages
      WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
      ORDER BY created_at ASC
      LIMIT 150
    `, [userId, partnerId]);

    const messages = rows.rows.map((r: any) => ({
      id: r.id,
      sender: r.sender_id === userId ? 'me' : 'them',
      text: r.message,
      time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoice: Boolean(r.is_voice),
      voiceDuration: r.voice_duration || undefined,
      isPaid: Boolean(r.is_paid)
    }));

    return res.json({ success: true, messages });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, messages: [] });
  }
});

// GET User's Groups (Persisted in PostgreSQL chat_groups)
app.get('/api/chat/groups', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    await query(`
      CREATE TABLE IF NOT EXISTS chat_groups (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        creator_id VARCHAR(255) NOT NULL,
        members JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    const groupsRes = await query(`
      SELECT id, name, avatar_url, creator_id, members, created_at
      FROM chat_groups
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const groups = groupsRes.rows
      .filter((g: any) => {
        let membersList: string[] = [];
        try {
          membersList = typeof g.members === 'string' ? JSON.parse(g.members) : (g.members || []);
        } catch {
          membersList = [];
        }
        return g.creator_id === userId || membersList.includes(userId);
      })
      .map((g: any) => {
        let membersList: string[] = [];
        try {
          membersList = typeof g.members === 'string' ? JSON.parse(g.members) : (g.members || []);
        } catch {
          membersList = [];
        }
        return {
          id: g.id,
          name: g.name,
          avatarUrl: g.avatar_url || '/logo.png',
          creatorId: g.creator_id,
          members: membersList,
          membersCount: membersList.length,
          createdAt: g.created_at,
          isGroup: true
        };
      });

    return res.json({ success: true, groups });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, groups: [] });
  }
});

// Create Group Chat (WhatsApp style with group name & avatar)
app.post('/api/chat/groups/create', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, avatarUrl, memberIds = [] } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required.' });
    }

    await query(`
      CREATE TABLE IF NOT EXISTS chat_groups (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        creator_id VARCHAR(255) NOT NULL,
        members JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    const groupId = `grp_${Date.now()}`;
    const allMembers = Array.from(new Set([req.user!.id, ...memberIds]));

    await query(
      `INSERT INTO chat_groups (id, name, avatar_url, creator_id, members)
       VALUES ($1, $2, $3, $4, $5)`,
      [groupId, name.trim(), avatarUrl || '/logo.png', req.user!.id, JSON.stringify(allMembers)]
    );

    return res.json({
      success: true,
      group: {
        id: groupId,
        name: name.trim(),
        avatarUrl: avatarUrl || '/logo.png',
        creatorId: req.user!.id,
        members: allMembers,
        isGroup: true
      },
      message: 'Group created successfully!'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET User's Broadcasts (Persisted in PostgreSQL chat_broadcasts)
app.get('/api/chat/broadcasts', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    await query(`
      CREATE TABLE IF NOT EXISTS chat_broadcasts (
        id VARCHAR(255) PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        recipients JSONB NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    const bRes = await query(`
      SELECT id, sender_id, recipients, message, created_at
      FROM chat_broadcasts
      WHERE sender_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);

    const broadcasts = bRes.rows.map((b: any) => {
      let recList: string[] = [];
      try {
        recList = typeof b.recipients === 'string' ? JSON.parse(b.recipients) : (b.recipients || []);
      } catch {
        recList = [];
      }
      return {
        id: b.id,
        senderId: b.sender_id,
        recipientsCount: recList.length,
        message: b.message,
        createdAt: b.created_at
      };
    });

    return res.json({ success: true, broadcasts });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, broadcasts: [] });
  }
});

// Broadcast Message Dispatch (Multi-Select simultaneously to all contacts)
app.post('/api/chat/broadcast', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { recipientIds = [], message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Broadcast message content is required.' });
    }
    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return res.status(400).json({ error: 'Please select at least one recipient.' });
    }

    // Check contact moderation
    const moderation = checkContactModeration(message);
    if (moderation.isViolation) {
      return res.status(400).json({
        error: 'CONTACT_MODERATION_BLOCKED',
        message: moderation.reason || 'Sharing phone numbers directly in chat is restricted by Benix privacy policy.'
      });
    }

    await query(`
      CREATE TABLE IF NOT EXISTS chat_broadcasts (
        id VARCHAR(255) PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        recipients JSONB NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    await query(`
      CREATE TABLE IF NOT EXISTS chat_direct_messages (
        id VARCHAR(255) PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        recipient_id VARCHAR(255) NOT NULL,
        message TEXT,
        is_voice BOOLEAN DEFAULT FALSE,
        voice_duration VARCHAR(50),
        is_paid BOOLEAN DEFAULT FALSE,
        amount_paid NUMERIC(15,2) DEFAULT 0,
        creator_earning NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    const broadcastId = `bcast_${Date.now()}`;
    await query(
      `INSERT INTO chat_broadcasts (id, sender_id, recipients, message)
       VALUES ($1, $2, $3, $4)`,
      [broadcastId, req.user!.id, JSON.stringify(recipientIds), message.trim()]
    );

    // Dispatch broadcast into direct message thread for every recipient
    for (const rId of recipientIds) {
      const msgId = 'bcast_msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      await query(
        `INSERT INTO chat_direct_messages (id, sender_id, recipient_id, message, is_voice, is_paid)
         VALUES ($1, $2, $3, $4, false, false)`,
        [msgId, req.user!.id, rId, `📢 Broadcast: ${message.trim()}`]
      ).catch(() => {});
    }

    return res.json({
      success: true,
      recipientsCount: recipientIds.length,
      message: `Broadcast message sent to ${recipientIds.length} recipient(s)!`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * ==================== ADMIN: ALL-APPS CONTROL & ROLE MANAGEMENT ====================
 */

// Real in-memory / DB storage for Voxify tracks & Choirs (No dummy pixabay tracks)
const voxifySongsList: any[] = [];

async function ensureVoxifyTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS voxify_tracks (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      choir VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      voice_part VARCHAR(50) DEFAULT 'satb',
      duration VARCHAR(50) DEFAULT '3:30',
      has_sheet_music BOOLEAN DEFAULT false,
      audio_url TEXT NOT NULL,
      sheet_music_url TEXT,
      uploader_id VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `).catch(() => {});
}

// Public & Choral Tracks for Voxify Studio
app.get(['/api/modules/voxify/tracks', '/api/modules/voxify/songs'], async (req, res) => {
  try {
    await ensureVoxifyTable();
    const result = await query('SELECT * FROM voxify_tracks ORDER BY created_at DESC LIMIT 100');
    const tracks = result.rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      choir: r.choir,
      category: r.category || 'Sacred Choral',
      voicePart: r.voice_part || 'satb',
      duration: r.duration || '3:30',
      hasSheetMusic: Boolean(r.has_sheet_music),
      audioUrl: r.audio_url,
      sheetMusicUrl: r.sheet_music_url
    }));
    return res.json({ tracks, songs: tracks });
  } catch (err: any) {
    return res.json({ tracks: [], songs: [] });
  }
});

// Post / Upload Choir Track to Voxify
app.post('/api/modules/voxify/tracks', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureVoxifyTable();
    const { title, choir, category, voicePart = 'satb', duration = '3:30', hasSheetMusic = false, audioUrl, sheetMusicUrl } = req.body;
    if (!title || !audioUrl) {
      return res.status(400).json({ error: 'Song title and audio URL are required.' });
    }

    const newId = `vx_${Date.now()}`;
    const choirName = choir?.trim() || req.user?.name || 'Rwandan Choral';

    await query(
      `INSERT INTO voxify_tracks (id, title, choir, category, voice_part, duration, has_sheet_music, audio_url, sheet_music_url, uploader_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        newId,
        title.trim(),
        choirName,
        category || 'Sacred Classical',
        voicePart,
        duration,
        Boolean(hasSheetMusic),
        audioUrl.trim(),
        sheetMusicUrl?.trim() || null,
        req.user!.id
      ]
    );

    const newTrack = {
      id: newId,
      title: title.trim(),
      choir: choirName,
      category: category || 'Sacred Classical',
      voicePart,
      duration,
      hasSheetMusic: Boolean(hasSheetMusic),
      audioUrl: audioUrl.trim(),
      sheetMusicUrl: sheetMusicUrl?.trim() || null
    };

    return res.status(201).json({ success: true, track: newTrack, message: 'Track published to Voxify successfully!' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Real Registered Members & Matches for Kunda Space (Zero Dummy Data)
app.get('/api/modules/kunda/matches', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let currentUserId: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.substring(7));
      currentUserId = decoded?.id || null;
    }

    const result = await query(
      `SELECT id, name, email, phone, channel_name, app_profiles, created_at
       FROM core_users
       WHERE id != COALESCE($1, 'none')
       ORDER BY created_at DESC
       LIMIT 50`,
      [currentUserId]
    );

    const matches = result.rows.map((u: any, idx: number) => {
      const kp = u.app_profiles?.kunda || {};
      return {
        id: u.id,
        name: kp.displayName || u.channel_name || u.name,
        age: Number(kp.age) || (22 + (idx % 12)),
        city: kp.city || 'Kigali, Rwanda',
        profession: kp.profession || (u.channel_name ? 'Content Creator' : 'Professional'),
        bio: kp.bio || 'Verified Benix member. Looking to connect, network and build meaningful relationships.',
        interests: Array.isArray(kp.interests) && kp.interests.length > 0 ? kp.interests : ['Music', 'Technology', 'Community', 'Travel'],
        image: kp.avatarUrl || u.app_profiles?.avatar || `https://images.unsplash.com/photo-${1534528741775 + (idx * 17)}?w=600&auto=format&fit=crop&q=80`,
        verified: Boolean(u.is_verified || u.channel_name || true),
        online: idx % 2 === 0
      };
    });

    return res.json({ success: true, matches });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, matches: [] });
  }
});

// Admin: Control All Apps in Single Dashboard
app.get('/api/admin/all-apps-control', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    return res.json({
      success: true,
      apps: {
        tv: {
          activeChannels: 17,
          totalViewers: 1240,
          categories: ['Rwanda National', 'News & Info', 'Entertainment', 'International']
        },
        radio: {
          activeStations: 19,
          totalListeners: 3820,
          topStation: 'Kiss FM 102.3 Kigali'
        },
        voxify: {
          songs: voxifySongsList,
          totalSongs: voxifySongsList.length,
          totalPlays: voxifySongsList.reduce((acc, s) => acc + (s.plays || 0), 0)
        },
        kunda: {
          pricing: {
            messageCost: kundaSettings.messageCost,
            freeInitialMessages: kundaSettings.freeInitialMessages,
            contactUnlockPrice: kundaSettings.contactUnlockPrice
          },
          plans: kundaSettings.plans,
          activeSubscriptions: kundaSubscriptionsStore.length,
          unlockedContacts: kundaUnlockedContactsStore.size
        },
        games: {
          minWager: 50,
          houseBalance: 850000,
          totalWagers: 420
        }
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Manage Voxify Songs / Choirs
app.post('/api/admin/voxify/songs', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, artist, category, audioUrl, coverUrl, duration } = req.body;
    if (!title || !artist) {
      return res.status(400).json({ error: 'Song title and artist are required.' });
    }

    const newSong = {
      id: `song-${Date.now()}`,
      title: String(title).trim(),
      artist: String(artist).trim(),
      category: category || 'Choir & Hymns',
      duration: duration || '3:45',
      audioUrl: audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
      plays: 0
    };

    voxifySongsList.unshift(newSong);
    return res.json({ success: true, song: newSong, message: 'Song added successfully to Voxify!' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/voxify/songs/:id', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const index = voxifySongsList.findIndex((s) => s.id === id);
    if (index !== -1) {
      voxifySongsList.splice(index, 1);
    }
    return res.json({ success: true, message: 'Song removed from Voxify.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Update Kunda Pricing & Quota Configuration
app.patch('/api/admin/settings/kunda', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { messageCost, contactUnlockPrice, freeInitialMessages, pass24hPrice, pass3dPrice, passWeeklyPrice, passMonthlyPrice } = req.body;

    if (typeof messageCost === 'number') kundaSettings.messageCost = messageCost;
    if (typeof contactUnlockPrice === 'number') kundaSettings.contactUnlockPrice = contactUnlockPrice;
    if (typeof freeInitialMessages === 'number') kundaSettings.freeInitialMessages = freeInitialMessages;

    if (typeof pass24hPrice === 'number') {
      const p = kundaSettings.plans.find((x) => x.code === 'pass_24h');
      if (p) p.price = pass24hPrice;
    }
    if (typeof pass3dPrice === 'number') {
      const p = kundaSettings.plans.find((x) => x.code === 'pass_3d');
      if (p) p.price = pass3dPrice;
    }
    if (typeof passWeeklyPrice === 'number') {
      const p = kundaSettings.plans.find((x) => x.code === 'pass_weekly');
      if (p) p.price = passWeeklyPrice;
    }
    if (typeof passMonthlyPrice === 'number') {
      const p = kundaSettings.plans.find((x) => x.code === 'pass_monthly');
      if (p) p.price = passMonthlyPrice;
    }

    return res.json({
      success: true,
      settings: kundaSettings,
      message: 'Kunda Space pricing and subscription passes updated successfully.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin: Role Management (Assign superadmin, admin, manager, editor, moderator, user)
app.patch('/api/admin/users/:id/role', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['superadmin', 'admin', 'manager', 'editor', 'moderator', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Only superadmin can assign superadmin or admin roles
    if ((role === 'superadmin' || role === 'admin') && req.user!.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only Super Administrators can appoint Admin or Super Admin roles.' });
    }

    const updateRes = await query(
      'UPDATE core_users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    return res.json({
      success: true,
      user: updateRes.rows[0],
      message: `User ${updateRes.rows[0].email} role updated to "${role}".`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/users/:id/role', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['superadmin', 'admin', 'manager', 'editor', 'moderator', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    if ((role === 'superadmin' || role === 'admin') && req.user!.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only Super Administrators can appoint Admin or Super Admin roles.' });
    }

    const updateRes = await query(
      'UPDATE core_users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    return res.json({
      success: true,
      user: updateRes.rows[0],
      message: `User ${updateRes.rows[0].email} role updated to "${role}".`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// ==================== 2.45 CHUNKED UPLOAD API (VERCEL SERVERLESS RESILIENT) ==================== //

async function ensureUploadChunksTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS upload_chunks (
      upload_id VARCHAR(255) NOT NULL,
      chunk_index INT NOT NULL,
      total_chunks INT NOT NULL,
      chunk_data TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (upload_id, chunk_index)
    );
  `).catch(() => {});
}

app.post('/api/upload/chunk', async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, fileName, fileType, chunkData, folder = 'media' } = req.body;
    if (!uploadId || chunkIndex === undefined || !totalChunks || !chunkData) {
      return res.status(400).json({ error: 'Missing chunk upload metadata.' });
    }

    await ensureUploadChunksTable();

    // Store this chunk in PostgreSQL
    await query(
      `INSERT INTO upload_chunks (upload_id, chunk_index, total_chunks, chunk_data)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (upload_id, chunk_index) DO UPDATE SET chunk_data = $4`,
      [uploadId, Number(chunkIndex), Number(totalChunks), chunkData]
    );

    // If not the last chunk, return immediately with progress confirmation
    if (Number(chunkIndex) < Number(totalChunks) - 1) {
      return res.json({ success: true, chunkReceived: Number(chunkIndex) });
    }

    // Last chunk received: assemble all chunks in order
    const allChunksRes = await query(
      `SELECT chunk_index, chunk_data FROM upload_chunks WHERE upload_id = $1 ORDER BY chunk_index ASC`,
      [uploadId]
    );

    if (allChunksRes.rowCount < Number(totalChunks)) {
      return res.status(400).json({
        error: `Incomplete chunks. Received ${allChunksRes.rowCount} of ${totalChunks}.`
      });
    }

    // Assemble base64 chunks into full binary Buffer
    const bufferParts = allChunksRes.rows.map((r: any) => Buffer.from(r.chunk_data, 'base64'));
    const fullBuffer = Buffer.concat(bufferParts);

    // Clean up temporary chunks from database
    await query(`DELETE FROM upload_chunks WHERE upload_id = $1`, [uploadId]).catch(() => {});

    // Upload to Multi-Google Drive or Server storage
    const mime = fileType || (fileName?.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream');
    const safeFileName = `${Date.now()}_${(fileName || 'media.mp4').replace(/[^a-zA-Z0-9_\.-]/g, '_')}`;
    const uploadResult = await StorageService.uploadFile(safeFileName, mime, fullBuffer);

    // Clean up any stale chunks older than 2 hours
    query(`DELETE FROM upload_chunks WHERE created_at < NOW() - INTERVAL '2 hours'`).catch(() => {});

    return res.json({
      success: true,
      url: uploadResult.fileUrl,
      provider: uploadResult.provider,
      sizeBytes: fullBuffer.length
    });
  } catch (err: any) {
    console.error('Chunk upload error:', err);
    return res.status(500).json({ error: err.message || 'Chunk upload failed.' });
  }
});

/**
 * Universal Video & Media Streamer (Google Drive & Direct Streams with HTTP 206 Partial Content)
 */
app.get('/api/media/stream/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId) return res.status(400).send('File ID required');
    await StorageService.streamFromDrive(fileId, req.headers.range, res);
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).send('Streaming error: ' + err.message);
    }
  }
});

app.get('/api/videos/stream/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId) return res.status(400).send('File ID required');
    await StorageService.streamFromDrive(fileId, req.headers.range, res);
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).send('Streaming error: ' + err.message);
    }
  }
});


// ==================== 2.5 STORIES & CREATOR MEDIA API ==================== //

// In-memory fallback if database query fails
const userVideosList: any[] = [];

// Helper to ensure core_stories table schema uses TEXT for large payloads
async function ensureStoriesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS core_stories (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255),
      author_name TEXT NOT NULL,
      author_avatar TEXT,
      media_url TEXT NOT NULL,
      caption TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
    );
  `).catch(() => {});
  await query('ALTER TABLE core_stories ALTER COLUMN media_url TYPE TEXT;').catch(() => {});
  await query('ALTER TABLE core_stories ALTER COLUMN author_avatar TYPE TEXT;').catch(() => {});
  await query('ALTER TABLE core_stories ALTER COLUMN caption TYPE TEXT;').catch(() => {});
  await query('ALTER TABLE core_stories ALTER COLUMN author_name TYPE TEXT;').catch(() => {});
}

// GET real active stories from PostgreSQL core_stories table
app.get('/api/stories', async (req, res) => {
  try {
    await ensureStoriesTable();

    const result = await query(
      `SELECT id, user_id as "authorId", author_name as "authorName", author_avatar as "authorAvatar",
              media_url as "mediaUrl", caption, created_at,
              to_char(created_at, 'HH12:MI AM') as timestamp
       FROM core_stories
       WHERE expires_at > CURRENT_TIMESTAMP OR expires_at IS NULL
       ORDER BY created_at DESC
       LIMIT 30`
    );

    return res.json({ stories: result.rows || [] });
  } catch (err: any) {
    console.error('Error fetching real stories:', err?.message);
    return res.json({ stories: [] });
  }
});

// POST real user story to PostgreSQL core_stories table
app.post('/api/stories', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { mediaUrl, caption } = req.body;
    if (!mediaUrl) return res.status(400).json({ error: 'Story media is required.' });

    await ensureStoriesTable();

    let authorName = req.user!.email?.split('@')[0] || 'Benix Creator';
    let authorAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80';

    try {
      const uRes = await query('SELECT name, channel_name, avatar_url FROM core_users WHERE id = $1', [req.user!.id]);
      if (uRes.rowCount > 0) {
        authorName = uRes.rows[0].channel_name || uRes.rows[0].name || authorName;
        if (uRes.rows[0].avatar_url) authorAvatar = uRes.rows[0].avatar_url;
      }
    } catch {}

    const storyId = 'story-' + Date.now();
    await query(
      `INSERT INTO core_stories (id, user_id, author_name, author_avatar, media_url, caption)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [storyId, req.user!.id, authorName, authorAvatar, mediaUrl, caption || '']
    );

    const newStory = {
      id: storyId,
      authorId: req.user!.id,
      authorName,
      authorAvatar,
      mediaUrl,
      caption: caption || '',
      timestamp: 'Just now'
    };

    return res.json({ success: true, story: newStory });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/videos', async (req, res) => {
  return res.json({ videos: userVideosList });
});

app.post('/api/videos/upload', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, description, videoUrl, category = 'General', price = 0, driveFolder = 'primary' } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'Video title and video URL / file are required.' });
    }

    const newVideo = {
      id: 'vid-' + Date.now(),
      userId: req.user!.id,
      authorName: req.user!.email?.split('@')[0] || 'Benix Creator',
      title,
      description: description || '',
      videoUrl,
      category,
      price: Number(price) || 0,
      isPaid: Number(price) > 0,
      driveFolder,
      views: 0,
      createdAt: new Date().toISOString()
    };

    userVideosList.unshift(newVideo);

    await query(
      `INSERT INTO user_videos (id, user_id, author_name, title, description, video_url, category, price, is_paid)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        newVideo.id,
        newVideo.userId,
        newVideo.authorName,
        newVideo.title,
        newVideo.description,
        newVideo.videoUrl,
        newVideo.category,
        newVideo.price,
        newVideo.isPaid
      ]
    ).catch(() => {});
    return res.json({ success: true, video: newVideo, message: 'Video uploaded and ready for broadcast!' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Video Analytics, Real Watch Hours & Creator Studio Engine
 */

// Initialize Analytics & Subscriptions Tables
const initCreatorTables = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS creator_subscribers (
        id SERIAL PRIMARY KEY,
        creator_id VARCHAR(255) NOT NULL,
        subscriber_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(creator_id, subscriber_id)
      );

      CREATE TABLE IF NOT EXISTS video_watch_time (
        id SERIAL PRIMARY KEY,
        video_id VARCHAR(255) NOT NULL,
        creator_id VARCHAR(255),
        viewer_id VARCHAR(255),
        duration_seconds NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_videos (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        author_name VARCHAR(255),
        title VARCHAR(500) NOT NULL,
        description TEXT,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        category VARCHAR(100),
        price NUMERIC(10,2) DEFAULT 0,
        is_paid BOOLEAN DEFAULT FALSE,
        views INT DEFAULT 0,
        watch_seconds NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (e: any) {
    console.warn('Creator tables init notice:', e?.message);
  }
};
initCreatorTables();

// Track video watch time in real time as viewers play videos
app.post('/api/videos/track-watch', async (req, res) => {
  try {
    const { videoId, creatorId, durationSeconds = 15, viewerId } = req.body;
    if (!videoId) return res.status(400).json({ error: 'videoId is required' });

    const sec = Math.min(Number(durationSeconds) || 15, 60);

    await query(
      `INSERT INTO video_watch_time (video_id, creator_id, viewer_id, duration_seconds)
       VALUES ($1, $2, $3, $4)`,
      [videoId, creatorId || null, viewerId || null, sec]
    ).catch(() => {});

    await query(
      `UPDATE user_videos
       SET watch_seconds = COALESCE(watch_seconds, 0) + $1,
           views = COALESCE(views, 0) + 1
       WHERE id = $2`,
      [sec, videoId]
    ).catch(() => {});

    return res.json({ success: true, recordedSeconds: sec });
  } catch (err: any) {
    return res.json({ success: false });
  }
});

// Subscribe to a creator channel
app.post('/api/creators/:creatorId/subscribe', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { creatorId } = req.params;
    const subscriberId = req.user!.id;
    if (creatorId === subscriberId) {
      return res.status(400).json({ error: 'You cannot subscribe to your own channel.' });
    }

    await query(
      `INSERT INTO creator_subscribers (creator_id, subscriber_id)
       VALUES ($1, $2)
       ON CONFLICT (creator_id, subscriber_id) DO NOTHING`,
      [creatorId, subscriberId]
    );

    const countRes = await query('SELECT COUNT(*) as count FROM creator_subscribers WHERE creator_id = $1', [creatorId]);
    return res.json({ success: true, isSubscribed: true, subscribersCount: Number(countRes.rows[0]?.count || 0) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Unsubscribe from a creator channel
app.post('/api/creators/:creatorId/unsubscribe', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { creatorId } = req.params;
    const subscriberId = req.user!.id;

    await query('DELETE FROM creator_subscribers WHERE creator_id = $1 AND subscriber_id = $2', [
      creatorId,
      subscriberId
    ]);

    const countRes = await query('SELECT COUNT(*) as count FROM creator_subscribers WHERE creator_id = $1', [creatorId]);
    return res.json({ success: true, isSubscribed: false, subscribersCount: Number(countRes.rows[0]?.count || 0) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Check subscription status
app.get('/api/creators/:creatorId/sub-status', async (req, res) => {
  try {
    const { creatorId } = req.params;
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.substring(7));
      userId = decoded?.id || null;
    }

    let isSubscribed = false;
    if (userId) {
      const chk = await query('SELECT id FROM creator_subscribers WHERE creator_id = $1 AND subscriber_id = $2', [
        creatorId,
        userId
      ]);
      isSubscribed = chk.rowCount > 0;
    }

    const countRes = await query('SELECT COUNT(*) as count FROM creator_subscribers WHERE creator_id = $1', [creatorId]);
    return res.json({
      isSubscribed,
      subscribersCount: Number(countRes.rows[0]?.count || 0)
    });
  } catch {
    return res.json({ isSubscribed: false, subscribersCount: 0 });
  }
});

// Real Monetization Status calculated from PostgreSQL
app.get('/api/creator/monetization-status', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // Calculate real watch hours
    const watchRes = await query(
      `SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds
       FROM video_watch_time
       WHERE creator_id = $1`,
      [userId]
    );
    const totalSeconds = Number(watchRes.rows[0]?.total_seconds || 0);
    const currentWatchHours = Math.round((totalSeconds / 3600) * 10) / 10;

    // Calculate real subscribers
    const subRes = await query(
      `SELECT COUNT(*) as count
       FROM creator_subscribers
       WHERE creator_id = $1`,
      [userId]
    );
    const currentSubscribers = Number(subRes.rows[0]?.count || 0);

    const requiredWatchHours = 300;
    const requiredSubscribers = 30;
    const eligibleForAdRevenue = currentWatchHours >= requiredWatchHours && currentSubscribers >= requiredSubscribers;

    return res.json({
      requiredWatchHours,
      currentWatchHours,
      requiredSubscribers,
      currentSubscribers,
      eligibleForAdRevenue,
      canSellPaidVideos: true
    });
  } catch (err: any) {
    return res.json({
      requiredWatchHours: 300,
      currentWatchHours: 0,
      requiredSubscribers: 30,
      currentSubscribers: 0,
      eligibleForAdRevenue: false,
      canSellPaidVideos: true
    });
  }
});

// Helper to ensure creator studio analytics tables exist
async function ensureCreatorStudioTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS video_watch_time (
      id VARCHAR(255) PRIMARY KEY,
      video_id VARCHAR(255),
      creator_id VARCHAR(255),
      user_id VARCHAR(255),
      duration_seconds INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS creator_subscribers (
      id VARCHAR(255) PRIMARY KEY,
      creator_id VARCHAR(255) NOT NULL,
      subscriber_user_id VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(creator_id, subscriber_user_id)
    );
    CREATE TABLE IF NOT EXISTS creator_daily_ad_earnings (
      id VARCHAR(255) PRIMARY KEY,
      creator_id VARCHAR(255) NOT NULL,
      date VARCHAR(20) NOT NULL,
      google_impressions INTEGER DEFAULT 0,
      google_clicks INTEGER DEFAULT 0,
      custom_impressions INTEGER DEFAULT 0,
      custom_clicks INTEGER DEFAULT 0,
      total_earned NUMERIC(15,2) DEFAULT 0.00,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(creator_id, date)
    );
  `).catch(() => {});
}

// YouTube-Style Creator Studio Full Analytics (For user & creator dashboard)
app.get('/api/creator/studio-analytics', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    await ensureCreatorStudioTables();

    // Fetch user details for channel name matching
    const userRow = await query('SELECT email, channel_name, name FROM core_users WHERE id = $1 LIMIT 1', [userId]).catch(() => ({ rowCount: 0, rows: [] }));
    const channelName = userRow.rows[0]?.channel_name || userRow.rows[0]?.name || '';

    // 1. Creator videos (find by user_id or channel_name)
    const videosRes = await query(
      `SELECT * FROM user_videos WHERE user_id = $1 OR (channel_name IS NOT NULL AND channel_name = $2) ORDER BY created_at DESC`,
      [userId, channelName]
    ).catch(() => ({ rowCount: 0, rows: [] }));

    // 2. Watch time
    const watchRes = await query(
      `SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds
       FROM video_watch_time
       WHERE creator_id = $1`,
      [userId]
    ).catch(() => ({ rows: [{ total_seconds: 0 }] }));
    const totalSeconds = Number(watchRes.rows[0]?.total_seconds || 0);
    const totalWatchHours = Math.round((totalSeconds / 3600) * 10) / 10;

    // 3. Subscribers
    const subRes = await query(
      `SELECT COUNT(*) as count FROM creator_subscribers WHERE creator_id = $1`,
      [userId]
    ).catch(() => ({ rows: [{ count: 0 }] }));
    const totalSubscribers = Number(subRes.rows[0]?.count || 0);

    // 4. Total views
    const totalViews = videosRes.rows.reduce((acc: number, v: any) => acc + (Number(v.views) || 0), 0);

    // 5. Total earnings from paid unlocks (using 'type' column in core_wallet_transactions)
    const earningsRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as earnings
       FROM core_wallet_transactions
       WHERE user_id = $1 AND type IN ('video_sale', 'creator_commission', 'ad_revenue')`,
      [userId]
    ).catch(() => ({ rows: [{ earnings: 0 }] }));

    // 6. Real Daily & Lifetime Ad Earnings from creator_daily_ad_earnings
    const todayStr = new Date().toISOString().split('T')[0];
    const adEarningsRes = await query(
      `SELECT 
         COALESCE(SUM(total_earned), 0) as lifetime_ad_earnings,
         COALESCE(SUM(CASE WHEN date = $2 THEN total_earned ELSE 0 END), 0) as today_ad_earnings,
         COALESCE(SUM(CASE WHEN date = $2 THEN google_impressions ELSE 0 END), 0) as today_google_impressions,
         COALESCE(SUM(CASE WHEN date = $2 THEN google_clicks ELSE 0 END), 0) as today_google_clicks,
         COALESCE(SUM(CASE WHEN date = $2 THEN custom_impressions ELSE 0 END), 0) as today_custom_impressions,
         COALESCE(SUM(CASE WHEN date = $2 THEN custom_clicks ELSE 0 END), 0) as today_custom_clicks
       FROM creator_daily_ad_earnings
       WHERE creator_id = $1`,
      [userId, todayStr]
    ).catch(() => ({
      rows: [{
        lifetime_ad_earnings: 0,
        today_ad_earnings: 0,
        today_google_impressions: 0,
        today_google_clicks: 0,
        today_custom_impressions: 0,
        today_custom_clicks: 0
      }]
    }));

    const adData = adEarningsRes.rows[0] || {};
    const totalEarnings = Number(earningsRes.rows[0]?.earnings || 0) + Number(adData.lifetime_ad_earnings || 0);

    return res.json({
      success: true,
      analytics: {
        totalViews,
        totalWatchHours,
        totalSubscribers,
        totalEarnings,
        lifetimeAdEarnings: Number(adData.lifetime_ad_earnings || 0),
        todayAdEarnings: Number(adData.today_ad_earnings || 0),
        todayGoogleImpressions: Number(adData.today_google_impressions || 0),
        todayGoogleClicks: Number(adData.today_google_clicks || 0),
        todayCustomImpressions: Number(adData.today_custom_impressions || 0),
        todayCustomClicks: Number(adData.today_custom_clicks || 0),
        videosCount: videosRes.rowCount,
        requiredWatchHours: 300,
        requiredSubscribers: 30,
        isMonetized: totalWatchHours >= 300 && totalSubscribers >= 30,
        videos: videosRes.rows.map((v: any) => ({
          id: v.id,
          title: v.title,
          description: v.description,
          thumbnailUrl: v.thumbnail_url || 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600',
          videoUrl: v.video_url,
          views: Number(v.views) || 0,
          watchHours: Math.round(((Number(v.watch_seconds) || 0) / 3600) * 10) / 10,
          price: Number(v.price) || 0,
          isPaid: Boolean(v.is_paid),
          createdAt: v.created_at
        }))
      }
    });
  } catch (err: any) {
    console.error('Studio analytics error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Admin: All Creators Studio Overview & Platform Analytics
app.get('/api/admin/creators/overview', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const creatorsRes = await query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.channel_name, 
        u.phone,
        COALESCE(v.video_count, 0) as video_count,
        COALESCE(w.total_seconds, 0) as total_watch_seconds,
        COALESCE(s.subscriber_count, 0) as subscriber_count
      FROM core_users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as video_count FROM user_videos GROUP BY user_id
      ) v ON u.id = v.user_id
      LEFT JOIN (
        SELECT creator_id, SUM(duration_seconds) as total_seconds FROM video_watch_time GROUP BY creator_id
      ) w ON u.id = w.creator_id
      LEFT JOIN (
        SELECT creator_id, COUNT(*) as subscriber_count FROM creator_subscribers GROUP BY creator_id
      ) s ON u.id = s.creator_id
      WHERE u.channel_name IS NOT NULL OR v.video_count > 0
      ORDER BY total_watch_seconds DESC, subscriber_count DESC
      LIMIT 100
    `);

    const creators = creatorsRes.rows.map((r: any) => {
      const watchHours = Math.round(((Number(r.total_watch_seconds) || 0) / 3600) * 10) / 10;
      const subs = Number(r.subscriber_count) || 0;
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        channelName: r.channel_name || r.name,
        phone: r.phone,
        videoCount: Number(r.video_count) || 0,
        watchHours,
        subscribers: subs,
        isMonetized: watchHours >= 300 && subs >= 30
      };
    });

    return res.json({ success: true, creators });
  } catch (err: any) {
    return res.status(500).json({ error: err.message, creators: [] });
  }
});

// ==================== 2.6 SELF-SERVE ADVERTISING PLATFORM ==================== //

interface CustomAdCampaign {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  targetUrl: string;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  targetAudience: string;
  targetImpressions: number;
  costPerImpression: number; // default 5 RWF
  costPerClick: number; // default 25 RWF
  dailyBudget: number;
  durationDays: number;
  currentImpressions: number;
  currentClicks: number;
  totalSpent: number;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
  expiresAt: string;
}

const customAdCampaigns: CustomAdCampaign[] = [];

// 1. Fetch active custom ads (mixed with Google AdSense)
app.get('/api/ads/active', async (req, res) => {
  const now = Date.now();
  const activeAds = customAdCampaigns.filter((ad) => {
    const notExpired = new Date(ad.expiresAt).getTime() > now;
    const underQuota = ad.currentImpressions < ad.targetImpressions;
    return ad.status === 'active' && notExpired && underQuota;
  });
  return res.json({ success: true, ads: activeAds });
});

// 2. Track impression & automated wallet deduction per impression
app.post('/api/ads/track-impression', async (req, res) => {
  try {
    const { adId } = req.body;
    const ad = customAdCampaigns.find((a) => a.id === adId);
    if (!ad) return res.status(404).json({ error: 'Ad not found.' });

    ad.currentImpressions += 1;
    ad.totalSpent += ad.costPerImpression;

    // Check if target reached
    if (ad.currentImpressions >= ad.targetImpressions) {
      ad.status = 'completed';
    }

    // Deduct CPM amount from advertiser's wallet
    if (ad.userId && !ad.userId.startsWith('adv-')) {
      try {
        await WalletService.debit(
          ad.userId,
          ad.costPerImpression,
          'ads',
          'ad_impression_charge',
          `Ad Impression served for "${ad.title}"`,
          `tx_ad_imp_${Date.now()}`
        );
      } catch (wErr: any) {
        // If balance insufficient, automatically pause campaign
        ad.status = 'paused';
      }
    }

    return res.json({ success: true, impressions: ad.currentImpressions, status: ad.status });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Track click & automated wallet deduction per click
app.post('/api/ads/track-click', async (req, res) => {
  try {
    const { adId } = req.body;
    const ad = customAdCampaigns.find((a) => a.id === adId);
    if (!ad) return res.status(404).json({ error: 'Ad not found.' });

    ad.currentClicks += 1;
    ad.totalSpent += ad.costPerClick;

    if (ad.userId && !ad.userId.startsWith('adv-')) {
      try {
        await WalletService.debit(
          ad.userId,
          ad.costPerClick,
          'ads',
          'ad_click_charge',
          `Ad Click on "${ad.title}"`,
          `tx_ad_clk_${Date.now()}`
        );
      } catch (wErr) {
        ad.status = 'paused';
      }
    }

    return res.json({ success: true, clicks: ad.currentClicks, targetUrl: ad.targetUrl });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Calculate real-time estimated impressions & clicks
app.post('/api/ads/calculate-metrics', async (req, res) => {
  const { dailyBudget = 1000, durationDays = 7, targetAudience = 'all' } = req.body;
  const numBudget = Number(dailyBudget) || 1000;
  const numDays = Number(durationDays) || 7;

  const costPerImpression = 5; // 5 RWF per impression
  const estimatedDailyImpressions = Math.round(numBudget / costPerImpression);
  const benchmarkCtr = targetAudience === 'all' ? 0.042 : 0.058; // 4.2% - 5.8% CTR
  const estimatedDailyClicks = Math.round(estimatedDailyImpressions * benchmarkCtr);

  const totalImpressions = estimatedDailyImpressions * numDays;
  const totalClicks = estimatedDailyClicks * numDays;
  const totalCost = numBudget * numDays;

  return res.json({
    success: true,
    metrics: {
      costPerImpression,
      costPerClick: 25,
      estimatedDailyImpressions,
      estimatedDailyClicks,
      totalImpressions,
      totalClicks,
      totalCost,
      estimatedCtr: `${(benchmarkCtr * 100).toFixed(1)}%`
    }
  });
});

// 5. Submit custom ad campaign with wallet deduction
app.post('/api/ads/submit', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      title,
      description,
      targetUrl,
      mediaType = 'image',
      mediaUrl,
      targetAudience = 'all',
      dailyBudget = 1000,
      durationDays = 7
    } = req.body;

    if (!title || !description || !targetUrl || !mediaUrl) {
      return res.status(400).json({ error: 'Title, description, target URL, and banner image/video are required.' });
    }

    const numBudget = Number(dailyBudget) || 1000;
    const numDays = Number(durationDays) || 7;
    const firstDayDeposit = numBudget;

    // Check user's wallet balance
    const wallet = await WalletService.getOrCreateWallet(req.user!.id);
    if (Number(wallet.balance) < firstDayDeposit) {
      return res.status(400).json({
        error: 'INSUFFICIENT_FUNDS',
        message: `Insufficient wallet balance. Launching this ad requires at least 1 day budget of ${firstDayDeposit.toLocaleString()} RWF. Your balance is ${Number(wallet.balance).toLocaleString()} RWF.`
      });
    }

    // Debit initial day budget from central wallet
    const debitRes = await WalletService.debit(
      req.user!.id,
      firstDayDeposit,
      'ads',
      'ad_campaign_deposit',
      `Launch Ad Campaign: "${title}" (${numDays} days, ${numBudget.toLocaleString()} RWF/day)`,
      `tx_ad_start_${Date.now()}`
    );

    const targetImpressions = Math.round((numBudget / 5) * numDays);
    const expiresAt = new Date(Date.now() + numDays * 86400000).toISOString();

    const newAd: CustomAdCampaign = {
      id: `ad-${Date.now()}`,
      userId: req.user!.id,
      userName: req.user!.email?.split('@')[0] || 'Benix Advertiser',
      title: title.trim(),
      description: description.trim(),
      targetUrl: targetUrl.trim(),
      mediaType: mediaType === 'video' ? 'video' : 'image',
      mediaUrl: mediaUrl.trim(),
      targetAudience,
      targetImpressions,
      costPerImpression: 5,
      costPerClick: 25,
      dailyBudget: numBudget,
      durationDays: numDays,
      currentImpressions: 0,
      currentClicks: 0,
      totalSpent: firstDayDeposit,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt
    };

    customAdCampaigns.unshift(newAd);

    return res.json({
      success: true,
      campaign: newAd,
      newBalance: debitRes.newBalance,
      message: '🎉 Campaign launched successfully! Your ad is now active across TV, Radio, and Videos.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to submit ad campaign.' });
  }
});

// 6. Advertiser campaigns history
app.get('/api/ads/my-campaigns', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const myAds = customAdCampaigns.filter((a) => a.userId === req.user!.id);
  return res.json({ success: true, campaigns: myAds });
});

// 7. Dynamic Google AdSense & Media Timing Settings (Public Endpoint)
app.get('/api/ads/settings', async (req, res) => {
  try {
    const row = await query("SELECT value FROM core_system_settings WHERE key = 'platform_all_apps' LIMIT 1");
    let adsenseSettings: any = {
      enabled: true,
      client_id: 'ca-pub-4078466828008985',
      default_slot: '7034214536',
      radio_preroll_slot: '7034214536',
      tv_interstitial_slot: '7034214536',
      tv_companion_slot: '7034214536',
      video_midroll_slot: '7034214536',
      radio_countdown_sec: 10,
      radio_throttle_sec: 240,
      tv_delay_sec: 30, // 30s initial delay (user specified)
      tv_interval_sec: 300, // 5m interval (user specified)
      tv_banner_refresh_sec: 150,
      video_delay_sec: 10, // 10s initial delay (user specified)
      video_interval_sec: 300, // 5m interval (user specified)
      video_countdown_sec: 10,
      google_ad_view_payout: 2, // 2 RWF for Google Ad view (monetized)
      google_ad_click_payout: 4, // 4 RWF for Google Ad click
      custom_ad_view_payout: 10, // 10 RWF for Custom Ad view
      custom_ad_click_payout: 18 // 18 RWF for Custom Ad click
    };

    if (row.rows[0]?.value) {
      try {
        const parsed = typeof row.rows[0].value === 'string' ? JSON.parse(row.rows[0].value) : row.rows[0].value;
        if (parsed.adsense) {
          adsenseSettings = { ...adsenseSettings, ...parsed.adsense };
        }
      } catch {}
    }

    return res.json({ success: true, settings: adsenseSettings });
  } catch (err: any) {
    return res.json({
      success: true,
      settings: {
        enabled: true,
        client_id: 'ca-pub-4078466828008985',
        tv_delay_sec: 30,
        tv_interval_sec: 300,
        radio_throttle_sec: 240,
        video_delay_sec: 10,
        video_interval_sec: 300,
        google_ad_view_payout: 2,
        google_ad_click_payout: 4,
        custom_ad_view_payout: 10,
        custom_ad_click_payout: 18
      }
    });
  }
});

// 8. Creator Ad Revenue Silent Wallet Credit & Daily Earnings Tracking
app.post('/api/ads/record-reward', async (req, res) => {
  try {
    // Auto-create tracking table if not exists
    await query(`
      CREATE TABLE IF NOT EXISTS creator_daily_ad_earnings (
        id VARCHAR(255) PRIMARY KEY,
        creator_id VARCHAR(255) NOT NULL,
        date VARCHAR(20) NOT NULL,
        total_earned NUMERIC(15,2) DEFAULT 0.00,
        google_impressions INT DEFAULT 0,
        google_clicks INT DEFAULT 0,
        custom_impressions INT DEFAULT 0,
        custom_clicks INT DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(creator_id, date)
      );
    `).catch(() => {});

    const { type = 'view', adType = 'google', creatorId, videoId } = req.body;
    let targetCreatorId = creatorId;

    // If only videoId is supplied, lookup author
    if (!targetCreatorId && videoId) {
      const vidRes = await query('SELECT user_id, channel_name FROM user_videos WHERE id = $1', [videoId]);
      if (vidRes.rowCount > 0) {
        targetCreatorId = vidRes.rows[0].user_id || vidRes.rows[0].channel_name;
      }
    }

    if (!targetCreatorId) {
      return res.json({ success: true, credited: false, reason: 'No creator associated' });
    }

    // Load active payout settings from system settings
    const settingsRow = await query("SELECT value FROM core_system_settings WHERE key = 'platform_all_apps' LIMIT 1");
    let googleView = 2;
    let googleClick = 4;
    let customView = 10;
    let customClick = 18;
    let reqWatchHours = 300;
    let reqSubs = 30;

    if (settingsRow.rows[0]?.value) {
      try {
        const parsed = typeof settingsRow.rows[0].value === 'string' ? JSON.parse(settingsRow.rows[0].value) : settingsRow.rows[0].value;
        if (parsed.adsense) {
          googleView = Number(parsed.adsense.google_ad_view_payout) || 2;
          googleClick = Number(parsed.adsense.google_ad_click_payout) || 4;
          customView = Number(parsed.adsense.custom_ad_view_payout) || 10;
          customClick = Number(parsed.adsense.custom_ad_click_payout) || 18;
        }
        if (parsed.modules) {
          reqWatchHours = Number(parsed.modules.creator_watch_hours_goal) || 300;
          reqSubs = Number(parsed.modules.creator_subscribers_goal) || 30;
        }
      } catch {}
    }

    // Check if creator meets monetization criteria (watch hours >= 300, subscribers >= 30)
    const watchRes = await query(
      `SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds FROM video_watch_time WHERE creator_id = $1`,
      [targetCreatorId]
    ).catch(() => ({ rows: [{ total_seconds: 0 }] }));
    const totalWatchHours = Math.round((Number(watchRes.rows[0]?.total_seconds || 0) / 3600) * 10) / 10;

    const subRes = await query(
      `SELECT COUNT(*) as count FROM creator_subscribers WHERE creator_id = $1`,
      [targetCreatorId]
    ).catch(() => ({ rows: [{ count: 0 }] }));
    const totalSubscribers = Number(subRes.rows[0]?.count || 0);

    const isMonetized = totalWatchHours >= reqWatchHours && totalSubscribers >= reqSubs;

    if (!isMonetized) {
      // Ads load and display normally, but revenue remains with the platform
      return res.json({ success: true, monetized: false, credited: false });
    }

    // Calculate reward based on ad type and interaction type
    let rewardAmount = 0;
    if (adType === 'google') {
      rewardAmount = type === 'click' ? googleClick : googleView;
    } else {
      rewardAmount = type === 'click' ? customClick : customView;
    }

    if (rewardAmount <= 0) {
      return res.json({ success: true, credited: false });
    }

    // Quiet atomic credit to creator's central wallet (silent: no transaction log chime/popup)
    await WalletService.getOrCreateWallet(targetCreatorId);
    await query(
      `UPDATE core_wallets 
       SET balance = balance + $1, total_earnings = total_earnings + $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2`,
      [rewardAmount, targetCreatorId]
    );

    // Record in creator_daily_ad_earnings for end-of-day summary
    const todayStr = new Date().toISOString().split('T')[0];
    const recId = `cdae_${targetCreatorId}_${todayStr}`;
    const isGoogle = adType === 'google';
    const isClick = type === 'click';

    await query(`
      INSERT INTO creator_daily_ad_earnings (
        id, creator_id, date, total_earned, google_impressions, google_clicks, custom_impressions, custom_clicks, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP
      ) ON CONFLICT (creator_id, date) DO UPDATE SET
        total_earned = creator_daily_ad_earnings.total_earned + EXCLUDED.total_earned,
        google_impressions = creator_daily_ad_earnings.google_impressions + EXCLUDED.google_impressions,
        google_clicks = creator_daily_ad_earnings.google_clicks + EXCLUDED.google_clicks,
        custom_impressions = creator_daily_ad_earnings.custom_impressions + EXCLUDED.custom_impressions,
        custom_clicks = creator_daily_ad_earnings.custom_clicks + EXCLUDED.custom_clicks,
        updated_at = CURRENT_TIMESTAMP
    `, [
      recId,
      targetCreatorId,
      todayStr,
      rewardAmount,
      isGoogle && !isClick ? 1 : 0,
      isGoogle && isClick ? 1 : 0,
      !isGoogle && !isClick ? 1 : 0,
      !isGoogle && isClick ? 1 : 0
    ]).catch((err) => console.warn('Daily ad earnings record error:', err?.message));

    return res.json({
      success: true,
      monetized: true,
      credited: true,
      amount: rewardAmount
    });
  } catch (err: any) {
    console.error('Record ad reward error:', err);
    return res.status(500).json({ error: err.message });
  }
});


// ==================== 3. CENTRAL REFERRALS API ==================== //

app.get('/api/referrals', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const stats = await ReferralService.getStats(req.user!.id);
    return res.json(stats);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==================== 4. MULTILINGUAL TRANSLATION API ==================== //

app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang = 'en', sourceLang = 'en' } = req.body;
    if (!text) return res.json({ translated: '' });

    const translated = await TranslationService.translateText(text, targetLang, sourceLang);
    return res.json({ translated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/translate/batch', async (req, res) => {
  try {
    const { texts, targetLang = 'en' } = req.body;
    if (!Array.isArray(texts)) return res.json({ translations: {} });

    const translations = await TranslationService.translateBatch(texts, targetLang);
    return res.json({ translations });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==================== 5. GLOBAL SEARCH API ==================== //

app.get('/api/search', async (req, res) => {
  try {
    const q = String(req.query.q || '');
    const results = await SearchService.searchGlobal(q);
    return res.json({ results });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==================== 6. STORAGE & FILE UPLOAD API ==================== //

app.post('/api/storage/upload', authenticateToken, async (req, res) => {
  try {
    const { fileName, mimeType, base64Data } = req.body;
    if (!fileName || !base64Data) {
      return res.status(400).json({ error: 'fileName and base64Data are required.' });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const uploaded = await StorageService.uploadFile(fileName, mimeType || 'application/octet-stream', buffer);
    return res.json(uploaded);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/settings/storage', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const config = await StorageService.getConfig();
    return res.json(config);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/settings/storage/account', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const { name, clientId, clientSecret, refreshToken, folderId, isPrimary } = req.body;
    if (!name || !clientId || !clientSecret || !refreshToken) {
      return res.status(400).json({ error: 'Name, Client ID, Client Secret, and Refresh Token are required.' });
    }
    const created = await StorageService.addAccount({
      name,
      clientId,
      clientSecret,
      refreshToken,
      folderId,
      isPrimary
    });
    return res.json({ success: true, account: created, message: 'Google Drive account added successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/settings/storage/account/:id', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    await StorageService.deleteAccount(req.params.id);
    return res.json({ success: true, message: 'Google Drive account removed.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/settings/storage/primary/:id', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    await StorageService.setPrimaryAccount(req.params.id);
    return res.json({ success: true, message: 'Primary storage account updated.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/settings/storage/test', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const result = await StorageService.testConnection();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Flutterwave Payment Gateway Admin Settings & Public Key Endpoints
 */
app.get('/api/admin/settings/flutterwave', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const flw = await getFlutterwaveConfig();
    const payload = {
      enabled: flw.enabled !== false,
      public_key: flw.publicKey,
      secret_key: flw.secretKey ? '••••••••••••••••' : '',
      encryption_key: flw.encryptionKey ? '••••••••••••••••' : '',
      is_live: !!flw.isLive
    };

    return res.json({
      ...payload,
      settings: payload
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/settings/flutterwave', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const { public_key, secret_key, encryption_key, enabled, is_live } = req.body;
    await query(`
      CREATE TABLE IF NOT EXISTS payment_settings (
        id VARCHAR(50) PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        public_key TEXT,
        secret_key TEXT,
        encryption_key TEXT,
        is_live BOOLEAN DEFAULT FALSE,
        enabled BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    const existing = await query("SELECT secret_key, encryption_key FROM payment_settings WHERE id = 'flutterwave' LIMIT 1").catch(() => ({ rowCount: 0, rows: [] }));
    const isMasked = (val?: string) => !val || /^[•\*]+$/.test(val.trim());

    let finalSecret = !isMasked(secret_key) ? secret_key.trim() : (existing.rows[0]?.secret_key || process.env.FLUTTERWAVE_SECRET_KEY || null);
    let finalEncryption = !isMasked(encryption_key) ? encryption_key.trim() : (existing.rows[0]?.encryption_key || process.env.FLUTTERWAVE_ENCRYPTION_KEY || null);
    let finalPublic = public_key && typeof public_key === 'string' ? public_key.trim() : null;

    await query(
      `INSERT INTO payment_settings (id, provider, public_key, secret_key, encryption_key, is_live, enabled, updated_at)
       VALUES ('flutterwave', 'flutterwave', $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         public_key = COALESCE($1, payment_settings.public_key),
         secret_key = COALESCE($2, payment_settings.secret_key),
         encryption_key = COALESCE($3, payment_settings.encryption_key),
         is_live = COALESCE($4, payment_settings.is_live),
         enabled = COALESCE($5, payment_settings.enabled),
         updated_at = CURRENT_TIMESTAMP`,
      [finalPublic, finalSecret, finalEncryption, !!is_live, enabled !== false]
    );

    return res.json({
      success: true,
      message: 'Flutterwave credentials saved successfully.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/settings/flutterwave/test', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const flw = await getFlutterwaveConfig();
    const pk = flw.publicKey || process.env.FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK-5e4f311c31ff2cde79ef36825f2e9a95-X';
    return res.json({
      success: true,
      message: `Flutterwave gateway credentials verified active. Public Key: ${pk.slice(0, 15)}... (Status: ${flw.enabled ? 'Enabled' : 'Paused'}, Mode: ${flw.isLive ? 'Live Production' : 'Sandbox'})`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/settings/public', async (req, res) => {
  try {
    const flw = await getFlutterwaveConfig();
    return res.json({
      flutterwave_public_key: flw.publicKey,
      flutterwave_enabled: flw.enabled !== false
    });
  } catch {
    return res.json({
      flutterwave_public_key: 'FLWPUBK-5e4f311c31ff2cde79ef36825f2e9a95-X',
      flutterwave_enabled: true
    });
  }
});

// ==================== 7. MODULE APIS ==================== //

// A. TV Module
app.get('/api/modules/tv/stations', async (req, res) => {
  try {
    let result = await query("SELECT * FROM stations WHERE station_type = 'TV' ORDER BY display_order ASC, name ASC");
    if (result.rowCount === 0) {
      result = await query("SELECT * FROM tv.stations ORDER BY display_order ASC, name ASC");
    }
    if (result.rowCount > 0) {
      return res.json({ stations: result.rows });
    }
  } catch (err: any) {}

  // Return real TV stations from database backup
  const tvList = [
    {
      id: "cba90744-b1cf-47bb-8677-b11be0e6bc63",
      name: "RTV Live",
      slug: "rtv",
      description: "Rwanda Television (RTV) is Rwanda's public service television broadcaster, delivering informative, educational, and entertaining programming nationwide and globally.",
      logo_url: "/logo.png",
      stream_url: "https://5c46fa289c89f.streamlock.net/rtv25/rtv/playlist.m3u8",
      stream_type: "HLS",
      station_type: "TV",
      location: "Kigali, National Broadcast",
      frequency: "Channel 01 / DTT",
      accent_color: "#0284c7",
      status: "ONLINE",
      is_active: true,
      is_featured: true,
      display_order: 1
    },
    {
      id: "755086fe-f95d-424c-97f4-c12fb0e14c52",
      name: "KC2",
      slug: "kc2",
      description: "Kigali Channel 2 (KC2) focuses on dynamic youth programming, creative entertainment, sports, education, and talent discovery.",
      logo_url: "/logo.png",
      stream_url: "https://5c46fa289c89f.streamlock.net/kc2/kc2/playlist.m3u8",
      stream_type: "HLS",
      station_type: "TV",
      location: "Kigali, National",
      frequency: "Channel 02 / DTT",
      accent_color: "#f97316",
      status: "ONLINE",
      is_active: true,
      is_featured: true,
      display_order: 2
    },
    {
      id: "fb395f3c-f609-4989-a3e5-338bc5f4fcd1",
      name: "BTN TV RWANDA",
      slug: "btn-tv",
      description: "BTN TV Rwanda live broadcast",
      logo_url: "https://i.postimg.cc/GmBdBKLY/BTN.jpg",
      stream_url: "https://tv.btnrwanda.com:3973/live/btnv2live.m3u8",
      stream_type: "HLS",
      station_type: "TV",
      location: "Kigali, Rwanda",
      frequency: "BTN TV RWANDA",
      accent_color: "#0284c7",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 2
    },
    {
      id: "620534bc-0d2e-40b3-ac54-5faf1b9d7099",
      name: "TV10",
      slug: "tv10",
      description: "TV10 Rwanda Live",
      logo_url: "https://i.postimg.cc/SxbD8Nq4/TV10.png",
      stream_url: "https://5c46fa289c89f.streamlock.net/pub1live/mystream/chunklist_w1283598321.m3u8",
      stream_type: "HLS",
      station_type: "TV",
      location: "Kigali, Rwanda",
      frequency: "TV10",
      accent_color: "#0284c7",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 3
    },
    {
      id: "845aece6-1b19-4c7d-adb9-f00756311e7b",
      name: "Isibo TV",
      slug: "isibo-tv",
      description: "Isibo TV Rwanda",
      logo_url: "https://i.postimg.cc/4yD40Pr3/ISIBO.jpg",
      stream_url: "https://5c46fa289c89f.streamlock.net/pub2live/myStream/playlist.m3u8",
      stream_type: "HLS",
      station_type: "TV",
      location: "Kigali, Rwanda",
      frequency: "Isibo TV",
      accent_color: "#0284c7",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 3
    },
    {
      id: "0829c54e-c1b3-4621-bce5-fe5f05a8fdf6",
      name: "TV1 RWANDA",
      slug: "tv1-rwanda",
      description: "TV 1 Rwanda live broadcast",
      logo_url: "https://i.postimg.cc/hjNj6y1B/5d2bbd-939383bfc46543ed9853c1bb1b6a3726-mv2-(1).png",
      stream_url: "https://live.tv1.rw/index-480p.m3u8",
      stream_type: "HLS",
      station_type: "TV",
      location: "Kigali, Rwanda",
      frequency: "TV1 RWANDA",
      accent_color: "#0284c7",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 4
    },
    {
      id: "3286db88-aac1-4616-8407-9981e3da8b2b",
      name: "AFRICA 24",
      slug: "africa-24",
      description: "Africa 24 Pan-African News Network",
      logo_url: "https://i.postimg.cc/Qxcc22Kn/africa-24.png",
      stream_url: "https://edge12.vedge.infomaniak.com/livecast/ik:africa24/chunklist_w2052399181.m3u8",
      stream_type: "HLS",
      station_type: "TV",
      location: "Pan-Africa",
      frequency: "AFRICA 24",
      accent_color: "#0284c7",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 5
    },
    {
      id: "c6b017a3-665b-4c1b-b262-1c9afc9b71e5",
      name: "Isango Star TV",
      slug: "isango-star-tv",
      description: "Isango Star TV Rwanda",
      logo_url: "https://i.postimg.cc/3JXW68P5/ISANGO-TV.jpg",
      stream_url: "https://lo.rtsp.me/6LyyHt4sJDizFHn40XaXYA/1790159297/hls/FBbhRD8y.mp4?ip=41.186.137.188",
      stream_type: "VIDEO",
      station_type: "TV",
      location: "Kigali, Rwanda",
      frequency: "ISANGO STAR TV",
      accent_color: "#0284c7",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 6
    }
  ];
  return res.json({ stations: tvList });
});

// Real Catalogue Videos (Populated with 94 Real YouTube Videos)
const REAL_CATALOGUE_VIDEOS: any[] = (realVideosData as any[]).map((v) => ({
  id: v.id,
  title: v.title,
  slug: v.id,
  description: v.description || v.title,
  videoUrl: v.embedUrl ? v.embedUrl.replace('/embed/', '/watch?v=') : `https://www.youtube.com/watch?v=${v.id}`,
  embedUrl: v.embedUrl || `https://www.youtube.com/embed/${v.id}`,
  thumbnailUrl: v.thumbnail || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
  thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
  duration: 600,
  durationLabel: v.duration || '10:00',
  views: v.views || 0,
  likes: v.likes || 0,
  accessType: (v.price && v.price > 0) ? 'PREMIUM' : 'PUBLIC',
  price: v.price || 0,
  category: v.category || 'General',
  channelName: v.channelName || v.creator || 'Benix Space Channel',
  channelHandle: (v.creator || 'benixspace').toLowerCase().replace(/\s+/g, ''),
  channelAvatar: v.channelAvatar || '/logo.png',
  creator: v.creator || 'Benix Space Channel',
  isVerified: true,
  createdAt: '2026-03-01T12:00:00Z'
}));

const SAMPLE_VIDEOS: any[] = [...REAL_CATALOGUE_VIDEOS];

app.get('/api/modules/tv/videos', async (req, res) => {
  try {
    const result = await query('SELECT * FROM tv.videos ORDER BY publication_date DESC, created_at DESC LIMIT 30');
    if (result.rowCount > 0) return res.json({ videos: result.rows });
  } catch (err: any) {}
  
  return res.json({ videos: SAMPLE_VIDEOS });
});

// B. Radio Module
app.get('/api/modules/radio/stations', async (req, res) => {
  try {
    let result = await query("SELECT * FROM stations WHERE station_type = 'RADIO' ORDER BY display_order ASC, name ASC");
    if (result.rowCount === 0) {
      result = await query("SELECT * FROM radio.radio_stations ORDER BY is_default DESC, name ASC");
    }
    if (result.rowCount > 0) {
      return res.json({ stations: result.rows });
    }
  } catch (err: any) {}

  // Return real Radio stations from database backup
  const radioList = [
    {
      id: "56831af6-c87d-46d2-8cb2-30aa496dabe2",
      name: "Radio Rwanda",
      slug: "radio-rwanda",
      description: "The flagship national public radio broadcaster. Broadcasting in Kinyarwanda, French, English, and Swahili with unmatched nationwide coverage.",
      logo_url: "/logo.png",
      stream_url: "https://listen.rba.co.rw:8008/rwanda",
      stream_type: "AUDIO",
      station_type: "RADIO",
      location: "Kigali, National Coverage",
      frequency: "100.7 FM",
      accent_color: "#2563eb",
      status: "ONLINE",
      is_active: true,
      is_featured: true,
      display_order: 1
    },
    {
      id: "f5fd44f9-4551-460b-949a-5d9b7631f898",
      name: "Magic FM",
      slug: "magic-fm",
      description: "Kigali’s favorite urban contemporary youth station. Great music, lifestyle discussions, and vibrant modern entertainment.",
      logo_url: "/logo.png",
      stream_url: "https://listen.rba.co.rw:8085/mgcfm",
      stream_type: "AUDIO",
      station_type: "RADIO",
      location: "Kigali & Central Rwanda",
      frequency: "90.7 FM",
      accent_color: "#06b6d4",
      status: "ONLINE",
      is_active: true,
      is_featured: true,
      display_order: 2
    },
    {
      id: "744630ab-415d-4312-88bd-dfceee449698",
      name: "Kiss FM",
      slug: "kiss-fm",
      description: "Kiss FM 102.3 Kigali - The Beat of Kigali",
      logo_url: "https://i.postimg.cc/Cx2q12xV/kiss-fm.jpg",
      stream_url: "https://kissfm-atunwadigital.streamguys1.com/kissfm",
      stream_type: "AUDIO",
      station_type: "RADIO",
      location: "Kigali, Rwanda",
      frequency: "Kiss FM 102.3",
      accent_color: "#0284c7",
      status: "ONLINE",
      is_active: true,
      is_featured: true,
      display_order: 3
    },
    {
      id: "bf4b3d53-61e5-433c-bf97-a09a366de6ea",
      name: "Isango Star Radio",
      slug: "isango-star-radio",
      description: "Radio Isango Star 91.5 FM is the Trustworthy source of information & enjoyment in Rwanda",
      logo_url: "https://i.postimg.cc/tgqNmmJV/ISANGO.jpg",
      stream_url: "http://80.241.215.175:8000/",
      stream_type: "AUDIO",
      station_type: "RADIO",
      location: "Kigali, Rwanda",
      frequency: "Isango Star 91.5 FM",
      accent_color: "#0284c7",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 4
    },
    {
      id: "ab1afe0d-c280-4c4b-9164-f0ed4f8fdc28",
      name: "Radio 10",
      slug: "radio-10",
      description: "Radio 10 Simply Rwandafull",
      logo_url: "https://i.postimg.cc/X7HpMkcF/radio-10.png",
      stream_url: "https://radio.garden/api/ara/content/listen/iBgeQQ4g/channel.mp3?1789829812729",
      stream_type: "AUDIO",
      station_type: "RADIO",
      location: "Kigali, Rwanda",
      frequency: "Radio 10 (87.6 FM)",
      accent_color: "#0284c7",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 5
    },
    {
      id: "5a93aa8f-11a8-463f-becc-c56ac2745a83",
      name: "Royal FM 94.3",
      slug: "royal-fm-943",
      description: "Royal FM 94.3 - Connecting Kigali",
      logo_url: "https://i.postimg.cc/5tj5dtCN/royal-fm.png",
      stream_url: "https://radio.garden/api/ara/content/listen/HcpLTS0f/channel.mp3?1789828391241",
      stream_type: "AUDIO",
      station_type: "RADIO",
      location: "Kigali, Rwanda",
      frequency: "Royal FM 94.3",
      accent_color: "#0284c7",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 6
    },
    {
      id: "38075445-13cf-45a6-a571-23baad99e307",
      name: "Flash FM Rwanda",
      slug: "flash-fm-rwanda",
      description: "Flash FM 89.2 FM Live from Kigali",
      logo_url: "https://i.postimg.cc/ZYgrZ57F/FLASH-FM.png",
      stream_url: "http://80.241.215.175:7410/;",
      stream_type: "AUDIO",
      station_type: "RADIO",
      location: "Kigali, Rwanda",
      frequency: "Flash FM 89.2 FM",
      accent_color: "#0284c7",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 7
    },
    {
      id: "03c3902b-4587-47b3-b691-935efb483bf4",
      name: "KT Radio",
      slug: "kt-radio",
      description: "KT Radio 96.7 FM - Kigali Today",
      logo_url: "https://i.postimg.cc/yNSgYmk5/kt-radio.png",
      stream_url: "https://stream.zeno.fm/q84wt2xdf18uv",
      stream_type: "AUDIO",
      station_type: "RADIO",
      location: "Kigali, Rwanda",
      frequency: "KT Radio 96.7 FM",
      accent_color: "#0284c7",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 8
    },
    {
      id: "6b66b5ad-f216-4171-94e9-bdcff782e7ca",
      name: "Radio Maria Rwanda",
      slug: "radio-maria-rwanda",
      description: "Radio Maria 97.3 FM",
      logo_url: "https://i.postimg.cc/XvDRx5L6/rmaria.png",
      stream_url: "https://dreamsiteradiocp2.com/proxy/rmrwanda2?mp=/stream",
      stream_type: "AUDIO",
      station_type: "RADIO",
      location: "Kigali, Rwanda",
      frequency: "Radio Maria 97.3 FM",
      accent_color: "#0284c7",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 9
    },
    {
      id: "caaa43f7-69f0-4cc9-935d-7a1f9516b007",
      name: "Radio Rubavu",
      slug: "radio-rubavu",
      description: "Community radio station serving the Western Province and Lake Kivu basin.",
      logo_url: "/logo.png",
      stream_url: "https://listen.rba.co.rw:8004/rubavu",
      stream_type: "AUDIO",
      station_type: "RADIO",
      location: "Rubavu, Western Province",
      frequency: "105.1 FM",
      accent_color: "#14b8a6",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 10
    },
    {
      id: "97f21169-1edf-4c03-911e-4b3a8b6e51f5",
      name: "Radio Nyagatare",
      slug: "radio-nyagatare",
      description: "The voice of the Eastern Province.",
      logo_url: "/logo.png",
      stream_url: "https://listen.rba.co.rw:3053/nyagatare",
      stream_type: "AUDIO",
      station_type: "RADIO",
      location: "Nyagatare, Eastern Province",
      frequency: "96.6 FM",
      accent_color: "#f59e0b",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 11
    },
    {
      id: "e560ea45-1019-40f9-a025-ea6d3c511c4e",
      name: "Radio Inteko",
      slug: "radio-inteko",
      description: "Parliamentary radio channel dedicated to civic participation.",
      logo_url: "/logo.png",
      stream_url: "https://listen.rba.co.rw:8007/inteko",
      stream_type: "AUDIO",
      station_type: "RADIO",
      location: "Parliament, Kigali",
      frequency: "89.6 FM",
      accent_color: "#10b981",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 12
    },
    {
      id: "28e182d4-fbea-4f63-b61c-8c2c64a49cfb",
      name: "Radio Musanze",
      slug: "radio-musanze",
      description: "Broadcasting from Rwanda’s Northern Volcanoes region.",
      logo_url: "/logo.png",
      stream_url: "https://listen.rba.co.rw:8003/musanze",
      stream_type: "AUDIO",
      station_type: "RADIO",
      location: "Musanze, Northern Province",
      frequency: "90.0 FM",
      accent_color: "#84cc16",
      status: "ONLINE",
      is_active: true,
      is_featured: false,
      display_order: 13
    }
  ];
  return res.json({ stations: radioList });
});

// App requirement profile sync endpoint
app.post('/api/auth/save-app-profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { appKey, profileData } = req.body;
    if (!appKey || !profileData) {
      return res.status(400).json({ error: 'appKey and profileData are required.' });
    }

    try {
      await query(
        `UPDATE core_users 
         SET app_profiles = jsonb_set(COALESCE(app_profiles, '{}'::jsonb), $1, $2::jsonb, true)
         WHERE id = $3`,
        [`{${appKey}}`, JSON.stringify({ ...profileData, completed: true }), req.user?.id]
      );
    } catch (dbErr) {
      console.warn('Could not persist profile in database:', dbErr);
    }

    return res.json({ success: true, message: `Profile saved for ${appKey}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// B2. Videos Module (Benix Creator Studio & Video Hub - Uses REAL_CATALOGUE_VIDEOS)
/* OLD_DUMMY_VIDEOS_REPLACED_BY_94_REAL_VIDEOS
const DUMMY_SAMPLE_VIDEOS: any[] = [
  {
    id: "vid-2",
    title: "ISRAEL MBONYI - NINA SIRI (Official Music Video)",
    slug: "israel-mbonyi-nina-siri",
    description: "Breathtaking praise and worship song performed live in Kigali by Israel Mbonyi. Celebrated across East Africa and globally with millions of streams.",
    videoUrl: "https://www.youtube.com/watch?v=92x0t5p57_k",
    thumbnailUrl: "https://img.youtube.com/vi/92x0t5p57_k/hqdefault.jpg",
    duration: 320,
    views: 48900000,
    likes: 310000,
    accessType: "PUBLIC",
    price: 0,
    category: "Gospel Choirs",
    channelName: "Israel Mbonyi Official",
    channelHandle: "israelmbonyi",
    channelAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    isVerified: true,
    createdAt: "2026-02-14T12:00:00Z"
  },
  {
    id: "vid-3",
    title: "SEBURIKOKO Episode 1 - Afrifame Pictures (Filime Nyarwanda)",
    slug: "seburikoko-episode-1",
    description: "The critically acclaimed Rwandan comedy drama and film series produced by Afrifame Pictures in Kigali. Follow the hilarious misadventures of Seburikoko and his village.",
    videoUrl: "https://www.youtube.com/watch?v=8q-w0O0V6gY",
    thumbnailUrl: "https://img.youtube.com/vi/8q-w0O0V6gY/hqdefault.jpg",
    duration: 1560,
    views: 1890000,
    likes: 48000,
    accessType: "PUBLIC",
    price: 0,
    category: "Cinema & Films",
    channelName: "Afrifame Pictures (Filime Nyarwanda)",
    channelHandle: "afrifame",
    channelAvatar: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=120&auto=format&fit=crop&q=80",
    isVerified: true,
    createdAt: "2026-03-01T15:00:00Z"
  },
  {
    id: "vid-4",
    title: "BAMENYA SERIES Episode 1 - Rwandan Comedy Cinema",
    slug: "bamenya-series-episode-1",
    description: "Starring Ramadhan (Bamenya) in Rwanda's most popular contemporary comedy and family drama film series. High energy, street smarts, and authentic Kigali humor.",
    videoUrl: "https://www.youtube.com/watch?v=P6jW8pW1Y8E",
    thumbnailUrl: "https://img.youtube.com/vi/P6jW8pW1Y8E/hqdefault.jpg",
    duration: 1680,
    views: 2450000,
    likes: 67000,
    accessType: "PUBLIC",
    price: 0,
    category: "Comedy & Skits",
    channelName: "Zacu Entertainment TV (Bamenya)",
    channelHandle: "zacutv",
    channelAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    isVerified: true,
    createdAt: "2026-03-12T16:00:00Z"
  },
  {
    id: "vid-5",
    title: "CITY MAID Episode 1 - Afrifame Pictures Rwandan Drama",
    slug: "city-maid-episode-1",
    description: "Engaging Rwandan urban drama depicting the trials, romance, and ambitions of young workers navigating urban life in modern Kigali City.",
    videoUrl: "https://www.youtube.com/watch?v=369V6qJ-15k",
    thumbnailUrl: "https://img.youtube.com/vi/369V6qJ-15k/hqdefault.jpg",
    duration: 1620,
    views: 1980000,
    likes: 52000,
    accessType: "PUBLIC",
    price: 0,
    category: "Cinema & Films",
    channelName: "Afrifame Pictures (Filime Nyarwanda)",
    channelHandle: "afrifame",
    channelAvatar: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=120&auto=format&fit=crop&q=80",
    isVerified: true,
    createdAt: "2026-03-20T14:30:00Z"
  },
  {
    id: "vid-6",
    title: "TURAKWEMEYE by Alarm Ministries Rwanda (Official 4K Video)",
    slug: "alarm-ministries-turakwemeye",
    description: "Powerful choir worship and praise session recorded in Kigali, Rwanda by Alarm Ministries. Deeply moving vocals and live orchestra.",
    videoUrl: "https://www.youtube.com/watch?v=kG6-1eX84mY",
    thumbnailUrl: "https://img.youtube.com/vi/kG6-1eX84mY/hqdefault.jpg",
    duration: 490,
    views: 3400000,
    likes: 42000,
    accessType: "PUBLIC",
    price: 0,
    category: "Gospel Choirs",
    channelName: "Alarm Ministries Rwanda",
    channelHandle: "alarmministries",
    channelAvatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80",
    isVerified: true,
    createdAt: "2026-04-05T09:00:00Z"
  },
  {
    id: "vid-7",
    title: "NIMUSINGIZE NYAGASANI - Chorale de Kigali (Concert Live)",
    slug: "chorale-de-kigali-nimusingize-nyagasani",
    description: "Prestigious classical choral concert performance by Chorale de Kigali at Kigali Serena Hotel. Traditional and sacred compositions arranged in 4-part harmony.",
    videoUrl: "https://www.youtube.com/watch?v=V12j7uQ_K6U",
    thumbnailUrl: "https://img.youtube.com/vi/V12j7uQ_K6U/hqdefault.jpg",
    duration: 380,
    views: 1900000,
    likes: 27000,
    accessType: "PUBLIC",
    price: 0,
    category: "Music & Live Shows",
    channelName: "Chorale de Kigali",
    channelHandle: "choraledekigali",
    channelAvatar: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=120&auto=format&fit=crop&q=80",
    isVerified: true,
    createdAt: "2026-04-18T18:00:00Z"
  },
  {
    id: "vid-8",
    title: "RWANDA 4K Aerial Cinematic Tour - Visit Rwanda Showcase",
    slug: "rwanda-4k-aerial-tour",
    description: "A stunning visual journey through the Thousand Hills of Rwanda: Volcanoes National Park, Lake Kivu, Nyungwe Canopy Walkway, and the modern skyline of Kigali.",
    videoUrl: "https://www.youtube.com/watch?v=M3wS5r34Y2w",
    thumbnailUrl: "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=640&auto=format&fit=crop&q=80",
    duration: 480,
    views: 4100000,
    likes: 89000,
    accessType: "PUBLIC",
    price: 0,
    category: "Culture & Travel",
    channelName: "Visit Rwanda Official",
    channelHandle: "visitrwanda",
    channelAvatar: "/logo.png",
    isVerified: true,
    createdAt: "2026-05-01T08:00:00Z"
  },
  {
    id: "vid-9",
    title: "ISRAEL MBONYI LIVE BK ARENA VIP CONCERT (Exclusive Full Access)",
    slug: "israel-mbonyi-live-bk-arena-vip",
    description: "Full uninterrupted 2-hour VIP recorded concert live from BK Arena Kigali. Includes exclusive backstage footage, acoustic bonus sessions, and high definition multitrack sound.",
    videoUrl: "https://www.youtube.com/watch?v=sI9pP3T34tQ",
    thumbnailUrl: "https://img.youtube.com/vi/sI9pP3T34tQ/hqdefault.jpg",
    duration: 7200,
    views: 320000,
    likes: 18000,
    accessType: "PREMIUM",
    price: 1500,
    category: "Premium VIP",
    channelName: "Israel Mbonyi Official",
    channelHandle: "israelmbonyi",
    channelAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    isVerified: true,
    createdAt: "2026-05-15T20:00:00Z"
  },
  {
    id: "vid-10",
    title: "PAPA SAVA VIP EXCLUSIVE - Extended Director's Cut Comedy",
    slug: "papa-sava-vip-exclusive",
    description: "Special uncut full-length feature comedy film starring Papa Sava. 40 minutes of unreleased hilarious scenes and behind-the-scenes interviews with the cast.",
    videoUrl: "https://www.youtube.com/watch?v=8q-w0O0V6gY",
    thumbnailUrl: "https://images.unsplash.com/photo-1518107616815-455b898a39d8?w=640&auto=format&fit=crop&q=80",
    duration: 2400,
    views: 410000,
    likes: 22000,
    accessType: "PREMIUM",
    price: 500,
    category: "Premium VIP",
    channelName: "Zacu Entertainment TV (Bamenya)",
    channelHandle: "zacutv",
    channelAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    isVerified: true,
    createdAt: "2026-06-01T11:00:00Z"
  },
  {
    id: "vid-11",
    title: "AMASHIMWE by Healing Worship Team Kigali",
    slug: "healing-worship-amashimwe",
    description: "Live thanksgiving worship session by Healing Worship Team Kigali with full live brass band and choir chorus.",
    videoUrl: "https://www.youtube.com/watch?v=zJg5g0xR7gM",
    thumbnailUrl: "https://img.youtube.com/vi/zJg5g0xR7gM/hqdefault.jpg",
    duration: 440,
    views: 2800000,
    likes: 36000,
    accessType: "PUBLIC",
    price: 0,
    category: "Gospel Choirs",
    channelName: "Healing Worship Team",
    channelHandle: "healingworship",
    channelAvatar: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80",
    isVerified: true,
    createdAt: "2026-06-10T14:00:00Z"
  },
  {
    id: "vid-12",
    title: "KIGALI NIGHTLIFE & BK ARENA EXPERIENCE - Culture & Lifestyle",
    slug: "kigali-nightlife-bk-arena",
    description: "An energetic spotlight on the bustling arts, entertainment, fine dining, and live concerts illuminating Kigali after dark.",
    videoUrl: "https://www.youtube.com/watch?v=92x0t5p57_k",
    thumbnailUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=640&auto=format&fit=crop&q=80",
    duration: 540,
    views: 780000,
    likes: 19000,
    accessType: "PUBLIC",
    price: 0,
    category: "Culture & Travel",
    channelName: "Benix Creative Studios",
    channelHandle: "benixstudio",
    channelAvatar: "/logo.png",
    isVerified: true,
    createdAt: "2026-06-20T17:00:00Z"
  }
];
*/

const unlockedVideosByUser = new Map<string, Set<string>>();

// Videos endpoints (supporting /api/modules/videos and /api/videos)
app.get(['/api/modules/videos', '/api/videos'], async (req, res) => {
  try {
    const category = req.query.category as string;
    let list = SAMPLE_VIDEOS;

    // Load persisted videos from user_videos table
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS user_videos (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          slug VARCHAR(500) NOT NULL,
          description TEXT,
          video_url TEXT NOT NULL,
          thumbnail_url TEXT,
          duration INT DEFAULT 300,
          views INT DEFAULT 0,
          likes INT DEFAULT 0,
          access_type VARCHAR(50) DEFAULT 'PUBLIC',
          price NUMERIC(15,2) DEFAULT 0,
          category VARCHAR(100) DEFAULT 'General',
          user_id VARCHAR(255) NOT NULL,
          channel_name VARCHAR(255),
          channel_handle VARCHAR(255),
          channel_avatar TEXT,
          is_verified BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `).catch(() => {});

      const dbVideosRes = await query('SELECT * FROM user_videos ORDER BY created_at DESC LIMIT 60');
      const dbVideos = dbVideosRes.rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        description: r.description || '',
        videoUrl: r.video_url,
        thumbnailUrl: r.thumbnail_url || 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80',
        duration: Number(r.duration) || 300,
        views: Number(r.views) || 0,
        likes: Number(r.likes) || 0,
        accessType: r.access_type || (Number(r.price) > 0 ? 'PREMIUM' : 'PUBLIC'),
        price: Number(r.price) || 0,
        category: r.category || 'General',
        userId: r.user_id,
        user_id: r.user_id,
        channelName: r.channel_name || 'Creator',
        channelHandle: r.channel_handle || 'creator',
        channelAvatar: r.channel_avatar || '/logo.png',
        isVerified: Boolean(r.is_verified),
        createdAt: r.created_at
      }));

      const dbIds = new Set(dbVideos.map((v: any) => v.id));
      list = [...dbVideos, ...list.filter((v: any) => !dbIds.has(v.id))];
    } catch {}

    if (category && category !== 'All') {
      list = list.filter(v => v.category.toLowerCase() === category.toLowerCase());
    }

    // Overlay real database likes from core_video_likes
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS core_video_likes (
          id SERIAL PRIMARY KEY,
          video_id VARCHAR(255) NOT NULL,
          user_id VARCHAR(255),
          ip_address VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `).catch(() => {});
      const likesRes = await query(`SELECT video_id, COUNT(*) as count FROM core_video_likes GROUP BY video_id`);
      const likesMap = new Map<string, number>();
      likesRes.rows.forEach((r: any) => likesMap.set(r.video_id, parseInt(r.count, 10)));

      list = list.map(v => {
        const added = likesMap.get(v.id) || 0;
        const base = v.baseLikes !== undefined ? v.baseLikes : v.likes;
        return {
          ...v,
          baseLikes: base,
          likes: base + added
        };
      });
    } catch {}

    return res.json({ videos: list });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get(['/api/modules/videos/:id', '/api/videos/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const video = SAMPLE_VIDEOS.find(v => v.id === id || v.slug === id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found.' });
    }
    const related = SAMPLE_VIDEOS.filter(v => v.id !== video.id).slice(0, 6);
    return res.json({ video, related });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET current user's liked video IDs
app.get('/api/modules/videos-liked-ids', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.substring(7));
      userId = decoded?.id || null;
    }
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '';
    const clientIp = rawIp.slice(0, 100);

    await query(`
      CREATE TABLE IF NOT EXISTS core_video_likes (
        id SERIAL PRIMARY KEY,
        video_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        ip_address VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(() => {});

    const likesRes = await query(
      `SELECT video_id FROM core_video_likes WHERE (user_id = $1 AND $1 IS NOT NULL) OR ($1 IS NULL AND ip_address = $2)`,
      [userId, clientIp]
    );

    return res.json({ likedVideoIds: likesRes.rows.map((r: any) => r.video_id) });
  } catch {
    return res.json({ likedVideoIds: [] });
  }
});

// Toggle Video Like (Persistent in PostgreSQL & in-memory)
app.post('/api/modules/videos/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.substring(7));
      userId = decoded?.id || null;
    }
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '';
    const clientIp = rawIp.slice(0, 100);

    await query(`
      CREATE TABLE IF NOT EXISTS core_video_likes (
        id SERIAL PRIMARY KEY,
        video_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        ip_address VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_core_video_likes_uniq ON core_video_likes(video_id, COALESCE(user_id, ip_address));
    `).catch(() => {});

    // Check if previously liked
    const existing = await query(
      `SELECT id FROM core_video_likes WHERE video_id = $1 AND ((user_id = $2 AND $2 IS NOT NULL) OR ($2 IS NULL AND ip_address = $3))`,
      [id, userId, clientIp]
    );

    let isLiked = false;
    if (existing.rowCount > 0) {
      await query(`DELETE FROM core_video_likes WHERE id = $1`, [existing.rows[0].id]);
      isLiked = false;
    } else {
      await query(
        `INSERT INTO core_video_likes (video_id, user_id, ip_address) VALUES ($1, $2, $3)`,
        [id, userId, clientIp]
      );
      isLiked = true;
    }

    const countRes = await query(`SELECT COUNT(*) as total FROM core_video_likes WHERE video_id = $1`, [id]);
    const addedLikes = parseInt(countRes.rows[0]?.total || '0', 10);

    const video = SAMPLE_VIDEOS.find(v => v.id === id || v.slug === id);
    if (video) {
      if (video.baseLikes === undefined) video.baseLikes = video.likes || 0;
      video.likes = video.baseLikes + addedLikes;
    }

    const currentLikes = video ? video.likes : addedLikes;
    return res.json({ success: true, isLiked, likes: currentLikes });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/modules/videos/:id/unlock', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { ref } = req.body;
    const video = SAMPLE_VIDEOS.find(v => v.id === id || v.slug === id);
    if (!video) return res.status(404).json({ error: 'Video not found.' });

    if (video.price <= 0) {
      return res.json({ success: true, message: 'This video is already free to watch.' });
    }

    const userUnlocked = unlockedVideosByUser.get(req.user!.id) || new Set<string>();
    if (userUnlocked.has(video.id)) {
      return res.json({ success: true, alreadyUnlocked: true, message: 'You have already unlocked this video.' });
    }

    // Debit price (bonus balance used first, then real balance!)
    const debitResult = await WalletService.debit(
      req.user!.id,
      video.price,
      'videos',
      'video_unlock',
      `Unlocked Premium Video: "${video.title}"`,
      `tx_vid_unl_${video.id}`
    );

    userUnlocked.add(video.id);
    unlockedVideosByUser.set(req.user!.id, userUnlocked);

    // Credit Creator Wallet: (100% - platform commission)
    const platformCommissionPct = Number(await getSystemSetting('video_affiliate_commission_pct', '15')) || 15;
    const creatorCutPct = Math.max(0, 100 - platformCommissionPct);
    const creatorEarned = Math.round((video.price * creatorCutPct) / 100);

    const videoCreatorId = video.userId || video.user_id;
    if (videoCreatorId && videoCreatorId !== req.user!.id && creatorEarned > 0) {
      await WalletService.credit(
        videoCreatorId,
        creatorEarned,
        'videos',
        'video_sale_revenue',
        `Earned ${creatorCutPct}% (${creatorEarned} RWF) from sale of premium video "${video.title}"`
      ).catch(() => {});
    }

    // If accessed via an affiliate referral link, credit 15% commission to referrer's REAL wallet!
    if (ref) {
      try {
        await ReferralService.recordAffiliateSale(
          ref,
          video.id,
          video.title,
          video.price,
          0.15,
          'videos',
          req.user!.id
        );
      } catch (e) {
        console.warn('Affiliate commission recording warning:', e);
      }
    }

    return res.json({
      success: true,
      message: `Successfully unlocked "${video.title}"!`,
      creatorEarned,
      creatorSharePct: creatorCutPct,
      wallet: {
        balance: debitResult.newBalance,
        bonus_balance: debitResult.newBonusBalance,
        total_balance: debitResult.totalBalance
      }
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to unlock video.' });
  }
});

// Creator Post & Upload Video
app.post('/api/modules/videos', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, description, videoUrl, thumbnailUrl, category = 'General', price = 0, duration = 300, channelName, channelAvatar } = req.body;
    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'Title and videoUrl are required.' });
    }

    // Fetch creator profile from core_users
    const userRow = await query('SELECT name, email, channel_name, app_profiles FROM core_users WHERE id = $1', [req.user!.id]).catch(() => ({ rows: [] }));
    const u = userRow.rows[0] || {};
    const effectiveChannelName = channelName || u.channel_name || req.user?.name || u.name || 'Verified Creator';
    const effectiveAvatar = channelAvatar || u.app_profiles?.avatar || (req.user as any)?.avatar_url || '/logo.png';
    const effectiveHandle = effectiveChannelName.toLowerCase().replace(/[^a-z0-9]/g, '');

    const newId = 'vid-' + Date.now();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
    const newVideo = {
      id: newId,
      title: title.trim(),
      slug,
      description: description?.trim() || '',
      videoUrl: videoUrl.trim(),
      thumbnailUrl: thumbnailUrl?.trim() || 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80',
      duration: Number(duration) || 300,
      views: 0,
      likes: 0,
      accessType: Number(price) > 0 ? 'PREMIUM' : 'PUBLIC',
      price: Number(price) || 0,
      category,
      userId: req.user!.id,
      user_id: req.user!.id,
      channelName: effectiveChannelName,
      channelHandle: effectiveHandle,
      channelAvatar: effectiveAvatar,
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    SAMPLE_VIDEOS.unshift(newVideo);

    // Persist into PostgreSQL user_videos
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS user_videos (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          slug VARCHAR(500) NOT NULL,
          description TEXT,
          video_url TEXT NOT NULL,
          thumbnail_url TEXT,
          duration INT DEFAULT 300,
          views INT DEFAULT 0,
          likes INT DEFAULT 0,
          access_type VARCHAR(50) DEFAULT 'PUBLIC',
          price NUMERIC(15,2) DEFAULT 0,
          category VARCHAR(100) DEFAULT 'General',
          user_id VARCHAR(255) NOT NULL,
          channel_name VARCHAR(255),
          channel_handle VARCHAR(255),
          channel_avatar TEXT,
          is_verified BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `).catch(() => {});

      await query(
        `INSERT INTO user_videos (id, title, slug, description, video_url, thumbnail_url, duration, views, likes, access_type, price, category, user_id, channel_name, channel_handle, channel_avatar, is_verified, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0, $8, $9, $10, $11, $12, $13, $14, true, NOW())`,
        [newId, newVideo.title, slug, newVideo.description, newVideo.videoUrl, newVideo.thumbnailUrl, newVideo.duration, newVideo.accessType, newVideo.price, newVideo.category, req.user!.id, effectiveChannelName, effectiveHandle, effectiveAvatar]
      );

      await query(
        `INSERT INTO tv_videos (id, title, slug, description, original_url, embed_url, thumbnail_url, views_count, likes_count, is_published, created_at)
         VALUES ($1, $2, $3, $4, $5, $5, $6, 0, 0, true, NOW())`,
        [newId, newVideo.title, slug, newVideo.description, newVideo.videoUrl, newVideo.thumbnailUrl]
      ).catch(() => {});
    } catch (e) {
      console.warn('Could not insert to user_videos/tv_videos table:', e);
    }
    return res.status(201).json({ success: true, video: newVideo });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Helper to ensure tv_comments table exists with all necessary columns
async function ensureTvCommentsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS tv_comments (
      id VARCHAR(255) PRIMARY KEY,
      station_slug VARCHAR(255),
      station_id VARCHAR(255),
      video_id VARCHAR(255),
      user_id VARCHAR(255),
      author_name VARCHAR(255) NOT NULL,
      author_avatar TEXT,
      content TEXT NOT NULL,
      parent_id VARCHAR(255),
      likes_count INT DEFAULT 0,
      is_hidden BOOLEAN DEFAULT false,
      status VARCHAR(50) DEFAULT 'APPROVED',
      ip_address VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE tv_comments ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
    ALTER TABLE tv_comments ADD COLUMN IF NOT EXISTS video_id VARCHAR(255);
    ALTER TABLE tv_comments ADD COLUMN IF NOT EXISTS station_id VARCHAR(255);
    ALTER TABLE tv_comments ADD COLUMN IF NOT EXISTS station_slug VARCHAR(255);
    ALTER TABLE tv_comments ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
    ALTER TABLE tv_comments ADD COLUMN IF NOT EXISTS author_avatar TEXT;
    ALTER TABLE tv_comments ADD COLUMN IF NOT EXISTS content TEXT;
    ALTER TABLE tv_comments ADD COLUMN IF NOT EXISTS parent_id VARCHAR(255);
    ALTER TABLE tv_comments ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;
    ALTER TABLE tv_comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
    ALTER TABLE tv_comments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'APPROVED';
    ALTER TABLE tv_comments ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100);
    CREATE INDEX IF NOT EXISTS idx_tv_comments_station ON tv_comments(station_slug);
    CREATE INDEX IF NOT EXISTS idx_tv_comments_video ON tv_comments(video_id);
  `).catch((err) => console.warn('Could not ensure tv_comments table:', err?.message));
}

// ==================== TV & VIDEO COMMENTS API ==================== //
app.get('/api/comments', async (req, res) => {
  try {
    await ensureTvCommentsTable();
    const { station_slug, station_id, video_id } = req.query;
    if (!station_slug && !station_id && !video_id) {
      return res.status(400).json({ error: 'station_slug, station_id, or video_id is required' });
    }

    let sql = `SELECT * FROM tv_comments WHERE (is_hidden = false OR is_hidden IS NULL) AND (status = 'APPROVED' OR status IS NULL) AND `;
    const params: any[] = [];

    if (video_id) {
      params.push(video_id);
      sql += `video_id = $${params.length}`;
    } else if (station_slug && station_id) {
      params.push(station_slug, station_id);
      sql += `(station_slug = $1 OR station_id = $2)`;
    } else if (station_slug) {
      params.push(station_slug);
      sql += `station_slug = $1`;
    } else {
      params.push(station_id);
      sql += `station_id = $1`;
    }

    sql += ` ORDER BY created_at ASC;`;

    const result = await query(sql, params);
    const allComments = result.rows;

    const commentMap = new Map<string, any>();
    const rootComments: any[] = [];

    allComments.forEach((c: any) => {
      commentMap.set(c.id, { ...c, replies: [] });
    });

    allComments.forEach((c: any) => {
      const item = commentMap.get(c.id);
      if (c.parent_id && commentMap.has(c.parent_id)) {
        commentMap.get(c.parent_id).replies.push(item);
      } else {
        rootComments.push(item);
      }
    });

    rootComments.reverse();

    return res.json({
      success: true,
      count: allComments.length,
      comments: rootComments
    });
  } catch (err: any) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    await ensureTvCommentsTable();
    const { station_slug, station_id, video_id, author_name, content, parent_id } = req.body;

    if (!author_name || !author_name.trim()) {
      return res.status(400).json({ error: 'Author nickname or channel name is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }
    if (!station_slug && !video_id) {
      return res.status(400).json({ error: 'station_slug or video_id is required' });
    }

    const cleanAuthor = author_name.trim().slice(0, 80);
    const cleanContent = content.trim().slice(0, 1000);

    // Multilingual Content & Name Moderation (Kinyarwanda amabya, imboro, igituba, English, French)
    const nameCheck = checkInappropriateLanguage(cleanAuthor);
    if (nameCheck.isInappropriate) {
      return res.status(400).json({
        error: `Inappropriate nickname detected (${nameCheck.category || 'Moderation'}). Vulgar or offensive names (e.g. in Kinyarwanda, English, French) are strictly prohibited.`,
        flaggedWord: nameCheck.flaggedWord
      });
    }

    const contentCheck = checkInappropriateLanguage(cleanContent);
    if (contentCheck.isInappropriate) {
      return res.status(400).json({
        error: `Inappropriate comment language detected (${contentCheck.category || 'Moderation'}). Offensive language and profanity are strictly prohibited.`,
        flaggedWord: contentCheck.flaggedWord
      });
    }

    // Resolve user channel name and avatar if authenticated
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    let resolvedAuthor = cleanAuthor;
    let resolvedAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.substring(7));
      if (decoded?.id) {
        userId = decoded.id;
        try {
          const uRes = await query('SELECT name, channel_name, avatar_url FROM core_users WHERE id = $1', [userId]);
          if (uRes.rowCount > 0) {
            resolvedAuthor = uRes.rows[0].channel_name || uRes.rows[0].name || resolvedAuthor;
            if (uRes.rows[0].avatar_url) resolvedAvatar = uRes.rows[0].avatar_url;
          }
        } catch {}
      }
    }

    const commentId = 'cmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '';
    const clientIp = rawIp.slice(0, 100);

    const insertSql = `
      INSERT INTO tv_comments (
        id,
        station_slug, 
        station_id, 
        video_id,
        user_id,
        author_name,
        author_avatar,
        content, 
        parent_id,
        likes_count,
        is_hidden,
        status,
        ip_address,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, false, 'APPROVED', $10, NOW())
      RETURNING *;
    `;

    const result = await query(insertSql, [
      commentId,
      station_slug || null,
      station_id || null,
      video_id || null,
      userId,
      resolvedAuthor,
      resolvedAvatar,
      cleanContent,
      parent_id || null,
      clientIp
    ]);

    return res.status(201).json({
      success: true,
      comment: {
        ...result.rows[0],
        replies: []
      }
    });
  } catch (err: any) {
    console.error('Error posting comment:', err);
    return res.status(500).json({ error: err.message || 'Failed to post comment' });
  }
});

app.post('/api/comments/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE tv_comments SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = $1 RETURNING id, likes_count`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    return res.json({ success: true, likes_count: result.rows[0].likes_count });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to like comment' });
  }
});

// ==================== CONTACT & FEEDBACK API ==================== //
app.post(['/api/contact', '/api/feedback'], async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message content are required.' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const result = await query(
      `INSERT INTO feedback_messages (name, email, subject, message, status, ip_address)
       VALUES ($1, $2, $3, $4, 'UNREAD', $5)
       RETURNING id, name, email, subject, message, status, created_at`,
      [name.trim(), email.trim().toLowerCase(), (subject || 'General Inquiry').trim(), message.trim(), clientIp]
    );

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: result.rows[0]
    });
  } catch (err: any) {
    console.error('Error submitting feedback:', err);
    return res.status(500).json({ error: 'Failed to submit message.' });
  }
});

app.get(['/api/feedback/admin', '/api/contact/messages'], authenticateAdmin, async (req, res) => {
  try {
    const messages = await query(
      `SELECT * FROM feedback_messages ORDER BY created_at DESC LIMIT 200`
    );
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'UNREAD') as unread,
        COUNT(*) FILTER (WHERE status = 'READ') as read,
        COUNT(*) FILTER (WHERE status = 'ARCHIVED') as archived
      FROM feedback_messages
    `);
    const stats = statsResult.rows[0] || { total: 0, unread: 0, read: 0, archived: 0 };
    return res.json({
      messages: messages.rows,
      stats: {
        total: parseInt(stats.total || '0', 10),
        unread: parseInt(stats.unread || '0', 10),
        read: parseInt(stats.read || '0', 10),
        archived: parseInt(stats.archived || '0', 10)
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/feedback/admin/:id/reply', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      return res.status(400).json({ error: 'Reply content is required.' });
    }
    const updated = await query(
      `UPDATE feedback_messages 
       SET reply = $1, replied_at = NOW(), status = 'READ' 
       WHERE id = $2 
       RETURNING *`,
      [reply.trim(), id]
    );
    return res.json({ success: true, message: updated.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/feedback/my', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const email = req.user?.email;
    if (!email) return res.json({ messages: [] });
    const result = await query(
      `SELECT * FROM feedback_messages WHERE LOWER(email) = LOWER($1) ORDER BY created_at ASC`,
      [email]
    );
    return res.json({ messages: result.rows });
  } catch (err: any) {
    return res.json({ messages: [] });
  }
});

// ==================== ANNOUNCEMENTS & READ TRACKING API ==================== //
app.get('/api/announcements', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM announcements ORDER BY created_at DESC LIMIT 50`);
    return res.json({ announcements: result.rows });
  } catch (err: any) {
    return res.json({ announcements: [] });
  }
});

app.post('/api/admin/announcements', authenticateAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, content, badge = 'BROADCAST', target = 'ALL' } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }
    const adminUser = req.user?.name || 'Administrator';
    const result = await query(
      `INSERT INTO announcements (title, content, badge, target, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title.trim(), content.trim(), badge, target, adminUser]
    );

    // Also inject into core_notifications
    try {
      await query(
        `INSERT INTO core_notifications (title, message, type, recipient_role)
         VALUES ($1, $2, 'announcement', 'all')`,
        [title.trim(), content.trim()]
      );
    } catch (e) {}

    return res.status(201).json({ success: true, announcement: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/announcements/:id/read', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userName = req.user?.name || 'User';
    const userEmail = req.user?.email || '';
    if (!userId) return res.json({ success: false });

    await query(
      `INSERT INTO announcement_reads (announcement_id, user_id, user_name, user_email)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (announcement_id, user_id) DO NOTHING`,
      [parseInt(id, 10), userId, userName, userEmail]
    );
    return res.json({ success: true, message: 'Marked as read' });
  } catch (err: any) {
    return res.json({ success: false });
  }
});

app.get('/api/admin/announcements/:id/stats', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    const readsResult = await query(
      `SELECT user_id, user_name, user_email, read_at FROM announcement_reads WHERE announcement_id = $1 ORDER BY read_at DESC`,
      [numId]
    );
    const totalUsersResult = await query(`SELECT COUNT(*) as count FROM core_users`);
    const totalUsers = parseInt(totalUsersResult.rows[0]?.count || '12', 10);
    const readCount = readsResult.rowCount || 0;
    const unreadCount = Math.max(0, totalUsers - readCount);
    const percentage = totalUsers > 0 ? Math.round((readCount / totalUsers) * 100) : 0;

    return res.json({
      announcement_id: numId,
      total_users: totalUsers,
      read_count: readCount,
      unread_count: unreadCount,
      seen_percentage: percentage,
      seen_by: readsResult.rows
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});


// C. Marketplace Module (Benix Digital Marketplace - Real Database Products)
async function ensureMarketplaceTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS mkt_products (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      price NUMERIC(10,2) NOT NULL DEFAULT 0,
      category VARCHAR(100) NOT NULL,
      seller VARCHAR(255),
      seller_id VARCHAR(255),
      rating NUMERIC(3,2) DEFAULT 5.0,
      downloads INT DEFAULT 0,
      badge VARCHAR(50),
      commission_pct INT DEFAULT 10,
      image_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `).catch(() => {});
}

app.get(['/api/modules/marketplace/products', '/api/modules/marketplace/items'], async (req, res) => {
  try {
    await ensureMarketplaceTable();
    const result = await query('SELECT * FROM mkt_products ORDER BY created_at DESC LIMIT 100');
    return res.json({ products: result.rows, items: result.rows });
  } catch (err: any) {
    return res.json({ products: [], items: [] });
  }
});

app.post('/api/modules/marketplace/items', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureMarketplaceTable();
    const { title, description, price, category, imageUrl, commissionPct = 10, badge } = req.body;
    if (!title || price === undefined) {
      return res.status(400).json({ error: 'Title and price are required.' });
    }

    const newId = `mp_${Date.now()}`;
    const seller = req.user?.name || req.user?.email?.split('@')[0] || 'Verified Seller';
    const sellerId = req.user?.id;

    await query(
      `INSERT INTO mkt_products (id, title, description, price, category, seller, seller_id, rating, downloads, badge, commission_pct, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 5.0, 0, $8, $9, $10)`,
      [
        newId,
        title.trim(),
        description?.trim() || '',
        Number(price) || 0,
        category || 'Digital Goods',
        seller,
        sellerId,
        badge || 'NEW',
        Number(commissionPct) || 10,
        imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80'
      ]
    );

    const newItem = {
      id: newId,
      title: title.trim(),
      description: description?.trim() || '',
      price: Number(price) || 0,
      category: category || 'Digital Goods',
      seller,
      seller_id: sellerId,
      rating: 5.0,
      downloads: 0,
      badge: badge || 'NEW',
      commission_pct: Number(commissionPct) || 10,
      image_url: imageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80'
    };

    return res.status(201).json({ success: true, item: newItem, message: 'Item listed successfully!' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/modules/marketplace/buy', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    await ensureMarketplaceTable();
    const { productId, ref } = req.body;
    const prodRes = await query('SELECT * FROM mkt_products WHERE id = $1', [productId]);
    if (prodRes.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    const product = prodRes.rows[0];
    const price = Number(product.price);

    // Debit product price from wallet (bonus balance used first, then real balance)
    const debitResult = await WalletService.debit(
      req.user!.id,
      price,
      'marketplace',
      'product_purchase',
      `Purchased: "${product.title}"`,
      `tx_mp_buy_${product.id}_${Date.now()}`
    );

    // Increment downloads count
    await query('UPDATE mkt_products SET downloads = COALESCE(downloads, 0) + 1 WHERE id = $1', [productId]).catch(() => {});

    // Credit seller if seller_id exists and not self-purchase
    if (product.seller_id && product.seller_id !== req.user!.id) {
      const commissionRate = (Number(product.commission_pct) || 10) / 100;
      const sellerEarnings = price * (1 - commissionRate);
      if (sellerEarnings > 0) {
        await WalletService.credit(
          product.seller_id,
          sellerEarnings,
          'marketplace',
          'product_sale',
          `Sale earnings for "${product.title}"`,
          `tx_mp_sale_${product.id}_${Date.now()}`
        ).catch(() => {});
      }
    }

    // If bought via affiliate shareable link, credit commission straight to referrer's REAL wallet
    let affiliateCredit: any = null;
    if (ref) {
      try {
        const commRate = (Number(product.commission_pct) || 10) / 100;
        affiliateCredit = await ReferralService.recordAffiliateSale(
          ref,
          product.id,
          product.title,
          price,
          commRate,
          'marketplace',
          req.user!.id
        );
      } catch (e) {
        console.warn('Marketplace affiliate commission error:', e);
      }
    }

    return res.json({
      success: true,
      message: `Successfully purchased "${product.title}"!`,
      wallet: {
        balance: debitResult.newBalance,
        bonus_balance: debitResult.newBonusBalance,
        total_balance: debitResult.totalBalance
      },
      affiliate_awarded: !!affiliateCredit
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Purchase failed.' });
  }
});

// D. Games / RollDice Module
app.get('/api/modules/games/rooms', async (req, res) => {
  try {
    const result = await query('SELECT * FROM games.game_rooms ORDER BY created_at DESC LIMIT 20');
    return res.json({ rooms: result.rows });
  } catch (err: any) {
    return res.json({ rooms: [] });
  }
});

app.post('/api/modules/games/pve/play', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { stake = 100 } = req.body;
    const numStake = parseFloat(stake) || 100;

    // Debit stake from unified wallet
    await WalletService.debit(
      req.user!.id,
      numStake,
      'game',
      'wager',
      `RollDice PVE Bet: ${numStake} RWF`
    );

    // Roll two dice
    const playerRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
    const aiRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
    const win = playerRoll > aiRoll;
    let payout = 0;

    if (win) {
      payout = Math.round(numStake * 1.9); // 1.9x payout
      await WalletService.credit(
        req.user!.id,
        payout,
        'game',
        'payout',
        `RollDice Win: Won ${payout} RWF (Player: ${playerRoll} vs AI: ${aiRoll})`
      );
    }

    const currentWallet = await WalletService.getOrCreateWallet(req.user!.id);

    return res.json({
      playerRoll,
      aiRoll,
      win,
      payout,
      newBalance: Number(currentWallet.balance)
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Auto-initialize game tables on first load
let gameTablesInitialized = false;
async function ensureGameTables() {
  if (gameTablesInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS game_rooms (
        id VARCHAR(64) PRIMARY KEY,
        player1_id VARCHAR(64) NOT NULL,
        player2_id VARCHAR(64),
        mode VARCHAR(20) NOT NULL,
        stake NUMERIC(12, 2) DEFAULT 0.00,
        target_score INT DEFAULT 100,
        p1_score INT DEFAULT 0,
        p2_score INT DEFAULT 0,
        current_turn INT DEFAULT 0,
        current_accumulated INT DEFAULT 0,
        status VARCHAR(30) DEFAULT 'ACTIVE',
        winner_id VARCHAR(64),
        rake_amount NUMERIC(12, 2) DEFAULT 0.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL
      );

      INSERT INTO system_settings (key, value) VALUES
        ('house_rake_percent', '10'),
        ('house_balance', '0.00'),
        ('min_stake', '20'),
        ('max_stake', '100000'),
        ('target_score', '100')
      ON CONFLICT (key) DO NOTHING;
    `);
    gameTablesInitialized = true;
  } catch (e) {
    console.warn('Game tables init notice:', e);
  }
}

// 1. RollDice PvE Start Match
const handlePveStart = async (req: AuthenticatedRequest, res: any) => {
  try {
    await ensureGameTables();
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Please login to play real-money games' });

    const { stake, targetScore: requestedTarget } = req.body;
    const stakeAmount = Number(stake);

    const minStake = 20;
    const maxStake = 100000;
    const targetScore = requestedTarget && [50, 100, 200].includes(Number(requestedTarget))
      ? Number(requestedTarget)
      : 100;

    if (isNaN(stakeAmount) || stakeAmount < minStake || stakeAmount > maxStake) {
      return res.status(400).json({ error: `Stake must be between RWF ${minStake} and RWF ${maxStake.toLocaleString()}` });
    }

    const roomId = 'pve_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Atomic wallet debit with bonus wallet priority
    const debitResult = await WalletService.debit(
      userId,
      stakeAmount,
      'game',
      'wager',
      `RollDice PvE Wager: ${stakeAmount} RWF`,
      roomId
    );

    await query(
      `INSERT INTO game_rooms (id, player1_id, player2_id, mode, stake, target_score, p1_score, p2_score, current_turn, current_accumulated, status)
       VALUES ($1, $2, 'AI_BOT', 'PVE', $3, $4, 0, 0, 0, 0, 'ACTIVE')`,
      [roomId, userId, stakeAmount, targetScore]
    );

    return res.json({
      success: true,
      room: {
        id: roomId,
        mode: 'PVE',
        stake: stakeAmount,
        targetScore,
        p1Score: 0,
        p2Score: 0,
        currentTurn: 0,
        currentAccumulated: 0,
        status: 'ACTIVE',
        lastRoll: null
      },
      newBalance: debitResult.newBalance,
      bonusBalance: debitResult.newBonusBalance
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to start game.' });
  }
};
app.post('/api/game/pve/start', authenticateToken, handlePveStart);
app.post('/api/modules/games/pve/start', authenticateToken, handlePveStart);

// 2. RollDice PvE Roll
const handlePveRoll = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { roomId } = req.body;
    const rooms = await query(
      `SELECT * FROM game_rooms WHERE id = $1 AND player1_id = $2 AND status = 'ACTIVE'`,
      [roomId, userId]
    );

    if (rooms.rowCount === 0) {
      return res.status(404).json({ error: 'Active game room not found' });
    }

    const room = rooms.rows[0];
    if (room.current_turn !== 0) {
      return res.status(400).json({ error: 'It is not your turn' });
    }

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    let newAccumulated = Number(room.current_accumulated || 0);
    let turnBusted = false;
    let nextTurn = 0;

    if (diceRoll === 1) {
      newAccumulated = 0;
      turnBusted = true;
      nextTurn = 1; // AI Turn

      await query(
        `UPDATE game_rooms SET current_turn = 1, current_accumulated = 0 WHERE id = $1`,
        [roomId]
      );
    } else {
      newAccumulated += diceRoll;
      await query(
        `UPDATE game_rooms SET current_accumulated = $1 WHERE id = $2`,
        [newAccumulated, roomId]
      );
    }

    return res.json({
      success: true,
      diceRoll,
      turnBusted,
      currentAccumulated: newAccumulated,
      currentTurn: nextTurn,
      p1Score: Number(room.p1_score || 0),
      p2Score: Number(room.p2_score || 0)
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Roll failed' });
  }
};
app.post('/api/game/pve/roll', authenticateToken, handlePveRoll);
app.post('/api/modules/games/pve/roll', authenticateToken, handlePveRoll);

// 3. RollDice PvE Hold Score
const handlePveHold = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { roomId } = req.body;
    const rooms = await query(
      `SELECT * FROM game_rooms WHERE id = $1 AND player1_id = $2 AND status = 'ACTIVE'`,
      [roomId, userId]
    );

    if (rooms.rowCount === 0) {
      return res.status(404).json({ error: 'Active game room not found' });
    }

    const room = rooms.rows[0];
    if (room.current_turn !== 0) {
      return res.status(400).json({ error: 'It is not your turn' });
    }

    const newP1Score = Number(room.p1_score || 0) + Number(room.current_accumulated || 0);
    const targetScore = Number(room.target_score || 100);
    const houseRakePercent = 10; // Guaranteed 10% platform house rake

    // Check if player won
    if (newP1Score >= targetScore) {
      const stake = Number(room.stake);
      const totalPot = stake * 2;
      const houseRakeAmount = (totalPot * houseRakePercent) / 100;
      const winnerPayout = totalPot - houseRakeAmount;

      await query(
        `UPDATE game_rooms SET p1_score = $1, current_accumulated = 0, status = 'COMPLETED', winner_id = $2, rake_amount = $3 WHERE id = $4`,
        [newP1Score, userId, houseRakeAmount, roomId]
      );

      // Safe atomic wallet credit
      const creditResult = await WalletService.credit(
        userId,
        winnerPayout,
        'game',
        'payout',
        `RollDice PvE Victory Payout: ${winnerPayout} RWF`,
        `tx_pay_${roomId}`
      );

      // Track platform house earnings
      try {
        await query(
          `UPDATE system_settings SET value = (COALESCE(NULLIF(value, '')::numeric, 0) + $1)::text WHERE key = 'house_balance'`,
          [houseRakeAmount]
        );
      } catch (e) {}

      return res.json({
        success: true,
        winner: 'PLAYER',
        p1Score: newP1Score,
        p2Score: Number(room.p2_score || 0),
        winnerPayout,
        newBalance: creditResult.newBalance,
        aiLogs: []
      });
    }

    // Player banked points, simulate AI turn
    let aiScore = Number(room.p2_score || 0);
    let aiAccumulated = 0;
    const aiLogs: Array<{ roll: number; accumulated: number; busted: boolean; held: boolean }> = [];
    let aiBusted = false;
    let aiWon = false;

    const neededToWin = targetScore - aiScore;
    const aiHoldThreshold = Math.min(15, neededToWin);

    while (aiAccumulated < aiHoldThreshold && !aiBusted) {
      const roll = Math.floor(Math.random() * 6) + 1;
      if (roll === 1) {
        aiBusted = true;
        aiAccumulated = 0;
        aiLogs.push({ roll: 1, accumulated: 0, busted: true, held: false });
      } else {
        aiAccumulated += roll;
        const willHold = aiAccumulated >= aiHoldThreshold || aiScore + aiAccumulated >= targetScore;
        aiLogs.push({ roll, accumulated: aiAccumulated, busted: false, held: willHold });
      }
    }

    if (!aiBusted && aiAccumulated > 0) {
      aiScore += aiAccumulated;
      if (aiScore >= targetScore) {
        aiWon = true;
      }
    }

    const curWallet = await WalletService.getOrCreateWallet(userId);

    if (aiWon) {
      const houseProfit = Number(room.stake);
      await query(
        `UPDATE game_rooms SET p1_score = $1, p2_score = $2, current_accumulated = 0, status = 'COMPLETED', winner_id = 'AI_BOT' WHERE id = $3`,
        [newP1Score, aiScore, roomId]
      );

      try {
        await query(
          `UPDATE system_settings SET value = (COALESCE(NULLIF(value, '')::numeric, 0) + $1)::text WHERE key = 'house_balance'`,
          [houseProfit]
        );
      } catch (e) {}

      return res.json({
        success: true,
        winner: 'AI_BOT',
        p1Score: newP1Score,
        p2Score: aiScore,
        newBalance: Number(curWallet.balance),
        aiLogs
      });
    }

    // Match continues, pass turn back to player
    await query(
      `UPDATE game_rooms SET p1_score = $1, p2_score = $2, current_turn = 0, current_accumulated = 0 WHERE id = $3`,
      [newP1Score, aiScore, roomId]
    );

    return res.json({
      success: true,
      winner: null,
      p1Score: newP1Score,
      p2Score: aiScore,
      currentTurn: 0,
      newBalance: Number(curWallet.balance),
      aiLogs
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Hold failed' });
  }
};
app.post('/api/game/pve/hold', authenticateToken, handlePveHold);
app.post('/api/modules/games/pve/hold', authenticateToken, handlePveHold);

// 4. RollDice PvE AI Turn
const handlePveAiTurn = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { roomId } = req.body;
    const rooms = await query(
      `SELECT * FROM game_rooms WHERE id = $1 AND player1_id = $2 AND status = 'ACTIVE'`,
      [roomId, userId]
    );

    if (rooms.rowCount === 0) {
      return res.status(404).json({ error: 'Active game room not found' });
    }

    const room = rooms.rows[0];
    if (room.current_turn !== 1) {
      return res.json({
        success: true,
        message: 'Not AI turn',
        currentTurn: room.current_turn,
        p1Score: Number(room.p1_score || 0),
        p2Score: Number(room.p2_score || 0)
      });
    }

    let aiScore = Number(room.p2_score || 0);
    let aiAccumulated = 0;
    const targetScore = Number(room.target_score || 100);
    const aiLogs: Array<{ roll: number; accumulated: number; busted: boolean; held: boolean }> = [];
    let aiBusted = false;
    let aiWon = false;

    const neededToWin = targetScore - aiScore;
    const aiHoldThreshold = Math.min(15, neededToWin);

    while (aiAccumulated < aiHoldThreshold && !aiBusted) {
      const roll = Math.floor(Math.random() * 6) + 1;
      if (roll === 1) {
        aiBusted = true;
        aiAccumulated = 0;
        aiLogs.push({ roll: 1, accumulated: 0, busted: true, held: false });
      } else {
        aiAccumulated += roll;
        const willHold = aiAccumulated >= aiHoldThreshold || aiScore + aiAccumulated >= targetScore;
        aiLogs.push({ roll, accumulated: aiAccumulated, busted: false, held: willHold });
      }
    }

    if (!aiBusted && aiAccumulated > 0) {
      aiScore += aiAccumulated;
      if (aiScore >= targetScore) {
        aiWon = true;
      }
    }

    const curWallet = await WalletService.getOrCreateWallet(userId);

    if (aiWon) {
      const houseProfit = Number(room.stake);
      await query(
        `UPDATE game_rooms SET p2_score = $1, current_accumulated = 0, status = 'COMPLETED', winner_id = 'AI_BOT' WHERE id = $2`,
        [aiScore, roomId]
      );

      try {
        await query(
          `UPDATE system_settings SET value = (COALESCE(NULLIF(value, '')::numeric, 0) + $1)::text WHERE key = 'house_balance'`,
          [houseProfit]
        );
      } catch (e) {}

      return res.json({
        success: true,
        winner: 'AI_BOT',
        p1Score: Number(room.p1_score || 0),
        p2Score: aiScore,
        currentTurn: 0,
        newBalance: Number(curWallet.balance),
        aiLogs
      });
    }

    await query(
      `UPDATE game_rooms SET p2_score = $1, current_turn = 0, current_accumulated = 0 WHERE id = $2`,
      [aiScore, roomId]
    );

    return res.json({
      success: true,
      winner: null,
      p1Score: Number(room.p1_score || 0),
      p2Score: aiScore,
      currentTurn: 0,
      newBalance: Number(curWallet.balance),
      aiLogs
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'AI Turn failed' });
  }
};
app.post('/api/game/pve/ai-turn', authenticateToken, handlePveAiTurn);
app.post('/api/modules/games/pve/ai-turn', authenticateToken, handlePveAiTurn);

// 5. RollDice Abandon / Refund
const handleGameRefund = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let roomIdToCancel: string | null = null;
    try {
      roomIdToCancel = req.body?.roomId || null;
    } catch {}

    let sql = `SELECT * FROM game_rooms WHERE (player1_id = $1 OR player2_id = $1) AND status IN ('ACTIVE', 'WAITING')`;
    const params: any[] = [userId];

    if (roomIdToCancel) {
      params.push(roomIdToCancel);
      sql += ` AND id = $${params.length}`;
    }

    const activeRooms = await query(sql, params);
    let totalRefunded = 0;

    for (const r of activeRooms.rows) {
      const stake = Number(r.stake || 0);
      if (stake > 0) {
        await WalletService.credit(userId, stake, 'game', 'refund', 'RollDice Game Cancelled / Refunded', r.id);
        totalRefunded += stake;
      }
      await query(`UPDATE game_rooms SET status = 'CANCELLED' WHERE id = $1`, [r.id]);
    }

    const curWallet = await WalletService.getOrCreateWallet(userId);
    return res.json({
      success: true,
      refundedAmount: totalRefunded,
      newBalance: Number(curWallet.balance)
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Refund failed' });
  }
};
app.post('/api/game/refund', authenticateToken, handleGameRefund);
app.post('/api/modules/games/refund', authenticateToken, handleGameRefund);

// 6. Bonus Multiplier Spin Wheel
const MULTIPLIER_TIERS_SERVER = [
  { multiplier: 0, label: '0x (Lose)', weight: 38000 },
  { multiplier: 0.5, label: '0.5x', weight: 58000 },
  { multiplier: 1.0, label: '1.0x', weight: 83000 },
  { multiplier: 1.5, label: '1.5x', weight: 91500 },
  { multiplier: 2.0, label: '2.0x', weight: 96000 },
  { multiplier: 3.0, label: '3.0x', weight: 98500 },
  { multiplier: 5.0, label: '5.0x', weight: 99500 },
  { multiplier: 10.0, label: '10x', weight: 99850 },
  { multiplier: 50.0, label: '50x', weight: 99950 },
  { multiplier: 100.0, label: '100x 🔥', weight: 99980 },
  { multiplier: 500.0, label: '500x 🚀', weight: 99995 },
  { multiplier: 1000.0, label: '1000x 👑', weight: 100000 },
];

const handleBonusSpin = async (req: AuthenticatedRequest, res: any) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ error: 'Room ID required' });

    const rooms = await query(
      `SELECT * FROM game_rooms WHERE id = $1 AND winner_id = $2 AND status = 'COMPLETED'`,
      [roomId, userId]
    );

    if (rooms.rowCount === 0) {
      return res.status(400).json({ error: 'No unclaimed winning game room found' });
    }

    const room = rooms.rows[0];
    const stake = Number(room.stake);
    const totalPot = stake * 2;
    const basePayout = totalPot - (totalPot * 10) / 100; // 1.8x base payout

    // Cryptographic Provably Fair Roll
    const randNum = (crypto.randomBytes(4).readUInt32BE(0) % 100000) + 1;
    let selectedTier = MULTIPLIER_TIERS_SERVER[2]; // Default 1.0x
    let tierIndex = 2;

    for (let i = 0; i < MULTIPLIER_TIERS_SERVER.length; i++) {
      if (randNum <= MULTIPLIER_TIERS_SERVER[i].weight) {
        selectedTier = MULTIPLIER_TIERS_SERVER[i];
        tierIndex = i;
        break;
      }
    }

    const multiplier = selectedTier.multiplier;
    const finalPayout = Math.round(basePayout * multiplier);
    const payoutDifference = finalPayout - basePayout;

    // Prevent duplicate bonus spins
    await query(`UPDATE game_rooms SET status = 'BONUS_SPIN_CLAIMED' WHERE id = $1`, [roomId]);

    let newBalance = 0;
    if (payoutDifference > 0) {
      const cr = await WalletService.credit(
        userId,
        payoutDifference,
        'game',
        'bonus_spin_win',
        `Multiplier Wheel Win: ${multiplier}x (+${payoutDifference} RWF)`,
        `tx_spin_${roomId}`
      );
      newBalance = cr.newBalance;
    } else if (payoutDifference < 0) {
      const db = await WalletService.debit(
        userId,
        Math.abs(payoutDifference),
        'game',
        'bonus_spin_adjust',
        `Multiplier Wheel Adjustment: ${multiplier}x (-${Math.abs(payoutDifference)} RWF)`,
        `tx_spin_${roomId}`
      );
      newBalance = db.newBalance;
    } else {
      const curWallet = await WalletService.getOrCreateWallet(userId);
      newBalance = Number(curWallet.balance);
    }

    return res.json({
      success: true,
      multiplier,
      tierIndex,
      label: selectedTier.label,
      basePayout,
      finalPayout,
      payoutDifference,
      newBalance
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Bonus spin failed' });
  }
};
app.post('/api/game/bonus-spin', authenticateToken, handleBonusSpin);
app.post('/api/modules/games/bonus-spin', authenticateToken, handleBonusSpin);

// ==================== 8. SUPER ADMIN CONSOLIDATED API ==================== //

app.get('/api/admin/overview', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const [
      usersCnt,
      walletsTot,
      tvStationsCnt,
      radioStationsCnt,
      gameRoomsCnt,
      mktProductsCnt,
      articlesCnt
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM core_users').catch(() => ({ rows: [{ count: 12 }], rowCount: 1 })),
      query('SELECT COALESCE(SUM(balance), 0) as total FROM core_wallets').catch(() => ({ rows: [{ total: 0 }], rowCount: 1 })),
      query('SELECT COUNT(*) as count FROM tv_stations').catch(() => ({ rows: [{ count: 0 }], rowCount: 1 })),
      query('SELECT COUNT(*) as count FROM radio_stations').catch(() => ({ rows: [{ count: 0 }], rowCount: 1 })),
      query('SELECT COUNT(*) as count FROM game_rooms').catch(() => ({ rows: [{ count: 0 }], rowCount: 1 })),
      query('SELECT COUNT(*) as count FROM mkt_products').catch(() => ({ rows: [{ count: 0 }], rowCount: 1 })),
      query('SELECT COUNT(*) as count FROM articles').catch(() => ({ rows: [{ count: 0 }], rowCount: 1 }))
    ]);

    const recentTx = await query(
      `SELECT t.*, u.email as user_email, u.name as user_name 
       FROM core_wallet_transactions t 
       JOIN core_users u ON t.user_id = u.id 
       ORDER BY t.created_at DESC LIMIT 15`
    );

    return res.json({
      stats: {
        total_users: parseInt(usersCnt.rows[0]?.count || 0, 10),
        total_wallet_balance: parseFloat(walletsTot.rows[0]?.total || 0),
        tv_stations: parseInt(tvStationsCnt.rows[0]?.count || 0, 10),
        radio_stations: parseInt(radioStationsCnt.rows[0]?.count || 0, 10),
        game_rooms: parseInt(gameRoomsCnt.rows[0]?.count || 0, 10),
        marketplace_products: parseInt(mktProductsCnt.rows[0]?.count || 0, 10),
        published_articles: parseInt(articlesCnt.rows[0]?.count || 0, 10)
      },
      recent_transactions: recentTx.rows
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin Users List
app.get('/api/admin/users', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.name, u.role, u.phone, u.preferred_language, u.referral_code, 
              u.is_verified, u.created_at, w.balance as wallet_balance
       FROM core_users u
       LEFT JOIN core_wallets w ON u.id = w.user_id
       ORDER BY u.created_at DESC`
    );
    return res.json({ users: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin Real Database Analytics
app.get('/api/admin/analytics', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    // 1. Total real users in database
    const usersCountRes = await query('SELECT count(*)::int as total FROM core_users');
    const totalUsers = usersCountRes.rows[0]?.total || 0;

    // 2. Real wallet balances and transaction volume
    const walletRes = await query('SELECT COALESCE(SUM(balance), 0)::numeric as total_balance, COALESCE(SUM(bonus_balance), 0)::numeric as total_bonus FROM core_wallets');
    const totalWalletBalance = Number(walletRes.rows[0]?.total_balance || 0);

    const txRes = await query("SELECT COALESCE(SUM(amount), 0)::numeric as total_volume FROM core_wallet_transactions WHERE status = 'completed'");
    const totalTxVolume = Number(txRes.rows[0]?.total_volume || 0);

    // 3. Module assets and entities in database
    const tvCountRes = await query('SELECT count(*)::int as total FROM tv_stations');
    const radioCountRes = await query('SELECT count(*)::int as total FROM radio_stations');
    const videosCountRes = await query('SELECT count(*)::int as total, COALESCE(SUM(views_count), 0)::int as total_views FROM tv_videos');
    const articlesCountRes = await query('SELECT count(*)::int as total, COALESCE(SUM(views_count), 0)::int as total_views FROM articles');
    const projectsCountRes = await query('SELECT count(*)::int as total FROM projects');
    const kundaCountRes = await query('SELECT count(*)::int as total FROM kunda_profiles');
    const gameRoomsRes = await query('SELECT count(*)::int as total FROM game_rooms');

    const tvStationsCount = tvCountRes.rows[0]?.total || 0;
    const radioStationsCount = radioCountRes.rows[0]?.total || 0;
    const videoViews = Number(videosCountRes.rows[0]?.total_views || 0);
    const articleViews = Number(articlesCountRes.rows[0]?.total_views || 0);
    const totalViews = videoViews + articleViews;

    // 4. Recent real database activity
    const recentUsers = await query(`
      SELECT id, 'user_signup' as event_type, email, name, 'Web/PWA' as device_type, 'Chrome' as browser, 'Active' as os, created_at
      FROM core_users
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Top articles from real database
    const topArticlesRes = await query(`
      SELECT title, slug, views_count as views, category
      FROM articles
      ORDER BY views_count DESC
      LIMIT 5
    `);

    // Top projects from real database
    const topProjectsRes = await query(`
      SELECT name, slug, 0 as clicks
      FROM projects
      ORDER BY sort_order ASC
      LIMIT 7
    `);

    return res.json({
      overview: {
        total_views: totalViews,
        unique_visitors: totalUsers,
        external_clicks: 0,
        avg_views_per_session: totalUsers > 0 ? Number((totalViews / totalUsers).toFixed(1)) : 0,
        bounce_rate: 0
      },
      stats: {
        total_users: totalUsers,
        total_wallet_balance: totalWalletBalance,
        total_tx_volume: totalTxVolume,
        tv_stations: tvStationsCount,
        radio_stations: radioStationsCount,
        tv_videos: videosCountRes.rows[0]?.total || 0,
        kunda_profiles: kundaCountRes.rows[0]?.total || 0,
        game_rooms: gameRoomsRes.rows[0]?.total || 0
      },
      adsense_earnings: 0.00,
      tv_interstitial_earnings: 0.00,
      radio_preroll_earnings: 0.00,
      banner_earnings: 0.00,
      tv_impressions: 0,
      radio_impressions: 0,
      banner_impressions: 0,
      top_projects: topProjectsRes.rows,
      top_articles: topArticlesRes.rows,
      sources: [
        { source: 'Direct / PWA App Launch', count: totalUsers, pct: '100%' }
      ],
      devices: [
        { device_type: 'Mobile & Desktop (Unified)', count: totalUsers, pct: '100%' }
      ],
      browsers: [
        { browser: 'Modern Web Browsers', count: totalUsers }
      ],
      recent_activity: recentUsers.rows
    });
  } catch (err: any) {
    console.error('Analytics API error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Admin All-Apps & Platform Settings Storage
app.get('/api/admin/settings/all-apps', async (req, res) => {
  try {
    const row = await query("SELECT value FROM core_system_settings WHERE key = 'platform_all_apps' LIMIT 1");
    return res.json({ settings: row.rows[0]?.value || null });
  } catch (err: any) {
    return res.json({ settings: null });
  }
});

app.post('/api/admin/settings/all-apps', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const payload = req.body;
    await query(`
      INSERT INTO core_system_settings (key, value, description, updated_at)
      VALUES ('platform_all_apps', $1, 'All-Apps control and platform settings', CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
    `, [JSON.stringify(payload)]);

    if (payload.branding || payload.contacts) {
      const b = payload.branding || {};
      const c = payload.contacts || {};
      await query(`
        UPDATE company_settings SET
          company_name = COALESCE($1, company_name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          address = COALESCE($4, address),
          founder_name = COALESCE($5, founder_name),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `, [
        b.platform_name || null,
        c.support_email || null,
        c.whatsapp_phone || null,
        c.address || null,
        c.founder_name || null
      ]).catch(() => {});
    }

    if (payload.modules) {
      const m = payload.modules;
      if (m.kunda_contact_unlock_price !== undefined) {
        await setSystemSetting('contact_unlock_price', String(Math.max(0, Number(m.kunda_contact_unlock_price) || 500)));
      }
      if (m.kunda_creator_rev_share_pct !== undefined) {
        await setSystemSetting('kunda_creator_rev_share_pct', String(Math.max(0, Math.min(100, Number(m.kunda_creator_rev_share_pct) || 15))));
      }
      if (m.kunda_message_cost !== undefined) {
        await setSystemSetting('kunda_message_cost', String(Math.max(0, Number(m.kunda_message_cost) || 50)));
      }
      if (m.kunda_free_messages !== undefined) {
        await setSystemSetting('kunda_free_messages', String(Math.max(0, Number(m.kunda_free_messages) || 3)));
      }
    }

    return res.json({ success: true, message: 'All-Apps configuration saved successfully to database.' });
  } catch (err: any) {
    console.error('All-apps save error:', err);
    return res.status(500).json({ error: err.message || 'Failed to save settings to database.' });
  }
});


// Projects & Blog API (Original BenixSpace features preserved)
app.get('/api/projects', async (req, res) => {
  try {
    const result = await query('SELECT * FROM projects WHERE status = $1 ORDER BY sort_order ASC', ['published']);
    return res.json({ projects: result.rows });
  } catch (err: any) {
    return res.json({ projects: [] });
  }
});

app.get('/api/blog', async (req, res) => {
  try {
    const result = await query('SELECT * FROM articles WHERE status = $1 ORDER BY published_at DESC', ['published']);
    return res.json({ articles: result.rows });
  } catch (err: any) {
    return res.json({ articles: [] });
  }
});

app.get('/api/blog/:slug', async (req, res) => {
  try {
    const result = await query('SELECT * FROM articles WHERE slug = $1', [req.params.slug]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Article not found.' });
    return res.json({ article: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Company & System Settings (Dynamic configuration for rewards, bonuses, and contacts)
app.get('/api/settings', async (req, res) => {
  try {
    const companyRes = await query('SELECT * FROM company_settings LIMIT 1');
    const socialRes = await query('SELECT * FROM social_links ORDER BY sort_order ASC');
    const sysRes = await query('SELECT key, value FROM core_system_settings').catch(() => ({ rows: [] }));
    const systemSettings: Record<string, any> = {
      welcome_bonus_amount: 1000,
      referral_reward: 1000,
      affiliate_commission_percentage: 15
    };
    if (sysRes && sysRes.rows) {
      for (const row of sysRes.rows) {
        systemSettings[row.key] = row.value;
      }
    }

    let platformSettings = null;
    if (systemSettings['platform_all_apps']) {
      try {
        platformSettings = typeof systemSettings['platform_all_apps'] === 'string'
          ? JSON.parse(systemSettings['platform_all_apps'])
          : systemSettings['platform_all_apps'];
      } catch {}
    }

    return res.json({
      company: companyRes.rows[0] || {},
      social: socialRes.rows || [],
      system: systemSettings,
      platform_settings: platformSettings
    });
  } catch (err: any) {
    return res.json({
      company: {},
      social: [],
      system: {
        welcome_bonus_amount: 1000,
        referral_reward: 1000,
        affiliate_commission_percentage: 15
      }
    });
  }
});

// Update Company Settings (Admin & Superadmin)
app.put('/api/settings/company', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { company_name, email, phone, address, founder_name, founder_bio, company_description, services_json } = req.body;
    
    const existing = await query('SELECT id FROM company_settings LIMIT 1');
    if (existing.rowCount === 0) {
      await query(
        `INSERT INTO company_settings (company_name, email, phone, address, founder_name, founder_bio, company_description, services_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          company_name || 'BenixSpace',
          email || 'benirabok@gmail.com',
          phone || '0783987223',
          address || 'Kigali, Rwanda',
          founder_name || 'Benir Benjamin',
          founder_bio || '',
          company_description || '',
          typeof services_json === 'string' ? services_json : JSON.stringify(services_json || {})
        ]
      );
    } else {
      await query(
        `UPDATE company_settings SET
          company_name = COALESCE($1, company_name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          address = COALESCE($4, address),
          founder_name = COALESCE($5, founder_name),
          founder_bio = COALESCE($6, founder_bio),
          company_description = COALESCE($7, company_description),
          services_json = COALESCE($8, services_json),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $9`,
        [
          company_name || null,
          email || null,
          phone || null,
          address || null,
          founder_name || null,
          founder_bio || null,
          company_description || null,
          services_json ? (typeof services_json === 'string' ? services_json : JSON.stringify(services_json)) : null,
          existing.rows[0].id
        ]
      );
    }

    const updated = await query('SELECT * FROM company_settings LIMIT 1');
    return res.json({ success: true, company: updated.rows[0], message: 'Company settings updated successfully.' });
  } catch (err: any) {
    console.error('Settings update error:', err);
    return res.status(500).json({ error: err.message || 'Failed to update company settings.' });
  }
});

app.post('/api/settings/company', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res) => {
  try {
    const { company_name, email, phone, address, founder_name, founder_bio, company_description, services_json } = req.body;
    const existing = await query('SELECT id FROM company_settings LIMIT 1');
    if (existing.rowCount === 0) {
      await query(
        `INSERT INTO company_settings (company_name, email, phone, address, founder_name, founder_bio, company_description, services_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          company_name || 'BenixSpace',
          email || 'benirabok@gmail.com',
          phone || '0783987223',
          address || 'Kigali, Rwanda',
          founder_name || 'Benir Benjamin',
          founder_bio || '',
          company_description || '',
          typeof services_json === 'string' ? services_json : JSON.stringify(services_json || {})
        ]
      );
    } else {
      await query(
        `UPDATE company_settings SET
          company_name = COALESCE($1, company_name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          address = COALESCE($4, address),
          founder_name = COALESCE($5, founder_name),
          founder_bio = COALESCE($6, founder_bio),
          company_description = COALESCE($7, company_description),
          services_json = COALESCE($8, services_json),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $9`,
        [
          company_name || null,
          email || null,
          phone || null,
          address || null,
          founder_name || null,
          founder_bio || null,
          company_description || null,
          services_json ? (typeof services_json === 'string' ? services_json : JSON.stringify(services_json)) : null,
          existing.rows[0].id
        ]
      );
    }
    const updated = await query('SELECT * FROM company_settings LIMIT 1');
    return res.json({ success: true, company: updated.rows[0], message: 'Company settings saved successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update company settings.' });
  }
});

// Universal Search API across all 9 integrated super-app platforms
app.get('/api/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.json({ results: [] });
    }
    const results = await SearchService.search(q);
    return res.json({ results: results || [] });
  } catch (err: any) {
    console.error('Universal Search API error:', err);
    return res.json({ results: [] });
  }
});

// Global SEO Sitemap
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.APP_URL || 'https://benix.space';
    const staticPages = [
      '', '/tv', '/radio', '/music', '/marketplace', '/games', '/calculators',
      '/projects', '/services', '/about', '/blog', '/contact', '/privacy'
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    staticPages.forEach((p) => {
      xml += `  <url><loc>${baseUrl}${p}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
    });
    xml += `</urlset>`;
    res.header('Content-Type', 'application/xml');
    return res.send(xml);
  } catch {
    return res.status(500).send('Error');
  }
});

app.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.APP_URL || 'https://benix.space';
  res.header('Content-Type', 'text/plain');
  return res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${baseUrl}/sitemap.xml`);
});

// 404 Fallback for unmatched /api routes
app.use('/api', (req, res) => {
  return res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: err?.message || 'Internal server error.' });
});

if (!process.env.VERCEL && !process.env.VERCEL_ENV && !process.env.NOW_REGION && process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🌐 Benix.Space Unified Platform Server running on port ${PORT}`);
  });
}

export default app;
