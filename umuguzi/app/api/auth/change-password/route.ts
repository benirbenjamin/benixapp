import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Retrieve user with password hash
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Incorrect current password. Please check and try again." },
        { status: 400 }
      );
    }

    // Hash and update to new password
    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Log notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Password Changed",
        message: "Your account password was successfully updated.",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while changing password." },
      { status: 500 }
    );
  }
}
