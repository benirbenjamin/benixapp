// =====================================================================
// POST /api/auth/reset-password - Complete Password Reset
// =====================================================================
import { hashPassword } from '../../_lib/auth.js';
import { memoryStore, query } from '../../_lib/db.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, code, token, newPassword } = req.body || {};

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
    }

    if (!email && !token) {
      return res.status(400).json({ success: false, error: 'Email address or reset token is required' });
    }

    let user = null;
    if (token) {
      user = memoryStore.users.find((u) => u.resetToken === token);
      if (!user) {
        const uRes = await query('SELECT * FROM users WHERE reset_token = $1', [token]);
        if (uRes?.rows?.[0]) {
          user = uRes.rows[0];
          memoryStore.users.push(user);
        }
      }
    } else if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      user = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        const uRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
        if (uRes?.rows?.[0]) {
          user = uRes.rows[0];
          memoryStore.users.push(user);
        }
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'Account not found or recovery token is invalid' });
    }

    // Check expiration
    const resetExpiresAt = user.resetExpiresAt || user.reset_expires_at;
    if (resetExpiresAt && new Date(resetExpiresAt) < new Date()) {
      return res.status(400).json({ success: false, error: 'Reset code has expired. Please request a new one.' });
    }

    // Verify code or token
    const storedCode = (user.resetCode || user.reset_code)?.toString().trim();
    const storedToken = user.resetToken || user.reset_token;

    const isCodeMatch = code && storedCode === code.toString().trim();
    const isTokenMatch = token && storedToken === token;

    if (!isCodeMatch && !isTokenMatch) {
      return res.status(400).json({ success: false, error: 'Invalid reset code. Please check your email.' });
    }

    // Hash new password and save
    const newHash = await hashPassword(newPassword);
    user.passwordHash = newHash;
    user.resetCode = null;
    user.resetToken = null;
    user.resetExpiresAt = null;

    // Update in DB
    await query('UPDATE users SET password_hash = $1, reset_code = NULL, reset_token = NULL, reset_expires_at = NULL WHERE id = $2', [newHash, user.id]).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. You can now sign in with your new password.',
    });
  } catch (err: any) {
    console.error('Reset password API error:', err);
    return res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
}
