import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Menu,
  X,
  Search,
  Bell,
  Mic,
  ShieldCheck,
  LayoutDashboard,
  Wallet as WalletIcon,
  User as UserIcon,
  LogOut,
  Tv,
  Radio,
  Gamepad2,
  ShoppingBag,
  Music,
  Heart,
  Calculator,
  Briefcase,
  MessageSquare,
  Plus
} from 'lucide-react';
import { SearchModal } from '../modals/SearchModal';
import { AppAccessWizardModal } from '../modals/AppAccessWizardModal';
import { WalletModal } from '../modals/WalletModal';
import { NotificationTray } from '../modals/NotificationTray';
import { MessagesDrawer } from '../modals/MessagesDrawer';
import { CreateMediaModal } from '../modals/CreateMediaModal';

export const Navbar: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showCreateMedia, setShowCreateMedia] = useState(false);
  const [wizardAppKey, setWizardAppKey] = useState<string | null>(null);

  const { user, wallet, logout, hasAppProfile } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  const handleAppClick = (appKey: string, route: string) => {
    setIsDrawerOpen(false);
    if (!user) {
      setWizardAppKey(appKey);
    } else if (!hasAppProfile(appKey)) {
      setWizardAppKey(appKey);
    } else {
      navigate(route);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-b border-slate-800/80 text-white shadow-lg transition-all">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-3 space-y-3">
          
          {/* Top Row: Menu | Brand Logo & Subtitle | Prominent Admin & Bell */}
          <div className="flex items-center justify-between gap-3">
            
            {/* Left: Drawer Menu Button & Clickable Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link to="/" className="flex items-center gap-2.5 group">
                <img
                  src={localStorage.getItem('benix_platform_logo') || '/logo.png'}
                  alt="BenixSpace Logo"
                  className="w-9 h-9 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform"
                />
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tight text-white flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                    Benix<span className="text-blue-500">.Space</span>
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 tracking-wide">
                    All in One. For Everyone.
                  </span>
                </div>
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Creator Upload (+) Button */}
              <button
                onClick={() => {
                  if (!user) {
                    setWizardAppKey('tv');
                  } else {
                    setShowCreateMedia(true);
                  }
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
                title="Upload Video or Story"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Create</span>
              </button>

              {/* ADMIN DASHBOARD BUTTON - ONLY VISIBLE TO VERIFIED ADMINS */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 hover:border-amber-400 text-amber-300 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/10 transition-all hover:scale-105"
                  title="Super Admin Control Center"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Admin Dashboard</span>
                  <span className="sm:hidden">Admin</span>
                </Link>
              )}

              {/* Wallet Pill if Logged In */}
              {user && (
                <button
                  onClick={() => setShowWallet(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/25 transition-all"
                  title="Open Central Wallet"
                >
                  <WalletIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{Number(wallet?.balance ?? 0).toLocaleString()} RWF</span>
                </button>
              )}

              {/* Direct Messages Drawer Button */}
              <button
                onClick={() => setShowMessages(true)}
                className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
                title="Direct Messages"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full border-2 border-[#0B0E14]">
                  3
                </span>
              </button>

              {/* Notification Bell with Chime & Push */}
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full border-2 border-[#0B0E14] animate-pulse">
                  4
                </span>
              </button>

              {/* User Avatar / Login */}
              {user ? (
                <div className="relative group">
                  <Link
                    to="/dashboard"
                    className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-white text-xs border border-white/20 shadow-md hover:scale-105 transition-transform"
                    title={`Dashboard (${user.name})`}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => setWizardAppKey('tv')}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
                >
                  Sign In
                </button>
              )}

            </div>
          </div>

          {/* Bottom Row: Search Bar "Search videos, music, people, jobs, and more..." */}
          <div className="relative">
            <div
              onClick={() => setShowSearch(true)}
              className="w-full pl-10 pr-10 py-2.5 bg-[#121824] hover:bg-[#161F2E] border border-slate-700/60 rounded-2xl text-xs text-slate-400 cursor-pointer flex items-center justify-between transition-colors shadow-inner"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">Search videos, music, people, jobs, and more...</span>
              </div>
              <Mic className="w-4 h-4 text-slate-500 shrink-0 hover:text-blue-400" />
            </div>
          </div>

        </div>
      </header>

      {/* Notifications Dropdown Drawer */}
      {showNotifications && (
        <div className="fixed top-24 right-4 z-50 w-80 bg-[#121824] border border-slate-700 rounded-3xl shadow-2xl p-4 text-white space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              Notifications
            </h4>
            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
              5 Unread
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/40">
              <p className="font-bold text-white text-[11px]">RTV Live Streaming</p>
              <p className="text-[10px] text-slate-400">Watch the evening news and prime-time broadcast live in HD.</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/40">
              <p className="font-bold text-white text-[11px]">Kiss FM 102.3 Kigali</p>
              <p className="text-[10px] text-slate-400">Now playing urban beats and trending hits on Benix Radio.</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/40">
              <p className="font-bold text-white text-[11px]">Kunda Space Matches</p>
              <p className="text-[10px] text-slate-400">3 new verified profiles matched your dating preferences.</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/40">
              <p className="font-bold text-white text-[11px]">Welcome Reward Credited</p>
              <p className="text-[10px] text-slate-400">Your central wallet is ready for deposits, transfers, and wagers.</p>
            </div>
          </div>
        </div>
      )}

      {/* Side Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm">
          <div className="w-72 max-w-[80%] bg-[#0B0E14] border-r border-slate-800 h-full p-5 flex flex-col justify-between text-white overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-black text-lg text-white">Benix<span className="text-blue-500">.Space</span></h3>
                  <p className="text-[10px] text-slate-400">All in One. For Everyone.</p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Prominent Admin Indicator inside Drawer */}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Admin Dashboard</span>
                  </div>
                  <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.5 rounded-full font-bold">
                    PROMINENT
                  </span>
                </Link>
              )}

              {/* App Navigation Modules */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                  Ecosystem Apps
                </span>

                <button
                  onClick={() => handleAppClick('tv', '/tv')}
                  className="w-full p-2.5 rounded-2xl hover:bg-slate-800/80 flex items-center gap-3 text-xs font-bold text-slate-200 hover:text-white transition-all text-left"
                >
                  <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                    <Tv className="w-4 h-4" />
                  </div>
                  <span>Watch TV & Channels</span>
                </button>

                <button
                  onClick={() => handleAppClick('radio', '/radio')}
                  className="w-full p-2.5 rounded-2xl hover:bg-slate-800/80 flex items-center gap-3 text-xs font-bold text-slate-200 hover:text-white transition-all text-left"
                >
                  <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                    <Radio className="w-4 h-4" />
                  </div>
                  <span>Live Radio Stations</span>
                </button>

                <button
                  onClick={() => handleAppClick('kunda', '/dating')}
                  className="w-full p-2.5 rounded-2xl hover:bg-slate-800/80 flex items-center gap-3 text-xs font-bold text-slate-200 hover:text-white transition-all text-left"
                >
                  <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
                    <Heart className="w-4 h-4" />
                  </div>
                  <span>Kunda Space Dating</span>
                </button>

                <button
                  onClick={() => handleAppClick('voxify', '/music')}
                  className="w-full p-2.5 rounded-2xl hover:bg-slate-800/80 flex items-center gap-3 text-xs font-bold text-slate-200 hover:text-white transition-all text-left"
                >
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                    <Music className="w-4 h-4" />
                  </div>
                  <span>Voxify Choir & Music</span>
                </button>

                <button
                  onClick={() => handleAppClick('marketplace', '/marketplace')}
                  className="w-full p-2.5 rounded-2xl hover:bg-slate-800/80 flex items-center gap-3 text-xs font-bold text-slate-200 hover:text-white transition-all text-left"
                >
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span>Benix Marketplace</span>
                </button>

                <button
                  onClick={() => handleAppClick('games', '/games')}
                  className="w-full p-2.5 rounded-2xl hover:bg-slate-800/80 flex items-center gap-3 text-xs font-bold text-slate-200 hover:text-white transition-all text-left"
                >
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <span>Games & RollDice</span>
                </button>

                <button
                  onClick={() => handleAppClick('calc', '/calc')}
                  className="w-full p-2.5 rounded-2xl hover:bg-slate-800/80 flex items-center gap-3 text-xs font-bold text-slate-200 hover:text-white transition-all text-left"
                >
                  <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <span>EasyCalc Utilities</span>
                </button>
              </div>
            </div>

            {/* Bottom of Drawer */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              {user ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
                    <p className="font-bold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setIsDrawerOpen(false); }}
                    className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setIsDrawerOpen(false); setWizardAppKey('tv'); }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsDrawerOpen(false)} />
        </div>
      )}

      {/* Global Modals */}
      {showSearch && <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />}
      {showWallet && <WalletModal isOpen={showWallet} onClose={() => setShowWallet(false)} />}
      {wizardAppKey && (
        <AppAccessWizardModal
          isOpen={!!wizardAppKey}
          onClose={() => setWizardAppKey(null)}
          targetAppKey={wizardAppKey}
          onSuccess={() => setWizardAppKey(null)}
        />
      )}
    </>
  );
};
