// =====================================================================
// KUNDA SPACE: DUAL-WALLET SYSTEM, IMMUTABLE LEDGER & AFFILIATE REWARDS
// Supports spendable Welcome Bonuses, Withdrawable Referral & Unlock Commissions
// =====================================================================
import { memoryStore, query, loadAdminSettingsFromDb } from './db.js';
import { BUSINESS_CONFIG } from './config.js';
import crypto from 'crypto';

export interface UserWallet {
  userId: string;
  balanceMinor: number; // Deposit balance + withdrawable earnings
  bonusBalanceMinor: number; // Welcome bonus balance (spendable on services, non-withdrawable)
  withdrawableEarnedMinor: number; // Earnings strictly from referrals, unlock cuts, and deposit commissions
  currency: string;
  savedPayoutMethod?: 'momo' | 'airtel' | 'bank';
  savedPayoutAccount?: string;
  savedPayoutAccountName?: string;
  savedBankName?: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  amountMinor: number; // positive = credit, negative = debit
  currency: string;
  type:
    | 'deposit'
    | 'welcome_bonus'
    | 'referral_signup_reward'
    | 'referral_deposit_commission'
    | 'contact_unlock_commission'
    | 'message_fee'
    | 'contact_unlock'
    | 'subscription_purchase'
    | 'withdrawal'
    | 'refund'
    | 'admin_adjustment';
  description: string;
  reference: string;
  idempotencyKey?: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amountMinor: number;
  currency: string;
  payoutMethod: 'momo' | 'airtel' | 'bank';
  payoutAccount: string;
  accountHolderName: string;
  bankName?: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  reference: string;
  createdAt: string;
}

/**
 * Gets user wallet details with dual balance (deposit/earnings + welcome bonus)
 */
export async function getWalletBalance(userId: string): Promise<UserWallet> {
  const existing = memoryStore.wallets.get(userId);
  if (existing) {
    return {
      userId,
      balanceMinor: existing.balanceMinor || 0,
      bonusBalanceMinor: existing.bonusBalanceMinor || 0,
      withdrawableEarnedMinor: existing.withdrawableEarnedMinor || 0,
      currency: existing.currency || 'RWF',
      savedPayoutMethod: existing.savedPayoutMethod,
      savedPayoutAccount: existing.savedPayoutAccount,
      savedPayoutAccountName: existing.savedPayoutAccountName,
      savedBankName: existing.savedBankName,
    };
  }

  // Initialize wallet with 0
  const initial: UserWallet = {
    userId,
    balanceMinor: 0,
    bonusBalanceMinor: 0,
    withdrawableEarnedMinor: 0,
    currency: 'RWF',
  };
  memoryStore.wallets.set(userId, initial);
  return initial;
}

/**
 * Credits Welcome Bonus to user on signup (spendable on services, non-withdrawable)
 */
export async function creditWelcomeBonus(userId: string, amountMinor: number): Promise<void> {
  if (amountMinor <= 0) return;
  const wallet = await getWalletBalance(userId);
  wallet.bonusBalanceMinor = (wallet.bonusBalanceMinor || 0) + amountMinor;
  memoryStore.wallets.set(userId, wallet);

  const txRecord: WalletTransaction = {
    id: crypto.randomUUID(),
    walletId: `w-${userId}`,
    userId,
    amountMinor,
    currency: wallet.currency,
    type: 'welcome_bonus',
    description: `🎁 Welcome Bonus credited! (${amountMinor} RWF spendable on messaging, passes & contact unlocks)`,
    reference: `WB_${Date.now()}_${userId.slice(0, 6)}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  memoryStore.transactions.unshift(txRecord);
}

/**
 * Credits Referral Reward when an invited friend registers (withdrawable!)
 */
export async function creditReferralReward(referrerId: string, amountMinor: number, referredUserName: string): Promise<void> {
  if (amountMinor <= 0) return;
  const wallet = await getWalletBalance(referrerId);
  wallet.balanceMinor = (wallet.balanceMinor || 0) + amountMinor;
  wallet.withdrawableEarnedMinor = (wallet.withdrawableEarnedMinor || 0) + amountMinor;
  memoryStore.wallets.set(referrerId, wallet);

  const txRecord: WalletTransaction = {
    id: crypto.randomUUID(),
    walletId: `w-${referrerId}`,
    userId: referrerId,
    amountMinor,
    currency: wallet.currency,
    type: 'referral_signup_reward',
    description: `🤝 Referral Reward: ${referredUserName} joined using your invite link! (+${amountMinor} RWF withdrawable)`,
    reference: `REF_SIGNUP_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  memoryStore.transactions.unshift(txRecord);

  // Notify referrer
  memoryStore.notifications.push({
    id: 'notif-' + Date.now(),
    userId: referrerId,
    title: '🎉 Referral Bonus Earned!',
    message: `${referredUserName} registered with your link. You received ${amountMinor} RWF in your withdrawable wallet!`,
    type: 'referral_reward',
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Credits 5% Deposit Commission when an invited user tops up their wallet (withdrawable!)
 */
export async function creditDepositCommission(
  referrerId: string,
  depositAmountMinor: number,
  commissionPct: number = 5
): Promise<void> {
  const commAmount = Math.round(depositAmountMinor * (commissionPct / 100));
  if (commAmount <= 0) return;

  const wallet = await getWalletBalance(referrerId);
  wallet.balanceMinor = (wallet.balanceMinor || 0) + commAmount;
  wallet.withdrawableEarnedMinor = (wallet.withdrawableEarnedMinor || 0) + commAmount;
  memoryStore.wallets.set(referrerId, wallet);

  const txRecord: WalletTransaction = {
    id: crypto.randomUUID(),
    walletId: `w-${referrerId}`,
    userId: referrerId,
    amountMinor: commAmount,
    currency: wallet.currency,
    type: 'referral_deposit_commission',
    description: `💰 Referral Deposit Commission: 5% earned on ${depositAmountMinor} RWF referral deposit (+${commAmount} RWF withdrawable)`,
    reference: `REF_DEP_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  memoryStore.transactions.unshift(txRecord);

  memoryStore.notifications.push({
    id: 'notif-' + Date.now(),
    userId: referrerId,
    title: '💰 Deposit Commission Received!',
    message: `A member you invited deposited money. You earned ${commAmount} RWF (5% commission) ready to withdraw!`,
    type: 'referral_commission',
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Credits 15% revenue share from contact unlock (withdrawable!)
 */
export async function creditUnlockCommission(
  partnerId: string,
  unlockAmountMinor: number,
  commissionPct: number = 15
): Promise<void> {
  const commAmount = Math.round(unlockAmountMinor * (commissionPct / 100));
  if (commAmount <= 0) return;

  const wallet = await getWalletBalance(partnerId);
  wallet.balanceMinor = (wallet.balanceMinor || 0) + commAmount;
  wallet.withdrawableEarnedMinor = (wallet.withdrawableEarnedMinor || 0) + commAmount;
  memoryStore.wallets.set(partnerId, wallet);

  const txRecord: WalletTransaction = {
    id: crypto.randomUUID(),
    walletId: `w-${partnerId}`,
    userId: partnerId,
    amountMinor: commAmount,
    currency: wallet.currency,
    type: 'contact_unlock_commission',
    description: `💎 Contact Unlock Revenue Share: 15% from ${unlockAmountMinor} RWF contact unlock (+${commAmount} RWF withdrawable)`,
    reference: `UNL_COMM_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  memoryStore.transactions.unshift(txRecord);

  memoryStore.notifications.push({
    id: 'notif-' + Date.now(),
    userId: partnerId,
    title: '💎 Contact Unlock Share!',
    message: `A member unlocked your contact! You received ${commAmount} RWF (15% share) in your withdrawable wallet!`,
    type: 'unlock_commission',
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Credits a wallet for user deposits
 */
export async function creditWallet(
  userId: string,
  amountMinor: number,
  type: WalletTransaction['type'],
  description: string,
  reference?: string,
  idempotencyKey?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  if (amountMinor <= 0) {
    return { success: false, newBalance: 0, error: 'Credit amount must be greater than zero' };
  }

  const txRef = reference || `TX_CR_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const idemp = idempotencyKey || txRef;

  const existing = memoryStore.transactions.find((t) => t.idempotencyKey === idemp || t.reference === txRef);
  if (existing) {
    const current = await getWalletBalance(userId);
    return { success: true, newBalance: current.balanceMinor };
  }

  const current = await getWalletBalance(userId);
  current.balanceMinor += amountMinor;
  memoryStore.wallets.set(userId, current);

  const txRecord: WalletTransaction = {
    id: crypto.randomUUID(),
    walletId: `w-${userId}`,
    userId,
    amountMinor,
    currency: current.currency,
    type,
    description,
    reference: txRef,
    idempotencyKey: idemp,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  memoryStore.transactions.unshift(txRecord);
  return { success: true, newBalance: current.balanceMinor };
}

/**
 * Debits a wallet with SPENDING HIERARCHY:
 * Spends from Welcome Bonus FIRST before touching deposited funds!
 */
export async function debitWallet(
  userId: string,
  amountMinor: number,
  type: WalletTransaction['type'],
  description: string,
  reference?: string,
  idempotencyKey?: string
): Promise<{ success: boolean; newBalance: number; bonusDeducted: number; realDeducted: number; error?: string }> {
  if (amountMinor <= 0) {
    return { success: false, newBalance: 0, bonusDeducted: 0, realDeducted: 0, error: 'Debit amount must be greater than zero' };
  }

  const txRef = reference || `TX_DB_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const idemp = idempotencyKey || txRef;

  const current = await getWalletBalance(userId);
  const totalAvailable = (current.balanceMinor || 0) + (current.bonusBalanceMinor || 0);

  if (totalAvailable < amountMinor) {
    return {
      success: false,
      newBalance: current.balanceMinor,
      bonusDeducted: 0,
      realDeducted: 0,
      error: `Insufficient balance (${totalAvailable} RWF available: ${current.bonusBalanceMinor} RWF bonus + ${current.balanceMinor} RWF deposits, ${amountMinor} RWF required). Please top up.`,
    };
  }

  // Deduct from Welcome Bonus FIRST
  let remainingToDeduct = amountMinor;
  let bonusDeducted = 0;
  if (current.bonusBalanceMinor > 0) {
    bonusDeducted = Math.min(current.bonusBalanceMinor, remainingToDeduct);
    current.bonusBalanceMinor -= bonusDeducted;
    remainingToDeduct -= bonusDeducted;
  }

  // Deduct remaining from real balance
  let realDeducted = 0;
  if (remainingToDeduct > 0) {
    realDeducted = remainingToDeduct;
    current.balanceMinor -= realDeducted;
  }

  memoryStore.wallets.set(userId, current);

  const detailDesc =
    bonusDeducted > 0 && realDeducted > 0
      ? `${description} (Paid ${bonusDeducted} RWF from Welcome Bonus + ${realDeducted} RWF from Wallet)`
      : bonusDeducted > 0
      ? `${description} (Paid entirely from Welcome Bonus: ${bonusDeducted} RWF)`
      : description;

  const txRecord: WalletTransaction = {
    id: crypto.randomUUID(),
    walletId: `w-${userId}`,
    userId,
    amountMinor: -amountMinor,
    currency: current.currency,
    type,
    description: detailDesc,
    reference: txRef,
    idempotencyKey: idemp,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  memoryStore.transactions.unshift(txRecord);

  return {
    success: true,
    newBalance: current.balanceMinor,
    bonusDeducted,
    realDeducted,
  };
}

/**
 * Submits a withdrawal request to MoMo, Airtel, or Bank
 * Saves payout credentials to user wallet for future instant selection
 */
export async function requestWithdrawal(
  userId: string,
  amountMinor: number,
  payoutMethod: 'momo' | 'airtel' | 'bank',
  payoutAccount: string,
  accountHolderName: string,
  bankName?: string
): Promise<{ success: boolean; withdrawal?: WithdrawalRequest; error?: string }> {
  await loadAdminSettingsFromDb().catch(() => {});
  const minThreshold = Number(memoryStore.adminSettings.get('minimum_withdrawal_amount') ?? BUSINESS_CONFIG.MINIMUM_WITHDRAWAL_RWF);

  if (amountMinor < minThreshold) {
    return {
      success: false,
      error: `Minimum withdrawal amount is ${minThreshold.toLocaleString()} RWF. (Requested: ${amountMinor.toLocaleString()} RWF).`,
    };
  }

  const wallet = await getWalletBalance(userId);
  const availableWithdrawable = wallet.balanceMinor;

  if (availableWithdrawable < amountMinor) {
    return {
      success: false,
      error: `Insufficient withdrawable balance. You have ${availableWithdrawable.toLocaleString()} RWF withdrawable (Welcome bonus cannot be withdrawn directly, only spent).`,
    };
  }

  // Save payout details in database/memory for future convenience
  wallet.savedPayoutMethod = payoutMethod;
  wallet.savedPayoutAccount = payoutAccount.trim();
  wallet.savedPayoutAccountName = accountHolderName.trim();
  wallet.savedBankName = bankName?.trim();

  // Deduct from balance
  wallet.balanceMinor -= amountMinor;
  wallet.withdrawableEarnedMinor = Math.max(0, (wallet.withdrawableEarnedMinor || 0) - amountMinor);
  memoryStore.wallets.set(userId, wallet);

  const txRef = `WTH_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const withdrawal: WithdrawalRequest = {
    id: 'wth-' + Date.now(),
    userId,
    amountMinor,
    currency: wallet.currency,
    payoutMethod,
    payoutAccount: payoutAccount.trim(),
    accountHolderName: accountHolderName.trim(),
    bankName: bankName?.trim(),
    status: 'pending',
    reference: txRef,
    createdAt: new Date().toISOString(),
  };

  memoryStore.withdrawals = memoryStore.withdrawals || [];
  memoryStore.withdrawals.unshift(withdrawal);

  // Add ledger entry
  const methodLabel = payoutMethod === 'momo' ? 'MTN MoMo' : payoutMethod === 'airtel' ? 'Airtel Money' : `Bank (${bankName || 'Transfer'})`;
  const txRecord: WalletTransaction = {
    id: crypto.randomUUID(),
    walletId: `w-${userId}`,
    userId,
    amountMinor: -amountMinor,
    currency: wallet.currency,
    type: 'withdrawal',
    description: `Withdrawal request to ${methodLabel} (${payoutAccount}) - Processing`,
    reference: txRef,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  memoryStore.transactions.unshift(txRecord);

  return { success: true, withdrawal };
}

/**
 * Gets transaction ledger history for user
 */
export async function getTransactionHistory(userId: string): Promise<WalletTransaction[]> {
  return memoryStore.transactions.filter((t) => t.userId === userId);
}

/**
 * Gets withdrawal requests history for user
 */
export async function getWithdrawalHistory(userId: string): Promise<WithdrawalRequest[]> {
  return (memoryStore.withdrawals || []).filter((w) => w.userId === userId);
}
