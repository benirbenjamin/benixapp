"use client";

import React from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  MessageCircle,
} from "lucide-react";
import { useApp } from "../providers/AppProviders";

export default function Footer() {
  const { settings } = useApp();

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              {settings.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logo_url}
                  alt={settings.app_name || "Umuguzipro"}
                  className="w-8 h-8 rounded-xl object-cover shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center font-black">
                  U
                </div>
              )}
              <span className="font-extrabold text-lg text-slate-900">
                {settings.app_name || "Umuguzipro"}
              </span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed">
              {settings.app_tagline || "Rwanda & Global Video, Services & Digital Commerce Platform."}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-2 text-slate-400">
              {settings.social_youtube && (
                <a href={settings.social_youtube} target="_blank" rel="noreferrer" className="p-2 hover:text-red-600 hover:bg-slate-100 rounded-full transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {settings.social_twitter && (
                <a href={settings.social_twitter} target="_blank" rel="noreferrer" className="p-2 hover:text-sky-500 hover:bg-slate-100 rounded-full transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noreferrer" className="p-2 hover:text-pink-600 hover:bg-slate-100 rounded-full transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noreferrer" className="p-2 hover:text-blue-600 hover:bg-slate-100 rounded-full transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {settings.social_whatsapp && (
                <a href={settings.social_whatsapp} target="_blank" rel="noreferrer" className="p-2 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Discover & Media */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-4">Discover</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/explore" className="hover:text-brand transition-colors">Explore Videos</Link></li>
              <li><Link href="/channels" className="hover:text-brand transition-colors">Featured Channels</Link></li>
              <li><Link href="/services" className="hover:text-brand transition-colors">Services Directory</Link></li>
              <li><Link href="/service-requests" className="hover:text-brand transition-colors">Service Job Requests</Link></li>
              <li><Link href="/products" className="hover:text-brand transition-colors">Digital Marketplace</Link></li>
              <li><Link href="/posts" className="hover:text-brand transition-colors">Community Feed</Link></li>
            </ul>
          </div>

          {/* Col 3: Creators & Earners */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-4">Monetization</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link href="/studio" className="hover:text-brand transition-colors">Creator Studio</Link></li>
              <li><Link href="/studio/upload" className="hover:text-brand transition-colors">Upload & Sell Video</Link></li>
              <li><Link href="/dashboard/services" className="hover:text-brand transition-colors">Offer a Service</Link></li>
              <li><Link href="/dashboard/wallet" className="hover:text-brand transition-colors">Earnings & Ledger</Link></li>
              <li><Link href="/dashboard/affiliates" className="hover:text-brand transition-colors">Affiliate & Referrals</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact Information */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-4">Contact</h4>
            {settings.contact_email && (
              <div className="flex items-center gap-2 text-xs">
                <Mail className="w-4 h-4 text-brand shrink-0" />
                <a href={`mailto:${settings.contact_email}`} className="hover:underline truncate">{settings.contact_email}</a>
              </div>
            )}
            {settings.contact_phone && (
              <div className="flex items-center gap-2 text-xs">
                <Phone className="w-4 h-4 text-brand shrink-0" />
                <a href={`tel:${settings.contact_phone}`} className="hover:underline">{settings.contact_phone}</a>
              </div>
            )}
            {settings.contact_address && (
              <div className="flex items-start gap-2 text-xs">
                <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <span className="text-slate-500 leading-snug">{settings.contact_address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} {settings.app_name || "Umuguzipro"}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/support" className="hover:text-slate-600">Support Center</Link>
            <span>&bull;</span>
            <span className="text-slate-500 font-medium">Secured with Flutterwave & MoMo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
