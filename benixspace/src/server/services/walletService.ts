import { query, withTransaction } from '../db/db';
import crypto from 'crypto';

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  module: string;
  type: string;
  amount: number;
  fee: number;
  currency: string;
  status: string;
  reference: string;
  description: string;
  metadata?: any;
  created_at: string;
}

export class WalletService {
  /**
   * Retrieves an existing wallet for a user or creates a new one
   */
  static async getOrCreateWallet(userId: string): Promise<any> {
    const existing = await query('SELECT * FROM core_wallets WHERE user_id = $1', [userId]);
    if (existing.rowCount > 0) {
      return existing.rows[0];
    }

    const walletId = 'wallet-' + userId;
    const inserted = await query(
      `INSERT INTO core_wallets (id, user_id, balance, pending_balance, currency, total_earnings, total_withdrawn)
       VALUES ($1, $2, 0.00, 0.00, 'RWF', 0.00, 0.00)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [walletId, userId]
    );
    return inserted.rows[0];
  }

  /**
   * Safe Atomic Credit to User Wallet
   */
  static async credit(
    userId: string,
    amount: number,
    module: string,
    type: string,
    description: string,
    reference?: string,
    metadata?: any
  ): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
    if (amount <= 0) throw new Error('Credit amount must be greater than zero.');

    const txRef = reference || `tx_cr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const txId = 'cwt-' + crypto.randomUUID();

    return await withTransaction(async (client) => {
      // 1. Ensure wallet exists with lock
      let walletRes = await client.query('SELECT * FROM core_wallets WHERE user_id = $1 FOR UPDATE', [userId]);
      if (walletRes.rowCount === 0) {
        await client.query(
          `INSERT INTO core_wallets (id, user_id, balance, pending_balance, currency, total_earnings)
           VALUES ($1, $2, 0.00, 0.00, 'RWF', 0.00)`,
          ['wallet-' + userId, userId]
        );
        walletRes = await client.query('SELECT * FROM core_wallets WHERE user_id = $1 FOR UPDATE', [userId]);
      }

      const wallet = walletRes.rows[0];
      const newBalance = Number(wallet.balance) + amount;
      const newTotalEarnings = Number(wallet.total_earnings) + amount;

      // 2. Update wallet balance
      await client.query(
        `UPDATE core_wallets 
         SET balance = $1, total_earnings = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [newBalance, newTotalEarnings, wallet.id]
      );

      // 3. Record transaction ledger entry
      await client.query(
        `INSERT INTO core_wallet_transactions 
         (id, wallet_id, user_id, module, type, amount, fee, currency, status, reference, description, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, 0.00, 'RWF', 'completed', $7, $8, $9)`,
        [txId, wallet.id, userId, module, type, amount, txRef, description, JSON.stringify(metadata || {})]
      );

      return { success: true, newBalance, transactionId: txId };
    });
  }

  /**
   * Safe Atomic Debit from User Wallet (with strict insufficient balance check)
   */
  static async debit(
    userId: string,
    amount: number,
    module: string,
    type: string,
    description: string,
    reference?: string,
    metadata?: any
  ): Promise<{ success: boolean; newBalance: number; transactionId: string }> {
    if (amount <= 0) throw new Error('Debit amount must be greater than zero.');

    const txRef = reference || `tx_db_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const txId = 'cwt-' + crypto.randomUUID();

    return await withTransaction(async (client) => {
      // Lock wallet row for update
      const walletRes = await client.query('SELECT * FROM core_wallets WHERE user_id = $1 FOR UPDATE', [userId]);
      if (walletRes.rowCount === 0) {
        throw new Error('Wallet not found.');
      }

      const wallet = walletRes.rows[0];
      const currentBalance = Number(wallet.balance);

      if (currentBalance < amount) {
        throw new Error(`Insufficient wallet balance. Current: ${currentBalance} RWF, Required: ${amount} RWF`);
      }

      const newBalance = currentBalance - amount;

      // Update wallet balance
      await client.query(
        `UPDATE core_wallets 
         SET balance = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [newBalance, wallet.id]
      );

      // Record negative ledger entry
      await client.query(
        `INSERT INTO core_wallet_transactions 
         (id, wallet_id, user_id, module, type, amount, fee, currency, status, reference, description, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, 0.00, 'RWF', 'completed', $7, $8, $9)`,
        [txId, wallet.id, userId, module, type, -amount, txRef, description, JSON.stringify(metadata || {})]
      );

      return { success: true, newBalance, transactionId: txId };
    });
  }

  /**
   * Request Payout / Withdrawal
   */
  static async requestWithdrawal(
    userId: string,
    amount: number,
    payoutMethod: string = 'MTN_MOMO',
    accountDetails: any
  ): Promise<{ success: boolean; withdrawalId: string }> {
    if (amount < 500) throw new Error('Minimum withdrawal amount is 500 RWF.');

    const withdrawalId = 'wd-' + crypto.randomUUID();

    return await withTransaction(async (client) => {
      // Debit from available balance
      const walletRes = await client.query('SELECT * FROM core_wallets WHERE user_id = $1 FOR UPDATE', [userId]);
      if (walletRes.rowCount === 0) throw new Error('Wallet not found.');

      const wallet = walletRes.rows[0];
      const currentBalance = Number(wallet.balance);
      if (currentBalance < amount) {
        throw new Error(`Insufficient balance for withdrawal. Current: ${currentBalance} RWF`);
      }

      // Deduct balance and add to pending balance
      await client.query(
        `UPDATE core_wallets 
         SET balance = balance - $1, pending_balance = pending_balance + $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [amount, wallet.id]
      );

      // Record withdrawal request
      await client.query(
        `INSERT INTO core_withdrawals 
         (id, user_id, wallet_id, amount, currency, payout_method, account_details, status)
         VALUES ($1, $2, $3, $4, 'RWF', $5, $6, 'PENDING')`,
        [withdrawalId, userId, wallet.id, amount, payoutMethod, JSON.stringify(accountDetails)]
      );

      // Ledger entry
      await client.query(
        `INSERT INTO core_wallet_transactions 
         (id, wallet_id, user_id, module, type, amount, fee, currency, status, reference, description)
         VALUES ($1, $2, $3, 'wallet', 'withdrawal_request', $4, 0.00, 'RWF', 'pending', $5, $6)`,
        [
          'cwt-' + crypto.randomUUID(),
          wallet.id,
          userId,
          -amount,
          `tx_wd_${withdrawalId}`,
          `Withdrawal Request via ${payoutMethod}`
        ]
      );

      return { success: true, withdrawalId };
    });
  }

  /**
   * Fetch recent transactions
   */
  static async getTransactions(userId?: string, limit: number = 50): Promise<WalletTransaction[]> {
    let sql = 'SELECT * FROM core_wallet_transactions';
    const params: any[] = [];
    if (userId) {
      params.push(userId);
      sql += ` WHERE user_id = $${params.length}`;
    }
    sql += ` ORDER BY created_at DESC LIMIT ${limit}`;
    const res = await query<WalletTransaction>(sql, params);
    return res.rows;
  }
}
