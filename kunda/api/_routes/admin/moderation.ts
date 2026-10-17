// =====================================================================
// GET /api/admin/moderation - Review Flagged Events & User Reports
// =====================================================================
import { extractAuthUser, isAuthorizedRole } from '../../_lib/auth.js';
import { memoryStore } from '../../_lib/db.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth || !isAuthorizedRole(auth.role, ['super_admin', 'admin', 'moderator'])) {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
  }

  // Combine moderation events with user profile names
  const events = memoryStore.moderationEvents.map((evt) => {
    const user = memoryStore.users.find((u) => u.id === evt.userId);
    const profile = memoryStore.profiles.find((p) => p.userId === evt.userId);
    return {
      ...evt,
      userEmail: user?.email || 'N/A',
      userDisplayName: profile?.displayName || 'Unknown Member',
    };
  });

  return res.status(200).json({
    success: true,
    moderationEvents: events,
    reports: memoryStore.reports,
  });
}
