import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, generateSixDigitCode, signToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { sendEmail, sendEmailDetailed, getTwoFactorEmailTemplate } from "@/lib/email";
import { getSiteSettings } from "@/lib/settings";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanIdentifier }, { username: cleanIdentifier }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your email/username and password." },
        { status: 401 }
      );
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: "This account has been suspended. Please contact platform administration." },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your email/username and password." },
        { status: 401 }
      );
    }

    const isSuperAdminBenir = user.email.toLowerCase() === "benirabok@gmail.com";

    // Auto-verify and ensure SUPER_ADMIN role for benirabok@gmail.com
    if (isSuperAdminBenir) {
      if (!user.isVerified || user.role !== "SUPER_ADMIN" || user.twoFactorEnabled) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: "SUPER_ADMIN",
            isVerified: true,
            twoFactorEnabled: false,
          },
        });
        user.role = "SUPER_ADMIN" as any;
        user.isVerified = true;
        user.twoFactorEnabled = false;
      }
    }

    const settings = await getSiteSettings();

    // Auto-verify user if email verification is disabled on the platform
    if (!user.isVerified && settings.email_verification_enabled !== "true") {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
      user.isVerified = true;
    }

    // 2FA Bypass: Always bypassed for benirabok@gmail.com, or when twoFactorEnabled is false or globally disabled
    const isTwoFactorRequired =
      !isSuperAdminBenir &&
      Boolean(user.twoFactorEnabled) &&
      settings.two_factor_enabled === "true";

    if (!isTwoFactorRequired) {
      // Direct session login bypassing 2FA
      const sessionToken = signToken({ userId: user.id }, "7d");

      const response = NextResponse.json({
        success: true,
        requires2FA: false,
        message: "Login successful.",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          referralCode: user.referralCode,
        },
      });

      response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // Two-Factor Authentication Flow (when 2FA is active)
    const twoFactorCode = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store 2FA code securely in DB
    await prisma.twoFactorCode.deleteMany({ where: { userId: user.id } });
    await prisma.twoFactorCode.create({
      data: {
        userId: user.id,
        code: twoFactorCode,
        expiresAt,
      },
    });

    // Send 2FA code via email
    const emailDispatch = await sendEmailDetailed({
      to: user.email,
      subject: `Your ${settings.app_name} Login 2FA Code: ${twoFactorCode}`,
      html: getTwoFactorEmailTemplate(twoFactorCode, settings.app_name),
      text: `Your ${settings.app_name} 2FA security code is: ${twoFactorCode}. Valid for 10 minutes.`,
    });

    // Generate a temporary 2FA token so user can verify
    const pendingToken = signToken({ userId: user.id, purpose: "2FA" }, "15m");

    const response = NextResponse.json({
      success: true,
      requires2FA: true,
      emailSent: emailDispatch.success,
      emailError: !emailDispatch.success ? emailDispatch.error : undefined,
      email: user.email.replace(/(.{2})(.*)(?=@)/, (_m, p1, p2) => p1 + "*".repeat(p2.length)),
      message: emailDispatch.success
        ? "Password verified. A 6-digit 2FA code has been sent to your email."
        : "Password verified, but email dispatch failed. Please check Resend/SMTP settings or contact support.",
    });

    // Set pending 2FA cookie
    response.cookies.set("umuguzi_2fa_pending", pendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    const msg = error?.message || "An unexpected error occurred during login.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
