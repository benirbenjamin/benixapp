import https from 'https';
import crypto from 'crypto';
import { query } from '../db/db';
import { EmailService } from './emailService';

async function getSystemSetting(key: string, defaultValue?: string): Promise<string | null> {
  const res = await query('SELECT value FROM system_settings WHERE key = $1', [key]).catch(() => ({ rowCount: 0, rows: [] }));
  if (res.rowCount > 0 && res.rows[0].value !== null && res.rows[0].value !== undefined && String(res.rows[0].value).trim() !== '') {
    return String(res.rows[0].value);
  }
  const coreRes = await query('SELECT value FROM core_system_settings WHERE key = $1', [key]).catch(() => ({ rowCount: 0, rows: [] }));
  if (coreRes.rowCount > 0 && coreRes.rows[0].value !== null && coreRes.rows[0].value !== undefined && String(coreRes.rows[0].value).trim() !== '') {
    return String(coreRes.rows[0].value);
  }
  return defaultValue !== undefined ? defaultValue : null;
}

async function setSystemSetting(key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO system_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value]
  ).catch(() => {});
  await query(
    `INSERT INTO core_system_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value]
  ).catch(() => {});
}

async function getFlutterwaveSecretKey(): Promise<string> {
  try {
    const row = await query("SELECT secret_key FROM payment_settings WHERE id = 'flutterwave' LIMIT 1").catch(() => ({ rowCount: 0, rows: [] }));
    if (row.rowCount > 0 && row.rows[0].secret_key) {
      return String(row.rows[0].secret_key).trim();
    }
  } catch {}
  return (process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK-850b999b626b35d6a06e8cdcf50d14a1-1a0684d29b4vt-X').trim();
}

/**
 * Call Flutterwave HTTP API
 */
function callFlutterwaveApi(path: string, method: string = 'GET', data?: any): Promise<any> {
  return new Promise(async (resolve, reject) => {
    try {
      const secretKey = await getFlutterwaveSecretKey();
      const payload = data ? JSON.stringify(data) : null;

      const req = https.request(
        {
          hostname: 'api.flutterwave.com',
          port: 443,
          path: path,
          method: method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${secretKey}`,
            ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
          }
        },
        (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              resolve(parsed);
            } catch {
              resolve({ raw: body, statusCode: res.statusCode });
            }
          });
        }
      );

      req.setTimeout(12000, () => {
        req.destroy(new Error('Flutterwave API timeout after 12s'));
      });

      req.on('error', (err) => reject(err));
      if (payload) req.write(payload);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

export class WithdrawalService {
  /**
   * Get all withdrawals with joined user details and 4 summary KPI stats
   */
  static async listWithdrawals(): Promise<any> {
    const listRes = await query(`
      SELECT w.*, 
             u.name as user_name, 
             u.email as user_email, 
             u.phone as user_phone,
             u.role as user_role
      FROM core_withdrawals w
      LEFT JOIN core_users u ON w.user_id = u.id
      ORDER BY w.created_at DESC 
      LIMIT 150
    `);

    // 1. Total Withdrawn by Users (completed & non-admin)
    const userWithdrawnRes = await query(`
      SELECT COALESCE(SUM(COALESCE(w.net_amount, w.amount)), 0) as total 
      FROM core_withdrawals w
      LEFT JOIN core_users u ON w.user_id = u.id
      WHERE w.status IN ('COMPLETED', 'PARTIAL') 
        AND (u.role IS NULL OR u.role NOT IN ('superadmin', 'admin'))
    `).catch(() => ({ rows: [{ total: 0 }] }));

    // 2. Total Withdrawn by Admin
    const adminWithdrawnRes = await query(`
      SELECT COALESCE(SUM(COALESCE(w.net_amount, w.amount)), 0) as total 
      FROM core_withdrawals w
      LEFT JOIN core_users u ON w.user_id = u.id
      WHERE w.status IN ('COMPLETED', 'PARTIAL') 
        AND u.role IN ('superadmin', 'admin')
    `).catch(() => ({ rows: [{ total: 0 }] }));

    // 3. Total of all users account balance in system (not yet withdrawn)
    const userBalancesRes = await query(`
      SELECT COALESCE(SUM(balance), 0) as total 
      FROM core_wallets
    `).catch(() => ({ rows: [{ total: 0 }] }));

    // 4. Total user earnings in system
    const userEarningsRes = await query(`
      SELECT COALESCE(SUM(total_earnings), 0) as total 
      FROM core_wallets
    `).catch(() => ({ rows: [{ total: 0 }] }));

    // Check Flutterwave live balance
    let flwBal = 0;
    let flwCurrency = 'RWF';
    try {
      const flwRes = await callFlutterwaveApi('/v3/balances');
      if (flwRes?.data && Array.isArray(flwRes.data)) {
        const rwfItem = flwRes.data.find((b: any) => b.currency === 'RWF') || flwRes.data[0];
        if (rwfItem) {
          flwBal = Number(rwfItem.available_balance || rwfItem.ledger_balance || 0);
          flwCurrency = rwfItem.currency || 'RWF';
        }
      }
    } catch {}

    const feeStr = await getSystemSetting('withdrawal_fee_percent', '3');
    const defaultFeePercent = parseFloat(feeStr || '3') || 3;

    return {
      withdrawals: listRes.rows,
      kpi: {
        totalUserWithdrawn: Number(userWithdrawnRes.rows[0]?.total || 0),
        totalAdminWithdrawn: Number(adminWithdrawnRes.rows[0]?.total || 0),
        totalUserBalances: Number(userBalancesRes.rows[0]?.total || 0),
        totalUserEarnings: Number(userEarningsRes.rows[0]?.total || 0),
        flutterwaveBalance: flwBal,
        flutterwaveCurrency: flwCurrency
      },
      settings: {
        defaultFeePercent
      }
    };
  }

  /**
   * Approve a withdrawal (Full or Partial) with fee deduction and optional direct Flutterwave transfer
   */
  static async approveWithdrawal(
    id: string,
    approvedAmount: number,
    feePercent: number,
    sendViaFlutterwave: boolean = true,
    note?: string
  ): Promise<any> {
    const wRes = await query('SELECT * FROM core_withdrawals WHERE id = $1', [id]);
    if (wRes.rowCount === 0) throw new Error('Withdrawal request not found.');

    const w = wRes.rows[0];
    if (w.status === 'COMPLETED') throw new Error('Withdrawal is already completed.');

    const reqAmount = Number(w.amount);
    const appAmount = Math.min(reqAmount, Math.max(1, Number(approvedAmount)));
    const feeRate = Math.max(0, Math.min(50, Number(feePercent) || 0));

    // Fee calculation
    const feeDeducted = Math.round(appAmount * (feeRate / 100));
    const netAmount = Math.max(0, appAmount - feeDeducted);
    const unapprovedRemainder = Math.max(0, reqAmount - appAmount);
    const isPartial = unapprovedRemainder > 0;

    let flwTransferRef = '';
    let flwStatus = 'manual';

    // 1. Direct Flutterwave transfer if requested
    if (sendViaFlutterwave && netAmount > 0) {
      let accDetails: any = {};
      try {
        accDetails = typeof w.account_details === 'string' ? JSON.parse(w.account_details) : w.account_details || {};
      } catch {}

      const recipientNumber = String(accDetails.accountNumber || accDetails.phone || '').trim();
      if (!recipientNumber) {
        throw new Error('Recipient account number/phone is missing in withdrawal details.');
      }

      // Check balance first
      try {
        const balRes = await callFlutterwaveApi('/v3/balances');
        if (balRes?.data && Array.isArray(balRes.data)) {
          const rwfItem = balRes.data.find((b: any) => b.currency === 'RWF') || balRes.data[0];
          const available = rwfItem ? Number(rwfItem.available_balance || 0) : 0;
          if (available < netAmount) {
            throw new Error(`Flutterwave account needs topup to approve this withdrawal. (Available: ${available.toLocaleString()} RWF, Needed: ${netAmount.toLocaleString()} RWF)`);
          }
        }
      } catch (balErr: any) {
        if (balErr.message.includes('Flutterwave account needs topup')) throw balErr;
      }

      // Initiate Flutterwave Transfer
      const transferPayload = {
        account_bank: w.payout_method === 'BANK' ? 'MPS' : 'MPS',
        account_number: recipientNumber,
        amount: netAmount,
        narration: `BenixSpace Withdrawal #${id}`,
        currency: 'RWF',
        reference: `flw_tx_${id}_${Date.now()}`,
        debit_currency: 'RWF'
      };

      const flwResult = await callFlutterwaveApi('/v3/transfers', 'POST', transferPayload);

      if (flwResult?.status !== 'success') {
        const errMsg = flwResult?.message || '';
        if (errMsg.toLowerCase().includes('insufficient') || errMsg.toLowerCase().includes('balance')) {
          throw new Error('Flutterwave account needs topup to approve this withdrawal.');
        }
        throw new Error(flwResult?.message || 'Flutterwave transfer failed. Please verify credentials or top up.');
      }

      flwTransferRef = String(flwResult?.data?.id || flwResult?.data?.reference || '');
      flwStatus = flwResult?.data?.status || 'SUCCESSFUL';
    }

    // 2. Update Database: core_withdrawals
    await query(
      `UPDATE core_withdrawals 
       SET status = $1,
           fee_percent = $2,
           fee_deducted = $3,
           net_amount = $4,
           is_partial = $5,
           flutterwave_ref = $6,
           flutterwave_status = $7,
           admin_note = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [
        isPartial ? 'PARTIAL' : 'COMPLETED',
        feeRate,
        feeDeducted,
        netAmount,
        isPartial,
        flwTransferRef,
        flwStatus,
        note || (isPartial ? 'Partial withdrawal approved' : 'Approved by administrator'),
        id
      ]
    );

    // 3. Reconcile user's wallet:
    // - Deduct full requested amount from pending_balance
    // - Add approved amount to total_withdrawn
    // - If partial: refund unapprovedRemainder back to user's real balance!
    await query(
      `UPDATE core_wallets 
       SET pending_balance = GREATEST(0, pending_balance - $1),
           total_withdrawn = total_withdrawn + $2,
           balance = balance + $3,
           updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $4`,
      [reqAmount, appAmount, unapprovedRemainder, w.user_id]
    );

    // 4. Ledger entry in core_wallet_transactions
    await query(
      `INSERT INTO core_wallet_transactions 
       (id, wallet_id, user_id, module, type, amount, fee, currency, status, reference, description)
       VALUES ($1, $2, $3, 'wallet', 'withdrawal_approved', $4, $5, 'RWF', 'completed', $6, $7)`,
      [
        'cwt-' + crypto.randomUUID(),
        w.wallet_id || ('wallet-' + w.user_id),
        w.user_id,
        -netAmount,
        feeDeducted,
        flwTransferRef || `wd_payout_${id}`,
        `Withdrawal Payout via ${w.payout_method} (Approved: ${appAmount} RWF, Fee: ${feeDeducted} RWF, Received: ${netAmount} RWF)`
      ]
    );

    if (unapprovedRemainder > 0) {
      await query(
        `INSERT INTO core_wallet_transactions 
         (id, wallet_id, user_id, module, type, amount, fee, currency, status, reference, description)
         VALUES ($1, $2, $3, 'wallet', 'withdrawal_partial_refund', $4, 0.00, 'RWF', 'completed', $5, $6)`,
        [
          'cwt-' + crypto.randomUUID(),
          w.wallet_id || ('wallet-' + w.user_id),
          w.user_id,
          unapprovedRemainder,
          `ref_part_${id}`,
          `Partial Withdrawal Refund (${unapprovedRemainder.toLocaleString()} RWF refunded back to balance)`
        ]
      );
    }

    // 5. Send rich breakdown confirmation email to User
    const uRes = await query('SELECT email, name FROM core_users WHERE id = $1', [w.user_id]);
    if (uRes.rowCount > 0) {
      const u = uRes.rows[0];
      EmailService.sendEmail({
        to: u.email,
        subject: `Payout Confirmation: ${netAmount.toLocaleString()} RWF sent to your ${w.payout_method}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; padding: 24px; background: #0B0E14; color: #fff; border-radius: 16px; border: 1px solid #1E293B;">
            <h2 style="color: #10B981; margin-top: 0;">🎉 Withdrawal Payout Successful!</h2>
            <p>Hello ${u.name},</p>
            <p>Your withdrawal request #${id} has been approved and processed.</p>
            <div style="background: #161D2E; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #334155;">
              <p style="margin: 6px 0;"><strong>Requested Amount:</strong> ${reqAmount.toLocaleString()} RWF</p>
              <p style="margin: 6px 0;"><strong>Approved Amount:</strong> ${appAmount.toLocaleString()} RWF ${isPartial ? '<span style="color: #38BDF8;">(Partial)</span>' : ''}</p>
              <p style="margin: 6px 0; color: #F87171;"><strong>Platform Fee (${feeRate}%):</strong> -${feeDeducted.toLocaleString()} RWF</p>
              <hr style="border: 0; border-top: 1px solid #334155; margin: 10px 0;" />
              <p style="margin: 6px 0; font-size: 16px; color: #34D399;"><strong>Final Amount Received:</strong> ${netAmount.toLocaleString()} RWF</p>
              ${unapprovedRemainder > 0 ? `<p style="margin: 6px 0; color: #60A5FA;"><strong>Refunded to Real Wallet:</strong> ${unapprovedRemainder.toLocaleString()} RWF</p>` : ''}
              <p style="margin: 6px 0; font-size: 12px; color: #94A3B8;">Payout Method: ${w.payout_method} • BenixSpace</p>
            </div>
            <p style="font-size: 13px; color: #94A3B8;">Thank you for being part of the BenixSpace creator ecosystem!</p>
          </div>
        `
      }).catch(() => {});
    }

    return {
      success: true,
      id,
      requestedAmount: reqAmount,
      approvedAmount: appAmount,
      feeDeducted,
      netAmount,
      refundedToUser: unapprovedRemainder,
      isPartial,
      flutterwaveRef: flwTransferRef
    };
  }

  /**
   * Reject a withdrawal: full amount is refunded back to user's real wallet balance
   */
  static async rejectWithdrawal(id: string, reason?: string): Promise<any> {
    const wRes = await query('SELECT * FROM core_withdrawals WHERE id = $1', [id]);
    if (wRes.rowCount === 0) throw new Error('Withdrawal request not found.');

    const w = wRes.rows[0];
    if (w.status === 'COMPLETED') throw new Error('Cannot reject an already completed withdrawal.');

    const refundAmount = Number(w.amount);

    // 1. Update withdrawal status
    await query(
      "UPDATE core_withdrawals SET status = 'REJECTED', admin_note = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [reason || 'Rejected by administrator', id]
    );

    // 2. Refund full amount back to user available wallet balance
    await query(
      `UPDATE core_wallets 
       SET balance = balance + $1, 
           pending_balance = GREATEST(0, pending_balance - $1),
           updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2`,
      [refundAmount, w.user_id]
    );

    // 3. Ledger entry
    await query(
      `INSERT INTO core_wallet_transactions 
       (id, wallet_id, user_id, module, type, amount, fee, currency, status, reference, description)
       VALUES ($1, $2, $3, 'wallet', 'withdrawal_refund', $4, 0.00, 'RWF', 'completed', $5, $6)`,
      [
        'cwt-' + crypto.randomUUID(),
        w.wallet_id || ('wallet-' + w.user_id),
        w.user_id,
        refundAmount,
        `tx_rej_${id}`,
        `Withdrawal Rejected & Refunded: ${reason || 'Administrator review'}`
      ]
    );

    // 4. Send email alert to user
    const uRes = await query('SELECT email, name FROM core_users WHERE id = $1', [w.user_id]);
    if (uRes.rowCount > 0) {
      const u = uRes.rows[0];
      EmailService.sendEmail({
        to: u.email,
        subject: `Update on Withdrawal Request #${id} - Refunded to Wallet`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; padding: 24px; background: #0B0E14; color: #fff; border-radius: 16px; border: 1px solid #1E293B;">
            <h2 style="color: #F87171; margin-top: 0;">Withdrawal Request Update</h2>
            <p>Hello ${u.name},</p>
            <p>Your withdrawal request for <strong>${refundAmount.toLocaleString()} RWF</strong> has been rejected by our compliance team.</p>
            <div style="background: #161D2E; padding: 14px; border-radius: 12px; margin: 16px 0; border: 1px solid #334155;">
              <p style="margin: 0;"><strong>Reason:</strong> ${reason || 'Details could not be verified'}</p>
            </div>
            <p style="color: #34D399;"><strong>✅ The full amount of ${refundAmount.toLocaleString()} RWF has been returned to your wallet balance.</strong></p>
            <p style="font-size: 13px; color: #94A3B8;">Please verify your phone number, account name, and payout method before re-submitting.</p>
          </div>
        `
      }).catch(() => {});
    }

    return {
      success: true,
      message: `Withdrawal #${id} rejected and ${refundAmount.toLocaleString()} RWF refunded back to user wallet.`
    };
  }

  static async saveFeePercent(percent: number): Promise<void> {
    const val = Math.max(0, Math.min(50, Number(percent) || 0));
    await setSystemSetting('withdrawal_fee_percent', String(val));
  }
}
