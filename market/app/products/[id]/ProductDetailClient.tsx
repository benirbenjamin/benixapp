"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  Star,
  CheckCircle2,
  FileText,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Wallet,
  AlertCircle,
  Check,
  Share2,
  Copy,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { formatCurrency } from "@/lib/utils";

export default function ProductDetailClient({
  product,
  isPurchased,
}: {
  product: any;
  isPurchased: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams ? searchParams.get("ref") : null;
  const { user, settings } = useApp();

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("FLUTTERWAVE");
  const [paymentRef, setPaymentRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadLink, setDownloadLink] = useState(isPurchased ? product.downloadUrl : null);

  const images = (product.images as string[]) || [];
  const mainImage =
    images.length > 0
      ? images[0]
      : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80";

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/products/${product.id}${user?.referralCode ? `?ref=${user.referralCode}` : ""}`
    : "";

  const copyShareLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/products/${product.id}${refCode ? `&ref=${refCode}` : ""}`);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/products/${product.id}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          paymentReference: paymentRef,
          referralCode: refCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Purchase failed");

      setDownloadLink(data.downloadUrl || product.downloadUrl || "#");
      setCheckoutModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Media & Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mainImage} alt={product.title} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {product.category && (
                <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full">
                  {product.category.name}
                </span>
              )}
              {product.fileType && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold uppercase rounded-full">
                  {product.fileType} {product.fileSize && `(${product.fileSize})`}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-amber-500 font-bold ml-auto">
                <Star className="w-4 h-4 fill-current" />
                {product.rating.toFixed(1)} &bull; {product.salesCount} Downloads
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {product.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        </div>

        {/* Right Col: Seller & Checkout */}
        <div className="space-y-6">
          {/* Seller Box */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Created by</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center font-bold text-lg">
                {product.seller.displayName.charAt(0)}
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900">{product.seller.displayName}</span>
                <p className="text-xs text-slate-500">@{product.seller.username}</p>
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-6 rounded-2xl bg-white border-2 border-purple-500/20 shadow-xl space-y-5">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Instant License Price
              </span>
              <span className="text-3xl font-black text-slate-900">
                {formatCurrency(product.price)}
              </span>
            </div>

            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Instant digital file entitlement</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Lifetime access &amp; re-download</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Encrypted &amp; virus scanned download</span>
              </li>
            </ul>

            {downloadLink ? (
              <a
                href={downloadLink}
                download
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all text-center flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Digital Files Now
              </a>
            ) : (
              <button
                onClick={() => setCheckoutModalOpen(true)}
                className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white font-extrabold text-sm rounded-xl shadow-lg transition-all text-center block"
              >
                Buy &amp; Download ({formatCurrency(product.price)})
              </button>
            )}

            {/* Share & Earn Affiliate Referral Button */}
            <button
              onClick={() => setShareModalOpen(true)}
              className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-purple-600" />
              Share &amp; Earn {settings.referral_commission_rate || "5"}% Affiliate Commission
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">Checkout</h3>
                <p className="text-xs text-slate-500 truncate">{product.title}</p>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handlePurchase} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("FLUTTERWAVE")}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === "FLUTTERWAVE"
                        ? "border-brand bg-blue-50 text-brand ring-2 ring-brand/20"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Flutterwave
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("MANUAL")}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === "MANUAL"
                        ? "border-brand bg-blue-50 text-brand ring-2 ring-brand/20"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    MoMo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("WALLET")}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === "WALLET"
                        ? "border-brand bg-blue-50 text-brand ring-2 ring-brand/20"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    Wallet
                  </button>
                </div>

                {paymentMethod === "MANUAL" && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1 mt-2">
                    <p className="font-bold">Manual Transfer:</p>
                    <p>{settings.manual_payment_instructions || "Send via MTN MoMo / Bank Transfer"}</p>
                    <input
                      type="text"
                      required
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="Transaction reference / MoMo Txn ID"
                      className="w-full mt-2 px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 mb-3">
                  <span>Total Amount:</span>
                  <span className="text-xl text-brand">{formatCurrency(product.price)}</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? "Processing Order..." : "Confirm & Complete Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share & Affiliate Referral Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-black text-lg text-slate-900">Share &amp; Earn</h3>
              </div>
              <button
                onClick={() => setShareModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Share this product with friends, groups, or social networks. Anyone who purchases this item through your link will earn you <strong className="text-purple-600">{settings.referral_commission_rate || "5"}% commission</strong> automatically deposited into your Umuguzi wallet!
            </p>

            {/* Referral Link Box */}
            <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-xs text-slate-700 flex-1 outline-none font-mono"
              />
              <button
                onClick={copyShareLink}
                className="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out "${product.title}" on Umuguzi: ${shareUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${product.title} on Umuguzi:`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow transition-colors"
              >
                Twitter / X
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-colors"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
