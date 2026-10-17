import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken, signToken, SESSION_COOKIE_NAME, PENDING_2FA_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "2FA verification code is required." }, { status: 400 });
    }

    const cookieStore = cookies();
    const pendingToken = cookieStore.get(PENDING_2FA_COOKIE_NAME)?.value;

    if (!pendingToken) {
      return NextResponse.json(
        { error: "2FA session expired. Please log in again." },
        { status: 401 }
      );
    }

    const decoded = verifyToken<{ userId: string; purpose: string }>(pendingToken);
    if (!decoded || decoded.purpose !== "2FA" || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid or expired 2FA session. Please log in again." },
        { status: 401 }
      );
    }

    const twoFactorRecord = await prisma.twoFactorCode.findFirst({
      where: { userId: decoded.userId },
      orderBy: { createdAt: "desc" },
    });

    if (!twoFactorRecord) {
      return NextResponse.json(
        { error: "No active 2FA code found. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date() > twoFactorRecord.expiresAt) {
      return NextResponse.json(
        { error: "The 2FA code has expired. Please log in again." },
        { status: 400 }
      );
    }

    if (twoFactorRecord.attempts >= 5) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please log in again." },
        { status: 429 }
      );
    }

    if (twoFactorRecord.code !== code.trim()) {
      await prisma.twoFactorCode.update({
        where: { id: twoFactorRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: "Invalid 2FA code. Please check and try again." }, { status: 400 });
    }

    // Code is valid! Get user
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Clean up 2FA codes
    await prisma.twoFactorCode.deleteMany({ where: { userId: user.id } });

    // Issue full session token (valid 7 days)
    const sessionToken = signToken({ userId: user.id }, "7d");

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user,
    });

    // Set HTTP-only secure session cookie
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Remove pending 2FA cookie
    response.cookies.delete(PENDING_2FA_COOKIE_NAME);

    return response;
  } catch (error: any) {
    console.error("2FA verification error:", error);
    return NextResponse.json({ error: "An unexpected error occurred during 2FA verification." }, { status: 500 });
  }
}
