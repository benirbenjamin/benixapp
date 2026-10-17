// =====================================================================
// KUNDA SPACE: CONSOLIDATED SERVERLESS FUNCTION DISPATCHER (Vercel)
// =====================================================================
import registerHandler from './_routes/auth/register.js';
import loginHandler from './_routes/auth/login.js';
import meHandler from './_routes/auth/me.js';
import verifyEmailHandler from './_routes/auth/verify-email.js';
import forgotPasswordHandler from './_routes/auth/forgot-password.js';
import resetPasswordHandler from './_routes/auth/reset-password.js';
import uploadHandler from './_routes/upload/index.js';
import tutorialsHandler from './_routes/tutorials/index.js';
import discoverHandler from './_routes/members/discover.js';
import interactionHandler from './_routes/members/interaction.js';
import matchesHandler from './_routes/members/matches.js';
import conversationsHandler from './_routes/messages/conversations.js';
import sendHandler from './_routes/messages/send.js';
import unlockContactHandler from './_routes/messages/unlock-contact.js';
import balanceHandler from './_routes/wallet/balance.js';
import transactionsHandler from './_routes/wallet/transactions.js';
import withdrawHandler from './_routes/wallet/withdraw.js';
import initPaymentHandler from './_routes/payments/initialize.js';
import webhookHandler from './_routes/payments/webhook.js';
import verifyPaymentHandler from './_routes/payments/verify.js';
import plansHandler from './_routes/subscriptions/plans.js';
import subscribeHandler from './_routes/subscriptions/subscribe.js';
import notificationsHandler from './_routes/notifications/index.js';
import storiesHandler from './_routes/stories/index.js';
import postsHandler from './_routes/posts/index.js';
import adminMetricsHandler from './_routes/admin/metrics.js';
import adminUsersHandler from './_routes/admin/users.js';
import adminSettingsHandler from './_routes/admin/settings.js';
import adminModerationHandler from './_routes/admin/moderation.js';
import adminLedgerHandler from './_routes/admin/ledger.js';
import adminBackupHandler from './_routes/admin/backup.js';

const routes: Record<string, (req: any, res: any) => Promise<any> | any> = {
  'auth/login': loginHandler,
  'auth/register': registerHandler,
  'auth/me': meHandler,
  'auth/verify-email': verifyEmailHandler,
  'auth/forgot-password': forgotPasswordHandler,
  'auth/reset-password': resetPasswordHandler,
  'upload': uploadHandler,
  'tutorials': tutorialsHandler,
  'members/discover': discoverHandler,
  'members/interaction': interactionHandler,
  'members/matches': matchesHandler,
  'messages/conversations': conversationsHandler,
  'messages/send': sendHandler,
  'messages/unlock-contact': unlockContactHandler,
  'wallet/balance': balanceHandler,
  'wallet/transactions': transactionsHandler,
  'wallet/withdraw': withdrawHandler,
  'payments/initialize': initPaymentHandler,
  'payments/webhook': webhookHandler,
  'payments/verify': verifyPaymentHandler,
  'subscriptions/plans': plansHandler,
  'subscriptions/subscribe': subscribeHandler,
  'notifications': notificationsHandler,
  'stories': storiesHandler,
  'posts': postsHandler,
  'settings/public': (req: any, res: any) => {
    req.query = req.query || {};
    req.query.public = 'true';
    return adminSettingsHandler(req, res);
  },
  'admin/metrics': adminMetricsHandler,
  'admin/users': adminUsersHandler,
  'admin/settings': adminSettingsHandler,
  'admin/moderation': adminModerationHandler,
  'admin/ledger': adminLedgerHandler,
  'admin/backup': adminBackupHandler,
};

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Resolve path from query param (Vercel rewrite: /api/index?path=$1)
    let resolvedPath = '';
    if (Array.isArray(req.query?.path)) {
      resolvedPath = req.query.path.join('/');
    } else if (typeof req.query?.path === 'string') {
      resolvedPath = req.query.path;
    }

    // 2. Extract path from URL query string if not parsed in req.query
    if (!resolvedPath && typeof req.url === 'string') {
      const match = req.url.match(/[?&]path=([^&]+)/);
      if (match && match[1]) {
        resolvedPath = decodeURIComponent(match[1]);
      }
    }

    // 3. Fallback to matched headers or direct req.url
    if (!resolvedPath || resolvedPath === 'index') {
      const rawUrl =
        (req.headers['x-matched-path'] as string) ||
        (req.headers['x-forwarded-uri'] as string) ||
        req.url ||
        '';
      const cleanUrl = rawUrl.split('?')[0];
      resolvedPath = cleanUrl.replace(/^\/api\/?/, '').replace(/^\//, '');
    }

    // Normalize: strip leading/trailing slashes and leading 'api/'
    resolvedPath = resolvedPath
      .split('?')[0]
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
      .replace(/^api\//, '');

    // Safe body parsing: if body arrived as string, parse it to JSON
    if (typeof req.body === 'string' && req.body.trim().length > 0) {
      try {
        req.body = JSON.parse(req.body);
      } catch (parseErr) {
        console.warn('Failed to parse string request body as JSON:', parseErr);
      }
    } else if (!req.body && req.method !== 'GET') {
      req.body = {};
    }

    const targetHandler = routes[resolvedPath];

    if (targetHandler) {
      try {
        return await targetHandler(req, res);
      } catch (err: any) {
        console.error(`API execution error on [${req.method}] /api/${resolvedPath}:`, err);
        return res.status(500).json({
          success: false,
          error: err.message || 'Internal Server Error',
        });
      }
    }

    // Health check fallback
    if (resolvedPath === 'health' || resolvedPath === '' || resolvedPath === 'index') {
      return res.status(200).json({
        status: 'ok',
        platform: 'Kunda Space API',
        version: '1.0.0',
        resolvedPath,
      });
    }

    return res.status(404).json({
      success: false,
      error: `API route not found: /api/${resolvedPath}`,
    });
  } catch (fatalErr: any) {
    console.error('Fatal API dispatcher crash:', fatalErr);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: fatalErr?.message || 'Server execution error',
      });
    }
  }
}
