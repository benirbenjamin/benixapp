import { NextResponse } from "next/server";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { getDriveAccessToken } from "@/lib/googleDrive";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { clientId, clientSecret, refreshToken, name = "Google Drive Account" } = body;

    if (!clientId || !refreshToken) {
      return NextResponse.json({ error: "Client ID and Refresh Token are required." }, { status: 400 });
    }

    try {
      const accessToken = await getDriveAccessToken({
        id: "test",
        name,
        clientId,
        clientSecret: clientSecret || "",
        refreshToken,
      });

      // Quick test call to Google Drive About API to verify token works
      const aboutRes = await fetch("https://www.googleapis.com/drive/v3/about?fields=user,storageQuota", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const aboutData = await aboutRes.json();

      let storageInfo: any = null;
      if (aboutData.storageQuota) {
        const limit = Number(aboutData.storageQuota.limit) || 0;
        const usage = Number(aboutData.storageQuota.usage) || 0;
        storageInfo = {
          limitBytes: limit,
          usageBytes: usage,
          limitGB: limit > 0 ? (limit / (1024 * 1024 * 1024)).toFixed(1) : "Unlimited",
          usageGB: (usage / (1024 * 1024 * 1024)).toFixed(2),
          email: aboutData.user?.emailAddress || "Authorized User",
        };
      }

      return NextResponse.json({
        success: true,
        message: `Successfully connected to Google Drive account!`,
        storageInfo,
      });
    } catch (authErr: any) {
      return NextResponse.json({
        success: false,
        error: authErr.message || "Failed to exchange refresh token with Google OAuth",
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Test failed" }, { status: 500 });
  }
}
