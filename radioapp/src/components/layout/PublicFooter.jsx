import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube, Send, MessageCircle } from 'lucide-react';
import { useStation } from '../../context/StationContext';

export function PublicFooter() {
  const { station, branding, settings, basePath: contextBasePath } = useStation();

  const slug = station?.slug || '';
  const basePath = contextBasePath !== undefined ? contextBasePath : `/station/${slug}`;

  return (
    <footer
      className="mt-20 border-t transition-colors text-slate-300"
      style={{
        backgroundColor: branding?.footer_color || '#0F172A',
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Col 1: Station Overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {branding?.logo_url ? (
                <img
                  src={branding.logo_url}
                  alt={station?.name}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl"
                  style={{ backgroundColor: branding?.primary_color || '#4F46E5' }}
                >
                  <Radio className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="font-extrabold text-white text-lg leading-tight">{station?.name}</h3>
                {station?.slogan && <p className="text-xs text-slate-400">{station.slogan}</p>}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {station?.description || 'Your premier independent radio station broadcasting high-fidelity music, live talk, and news.'}
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-2 pt-2">
              {settings?.facebook && (
                <a
                  href={settings.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-indigo-600 hover:text-white flex items-center justify-center text-slate-300 transition-colors"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {settings?.instagram && (
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-pink-600 hover:text-white flex items-center justify-center text-slate-300 transition-colors"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings?.twitter && (
                <a
                  href={settings.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-sky-500 hover:text-white flex items-center justify-center text-slate-300 transition-colors"
                  title="X (Twitter)"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {settings?.youtube && (
                <a
                  href={settings.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-600 hover:text-white flex items-center justify-center text-slate-300 transition-colors"
                  title="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {settings?.whatsapp && (
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-emerald-600 hover:text-white flex items-center justify-center text-slate-300 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={basePath || '/'} className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to={`${basePath}/schedule`} className="hover:text-white transition-colors">
                  Programs & Schedule
                </Link>
              </li>
              <li>
                <Link to={`${basePath}/news`} className="hover:text-white transition-colors">
                  Latest News
                </Link>
              </li>
              <li>
                <Link to={`${basePath}/videos`} className="hover:text-white transition-colors">
                  Video Highlights
                </Link>
              </li>
              <li>
                <Link to={`${basePath}/contact`} className="hover:text-white transition-colors">
                  Contact Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Contact Studio</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              {settings?.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span>{settings.phone}</span>
                </li>
              )}
              {settings?.email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span>{settings.email}</span>
                </li>
              )}
              {settings?.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                  <span>{settings.address}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Col 4: Platform & Portal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Radio Platform</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Powered by the multi-station Radio Station Website Platform. Deployable for independent radio broadcasters.
            </p>
            <div className="pt-2 flex flex-col gap-2 text-xs">
              <Link to="/" className="text-indigo-400 hover:text-indigo-300 font-semibold">
                → Browse All Stations
              </Link>
              <Link to="/admin/login" className="text-slate-400 hover:text-white font-medium">
                → Admin Dashboard Login
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>{settings?.copyright_text || `© ${new Date().getFullYear()} ${station?.name || 'Radio Station'}. All rights reserved.`}</p>
          <div className="flex items-center gap-6">
            <span>Official Live Stream</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Broadcast Engine Active</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
