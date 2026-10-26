import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSixDigitCode } from "@/lib/auth";
import { sendEmail, getVerificationEmailTemplate } from "@/lib/email";
import { getSiteSettings } from "@/lib/settings";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code, resend } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { emailCodes: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    // Handle Resend
    if (resend) {
      const newCode = generateSixDigitCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.emailVerificationCode.create({
        data: {
          userId: user.id,
          code: newCode,
          expiresAt,
        },
      });

      const settings = await getSiteSettings();
      await sendEmail({
        to: cleanEmail,
        subject: `Your New ${settings.app_name} Verification Code: ${newCode}`,
        html: getVerificationEmailTemplate(newCode, settings.app_name),
        text: `Your ${settings.app_name} verification code is: ${newCode}`,
      });

      return NextResponse.json({
        success: true,
        message: "A new verification code has been dispatched to your email.",
      });
    }

    // Verify Code
    if (!code) {
      return NextResponse.json({ error: "Verification code is required." }, { status: 400 });
    }

    const latestCode = user.emailCodes[0];
    if (!latestCode) {
      return NextResponse.json({ error: "No active verification code found. Please request a new one." }, { status: 400 });
    }

    if (new Date() > latestCode.expiresAt) {
      return NextResponse.json({ error: "This code has expired. Please request a new code." }, { status: 400 });
    }

    if (latestCode.attempts >= 5) {
      return NextResponse.json({ error: "Too many failed attempts. Please request a new code." }, { status: 429 });
    }

    if (latestCode.code !== code.trim()) {
      await prisma.emailVerificationCode.update({
        where: { id: latestCode.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: "Invalid verification code. Please try again." }, { status: 400 });
    }

    // Mark user verified
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    // Delete used code
    await prisma.emailVerificationCode.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: "Email successfully verified! You can now log in.",
    });
  } catch (error: any) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Failed to verify email." }, { status: 500 });
  }
}
