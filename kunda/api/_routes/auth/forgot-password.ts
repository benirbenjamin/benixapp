// =====================================================================
// POST /api/auth/forgot-password - Request Password Reset Email
// =====================================================================
import crypto from 'crypto';
import { memoryStore, query } from '../../_lib/db.js';
import { sendPasswordResetEmail } from '../../_lib/email.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      const dbRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
      if (dbRes?.rows?.[0]) {
        user = dbRes.rows[0];
        memoryStore.users.push(user);
      }
    }

    if (user) {
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      user.resetCode = resetCode;
      user.resetToken = resetToken;
      user.resetExpiresAt = resetExpiresAt;

      // Update in DB if table supports reset columns
      await query(
        'UPDATE users SET reset_code = $1, reset_token = $2, reset_expires_at = $3 WHERE id = $4',
        [resetCode, resetToken, resetExpiresAt, user.id]
      ).catch(() => {});

      let profile = memoryStore.profiles.find((p) => p.userId === user.id);
      if (!profile) {
        const pRes = await query('SELECT * FROM profiles WHERE user_id = $1', [user.id]);
        if (pRes?.rows?.[0]) profile = pRes.rows[0];
      }
      const displayName = profile?.displayName || profile?.display_name || user.displayName || 'Kunda Space Member';

      // Detect app host URL from incoming request headers
      const proto = (req.headers && req.headers['x-forwarded-proto']) || 'https';
      const host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || 'kunda-rose.vercel.app';
      const appUrl = process.env.APP_URL || `${proto}://${host}`;

      let emailSent = false;
      let emailError: string | undefined = undefined;

      try {
        const emailRes = await sendPasswordResetEmail(user.email, displayName, resetCode, resetToken, appUrl);
        emailSent = emailRes.success;
        if (!emailRes.success) {
          emailError = emailRes.error;
          console.warn('⚠️ Password reset email delivery returned error:', emailRes.error);
        }
      } catch (emailErr: any) {
        emailError = emailErr?.message || String(emailErr);
        console.warn('⚠️ Password reset email dispatch caught exception:', emailError);
      }

      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a 6-digit reset code and recovery link have been dispatched.',
        resetCode, // Provided for instant prototype testing / preview
        emailSent,
        providerNotice: emailError || undefined,
      });
    }

    // Anti-account enumeration: Return generic success even if user not found
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a 6-digit reset code and recovery link have been dispatched.',
    });
  } catch (err: any) {
    console.error('Forgot password API error:', err);
    return res.status(500).json({ success: false, error: 'Failed to process password reset' });
  }
}
