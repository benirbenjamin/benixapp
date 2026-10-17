// =====================================================================
// POST /api/payments/verify - Verify Payment & Credit Wallet
// =====================================================================
import { extractAuthUser } from '../../_lib/auth.js';
import { creditWallet, getWalletBalance, creditDepositCommission } from '../../_lib/wallet.js';
import { verifyPaymentWithFlutterwave } from '../../_lib/flutterwave.js';
import { memoryStore, loadAdminSettingsFromDb } from '../../_lib/db.js';
import { BUSINESS_CONFIG } from '../../_lib/config.js';
import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { txRef, transactionId, amount } = req.body;
  if (!txRef) {
    return res.status(400).json({ success: false, error: 'Transaction reference (txRef) is required' });
  }

  // 1. Verify with Flutterwave if transactionId is passed
  let isVerified = false;
  let depositAmount = parseInt(amount, 10) || 5000;

  if (transactionId) {
    const flwVerification = await verifyPaymentWithFlutterwave(transactionId);
    if (flwVerification?.data?.status === 'successful') {
      isVerified = true;
      depositAmount = parseInt(flwVerification.data.amount, 10);
    }
  } else {
    // Sandbox / Test Mode Instant Verification
    isVerified = true;
  }

  if (!isVerified) {
    return res.status(400).json({ success: false, error: 'Payment verification failed with Flutterwave' });
  }

  // 2. Credit Wallet with Idempotency Key
  const creditResult = await creditWallet(
    auth.userId,
    depositAmount,
    'deposit',
    `Verified Wallet Deposit (${depositAmount} RWF)`,
    txRef,
    txRef
  );

  // 3. Referral Deposit Commission (5% earned by the member who invited them)
  const depositingUser: any = memoryStore.users.find((u) => u.id === auth.userId);
  if (depositingUser?.referredBy) {
    await loadAdminSettingsFromDb().catch(() => {});
    const commPct = Number(
      memoryStore.adminSettings.get('referral_deposit_commission_pct') ?? BUSINESS_CONFIG.REFERRAL_DEPOSIT_COMMISSION_PCT
    );
    await creditDepositCommission(depositingUser.referredBy, depositAmount, commPct).catch((err) =>
      console.warn('Referral deposit commission warning:', err)
    );
  }

  // 4. In-App Notification
  memoryStore.notifications.unshift({
    id: crypto.randomUUID(),
    userId: auth.userId,
    type: 'deposit_confirmed',
    title: 'Deposit Successful! 💳',
    body: `Your wallet was credited with ${depositAmount} RWF.`,
    linkUrl: '/dashboard/wallet',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  const updatedWallet = await getWalletBalance(auth.userId);

  return res.status(200).json({
    success: true,
    credited: depositAmount,
    wallet: updatedWallet,
  });
}
