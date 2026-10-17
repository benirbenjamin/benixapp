import React from "react";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ServiceClient from "./ServiceClient";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  try {
    const service = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        provider: {
          select: { id: true, displayName: true, username: true, avatar: true, phone: true },
        },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!service) {
      notFound();
    }

    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ServiceClient service={service} />
        </main>
        <Footer />
      </div>
    );
  } catch (error) {
    console.error("Service detail page error:", error);
    notFound();
  }
}
