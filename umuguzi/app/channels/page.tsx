import React from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import prisma from "@/lib/prisma";
import { Users, CheckCircle2, ArrowRight } from "lucide-react";
import { formatCompactNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ChannelsDirectoryPage() {
  let channels: any[] = [];
  try {
    channels = await prisma.channel.findMany({
      include: {
        _count: { select: { videos: true } },
      },
      orderBy: { subscriberCount: "desc" },
      take: 30,
    });
  } catch (err) {
    console.warn("Could not load channels from DB:", err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
          <Users className="w-6 h-6 text-brand" />
          <div>
            <h1 className="text-2xl font-black text-slate-900">Creator Channels</h1>
            <p className="text-xs text-slate-500">
              Discover top creators, producers, artists, and media houses in Rwanda and globally
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((chan) => (
            <div
              key={chan.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center text-center hover:border-brand hover:shadow-lg transition-all"
            >
              <Link href={`/channel/${chan.handle}`} className="relative mb-3">
                {chan.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={chan.avatar}
                    alt={chan.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-brand text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                    {chan.name.charAt(0)}
                  </div>
                )}
              </Link>

              <Link href={`/channel/${chan.handle}`} className="flex items-center gap-1.5 font-bold text-base text-slate-900 hover:text-brand">
                <span>{chan.name}</span>
                {chan.isVerified && <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />}
              </Link>
              <p className="text-xs text-slate-400 mt-0.5">@{chan.handle}</p>

              <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                {chan.description || "Content creator on Umuguzipro."}
              </p>

              <div className="flex items-center justify-center gap-4 text-xs text-slate-500 my-4 py-2 px-4 bg-slate-50 rounded-xl w-full">
                <div>
                  <span className="font-bold text-slate-900 block">{formatCompactNumber(chan.subscriberCount)}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Subscribers</span>
                </div>
                <div className="w-[1px] h-6 bg-slate-200" />
                <div>
                  <span className="font-bold text-slate-900 block">{chan._count.videos}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Videos</span>
                </div>
              </div>

              <Link
                href={`/channel/${chan.handle}`}
                className="w-full py-2 bg-slate-900 hover:bg-brand text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                Visit Channel <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
