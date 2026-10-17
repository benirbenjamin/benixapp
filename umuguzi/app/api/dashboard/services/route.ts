import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, categoryId, price, priceType = "FIXED", location, images } = body;

    if (!title || !description || !price) {
      return NextResponse.json({ error: "Title, description, and price are required" }, { status: 400 });
    }

    let slug = slugify(title);
    if (!slug) slug = "service";
    slug = `${slug}-${Date.now().toString().slice(-4)}`;

    const service = await prisma.service.create({
      data: {
        providerId: user.id,
        title: title.trim(),
        slug,
        description: description.trim(),
        categoryId: categoryId || null,
        price: Number(price),
        priceType,
        location: location || "Kigali, Rwanda",
        images: images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800"],
        status: "ACTIVE",
      },
    });

    // If user's role was USER, upgrade to PROVIDER if not already higher
    if (user.role === "USER") {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "PROVIDER" },
      });
    }

    return NextResponse.json({ success: true, service });
  } catch (error: any) {
    console.error("Create service error:", error);
    return NextResponse.json({ error: "Failed to create service listing" }, { status: 500 });
  }
}
