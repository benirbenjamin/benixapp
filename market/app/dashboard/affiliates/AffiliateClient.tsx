"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  Copy,
  Check,
  QrCode,
  Users,
  DollarSign,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import QRCode from "qrcode";
import { formatCurrency, timeAgo } from "@/lib/utils";

export default function AffiliateClient({
  referralCode,
  referrals,
  totalEarnings,
}: {
  referralCode: string;
  referrals: any[];
  totalEarnings: number;
}) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${referralCode}`
      : `https://umuguzi.pro/register?ref=${referralCode}`;

  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 200, margin: 2 }, (err, url) => {
      if (!err && url) setQrDataUrl(url);
    });
  }, [shareUrl]);

  const copyToClipboard = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Affiliate &amp; Referral Program</h1>
        <p className="text-xs text-slate-500">
          Invite creators, clients, and partners to Umuguzipro and earn passive commission on platform transactions.
        </p>
      </div>

      {/* Referral Link & QR Code Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Commission Rate: 10% on Platform Fees</span>
          </div>

          <h3 className="text-lg font-black text-slate-900">Your Unique Referral Link</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Share this link across social networks, WhatsApp groups, YouTube descriptions, or print the QR code on flyers.
          </p>

          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl max-w-lg">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent text-xs text-slate-700 flex-1 outline-none font-mono px-2"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="Referral QR Code" className="w-36 h-36 rounded-xl shadow-sm mb-2" />
          ) : (
            <div className="w-36 h-36 bg-slate-200 animate-pulse rounded-xl mb-2" />
          )}
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5" /> Scan to Join
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Referrals</span>
          <span className="text-3xl font-black text-slate-900 block">{referrals.length}</span>
          <span className="text-[11px] text-slate-400">Registered users</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Conversions</span>
          <span className="text-3xl font-black text-slate-900 block">{referrals.filter(r => r.isVerified).length}</span>
          <span className="text-[11px] text-emerald-600 font-semibold">Verified accounts</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Referral Earnings</span>
          <span className="text-3xl font-black text-emerald-600 block">{formatCurrency(totalEarnings)}</span>
          <span className="text-[11px] text-slate-400">Credited to wallet</span>
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900">Referred Members</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referrals.map((ref) => (
                <tr key={ref.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{ref.displayName}</p>
                    <p className="text-[11px] text-slate-400">@{ref.username}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{timeAgo(ref.createdAt)}</td>
                  <td className="py-3 px-4 font-bold text-slate-700">{ref.role}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ref.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {ref.isVerified ? "Verified" : "Unverified"}
                    </span>
                  </td>
                </tr>
              ))}

              {referrals.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No referrals yet. Share your link above to start earning!
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
