import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { redirect } from "next/navigation";
import WithdrawalsClient from "./WithdrawalsClient";

export default async function AdminWithdrawalsPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role, ["ADMIN", "SUPER_ADMIN", "FINANCE_ADMIN"])) {
    redirect("/login?redirect=/admin/withdrawals");
  }

  const withdrawals = await prisma.withdrawal.findMany({
    include: {
      user: { select: { displayName: true, username: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return <WithdrawalsClient initialWithdrawals={withdrawals} />;
}
