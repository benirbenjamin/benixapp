import { query } from '../db/db';
import { EmailService } from './emailService';
import * as webpushModule from 'web-push';
const webpush: any = webpushModule;

// In-memory / persistent VAPID key manager
let vapidInitialized = false;

async function getSystemSetting(key: string, defaultValue?: string): Promise<string | null> {
  const res = await query('SELECT value FROM system_settings WHERE key = $1', [key]).catch(() => ({ rowCount: 0, rows: [] }));
  if (res.rowCount > 0 && res.rows[0].value) return String(res.rows[0].value);
  return defaultValue || null;
}

async function setSystemSetting(key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO system_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value]
  ).catch(() => {});
}

async function initVapid(): Promise<{ publicKey: string; privateKey: string }> {
  let pub = await getSystemSetting('vapid_public_key');
  let priv = await getSystemSetting('vapid_private_key');

  if (!pub || !priv) {
    const keys = webpush.generateVAPIDKeys();
    pub = keys.publicKey;
    priv = keys.privateKey;
    await setSystemSetting('vapid_public_key', pub);
    await setSystemSetting('vapid_private_key', priv);
  }

  if (!vapidInitialized) {
    webpush.setVapidDetails('mailto:support@benix.space', pub, priv);
    vapidInitialized = true;
  }

  return { publicKey: pub, privateKey: priv };
}

export class BenixPayNotificationService {
  static async getVapidPublicKey(): Promise<string> {
    const { publicKey } = await initVapid();
    return publicKey;
  }

  /**
   * Dispatches multi-channel notification for payment.successful
   */
  static async notifyPaymentSuccess(params: {
    merchant: any;
    transaction: any;
  }): Promise<void> {
    const { merchant, transaction } = params;
    const isSandbox = transaction.mode === 'sandbox';
    const modeBadge = isSandbox ? '[SANDBOX TEST]' : '[LIVE]';

    const grossAmount = Number(transaction.amount);
    const feeAmount = Number(transaction.fee_amount || 0);
    const netAmount = Number(transaction.net_amount || grossAmount);
    const currency = transaction.currency || 'RWF';

    // 1. In-App Notification for Merchant
    await query(
      `INSERT INTO core_notifications (user_id, type, title, message, link, is_read, created_at)
       VALUES ($1, 'benixpay_payment', $2, $3, '/dashboard#pay', false, NOW())`,
      [
        merchant.user_id,
        `🎉 ${modeBadge} Payment Received: ${grossAmount.toLocaleString()} ${currency}`,
        `You received ${grossAmount.toLocaleString()} ${currency} via Benix Pay for Order #${transaction.order_reference} (Net Wallet Credit: ${netAmount.toLocaleString()} ${currency}). Customer: ${transaction.customer_email || 'N/A'}`
      ]
    ).catch(() => {});

    // 2. Native Web Push Notification for Merchant
    if (merchant.push_subscription && merchant.notify_on_payment !== false) {
      try {
        await initVapid();
        const payload = JSON.stringify({
          title: `Benix Pay: +${grossAmount.toLocaleString()} ${currency}`,
          body: `Order #${transaction.order_reference} confirmed! Net credit: ${netAmount.toLocaleString()} ${currency}`,
          icon: '/logo.png',
          badge: '/favicon.png',
          data: { url: '/dashboard#pay', txnId: transaction.id }
        });
        await webpush.sendNotification(merchant.push_subscription, payload).catch((err: any) => {
          console.warn('[BenixPay Push] Push delivery failed:', err.message);
        });
      } catch (e: any) {
        console.warn('[BenixPay Push] Error:', e.message);
      }
    }

    // 3. Email Receipt for Merchant
    if (merchant.business_email && merchant.notify_on_payment !== false) {
      try {
        await EmailService.sendEmail({
          to: merchant.business_email,
          subject: `${modeBadge} 🎉 Payment Received: ${grossAmount.toLocaleString()} ${currency} (Order #${transaction.order_reference})`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0b0e14; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 28px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Payment Successfully Received</h1>
                <p style="margin: 6px 0 0; font-size: 14px; color: #d1fae5; font-weight: 600;">${merchant.business_name} • Benix Pay ${modeBadge}</p>
              </div>

              <div style="padding: 28px;">
                <div style="background: #131926; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 12px;">
                    <span style="color: #94a3b8; font-size: 13px;">Transaction Reference:</span>
                    <strong style="color: #f1f5f9; font-size: 13px; font-family: monospace;">${transaction.id}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 12px;">
                    <span style="color: #94a3b8; font-size: 13px;">Order Reference:</span>
                    <strong style="color: #38bdf8; font-size: 13px;">#${transaction.order_reference}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 12px;">
                    <span style="color: #94a3b8; font-size: 13px;">Gross Customer Payment:</span>
                    <strong style="color: #f1f5f9; font-size: 14px;">${grossAmount.toLocaleString()} ${currency}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 12px;">
                    <span style="color: #94a3b8; font-size: 13px;">Platform Fee (${merchant.fee_percent || '4.5'}%):</span>
                    <span style="color: #f87171; font-size: 13px;">-${feeAmount.toLocaleString()} ${currency}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding-top: 4px;">
                    <span style="color: #34d399; font-weight: 700; font-size: 15px;">Net Credited to Wallet:</span>
                    <strong style="color: #34d399; font-size: 18px; font-weight: 900;">+${netAmount.toLocaleString()} ${currency}</strong>
                  </div>
                </div>

                <div style="background: #1a2234; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                  <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Customer Details</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #cbd5e1;"><strong>Email:</strong> ${transaction.customer_email || 'Not provided'}</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #cbd5e1;"><strong>Phone:</strong> ${transaction.customer_phone || 'Not provided'}</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #cbd5e1;"><strong>Payment Method:</strong> ${transaction.payment_method || 'MoMo / Card'}</p>
                </div>

                <p style="text-align: center; margin: 0; font-size: 12px; color: #64748b;">
                  Need assistance? Contact support at <a href="mailto:support@benix.space" style="color: #38bdf8;">support@benix.space</a>
                </p>
              </div>
            </div>
          `
        });
      } catch (err: any) {
        console.warn('[BenixPay Email] Merchant email delivery failed:', err.message);
      }
    }

    // 4. Email Receipt for Customer (Payer)
    if (transaction.customer_email) {
      try {
        await EmailService.sendEmail({
          to: transaction.customer_email,
          subject: `${modeBadge} Payment Receipt for ${merchant.business_name} (Ref: ${transaction.id})`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0b0e14; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden;">
              <div style="background: #1e293b; padding: 24px; text-align: center;">
                <h2 style="margin: 0; color: #ffffff;">Payment Confirmation</h2>
                <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Paid to <strong>${merchant.business_name}</strong> via Benix Pay</p>
              </div>

              <div style="padding: 24px;">
                <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #1e293b; margin-bottom: 20px;">
                  <span style="font-size: 12px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Amount Paid</span>
                  <div style="font-size: 32px; font-weight: 900; color: #10b981; margin: 8px 0;">
                    ${grossAmount.toLocaleString()} ${currency}
                  </div>
                  <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background: #064e3b; color: #34d399; font-size: 12px; font-weight: 700;">
                    Payment Successful
                  </span>
                </div>

                <div style="font-size: 13px; line-height: 1.8; color: #cbd5e1;">
                  <p style="margin: 4px 0;"><strong>Transaction ID:</strong> <span style="font-family: monospace;">${transaction.id}</span></p>
                  <p style="margin: 4px 0;"><strong>Order Reference:</strong> #${transaction.order_reference}</p>
                  <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date().toUTCString()}</p>
                  <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${transaction.payment_method || 'Mobile Money / Card'}</p>
                </div>

                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b;">
                  This is an official payment confirmation generated by Benix Pay for ${merchant.business_name}.
                </div>
              </div>
            </div>
          `
        });
      } catch (err: any) {
        console.warn('[BenixPay Email] Customer email delivery failed:', err.message);
      }
    }

    // 5. Admin Notification & High-Value Alert
    await query(
      `INSERT INTO admin_notifications (type, title, message, metadata, is_read, created_at)
       VALUES ('benixpay_revenue', 'Benix Pay Fee Collected', $1, $2, false, NOW())`,
      [
        `+${feeAmount.toLocaleString()} ${currency} fee from txn ${transaction.id} (Merchant: ${merchant.business_name})`,
        JSON.stringify({ transactionId: transaction.id, feeAmount, grossAmount, merchantId: merchant.id })
      ]
    ).catch(() => {});

    // Alert Admin on high-value transaction (> 100,000 RWF)
    if (grossAmount >= 100000 && !isSandbox) {
      try {
        const adminEmail = process.env.SUPERADMIN_EMAIL || 'benirabok@gmail.com';
        await EmailService.sendEmail({
          to: adminEmail,
          subject: `🚨 [High Value] Benix Pay Txn: ${grossAmount.toLocaleString()} ${currency} (${merchant.business_name})`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
              <h2 style="color: #38bdf8; margin-top: 0;">High Value Benix Pay Transaction Processed</h2>
              <p>A transaction exceeding 100,000 RWF was settled successfully:</p>
              <ul>
                <li><strong>Merchant:</strong> ${merchant.business_name} (${merchant.id})</li>
                <li><strong>Gross Amount:</strong> ${grossAmount.toLocaleString()} ${currency}</li>
                <li><strong>Platform Fee:</strong> ${feeAmount.toLocaleString()} ${currency}</li>
                <li><strong>Net Merchant Settlement:</strong> ${netAmount.toLocaleString()} ${currency}</li>
                <li><strong>Order Reference:</strong> ${transaction.order_reference}</li>
                <li><strong>Customer:</strong> ${transaction.customer_email || 'N/A'}</li>
              </ul>
            </div>
          `
        });
      } catch {}
    }
  }

  /**
   * Dispatches notifications for payment.failed or cancelled
   */
  static async notifyPaymentFailure(params: {
    merchant: any;
    transaction: any;
    status: 'failed' | 'cancelled';
    reason?: string;
  }): Promise<void> {
    const { merchant, transaction, status, reason = 'Transaction failed or was cancelled' } = params;
    const modeBadge = transaction.mode === 'sandbox' ? '[SANDBOX TEST]' : '[LIVE]';

    // Merchant in-app notification
    await query(
      `INSERT INTO core_notifications (user_id, type, title, message, link, is_read, created_at)
       VALUES ($1, 'benixpay_failed', $2, $3, '/dashboard#pay', false, NOW())`,
      [
        merchant.user_id,
        `⚠️ ${modeBadge} Payment ${status.toUpperCase()}: Order #${transaction.order_reference}`,
        `Payment of ${Number(transaction.amount).toLocaleString()} ${transaction.currency} ${status}. Reason: ${reason}`
      ]
    ).catch(() => {});

    // Customer email if email present
    if (transaction.customer_email) {
      try {
        await EmailService.sendEmail({
          to: transaction.customer_email,
          subject: `${modeBadge} Payment ${status === 'cancelled' ? 'Cancelled' : 'Unsuccessful'}: Order #${transaction.order_reference}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
              <h3 style="color: #f87171; margin-top: 0;">Payment ${status === 'cancelled' ? 'Cancelled' : 'Could Not Be Completed'}</h3>
              <p>Your payment of <strong>${Number(transaction.amount).toLocaleString()} ${transaction.currency}</strong> for Order <strong>#${transaction.order_reference}</strong> to ${merchant.business_name} was not completed.</p>
              <p style="background: #1e293b; padding: 12px; border-radius: 8px; color: #cbd5e1;">Reason: ${reason}</p>
              <p style="font-size: 12px; color: #94a3b8;">If you believe this was in error, please initiate checkout again or contact ${merchant.business_name}.</p>
            </div>
          `
        });
      } catch {}
    }
  }

  /**
   * Dispatches alerts when merchant submits KYC documents for live mode
   */
  static async notifyKycSubmitted(merchant: any): Promise<void> {
    const adminEmail = process.env.SUPERADMIN_EMAIL || 'benirabok@gmail.com';

    await query(
      `INSERT INTO admin_notifications (type, title, message, metadata, is_read, created_at)
       VALUES ('benixpay_kyc', 'New Benix Pay KYC Submission', $1, $2, false, NOW())`,
      [
        `Merchant "${merchant.business_name}" submitted business verification documents for Live Mode approval.`,
        JSON.stringify({ merchantId: merchant.id, businessName: merchant.business_name })
      ]
    ).catch(() => {});

    try {
      await EmailService.sendEmail({
        to: adminEmail,
        subject: `📋 Action Required: Benix Pay KYC Review for ${merchant.business_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
            <h2 style="color: #38bdf8; margin-top: 0;">Merchant KYC Verification Requested</h2>
            <p><strong>Merchant:</strong> ${merchant.business_name} (${merchant.id})</p>
            <p><strong>Email:</strong> ${merchant.business_email || 'N/A'}</p>
            <p>Please log into the Admin Control Center to inspect business registration and approve Live API Keys.</p>
          </div>
        `
      });
    } catch {}
  }

  /**
   * Dispatches alerts when KYC is approved or rejected
   */
  static async notifyKycDecision(merchant: any, approved: boolean, notes?: string): Promise<void> {
    const statusText = approved ? 'Approved & Live Mode Active' : 'Declined / Action Required';

    await query(
      `INSERT INTO core_notifications (user_id, type, title, message, link, is_read, created_at)
       VALUES ($1, 'benixpay_kyc_decision', $2, $3, '/dashboard#pay', false, NOW())`,
      [
        merchant.user_id,
        approved ? '🎉 Benix Pay Live Mode Approved!' : '⚠️ Benix Pay Live Verification Declined',
        approved
          ? 'Congratulations! Your Benix Pay Live API Keys are now active and ready to process real payments.'
          : `Your Benix Pay Live verification was not approved. Reason: ${notes || 'Documentation could not be verified'}.`
      ]
    ).catch(() => {});

    if (merchant.business_email) {
      try {
        await EmailService.sendEmail({
          to: merchant.business_email,
          subject: approved ? '🚀 Benix Pay Live Mode Activated!' : '⚠️ Benix Pay KYC Application Update',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
              <h2 style="color: ${approved ? '#34d399' : '#f87171'}; margin-top: 0;">${statusText}</h2>
              <p>Hello ${merchant.business_name},</p>
              <p>${approved ? 'Your business account has been verified and your Live API Keys (bp_live_pub_... and bp_live_sec_...) are now enabled to accept real customer payments via Mobile Money and Credit Cards.' : `We were unable to approve your application for live mode at this time. Notes: ${notes || 'Incomplete documentation'}.`}</p>
              <p style="margin-top: 20px;"><a href="https://benix.space/dashboard#pay" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Open Benix Pay Dashboard</a></p>
            </div>
          `
        });
      } catch {}
    }
  }

  /**
   * Dispatches alert when API keys are rotated
   */
  static async notifyKeysRotated(merchant: any, keyType: 'test' | 'live'): Promise<void> {
    await query(
      `INSERT INTO core_notifications (user_id, type, title, message, link, is_read, created_at)
       VALUES ($1, 'benixpay_keys_rotated', $2, $3, '/dashboard#pay', false, NOW())`,
      [
        merchant.user_id,
        `🔑 Security Alert: ${keyType.toUpperCase()} API Keys Regenerated`,
        `Your Benix Pay ${keyType.toUpperCase()} keys were rotated. Old secret keys have been revoked immediately.`
      ]
    ).catch(() => {});

    if (merchant.business_email) {
      try {
        await EmailService.sendEmail({
          to: merchant.business_email,
          subject: `🔐 Security Alert: Benix Pay ${keyType.toUpperCase()} Keys Rotated`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
              <h3 style="color: #f59e0b; margin-top: 0;">API Keys Rotated</h3>
              <p>The <strong>${keyType.toUpperCase()}</strong> credentials for ${merchant.business_name} were rotated on ${new Date().toUTCString()}.</p>
              <p>Please update your production and integration environments immediately with the newly generated keys.</p>
            </div>
          `
        });
      } catch {}
    }
  }
}
