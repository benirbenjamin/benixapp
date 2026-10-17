import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { sendOtpCodeEmail, isEmailConfigured } from '../utils/emailHelper.js';

const router = express.Router();

// Helper to determine if dev mock code should be exposed in API responses
function shouldExposeDevCode() {
  return process.env.NODE_ENV !== 'production' || !isEmailConfigured();
}

// Helper to generate 4-digit code
function generate4DigitCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// POST /api/auth/register - Create account and send 4-digit verification code
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existing = await query(`SELECT id, full_name, email_verified FROM users WHERE LOWER(email) = LOWER($1)`, [trimmedEmail]);
    if (existing.rows.length > 0) {
      const existingUser = existing.rows[0];
      // If user registered earlier but hasn't completed verification, permit re-verification
      if (!existingUser.email_verified) {
        const code = generate4DigitCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const nowIso = new Date().toISOString();

        await query(`
          INSERT INTO verification_codes (id, email, code, type, expires_at, used, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [`otp-${Date.now()}`, trimmedEmail, code, 'signup', expiresAt, false, nowIso]);

        await sendOtpCodeEmail({ to: trimmedEmail, code, type: 'signup', name: existingUser.full_name || full_name.trim() });

        return res.status(200).json({
          message: isEmailConfigured()
            ? 'Account pending verification. A fresh 4-digit code has been sent to your email.'
            : 'Account pending verification. Enter the 4-digit code to complete activation.',
          email: trimmedEmail,
          require_otp: true,
          requires_verification: true,
          dev_code: shouldExposeDevCode() ? code : undefined
        });
      }

      return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
    }

    // Generate or use provided unique username
    let baseUsername = (req.body.username && req.body.username.trim())
      ? req.body.username.trim().replace(/[^a-zA-Z0-9_]/g, '')
      : trimmedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    if (!baseUsername) baseUsername = 'user';
    let targetUsername = baseUsername;
    let counter = 1;
    while (true) {
      const uCheck = await query(`SELECT id FROM users WHERE LOWER(username) = LOWER($1)`, [targetUsername]);
      if (uCheck.rows.length === 0) break;
      targetUsername = `${baseUsername}${counter++}`;
    }

    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user with role 'user' and email_verified = false
    await query(`
      INSERT INTO users (id, username, email, password_hash, role, full_name, phone, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [userId, targetUsername, trimmedEmail, passwordHash, 'user', full_name.trim(), phone ? phone.trim() : null, false]);

    // Generate 4-digit code
    const code = generate4DigitCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
    const nowIso = new Date().toISOString();

    await query(`
      INSERT INTO verification_codes (id, email, code, type, expires_at, used, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [`otp-${Date.now()}`, trimmedEmail, code, 'signup', expiresAt, false, nowIso]);

    // Send email
    await sendOtpCodeEmail({ to: trimmedEmail, code, type: 'signup', name: full_name });

    res.status(201).json({
      message: isEmailConfigured()
        ? 'Account created! Please enter the 4-digit code sent to your email to verify.'
        : 'Account created! Please enter the 4-digit verification code below.',
      email: trimmedEmail,
      require_otp: true,
      requires_verification: true,
      dev_code: shouldExposeDevCode() ? code : undefined
    });
  } catch (err) {
    console.error('[Auth] Registration error:', err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

// POST /api/auth/login - Step 1: Validate password and dispatch 4-digit OTP code to email
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username/email and password are required.' });
    }

    const userResult = await query(
      `SELECT * FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)`,
      [username.trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Generate 4-digit OTP code for login
    const code = generate4DigitCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const nowIso = new Date().toISOString();
    await query(`
      INSERT INTO verification_codes (id, email, code, type, expires_at, used, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [`otp-${Date.now()}`, user.email.toLowerCase(), code, 'login', expiresAt, false, nowIso]);

    // Send email
    await sendOtpCodeEmail({
      to: user.email,
      code,
      type: 'login',
      name: user.full_name || user.username
    });

    res.json({
      require_otp: true,
      email: user.email,
      message: isEmailConfigured()
        ? `A 4-digit security code has been sent to ${user.email}.`
        : `A 4-digit security code has been dispatched. Enter the code to continue.`,
      dev_code: shouldExposeDevCode() ? code : undefined
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'An unexpected server error occurred during login.' });
  }
});

// POST /api/auth/verify-code - Step 2: Validate 4-digit code (for signup or login) and issue session
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code, type } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and 4-digit verification code are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // Find latest unused code for this email and type
    const codeRes = await query(`
      SELECT * FROM verification_codes
      WHERE LOWER(email) = LOWER($1) AND code = $2 AND used = false
      ORDER BY created_at DESC
      LIMIT 1
    `, [trimmedEmail, cleanCode]);

    if (codeRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    const otpRecord = codeRes.rows[0];

    // Check expiration
    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    // Mark code as used
    await query(`UPDATE verification_codes SET used = true WHERE id = $1`, [otpRecord.id]);

    // Fetch user
    const userRes = await query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1)`, [trimmedEmail]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const user = userRes.rows[0];

    // Mark email as verified
    await query(`UPDATE users SET email_verified = true WHERE id = $1`, [user.id]);

    // Fetch assigned stations
    let assignedStations = [];
    if (user.role === 'stationadmin') {
      const stationRes = await query(`
        SELECT rs.* 
        FROM radio_stations rs
        JOIN station_admins sa ON rs.id = sa.station_id
        WHERE sa.user_id = $1
      `, [user.id]);
      assignedStations = stationRes.rows;
    } else if (user.role === 'superadmin') {
      const allStations = await query(`SELECT * FROM radio_stations ORDER BY name ASC`);
      assignedStations = allStations.rows;
    }

    const token = generateToken(user);

    // Audit log
    await query(`
      INSERT INTO audit_logs (id, user_id, action, details)
      VALUES ($1, $2, $3, $4)
    `, [
      `log-${Date.now()}`,
      user.id,
      otpRecord.type === 'signup' ? 'USER_SIGNUP_VERIFIED' : 'USER_LOGIN_VERIFIED',
      JSON.stringify({ ip: req.ip, userAgent: req.headers['user-agent'] })
    ]);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name || '',
        phone: user.phone || '',
        role: user.role
      },
      assignedStations
    });
  } catch (err) {
    console.error('[Auth] Verify code error:', err);
    res.status(500).json({ error: 'Failed to verify code.' });
  }
});

// POST /api/auth/resend-code - Resend a fresh 4-digit code
router.post('/resend-code', async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const userRes = await query(`SELECT * FROM users WHERE LOWER(email) = LOWER($1)`, [trimmedEmail]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    const user = userRes.rows[0];
    const code = generate4DigitCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const nowIso = new Date().toISOString();
    await query(`
      INSERT INTO verification_codes (id, email, code, type, expires_at, used, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [`otp-${Date.now()}`, trimmedEmail, code, type || 'login', expiresAt, false, nowIso]);

    await sendOtpCodeEmail({
      to: trimmedEmail,
      code,
      type: type || 'login',
      name: user.full_name || user.username
    });

    res.json({
      message: isEmailConfigured()
        ? 'A fresh 4-digit verification code has been sent to your email.'
        : 'A fresh 4-digit verification code has been generated.',
      dev_code: shouldExposeDevCode() ? code : undefined
    });
  } catch (err) {
    console.error('[Auth] Resend code error:', err);
    res.status(500).json({ error: 'Failed to resend verification code.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await query(
      `SELECT id, username, email, full_name, role, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userResult.rows[0];

    // Fetch stations
    let assignedStations = [];
    if (user.role === 'stationadmin') {
      const stationRes = await query(`
        SELECT rs.* 
        FROM radio_stations rs
        JOIN station_admins sa ON rs.id = sa.station_id
        WHERE sa.user_id = $1
      `, [user.id]);
      assignedStations = stationRes.rows;
    } else if (user.role === 'superadmin') {
      const allStations = await query(`SELECT * FROM radio_stations ORDER BY name ASC`);
      assignedStations = allStations.rows;
    }

    res.json({
      user,
      assignedStations
    });
  } catch (err) {
    console.error('[Auth] Me endpoint error:', err);
    res.status(500).json({ error: 'Failed to retrieve authenticated user profile.' });
  }
});

// PUT /api/auth/profile - Update user profile and/or change password
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, username, email, current_password, new_password } = req.body;

    // 1. Fetch current user
    const userRes = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const currentUser = userRes.rows[0];

    // 2. Check username collision if changed
    const targetUsername = username ? username.trim() : currentUser.username;
    if (targetUsername.toLowerCase() !== currentUser.username.toLowerCase()) {
      const existingUsername = await query(
        `SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2`,
        [targetUsername, userId]
      );
      if (existingUsername.rows.length > 0) {
        return res.status(400).json({ error: 'Username is already taken by another account.' });
      }
    }

    // 3. Check email collision if changed
    const targetEmail = email ? email.trim() : currentUser.email;
    if (targetEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
      const existingEmail = await query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2`,
        [targetEmail, userId]
      );
      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ error: 'Email is already registered to another account.' });
      }
    }

    // 4. Handle password change if requested
    let targetPasswordHash = currentUser.password_hash;
    let passwordChanged = false;
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Current password is required to set a new password.' });
      }
      const match = await bcrypt.compare(current_password, currentUser.password_hash);
      if (!match) {
        return res.status(400).json({ error: 'Current password is incorrect.' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }
      targetPasswordHash = await bcrypt.hash(new_password, 10);
      passwordChanged = true;
    }

    const targetFullName = full_name !== undefined ? full_name.trim() : (currentUser.full_name || '');

    // 5. Update user in database
    if (passwordChanged) {
      await query(
        `UPDATE users SET full_name = $1, username = $2, email = $3, password_hash = $4 WHERE id = $5`,
        [targetFullName, targetUsername, targetEmail, targetPasswordHash, userId]
      );
    } else {
      await query(
        `UPDATE users SET full_name = $1, username = $2, email = $3 WHERE id = $4`,
        [targetFullName, targetUsername, targetEmail, userId]
      );
    }

    // 6. Audit log
    await query(`
      INSERT INTO audit_logs (id, user_id, action, details)
      VALUES ($1, $2, $3, $4)
    `, [
      `log-${Date.now()}`,
      userId,
      passwordChanged ? 'USER_PASSWORD_CHANGE' : 'USER_PROFILE_UPDATE',
      JSON.stringify({ username: targetUsername, email: targetEmail, passwordChanged })
    ]);

    // 7. Generate updated token and response
    const updatedUser = {
      id: currentUser.id,
      username: targetUsername,
      email: targetEmail,
      full_name: targetFullName,
      role: currentUser.role
    };
    const token = generateToken(updatedUser);

    res.json({
      message: passwordChanged ? 'Profile and password updated successfully.' : 'Profile updated successfully.',
      user: updatedUser,
      token
    });
  } catch (err) {
    console.error('[Auth] Profile update error:', err);
    res.status(500).json({ error: 'An unexpected error occurred while updating profile.' });
  }
});

export default router;
