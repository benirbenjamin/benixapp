"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Eye,
  Clock,
  Video,
  Briefcase,
  Store,
  Wallet,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Ban,
  Share2,
  Calendar,
  Mail,
  Smartphone,
  MapPin,
  Sparkles,
} from "lucide-react";
import { formatCompactNumber, formatCurrency, timeAgo } from "@/lib/utils";

interface UserDetailProps {
  user: any;
  analytics: {
    totalViews: number;
    totalWatchHours: number;
    subscribersCount: number;
    referralsCount: number;
  };
}

export default function UserDetailClient({ user: initialUser, analytics }: UserDetailProps) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState<"overview" | "videos" | "services" | "products" | "wallet">("overview");
  const [updating, setUpdating] = useState(false);
  const [videos, setVideos] = useState<any[]>(initialUser.videos || []);
  const [services, setServices] = useState<any[]>(initialUser.services || []);
  const [products, setProducts] = useState<any[]>(initialUser.products || []);

  const isSuperAdminEmail = user.email.toLowerCase() === "benirabok@gmail.com";

  const handleUserAction = async (action: string, role?: string) => {
    if (isSuperAdminEmail && (action === "DELETE" || action === "BAN")) {
      alert("The primary Super Admin (benirabok@gmail.com) is permanently protected.");
      return;
    }

    if (action === "DELETE" && !confirm(`Permanently delete account for ${user.displayName}? This cannot be undone.`)) {
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: user.id, action, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      if (action === "DELETE") {
        alert("User account successfully deleted.");
        router.push("/admin/users");
      } else if (data.user) {
        setUser({ ...user, ...data.user });
        alert("User updated successfully.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update user.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteItem = async (type: "video" | "service" | "product", itemId: string, itemTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${itemTitle}"?`)) return;

    try {
      const endpoint =
        type === "video" ? "/api/admin/videos" : type === "service" ? "/api/admin/services" : "/api/admin/products";

      const payload =
        type === "video"
          ? { videoId: itemId, action: "DELETE" }
          : type === "service"
          ? { serviceId: itemId, action: "DELETE" }
          : { productId: itemId, action: "DELETE" };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (type === "video") setVideos(videos.filter((v) => v.id !== itemId));
        if (type === "service") setServices(services.filter((s) => s.id !== itemId));
        if (type === "product") setProducts(products.filter((p) => p.id !== itemId));
        alert(`${type.toUpperCase()} removed successfully.`);
      } else {
        const d = await res.json();
        alert(d.error || `Failed to delete ${type}`);
      }
    } catch {
      alert(`Error deleting ${type}`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Back to Users list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">{user.displayName}</h1>
              {user.isVerified && <CheckCircle2 className="w-4 h-4 text-brand" />}
              {isSuperAdminEmail && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                  Protected Super Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              @{user.username} &bull; {user.email} &bull; Joined {timeAgo(user.createdAt)}
            </p>
          </div>
        </div>

        {/* Quick Action Governance Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Change Role Selector */}
          <select
            value={user.role}
            onChange={(e) => handleUserAction("CHANGE_ROLE", e.target.value)}
            disabled={updating}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold shadow-2xs"
          >
            <option value="USER">USER</option>
            <option value="CREATOR">CREATOR</option>
            <option value="PROVIDER">PROVIDER</option>
            <option value="AFFILIATE">AFFILIATE</option>
            <option value="MODERATOR">MODERATOR</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>

          {/* Verification Badge Toggle */}
          <button
            onClick={() => handleUserAction(user.isVerified ? "UNVERIFY" : "VERIFY")}
            disabled={updating}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs"
          >
            {user.isVerified ? "Remove Badge" : "Grant Verified Badge"}
          </button>

          {/* Suspend Toggle */}
          {!isSuperAdminEmail && (
            <button
              onClick={() => handleUserAction(user.isBanned ? "UNBAN" : "BAN")}
              disabled={updating}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-colors ${
                user.isBanned
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200"
              }`}
            >
              {user.isBanned ? "Lift Ban" : "Suspend Account"}
            </button>
          )}

          {/* Delete User */}
          {!isSuperAdminEmail && (
            <button
              onClick={() => handleUserAction("DELETE")}
              disabled={updating}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete User</span>
            </button>
          )}
        </div>
      </div>

      {/* User Analytics KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Subscribers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Subscribers</span>
            <Users className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-black text-slate-900">{formatCompactNumber(analytics.subscribersCount)}</p>
          <span className="text-[10px] text-slate-400">Audience members</span>
        </div>

        {/* 2. Total Visitors / Views */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Views</span>
            <Eye className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-slate-900">{formatCompactNumber(analytics.totalViews)}</p>
          <span className="text-[10px] text-slate-400">Content impressions</span>
        </div>

        {/* 3. Total Watch Time */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Watch Time</span>
            <Clock className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-xl font-black text-slate-900">{analytics.totalWatchHours.toFixed(1)} hrs</p>
          <span className="text-[10px] text-slate-400">Total playback</span>
        </div>

        {/* 4. Uploaded Videos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Videos</span>
            <Video className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-black text-slate-900">{videos.length}</p>
          <span className="text-[10px] text-slate-400">Published catalog</span>
        </div>

        {/* 5. Services Listed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Services</span>
            <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-xl font-black text-slate-900">{services.length}</p>
          <span className="text-[10px] text-slate-400">Offered in Rwanda</span>
        </div>

        {/* 6. Digital Products */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Products</span>
            <Store className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="text-xl font-black text-slate-900">{products.length}</p>
          <span className="text-[10px] text-slate-400">Marketplace assets</span>
        </div>
      </div>

      {/* Navigation Tabs for User Modules */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "overview"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Profile &amp; Wallet
        </button>
        <button
          onClick={() => setActiveTab("videos")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "videos"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Videos ({videos.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "services"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Services ({services.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "products"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Products ({products.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("wallet")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "wallet"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Wallet &amp; Ledger</span>
        </button>
      </div>

      {/* Tab 1: Profile & Wallet Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2">
              Identity &amp; Channel Details
            </h3>
            <div className="flex items-center gap-4">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.displayName} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-brand text-white flex items-center justify-center font-black text-xl shadow-sm">
                  {user.displayName.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-base text-slate-900">{user.displayName}</p>
                <p className="text-xs text-slate-400">@{user.username}</p>
                <span className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                  {user.role}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {user.city || "Kigali"}, {user.country || "Rwanda"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Referral Code: <strong className="font-mono text-slate-900">{user.referralCode}</strong> ({analytics.referralsCount} active invites)</span>
              </div>
            </div>

            {user.channel && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mt-4 space-y-1">
                <p className="text-xs font-bold text-slate-800">Channel: {user.channel.name}</p>
                <p className="text-[11px] text-slate-500">
                  Handle: @{user.channel.handle} &bull; {user.channel.subscriberCount} subscribers &bull; {user.channel.totalViews} views
                </p>
                <Link
                  href={`/channel/${user.channel.handle}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:underline mt-1"
                >
                  <span>Visit Public Channel</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Wallet Balances Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2">
              Financial Status &amp; Wallet
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Available Balance</span>
                <p className="text-2xl font-black text-emerald-950 mt-1">
                  {formatCurrency(user.wallet?.availableBalance || 0)}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total Lifetime Earnings</span>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {formatCurrency(user.wallet?.totalEarnings || 0)}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Pending Balance:</span>
                <span className="font-bold text-slate-900">{formatCurrency(user.wallet?.pendingBalance || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Withdrawn:</span>
                <span className="font-bold text-slate-900">{formatCurrency(user.wallet?.totalWithdrawn || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Currency:</span>
                <span className="font-mono font-bold text-slate-900">{user.wallet?.currency || "RWF"}</span>
              </div>
            </div>

            <Link
              href="/admin/withdrawals"
              className="w-full py-2 bg-slate-900 hover:bg-brand text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Review User Payout Requests</span>
            </Link>
          </div>
        </div>
      )}

      {/* Tab 2: Uploaded Videos */}
      {activeTab === "videos" && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900">All Uploaded Videos ({videos.length})</h3>
            <span className="text-xs text-slate-400">Click preview to test real video playback</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Video</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {videos.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 aspect-video bg-slate-900 rounded-lg overflow-hidden shrink-0">
                          {v.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-white">No Thumb</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/video/${v.id}`} target="_blank" className="font-bold text-slate-900 hover:text-brand truncate block max-w-sm">
                            {v.title}
                          </Link>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">{v.accessType}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatCompactNumber(v.views || 0)}</td>
                    <td className="py-3 px-4 text-slate-500">{Math.floor((v.duration || 0) / 60)}m {(v.duration || 0) % 60}s</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        v.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{v.price > 0 ? formatCurrency(v.price) : "Free"}</td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        href={`/video/${v.id}`}
                        target="_blank"
                        className="inline-block p-1.5 text-slate-500 hover:text-brand hover:bg-slate-100 rounded-lg"
                        title="Watch video"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteItem("video", v.id, v.title)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {videos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      This user has not uploaded any videos yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Offered Services */}
      {activeTab === "services" && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900">Offered Services ({services.length})</h3>
            <span className="text-xs text-slate-400">Admin management of client-facing services</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <Link href={`/services/${s.id}`} target="_blank" className="font-bold text-slate-900 hover:text-brand block max-w-sm">
                        {s.title}
                      </Link>
                      <span className="text-[10px] text-slate-400">{s.category?.name || "Professional Service"}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(s.price)}</td>
                    <td className="py-3 px-4 font-semibold text-amber-600">⭐ {s.rating.toFixed(1)} ({s.reviewCount})</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{timeAgo(s.createdAt)}</td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        href={`/services/${s.id}`}
                        target="_blank"
                        className="inline-block p-1.5 text-slate-500 hover:text-brand hover:bg-slate-100 rounded-lg"
                        title="View live service"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteItem("service", s.id, s.title)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {services.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No services listed by this user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Digital Products */}
      {activeTab === "products" && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900">Digital Marketplace Products ({products.length})</h3>
            <span className="text-xs text-slate-400">Software, presets, ebooks and digital stems</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Sales</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <Link href={`/products/${p.id}`} target="_blank" className="font-bold text-slate-900 hover:text-brand block max-w-sm">
                        {p.title}
                      </Link>
                      <span className="text-[10px] text-slate-400">{p.fileSize || "Direct Access"}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(p.price)}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-700">{p.salesCount || 0} purchases</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {p.fileType || "ZIP"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        href={`/products/${p.id}`}
                        target="_blank"
                        className="inline-block p-1.5 text-slate-500 hover:text-brand hover:bg-slate-100 rounded-lg"
                        title="View live product"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteItem("product", p.id, p.title)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No digital products posted by this user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Wallet & Ledger Transactions */}
      {activeTab === "wallet" && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-sm text-slate-900">Wallet Transaction History</h3>
            <span className="text-xs font-bold text-emerald-600">
              Balance: {formatCurrency(user.wallet?.availableBalance || 0)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {user.wallet?.transactions && user.wallet.transactions.length > 0 ? (
                  user.wallet.transactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-400">{timeAgo(tx.createdAt)}</td>
                      <td className="py-3 px-4 font-bold uppercase text-[10px] text-slate-700">{tx.type}</td>
                      <td className={`py-3 px-4 font-black ${tx.amount > 0 ? "text-emerald-600" : "text-slate-900"}`}>
                        {tx.amount > 0 ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{tx.description || tx.referenceId || "Wallet activity"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No recorded wallet transactions for this user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
