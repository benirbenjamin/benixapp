// =====================================================================
// POST & GET /api/wallet/withdraw - Payout Requests & History
// Supports MTN MoMo, Airtel Money, Bank Transfer with saved credentials
// =====================================================================
import { extractAuthUser } from '../../_lib/auth.js';
import { requestWithdrawal, getWithdrawalHistory, getWalletBalance } from '../../_lib/wallet.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // GET: Fetch user's withdrawal request history
  if (req.method === 'GET') {
    const history = await getWithdrawalHistory(auth.userId);
    return res.status(200).json({ success: true, withdrawals: history });
  }

  // POST: Submit a new withdrawal request
  if (req.method === 'POST') {
    const { amount, payoutMethod, payoutAccount, accountHolderName, bankName } = req.body || {};

    const amountNum = parseInt(amount, 10);
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ success: false, error: 'Please enter a valid withdrawal amount.' });
    }

    if (!payoutMethod || !['momo', 'airtel', 'bank'].includes(payoutMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payout method. Please choose MTN MoMo, Airtel Money, or Bank Transfer.',
      });
    }

    if (!payoutAccount || typeof payoutAccount !== 'string' || !payoutAccount.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Payout account/phone number is required.',
      });
    }

    if (!accountHolderName || typeof accountHolderName !== 'string' || !accountHolderName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Account holder name is required.',
      });
    }

    if (payoutMethod === 'bank' && (!bankName || !bankName.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Bank name is required for bank transfers (e.g. Bank of Kigali, Equity, I&M).',
      });
    }

    const result = await requestWithdrawal(
      auth.userId,
      amountNum,
      payoutMethod,
      payoutAccount,
      accountHolderName,
      bankName
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    const updatedWallet = await getWalletBalance(auth.userId);

    return res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully. Funds will be sent to your account.',
      withdrawal: result.withdrawal,
      wallet: updatedWallet,
    });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
