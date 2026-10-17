"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProviders";
import { ExternalLink, Sparkles, Megaphone } from "lucide-react";

interface GoogleAdProps {
  placement?: "feed" | "sidebar" | "video-overlay" | "banner";
  slotId?: string;
  clientId?: string;
  className?: string;
  onAdClick?: () => void;
  onAdLoaded?: () => void;
}

export default function GoogleAd({
  placement = "feed",
  slotId,
  clientId,
  className = "",
  onAdClick,
  onAdLoaded,
}: GoogleAdProps) {
  const { settings } = useApp();
  const adRef = useRef<HTMLDivElement>(null);
  const [adFilled, setAdFilled] = useState(false);
  const [isError, setIsError] = useState(false);

  const adsEnabled = settings?.ads_enabled !== "false";
  const adClient = clientId || settings?.adsense_client_id || "ca-pub-4078466828008985";
  const adSlot = slotId || settings?.adsense_slot_id || "7034214536";

  useEffect(() => {
    if (!adsEnabled) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          onAdLoaded?.();
        }
      } catch (err) {
        console.warn("AdSense push:", err);
        setIsError(true);
      }
    }, 250);

    // Check if adsbygoogle actually rendered content after 1.5s
    const checkTimer = setTimeout(() => {
      if (adRef.current) {
        const ins = adRef.current.querySelector("ins.adsbygoogle");
        if (ins && (ins.getAttribute("data-ad-status") === "filled" || ins.children.length > 0)) {
          setAdFilled(true);
        }
      }
    }, 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(checkTimer);
    };
  }, [adsEnabled, adClient, adSlot, onAdLoaded]);

  if (!adsEnabled) return null;

  // Track ad click wrapper
  const handleAdClick = () => {
    if (onAdClick) {
      onAdClick();
    }
  };

  // Video Overlay specific layout
  if (placement === "video-overlay") {
    return (
      <div 
        ref={adRef}
        onClick={handleAdClick}
        className={`relative w-full h-full max-h-[380px] bg-slate-950/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-4 border border-white/10 shadow-2xl overflow-hidden cursor-pointer ${className}`}
      >
        {/* Ad Header */}
        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-[10px] uppercase">
              Ad
            </span>
            <span className="font-semibold text-slate-200">Google Ads Partner</span>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            Visit advertiser <ExternalLink className="w-3 h-3" />
          </span>
        </div>

        {/* Real AdSense Slot */}
        <div className="w-full flex-1 flex items-center justify-center min-h-[140px] relative overflow-hidden">
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%", height: "100%", minHeight: "140px" }}
            data-ad-client={adClient}
            data-ad-slot={adSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />

          {/* Attractive visual fallback so the ad is always visible even if AdSense is in sandbox */}
          {!adFilled && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 rounded-xl border border-indigo-500/20">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mb-2">
                <Megaphone className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
              <h4 className="text-white font-black text-sm sm:text-base">
                Discover Trending Rwandan &amp; Global Offers
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mt-1 leading-relaxed">
                Connect with thousands of buyers and creators across Kigali, Rwanda, and worldwide.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm">
                Learn More <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Sidebar Layout
  if (placement === "sidebar") {
    return (
      <div 
        ref={adRef}
        onClick={handleAdClick}
        className={`bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs space-y-2 overflow-hidden ${className}`}
      >
        <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="px-1 py-0.2 bg-amber-400 text-slate-950 font-bold rounded text-[9px] uppercase">
              Ad
            </span>
            <span className="font-semibold text-slate-600">Google Ads</span>
          </div>
          <span className="text-[10px] text-slate-400">Sponsored</span>
        </div>

        <div className="min-h-[180px] w-full flex items-center justify-center relative overflow-hidden">
          <ins
            className="adsbygoogle"
            style={{ display: "block", minHeight: "180px", width: "100%" }}
            data-ad-client={adClient}
            data-ad-slot={adSlot}
            data-ad-format="rectangle"
            data-full-width-responsive="true"
          />

          {!adFilled && (
            <div className="w-full p-4 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-indigo-100 flex flex-col items-center text-center">
              <Sparkles className="w-6 h-6 text-brand mb-1.5" />
              <p className="text-xs font-extrabold text-slate-900">
                Advertise Your Business on Umuguzi
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Reach over 100,000+ targeted Rwandan viewers daily.
              </p>
              <a
                href="https://umuguzi.pro"
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 px-3 py-1 bg-brand text-white text-[11px] font-bold rounded-lg shadow-xs hover:bg-brand-hover inline-flex items-center gap-1"
              >
                Promote Now <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Feed (In-Feed between videos) Layout
  return (
    <div 
      ref={adRef}
      onClick={handleAdClick}
      className={`col-span-full my-4 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-sm transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-[10px] uppercase">
            Ad
          </span>
          <span className="font-semibold text-slate-700">Sponsored &bull; Google AdSense</span>
        </div>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          Ads by Google <ExternalLink className="w-3 h-3" />
        </span>
      </div>

      <div className="min-h-[90px] w-full flex items-center justify-center relative overflow-hidden">
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", minHeight: "90px" }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />

        {!adFilled && (
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/60 via-purple-50/40 to-slate-50 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Grow Your Brand &bull; Rwandan Creator &amp; Business Network
                </h4>
                <p className="text-xs text-slate-500">
                  Target audiences streaming Rwandan gospel choirs, cinema, music, and digital services.
                </p>
              </div>
            </div>
            <a
              href="https://umuguzi.pro"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-900 hover:bg-brand text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              Learn More <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
