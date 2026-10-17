import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to post digital products" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      price,
      categoryId,
      images = [],
      downloadUrl,
      fileType = "ZIP",
      fileSize = "50 MB",
    } = body;

    if (!title || !description || price === undefined || price === null) {
      return NextResponse.json({ error: "Title, description, and price are required." }, { status: 400 });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return NextResponse.json({ error: "Please enter a valid price in RWF." }, { status: 400 });
    }

    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = "product";
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    const product = await prisma.product.create({
      data: {
        sellerId: user.id,
        categoryId: categoryId || null,
        title: title.trim(),
        slug,
        description: description.trim(),
        price: numPrice,
        images: Array.isArray(images) && images.length > 0 ? images : ["https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800"],
        downloadUrl: downloadUrl?.trim() || null,
        fileType: fileType?.toUpperCase() || "ZIP",
        fileSize: fileSize || "Direct Access",
      },
      include: {
        seller: {
          select: { id: true, displayName: true, username: true, avatar: true },
        },
        category: true,
      },
    });

    // Alert Super Admin (benirabok@gmail.com) of new product listed on platform
    const { sendCriticalAdminAlert } = await import("@/lib/adminAlert");
    await sendCriticalAdminAlert({
      subject: `New Digital Product Listed: "${product.title}" (${numPrice} RWF)`,
      title: `🛍️ New Product for Sale: ${product.title}`,
      message: `${user.displayName} (@${user.username}) posted a new digital product "${product.title}" priced at ${numPrice} RWF.`,
      details: {
        "Product Title": product.title,
        "Seller": `${user.displayName} (${user.email})`,
        "Price": `${numPrice} RWF`,
        "File Type": product.fileType || "N/A",
      },
      actionLink: `/products`,
      actionText: "View in Marketplace",
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("Product creation error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create product" }, { status: 500 });
  }
}
