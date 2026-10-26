import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, Plus, Star, MapPin, ExternalLink } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";

export default async function DashboardServicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard/services");

  const services = await prisma.service.findMany({
    where: { providerId: user.id },
    include: {
      category: { select: { name: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Service Listings</h1>
          <p className="text-xs text-slate-500">
            Offer your professional skills, manage bookings, and set package pricing.
          </p>
        </div>

        <Link
          href="/dashboard/services/create"
          className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Service
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {services.map((svc) => (
          <div key={svc.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-brand">
                  {svc.category?.name || "Service"}
                </span>
                <span className="text-xs font-bold text-emerald-600 uppercase">{svc.status}</span>
              </div>

              <h3 className="font-bold text-base text-slate-900">{svc.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{svc.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Price</span>
                <span className="text-sm font-black text-slate-900">{formatCurrency(svc.price)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{svc._count.bookings} bookings</span>
                <Link
                  href={`/services/${svc.id}`}
                  target="_blank"
                  className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {services.length === 0 && (
          <div className="col-span-2 p-16 text-center bg-white rounded-3xl border border-slate-200">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">You haven&apos;t listed any services yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Start offering photography, sound engineering, software development, or consulting to Rwandan clients.
            </p>
            <Link
              href="/dashboard/services/create"
              className="px-5 py-2.5 bg-brand text-white text-xs font-bold rounded-xl shadow-md"
            >
              List Your First Service
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
