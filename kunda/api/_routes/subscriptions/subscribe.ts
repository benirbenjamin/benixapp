// =====================================================================
// POST /api/subscriptions/subscribe - Purchase Subscription Pass
// =====================================================================
import crypto from 'crypto';
import { extractAuthUser } from '../../_lib/auth.js';
import { memoryStore, loadAdminSettingsFromDb, query } from '../../_lib/db.js';
import { debitWallet, getWalletBalance } from '../../_lib/wallet.js';
import { BUSINESS_CONFIG } from '../../_lib/config.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Ensure settings are loaded
  await loadAdminSettingsFromDb();

  const { planCode } = req.body;
  if (!planCode || !['hourly', 'daily', 'daily_24h', 'three_day', 'weekly'].includes(planCode)) {
    return res.status(400).json({ success: false, error: 'Valid planCode is required' });
  }

  let price = 0;
  let durationDays = 0;
  let planName = '';

  if (planCode === 'hourly' || planCode === 'daily' || planCode === 'daily_24h') {
    price = Number(memoryStore.adminSettings.get('hourly_pass_cost') ?? BUSINESS_CONFIG.HOURLY_PASS_PRICE_RWF);
    durationDays = 1;
    planName = '24-Hour Pass (Daily)';
  } else if (planCode === 'three_day') {
    price = Number(memoryStore.adminSettings.get('three_day_pass_cost') ?? BUSINESS_CONFIG.THREE_DAY_PASS_PRICE_RWF);
    durationDays = 3;
    planName = '3-Day Connection Pass';
  } else {
    price = Number(memoryStore.adminSettings.get('weekly_pass_cost') ?? BUSINESS_CONFIG.WEEKLY_PASS_PRICE_RWF);
    durationDays = 7;
    planName = 'Weekly Premium Pass';
  }

  // 1. Debit Wallet
  const debitRes = await debitWallet(
    auth.userId,
    price,
    'subscription_purchase',
    `Purchased ${planName} (${price} RWF)`
  );

  if (!debitRes.success) {
    return res.status(402).json({
      success: false,
      error: 'INSUFFICIENT_FUNDS',
      message: debitRes.error || `Insufficient funds. Top up your wallet to activate this pass.`,
      requiredAmount: price,
    });
  }

  // 2. Set Expiration Date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  const subRecord = {
    id: crypto.randomUUID(),
    userId: auth.userId,
    planCode,
    planName,
    startedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
  };

  memoryStore.subscriptions.push(subRecord);

  // Attempt DB persistence if table exists
  try {
    await query(
      `INSERT INTO subscriptions (id, user_id, started_at, expires_at, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [subRecord.id, subRecord.userId, subRecord.startedAt, subRecord.expiresAt, 'active']
    );
  } catch (err) {
    // Non-fatal, memoryStore holds state
  }

  // 3. In-App Notification
  memoryStore.notifications.unshift({
    id: crypto.randomUUID(),
    userId: auth.userId,
    type: 'subscription_active',
    title: 'Membership Activated! 🌟',
    body: `Your ${planName} is active until ${expiresAt.toLocaleDateString()}. Enjoy unlimited messaging!`,
    linkUrl: '/dashboard/messages',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  const updatedWallet = await getWalletBalance(auth.userId);

  return res.status(200).json({
    success: true,
    subscription: subRecord,
    wallet: updatedWallet,
  });
}
