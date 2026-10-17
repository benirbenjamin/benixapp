"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, X, Star, Trash2, ExternalLink, ShieldAlert, Search } from "lucide-react";
import { timeAgo, formatCompactNumber } from "@/lib/utils";

export default function VideosModerationClient({ initialVideos }: { initialVideos: any[] }) {
  const [videos, setVideos] = useState(initialVideos);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleAction = async (videoId: string, action: string) => {
    if (action === "DELETE" && !confirm("Permanently delete this video?")) return;

    setUpdatingId(videoId);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, action }),
      });

      if (res.ok) {
        if (action === "DELETE") {
          setVideos(videos.filter((v) => v.id !== videoId));
        } else {
          setVideos(
            videos.map((v) => {
              if (v.id === videoId) {
                if (action === "APPROVE") return { ...v, status: "APPROVED" };
                if (action === "REJECT") return { ...v, status: "REJECTED" };
                if (action === "FEATURE") return { ...v, isFeatured: true };
                if (action === "UNFEATURE") return { ...v, isFeatured: false };
              }
              return v;
            })
          );
        }
      }
    } catch {
      alert("Failed to update video status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = videos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.channel?.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.user?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      v.user?.username?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "ALL" || v.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Video Content Moderation</h1>
          <p className="text-xs text-slate-500">
            Review uploaded videos, feature top Rwandan productions, or remove policy-violating uploads.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, channel, creator..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand shadow-2xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {["ALL", "APPROVED", "PENDING", "REJECTED"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filter === s
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Video</th>
                <th className="py-3.5 px-4">Creator / Channel</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Featured</th>
                <th className="py-3.5 px-4">Uploaded</th>
                <th className="py-3.5 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-20 aspect-video bg-slate-900 rounded-lg overflow-hidden shrink-0">
                        {v.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-[9px]">
                            No Thumb
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/video/${v.id}`} target="_blank" className="font-bold text-slate-900 hover:text-brand transition-colors truncate max-w-xs block">
                          {v.title}
                        </Link>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {v.accessType}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {v.userId ? (
                      <Link href={`/admin/users/${v.userId}`} className="hover:underline">
                        <p className="font-bold text-slate-800">{v.channel?.name || "Direct"}</p>
                        <p className="text-[11px] text-slate-400">@{v.user?.username || "creator"}</p>
                      </Link>
                    ) : (
                      <>
                        <p className="font-bold text-slate-800">{v.channel?.name || "Direct"}</p>
                        <p className="text-[11px] text-slate-400">@{v.user?.username || "creator"}</p>
                      </>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        v.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : v.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleAction(v.id, v.isFeatured ? "UNFEATURE" : "FEATURE")}
                      disabled={updatingId === v.id}
                      className={`p-1.5 rounded-lg transition-colors ${
                        v.isFeatured ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:text-slate-600"
                      }`}
                      title={v.isFeatured ? "Unfeature" : "Feature on Homepage"}
                    >
                      <Star className={`w-4 h-4 ${v.isFeatured ? "fill-current" : ""}`} />
                    </button>
                  </td>

                  <td className="py-3 px-4 text-slate-400">{timeAgo(v.createdAt)}</td>

                  <td className="py-3 px-4 text-right space-x-1.5">
                    <Link
                      href={`/video/${v.id}`}
                      target="_blank"
                      className="inline-block p-1.5 text-slate-500 hover:text-brand hover:bg-slate-100 rounded-lg"
                      title="Preview video"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    {v.status !== "APPROVED" && (
                      <button
                        onClick={() => handleAction(v.id, "APPROVE")}
                        disabled={updatingId === v.id}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        title="Approve video"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}

                    {v.status !== "REJECTED" && (
                      <button
                        onClick={() => handleAction(v.id, "REJECT")}
                        disabled={updatingId === v.id}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                        title="Reject video"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleAction(v.id, "DELETE")}
                      disabled={updatingId === v.id}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Delete video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No videos found matching this filter.
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
