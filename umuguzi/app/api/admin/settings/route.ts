import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { updateSiteSettings, getSiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const updatedSettings = await updateSiteSettings(body);

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: "SETTINGS_UPDATED",
        targetType: "SETTINGS",
        metadata: body,
      },
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
