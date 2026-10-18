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
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS core_wallets (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) UNIQUE NOT NULL,
          balance NUMERIC(15,2) DEFAULT 0.00,
          bonus_balance NUMERIC(15,2) DEFAULT 0.00,
          pending_balance NUMERIC(15,2) DEFAULT 0.00,
          currency VARCHAR(10) DEFAULT 'RWF',
          total_earnings NUMERIC(15,2) DEFAULT 0.00,
          total_withdrawn NUMERIC(15,2) DEFAULT 0.00,
          total_bonus_received NUMERIC(15,2) DEFAULT 0.00,
          last_login_bonus_date VARCHAR(20) DEFAULT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE core_wallets ADD COLUMN IF NOT EXISTS bonus_balance NUMERIC(15,2) DEFAULT 0.00;
        ALTER TABLE core_wallets ADD COLUMN IF NOT EXISTS total_bonus_received NUMERIC(15,2) DEFAULT 0.00;
        ALTER TABLE core_wallets ADD COLUMN IF NOT EXISTS last_login_bonus_date VARCHAR(20) DEFAULT NULL;

        CREATE TABLE IF NOT EXISTS core_wallet_transactions (
          id VARCHAR(255) PRIMARY KEY,
          wallet_id VARCHAR(255),
          user_id VARCHAR(255),
          module VARCHAR(50) DEFAULT 'wallet',
          type VARCHAR(50) NOT NULL,
          amount NUMERIC(15,2) NOT NULL,
          fee NUMERIC(15,2) DEFAULT 0.00,
          currency VARCHAR(10) DEFAULT 'RWF',
          status VARCHAR(50) DEFAULT 'completed',
          reference VARCHAR(255),
          description TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch {}

    const existing = await query('SELECT * FROM core_wallets WHERE user_id = $1', [userId]);
    if (existing.rowCount > 0) {
      return existing.rows[0];
    }

    const walletId = 'wallet-' + userId;
    const inserted = await query(
      `INSERT INTO core_wallets (id, user_id, balance, bonus_balance, pending_balance, currency, total_earnings, total_withdrawn, total_bonus_received)
       VALUES ($1, $2, 0.00, 0.00, 0.00, 'RWF', 0.00, 0.00, 0.00)
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
           VALUES ($1, $2, 0.00, 0.00, 'RWF', 0.00)
           ON CONFLICT (user_id) DO NOTHING`,
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
   * Safe Atomic Credit of Platform Bonus (e.g., Welcome bonus, Daily login bonus, or Admin promotion)
   * Stored strictly in bonus_balance (NEVER mixes into deposit/earned balance).
   */
  static async creditBonus(
    userId: string,
    amount: number,
    module: string = 'wallet',
    type: string = 'bonus_credit',
    description: string = 'Platform Bonus',
    reference?: string,
    metadata?: any
  ): Promise<{ success: boolean; newBonusBalance: number; transactionId: string }> {
    if (amount <= 0) throw new Error('Bonus credit amount must be greater than zero.');
    const txRef = reference || `tx_bonus_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const txId = 'cwt-' + crypto.randomUUID();

    return await withTransaction(async (client) => {
      let walletRes = await client.query('SELECT * FROM core_wallets WHERE user_id = $1 FOR UPDATE', [userId]);
      if (walletRes.rowCount === 0) {
        await client.query(
          `INSERT INTO core_wallets (id, user_id, balance, bonus_balance, pending_balance, currency, total_earnings, total_bonus_received)
           VALUES ($1, $2, 0.00, 0.00, 0.00, 'RWF', 0.00, 0.00)
           ON CONFLICT (user_id) DO NOTHING`,
          ['wallet-' + userId, userId]
        );
        walletRes = await client.query('SELECT * FROM core_wallets WHERE user_id = $1 FOR UPDATE', [userId]);
      }

      const wallet = walletRes.rows[0];
      const newBonusBalance = Number(wallet.bonus_balance || 0) + amount;
      const newTotalBonus = Number(wallet.total_bonus_received || 0) + amount;

      await client.query(
        `UPDATE core_wallets 
         SET bonus_balance = $1, total_bonus_received = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [newBonusBalance, newTotalBonus, wallet.id]
      );

      await client.query(
        `INSERT INTO core_wallet_transactions 
         (id, wallet_id, user_id, module, type, amount, fee, currency, status, reference, description, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, 0.00, 'RWF', 'completed', $7, $8, $9)`,
        [txId, wallet.id, userId, module, type, amount, txRef, description, JSON.stringify(metadata || {})]
      );

      return { success: true, newBonusBalance, transactionId: txId };
    });
  }

  /**
   * Claim Daily Login Bonus (Credited into bonus_balance, once every calendar day)
   */
  static async claimDailyLoginBonus(
    userId: string,
    bonusAmount: number = 200
  ): Promise<{ claimed: boolean; alreadyClaimed: boolean; amount: number; bonusBalance: number; message: string }> {
    const today = new Date().toISOString().split('T')[0];

    return await withTransaction(async (client) => {
      let walletRes = await client.query('SELECT * FROM core_wallets WHERE user_id = $1 FOR UPDATE', [userId]);
      if (walletRes.rowCount === 0) {
        await client.query(
          `INSERT INTO core_wallets (id, user_id, balance, bonus_balance, pending_balance, currency, total_earnings, total_bonus_received)
           VALUES ($1, $2, 0.00, 0.00, 0.00, 'RWF', 0.00, 0.00)
           ON CONFLICT (user_id) DO NOTHING`,
          ['wallet-' + userId, userId]
        );
        walletRes = await client.query('SELECT * FROM core_wallets WHERE user_id = $1 FOR UPDATE', [userId]);
      }

      const wallet = walletRes.rows[0];
      const lastClaimed = wallet.last_login_bonus_date;

      if (lastClaimed === today) {
        return {
          claimed: false,
          alreadyClaimed: true,
          amount: 0,
          bonusBalance: Number(wallet.bonus_balance || 0),
          message: 'Daily login bonus already claimed for today.'
        };
      }

      const newBonusBalance = Number(wallet.bonus_balance || 0) + bonusAmount;
      const newTotalBonus = Number(wallet.total_bonus_received || 0) + bonusAmount;

      await client.query(
        `UPDATE core_wallets 
         SET bonus_balance = $1, total_bonus_received = $2, last_login_bonus_date = $3, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $4`,
        [newBonusBalance, newTotalBonus, today, wallet.id]
      );

      const txId = 'cwt-' + crypto.randomUUID();
      await client.query(
        `INSERT INTO core_wallet_transactions 
         (id, wallet_id, user_id, module, type, amount, fee, currency, status, reference, description, metadata)
         VALUES ($1, $2, $3, 'wallet', 'daily_login_bonus', $4, 0.00, 'RWF', 'completed', $5, $6, $7)`,
        [
          txId,
          wallet.id,
          userId,
          bonusAmount,
          `tx_daily_${today}_${userId}`,
          `Daily Login Bonus (${today}): +${bonusAmount} RWF credited to Bonus Wallet`,
          JSON.stringify({ date: today, bonusAmount })
        ]
      );

      return {
        claimed: true,
        alreadyClaimed: false,
        amount: bonusAmount,
        bonusBalance: newBonusBalance,
        message: `🎉 Daily Login Bonus Credited: +${bonusAmount} RWF added to your Bonus Wallet!`
      };
    });
  }

  /**
   * Admin can set or credit bonus balance for any user
   */
  static async adminSetBonus(
    userId: string,
    bonusAmount: number,
    reason: string = 'Admin adjustment'
  ): Promise<{ success: boolean; bonusBalance: number }> {
    return await withTransaction(async (client) => {
      let walletRes = await client.query('SELECT * FROM core_wallets WHERE user_id = $1 FOR UPDATE', [userId]);
      if (walletRes.rowCount === 0) {
        await client.query(
          `INSERT INTO core_wallets (id, user_id, balance, bonus_balance, pending_balance, currency, total_earnings)
           VALUES ($1, $2, 0.00, 0.00, 0.00, 'RWF', 0.00)
           ON CONFLICT (user_id) DO NOTHING`,
          ['wallet-' + userId, userId]
        );
        walletRes = await client.query('SELECT * FROM core_wallets WHERE user_id = $1 FOR UPDATE', [userId]);
      }
      const wallet = walletRes.rows[0];

      await client.query(
        `UPDATE core_wallets SET bonus_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [bonusAmount, wallet.id]
      );

      const txId = 'cwt-' + crypto.randomUUID();
      await client.query(
        `INSERT INTO core_wallet_transactions 
         (id, wallet_id, user_id, module, type, amount, fee, currency, status, reference, description)
         VALUES ($1, $2, $3, 'admin', 'admin_bonus_override', $4, 0.00, 'RWF', 'completed', $5, $6)`,
        [txId, wallet.id, userId, bonusAmount, `tx_adm_bonus_${Date.now()}`, `Admin Bonus Adjustment: ${reason}`]
      );

      return { success: true, bonusBalance: bonusAmount };
    });
  }

  /**
   * Safe Atomic Debit from User Wallet
   * Priority: Deducts from bonus_balance first. When bonus is exhausted, deducts from real deposit/earned balance.
   */
  static async debit(
    userId: string,
    amount: number,
    module: string,
    type: string,
    description: string,
    reference?: string,
    metadata?: any
  ): Promise<{
    success: boolean;
    newBalance: number;
    newBonusBalance: number;
    totalBalance: number;
    deductedFromBonus: number;
    deductedFromReal: number;
    transactionId: string;
  }> {
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
      const realBalance = Number(wallet.balance || 0);
      const bonusBalance = Number(wallet.bonus_balance || 0);
      const totalAvailable = realBalance + bonusBalance;

      if (totalAvailable < amount) {
        throw new Error(
          `Insufficient wallet balance. Required: ${amount.toLocaleString()} RWF (Available: ${realBalance.toLocaleString()} RWF real deposit + ${bonusBalance.toLocaleString()} RWF bonus).`
        );
      }

      let deductedFromBonus = 0;
      let deductedFromReal = 0;

      if (bonusBalance >= amount) {
        deductedFromBonus = amount;
      } else {
        deductedFromBonus = bonusBalance;
        deductedFromReal = amount - bonusBalance;
      }

      const newBonusBalance = bonusBalance - deductedFromBonus;
      const newRealBalance = realBalance - deductedFromReal;

      // Update wallet balances
      await client.query(
        `UPDATE core_wallets 
         SET balance = $1, bonus_balance = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [newRealBalance, newBonusBalance, wallet.id]
      );

      // Record negative ledger entry
      const debitBreakdown = [
        deductedFromBonus > 0 ? `${deductedFromBonus} RWF bonus` : null,
        deductedFromReal > 0 ? `${deductedFromReal} RWF deposit` : null
      ].filter(Boolean).join(' + ');

      await client.query(
        `INSERT INTO core_wallet_transactions 
         (id, wallet_id, user_id, module, type, amount, fee, currency, status, reference, description, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, 0.00, 'RWF', 'completed', $7, $8, $9)`,
        [
          txId,
          wallet.id,
          userId,
          module,
          type,
          -amount,
          txRef,
          `${description} [${debitBreakdown}]`,
          JSON.stringify({ ...(metadata || {}), deductedFromBonus, deductedFromReal })
        ]
      );

      return {
        success: true,
        newBalance: newRealBalance,
        newBonusBalance,
        totalBalance: newRealBalance + newBonusBalance,
        deductedFromBonus,
        deductedFromReal,
        transactionId: txId
      };
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
   * Search registered users by email, name or phone for transfer
   */
  static async searchRecipients(searchQuery: string, excludeUserId?: string): Promise<any[]> {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    let sql = `
      SELECT id, name, email, phone, role 
      FROM core_users 
      WHERE (LOWER(email) LIKE $1 OR LOWER(name) LIKE $1 OR LOWER(phone) LIKE $1)
    `;
    const params: any[] = [`%${q}%`];
    if (excludeUserId) {
      params.push(excludeUserId);
      sql += ` AND id != $${params.length}`;
    }
    sql += ` ORDER BY name ASC LIMIT 5`;

    try {
      const res = await query(sql, params);
      return res.rows;
    } catch (e: any) {
      console.warn('searchRecipients error:', e?.message);
      return [];
    }
  }

  /**
   * Peer-to-Peer Wallet Transfer
   */
  static async transfer(
    senderUserId: string,
    recipientEmail: string,
    amount: number,
    note?: string
  ): Promise<{ success: boolean; newBalance: number; recipientName: string; transactionId: string }> {
    if (amount <= 0) throw new Error('Transfer amount must be greater than zero.');
    const cleanEmail = recipientEmail.trim().toLowerCase();

    // 1. Find recipient
    const recipientRes = await query('SELECT id, name, email FROM core_users WHERE LOWER(email) = $1', [cleanEmail]);
    if (recipientRes.rowCount === 0) {
      throw new Error(`No user found with email "${recipientEmail}". Please verify the email address.`);
    }

    const recipient = recipientRes.rows[0];
    if (recipient.id === senderUserId) {
      throw new Error('You cannot transfer funds to your own account.');
    }

    const txId = 'cwt-tx-' + crypto.randomUUID();
    const txRef = `tx_tr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    return await withTransaction(async (client) => {
      // 2. Lock and verify sender wallet
      let senderWalletRes = await client.query('SELECT * FROM core_wallets WHERE user_id = $1 FOR UPDATE', [senderUserId]);
      if (senderWalletRes.rowCount === 0) throw new Error('Sender wallet not found.');
      const senderWallet = senderWalletRes.rows[0];
      const currentSenderBalance = Number(senderWallet.balance);

      if (currentSenderBalance < amount) {
        throw new Error(`Insufficient wallet balance. Available: ${currentSenderBalance.toLocaleString()} RWF, required: ${amount.toLocaleString()} RWF.`);
      }

      // 3. Lock recipient wallet (or create if missing)
      let recipientWalletRes = await client.query('SELECT * FROM core_wallets WHERE user_id = $1 FOR UPDATE', [recipient.id]);
      if (recipientWalletRes.rowCount === 0) {
        await client.query(
          `INSERT INTO core_wallets (id, user_id, balance, pending_balance, currency, total_earnings)
           VALUES ($1, $2, 0.00, 0.00, 'RWF', 0.00)
           ON CONFLICT (user_id) DO NOTHING`,
          ['wallet-' + recipient.id, recipient.id]
        );
        recipientWalletRes = await client.query('SELECT * FROM core_wallets WHERE user_id = $1 FOR UPDATE', [recipient.id]);
      }
      const recipientWallet = recipientWalletRes.rows[0];

      // 4. Update Sender Wallet (debit)
      const newSenderBalance = currentSenderBalance - amount;
      await client.query(
        'UPDATE core_wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newSenderBalance, senderWallet.id]
      );

      // 5. Update Recipient Wallet (credit)
      const newRecipientBalance = Number(recipientWallet.balance) + amount;
      const newRecipientEarnings = Number(recipientWallet.total_earnings || 0) + amount;
      await client.query(
        'UPDATE core_wallets SET balance = $1, total_earnings = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [newRecipientBalance, newRecipientEarnings, recipientWallet.id]
      );

      // 6. Record Sender Transaction Ledger
      await client.query(
        `INSERT INTO core_wallet_transactions 
         (id, wallet_id, user_id, module, type, amount, fee, currency, status, reference, description, metadata)
         VALUES ($1, $2, $3, 'wallet', 'transfer_sent', $4, 0.00, 'RWF', 'completed', $5, $6, $7)`,
        [
          txId,
          senderWallet.id,
          senderUserId,
          -amount,
          txRef,
          `Transfer to ${recipient.name} (${recipient.email})` + (note ? `: ${note}` : ''),
          JSON.stringify({ recipientId: recipient.id, recipientEmail: recipient.email, note })
        ]
      );

      // 7. Record Recipient Transaction Ledger
      const recipientTxId = 'cwt-rx-' + crypto.randomUUID();
      await client.query(
        `INSERT INTO core_wallet_transactions 
         (id, wallet_id, user_id, module, type, amount, fee, currency, status, reference, description, metadata)
         VALUES ($1, $2, $3, 'wallet', 'transfer_received', $4, 0.00, 'RWF', 'completed', $5, $6, $7)`,
        [
          recipientTxId,
          recipientWallet.id,
          recipient.id,
          amount,
          txRef,
          `Transfer received from Benix User` + (note ? `: ${note}` : ''),
          JSON.stringify({ senderUserId, note })
        ]
      );

      return {
        success: true,
        newBalance: newSenderBalance,
        recipientName: recipient.name,
        transactionId: txId
      };
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
