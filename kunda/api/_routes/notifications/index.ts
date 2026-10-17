// =====================================================================
// GET & POST /api/notifications - In-App Notification Center
// =====================================================================
import { extractAuthUser } from '../../_lib/auth.js';
import { memoryStore } from '../../_lib/db.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // GET: List notifications
  if (req.method === 'GET') {
    const list = memoryStore.notifications.filter((n) => n.userId === auth.userId);
    return res.status(200).json({
      success: true,
      notifications: list,
      unreadCount: list.filter((n) => !n.isRead).length,
    });
  }

  // POST: Mark read or mark all read
  if (req.method === 'POST') {
    const { notificationId, markAll } = req.body;

    if (markAll) {
      for (const n of memoryStore.notifications) {
        if (n.userId === auth.userId) {
          n.isRead = true;
        }
      }
      return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      const target = memoryStore.notifications.find(
        (n) => n.id === notificationId && n.userId === auth.userId
      );
      if (target) {
        target.isRead = true;
      }
      return res.status(200).json({ success: true, message: 'Notification marked as read' });
    }

    return res.status(400).json({ success: false, error: 'Invalid notification action' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
