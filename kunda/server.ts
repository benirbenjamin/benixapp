// =====================================================================
// KUNDA SPACE: CONSOLIDATED EXPRESS API SERVER & SERVERLESS ENTRY
// =====================================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import API route handlers from consolidated _routes directory
import registerHandler from './api/_routes/auth/register.js';
import loginHandler from './api/_routes/auth/login.js';
import meHandler from './api/_routes/auth/me.js';
import verifyEmailHandler from './api/_routes/auth/verify-email.js';
import forgotPasswordHandler from './api/_routes/auth/forgot-password.js';
import resetPasswordHandler from './api/_routes/auth/reset-password.js';
import uploadHandler from './api/_routes/upload/index.js';
import tutorialsHandler from './api/_routes/tutorials/index.js';
import discoverHandler from './api/_routes/members/discover.js';
import interactionHandler from './api/_routes/members/interaction.js';
import matchesHandler from './api/_routes/members/matches.js';
import conversationsHandler from './api/_routes/messages/conversations.js';
import sendHandler from './api/_routes/messages/send.js';
import unlockContactHandler from './api/_routes/messages/unlock-contact.js';
import balanceHandler from './api/_routes/wallet/balance.js';
import transactionsHandler from './api/_routes/wallet/transactions.js';
import withdrawHandler from './api/_routes/wallet/withdraw.js';
import initPaymentHandler from './api/_routes/payments/initialize.js';
import webhookHandler from './api/_routes/payments/webhook.js';
import verifyPaymentHandler from './api/_routes/payments/verify.js';
import plansHandler from './api/_routes/subscriptions/plans.js';
import subscribeHandler from './api/_routes/subscriptions/subscribe.js';
import notificationsHandler from './api/_routes/notifications/index.js';
import storiesHandler from './api/_routes/stories/index.js';
import postsHandler from './api/_routes/posts/index.js';
import adminMetricsHandler from './api/_routes/admin/metrics.js';
import adminUsersHandler from './api/_routes/admin/users.js';
import adminSettingsHandler from './api/_routes/admin/settings.js';
import adminModerationHandler from './api/_routes/admin/moderation.js';
import adminLedgerHandler from './api/_routes/admin/ledger.js';
import adminBackupHandler from './api/_routes/admin/backup.js';
import { runDatabaseBackup } from './scripts/backup-db.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper adapter for Vercel function signature
const wrap = (handler: any) => async (req: express.Request, res: express.Response) => {
  try {
    await handler(req, res);
  } catch (err: any) {
    console.error('Unhandled API error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }
};

// Dual-bind helper so routes work whether accessed at /api/... or routed directly
const bindRoute = (routePath: string, handler: any) => {
  const withoutApi = routePath.replace(/^\/api/, '');
  app.all(routePath, wrap(handler));
  if (withoutApi && withoutApi !== routePath) {
    app.all(withoutApi, wrap(handler));
  }
};

// Auth routes
bindRoute('/api/auth/register', registerHandler);
bindRoute('/api/auth/login', loginHandler);
bindRoute('/api/auth/me', meHandler);
bindRoute('/api/auth/verify-email', verifyEmailHandler);
bindRoute('/api/auth/forgot-password', forgotPasswordHandler);
bindRoute('/api/auth/reset-password', resetPasswordHandler);

// Uploads (Google Drive) & Tutorials
bindRoute('/api/upload', uploadHandler);
bindRoute('/api/tutorials', tutorialsHandler);

// Members & Matching routes
bindRoute('/api/members/discover', discoverHandler);
bindRoute('/api/members/interaction', interactionHandler);
bindRoute('/api/members/matches', matchesHandler);

// Messaging & Contact Unlock
bindRoute('/api/messages/conversations', conversationsHandler);
bindRoute('/api/messages/send', sendHandler);
bindRoute('/api/messages/unlock-contact', unlockContactHandler);

// Wallet & Ledger
bindRoute('/api/wallet/balance', balanceHandler);
bindRoute('/api/wallet/transactions', transactionsHandler);
bindRoute('/api/wallet/withdraw', withdrawHandler);

// Payments (Flutterwave)
bindRoute('/api/payments/initialize', initPaymentHandler);
bindRoute('/api/payments/webhook', webhookHandler);
bindRoute('/api/payments/verify', verifyPaymentHandler);

// Subscriptions
bindRoute('/api/subscriptions/plans', plansHandler);
bindRoute('/api/subscriptions/subscribe', subscribeHandler);

// Notifications
bindRoute('/api/notifications', notificationsHandler);

// Stories & Posts
bindRoute('/api/stories', storiesHandler);
bindRoute('/api/posts', postsHandler);

// Admin routes
bindRoute('/api/admin/metrics', adminMetricsHandler);
bindRoute('/api/admin/users', adminUsersHandler);
bindRoute('/api/admin/settings', adminSettingsHandler);
bindRoute('/api/admin/moderation', adminModerationHandler);
bindRoute('/api/admin/ledger', adminLedgerHandler);
bindRoute('/api/settings/public', (req: any, res: any) => {
  req.query = req.query || {};
  req.query.public = 'true';
  return adminSettingsHandler(req, res);
});
bindRoute('/api/admin/backup', adminBackupHandler);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', platform: 'Kunda Space API', version: '1.0.0' });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', platform: 'Kunda Space API', version: '1.0.0' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✨ Kunda Space API Server listening on port ${PORT}`);

    // Schedule automated daily database backup check (runs once every 24 hours)
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    // Initial check 30 seconds after server startup
    setTimeout(() => {
      runDatabaseBackup().catch((e: any) => console.warn('Automated startup backup notice:', e?.message));
    }, 30000);

    // Recurring 24-hour backup cycle
    setInterval(() => {
      runDatabaseBackup().catch((e: any) => console.warn('Automated daily backup notice:', e?.message));
    }, TWENTY_FOUR_HOURS);
  });
}

export default app;
