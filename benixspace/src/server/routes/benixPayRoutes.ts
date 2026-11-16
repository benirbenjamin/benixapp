import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import https from 'https';
import { query } from '../db/db';
import { authenticateToken, requireAdminRole, AuthenticatedRequest } from '../auth/auth';
import {
  BenixPayService,
  isSafeWebhookUrl,
  maskSecretKey
} from '../services/benixPayService';
import { BenixPayNotificationService } from '../services/benixPayNotificationService';

export const benixPayRouter = Router();

// In-Memory Rate Limiter for Checkout API and Payment Submissions
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimiter(limit: number = 30, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= limit) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please slow down.'
      });
    }

    entry.count++;
    next();
  };
}

// Secret Key Authentication Middleware for Developer API
async function authenticateBenixPaySecret(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid Authorization header. Expected Bearer <SECRET_KEY>'
      });
    }

    const secretKey = authHeader.replace('Bearer ', '').trim();
    const authResult = await BenixPayService.authenticateBySecretKey(secretKey);

    if (!authResult) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API Secret Key.'
      });
    }

    (req as any).merchant = authResult.merchant;
    (req as any).payMode = authResult.mode;
    next();
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// =========================================================================
// 1. DEVELOPER REST API (v1)
// =========================================================================

/**
 * POST /api/v1/benixpay/checkout
 * External merchant endpoint to initialize a hosted checkout
 */
benixPayRouter.post('/api/v1/benixpay/checkout', rateLimiter(60, 60000), authenticateBenixPaySecret, async (req: Request, res: Response) => {
  try {
    const merchant = (req as any).merchant;
    const mode = (req as any).payMode;
    const {
      amount,
      currency = 'RWF',
      order_reference,
      customer_email,
      customer_phone,
      redirect_url,
      metadata
    } = req.body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Field "amount" must be a positive number.' });
    }
    if (!order_reference || typeof order_reference !== 'string') {
      return res.status(400).json({ success: false, error: 'Field "order_reference" is required.' });
    }

    const transaction = await BenixPayService.createCheckoutTransaction({
      merchant,
      mode,
      amount: Number(amount),
      currency: String(currency).toUpperCase(),
      order_reference,
      customer_email,
      customer_phone,
      redirect_url,
      metadata
    });

    const host = req.get('host') || 'benix.space';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const checkoutUrl = `${protocol}://${host}/pay/${transaction.id}`;

    return res.status(201).json({
      success: true,
      mode: transaction.mode,
      payment_id: transaction.id,
      checkout_url: checkoutUrl,
      amount: Number(transaction.amount),
      customer_pays: Number(transaction.customer_charged_amount),
      fee_amount: Number(transaction.fee_amount),
      net_amount: Number(transaction.net_amount),
      currency: transaction.currency,
      order_reference: transaction.order_reference,
      created_at: transaction.created_at
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/benixpay/transactions/:id
 * External merchant endpoint to check payment status
 */
benixPayRouter.get('/api/v1/benixpay/transactions/:id', authenticateBenixPaySecret, async (req: Request, res: Response) => {
  try {
    const merchant = (req as any).merchant;
    const txnId = req.params.id;

    const resTxn = await query(
      'SELECT * FROM benixpay_transactions WHERE id = $1 AND merchant_id = $2',
      [txnId, merchant.id]
    );

    if (resTxn.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }

    const t = resTxn.rows[0];
    return res.json({
      success: true,
      transaction: {
        id: t.id,
        mode: t.mode,
        order_reference: t.order_reference,
        amount: Number(t.amount),
        customer_charged_amount: Number(t.customer_charged_amount),
        fee_amount: Number(t.fee_amount),
        net_amount: Number(t.net_amount),
        currency: t.currency,
        status: t.status,
        customer_email: t.customer_email,
        customer_phone: t.customer_phone,
        payment_method: t.payment_method,
        settled_at: t.settled_at,
        created_at: t.created_at,
        metadata: t.metadata
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 2. HOSTED CHECKOUT PAGE PUBLIC ENDPOINTS
// =========================================================================

/**
 * GET /api/v1/benixpay/checkout/:id
 * Public checkout data for the customer payment page (/pay/:id)
 */
benixPayRouter.get('/api/v1/benixpay/checkout/:id', async (req: Request, res: Response) => {
  try {
    await BenixPayService.ensureTables();
    const txnId = req.params.id;

    const resTxn = await query(
      `SELECT t.*, m.business_name, m.business_email, m.is_live_enabled
       FROM benixpay_transactions t
       JOIN benixpay_merchants m ON t.merchant_id = m.id
       WHERE t.id = $1`,
      [txnId]
    );

    if (resTxn.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Checkout session not found or expired.' });
    }

    const t = resTxn.rows[0];
    return res.json({
      success: true,
      checkout: {
        id: t.id,
        merchant_name: t.business_name,
        mode: t.mode,
        order_reference: t.order_reference,
        amount: Number(t.amount),
        customer_charged_amount: Number(t.customer_charged_amount),
        fee_amount: Number(t.fee_amount),
        currency: t.currency,
        customer_email: t.customer_email,
        customer_phone: t.customer_phone,
        status: t.status,
        redirect_url: t.redirect_url,
        settled_at: t.settled_at,
        created_at: t.created_at
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/benixpay/checkout/:id/simulate
 * Interactive Sandbox Simulator endpoint (Allows testing Success, Insufficient Funds, and Cancel)
 */
benixPayRouter.post('/api/v1/benixpay/checkout/:id/simulate', rateLimiter(20, 60000), async (req: Request, res: Response) => {
  try {
    const txnId = req.params.id;
    const { outcome = 'successful', payment_method = 'momo_mtn', reason } = req.body;

    const resTxn = await query('SELECT * FROM benixpay_transactions WHERE id = $1', [txnId]);
    if (resTxn.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Checkout transaction not found.' });
    }

    const txn = resTxn.rows[0];
    if (txn.mode !== 'sandbox') {
      return res.status(400).json({ success: false, error: 'Simulation is only permitted in Sandbox Mode.' });
    }
    if (txn.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Transaction is already ${txn.status}.` });
    }

    if (outcome === 'successful') {
      const flwRef = `sim_flw_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const settlement = await BenixPayService.settleTransaction({
        transactionId: txnId,
        flwRef,
        paymentMethod: payment_method
      });
      return res.json({
        success: true,
        status: 'successful',
        transaction: settlement.transaction,
        redirect_url: txn.redirect_url
      });
    } else {
      const failReason = reason || (outcome === 'cancelled' ? 'Payment cancelled by customer' : 'Insufficient mobile money balance');
      const failedTxn = await BenixPayService.failTransaction({
        transactionId: txnId,
        status: outcome === 'cancelled' ? 'cancelled' : 'failed',
        reason: failReason
      });
      return res.json({
        success: true,
        status: outcome,
        transaction: failedTxn,
        redirect_url: txn.redirect_url
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/benixpay/checkout/:id/pay
 * Live Payment Initiation via Flutterwave Master Aggregation
 */
benixPayRouter.post('/api/v1/benixpay/checkout/:id/pay', rateLimiter(15, 60000), async (req: Request, res: Response) => {
  try {
    const txnId = req.params.id;
    const { phone_number, payment_method = 'momo_mtn' } = req.body;

    const resTxn = await query(
      `SELECT t.*, m.business_name
       FROM benixpay_transactions t
       JOIN benixpay_merchants m ON t.merchant_id = m.id
       WHERE t.id = $1`,
      [txnId]
    );

    if (resTxn.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }

    const txn = resTxn.rows[0];
    if (txn.status !== 'pending') {
      return res.status(400).json({ success: false, error: `Transaction is already ${txn.status}.` });
    }

    // In sandbox, redirect to simulator
    if (txn.mode === 'sandbox') {
      return res.json({
        success: true,
        mode: 'sandbox',
        requires_simulation: true,
        message: 'Sandbox transaction. Use the simulation controls to trigger test outcomes.'
      });
    }

    // Live Mode: Fetch master Flutterwave secret key
    const flwSetting = await query("SELECT secret_key FROM payment_settings WHERE id = 'flutterwave' LIMIT 1").catch(() => ({ rowCount: 0, rows: [] }));
    const flwSecret = flwSetting.rows[0]?.secret_key || process.env.FLUTTERWAVE_SECRET_KEY;

    if (!flwSecret) {
      return res.status(500).json({ success: false, error: 'Master payment gateway is currently unconfigured. Contact support.' });
    }

    const customerCharged = Number(txn.customer_charged_amount || txn.amount);
    const cleanPhone = (phone_number || txn.customer_phone || '').replace(/[^0-9]/g, '');

    if (!cleanPhone || cleanPhone.length < 9) {
      return res.status(400).json({ success: false, error: 'A valid customer phone number is required for Mobile Money.' });
    }

    // Call Flutterwave charge endpoint
    const postData = JSON.stringify({
      tx_ref: txn.id,
      amount: customerCharged,
      currency: txn.currency || 'RWF',
      email: txn.customer_email || 'checkout@benix.space',
      phone_number: cleanPhone,
      fullname: `Customer (${txn.business_name})`,
      order_id: txn.order_reference,
      redirect_url: `https://benix.space/pay/${txn.id}`
    });

    const flwRes: any = await new Promise((resolve, reject) => {
      const flwReq = https.request(
        {
          hostname: 'api.flutterwave.com',
          path: '/v3/charges?type=mobile_money_rwanda',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${flwSecret}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        },
        (resp) => {
          let data = '';
          resp.on('data', (c) => (data += c));
          resp.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve({ status: 'error', message: data });
            }
          });
        }
      );
      flwReq.on('error', reject);
      flwReq.write(postData);
      flwReq.end();
    });

    if (flwRes?.status === 'success') {
      return res.json({
        success: true,
        status: 'pending',
        message: 'Payment prompt sent to customer phone. Please authorize with your MoMo PIN.',
        flutterwave: flwRes
      });
    } else {
      return res.status(400).json({
        success: false,
        error: flwRes?.message || 'Failed to initiate Mobile Money charge with network provider.'
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/webhooks/benixpay/flutterwave
 * Master Flutterwave Webhook Listener for Benix Pay
 */
benixPayRouter.post('/api/webhooks/benixpay/flutterwave', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['verif-hash'];
    const expectedSecret = process.env.FLUTTERWAVE_SECRET_HASH || 'benix_pay_flw_secret';

    // Timing-safe signature check
    if (signature && typeof signature === 'string') {
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSecret);
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        console.warn('[BenixPay FLW Webhook] Invalid signature received.');
        return res.status(401).send('Invalid signature');
      }
    }

    const body = req.body;
    const txRef = body?.data?.tx_ref;
    const flwRef = String(body?.data?.flw_ref || body?.data?.id || `flw_${Date.now()}`);
    const status = body?.data?.status;

    if (!txRef || !txRef.startsWith('bp_txn_')) {
      // Not a Benix Pay transaction
      return res.status(200).send('Not Benix Pay reference, ignored');
    }

    if (status === 'successful') {
      await BenixPayService.settleTransaction({
        transactionId: txRef,
        flwRef,
        paymentMethod: body?.data?.payment_type || 'momo_mtn'
      });
    } else if (status === 'failed' || status === 'cancelled') {
      await BenixPayService.failTransaction({
        transactionId: txRef,
        status: status === 'cancelled' ? 'cancelled' : 'failed',
        reason: body?.data?.processor_response || 'Payment declined by processor'
      });
    }

    return res.status(200).send('Webhook processed');
  } catch (err: any) {
    console.error('[BenixPay FLW Webhook Error]', err);
    return res.status(500).send('Internal error');
  }
});

// =========================================================================
// 3. MERCHANT DASHBOARD CONTROLS (Authenticated User)
// =========================================================================

/**
 * GET /api/benixpay/merchant/me
 */
benixPayRouter.get('/api/benixpay/merchant/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const merchant = await BenixPayService.getMerchantByUserId(userId);

    if (!merchant) {
      return res.json({ success: true, registered: false });
    }

    return res.json({
      success: true,
      registered: true,
      merchant: {
        ...merchant,
        test_secret_key_masked: maskSecretKey(merchant.test_public_key.replace('_pub_', '_sec_')),
        live_secret_key_masked: maskSecretKey(merchant.live_public_key.replace('_pub_', '_sec_'))
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/benixpay/merchant/register
 */
benixPayRouter.post('/api/benixpay/merchant/register', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;
    const { business_name, business_email = userEmail } = req.body;

    if (!business_name || !business_name.trim()) {
      return res.status(400).json({ success: false, error: 'Business name is required.' });
    }

    const result = await BenixPayService.registerMerchant(userId, business_name, business_email);

    return res.status(201).json({
      success: true,
      merchant: result.merchant,
      credentials: result.credentials // Shown once on creation so merchant can save securely!
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/benixpay/merchant/rotate-keys
 */
benixPayRouter.post('/api/benixpay/merchant/rotate-keys', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { keyType = 'test' } = req.body;

    if (keyType !== 'test' && keyType !== 'live') {
      return res.status(400).json({ success: false, error: 'keyType must be "test" or "live".' });
    }

    const merchant = await BenixPayService.getMerchantByUserId(userId);
    if (!merchant) {
      return res.status(404).json({ success: false, error: 'Merchant not registered.' });
    }

    const creds = await BenixPayService.rotateKeys(merchant.id, keyType);

    return res.json({
      success: true,
      keyType,
      credentials: creds // Plaintext shown once
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/benixpay/merchant/settings
 */
benixPayRouter.post('/api/benixpay/merchant/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const merchant = await BenixPayService.getMerchantByUserId(userId);
    if (!merchant) return res.status(404).json({ success: false, error: 'Merchant not found.' });

    const {
      business_name,
      business_email,
      webhook_url,
      fee_bearer,
      push_subscription,
      notify_on_payment
    } = req.body;

    if (webhook_url && !isSafeWebhookUrl(webhook_url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or unsafe webhook URL. Localhost and private IP addresses are prohibited.'
      });
    }

    const updated = await query(
      `UPDATE benixpay_merchants
       SET business_name = COALESCE($1, business_name),
           business_email = COALESCE($2, business_email),
           webhook_url = COALESCE($3, webhook_url),
           fee_bearer = COALESCE($4, fee_bearer),
           push_subscription = COALESCE($5, push_subscription),
           notify_on_payment = COALESCE($6, notify_on_payment),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [
        business_name?.trim() || null,
        business_email?.trim() || null,
        webhook_url !== undefined ? webhook_url.trim() : null,
        fee_bearer === 'customer' ? 'customer' : (fee_bearer === 'merchant' ? 'merchant' : null),
        push_subscription ? JSON.stringify(push_subscription) : null,
        notify_on_payment !== undefined ? Boolean(notify_on_payment) : null,
        merchant.id
      ]
    );

    return res.json({
      success: true,
      merchant: updated.rows[0],
      message: 'Merchant settings saved successfully.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/benixpay/merchant/kyc/submit
 */
benixPayRouter.post('/api/benixpay/merchant/kyc/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const merchant = await BenixPayService.getMerchantByUserId(userId);
    if (!merchant) return res.status(404).json({ success: false, error: 'Merchant not found.' });

    const { business_reg_number, tin_number, owner_id_type, owner_id_number, document_urls, notes } = req.body;

    if (!business_reg_number || !tin_number) {
      return res.status(400).json({ success: false, error: 'Business Registration Number and TIN are required.' });
    }

    const kycPayload = {
      business_reg_number,
      tin_number,
      owner_id_type,
      owner_id_number,
      document_urls: Array.isArray(document_urls) ? document_urls : [],
      notes
    };

    const updated = await query(
      `UPDATE benixpay_merchants
       SET kyc_status = 'pending',
           kyc_data = $1,
           kyc_submitted_at = NOW(),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(kycPayload), merchant.id]
    );

    await BenixPayNotificationService.notifyKycSubmitted(updated.rows[0]);

    return res.json({
      success: true,
      merchant: updated.rows[0],
      message: 'KYC documents submitted. Our compliance team will review within 24 hours.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/benixpay/merchant/transactions
 */
benixPayRouter.get('/api/benixpay/merchant/transactions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const merchant = await BenixPayService.getMerchantByUserId(userId);
    if (!merchant) return res.json({ success: true, transactions: [] });

    const mode = req.query.mode as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    let sql = 'SELECT * FROM benixpay_transactions WHERE merchant_id = $1';
    const params: any[] = [merchant.id];

    if (mode && mode !== 'all') {
      params.push(mode);
      sql += ` AND mode = $${params.length}`;
    }
    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(order_reference) LIKE $${params.length} OR LOWER(id) LIKE $${params.length} OR LOWER(customer_email) LIKE $${params.length})`;
    }

    sql += ' ORDER BY created_at DESC LIMIT 100';

    const txns = await query(sql, params);
    return res.json({ success: true, transactions: txns.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/benixpay/merchant/test-webhook
 */
benixPayRouter.post('/api/benixpay/merchant/test-webhook', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const merchant = await BenixPayService.getMerchantByUserId(userId);
    if (!merchant) return res.status(404).json({ success: false, error: 'Merchant not found.' });

    if (!merchant.webhook_url) {
      return res.status(400).json({ success: false, error: 'Please configure a Webhook URL first.' });
    }

    const testPayload = {
      test: true,
      message: 'This is a test webhook event from Benix Pay',
      merchant_id: merchant.id,
      timestamp: new Date().toISOString()
    };

    const startTime = Date.now();
    const result = await BenixPayService.dispatchWebhook(merchant, 'test.ping', testPayload);
    const duration = Date.now() - startTime;

    return res.json({
      success: result.success,
      status_code: result.statusCode,
      latency_ms: duration,
      message: result.success
        ? `Test webhook delivered successfully in ${duration}ms (HTTP ${result.statusCode}).`
        : `Webhook endpoint returned HTTP ${result.statusCode || 'timeout/error'}.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/benixpay/vapid-public-key
 */
benixPayRouter.get('/api/benixpay/vapid-public-key', async (_req: Request, res: Response) => {
  try {
    const key = await BenixPayNotificationService.getVapidPublicKey();
    return res.json({ success: true, publicKey: key });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 4. ADMIN KYC APPROVAL / REJECTION ENDPOINTS
// =========================================================================

benixPayRouter.get('/api/benixpay/admin/merchants', authenticateToken, requireAdminRole, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const merchants = await query('SELECT * FROM benixpay_merchants ORDER BY created_at DESC');
    return res.json({ success: true, merchants: merchants.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

benixPayRouter.post('/api/benixpay/admin/merchants/:id/kyc', authenticateToken, requireAdminRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { approve, notes } = req.body;
    const merchantId = req.params.id;

    const mRes = await query('SELECT * FROM benixpay_merchants WHERE id = $1', [merchantId]);
    if (mRes.rowCount === 0) return res.status(404).json({ success: false, error: 'Merchant not found.' });

    const isApproved = Boolean(approve);
    const updated = await query(
      `UPDATE benixpay_merchants
       SET is_live_enabled = $1,
           kyc_status = $2,
           kyc_reviewed_at = NOW(),
           kyc_notes = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [isApproved, isApproved ? 'approved' : 'rejected', notes || null, merchantId]
    );

    await BenixPayNotificationService.notifyKycDecision(updated.rows[0], isApproved, notes);

    return res.json({
      success: true,
      merchant: updated.rows[0],
      message: `Merchant KYC ${isApproved ? 'Approved (Live Mode Active)' : 'Declined'}.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
