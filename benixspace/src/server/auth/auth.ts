import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || (() => {
  console.warn('⚠️ [SECURITY WARNING]: Neither JWT_SECRET nor AUTH_SECRET is set in environment. Using a fallback runtime secret. Please set JWT_SECRET in .env for production.');
  return 'benixspace_sec_' + (process.env.NODE_ENV === 'production' ? 'prod_' : 'dev_') + 'secure_jwt_2026';
})();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
    channel_name?: string;
    phone?: string;
    avatar_url?: string;
    country?: string;
    referral_code?: string;
    selected_modules?: string[];
    app_profiles?: Record<string, any>;
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

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }

  req.user = decoded;
  next();
}

// Authenticate Admin Middleware (Enforces valid token AND Admin/Superadmin Role)
export function authenticateAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  authenticateToken(req, res, () => {
    requireAdminRole(req, res, next);
  });
}

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
