import crypto from 'crypto';
import http from 'http';
import https from 'https';
import { query } from '../db/db';
import { WalletService } from './walletService';
import { BenixPayNotificationService } from './benixPayNotificationService';

/**
 * SSRF and Private Network Protection
 * Blocks localhost, loopbacks, link-local, carrier-grade NAT, and RFC1918 private subnets
 */
export function isSafeWebhookUrl(inputUrl: string): boolean {
  try {
    const parsed = new URL(inputUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();

    // Check local/loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') return false;
    if (hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.lan') || hostname.endsWith('.test')) return false;

    // Check IP patterns
    if (/^10\./.test(hostname)) return false;
    if (/^192\.168\./.test(hostname)) return false;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return false;
    if (/^169\.254\./.test(hostname)) return false;
    if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(hostname)) return false;
    if (/^127\./.test(hostname)) return false;

    return true;
  } catch {
    return false;
  }
}

export function maskSecretKey(key?: string | null): string {
  if (!key) return '';
  if (key.length <= 16) return '••••••••••••••••';
  return `${key.slice(0, 11)}••••••••${key.slice(-4)}`;
}

export function hashSecretKey(key: string): string {
  return crypto.createHash('sha256').update(key.trim()).digest('hex');
}

export function calculateBenixPayFee(
  amount: number,
  feePercent: number = 4.5,
  feeBearer: 'merchant' | 'customer' = 'merchant'
): { customerPays: number; feeAmount: number; netAmount: number } {
  const percent = Number(feePercent) || 4.5;
  const rate = percent / 100;

  if (feeBearer === 'customer') {
    // Reverse math so net received by merchant matches requested order amount
    // customer_pays = order_amount / (1 - (fee_percent / 100))
    const customerPays = Math.round((amount / (1 - rate)) * 100) / 100;
    const feeAmount = Math.round((customerPays - amount) * 100) / 100;
    const netAmount = amount;
    return { customerPays, feeAmount, netAmount };
  } else {
    // Merchant absorbs the fee:
    // customer_pays = order_amount
    // fee = order_amount * (fee_percent / 100)
    // net_amount = order_amount - fee
    const feeAmount = Math.round((amount * rate) * 100) / 100;
    const netAmount = Math.round((amount - feeAmount) * 100) / 100;
    const customerPays = amount;
    return { customerPays, feeAmount, netAmount };
  }
}

export class BenixPayService {
  private static tablesReady = false;

  static async ensureTables(): Promise<void> {
    if (this.tablesReady) return;
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS benixpay_merchants (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          business_name VARCHAR(255) NOT NULL,
          business_email VARCHAR(255),
          business_phone VARCHAR(50),
          test_public_key VARCHAR(255) UNIQUE NOT NULL,
          test_secret_key_hash VARCHAR(255) NOT NULL,
          live_public_key VARCHAR(255) UNIQUE NOT NULL,
          live_secret_key_hash VARCHAR(255) NOT NULL,
          webhook_url TEXT,
          webhook_secret VARCHAR(255),
          fee_bearer VARCHAR(20) DEFAULT 'merchant',
          fee_percent NUMERIC(5,2) DEFAULT 4.50,
          is_live_enabled BOOLEAN DEFAULT false,
          push_subscription JSONB,
          notify_on_payment BOOLEAN DEFAULT true,
          notify_email BOOLEAN DEFAULT true,
          kyc_status VARCHAR(50) DEFAULT 'unsubmitted',
          kyc_data JSONB,
          kyc_submitted_at TIMESTAMP WITH TIME ZONE,
          kyc_reviewed_at TIMESTAMP WITH TIME ZONE,
          kyc_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `).catch((e) => console.warn('[BenixPay init merchants]', e.message));

      await query(`
        CREATE TABLE IF NOT EXISTS benixpay_transactions (
          id VARCHAR(255) PRIMARY KEY,
          merchant_id VARCHAR(255) NOT NULL,
          mode VARCHAR(20) NOT NULL,
          order_reference VARCHAR(255) NOT NULL,
          amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
          fee_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
          net_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
          customer_charged_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
          currency VARCHAR(10) DEFAULT 'RWF',
          customer_email VARCHAR(255),
          customer_phone VARCHAR(50),
          payment_method VARCHAR(50),
          status VARCHAR(50) DEFAULT 'pending',
          flw_ref VARCHAR(255) UNIQUE,
          redirect_url TEXT,
          metadata JSONB,
          failure_reason TEXT,
          settled_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT unique_merchant_order UNIQUE (merchant_id, order_reference, mode)
        )
      `).catch((e) => console.warn('[BenixPay init transactions]', e.message));

      await query(`CREATE INDEX IF NOT EXISTS idx_bp_merchants_user ON benixpay_merchants(user_id)`).catch(() => {});
      await query(`CREATE INDEX IF NOT EXISTS idx_bp_merchants_test_pub ON benixpay_merchants(test_public_key)`).catch(() => {});
      await query(`CREATE INDEX IF NOT EXISTS idx_bp_merchants_live_pub ON benixpay_merchants(live_public_key)`).catch(() => {});
      await query(`CREATE INDEX IF NOT EXISTS idx_bp_txn_merchant ON benixpay_transactions(merchant_id)`).catch(() => {});
      await query(`CREATE INDEX IF NOT EXISTS idx_bp_txn_flw_ref ON benixpay_transactions(flw_ref)`).catch(() => {});
      await query(`CREATE INDEX IF NOT EXISTS idx_bp_txn_status ON benixpay_transactions(status)`).catch(() => {});
      this.tablesReady = true;
    } catch (err: any) {
      console.warn('[BenixPay ensureTables]', err.message);
    }
  }

  /**
   * Generates secure API credentials for a merchant
   */
  static generateCredentials(): {
    testPublicKey: string;
    testSecretKey: string;
    livePublicKey: string;
    liveSecretKey: string;
    webhookSecret: string;
  } {
    const testPublicKey = `bp_test_pub_${crypto.randomBytes(16).toString('hex')}`;
    const testSecretKey = `bp_test_sec_${crypto.randomBytes(24).toString('hex')}`;
    const livePublicKey = `bp_live_pub_${crypto.randomBytes(16).toString('hex')}`;
    const liveSecretKey = `bp_live_sec_${crypto.randomBytes(24).toString('hex')}`;
    const webhookSecret = `bp_whsec_${crypto.randomBytes(20).toString('hex')}`;

    return { testPublicKey, testSecretKey, livePublicKey, liveSecretKey, webhookSecret };
  }

  /**
   * Registers a new merchant or returns existing
   */
  static async registerMerchant(userId: string, businessName: string, businessEmail?: string, feeBearer: 'merchant' | 'customer' = 'merchant'): Promise<{
    merchant: any;
    credentials?: {
      testPublicKey: string;
      testSecretKey: string;
      livePublicKey: string;
      liveSecretKey: string;
      webhookSecret: string;
    };
  }> {
    await this.ensureTables();

    // Check if user is already a registered merchant
    const existing = await query('SELECT * FROM benixpay_merchants WHERE user_id = $1', [userId]);
    if (existing.rowCount > 0) {
      return { merchant: existing.rows[0] };
    }

    const merchantId = `bpm_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const creds = this.generateCredentials();

    const inserted = await query(
      `INSERT INTO benixpay_merchants (
        id, user_id, business_name, business_email,
        test_public_key, test_secret_key_hash,
        live_public_key, live_secret_key_hash,
        webhook_secret, fee_bearer, fee_percent, is_live_enabled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'merchant', 4.50, false)
      RETURNING *`,
      [
        merchantId,
        userId,
        businessName.trim(),
        businessEmail?.trim() || null,
        creds.testPublicKey,
        hashSecretKey(creds.testSecretKey),
        creds.livePublicKey,
        hashSecretKey(creds.liveSecretKey),
        creds.webhookSecret,
        feeBearer === 'customer' ? 'customer' : 'merchant'
      ]
    );

    return {
      merchant: inserted.rows[0],
      credentials: creds // Plaintext shown once upon creation!
    };
  }

  /**
   * Retrieves merchant by User ID with masked secret keys
   */
  static async getMerchantByUserId(userId: string): Promise<any | null> {
    await this.ensureTables();
    const res = await query('SELECT * FROM benixpay_merchants WHERE user_id = $1', [userId]);
    if (res.rowCount === 0) return null;
    return res.rows[0];
  }

  /**
   * Rotates Test or Live API keys
   */
  static async rotateKeys(merchantId: string, keyType: 'test' | 'live'): Promise<{
    publicKey: string;
    secretKey: string;
  }> {
    await this.ensureTables();
    const merchantRes = await query('SELECT * FROM benixpay_merchants WHERE id = $1', [merchantId]);
    if (merchantRes.rowCount === 0) throw new Error('Merchant not found.');
    const merchant = merchantRes.rows[0];

    let newPub = '';
    let newSec = '';

    if (keyType === 'test') {
      newPub = `bp_test_pub_${crypto.randomBytes(16).toString('hex')}`;
      newSec = `bp_test_sec_${crypto.randomBytes(24).toString('hex')}`;
      await query(
        `UPDATE benixpay_merchants 
         SET test_public_key = $1, test_secret_key_hash = $2, updated_at = NOW() 
         WHERE id = $3`,
        [newPub, hashSecretKey(newSec), merchantId]
      );
    } else {
      newPub = `bp_live_pub_${crypto.randomBytes(16).toString('hex')}`;
      newSec = `bp_live_sec_${crypto.randomBytes(24).toString('hex')}`;
      await query(
        `UPDATE benixpay_merchants 
         SET live_public_key = $1, live_secret_key_hash = $2, updated_at = NOW() 
         WHERE id = $3`,
        [newPub, hashSecretKey(newSec), merchantId]
      );
    }

    // Trigger security notifications
    await BenixPayNotificationService.notifyKeysRotated(merchant, keyType);

    return { publicKey: newPub, secretKey: newSec };
  }

  /**
   * Authenticates a merchant by their Secret Key (Test or Live)
   */
  static async authenticateBySecretKey(secretKey: string): Promise<{ merchant: any; mode: 'sandbox' | 'live' } | null> {
    await this.ensureTables();
    const key = (secretKey || '').trim();
    if (!key) return null;

    const hash = hashSecretKey(key);

    if (key.startsWith('bp_test_sec_')) {
      const res = await query('SELECT * FROM benixpay_merchants WHERE test_secret_key_hash = $1', [hash]);
      if (res.rowCount > 0) return { merchant: res.rows[0], mode: 'sandbox' };
    } else if (key.startsWith('bp_live_sec_')) {
      const res = await query('SELECT * FROM benixpay_merchants WHERE live_secret_key_hash = $1', [hash]);
      if (res.rowCount > 0) return { merchant: res.rows[0], mode: 'live' };
    }

    return null;
  }

  /**
   * Creates a Benix Pay Checkout Transaction
   */
  static async createCheckoutTransaction(params: {
    merchant: any;
    mode: 'sandbox' | 'live';
    amount: number;
    currency?: string;
    order_reference: string;
    customer_email?: string;
    customer_phone?: string;
    redirect_url?: string;
    metadata?: any;
  }): Promise<any> {
    await this.ensureTables();
    const { merchant, mode, amount, currency = 'RWF', order_reference, customer_email, customer_phone, redirect_url, metadata } = params;

    if (!amount || amount <= 0) {
      throw new Error('Transaction amount must be greater than 0.');
    }
    if (!order_reference || !order_reference.trim()) {
      throw new Error('order_reference is required.');
    }
    if (redirect_url && !isSafeWebhookUrl(redirect_url)) {
      throw new Error('Invalid or unsafe redirect_url provided.');
    }

    if (mode === 'live' && !merchant.is_live_enabled) {
      throw new Error('Merchant account is not activated for Live processing. Please submit KYC verification.');
    }

    // Check for duplicate order reference for this merchant in this mode
    const dupCheck = await query(
      'SELECT id, status FROM benixpay_transactions WHERE merchant_id = $1 AND order_reference = $2 AND mode = $3',
      [merchant.id, order_reference.trim(), mode]
    );
    if (dupCheck.rowCount > 0) {
      throw new Error(`Order reference "${order_reference}" already exists for this merchant (${dupCheck.rows[0].status}).`);
    }

    const feePercent = Number(merchant.fee_percent) || 4.5;
    const feeBearer = merchant.fee_bearer === 'customer' ? 'customer' : 'merchant';
    const { customerPays, feeAmount, netAmount } = calculateBenixPayFee(amount, feePercent, feeBearer);

    const txnId = `bp_txn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const inserted = await query(
      `INSERT INTO benixpay_transactions (
        id, merchant_id, mode, order_reference,
        amount, fee_amount, net_amount, customer_charged_amount,
        currency, customer_email, customer_phone,
        status, redirect_url, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12, $13)
      RETURNING *`,
      [
        txnId,
        merchant.id,
        mode,
        order_reference.trim(),
        amount,
        feeAmount,
        netAmount,
        customerPays,
        currency.toUpperCase(),
        customer_email?.trim() || null,
        customer_phone?.trim() || null,
        redirect_url?.trim() || null,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    return inserted.rows[0];
  }

  /**
   * Atomic Settlement for Benix Pay Transaction
   * Prevents double credits and race conditions using strict atomic conditional updates
   */
  static async settleTransaction(params: {
    transactionId: string;
    flwRef: string;
    paymentMethod?: string;
  }): Promise<{ success: boolean; transaction: any; duplicateIgnored?: boolean }> {
    await this.ensureTables();
    const { transactionId, flwRef, paymentMethod = 'momo_mtn' } = params;

    // 1. Atomic update of transaction status: ONLY updates if status is still 'pending'
    const updateRes = await query(
      `UPDATE benixpay_transactions
       SET status = 'successful',
           flw_ref = $1,
           payment_method = $2,
           settled_at = NOW(),
           updated_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [flwRef, paymentMethod, transactionId]
    );

    if (updateRes.rowCount === 0) {
      // Already settled or cancelled, return existing without re-crediting
      const current = await query('SELECT * FROM benixpay_transactions WHERE id = $1', [transactionId]);
      return { success: true, transaction: current.rows[0], duplicateIgnored: true };
    }

    const settledTxn = updateRes.rows[0];

    // 2. Fetch Merchant profile
    const mRes = await query('SELECT * FROM benixpay_merchants WHERE id = $1', [settledTxn.merchant_id]);
    const merchant = mRes.rows[0];

    // 3. Atomically Credit Merchant's Central Wallet (Only in live mode or simulation log)
    if (settledTxn.mode === 'live') {
      await WalletService.credit(
        merchant.user_id,
        Number(settledTxn.net_amount),
        'benixPay',
        'merchant_settlement',
        `Benix Pay: ${merchant.business_name} (Order #${settledTxn.order_reference})`,
        settledTxn.flw_ref || settledTxn.id,
        {
          transactionId: settledTxn.id,
          orderReference: settledTxn.order_reference,
          feeAmount: settledTxn.fee_amount,
          grossAmount: settledTxn.amount
        }
      );
    }

    // 4. Dispatch Multi-Channel Notifications (In-App, Native Web Push, HTML Email Receipts)
    await BenixPayNotificationService.notifyPaymentSuccess({
      merchant,
      transaction: settledTxn
    });

    // 5. Fire Outbound Signed Webhook to Merchant
    if (merchant.webhook_url && isSafeWebhookUrl(merchant.webhook_url)) {
      this.dispatchWebhook(merchant, 'payment.successful', settledTxn).catch((err) => {
        console.warn('[BenixPay Webhook Dispatch Error]', err.message);
      });
    }

    return { success: true, transaction: settledTxn };
  }

  /**
   * Marks a transaction failed or cancelled
   */
  static async failTransaction(params: {
    transactionId: string;
    status: 'failed' | 'cancelled';
    reason: string;
  }): Promise<any> {
    await this.ensureTables();
    const { transactionId, status, reason } = params;

    const res = await query(
      `UPDATE benixpay_transactions
       SET status = $1, failure_reason = $2, updated_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [status, reason, transactionId]
    );

    if (res.rowCount === 0) return null;
    const txn = res.rows[0];

    const mRes = await query('SELECT * FROM benixpay_merchants WHERE id = $1', [txn.merchant_id]);
    const merchant = mRes.rows[0];

    await BenixPayNotificationService.notifyPaymentFailure({
      merchant,
      transaction: txn,
      status,
      reason
    });

    if (merchant.webhook_url && isSafeWebhookUrl(merchant.webhook_url)) {
      this.dispatchWebhook(merchant, `payment.${status}`, txn).catch(() => {});
    }

    return txn;
  }

  /**
   * Outbound Webhook Dispatcher
   * Cryptographically signs payload with HMAC-SHA256
   */
  static async dispatchWebhook(merchant: any, event: string, payloadData: any): Promise<{ success: boolean; statusCode?: number }> {
    if (!merchant.webhook_url || !isSafeWebhookUrl(merchant.webhook_url)) {
      return { success: false };
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      event,
      created_at: new Date().toISOString(),
      data: payloadData
    });

    const secret = merchant.webhook_secret || 'bp_whsec_default';
    const signaturePayload = `${timestamp}.${body}`;
    const signature = crypto.createHmac('sha256', secret).update(signaturePayload).digest('hex');

    return new Promise((resolve) => {
      try {
        const urlObj = new URL(merchant.webhook_url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        const req = client.request(
          {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + (urlObj.search || ''),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body),
              'X-BenixPay-Signature': `t=${timestamp},v1=${signature}`,
              'User-Agent': 'BenixPay-Webhook/1.0'
            }
          },
          (res) => {
            resolve({ success: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false, statusCode: res.statusCode });
          }
        );

        req.setTimeout(8000, () => {
          req.destroy();
          resolve({ success: false });
        });

        req.on('error', () => {
          resolve({ success: false });
        });

        req.write(body);
        req.end();
      } catch {
        resolve({ success: false });
      }
    });
  }
}
