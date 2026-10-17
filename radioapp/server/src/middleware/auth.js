import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_radio_jwt_key_2026';

// Authenticate JWT Token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired authentication token.' });
    }
    req.user = user;
    next();
  });
}

// Require specific role (e.g., 'superadmin')
export function requireRole(allowedRole) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== allowedRole) {
      return res.status(403).json({ error: `Access denied. Requires ${allowedRole} privileges.` });
    }
    next();
  };
}

// Verify Station-level access (Super Admin can access all, Station Admin only their assigned station)
export async function verifyStationAccess(req, res, next) {
  const stationId = req.params.stationId || req.body.station_id || req.query.station_id;

  if (!stationId) {
    return res.status(400).json({ error: 'Station ID is required for this operation.' });
  }

  // Super Admin has global access to all stations
  if (req.user && req.user.role === 'superadmin') {
    return next();
  }

  // Station Admin must have explicit assignment in station_admins table
  try {
    const result = await query(
      `SELECT 1 FROM station_admins WHERE user_id = $1 AND station_id = $2`,
      [req.user.id, stationId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        error: 'Access denied: You are not authorized to manage or modify this radio station.'
      });
    }

    next();
  } catch (err) {
    console.error('[Auth] Error checking station access:', err);
    return res.status(500).json({ error: 'Failed to verify station authorization.' });
  }
}

// Helper to generate JWT token
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
