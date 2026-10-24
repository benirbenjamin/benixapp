import React, { useState, useRef, useEffect } from 'react';
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
  Plus,
  Smartphone,
  Download,
  Film,
  Megaphone,
  TrendingUp,
  LogIn,
  UserPlus,
  ChevronDown
} from 'lucide-react';
import { SearchModal } from '../modals/SearchModal';
import { AppAccessWizardModal } from '../modals/AppAccessWizardModal';
import { WalletModal } from '../modals/WalletModal';
import { NotificationTray } from '../modals/NotificationTray';
import { MessagesDrawer } from '../modals/MessagesDrawer';
import { CreateMediaModal } from '../modals/CreateMediaModal';
import { SubmitAdModal } from '../modals/SubmitAdModal';
import { usePwa } from '../../context/PwaContext';
import { useInAppActions } from '../../context/ActionNotificationContext';
import { useSidebar } from '../../context/SidebarContext';
import { formatCurrencyCompact } from '../../utils/formatCurrency';

export const Navbar: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showCreateMedia, setShowCreateMedia] = useState(false);
  const [showSubmitAd, setShowSubmitAd] = useState(false);
  const [wizardAppKey, setWizardAppKey] = useState<string | null>(null);
  const [wizardInitialTab, setWizardInitialTab] = useState<'register' | 'login'>('register');
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { user, wallet, logout, hasAppProfile } = useAuth();
  const { isInstalled, installApp } = usePwa();
  const { totalBadgeCount, inboxBadgeCount } = useInAppActions();
  const { toggleExpanded, openMobile } = useSidebar();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const handleMenuToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      toggleExpanded();
    } else {
      openMobile();
    }
  };

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
          <div className="flex items-center justify-between gap-1.5 sm:gap-3">
            
            {/* Left: Drawer Menu Button & Clickable Logo */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={handleMenuToggle}
                className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
                title="Toggle Sidebar Navigation"
              >
                <Menu className="w-5 h-5" />
                {totalBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-[#0B0E14] animate-pulse" />
                )}
              </button>

              <Link to="/" className="flex items-center shrink-0 group">
                <img
                  src="/logo.png"
                  alt="BenixSpace"
                  className="h-8 sm:h-9 w-auto max-w-[130px] sm:max-w-[180px] object-contain transition-transform group-hover:scale-105"
                />
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              
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

              {/* Submit Ad / Promote Campaign Button */}
              <button
                onClick={() => {
                  if (!user) {
                    setWizardAppKey('tv');
                  } else {
                    setShowSubmitAd(true);
                  }
                }}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-md shadow-amber-500/10 transition-all hover:scale-105 shrink-0"
                title="Create & Submit Ad Campaign (from 100 RWF)"
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" />
                <span className="hidden sm:inline">Submit Ad</span>
                <span className="sm:hidden">Ad</span>
              </button>

              {/* ADMIN DASHBOARD BUTTON - ONLY VISIBLE TO VERIFIED ADMINS (Hidden on mobile to keep header clean) */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden md:flex px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 hover:border-amber-400 text-amber-300 text-xs font-black items-center gap-1.5 shadow-lg shadow-amber-500/10 transition-all hover:scale-105"
                  title="Super Admin Control Center"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Admin Dashboard</span>
                </Link>
              )}

              {/* Wallet Pill if Logged In - Redirects to /dashboard#wallet */}
              {user && (
                <button
                  onClick={() => navigate('/dashboard#wallet')}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/25 transition-all"
                  title="View Central Wallet & Transactions"
                >
                  <WalletIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] sm:text-xs font-bold">{formatCurrencyCompact(Number(wallet?.balance ?? 0))}</span>
                </button>
              )}

              {/* Direct Messages Button - Hidden on mobile (present in bottom nav) */}
              <button
                onClick={() => {
                  if (!user) {
                    setWizardAppKey('dating');
                  } else {
                    navigate('/messages');
                  }
                }}
                className="hidden md:flex relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
                title="Direct Messages"
              >
                <MessageSquare className="w-5 h-5" />
                {inboxBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-[10px] font-black text-white flex items-center justify-center border-2 border-[#0B0E14] shadow-md">
                    {inboxBadgeCount}
                  </span>
                )}
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors"
                title="In-App Notifications & Actions"
              >
                <Bell className="w-5 h-5" />
                {totalBadgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-[10px] font-black text-white flex items-center justify-center border-2 border-[#0B0E14] shadow-md animate-pulse">
                    {totalBadgeCount}
                  </span>
                )}
              </button>

              {/* User Avatar Dropdown / Auth Buttons */}
              {user ? (
                <div className="relative" ref={avatarMenuRef}>
                  <button
                    onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                    className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-white text-xs border border-white/20 shadow-md hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    title={`Account Menu (${user.name})`}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </button>

                  {/* Avatar Dropdown Menu */}
                  {isAvatarMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-[#0F141F] border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* User Info Header */}
                      <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-xs truncate">{user.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-wider">
                              {user.role}
                            </span>
                          </div>
                        </div>

                        {/* Central Wallet Summary */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <WalletIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Wallet</span>
                          </div>
                          <button
                            onClick={() => {
                              setIsAvatarMenuOpen(false);
                              navigate('/dashboard#wallet');
                            }}
                            className="text-xs font-black text-emerald-400 hover:text-emerald-300"
                          >
                            {Number(wallet?.balance ?? 0).toLocaleString()} RWF
                          </button>
                        </div>
                      </div>

                      {/* Dropdown Navigation Links */}
                      <div className="space-y-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setIsAvatarMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-blue-400" />
                          <span>My Dashboard & Profile</span>
                        </Link>

                        <button
                          onClick={() => {
                            setIsAvatarMenuOpen(false);
                            setShowSubmitAd(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors text-left"
                        >
                          <Megaphone className="w-4 h-4 text-amber-400" />
                          <span>Submit Ad Campaign</span>
                        </button>

                        <Link
                          to="/dashboard#ads"
                          onClick={() => setIsAvatarMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                        >
                          <TrendingUp className="w-4 h-4 text-indigo-400" />
                          <span>Ad Campaigns & Analytics</span>
                        </Link>

                        <Link
                          to="/messages"
                          onClick={() => setIsAvatarMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 text-purple-400" />
                          <span>Direct Messages</span>
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsAvatarMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            <span>Admin Management</span>
                          </Link>
                        )}

                        <Link
                          to={isAdmin ? '/admin/settings' : '/dashboard#settings'}
                          onClick={() => setIsAvatarMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span>System & Profile Settings</span>
                        </Link>
                      </div>

                      {/* Divider & Log Out */}
                      <div className="mt-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setIsAvatarMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => {
                      setWizardInitialTab('login');
                      setWizardAppKey('tv');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white text-xs font-bold border border-slate-700/80 transition-all flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5 text-blue-400" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      setWizardInitialTab('register');
                      setWizardAppKey('tv');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-white" />
                    <span>Join</span>
                  </button>
                </div>
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

      {/* Notifications Modal with clickable destinations */}
      <NotificationTray
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onOpenWallet={() => navigate('/dashboard#wallet')}
      />

      {/* Side Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm">
          <div className="w-72 max-w-[80%] bg-[#0B0E14] border-r border-slate-800 h-full p-5 flex flex-col justify-between text-white overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <Link to="/" onClick={() => setIsDrawerOpen(false)} className="flex items-center">
                  <img src="/logo.png" alt="BenixSpace" className="h-7 w-auto object-contain" />
                </Link>
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

              {/* Actions & Inbox Menu Strip */}
              <div className="space-y-1.5 pb-2 border-b border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                  Actions & Inbox
                </span>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setShowNotifications(true);
                  }}
                  className="w-full p-2.5 rounded-2xl bg-[#121927] hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-xs font-bold text-white transition-all text-left shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span>Action Center & Alerts</span>
                  </div>
                  {totalBadgeCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse shadow-md">
                      {totalBadgeCount} New
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">All clear</span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    if (!user) {
                      setWizardAppKey('dating');
                    } else {
                      navigate('/messages');
                    }
                  }}
                  className="w-full p-2.5 rounded-2xl hover:bg-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span>Inbox & Messages</span>
                  </div>
                  {inboxBadgeCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black shadow-md">
                      {inboxBadgeCount}
                    </span>
                  ) : null}
                </button>

                {user && (
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      navigate('/dashboard#wallet');
                    }}
                    className="w-full p-2.5 rounded-2xl hover:bg-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                        <WalletIcon className="w-4 h-4" />
                      </div>
                      <span>Central Wallet</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {formatCurrencyCompact(Number(wallet?.balance ?? 0))}
                    </span>
                  </button>
                )}
              </div>

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
                  onClick={() => handleAppClick('videos', '/videos')}
                  className="w-full p-2.5 rounded-2xl hover:bg-slate-800/80 flex items-center gap-3 text-xs font-bold text-slate-200 hover:text-white transition-all text-left"
                >
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                    <Film className="w-4 h-4" />
                  </div>
                  <span>Creator Videos & Shows</span>
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
                  className="w-full p-2.5 rounded-2xl hover:bg-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
                      <Heart className="w-4 h-4" />
                    </div>
                    <span>Kunda Space Dating</span>
                  </div>
                  {user && !hasAppProfile('dating') && !hasAppProfile('kunda') && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase border border-rose-500/30 animate-pulse">
                      Action
                    </span>
                  )}
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

                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    if (!user) {
                      setWizardAppKey('tv');
                    } else {
                      setShowSubmitAd(true);
                    }
                  }}
                  className="w-full p-2.5 rounded-2xl hover:bg-slate-800/80 flex items-center gap-3 text-xs font-bold text-amber-300 hover:text-amber-200 transition-all text-left border border-amber-500/30 bg-amber-500/10 shadow-sm"
                >
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span>Submit Ad / Promote</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-black font-extrabold uppercase">From 100 RWF</span>
                    </div>
                    <span className="block text-[9px] text-amber-300/80 font-normal">Self-serve TV, Video, Story & Web ads</span>
                  </div>
                </button>
              </div>

              {/* PWA App Install Button (Hides when installed) */}
              {!isInstalled && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      installApp();
                    }}
                    className="w-full p-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/30 flex items-center justify-between transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-white" />
                      <span>Install Benix.Space App</span>
                    </div>
                    <Download className="w-4 h-4 text-blue-200" />
                  </button>
                </div>
              )}
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
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setWizardInitialTab('login');
                      setWizardAppKey('tv');
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <LogIn className="w-3.5 h-3.5 text-blue-400" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setWizardInitialTab('register');
                      setWizardAppKey('tv');
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-white" />
                    <span>Join</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsDrawerOpen(false)} />
        </div>
      )}

      {/* Global Modals */}
      {showSearch && <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />}
      {showWallet && <WalletModal isOpen={showWallet} onClose={() => setShowWallet(false)} />}
      {showCreateMedia && (
        <CreateMediaModal
          isOpen={showCreateMedia}
          onClose={() => setShowCreateMedia(false)}
        />
      )}
      {showSubmitAd && (
        <SubmitAdModal
          isOpen={showSubmitAd}
          onClose={() => setShowSubmitAd(false)}
          onOpenWallet={() => navigate('/dashboard#wallet')}
        />
      )}
      {wizardAppKey && (
        <AppAccessWizardModal
          isOpen={!!wizardAppKey}
          onClose={() => setWizardAppKey(null)}
          targetAppKey={wizardAppKey}
          initialTab={wizardInitialTab}
          onSuccess={() => setWizardAppKey(null)}
        />
      )}
    </>
  );
};
