import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AffiliateClient from "./AffiliateClient";

export default async function DashboardAffiliatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard/affiliates");

  const [referrals, walletTransactions] = await Promise.all([
    prisma.user.findMany({
      where: { referredById: user.id },
      select: {
        id: true,
        displayName: true,
        username: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.walletTransaction.findMany({
      where: {
        wallet: { userId: user.id },
        type: "REFERRAL_COMMISSION",
      },
    }),
  ]);

  const totalEarnings = walletTransactions.reduce((s, tx) => s + tx.netAmount, 0);

  return (
    <AffiliateClient
      referralCode={user.referralCode}
      referrals={referrals}
      totalEarnings={totalEarnings}
    />
  );
}
