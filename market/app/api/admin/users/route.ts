import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN", "MODERATOR"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { username: { contains: q, mode: "insensitive" } },
              { displayName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        isVerified: true,
        isBanned: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, action, role } = body;

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const PROTECTED_SUPER_ADMIN_EMAIL = "benirabok@gmail.com";
    const isTargetProtectedSuperAdmin = target.email.toLowerCase() === PROTECTED_SUPER_ADMIN_EMAIL;

    // RULE 1: benirabok@gmail.com CAN NEVER BE DELETED, BANNED, OR DEMOTED BY ANYONE
    if (isTargetProtectedSuperAdmin) {
      if (action === "DELETE" || action === "BAN" || action === "UNVERIFY" || (action === "CHANGE_ROLE" && role !== "SUPER_ADMIN")) {
        return NextResponse.json(
          { error: "The primary Super Admin account (benirabok@gmail.com) is permanently protected and cannot be modified or deleted." },
          { status: 403 }
        );
      }
    }

    // RULE 2: DELETING OTHER USERS & ADMINS
    if (action === "DELETE") {
      const isTargetAdmin = target.role === "ADMIN" || target.role === "SUPER_ADMIN" || target.role === "MODERATOR";
      
      // If target is another admin, only benirabok@gmail.com or a SUPER_ADMIN can delete them!
      if (isTargetAdmin && user.email.toLowerCase() !== PROTECTED_SUPER_ADMIN_EMAIL && user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Only the primary Super Admin (benirabok@gmail.com) can delete other administrators." },
          { status: 403 }
        );
      }

      // Safe cascade deletion
      await prisma.$transaction(async (tx) => {
        // Delete dependent records
        await tx.session.deleteMany({ where: { userId: targetUserId } });
        await tx.emailVerificationCode.deleteMany({ where: { userId: targetUserId } });
        await tx.twoFactorCode.deleteMany({ where: { userId: targetUserId } });
        await tx.passwordResetCode.deleteMany({ where: { userId: targetUserId } });
        await tx.notification.deleteMany({ where: { userId: targetUserId } });
        await tx.videoLike.deleteMany({ where: { userId: targetUserId } });
        await tx.videoView.deleteMany({ where: { userId: targetUserId } });
        await tx.commentLike.deleteMany({ where: { userId: targetUserId } });
        await tx.comment.deleteMany({ where: { userId: targetUserId } });
        await tx.entitlement.deleteMany({ where: { userId: targetUserId } });
        await tx.channelSubscription.deleteMany({ where: { userId: targetUserId } });
        await tx.wallet.deleteMany({ where: { userId: targetUserId } });
        await tx.user.delete({ where: { id: targetUserId } });
      });

      // Send critical alert to Super Admin
      const { sendCriticalAdminAlert } = await import("@/lib/adminAlert");
      await sendCriticalAdminAlert({
        subject: `User Account Deleted (${target.email})`,
        title: `Account Deleted: ${target.displayName}`,
        message: `Admin ${user.displayName} (${user.email}) deleted user account ${target.displayName} (@${target.username}, ${target.email}, Role: ${target.role}).`,
        details: {
          "Deleted User": `${target.displayName} (${target.email})`,
          "Previous Role": target.role,
          "Deleted By": `${user.displayName} (${user.email})`,
        },
      });

      return NextResponse.json({ success: true, message: "User deleted successfully", deletedId: targetUserId });
    }

    let updatedData: any = {};
    if (action === "BAN") updatedData.isBanned = true;
    if (action === "UNBAN") updatedData.isBanned = false;
    if (action === "VERIFY") updatedData.isVerified = true;
    if (action === "UNVERIFY") updatedData.isVerified = false;
    if (action === "CHANGE_ROLE" && role) updatedData.role = role;

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: updatedData,
    });

    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: `USER_${action}`,
        targetType: "USER",
        targetId: targetUserId,
        metadata: { action, role, targetEmail: target.email },
      },
    });

    // Alert Super Admin on role elevation to ADMIN or SUPER_ADMIN
    if (action === "CHANGE_ROLE" && (role === "ADMIN" || role === "SUPER_ADMIN")) {
      const { sendCriticalAdminAlert } = await import("@/lib/adminAlert");
      await sendCriticalAdminAlert({
        subject: `Admin Privilege Assigned to ${target.email}`,
        title: `Privilege Escalation: ${role}`,
        message: `${user.displayName} updated role of ${target.displayName} (${target.email}) to ${role}.`,
        details: {
          "User": `${target.displayName} (${target.email})`,
          "New Role": role,
          "Assigned By": `${user.displayName} (${user.email})`,
        },
      });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Admin user action error:", error);
    return NextResponse.json({ error: error?.message || "Failed to perform user action" }, { status: 500 });
  }
}
