import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const status: any = {
    databaseConnected: false,
    databaseUrlSet: !!process.env.DATABASE_URL,
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Test basic raw query
    await prisma.$queryRaw`SELECT 1`;
    status.databaseConnected = true;

    // 2. Check if tables exist
    try {
      const userCount = await prisma.user.count();
      status.tablesExist = true;
      status.userCount = userCount;

      const settingsCount = await prisma.siteSetting.count();
      status.settingsCount = settingsCount;

      status.message = "Database is connected and tables are synchronized successfully!";
    } catch (tableErr: any) {
      status.tablesExist = false;
      status.tableError = tableErr.message;
      status.message = "Database is reachable, but tables are not yet created. The build script will run prisma db push automatically.";
    }

    return NextResponse.json(status);
  } catch (dbErr: any) {
    status.databaseConnected = false;
    status.error = dbErr.message;
    status.message = "Could not connect to PostgreSQL. Please check your DATABASE_URL in Vercel environment variables.";
    return NextResponse.json(status, { status: 500 });
  }
}
