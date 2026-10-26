import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSixDigitCode, hashPassword } from "@/lib/auth";
import { sendEmail, getPasswordResetEmailTemplate } from "@/lib/email";
import { getSiteSettings } from "@/lib/settings";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code, newPassword } = body;

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        passwordResetCodes: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!user) {
      // Don't reveal account existence for security, or return standard message
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a 6-digit reset code has been sent.",
      });
    }

    // Step 2: User submitted the 6-digit code and the new password
    if (code && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters." },
          { status: 400 }
        );
      }

      const activeCode = user.passwordResetCodes[0];
      if (!activeCode) {
        return NextResponse.json(
          { error: "No active password reset request found. Please request a new code." },
          { status: 400 }
        );
      }

      if (new Date() > activeCode.expiresAt) {
        return NextResponse.json(
          { error: "This reset code has expired. Please request a new code." },
          { status: 400 }
        );
      }

      if (activeCode.attempts >= 5) {
        return NextResponse.json(
          { error: "Too many failed attempts. Please request a new code." },
          { status: 429 }
        );
      }

      if (activeCode.code !== code.trim()) {
        await prisma.passwordResetCode.update({
          where: { id: activeCode.id },
          data: { attempts: { increment: 1 } },
        });
        return NextResponse.json(
          { error: "Invalid verification code. Please check and try again." },
          { status: 400 }
        );
      }

      // Valid! Update password
      const newHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });

      // Clear used reset codes
      await prisma.passwordResetCode.deleteMany({
        where: { userId: user.id },
      });

      return NextResponse.json({
        success: true,
        message: "Password has been successfully reset! You can now log in.",
      });
    }

    // Step 1: User requested a password reset code
    const resetCode = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.passwordResetCode.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetCode.create({
      data: {
        userId: user.id,
        code: resetCode,
        expiresAt,
      },
    });

    const settings = await getSiteSettings();
    await sendEmail({
      to: cleanEmail,
      subject: `Your ${settings.app_name} Password Reset Code: ${resetCode}`,
      html: getPasswordResetEmailTemplate(resetCode, settings.app_name),
      text: `Your ${settings.app_name} password reset code is: ${resetCode}. Valid for 15 minutes.`,
    });

    return NextResponse.json({
      success: true,
      message: "A 6-digit password reset code has been sent to your email.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request." },
      { status: 500 }
    );
  }
}
