import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export default async function DashboardProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard/profile");

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  return <ProfileClient profile={fullUser} />;
}
