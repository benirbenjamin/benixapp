// =====================================================================
// GET /api/auth/me - Authenticated session state
// =====================================================================
import { extractAuthUser } from '../../_lib/auth.js';
import { memoryStore, loadAdminSettingsFromDb } from '../../_lib/db.js';
import { BUSINESS_CONFIG } from '../../_lib/config.js';
import { getWalletBalance } from '../../_lib/wallet.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized session' });
  }

  const user = memoryStore.users.find((u) => u.id === auth.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User account not found' });
  }

  const profile = memoryStore.profiles.find((p) => p.userId === auth.userId);
  const wallet = await getWalletBalance(auth.userId);

  await loadAdminSettingsFromDb();
  const freeInitLimit = Number(memoryStore.adminSettings.get('free_initial_messages') ?? BUSINESS_CONFIG.FREE_INITIAL_MESSAGES);
  const freeDistinctLimit = Number(memoryStore.adminSettings.get('free_distinct_recipients') ?? BUSINESS_CONFIG.FREE_DISTINCT_RECIPIENTS);
  const freeRepliesLimit = Number(memoryStore.adminSettings.get('free_replies') ?? BUSINESS_CONFIG.FREE_REPLIES_ALLOWED);

  // Remaining free allowances
  let allowances = memoryStore.allowances.get(auth.userId);
  if (!allowances) {
    allowances = {
      initialRemaining: freeInitLimit,
      distinctRecipients: [],
      repliesRemaining: freeRepliesLimit,
    };
    memoryStore.allowances.set(auth.userId, allowances);
  }

  // Active subscription check
  const activeSub = memoryStore.subscriptions.find(
    (s) => s.userId === auth.userId && s.status === 'active' && new Date(s.expiresAt) > new Date()
  );

  // Unread messages count
  const unreadMessagesCount = memoryStore.messages.filter(
    (m) => m.recipientId === auth.userId && !m.isRead
  ).length;

  // Unread notifications count
  const unreadNotificationsCount = memoryStore.notifications.filter(
    (n) => n.userId === auth.userId && !n.isRead
  ).length;

  return res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      dob: user.dob,
      phone: user.phone,
      phoneCode: user.phoneCode,
      preferredLanguage: user.preferredLanguage,
      referralCode: user.referralCode || user.id.replace(/-/g, '').slice(0, 8).toUpperCase(),
    },
    profile,
    wallet,
    allowances,
    activeSubscription: activeSub || null,
    counts: {
      unreadMessages: unreadMessagesCount,
      unreadNotifications: unreadNotificationsCount,
    },
  });
}
