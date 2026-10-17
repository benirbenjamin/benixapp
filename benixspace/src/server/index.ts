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

    // Query core_users
    let user: any = null;
    const userRes = await query('SELECT * FROM core_users WHERE email = $1', [cleanEmail]);
    if (userRes.rowCount > 0) {
      user = userRes.rows[0];
    }

    // Check super admin credentials: benirabok@gmail.com with 1202!birthDATE
    const isSuperAdminEmail = cleanEmail === 'benirabok@gmail.com';
    const isSuperAdminPass = password === '1202!birthDATE' || password === 'BenixSpace2026!';

    if (!user) {
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
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify Password
    let match = await comparePassword(password, user.password_hash);
    if (!match && isSuperAdminEmail && isSuperAdminPass) {
      match = true;
    }

    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Fetch Wallet
    const wallet = await WalletService.getOrCreateWallet(user.id);
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
        balance: Number(wallet.balance),
        currency: wallet.currency
      }
    });
  } catch (err: any) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: err.message || 'Login failed.' });
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
    const result = await query('SELECT * FROM tv.stations ORDER BY display_order ASC, name ASC');
    return res.json({ stations: result.rows });
  } catch (err: any) {
    return res.json({ stations: [] });
  }
});

app.get('/api/modules/tv/videos', async (req, res) => {
  try {
    const result = await query('SELECT * FROM tv.videos ORDER BY publication_date DESC, created_at DESC LIMIT 30');
    return res.json({ videos: result.rows });
  } catch (err: any) {
    return res.json({ videos: [] });
  }
});

// B. Radio Module
app.get('/api/modules/radio/stations', async (req, res) => {
  try {
    const result = await query('SELECT * FROM radio.radio_stations ORDER BY is_default DESC, name ASC');
    return res.json({ stations: result.rows });
  } catch (err: any) {
    return res.json({ stations: [] });
  }
});

app.get('/api/modules/radio/programs', async (req, res) => {
  try {
    const result = await query('SELECT * FROM radio.programs ORDER BY start_time ASC');
    return res.json({ programs: result.rows });
  } catch (err: any) {
    return res.json({ programs: [] });
  }
});

app.get('/api/modules/radio/news', async (req, res) => {
  try {
    const result = await query('SELECT * FROM radio.news_articles ORDER BY published_at DESC LIMIT 20');
    return res.json({ articles: result.rows });
  } catch (err: any) {
    return res.json({ articles: [] });
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
