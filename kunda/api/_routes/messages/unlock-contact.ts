// =====================================================================
// POST /api/messages/unlock-contact - Direct Contact Unlocking
// =====================================================================
import crypto from 'crypto';
import { extractAuthUser } from '../../_lib/auth.js';
import { memoryStore, loadAdminSettingsFromDb, query } from '../../_lib/db.js';
import { debitWallet, getWalletBalance, creditUnlockCommission } from '../../_lib/wallet.js';
import { BUSINESS_CONFIG } from '../../_lib/config.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Ensure dynamic admin settings are loaded from DB
  await loadAdminSettingsFromDb();

  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ success: false, error: 'Target user ID is required' });
  }

  if (targetUserId === auth.userId) {
    return res.status(400).json({ success: false, error: 'Cannot unlock your own contact info' });
  }

  // Check if target user exists and is not suspended
  let targetUser = memoryStore.users.find((u) => u.id === targetUserId);
  let targetProfile = memoryStore.profiles.find((p) => p.userId === targetUserId);

  if (!targetUser) {
    const uRes = await query('SELECT * FROM users WHERE id = $1', [targetUserId]);
    if (uRes?.rows?.[0]) targetUser = uRes.rows[0];
  }
  if (!targetProfile) {
    const pRes = await query('SELECT * FROM profiles WHERE user_id = $1', [targetUserId]);
    if (pRes?.rows?.[0]) targetProfile = pRes.rows[0];
  }

  if (!targetUser || !targetProfile) {
    return res.status(404).json({ success: false, error: 'Target member profile not found' });
  }

  if (targetUser.isSuspended) {
    return res.status(403).json({ success: false, error: 'Cannot unlock contact of a restricted member' });
  }

  const hasConsent = targetProfile.contactSharingConsent ?? targetProfile.contact_sharing_consent ?? true;
  // 1. Mandatory Consent Check
  if (!hasConsent) {
    return res.status(403).json({
      success: false,
      error: 'CONSENT_REQUIRED',
      message: `${targetProfile.displayName || 'Member'} has not enabled direct contact sharing on their profile yet. You can ask them respectfully via chat first.`,
    });
  }

  // 2. Check if already unlocked
  const alreadyUnlocked = memoryStore.contactUnlocks.some(
    (cu) => cu.requesterId === auth.userId && cu.targetUserId === targetUserId
  );

  const phoneFormatted = `${targetUser.phoneCode || targetUser.phone_code || '+250'} ${targetUser.phone || ''}`.trim();
  const displayName = targetProfile.displayName || targetProfile.display_name || 'Member';

  if (alreadyUnlocked) {
    return res.status(200).json({
      success: true,
      alreadyUnlocked: true,
      phone: phoneFormatted,
      displayName,
    });
  }

  // 3. Debit Wallet
  const unlockCost = Number(memoryStore.adminSettings.get('contact_unlock_cost') ?? BUSINESS_CONFIG.CONTACT_UNLOCK_PRICE_RWF);
  const debitRes = await debitWallet(
    auth.userId,
    unlockCost,
    'contact_unlock',
    `Direct contact unlock for ${targetProfile.displayName} (${unlockCost} RWF)`
  );

  if (!debitRes.success) {
    return res.status(402).json({
      success: false,
      error: 'INSUFFICIENT_FUNDS',
      message: debitRes.error || `Insufficient balance. Contact unlock requires ${unlockCost} RWF.`,
      requiredAmount: unlockCost,
    });
  }

  // 4. Save Unlock Entitlement
  const unlockRecord = {
    id: crypto.randomUUID(),
    requesterId: auth.userId,
    targetUserId,
    amountPaidMinor: unlockCost,
    currency: 'RWF',
    createdAt: new Date().toISOString(),
  };

  memoryStore.contactUnlocks.push(unlockRecord);

  // 5. Credit 15% (or configured %) revenue share to the target user whose contact was unlocked (withdrawable!)
  const unlockCommissionPct = Number(
    memoryStore.adminSettings.get('contact_unlock_commission_pct') ?? BUSINESS_CONFIG.CONTACT_UNLOCK_COMMISSION_PCT
  );
  await creditUnlockCommission(targetUserId, unlockCost, unlockCommissionPct).catch((err) =>
    console.warn('Unlock commission credit warning:', err)
  );

  // 6. Notify target user that their contact was unlocked with their consent
  const requesterProfile = memoryStore.profiles.find((p) => p.userId === auth.userId);
  memoryStore.notifications.unshift({
    id: crypto.randomUUID(),
    userId: targetUserId,
    type: 'contact_unlocked',
    title: 'Contact Shared',
    body: `${requesterProfile?.displayName || 'A mutual connection'} has unlocked your phone number via mutual consent.`,
    linkUrl: `/dashboard/messages?user=${auth.userId}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  const updatedWallet = await getWalletBalance(auth.userId);

  return res.status(200).json({
    success: true,
    phone: `${targetUser.phoneCode} ${targetUser.phone}`,
    displayName: targetProfile.displayName,
    wallet: updatedWallet,
  });
}
