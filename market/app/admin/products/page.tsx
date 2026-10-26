import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProductsAdminClient from "./ProductsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN", "MODERATOR"])) {
    redirect("/login?redirect=/admin/products");
  }

  const products = await prisma.product.findMany({
    include: {
      seller: { select: { id: true, displayName: true, username: true, email: true, avatar: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return <ProductsAdminClient initialProducts={products} />;
}
