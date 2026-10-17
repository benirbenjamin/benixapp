import React from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { HelpCircle, Plus, MessageSquare } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await getCurrentUser();

  const tickets = user
    ? await prisma.supportTicket.findMany({
        where: { userId: user.id },
        include: { replies: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Support &amp; Help Desk</h1>
            <p className="text-xs text-slate-500 max-w-lg">
              Have questions about payouts, video monetization, or bookings? Our team is available 24/7.
            </p>
          </div>

          <Link
            href={user ? "/support/create" : "/login?redirect=/support/create"}
            className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Open New Ticket
          </Link>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
          {tickets.map((t) => (
            <div key={t.id} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      t.status === "OPEN"
                        ? "bg-blue-100 text-blue-800"
                        : t.status === "ANSWERED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {t.status}
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs text-slate-500">{t.category}</span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs text-slate-400">{timeAgo(t.createdAt)}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{t.subject}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">
                  {t.replies[0]?.message || "No message."}
                </p>
              </div>

              <span className="text-xs font-semibold text-slate-400 shrink-0">
                {t.replies.length} replies
              </span>
            </div>
          ))}

          {tickets.length === 0 && (
            <div className="p-16 text-center text-slate-400">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No support tickets opened.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
