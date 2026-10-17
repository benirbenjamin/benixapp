import React from "react";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VideoCard from "@/components/video/VideoCard";
import prisma from "@/lib/prisma";
import { CheckCircle2, Eye, Users, Calendar, Video as VideoIcon } from "lucide-react";
import { formatCompactNumber, timeAgo } from "@/lib/utils";
import { VideoItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function ChannelPage({ params }: { params: { handle: string } }) {
  try {
    const channel = await prisma.channel.findUnique({
      where: { handle: params.handle },
      include: {
        videos: {
          where: { status: "APPROVED" },
          include: {
            channel: {
              select: { id: true, name: true, handle: true, avatar: true, subscriberCount: true, isVerified: true },
            },
            category: { select: { id: true, name: true, slug: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        posts: {
          orderBy: { createdAt: "desc" },
        },
        owner: {
          select: { displayName: true, username: true, createdAt: true },
        },
      },
    });

    if (!channel) {
      notFound();
    }

    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header />

        {/* Channel Banner */}
        <div className="relative w-full h-44 sm:h-64 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 overflow-hidden">
          {channel.banner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={channel.banner} alt={channel.name} className="w-full h-full object-cover" />
          )}
        </div>

        {/* Channel Header Bar */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                {channel.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={channel.avatar}
                    alt={channel.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow-xl -mt-16 sm:-mt-20 shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-brand text-white flex items-center justify-center font-black text-3xl border-4 border-white shadow-xl -mt-16 sm:-mt-20 shrink-0">
                    {channel.name.charAt(0)}
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    <h1 className="text-2xl font-black text-slate-900">{channel.name}</h1>
                    {channel.isVerified && <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />}
                  </div>

                  <p className="text-xs font-semibold text-slate-500">@{channel.handle}</p>

                  <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{formatCompactNumber(channel.subscriberCount)}</strong> subscribers
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <VideoIcon className="w-3.5 h-3.5 text-slate-400" />
                      <strong>{channel.videos.length}</strong> videos
                    </span>
                  </div>

                  {channel.description && (
                    <p className="text-xs text-slate-600 max-w-xl line-clamp-2 pt-1">
                      {channel.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Subscribe button */}
              <button className="px-6 py-2.5 bg-slate-900 hover:bg-brand text-white font-bold text-xs sm:text-sm rounded-full shadow-md transition-all">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Channel Video List */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-extrabold text-lg text-slate-900 tracking-tight">Channel Videos</h2>
              <span className="text-xs text-slate-500">{channel.videos.length} total uploads</span>
            </div>

            {channel.videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {channel.videos.map((vid) => (
                  <VideoCard key={vid.id} video={vid as unknown as VideoItem} />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                <VideoIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">No videos uploaded yet.</p>
                <p className="text-xs text-slate-400 mt-1">This creator hasn&apos;t published any videos yet.</p>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    );
  } catch (err) {
    notFound();
  }
}
