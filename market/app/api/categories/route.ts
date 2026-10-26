import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "VIDEO" | "SERVICE" | "PRODUCT" | null;

    const categories = await prisma.category.findMany({
      where: type ? { type } : {},
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
