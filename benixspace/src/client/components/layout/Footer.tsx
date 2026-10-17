import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from '../common/SocialIcons';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          
          {/* Column 1: Company Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="NebeluRw Logo" className="w-9 h-9 object-contain" />
              <span className="font-extrabold text-xl tracking-tight text-white">
                BenixSpace
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              BenixSpace is the official digital ecosystem and project home for <strong className="text-white">NebeluRw Co. Ltd</strong>. Building websites, streaming media platforms, calculators, and digital platforms.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://facebook.com/benir.thegeneral" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-sky-600 hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a href="https://instagram.com/benirbenjamin" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-sky-600 hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a href="https://x.com/benirbenjamin" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-sky-600 hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a href="https://youtube.com/@nebelurw" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-sky-600 hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                <YoutubeIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Digital Platforms */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-base tracking-wide">Digital Platforms</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="https://tv.benix.space" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 inline-flex items-center gap-1 transition-colors">
                  <span>Benix Space TV</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://games.benix.space" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 inline-flex items-center gap-1 transition-colors">
                  <span>Benix Games</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://easycalc.benix.space" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 inline-flex items-center gap-1 transition-colors">
                  <span>Benix Easy Calc</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://radio.benix.space" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 inline-flex items-center gap-1 transition-colors">
                  <span>Benix Radio</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://voxify.space" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 inline-flex items-center gap-1 transition-colors">
                  <span>Voxify Platform</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-base tracking-wide">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/projects" className="hover:text-sky-400 transition-colors">Project Portfolio</Link></li>
              <li><Link to="/services" className="hover:text-sky-400 transition-colors">NebeluRw Services</Link></li>
              <li><Link to="/about" className="hover:text-sky-400 transition-colors">About NebeluRw & Leadership</Link></li>
              <li><Link to="/blog" className="hover:text-sky-400 transition-colors">Blog & Tech Insights</Link></li>
              <li><Link to="/contact" className="hover:text-sky-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="hover:text-sky-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="hover:text-sky-400 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact & Founder */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-base tracking-wide">Company Contact</h4>
            <div className="space-y-3 text-sm text-slate-400">
              <p className="text-white font-medium">NebeluRw Co. Ltd</p>
              <p className="text-xs text-sky-400 font-medium">Founder / Contact: Benir Benjamin</p>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <a href="mailto:benirabok@gmail.com" className="hover:text-white transition-colors">benirabok@gmail.com</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <a href="tel:0783987223" className="hover:text-white transition-colors">0783987223</a>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Kigali, Rwanda</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} NebeluRw Co. Ltd. All rights reserved. BenixSpace Digital Ecosystem.</p>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="hover:text-sky-400 transition-colors">Admin Dashboard</Link>
            <span>•</span>
            <a href="https://benix.space" className="hover:text-sky-400 transition-colors">benix.space</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
