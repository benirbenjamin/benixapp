import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import ServicesAdminClient from "./ServicesAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN", "MODERATOR"])) {
    redirect("/login?redirect=/admin/services");
  }

  const services = await prisma.service.findMany({
    include: {
      provider: { select: { id: true, displayName: true, username: true, email: true, avatar: true } },
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return <ServicesAdminClient initialServices={services} />;
}
