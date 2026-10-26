import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCircle2, ArrowRight } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/notifications");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand" />
            <h1 className="text-2xl font-black text-slate-900">Notifications</h1>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                !n.isRead ? "bg-blue-50/40" : "hover:bg-slate-50"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {n.type}
                  </span>
                  <span className="text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{n.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>

              {n.link && (
                <Link
                  href={n.link}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-brand hover:text-white text-slate-700 text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="p-16 text-center text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No notifications yet.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
