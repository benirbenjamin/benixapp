"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Store,
  Search,
  Trash2,
  ExternalLink,
  Download,
  Star,
  FileText,
  DollarSign,
  Plus,
} from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils";

export default function ProductsAdminClient({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleAction = async (productId: string, action: string, data?: any) => {
    if (action === "DELETE" && !confirm("Are you sure you want to permanently delete this digital product?")) {
      return;
    }

    setUpdatingId(productId);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action, data }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Action failed");

      if (action === "DELETE") {
        setProducts(products.filter((p) => p.id !== productId));
        alert("Digital product removed from marketplace.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update product");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = products.filter((p) => {
    return (
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.seller?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      p.seller?.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Digital Marketplace Governance</h1>
          <p className="text-xs text-slate-500">
            Monitor and moderate digital downloads, presets, software, and audio packs sold on Umuguzipro.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, seller..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <Link
            href="/products/create"
            className="px-3.5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs transition-colors shrink-0 shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Seller</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Purchases</th>
                <th className="py-3.5 px-4">Asset Type</th>
                <th className="py-3.5 px-4">Listed</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/products/${p.id}`} target="_blank" className="group block max-w-xs">
                      <p className="font-bold text-slate-900 group-hover:text-brand transition-colors truncate">
                        {p.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {p.category?.name || "Digital File"} &bull; {p.fileSize || "Direct Access"}
                      </span>
                    </Link>
                  </td>

                  <td className="py-3 px-4">
                    <Link href={`/admin/users/${p.seller?.id}`} className="hover:underline">
                      <p className="font-bold text-slate-800">{p.seller?.displayName || "Seller"}</p>
                      <p className="text-[11px] text-slate-400">{p.seller?.email}</p>
                    </Link>
                  </td>

                  <td className="py-3 px-4 font-black text-slate-900">{formatCurrency(p.price)}</td>

                  <td className="py-3 px-4 font-bold text-emerald-700">
                    {p.salesCount || 0} sales
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {p.fileType || "ZIP"}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-400">{timeAgo(p.createdAt)}</td>

                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <Link
                      href={`/products/${p.id}`}
                      target="_blank"
                      className="inline-block p-1.5 text-slate-500 hover:text-brand hover:bg-slate-100 rounded-lg transition-colors"
                      title="Preview marketplace page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    {p.downloadUrl && (
                      <a
                        href={p.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Direct file download link"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      onClick={() => handleAction(p.id, "DELETE")}
                      disabled={updatingId === p.id}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Permanently delete digital product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No digital products found matching search.
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
