// =====================================================================
// POST /api/auth/verify-email - Verify Email by Code or Link Token
// =====================================================================
import crypto from 'crypto';
import { memoryStore, query } from '../../_lib/db.js';
import { sendVerificationEmail } from '../../_lib/email.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, code, token, action } = req.body || {};

    if (!email && !token) {
      return res.status(400).json({ success: false, error: 'Email address or verification token is required' });
    }

    let user = null;
    if (token) {
      user = memoryStore.users.find((u) => u.verificationToken === token);
    } else if (email) {
      user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }

    if (!user && email) {
      const uRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      if (uRes && uRes.rows && uRes.rows.length > 0) {
        user = uRes.rows[0];
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    // Handle RESEND Code action
    if (action === 'resend') {
      const isAlreadyVerified = Boolean(user.emailVerified ?? user.email_verified);
      if (isAlreadyVerified) {
        return res.status(200).json({ success: true, message: 'Your account email is already verified. You can log in.' });
      }

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newToken = crypto.randomBytes(32).toString('hex');
      user.verificationCode = newCode;
      user.verificationToken = newToken;
      user.verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      let profile = memoryStore.profiles.find((p) => p.userId === user.id);
      if (!profile) {
        const pRes = await query('SELECT * FROM profiles WHERE user_id = $1', [user.id]);
        if (pRes?.rows?.[0]) profile = pRes.rows[0];
      }

      const proto = (req.headers && req.headers['x-forwarded-proto']) || 'https';
      const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || 'kunda-rose.vercel.app';
      const appUrl = `${proto}://${host}`;

      try {
        await Promise.race([
          sendVerificationEmail(
            user.email,
            profile?.displayName || profile?.display_name || 'Member',
            newCode,
            newToken,
            appUrl
          ),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Email dispatch timeout')), 8000))
        ]);
      } catch (sendErr) {
        console.warn('Resend verification email notice:', sendErr);
      }

      return res.status(200).json({
        success: true,
        message: 'A fresh 6-digit confirmation code has been dispatched to your email inbox.',
      });
    }

    // If already verified
    if (user.emailVerified || user.email_verified) {
      return res.status(200).json({ success: true, message: 'Email is already verified.' });
    }

    // Verify matching code or token
    const isCodeMatch = code && user.verificationCode === code.toString().trim();
    const isTokenMatch = token && user.verificationToken === token;

    if (!isCodeMatch && !isTokenMatch) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired confirmation code. Please check your email or request a new code.',
      });
    }

    // Mark verified
    user.emailVerified = true;
    user.verificationCode = null;
    user.verificationToken = null;

    // Update in database if connected
    await query('UPDATE users SET email_verified = true WHERE id = $1', [user.id]);

    return res.status(200).json({
      success: true,
      message: 'Congratulations! Your email address has been verified. Welcome to Kunda Space.',
    });
  } catch (err: any) {
    console.error('Verify email API error:', err);
    return res.status(500).json({ success: false, error: 'Failed to verify email address' });
  }
}
