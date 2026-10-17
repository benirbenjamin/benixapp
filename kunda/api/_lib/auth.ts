// =====================================================================
// KUNDA SPACE: SERVER-SIDE AUTHENTICATION & SECURITY UTILITIES
// =====================================================================
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BUSINESS_CONFIG } from './config.js';

const JWT_SECRET = process.env.JWT_SECRET || 'kunda-space-super-secure-production-jwt-token-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Strict server-side age validation.
 * Must be at least 18 years old as of today.
 */
export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

export function isAdult(dobString: string): boolean {
  return calculateAge(dobString) >= BUSINESS_CONFIG.MINIMUM_AGE_YEARS;
}

/**
 * Password hashing and verification
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * JWT Token Generation & Verification
 */
export interface AuthUserPayload {
  userId: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'super_admin';
  preferredLanguage?: string;
}

export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
  } catch (err) {
    return null;
  }
}

export function extractAuthUser(req: any): AuthUserPayload | null {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;

  return verifyToken(parts[1]);
}

export function isAuthorizedRole(
  userRole: string,
  requiredRoles: Array<'user' | 'moderator' | 'admin' | 'super_admin'>
): boolean {
  return requiredRoles.includes(userRole as any);
}
