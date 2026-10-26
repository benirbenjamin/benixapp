"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MessageSquare, Heart, Share2, Send, Sparkles } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { timeAgo } from "@/lib/utils";

export default function PostsClient({ initialPosts }: { initialPosts: any[] }) {
  const { user } = useApp();
  const [posts, setPosts] = useState(initialPosts);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/login?redirect=/posts";
      return;
    }
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json();
      if (data.success && data.post) {
        setPosts([data.post, ...posts]);
        setContent("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Create Post Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold text-sm shrink-0">
            {user?.displayName?.charAt(0) || "U"}
          </div>
          <form onSubmit={handleCreatePost} className="flex-1 space-y-3">
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                user
                  ? "Share an update, creative inspiration, or announcement..."
                  : "Sign in to post an update to the community"
              }
              disabled={!user || loading}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-slate-50 focus:bg-white transition-all"
            />
            {user ? (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="px-5 py-2 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {loading ? "Publishing..." : "Post Update"}
                </button>
              </div>
            ) : (
              <div className="flex justify-end">
                <Link
                  href="/login?redirect=/posts"
                  className="px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-xl"
                >
                  Sign in to post
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-sm">
                  {post.user.displayName.charAt(0)}
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900">{post.user.displayName}</span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>@{post.user.username}</span>
                    <span>&bull;</span>
                    <span>{timeAgo(post.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
              {post.content}
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500 font-semibold">
              <button className="flex items-center gap-1.5 hover:text-red-600 transition-colors">
                <Heart className="w-4 h-4" />
                <span>{post.likes || 0} Likes</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-brand transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span>{post.comments?.length || 0} Comments</span>
              </button>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No community posts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
