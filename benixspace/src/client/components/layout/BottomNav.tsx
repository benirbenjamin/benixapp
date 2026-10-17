import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Home,
  Tv,
  Radio,
  Dices,
  ShoppingBag,
  Music,
  Heart,
  Calculator,
  LayoutDashboard,
  Wallet
} from 'lucide-react';

interface BottomNavProps {
  onOpenWallet?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenWallet }) => {
  const { user, wallet } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Available module map
  const moduleMap: Record<string, { name: string; path: string; icon: any }> = {
    videos: { name: 'TV', path: '/tv', icon: Tv },
    radio: { name: 'Radio', path: '/radio', icon: Radio },
    games: { name: 'Games', path: '/games', icon: Dices },
    marketplace: { name: 'Market', path: '/marketplace', icon: ShoppingBag },
    music: { name: 'Music', path: '/music', icon: Music },
    dating: { name: 'Kunda', path: '/dating', icon: Heart },
    calc: { name: 'Calc', path: '/calc', icon: Calculator }
  };

  // Determine which module tabs to show based on user's selected modules or default
  const userModules = user?.selected_modules && user.selected_modules.length > 0
    ? user.selected_modules
    : ['videos', 'radio', 'games', 'marketplace'];

  // Take the first 2-3 preferred modules for the mobile bar
  const displayedModules = userModules
    .filter((m) => moduleMap[m])
    .slice(0, 3)
    .map((m) => moduleMap[m]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 py-1.5 flex items-center justify-between transition-all">
      {/* 1. Home Link */}
      <Link
        to="/"
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
          isActive('/') ? 'text-sky-600 font-bold scale-105' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">{t('home')}</span>
      </Link>

      {/* 2. Dynamic Preferred Modules */}
      {displayedModules.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
              active ? 'text-sky-600 font-bold scale-105' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{item.name}</span>
          </Link>
        );
      })}

      {/* 3. Wallet Quick Balance Button */}
      {onOpenWallet ? (
        <button
          onClick={onOpenWallet}
          className="flex flex-col items-center justify-center py-1 px-2 text-emerald-600 font-bold"
        >
          <div className="relative">
            <Wallet className="w-5 h-5" />
            {wallet && wallet.balance > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-0.5">Wallet</span>
        </button>
      ) : (
        <Link
          to="/dashboard#wallet"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            isActive('/dashboard') ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Wallet</span>
        </Link>
      )}

      {/* 4. Unified Dashboard Link */}
      <Link
        to="/dashboard"
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
          isActive('/dashboard') ? 'text-sky-600 font-bold scale-105' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Dashboard</span>
      </Link>
    </nav>
  );
};
