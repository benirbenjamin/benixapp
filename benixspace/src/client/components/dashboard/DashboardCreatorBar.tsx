import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Camera,
  Film,
  Music,
  ShoppingBag,
  Megaphone,
  Wallet,
  TrendingUp,
  Award,
  Users
} from 'lucide-react';

interface Props {
  onOpenStoryModal: () => void;
  onOpenVideoModal: () => void;
  onOpenAdModal: () => void;
  wallet: any;
  userCampaignsCount: number;
}

export const DashboardCreatorBar: React.FC<Props> = ({
  onOpenStoryModal,
  onOpenVideoModal,
  onOpenAdModal,
  wallet,
  userCampaignsCount
}) => {
  return (
    <div className="space-y-4">
      {/* Creator & Publishing Center Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black uppercase text-indigo-400 tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Creator & Publishing Center
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Publish content, sell products or songs, and broadcast ads across all BenixSpace mini-apps.
            </p>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 self-start">
            Direct Creator Payouts 💸
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Post Ephemeral Story */}
          <button
            onClick={onOpenStoryModal}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-rose-500/50 hover:bg-rose-950/20 text-left transition group shadow flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">Post Story</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">24h Ephemeral Media</p>
            </div>
          </button>

          {/* 2. Post Video */}
          <button
            onClick={onOpenVideoModal}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-purple-500/50 hover:bg-purple-950/20 text-left transition group shadow flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">Post Video</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Stream & Monetize</p>
            </div>
          </button>

          {/* 3. Sell a Song / License */}
          <Link
            to="/voxify"
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-amber-500/50 hover:bg-amber-950/20 text-left transition group shadow flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">Sell a Song</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Master Song Licenses</p>
            </div>
          </Link>

          {/* 4. Sell Item / Service on Marketplace */}
          <Link
            to="/marketplace"
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-left transition group shadow flex flex-col justify-between"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">Sell on Market</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Products & Services</p>
            </div>
          </Link>

          {/* 5. Run Targeted Ads */}
          <button
            onClick={onOpenAdModal}
            className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-blue-500/50 hover:bg-blue-950/20 text-left transition group shadow flex flex-col justify-between col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">Broadcast Ads</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">CPM & CPC Campaigns</p>
            </div>
          </button>
        </div>
      </div>

      {/* Executive Financial & Performance Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[10px] font-bold uppercase">Real Balance</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white">
            {Number(wallet?.balance || 0).toLocaleString()} <span className="text-xs text-emerald-400 font-normal">RWF</span>
          </div>
          <p className="text-[10px] text-emerald-400 font-medium">Ready for instant spend</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[10px] font-bold uppercase">Lifetime Earnings</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400">
            {Number(wallet?.total_earnings || 0).toLocaleString()} <span className="text-xs text-slate-400 font-normal">RWF</span>
          </div>
          <p className="text-[10px] text-slate-500">Gross earned across mini-apps</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[10px] font-bold uppercase">Active Campaigns</span>
            <Megaphone className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-400">{userCampaignsCount}</div>
          <p className="text-[10px] text-slate-500">Targeted ad broadcasts</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="text-[10px] font-bold uppercase">Affiliate Network</span>
            <Users className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400">{Number(wallet?.referral_count || 0)}</div>
          <p className="text-[10px] text-slate-500">Invited verified members</p>
        </div>
      </div>
    </div>
  );
};
