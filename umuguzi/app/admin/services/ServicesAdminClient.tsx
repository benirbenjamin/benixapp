"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Search,
  Trash2,
  ExternalLink,
  Power,
  Star,
  MapPin,
  CheckCircle2,
  DollarSign,
  Plus,
} from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";

export default function ServicesAdminClient({ initialServices }: { initialServices: any[] }) {
  const [services, setServices] = useState<any[]>(initialServices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleAction = async (serviceId: string, action: string, data?: any) => {
    if (action === "DELETE" && !confirm("Are you sure you want to permanently delete this service?")) {
      return;
    }

    setUpdatingId(serviceId);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, action, data }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Action failed");

      if (action === "DELETE") {
        setServices(services.filter((s) => s.id !== serviceId));
        alert("Service removed permanently.");
      } else if (action === "TOGGLE_STATUS" && resData.service) {
        setServices(services.map((s) => (s.id === serviceId ? { ...s, status: resData.service.status } : s)));
      }
    } catch (err: any) {
      alert(err.message || "Failed to update service");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = services.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.provider?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      s.provider?.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.category?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Services Catalog Governance</h1>
          <p className="text-xs text-slate-500">
            Control professional services in Rwanda, remove spam or dummy listings, manage pricing and active statuses.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services, provider..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <Link
            href="/services"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-brand text-white font-bold text-xs transition-colors shrink-0 shadow-2xs flex items-center gap-1.5"
          >
            <span>Live Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["ALL", "ACTIVE", "PAUSED", "INACTIVE"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              statusFilter === st
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {st} ({services.filter((s) => (st === "ALL" ? true : s.status === st)).length})
          </button>
        ))}
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/services/${s.id}`} target="_blank" className="group block max-w-xs">
                      <p className="font-bold text-slate-900 group-hover:text-brand transition-colors truncate">
                        {s.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {s.category?.name || "Professional"} &bull; {s.location || "Rwanda"}
                      </span>
                    </Link>
                  </td>

                  <td className="py-3 px-4">
                    <Link href={`/admin/users/${s.provider?.id}`} className="hover:underline">
                      <p className="font-bold text-slate-800">{s.provider?.displayName || "Provider"}</p>
                      <p className="text-[11px] text-slate-400">{s.provider?.email}</p>
                    </Link>
                  </td>

                  <td className="py-3 px-4 font-black text-slate-900">{formatCurrency(s.price)}</td>

                  <td className="py-3 px-4 font-semibold text-amber-600">
                    ⭐ {s.rating.toFixed(1)} <span className="text-slate-400 font-normal">({s.reviewCount || 0})</span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-800"
                          : s.status === "PAUSED"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-400">{timeAgo(s.createdAt)}</td>

                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <Link
                      href={`/services/${s.id}`}
                      target="_blank"
                      className="inline-block p-1.5 text-slate-500 hover:text-brand hover:bg-slate-100 rounded-lg transition-colors"
                      title="Preview live service"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => handleAction(s.id, "TOGGLE_STATUS")}
                      disabled={updatingId === s.id}
                      className={`p-1.5 rounded-lg transition-colors ${
                        s.status === "ACTIVE"
                          ? "text-amber-600 hover:bg-amber-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                      title={s.status === "ACTIVE" ? "Pause Service" : "Activate Service"}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleAction(s.id, "DELETE")}
                      disabled={updatingId === s.id}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Permanently delete service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No services found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
