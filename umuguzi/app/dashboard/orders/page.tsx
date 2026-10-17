import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, ShoppingBag, Download, Calendar, ExternalLink } from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";

export default async function DashboardOrdersPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard/orders");

  const activeTab = searchParams.tab || "bookings";

  const [bookings, orders] = await Promise.all([
    prisma.serviceBooking.findMany({
      where: { customerId: user.id },
      include: {
        service: { select: { id: true, title: true } },
        provider: { select: { id: true, displayName: true, username: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { buyerId: user.id },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Bookings &amp; Orders</h1>
          <p className="text-xs text-slate-500">
            View your service appointments and re-download your digital product licenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/orders?tab=bookings"
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "bookings"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Service Appointments ({bookings.length})
          </Link>
          <Link
            href="/dashboard/orders?tab=products"
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === "products"
                ? "bg-brand text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Digital Downloads ({orders.length})
          </Link>
        </div>
      </div>

      {activeTab === "bookings" ? (
        <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
          {bookings.map((b) => (
            <div key={b.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      b.status === "CONFIRMED"
                        ? "bg-emerald-100 text-emerald-800"
                        : b.status === "COMPLETED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {b.status}
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Appointment: {new Date(b.bookingDate).toLocaleString()}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900">{b.service.title}</h3>
                <p className="text-xs text-slate-600">
                  Provider: <strong>{b.provider.displayName}</strong> {b.provider.phone && `(${b.provider.phone})`}
                </p>
                {b.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    Notes: {b.notes}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className="text-base font-black text-slate-900 block">{formatCurrency(b.totalAmount)}</span>
                <span className="text-[11px] text-slate-400 block">{b.paymentMethod}</span>
              </div>
            </div>
          ))}

          {bookings.length === 0 && (
            <div className="p-16 text-center text-slate-400">
              <Briefcase className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No service bookings found.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
          {orders.map((ord) => (
            <div key={ord.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 inline-block">
                  {ord.status}
                </span>
                <h3 className="font-bold text-sm text-slate-900">
                  {ord.items[0]?.product?.title || "Digital Content Package"}
                </h3>
                <p className="text-xs text-slate-400">Purchased {timeAgo(ord.createdAt)}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-base font-black text-slate-900 block">{formatCurrency(ord.totalAmount)}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{ord.paymentMethod}</span>
                </div>

                {ord.items[0]?.product?.downloadUrl && (
                  <a
                    href={ord.items[0].product.downloadUrl}
                    download
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                )}
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="p-16 text-center text-slate-400">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No digital product orders found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
