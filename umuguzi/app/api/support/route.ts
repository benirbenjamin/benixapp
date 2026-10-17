import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      include: {
        replies: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { subject, category = "General", priority = "MEDIUM", message } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        subject: subject.trim(),
        category,
        priority,
        status: "OPEN",
        replies: {
          create: {
            userId: user.id,
            message: message.trim(),
            isAdmin: false,
          },
        },
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "Failed to submit ticket" }, { status: 500 });
  }
}
