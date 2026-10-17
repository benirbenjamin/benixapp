import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { displayName, bio, phone, country, city, website, avatar, socials, twoFactorEnabled } = body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: displayName ? displayName.trim() : user.displayName,
        bio: bio !== undefined ? bio.trim() : undefined,
        phone: phone !== undefined ? phone.trim() : undefined,
        country: country || "Rwanda",
        city: city || "Kigali",
        website: website !== undefined ? website.trim() : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
        socials: socials || undefined,
        twoFactorEnabled: typeof twoFactorEnabled === "boolean" ? twoFactorEnabled : undefined,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
