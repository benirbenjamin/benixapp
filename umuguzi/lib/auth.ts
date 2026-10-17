import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { AuthUser, UserRole } from "@/types";
import prisma from "./prisma";

const JWT_SECRET = process.env.AUTH_SECRET || "umuguzipro-default-jwt-secret-key-32-chars-minimum";
export const SESSION_COOKIE_NAME = "umuguzi_session";
export const PENDING_2FA_COOKIE_NAME = "umuguzi_2fa_pending";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSixDigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function signToken(payload: object, expiresIn: string = "7d"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function verifyToken<T = any>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(PENDING_2FA_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken<{ userId: string }>(token);
    if (!decoded || !decoded.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        avatar: true,
        isVerified: true,
        twoFactorEnabled: true,
        referralCode: true,
        referredById: true,
        isBanned: true,
      },
    });

    if (!user || user.isBanned) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role as UserRole,
      avatar: user.avatar,
      isVerified: user.isVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      referralCode: user.referralCode,
      referredById: user.referredById,
    };
  } catch {
    return null;
  }
}

export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  if (userRole === "ADMIN" && !requiredRoles.includes("SUPER_ADMIN")) return true;
  return requiredRoles.includes(userRole);
}
