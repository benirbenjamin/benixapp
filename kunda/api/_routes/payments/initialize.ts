// =====================================================================
// POST /api/payments/initialize - Initiate Deposit with Flutterwave
// =====================================================================
import { extractAuthUser } from '../../_lib/auth.js';
import { memoryStore } from '../../_lib/db.js';
import { initializeFlutterwavePayment } from '../../_lib/flutterwave.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { amount, currency } = req.body;
  const parsedAmount = parseInt(amount, 10);

  if (isNaN(parsedAmount) || parsedAmount < 500) {
    return res.status(400).json({
      success: false,
      error: 'Minimum deposit amount is 500 RWF.',
    });
  }

  const user = memoryStore.users.find((u) => u.id === auth.userId);
  const profile = memoryStore.profiles.find((p) => p.userId === auth.userId);

  const initResult = await initializeFlutterwavePayment({
    userId: auth.userId,
    email: auth.email,
    displayName: profile?.displayName || 'Kunda Space Member',
    amount: parsedAmount,
    currency: currency || 'RWF',
    phoneNumber: user?.phone,
  });

  return res.status(200).json(initResult);
}
