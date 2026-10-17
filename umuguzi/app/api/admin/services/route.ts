import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN", "MODERATOR"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const services = await prisma.service.findMany({
      include: {
        provider: { select: { id: true, displayName: true, username: true, email: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ services });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN", "MODERATOR"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { serviceId, action, data } = body;

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (action === "DELETE") {
      await prisma.service.delete({ where: { id: serviceId } });

      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          action: "SERVICE_DELETE",
          targetType: "SERVICE",
          targetId: serviceId,
          metadata: { title: service.title },
        },
      });

      return NextResponse.json({ success: true, message: "Service deleted successfully" });
    }

    if (action === "TOGGLE_STATUS") {
      const newStatus = service.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
      const updated = await prisma.service.update({
        where: { id: serviceId },
        data: { status: newStatus },
      });

      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          action: "SERVICE_STATUS_CHANGE",
          targetType: "SERVICE",
          targetId: serviceId,
          metadata: { oldStatus: service.status, newStatus },
        },
      });

      return NextResponse.json({ success: true, service: updated });
    }

    if (action === "UPDATE_PRICE" && data?.price !== undefined) {
      const numPrice = Number(data.price);
      if (isNaN(numPrice) || numPrice < 0) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      }

      const updated = await prisma.service.update({
        where: { id: serviceId },
        data: { price: numPrice },
      });

      return NextResponse.json({ success: true, service: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin service management error:", err);
    return NextResponse.json({ error: err.message || "Failed to update service" }, { status: 500 });
  }
}
