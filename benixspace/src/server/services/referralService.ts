import { query } from '../db/db';
import { WalletService } from './walletService';
import crypto from 'crypto';

export class ReferralService {
  /**
   * Generates or fetches unique referral code for a user
   */
  static async getReferralCode(userId: string): Promise<string> {
    const res = await query('SELECT referral_code FROM core_users WHERE id = $1', [userId]);
    if (res.rowCount > 0 && res.rows[0].referral_code) {
      return res.rows[0].referral_code;
    }

    const code = 'REF-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    await query('UPDATE core_users SET referral_code = $1 WHERE id = $2', [code, userId]);
    return code;
  }

  /**
   * Applies referral attribution during registration
   */
  static async applyReferralCode(newUserId: string, referralCode: string): Promise<boolean> {
    if (!referralCode) return false;

    // Find referrer
    const refRes = await query('SELECT id FROM core_users WHERE referral_code = $1', [referralCode.trim()]);
    if (refRes.rowCount === 0) return false;

    const referrerId = refRes.rows[0].id;
    if (referrerId === newUserId) return false; // Prevent self-referral

    // Link user to referrer
    await query('UPDATE core_users SET referred_by_id = $1 WHERE id = $2', [referrerId, newUserId]);

    // Record pending referral event
    const refRecordId = 'ref-' + crypto.randomUUID();
    await query(
      `INSERT INTO core_referrals (id, referrer_id, referred_id, qualifying_action, reward_amount, status)
       VALUES ($1, $2, $3, 'registration', 500.00, 'pending')`,
      [refRecordId, referrerId, newUserId]
    );

    return true;
  }

  /**
   * Credits referral reward upon verified qualifying event (first deposit, purchase, or bet)
   */
  static async triggerQualifyingEvent(
    userId: string,
    action: string,
    module: string
  ): Promise<boolean> {
    // Check if user was referred and has a pending referral reward
    const pendingRef = await query(
      `SELECT * FROM core_referrals 
       WHERE referred_id = $1 AND status = 'pending' 
       ORDER BY created_at ASC LIMIT 1`,
      [userId]
    );

    if (pendingRef.rowCount === 0) return false;

    const ref = pendingRef.rows[0];
    const rewardAmount = Number(ref.reward_amount) || 500.00; // 500 RWF reward

    // Credit referrer's wallet
    await WalletService.credit(
      ref.referrer_id,
      rewardAmount,
      'referral',
      'commission',
      `Referral Reward: New user completed ${action} in ${module}`,
      `tx_ref_rew_${ref.id}`
    );

    // Mark referral as credited
    await query(
      `UPDATE core_referrals 
       SET status = 'approved', qualifying_action = $1, credited_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [action, ref.id]
    );

    return true;
  }

  /**
   * Get referral performance statistics for a user
   */
  static async getStats(userId: string): Promise<any> {
    const code = await this.getReferralCode(userId);
    const referrals = await query(
      `SELECT r.*, u.name as referred_name, u.email as referred_email 
       FROM core_referrals r 
       JOIN core_users u ON r.referred_id = u.id 
       WHERE r.referrer_id = $1 
       ORDER BY r.created_at DESC`,
      [userId]
    );

    const totalReferrals = referrals.rowCount;
    const approvedReferrals = referrals.rows.filter((r: any) => r.status === 'approved').length;
    const totalEarnings = referrals.rows
      .filter((r: any) => r.status === 'approved')
      .reduce((sum: number, r: any) => sum + Number(r.reward_amount || 0), 0);

    return {
      referral_code: code,
      referral_link: `https://benix.space/?ref=${code}`,
      total_referrals: totalReferrals,
      approved_referrals: approvedReferrals,
      total_earnings: totalEarnings,
      history: referrals.rows
    };
  }
}
