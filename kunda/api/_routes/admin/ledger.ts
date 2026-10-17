// =====================================================================
// GET & POST /api/admin/ledger - Platform-Wide Financial Ledger & Audit
// =====================================================================
import { extractAuthUser, isAuthorizedRole } from '../../_lib/auth.js';
import { memoryStore } from '../../_lib/db.js';
import { creditWallet } from '../../_lib/wallet.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth || !isAuthorizedRole(auth.role, ['super_admin', 'admin'])) {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
  }

  // GET: Platform transaction audit log
  if (req.method === 'GET') {
    const list = memoryStore.transactions.map((tx) => {
      const user = memoryStore.users.find((u) => u.id === tx.userId);
      const profile = memoryStore.profiles.find((p) => p.userId === tx.userId);
      return {
        ...tx,
        userEmail: user?.email || 'N/A',
        userDisplayName: profile?.displayName || 'Unknown Member',
      };
    });

    return res.status(200).json({ success: true, transactions: list });
  }

  // POST: Manual authorized adjustment
  if (req.method === 'POST') {
    const { targetUserId, amountMinor, reason } = req.body;
    if (!targetUserId || !amountMinor || !reason) {
      return res.status(400).json({ success: false, error: 'targetUserId, amountMinor, and reason are required' });
    }

    const creditResult = await creditWallet(
      targetUserId,
      parseInt(amountMinor, 10),
      'admin_adjustment',
      `Manual Admin Adjustment: ${reason} (by ${auth.email})`
    );

    return res.status(200).json({ success: true, creditResult });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
