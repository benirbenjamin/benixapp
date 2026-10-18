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
  AuthenticatedRequest
} from './auth/auth';
import { WalletService } from './services/walletService';
import { ReferralService } from './services/referralService';
import { TranslationService } from './services/translationService';
import { StorageService } from './services/storageService';
import { SearchService } from './services/searchService';
import { EmailService } from './services/emailService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// ==================== 1. UNIFIED AUTH & ONBOARDING WIZARD ==================== //

/**
 * 4-Step Registration Wizard
 * Step 1: Account info (email, password, name, terms)
 * Step 2: Selected interests/modules
 * Step 3: Preferences (language, homepage layout)
 * Step 4: Referral attribution & wallet auto-provisioning
 */
app.post('/api/auth/register-wizard', async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      selected_modules = ['videos', 'music', 'dating', 'marketplace', 'radio', 'games', 'calc', 'news'],
      preferred_language = 'en',
      homepage_layout = { order: ['videos', 'music', 'dating', 'marketplace', 'radio', 'games', 'calc', 'news'] },
      referral_code
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Check existing email
    const existing = await query('SELECT id FROM core_users WHERE email = $1', [cleanEmail]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    const pwdHash = await hashPassword(password);
    const userId = 'usr_' + crypto.randomUUID();
    const userReferralCode = 'REF-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    // Insert user into core_users
    const userRes = await query(
      `INSERT INTO core_users (
        id, email, password_hash, name, phone, preferred_language,
        selected_modules, homepage_layout, referral_code, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
      RETURNING id, email, name, role, phone, preferred_language, selected_modules, homepage_layout, referral_code`,
      [
        userId, cleanEmail, pwdHash, name.trim(), phone || null, preferred_language,
        JSON.stringify(selected_modules), JSON.stringify(homepage_layout), userReferralCode
      ]
    );

    const user = userRes.rows[0];

    // Create Initial Central Wallet with welcome bonus (100 RWF)
    const wallet = await WalletService.getOrCreateWallet(user.id);
    await WalletService.credit(
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
      wallet: { balance: 100.00, currency: 'RWF' },
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
    const { email, password } = req.body;
    if (!email || !password) {
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

    // 4. Fetch Wallet with graceful fallback
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
        referral_code: user.referral_code
      },
      wallet: {
        balance: Number(wallet.balance || 100.00),
        currency: wallet.currency || 'RWF'
      }
    });
  } catch (err: any) {
    console.error('Login Error:', err);
    return res.status(400).json({ error: err.message || 'Login failed. Please verify your credentials.' });
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
      if (req.user?.email === 'benirabok@gmail.com') {
        return res.json({
          user: {
            id: req.user.id,
            email: req.user.email,
            name: 'Benir Benjamin (Super Admin)',
            role: 'superadmin',
            referral_code: 'BENIX-SUPERADMIN',
            selected_modules: ['videos', 'music', 'dating', 'marketplace', 'radio', 'games', 'calc', 'news']
          },
          wallet: { balance: 100000.00, currency: 'RWF' }
        });
      }
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];
    const wallet = await WalletService.getOrCreateWallet(user.id);
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
        referral_code: user.referral_code
      },
      wallet: {
        balance: Number(wallet.balance),
        pending_balance: Number(wallet.pending_balance),
        currency: wallet.currency,
        total_earnings: Number(wallet.total_earnings),
        total_withdrawn: Number(wallet.total_withdrawn)
      },
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

// ==================== 2. CENTRAL WALLET API ==================== //

app.get('/api/wallet', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const wallet = await WalletService.getOrCreateWallet(req.user!.id);
    const transactions = await WalletService.getTransactions(req.user!.id, 20);
    return res.json({
      wallet: {
        balance: Number(wallet.balance),
        pending_balance: Number(wallet.pending_balance),
        currency: wallet.currency,
        total_earnings: Number(wallet.total_earnings),
        total_withdrawn: Number(wallet.total_withdrawn)
      },
      transactions
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/wallet/deposit', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { amount, paymentMethod = 'MTN_MOMO' } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid deposit amount is required.' });
    }

    const result = await WalletService.credit(
      req.user!.id,
      numAmount,
      'wallet',
      'deposit',
      `Deposit via ${paymentMethod}`,
      `tx_dep_${Date.now()}`
    );

    // Trigger qualifying referral reward if applicable
    await ReferralService.triggerQualifyingEvent(req.user!.id, 'first_deposit', 'wallet');

    return res.json({
      success: true,
      newBalance: result.newBalance,
      message: `Successfully deposited ${numAmount} RWF into your unified wallet.`
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
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

    return res.json({
      success: true,
      message: 'Withdrawal request submitted for processing.',
      withdrawalId: result.withdrawalId
    });
  } catch (err: any) {
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
  return res.json(StorageService.getConfig());
});

app.post('/api/admin/settings/storage', authenticateToken, requireAdminRole, async (req, res) => {
  try {
    const { clientId, clientSecret, refreshToken, folderId } = req.body;
    StorageService.setConfig({
      clientId: clientId || undefined,
      clientSecret: clientSecret && clientSecret !== '********' ? clientSecret : undefined,
      refreshToken: refreshToken && refreshToken !== '********' ? refreshToken : undefined,
      folderId: folderId || undefined
    });
    return res.json({
      success: true,
      message: 'Google Drive storage settings updated successfully.',
      config: StorageService.getConfig()
    });
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

app.get('/api/modules/tv/videos', async (req, res) => {
  try {
    const result = await query('SELECT * FROM tv.videos ORDER BY publication_date DESC, created_at DESC LIMIT 30');
    if (result.rowCount > 0) return res.json({ videos: result.rows });
  } catch (err: any) {}
  
  return res.json({
    videos: [
      {
        id: 'vid-rtv-news-1',
        title: 'RTV Tele-Amakuru: Amakuru yo ku mugoroba',
        slug: 'rtv-tele-amakuru-umugoroba',
        description: 'Amakuru yose agezweho mu gihugu no hanze yacyo atambutswa live kuri Rwanda Television.',
        thumbnail_url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80',
        stream_url: 'https://5c46fa289c89f.streamlock.net/rtv25/rtv/playlist.m3u8',
        duration_seconds: 2700,
        duration_label: '45:00',
        views_count: 14500,
        category: 'News & Current Affairs',
        publication_date: 'Today'
      },
      {
        id: 'vid-kc2-sports-2',
        title: 'KC2 Sports Zone: Rwanda Premier League & Tour du Rwanda Highlights',
        slug: 'kc2-sports-zone-highlights',
        description: 'Inshamake z’imikino yabaye muri shampiyona y’u Rwanda n’isiganwa mpuzamahanga ry’amagare.',
        thumbnail_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=80',
        stream_url: 'https://5c46fa289c89f.streamlock.net/kc2/kc2/playlist.m3u8',
        duration_seconds: 3600,
        duration_label: '1:00:00',
        views_count: 18200,
        category: 'Sports',
        publication_date: 'Yesterday'
      }
    ]
  });
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

// C. Marketplace Module
app.get('/api/modules/marketplace/products', async (req, res) => {
  try {
    const result = await query('SELECT * FROM marketplace."Product" LIMIT 20');
    return res.json({ products: result.rows });
  } catch (err: any) {
    return res.json({ products: [] });
  }
});

app.get('/api/modules/marketplace/services', async (req, res) => {
  try {
    const result = await query('SELECT * FROM marketplace."Service" LIMIT 20');
    return res.json({ services: result.rows });
  } catch (err: any) {
    return res.json({ services: [] });
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
      query('SELECT COUNT(*) as count FROM core_users'),
      query('SELECT COALESCE(SUM(balance), 0) as total FROM core_wallets'),
      query('SELECT COUNT(*) as count FROM tv.stations'),
      query('SELECT COUNT(*) as count FROM radio.radio_stations'),
      query('SELECT COUNT(*) as count FROM games.game_rooms'),
      query('SELECT COUNT(*) as count FROM marketplace."Product"'),
      query('SELECT COUNT(*) as count FROM articles')
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

// Company Settings
app.get('/api/settings', async (req, res) => {
  try {
    const companyRes = await query('SELECT * FROM company_settings LIMIT 1');
    const socialRes = await query('SELECT * FROM social_links ORDER BY sort_order ASC');
    return res.json({
      company: companyRes.rows[0],
      social: socialRes.rows
    });
  } catch (err: any) {
    return res.json({ company: {}, social: [] });
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

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: err?.message || 'Internal server error.' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🌐 Benix.Space Unified Platform Server running on port ${PORT}`);
  });
}

export default app;
