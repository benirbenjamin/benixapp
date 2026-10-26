import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, PENDING_2FA_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully." });
  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete(PENDING_2FA_COOKIE_NAME);
  return response;
}
