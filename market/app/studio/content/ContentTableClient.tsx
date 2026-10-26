"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trash2, ExternalLink, Eye, ThumbsUp, MessageSquare, AlertCircle } from "lucide-react";
import { formatCompactNumber, timeAgo } from "@/lib/utils";

export default function ContentTableClient({ initialVideos }: { initialVideos: any[] }) {
  const [videos, setVideos] = useState(initialVideos);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this video?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setVideos(videos.filter((v) => v.id !== id));
      } else {
        alert("Failed to delete video");
      }
    } catch {
      alert("Error deleting video");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Video</th>
              <th className="py-3.5 px-4">Visibility</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Views</th>
              <th className="py-3.5 px-4">Likes</th>
              <th className="py-3.5 px-4">Comments</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {videos.map((vid) => (
              <tr key={vid.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 flex items-center gap-3">
                  <div className="w-24 aspect-video bg-slate-900 rounded-xl overflow-hidden shrink-0">
                    {vid.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-[10px]">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate max-w-xs">{vid.title}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs">{vid.description || "No description"}</p>
                  </div>
                </td>

                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      vid.accessType === "PUBLIC"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {vid.accessType}
                  </span>
                </td>

                <td className="py-3 px-4 text-slate-500">{timeAgo(vid.createdAt)}</td>

                <td className="py-3 px-4 font-semibold text-slate-800">
                  {formatCompactNumber(vid.views)}
                </td>

                <td className="py-3 px-4 font-semibold text-slate-800">
                  {formatCompactNumber(vid.likes)}
                </td>

                <td className="py-3 px-4 font-semibold text-slate-800">
                  {vid.comments?.length || 0}
                </td>

                <td className="py-3 px-4 text-right space-x-2">
                  <Link
                    href={`/video/${vid.id}`}
                    target="_blank"
                    className="inline-block p-1.5 rounded-lg text-slate-500 hover:text-brand hover:bg-slate-100"
                    title="View public video"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(vid.id)}
                    disabled={deletingId === vid.id}
                    className="inline-block p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                    title="Delete video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {videos.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No videos uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
