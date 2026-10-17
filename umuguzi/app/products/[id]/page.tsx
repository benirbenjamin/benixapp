import React from "react";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductDetailClient from "./ProductDetailClient";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        seller: {
          select: { id: true, displayName: true, username: true, avatar: true },
        },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!product) {
      notFound();
    }

    let isPurchased = false;
    if (user) {
      const entitlement = await prisma.entitlement.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId: product.id,
          },
        },
      });
      if (entitlement) isPurchased = true;
    }

    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProductDetailClient product={product} isPurchased={isPurchased} />
        </main>
        <Footer />
      </div>
    );
  } catch (error) {
    console.error("Product detail page error:", error);
    notFound();
  }
}
