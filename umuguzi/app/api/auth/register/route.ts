import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, generateSixDigitCode, signToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { sendEmailDetailed, getVerificationEmailTemplate } from "@/lib/email";
import { getSiteSettings } from "@/lib/settings";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, username, displayName, password, ref, resendOnly } = body;

    // Handle resend request if requested
    if (resendOnly && email) {
      const cleanEmail = email.toLowerCase().trim();
      const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!existingUser) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      const newCode = generateSixDigitCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.emailVerificationCode.create({
        data: {
          userId: existingUser.id,
          code: newCode,
          expiresAt,
        },
      });

      const settings = await getSiteSettings();
      const emailDispatch = await sendEmailDetailed({
        to: cleanEmail,
        subject: `Your ${settings.app_name} Verification Code: ${newCode}`,
        html: getVerificationEmailTemplate(newCode, settings.app_name),
        text: `Your ${settings.app_name} verification code is: ${newCode}`,
      });

      return NextResponse.json({
        success: true,
        emailSent: emailDispatch.success,
        message: emailDispatch.success
          ? "A new verification code has been dispatched to your email."
          : "Verification code generated, but email delivery failed. Please check Resend configuration.",
      });
    }

    if (!email || !username || !displayName || !password) {
      return NextResponse.json(
        { error: "Email, username, display name, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");

    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters and alphanumeric." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email or username already exists." },
        { status: 409 }
      );
    }

    // Check referrer if provided
    let referrerId: string | null = null;
    if (ref) {
      const referrer = await prisma.user.findFirst({
        where: {
          OR: [{ referralCode: ref }, { username: ref.toLowerCase() }],
        },
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    const isBenirSuperAdmin = cleanEmail === "benirabok@gmail.com";
    const settings = await getSiteSettings();
    const isVerificationRequired = !isBenirSuperAdmin && settings.email_verification_enabled === "true";
    const passwordHash = await hashPassword(password);
    const verificationCode = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create user and wallet atomically
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        username: cleanUsername,
        displayName: displayName.trim(),
        passwordHash,
        role: isBenirSuperAdmin ? "SUPER_ADMIN" : "USER",
        isVerified: isBenirSuperAdmin || !isVerificationRequired, // Auto-verified for superadmin or if verification disabled!
        twoFactorEnabled: false, // Default to false!
        referredById: referrerId,
        wallet: {
          create: {
            availableBalance: isBenirSuperAdmin ? 5000000 : 0,
            pendingBalance: 0,
            totalEarnings: isBenirSuperAdmin ? 5000000 : 0,
            totalWithdrawn: 0,
            currency: "RWF",
          },
        },
        ...(isVerificationRequired
          ? {
              emailCodes: {
                create: {
                  code: verificationCode,
                  expiresAt,
                },
              },
            }
          : {}),
      },
    });

    // If verification is disabled on platform or user is Benir, sign in user immediately!
    if (!isVerificationRequired) {
      const sessionToken = signToken({ userId: user.id }, "7d");
      const response = NextResponse.json({
        success: true,
        requiresVerification: false,
        message: "Registration successful. Welcome to Umuguzipro!",
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

    // Send verification email (when email verification is enabled)
    const emailDispatch = await sendEmailDetailed({
      to: cleanEmail,
      subject: `Your ${settings.app_name} Verification Code: ${verificationCode}`,
      html: getVerificationEmailTemplate(verificationCode, settings.app_name),
      text: `Your ${settings.app_name} email verification code is: ${verificationCode}. Expires in 15 minutes.`,
    });

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      emailSent: emailDispatch.success,
      emailError: !emailDispatch.success ? emailDispatch.error : undefined,
      message: emailDispatch.success
        ? "Registration successful. Please enter the 6-digit verification code sent to your email."
        : "Registration successful, but verification email could not be sent. Please contact support or check Resend domain verification.",
      email: cleanEmail,
      userId: user.id,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    let msg = error?.message || "An unexpected error occurred during registration.";
    if (msg.includes("Can't reach database server") || error?.code === "P1001" || error?.code === "P1002") {
      msg = "Database Connection Error: Unable to connect to the PostgreSQL database server. Please check your DATABASE_URL environment configuration on your hosting provider.";
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
