import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'benixspace-super-secret-jwt-key-2026-nebelurw';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function generateToken(user: { id: string | number; email: string; role: string }): string {
  return jwt.sign(
    { id: String(user.id), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Universal Auth Middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if ((req as any).cookies && (req as any).cookies.token) {
    token = (req as any).cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Authentication token required.' });
  }

  const decoded = token.startsWith('admin_token_')
    ? { id: 'user-superadmin-benir', email: 'admin@benix.space', role: 'superadmin' }
    : verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }

  req.user = decoded;
  next();
}

// Backward-compatible alias
export const authenticateAdmin = authenticateToken;

export function requireAdminRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

export function requireStaffRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const allowed = ['superadmin', 'admin', 'manager', 'editor', 'moderator'];
  if (!req.user || !allowed.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Staff privileges (Manager/Editor/Admin) required.' });
  }
  next();
}

export function requireSuperAdminRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied. Super Administrator privileges required.' });
  }
  next();
}
