import React from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import prisma from "@/lib/prisma";
import { HelpCircle, Plus, MapPin, Calendar, ArrowRight, DollarSign, Briefcase } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ServiceRequestsPage() {
  let requests: any[] = [];
  try {
    requests = await prisma.serviceRequest.findMany({
      where: { status: "OPEN" },
      include: {
        customer: { select: { displayName: true, username: true, avatar: true } },
        category: { select: { name: true, slug: true } },
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.warn("Could not load service requests from DB:", err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              &quot;I Need This Service&quot; Requests
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
              Clients in Kigali and across Rwanda looking for videographers, graphic designers, sound engineers, software developers, and event services.
            </p>
          </div>

          <Link
            href="/service-requests/create"
            className="px-5 py-3 bg-brand hover:bg-brand-hover text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Post Your Request
          </Link>
        </div>

        {/* Main Section Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <Link
            href="/services"
            className="flex-1 py-2.5 px-4 rounded-xl text-center text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2 transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            <span>Offered Services</span>
          </Link>
          <Link
            href="/service-requests"
            className="flex-1 py-2.5 px-4 rounded-xl text-center text-xs sm:text-sm font-extrabold bg-amber-500 text-slate-950 shadow-sm flex items-center justify-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Service Needs / Client Requests ({requests.length})</span>
          </Link>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {req.category && (
                    <span className="px-2.5 py-0.5 bg-blue-50 text-brand text-[11px] font-bold rounded-full">
                      {req.category.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3" />
                    {req.location}
                  </span>
                  <span className="text-[11px] text-slate-400">&bull;</span>
                  <span className="text-[11px] text-slate-400">
                    Posted {timeAgo(req.createdAt)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{req.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{req.description}</p>

                <div className="flex items-center gap-2 pt-1">
                  <div className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-[10px]">
                    {req.customer.displayName.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    Posted by {req.customer.displayName}
                  </span>
                </div>
              </div>

              {/* Right: Budget & Apply Action */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Budget</span>
                  <span className="text-base font-black text-slate-900">
                    {req.budget ? formatCurrency(req.budget) : "Negotiable"}
                  </span>
                </div>

                <Link
                  href={`/services`}
                  className="px-4 py-2 bg-slate-900 hover:bg-brand text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Send Proposal
                </Link>
              </div>
            </div>
          ))}

          {requests.length === 0 && (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
              <p className="text-sm font-semibold text-slate-600">No open requests at the moment.</p>
              <Link
                href="/service-requests/create"
                className="mt-3 inline-block px-4 py-2 bg-brand text-white text-xs font-semibold rounded-xl"
              >
                Post the First Request
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
