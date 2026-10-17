// =====================================================================
// GET /api/admin/metrics - Admin Overview Statistics & KPIs
// =====================================================================
import { extractAuthUser, isAuthorizedRole } from '../../_lib/auth.js';
import { memoryStore } from '../../_lib/db.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth || !isAuthorizedRole(auth.role, ['super_admin', 'admin', 'moderator'])) {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
  }

  const totalUsers = memoryStore.users.length;
  const activeMembers = memoryStore.users.filter((u) => !u.isSuspended).length;
  const suspendedMembers = memoryStore.users.filter((u) => u.isSuspended).length;
  const totalProfiles = memoryStore.profiles.length;
  const totalMatches = memoryStore.matches.length;
  const totalMessages = memoryStore.messages.length;
  const activeSubscriptions = memoryStore.subscriptions.filter(
    (s) => s.status === 'active' && new Date(s.expiresAt) > new Date()
  ).length;

  // Calculate gross revenue from deposits and total platform wallet balances
  let totalDepositsRWF = 0;
  let totalSpentOnPlatformRWF = 0;

  for (const t of memoryStore.transactions) {
    if (t.status === 'completed') {
      if (t.type === 'deposit') {
        totalDepositsRWF += t.amountMinor;
      } else {
        totalSpentOnPlatformRWF += Math.abs(t.amountMinor);
      }
    }
  }

  const pendingReportsCount = memoryStore.reports.filter((r) => r.status === 'pending').length;
  const moderationEventsCount = memoryStore.moderationEvents.length;

  return res.status(200).json({
    success: true,
    metrics: {
      totalUsers,
      activeMembers,
      suspendedMembers,
      totalProfiles,
      totalMatches,
      totalMessages,
      activeSubscriptions,
      totalDepositsRWF,
      totalSpentOnPlatformRWF,
      pendingReportsCount,
      moderationEventsCount,
    },
  });
}
