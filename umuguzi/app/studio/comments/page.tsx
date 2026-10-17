import React from "react";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, ExternalLink } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default async function StudioCommentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/studio/comments");

  const comments = await prisma.comment.findMany({
    where: {
      video: { userId: user.id },
    },
    include: {
      user: { select: { displayName: true, username: true, avatar: true } },
      video: { select: { id: true, title: true, thumbnailUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Channel Comments</h1>
        <p className="text-xs text-slate-500">
          Viewer feedback and discussions across your published video catalog.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-slate-50 transition-colors">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shrink-0">
                {comment.user.displayName.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">{comment.user.displayName}</span>
                  <span className="text-[11px] text-slate-400">@{comment.user.username}</span>
                  <span className="text-[11px] text-slate-400">&bull;</span>
                  <span className="text-[11px] text-slate-400">{timeAgo(comment.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{comment.content}</p>
              </div>
            </div>

            {comment.video && (
              <Link
                href={`/video/${comment.video.id}`}
                target="_blank"
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 shrink-0 text-xs font-semibold text-slate-700 max-w-xs truncate"
              >
                <span className="truncate">{comment.video.title}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </Link>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <div className="p-16 text-center text-slate-500">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">No comments on your videos yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
