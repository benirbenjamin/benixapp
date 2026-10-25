import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { usePlayer } from '../../context/PlayerContext';
import {
  Home,
  Tv,
  Radio,
  Film,
  Music,
  Heart,
  ShoppingBag,
  Gamepad2,
  Calculator,
  FileText,
  Sparkles,
  Wallet,
  MessageSquare,
  Megaphone,
  Briefcase,
  Info,
  Mail,
  ChevronDown,
  ChevronUp,
  X,
  LogIn,
  Play,
  Volume2,
  ExternalLink,
  ShieldCheck,
  Compass,
  Flame,
  RadioTower
} from 'lucide-react';
import { AppAccessWizardModal } from '../modals/AppAccessWizardModal';
import { SubmitAdModal } from '../modals/SubmitAdModal';
import { formatCurrencyCompact } from '../../utils/formatCurrency';

export const YouTubeSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isMoreExpanded, closeMobile, toggleMore, toggleExpanded } = useSidebar();
  const { user, wallet, hasAppProfile } = useAuth();
  const { playTvChannel, playStation } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const [wizardKey, setWizardKey] = useState<string | null>(null);

  // Automatically dismiss mobile drawer on route navigation to prevent black screen overlay
  useEffect(() => {
    closeMobile();
  }, [location.pathname, location.search]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeMobile]);
  const [showSubmitAd, setShowSubmitAd] = useState(false);

  const handleProtectedClick = (e: React.MouseEvent, appKey: string, route: string) => {
    e.preventDefault();
    closeMobile();
    if (!user) {
      setWizardKey(appKey);
    } else if (!hasAppProfile(appKey)) {
      setWizardKey(appKey);
    } else {
      navigate(route);
    }
  };

  const primaryPlatforms = [
    {
      id: 'home',
      name: 'Home',
      icon: Home,
      route: '/',
      badge: null,
      color: 'text-blue-400 group-hover:text-blue-300'
    },
    {
      id: 'tv',
      name: 'Watch TV',
      icon: Tv,
      route: '/tv',
      badge: '17 CH',
      live: true,
      color: 'text-indigo-400 group-hover:text-indigo-300'
    },
    {
      id: 'radio',
      name: 'Live Radio',
      icon: Radio,
      route: '/radio',
      badge: '19 FM',
      color: 'text-purple-400 group-hover:text-purple-300'
    },
    {
      id: 'videos',
      name: 'Creator Videos',
      icon: Film,
      route: '/videos',
      badge: 'Shows',
      color: 'text-cyan-400 group-hover:text-cyan-300'
    },
    {
      id: 'voxify',
      name: 'Voxify Music',
      icon: Music,
      route: '/music',
      badge: 'Choir',
      color: 'text-emerald-400 group-hover:text-emerald-300'
    },
    {
      id: 'kunda',
      name: 'Kunda Dating',
      icon: Heart,
      route: '/dating',
      badge: 'Singles',
      color: 'text-rose-400 group-hover:text-rose-300'
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      icon: ShoppingBag,
      route: '/marketplace',
      badge: 'Shop',
      color: 'text-amber-400 group-hover:text-amber-300'
    },
    {
      id: 'games',
      name: 'RollDice Arena',
      icon: Gamepad2,
      route: '/games',
      badge: 'Win 1.9x',
      color: 'text-violet-400 group-hover:text-violet-300'
    }
  ];

  const morePlatforms = [
    {
      id: 'calc',
      name: 'EasyCalc Pro',
      icon: Calculator,
      route: '/calculators',
      badge: 'Tax & Loan',
      color: 'text-teal-400'
    },
    {
      id: 'blog',
      name: 'News & Blog',
      icon: FileText,
      route: '/blog',
      badge: 'Articles',
      color: 'text-sky-400'
    },
    {
      id: 'studio',
      name: 'Creator Studio',
      icon: Sparkles,
      route: '/studio',
      badge: 'Earn 15%',
      color: 'text-amber-400'
    },
    {
      id: 'messages',
      name: 'Messages & Chat',
      icon: MessageSquare,
      route: '/messages',
      badge: null,
      color: 'text-purple-400'
    },
    {
      id: 'wallet',
      name: 'Central Wallet',
      icon: Wallet,
      route: '/dashboard#wallet',
      badge: wallet ? `${formatCurrencyCompact(Number(wallet.balance))}` : null,
      color: 'text-emerald-400'
    },
    {
      id: 'ads',
      name: 'Submit Ad',
      icon: Megaphone,
      action: 'create-ad',
      badge: 'From 100 RWF',
      color: 'text-amber-400'
    },
    {
      id: 'projects',
      name: 'Services & Projects',
      icon: Briefcase,
      route: '/projects',
      badge: null,
      color: 'text-slate-300'
    },
    {
      id: 'about',
      name: 'About BenixSpace',
      icon: Info,
      route: '/about',
      badge: null,
      color: 'text-slate-400'
    },
    {
      id: 'contact',
      name: 'Contact & Support',
      icon: Mail,
      route: '/contact',
      badge: null,
      color: 'text-slate-400'
    }
  ];

  // YouTube-like Subscriptions / Featured Stations
  const liveChannels = [
    { name: 'RTV Live Rwanda', type: 'TV', slug: 'rtv', logo: 'https://i.postimg.cc/zX3B3mR4/rtv.png', live: true },
    { name: 'KC2 Rwanda', type: 'TV', slug: 'kc2', logo: 'https://i.postimg.cc/j5GgH7rR/kc2.png', live: true },
    { name: 'Kiss FM 102.3', type: 'Radio', slug: 'kiss-fm', logo: 'https://i.postimg.cc/Cx2q12xV/kiss-fm.jpg', freq: '102.3 FM' },
    { name: 'Radio Rwanda', type: 'Radio', slug: 'radio-rwanda', logo: 'https://i.postimg.cc/85z1VfH9/radio-rwanda.png', freq: '100.7 FM' },
    { name: 'Flash FM 89.2', type: 'Radio', slug: 'flash-fm', logo: 'https://i.postimg.cc/9QvY5zGj/flash-fm.png', freq: '89.2 FM' },
    { name: 'TV10 Rwanda', type: 'TV', slug: 'tv10', logo: 'https://i.postimg.cc/k47tV1tq/tv10.png', live: true }
  ];

  const renderSidebarContent = (isDrawer = false) => (
    <div className="flex flex-col h-full select-none text-slate-300 text-sm">
      {/* Drawer Header (Only visible on mobile modal drawer) */}
      {isDrawer && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <Link to="/" onClick={closeMobile} className="flex items-center">
            <img src="/logo.png" alt="BenixSpace" className="h-7 w-auto object-contain" />
          </Link>
          <button
            onClick={closeMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Scrollable Nav Items */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        
        {/* SECTION 1: Primary Apps & Home */}
        <div className="space-y-0.5">
          {primaryPlatforms.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.route;
            const isProtected = ['tv', 'radio', 'videos', 'voxify', 'kunda', 'marketplace', 'games'].includes(item.id);

            return (
              <NavLink
                key={item.id}
                to={item.route}
                onClick={(e) => {
                  if (isProtected) {
                    handleProtectedClick(e, item.id, item.route);
                  } else {
                    if (isDrawer) closeMobile();
                  }
                }}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs sm:text-[13px] transition-all ${
                  isActive
                    ? 'bg-slate-800/90 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 transition-colors ${item.color}`} />
                  <span className="truncate">{item.name}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.live && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Live Broadcast" />
                  )}
                  {item.badge && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 text-slate-300 group-hover:text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* SECTION 2: Collapsible "Show More" / Options Menu */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1">
          <button
            onClick={toggleMore}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all group"
          >
            <div className="flex items-center gap-3.5">
              {isMoreExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
              )}
              <span>{isMoreExpanded ? 'Show fewer platforms' : 'Show more platforms'}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {isMoreExpanded ? '▲' : '▼'}
            </span>
          </button>

          {isMoreExpanded && (
            <div className="space-y-0.5 pl-1 animate-in fade-in slide-in-from-top-2 duration-200">
              {morePlatforms.map((item) => {
                const Icon = item.icon;
                const isExternal = !!(item as any).external;
                const isActive = item.route && location.pathname === item.route;

                if ((item as any).action === 'create-ad') {
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (isDrawer) closeMobile();
                        if (!user) {
                          setWizardKey('tv');
                        } else {
                          setShowSubmitAd(true);
                        }
                      }}
                      className="w-full group flex items-center justify-between px-3 py-2 rounded-xl text-xs text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 transition-all text-left"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Icon className="w-4 h-4 shrink-0 text-amber-400" />
                        <span className="truncate font-semibold">{item.name}</span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        100 RWF
                      </span>
                    </button>
                  );
                }

                if (isExternal) {
                  return (
                    <a
                      key={item.id}
                      href={item.external}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => { if (isDrawer) closeMobile(); }}
                      className="group flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  );
                }

                return (
                  <NavLink
                    key={item.id}
                    to={item.route!}
                    onClick={(e) => {
                      if (['calc'].includes(item.id)) {
                        handleProtectedClick(e, item.id, item.route!);
                      } else {
                        if (isDrawer) closeMobile();
                      }
                    }}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                      isActive
                        ? 'bg-slate-800/90 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: Subscriptions / Live Stations (YouTube Subscriptions Style) */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="px-3 py-1 flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Live Channels
            </span>
            <span className="text-[10px] text-blue-400 font-bold">17+ Live</span>
          </div>

          <div className="space-y-0.5">
            {liveChannels.map((ch, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (ch.type === 'TV') {
                    navigate('/tv');
                  } else {
                    navigate('/radio');
                  }
                  if (isDrawer) closeMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all group text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={ch.logo}
                      alt={ch.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                  </div>
                  <span className="truncate font-medium">{ch.name}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {ch.live ? (
                    <span className="text-[8px] font-black px-1 rounded bg-red-600/80 text-white uppercase">
                      LIVE
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-400 font-mono">{ch.freq}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 4: User Status or Auth Prompt */}
        {!user ? (
          <div className="pt-3 border-t border-slate-800/80 p-3 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-2.5">
            <p className="text-xs text-slate-300 leading-snug">
              Sign in to watch live TV, listen to radio, join Kunda dating, and manage your wallet.
            </p>
            <button
              onClick={() => {
                setWizardKey('tv');
                if (isDrawer) closeMobile();
              }}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Join</span>
            </button>
          </div>
        ) : (
          <div className="pt-3 border-t border-slate-800/80 p-3 bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Central Wallet
              </span>
              <span className="text-xs font-black text-emerald-400">
                {Number(wallet?.balance ?? 0).toLocaleString()} RWF
              </span>
            </div>
            <button
              onClick={() => {
                navigate('/dashboard#wallet');
                if (isDrawer) closeMobile();
              }}
              className="w-full py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/20 transition-all text-center"
            >
              Deposit / Withdraw
            </button>
          </div>
        )}

        {/* SECTION 5: Footer & Copyright (YouTube Style) */}
        <div className="pt-3 border-t border-slate-800/80 px-2 space-y-2 text-[11px] text-slate-400 leading-relaxed">
          <div className="flex flex-wrap gap-x-2 gap-y-1 font-medium">
            <NavLink to="/about" className="hover:text-slate-300">About</NavLink>
            <NavLink to="/terms" className="hover:text-slate-300">Terms</NavLink>
            <NavLink to="/privacy" className="hover:text-slate-300">Privacy</NavLink>
            <NavLink to="/contact" className="hover:text-slate-300">Contact</NavLink>
            <NavLink to="/blog" className="hover:text-slate-300">Blog</NavLink>
          </div>
          <p className="text-[10px] text-slate-400">© 2026 Benix.Space</p>
        </div>

      </div>

      {wizardKey && (
        <AppAccessWizardModal
          isOpen={!!wizardKey}
          onClose={() => setWizardKey(null)}
          targetAppKey={wizardKey}
          onSuccess={() => setWizardKey(null)}
        />
      )}
    </div>
  );

  // Compact Mini Sidebar (Rendered on desktop when collapsed, exactly like YouTube mini sidebar)
  const renderMiniSidebar = () => {
    const miniItems = [
      { id: 'home', name: 'Home', icon: Home, route: '/' },
      { id: 'tv', name: 'TV', icon: Tv, route: '/tv', live: true },
      { id: 'radio', name: 'Radio', icon: Radio, route: '/radio' },
      { id: 'videos', name: 'Videos', icon: Film, route: '/videos' },
      { id: 'voxify', name: 'Music', icon: Music, route: '/music' },
      { id: 'kunda', name: 'Dating', icon: Heart, route: '/dating' },
      { id: 'games', name: 'RollDice', icon: Gamepad2, route: '/games' }
    ];

    return (
      <aside className="hidden md:flex flex-col items-center w-[72px] shrink-0 bg-[#0B0E14] border-r border-slate-800/80 sticky top-14 h-[calc(100vh-56px)] py-3 px-1 space-y-2 select-none z-30">
        {miniItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.route;

          return (
            <NavLink
              key={item.id}
              to={item.route}
              className={`w-full flex flex-col items-center justify-center py-3 px-1 rounded-xl text-center group transition-all ${
                isActive
                  ? 'bg-slate-800/90 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                {item.live && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </div>
              <span className="text-[10px] tracking-tight truncate w-full">{item.name}</span>
            </NavLink>
          );
        })}

        <button
          onClick={toggleExpanded}
          className="w-full flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-800/40 transition-all text-center mt-auto"
          title="Expand Full Sidebar"
        >
          <ChevronDown className="w-4 h-4 mb-0.5 -rotate-90" />
          <span className="text-[9px] font-semibold">More</span>
        </button>
      </aside>
    );
  };

  return (
    <>
      {/* 1. Desktop Full Sidebar (Visible when isExpanded) */}
      {isExpanded ? (
        <aside className="hidden lg:block w-64 shrink-0 bg-[#0B0E14] border-r border-slate-800/80 sticky top-14 h-[calc(100vh-56px)] z-30 transition-all duration-200">
          {renderSidebarContent(false)}
        </aside>
      ) : (
        /* 2. Desktop Mini Sidebar (Visible when collapsed on desktop) */
        renderMiniSidebar()
      )}

      {/* 3. Mobile / Tablet Sliding Off-Canvas Drawer (Visible when isMobileOpen) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-72 max-w-[85%] bg-[#0B0E14] border-r border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </div>
          <div className="flex-1" onClick={closeMobile} />
        </div>
      )}

      {showSubmitAd && (
        <SubmitAdModal
          isOpen={showSubmitAd}
          onClose={() => setShowSubmitAd(false)}
          onOpenWallet={() => navigate('/dashboard#wallet')}
        />
      )}
    </>
  );
};
