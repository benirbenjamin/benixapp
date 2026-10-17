// =====================================================================
// GET /api/wallet/balance - Dual-Wallet Ledger Balance & Earnings Overview
// =====================================================================
import { extractAuthUser } from '../../_lib/auth.js';
import { getWalletBalance, getTransactionHistory } from '../../_lib/wallet.js';
import { memoryStore, loadAdminSettingsFromDb } from '../../_lib/db.js';
import { BUSINESS_CONFIG } from '../../_lib/config.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  await loadAdminSettingsFromDb().catch(() => {});

  const wallet = await getWalletBalance(auth.userId);
  const transactions = await getTransactionHistory(auth.userId);

  // Compute total deposits, total spent, and total affiliate earnings from ledger
  let totalDeposits = 0;
  let totalSpent = 0;
  let referralEarnings = 0;

  for (const t of transactions) {
    if (t.status === 'completed') {
      if (t.amountMinor > 0) {
        if (
          t.type === 'referral_signup_reward' ||
          t.type === 'referral_deposit_commission' ||
          t.type === 'contact_unlock_commission'
        ) {
          referralEarnings += t.amountMinor;
        } else if (t.type === 'deposit') {
          totalDeposits += t.amountMinor;
        }
      } else {
        totalSpent += Math.abs(t.amountMinor);
      }
    }
  }

  // Count registered referrals
  const user = memoryStore.users.find((u) => u.id === auth.userId);
  const userReferralCode = user?.referralCode || auth.userId.replace(/-/g, '').slice(0, 8).toUpperCase();
  const referredUsersCount = memoryStore.users.filter((u: any) => u.referredBy === auth.userId).length;

  const minWithdrawal = Number(
    memoryStore.adminSettings.get('minimum_withdrawal_amount') ?? BUSINESS_CONFIG.MINIMUM_WITHDRAWAL_RWF
  );
  const welcomeBonus = Number(
    memoryStore.adminSettings.get('welcome_bonus_amount') ?? BUSINESS_CONFIG.WELCOME_BONUS_RWF
  );
  const referralReward = Number(
    memoryStore.adminSettings.get('referral_signup_reward') ?? BUSINESS_CONFIG.REFERRAL_SIGNUP_REWARD_RWF
  );
  const referralDepositCommissionPct = Number(
    memoryStore.adminSettings.get('referral_deposit_commission_pct') ?? BUSINESS_CONFIG.REFERRAL_DEPOSIT_COMMISSION_PCT
  );
  const contactUnlockCommissionPct = Number(
    memoryStore.adminSettings.get('contact_unlock_commission_pct') ?? BUSINESS_CONFIG.CONTACT_UNLOCK_COMMISSION_PCT
  );

  return res.status(200).json({
    success: true,
    balance: wallet.balanceMinor, // Withdrawable balance (deposits + earnings)
    bonusBalance: wallet.bonusBalanceMinor || 0, // Welcome bonus (spendable on services, non-withdrawable)
    totalAvailable: (wallet.balanceMinor || 0) + (wallet.bonusBalanceMinor || 0),
    withdrawableEarned: wallet.withdrawableEarnedMinor || referralEarnings,
    currency: wallet.currency || 'RWF',
    referralCode: userReferralCode,
    referredUsersCount,
    savedPayout: {
      method: wallet.savedPayoutMethod || null,
      account: wallet.savedPayoutAccount || null,
      accountName: wallet.savedPayoutAccountName || null,
      bankName: wallet.savedBankName || null,
    },
    settings: {
      minWithdrawal,
      welcomeBonus,
      referralReward,
      referralDepositCommissionPct,
      contactUnlockCommissionPct,
    },
    totalDeposits,
    totalSpent,
  });
}
