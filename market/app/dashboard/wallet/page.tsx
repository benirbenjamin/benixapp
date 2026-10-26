import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import WalletClient from "./WalletClient";

export default async function DashboardWalletPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard/wallet");

  let wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: user.id,
        availableBalance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        totalWithdrawn: 0,
        currency: "RWF",
      },
    });
  }

  const [transactions, withdrawals] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <WalletClient
      initialWallet={wallet}
      initialTransactions={transactions}
      initialWithdrawals={withdrawals}
    />
  );
}
