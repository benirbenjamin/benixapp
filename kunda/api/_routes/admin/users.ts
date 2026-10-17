// =====================================================================
// GET & POST /api/admin/users - User Management & Account Moderation
// =====================================================================
import { extractAuthUser, isAuthorizedRole } from '../../_lib/auth.js';
import { memoryStore, query } from '../../_lib/db.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth || !isAuthorizedRole(auth.role, ['super_admin', 'admin', 'moderator'])) {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
  }

  // GET: List users with profiles
  if (req.method === 'GET') {
    const search = req.query?.search?.toLowerCase();
    let userList = memoryStore.users.map((u) => {
      const profile = memoryStore.profiles.find((p) => p.userId === u.id);
      const wallet = memoryStore.wallets.get(u.id) || { balanceMinor: 0, currency: 'RWF' };
      return {
        id: u.id,
        email: u.email,
        role: u.role,
        dob: u.dob,
        phone: u.phone ? `${u.phoneCode || '+250'} ${u.phone}` : 'N/A',
        isSuspended: u.isSuspended || false,
        suspensionReason: u.suspensionReason || null,
        displayName: profile?.displayName || 'No Profile',
        gender: profile?.gender || 'N/A',
        city: profile?.city || 'N/A',
        country: profile?.country || 'N/A',
        verifiedBadge: profile?.verifiedBadge || false,
        walletBalance: wallet.balanceMinor,
        createdAt: u.createdAt,
      };
    });

    if (search) {
      userList = userList.filter(
        (u) =>
          u.email.toLowerCase().includes(search) ||
          u.displayName.toLowerCase().includes(search) ||
          u.city.toLowerCase().includes(search)
      );
    }

    return res.status(200).json({ success: true, users: userList });
  }

  // POST: Suspend, reactivate, or toggle verification badge
  if (req.method === 'POST') {
    const { targetUserId, action, reason } = req.body;
    if (!targetUserId || !action) {
      return res.status(400).json({ success: false, error: 'targetUserId and action are required' });
    }

    const user = memoryStore.users.find((u) => u.id === targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Target user not found' });
    }

    const profile = memoryStore.profiles.find((p) => p.userId === targetUserId);

    if (action === 'suspend') {
      user.isSuspended = true;
      user.suspensionReason = reason || 'Administrative suspension';
      return res.status(200).json({ success: true, message: 'User account suspended.' });
    }

    if (action === 'reactivate') {
      user.isSuspended = false;
      user.suspensionReason = null;
      return res.status(200).json({ success: true, message: 'User account reactivated.' });
    }

    if (action === 'toggle_verification' && profile) {
      profile.verifiedBadge = !profile.verifiedBadge;
      return res.status(200).json({
        success: true,
        verifiedBadge: profile.verifiedBadge,
        message: `Profile verification badge set to ${profile.verifiedBadge}.`,
      });
    }

    if (action === 'delete') {
      // 1. Delete user in memoryStore
      const uIndex = memoryStore.users.findIndex((u) => u.id === targetUserId);
      if (uIndex !== -1) memoryStore.users.splice(uIndex, 1);

      // 2. Cascade delete profile
      const pIndex = memoryStore.profiles.findIndex((p) => p.userId === targetUserId);
      if (pIndex !== -1) memoryStore.profiles.splice(pIndex, 1);

      // 3. Cascade clean wallet, allowances, matches, messages
      memoryStore.wallets.delete(targetUserId);
      memoryStore.allowances.delete(targetUserId);
      memoryStore.transactions = memoryStore.transactions.filter((t) => t.userId !== targetUserId);
      memoryStore.messages = memoryStore.messages.filter((m) => m.senderId !== targetUserId && m.recipientId !== targetUserId);
      memoryStore.likes = memoryStore.likes.filter((l) => l.fromUserId !== targetUserId && l.toUserId !== targetUserId);
      memoryStore.passes = memoryStore.passes.filter((p) => p.fromUserId !== targetUserId && p.toUserId !== targetUserId);
      memoryStore.matches = memoryStore.matches.filter((m) => m.user1Id !== targetUserId && m.user2Id !== targetUserId);
      memoryStore.contactUnlocks = memoryStore.contactUnlocks.filter((cu) => cu.requesterId !== targetUserId && cu.targetUserId !== targetUserId);
      memoryStore.notifications = memoryStore.notifications.filter((n) => n.userId !== targetUserId);

      // 4. Also delete from PostgreSQL if connected
      await query('DELETE FROM users WHERE id = $1', [targetUserId]);

      return res.status(200).json({ success: true, message: 'User account and all associated data permanently deleted.' });
    }

    if (action === 'set_role') {
      const { role } = req.body;
      if (!['user', 'moderator', 'admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Invalid role specified' });
      }
      user.role = role;
      await query('UPDATE users SET role = $1 WHERE id = $2', [role, targetUserId]);
      return res.status(200).json({ success: true, message: `User role updated to ${role}.` });
    }

    if (action === 'adjust_wallet') {
      const { amountMinor } = req.body;
      const current = memoryStore.wallets.get(targetUserId) || { balanceMinor: 0, currency: 'RWF' };
      const newBal = Math.max(0, current.balanceMinor + Number(amountMinor));
      memoryStore.wallets.set(targetUserId, { balanceMinor: newBal, currency: current.currency });
      return res.status(200).json({ success: true, newBalance: newBal });
    }

    return res.status(400).json({ success: false, error: 'Unknown admin action' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
