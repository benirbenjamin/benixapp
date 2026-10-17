import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const requests = await prisma.serviceRequest.findMany({
      where: { status: "OPEN" },
      include: {
        customer: {
          select: { id: true, displayName: true, username: true, avatar: true },
        },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, categoryId, budget, location } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const newRequest = await prisma.serviceRequest.create({
      data: {
        customerId: user.id,
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId || null,
        budget: budget ? Number(budget) : null,
        location: location || "Kigali, Rwanda",
        status: "OPEN",
      },
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error: any) {
    console.error("Create request error:", error);
    return NextResponse.json({ error: "Failed to post service request" }, { status: 500 });
  }
}
