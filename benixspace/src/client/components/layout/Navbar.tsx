import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Menu,
  X,
  Search,
  Wallet as WalletIcon,
  Gift,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Globe,
  Tv,
  Radio,
  Dices,
  ShoppingBag,
  Music,
  Heart,
  Calculator,
  ChevronDown,
  Palette,
  LayoutDashboard
} from 'lucide-react';
import { RegistrationWizardModal } from '../modals/RegistrationWizardModal';
import { WalletModal } from '../modals/WalletModal';
import { ReferralModal } from '../modals/ReferralModal';
import { SearchModal } from '../modals/SearchModal';
import { ThemeCustomizerModal } from '../common/ThemeCustomizerModal';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTheme, setShowTheme] = useState(false);

  const { user, wallet, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const navLinks = [
    { name: t('home'), path: '/' },
    { name: t('tv'), path: '/tv' },
    { name: t('radio'), path: '/radio' },
    { name: t('games'), path: '/games' },
    { name: t('marketplace'), path: '/marketplace' },
    { name: t('music'), path: '/music' },
    { name: t('dating'), path: '/dating' },
    { name: t('calc'), path: '/calc' },
    { name: t('blog'), path: '/blog' },
  ];

  const languages = [
    { code: 'en', label: 'English (EN)' },
    { code: 'rw', label: 'Kinyarwanda (RW)' },
    { code: 'fr', label: 'Français (FR)' },
    { code: 'sw', label: 'Kiswahili (SW)' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <img
              src="/logo.png"
              alt="BenixSpace Logo"
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-sky-900 to-sky-600 bg-clip-text text-transparent">
                BenixSpace
              </span>
              <span className="block text-[10px] font-semibold tracking-wider uppercase text-sky-600">
                Super-App
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/80">
            {navLinks.slice(0, 7).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive(link.path)
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-slate-600 hover:text-sky-600 hover:bg-white/50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Global Search Trigger */}
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Search Benix.Space"
            >
              <Search className="w-4 h-4 text-sky-600" />
              <span className="hidden md:inline">{t('search')}</span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors uppercase"
                title="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-sky-600" />
                <span>{language}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code as any);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center justify-between hover:bg-sky-50 transition-colors ${
                        language === l.code ? 'text-sky-600 font-bold bg-sky-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>{l.label}</span>
                      {language === l.code && <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Customizer Trigger */}
            <button
              onClick={() => setShowTheme(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              title="Change Theme & Colors"
            >
              <Palette className="w-3.5 h-3.5 text-sky-600" />
            </button>

            {/* Auth Dependent Controls */}
            {user ? (
              <div className="flex items-center gap-2">
                {/* Unified Dashboard Link */}
                <Link
                  to="/dashboard"
                  className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  title="Open Unified Dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                {/* Central Wallet Chip */}
                <button
                  onClick={() => setShowWallet(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  title="Open Central Wallet"
                >
                  <WalletIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{(wallet?.balance || 0).toLocaleString()} RWF</span>
                </button>

                {/* Referral Button */}
                <button
                  onClick={() => setShowReferral(true)}
                  className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-semibold text-xs items-center gap-1.5 transition-colors"
                  title="Earn Referral Rewards"
                >
                  <Gift className="w-3.5 h-3.5 text-amber-600" />
                  <span>+500 RWF</span>
                </button>

                {/* Superadmin / Admin Link */}
                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <Link
                    to="/admin"
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold transition-colors"
                    title="Super Admin Portal"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </Link>
                )}

                {/* User Info & Logout */}
                <div className="flex items-center gap-1 pl-1">
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-sky-600 uppercase font-semibold">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWizard(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-sky-500/20 hover:shadow-sky-500/35 hover:-translate-y-0.5 transition-all"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>Sign In / Join</span>
                </button>
              </div>
            )}

            {/* Mobile Drawer Hamburger */}
            <div className="xl:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-sky-600 focus:outline-none"
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="xl:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top duration-200 shadow-xl max-h-[85vh] overflow-y-auto">
            
            {/* Quick module links */}
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
              <Link
                to="/tv"
                onClick={() => setIsOpen(false)}
                className="p-3 rounded-2xl bg-sky-50 text-sky-800 flex items-center gap-2 text-xs font-bold"
              >
                <Tv className="w-4 h-4 text-sky-600" />
                <span>TV Live</span>
              </Link>
              <Link
                to="/radio"
                onClick={() => setIsOpen(false)}
                className="p-3 rounded-2xl bg-purple-50 text-purple-800 flex items-center gap-2 text-xs font-bold"
              >
                <Radio className="w-4 h-4 text-purple-600" />
                <span>Radio Stream</span>
              </Link>
              <Link
                to="/games"
                onClick={() => setIsOpen(false)}
                className="p-3 rounded-2xl bg-amber-50 text-amber-800 flex items-center gap-2 text-xs font-bold"
              >
                <Dices className="w-4 h-4 text-amber-600" />
                <span>RollDice Game</span>
              </Link>
              <Link
                to="/marketplace"
                onClick={() => setIsOpen(false)}
                className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center gap-2 text-xs font-bold"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Umuguzi Market</span>
              </Link>
              <Link
                to="/music"
                onClick={() => setIsOpen(false)}
                className="p-3 rounded-2xl bg-indigo-50 text-indigo-800 flex items-center gap-2 text-xs font-bold"
              >
                <Music className="w-4 h-4 text-indigo-600" />
                <span>Voxify Music</span>
              </Link>
              <Link
                to="/dating"
                onClick={() => setIsOpen(false)}
                className="p-3 rounded-2xl bg-rose-50 text-rose-800 flex items-center gap-2 text-xs font-bold"
              >
                <Heart className="w-4 h-4 text-rose-600" />
                <span>Kunda Dating</span>
              </Link>
            </div>

            {/* Standard Nav Links */}
            <div className="space-y-1 pt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-sky-50 text-sky-600 font-semibold border-l-4 border-sky-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Mobile Auth & Modals Trigger */}
            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShowWallet(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-center text-xs flex items-center justify-center gap-2"
                  >
                    <WalletIcon className="w-4 h-4 text-emerald-600" />
                    <span>Wallet Balance: {(wallet?.balance || 0).toLocaleString()} RWF</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShowReferral(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-center text-xs flex items-center justify-center gap-2"
                  >
                    <Gift className="w-4 h-4 text-amber-600" />
                    <span>Referrals & Rewards (+500 RWF)</span>
                  </button>
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-center text-xs flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Admin Portal</span>
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowWizard(true);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-center text-sm shadow-md"
                >
                  Sign In / Join Super-App
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Modals Mounted to Navbar */}
      <RegistrationWizardModal isOpen={showWizard} onClose={() => setShowWizard(false)} />
      <WalletModal isOpen={showWallet} onClose={() => setShowWallet(false)} />
      <ReferralModal isOpen={showReferral} onClose={() => setShowReferral(false)} />
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <ThemeCustomizerModal isOpen={showTheme} onClose={() => setShowTheme(false)} />
    </>
  );
};
