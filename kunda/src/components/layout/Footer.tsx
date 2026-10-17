import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Lock, Download, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePwa } from '../../contexts/PwaContext';

export const Footer: React.FC = () => {
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { isInstalled, installApp } = usePwa();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-violet-600 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">Kunda Space</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">{t('footer.tagline')}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-900/50 px-3 py-1.5 rounded-lg w-fit">
                <Lock className="w-3.5 h-3.5" />
                <span>Strictly 18+ Only</span>
              </div>
              {!isInstalled && (
                <button
                  onClick={installApp}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
              )}
            </div>
          </div>

          {/* Col 2: Navigation & Earn */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/how-it-works" className="hover:text-rose-400 transition-colors">
                  {t('nav.howItWorks')}
                </Link>
              </li>
              <li>
                <Link to="/make-money" className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Earn Money / Gushaka Amafaranga</span>
                </Link>
              </li>
              <li>
                <Link to="/membership" className="hover:text-rose-400 transition-colors">
                  {t('nav.membership')}
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-rose-400 transition-colors">
                  {t('nav.safety')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-rose-400 transition-colors">
                  {t('nav.faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Trust */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Trust & Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/terms" className="hover:text-rose-400 transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-rose-400 transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/community-guidelines" className="hover:text-rose-400 transition-colors">
                  {t('footer.community')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-rose-400 transition-colors">
                  {t('footer.support')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Language & Regional Hub */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Languages</h4>
            <p className="text-xs text-slate-400 mb-3">
              Kunda Space operates in English, Kinyarwanda, and French.
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(availableLanguages) as Array<keyof typeof availableLanguages>).map((code) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    language === code
                      ? 'border-rose-500 bg-rose-500/20 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {availableLanguages[code].flag} {availableLanguages[code].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Kunda Space. All rights reserved. Kigali, Rwanda.</p>
          <p>Connecting Rwandan singles worldwide with mutual dignity & respect.</p>
        </div>
      </div>
    </footer>
  );
};
