// =====================================================================
// GET /api/wallet/transactions - Immutable Ledger Audit History
// =====================================================================
import { extractAuthUser } from '../../_lib/auth.js';
import { getTransactionHistory } from '../../_lib/wallet.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const transactions = await getTransactionHistory(auth.userId);

  return res.status(200).json({
    success: true,
    transactions,
  });
}
