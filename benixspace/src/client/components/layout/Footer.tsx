import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowUpRight, ShieldCheck, Heart, Smartphone, Download } from 'lucide-react';
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from '../common/SocialIcons';
import { fetchCompanySettings } from '../../services/api';
import { usePwa } from '../../context/PwaContext';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { isInstalled, installApp } = usePwa();
  const [logo, setLogo] = useState<string>('/logo.png');
  const [companyInfo, setCompanyInfo] = useState({
    name: 'BenixSpace',
    tagline: 'All in One. For Everyone.',
    email: 'noreply@benix.space',
    phone: '+250 783 987 223',
    address: 'Kigali, Rwanda - Downtown City Center',
    founder: 'Benir Benjamin',
    twitter: 'https://x.com/benirbenjamin',
    instagram: 'https://instagram.com/benirbenjamin',
    youtube: 'https://youtube.com/@nebelurw',
    facebook: 'https://facebook.com/benir.thegeneral',
    copyright: '© 2026 BenixSpace Inc. All rights reserved.'
  });

  useEffect(() => {
    const savedLogo = localStorage.getItem('benix_platform_logo');
    if (savedLogo) setLogo(savedLogo);

    const savedSettings = localStorage.getItem('benix_platform_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.contacts) {
          setCompanyInfo((prev) => ({
            ...prev,
            email: parsed.contacts.support_email || prev.email,
            phone: parsed.contacts.whatsapp_phone || prev.phone,
            address: parsed.contacts.address || prev.address,
            founder: parsed.contacts.founder_name || prev.founder,
            twitter: parsed.contacts.twitter_url || prev.twitter,
            instagram: parsed.contacts.instagram_url || prev.instagram,
            youtube: parsed.contacts.youtube_url || prev.youtube,
            facebook: parsed.contacts.facebook_url || prev.facebook,
            copyright: parsed.contacts.copyright_text || prev.copyright
          }));
        }
        if (parsed.branding?.platform_name) {
          setCompanyInfo((prev) => ({ ...prev, name: parsed.branding.platform_name }));
        }
      } catch (e) {}
    }

    // Dynamic backend fetch
    fetchCompanySettings()
      .then((data) => {
        if (data?.company) {
          const c = data.company;
          setCompanyInfo((prev) => ({
            ...prev,
            name: c.company_name || prev.name,
            email: c.email || prev.email,
            phone: c.phone || prev.phone,
            address: c.address || prev.address,
            founder: c.founder_name || prev.founder
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-[#0B0E14] text-slate-300 pt-16 pb-12 border-t border-slate-800 font-sans">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Column 1: Company Profile & Logo */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <img src={logo} alt="BenixSpace Logo" className="w-10 h-10 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform" />
              <div>
                <span className="font-black text-xl tracking-tight text-white block group-hover:text-blue-400 transition-colors">
                  {companyInfo.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  {companyInfo.tagline}
                </span>
              </div>
            </Link>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              BenixSpace is the premier unified digital platform ecosystem for Rwanda and East Africa. Watch live streaming TV, 24/7 radio stations, verified dating, gospel choirs, and digital commerce.
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              <a href={companyInfo.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-blue-600 hover:text-white flex items-center justify-center text-slate-400 transition-colors border border-slate-700/60" title="Facebook">
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a href={companyInfo.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-pink-600 hover:text-white flex items-center justify-center text-slate-400 transition-colors border border-slate-700/60" title="Instagram">
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a href={companyInfo.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-sky-500 hover:text-white flex items-center justify-center text-slate-400 transition-colors border border-slate-700/60" title="Twitter / X">
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a href={companyInfo.youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-red-600 hover:text-white flex items-center justify-center text-slate-400 transition-colors border border-slate-700/60" title="YouTube">
                <YoutubeIcon className="w-4 h-4" />
              </a>
            </div>

            {/* PWA Install Button (Hides when app is installed) */}
            {!isInstalled && (
              <div className="pt-2">
                <button
                  onClick={installApp}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 group"
                >
                  <Smartphone className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform" />
                  <span>Install Benix.Space App</span>
                  <Download className="w-3.5 h-3.5 text-blue-200" />
                </button>
              </div>
            )}
          </div>

          {/* Column 2: Digital Platforms Suite */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase">Integrated App Suite</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li>
                <Link to="/tv" className="hover:text-blue-400 inline-flex items-center gap-1.5 transition-colors">
                  <span>Live TV Streaming (17 Channels)</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              </li>
              <li>
                <Link to="/radio" className="hover:text-purple-400 inline-flex items-center gap-1.5 transition-colors">
                  <span>Live Radio FM (19 Stations)</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              </li>
              <li>
                <Link to="/dating" className="hover:text-rose-400 inline-flex items-center gap-1.5 transition-colors">
                  <span>Kunda Space Rwandan Dating</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              </li>
              <li>
                <Link to="/music" className="hover:text-indigo-400 inline-flex items-center gap-1.5 transition-colors">
                  <span>Voxify Choirs & Gospel Music</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="hover:text-emerald-400 inline-flex items-center gap-1.5 transition-colors">
                  <span>Benix Marketplace Commerce</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              </li>
              <li>
                <Link to="/games" className="hover:text-amber-400 inline-flex items-center gap-1.5 transition-colors">
                  <span>RollDice Arena Gaming</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              </li>
              <li>
                <Link to="/calc" className="hover:text-teal-400 inline-flex items-center gap-1.5 transition-colors">
                  <span>EasyCalc Smart Calculators</span>
                  <ArrowUpRight className="w-3 h-3 opacity-70" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links & Pages */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase">Company & Resources</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link to="/projects" className="hover:text-white transition-colors">Project Portfolio</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Digital Engineering Services</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About NebeluRw & Leadership</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Tech Blog & Insights</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: Dynamic Contact Info */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase">Official Contacts</h4>
            <div className="space-y-3 text-xs text-slate-400">
              <p className="text-white font-bold">{companyInfo.name} • NebeluRw Co. Ltd</p>
              <p className="text-[11px] text-blue-400 font-medium">Leadership: {companyInfo.founder}</p>
              
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href={`mailto:${companyInfo.email}`} className="hover:text-white transition-colors font-mono">{companyInfo.email}</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`https://wa.me/${companyInfo.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-mono">{companyInfo.phone}</a>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{companyInfo.address}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>{companyInfo.copyright}</p>
          <div className="flex items-center gap-4">
            {!isInstalled && (
              <>
                <button
                  onClick={installApp}
                  className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
                <span>•</span>
              </>
            )}
            <Link to="/admin" className="hover:text-blue-400 transition-colors flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Console</span>
            </Link>
            <span>•</span>
            <a href="https://benix.space" className="hover:text-white transition-colors">benix.space</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
