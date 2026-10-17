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

    const products = await prisma.product.findMany({
      include: {
        seller: { select: { id: true, displayName: true, username: true, email: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN", "MODERATOR"])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { productId, action, data } = body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (action === "DELETE") {
      await prisma.product.delete({ where: { id: productId } });

      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          action: "PRODUCT_DELETE",
          targetType: "PRODUCT",
          targetId: productId,
          metadata: { title: product.title },
        },
      });

      return NextResponse.json({ success: true, message: "Product deleted successfully" });
    }

    if (action === "UPDATE_PRICE" && data?.price !== undefined) {
      const numPrice = Number(data.price);
      if (isNaN(numPrice) || numPrice < 0) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      }

      const updated = await prisma.product.update({
        where: { id: productId },
        data: { price: numPrice },
      });

      return NextResponse.json({ success: true, product: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin product management error:", err);
    return NextResponse.json({ error: err.message || "Failed to update product" }, { status: 500 });
  }
}
