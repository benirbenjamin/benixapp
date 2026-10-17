import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Tv, Radio, Info, Coffee } from 'lucide-react';
import { useCoffee } from '../../context/CoffeeContext';
import { usePlayer } from '../../context/PlayerContext';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { openCoffeeModal } = useCoffee();
  const { currentStation, isPlaying } = usePlayer();

  // If full-screen video is active or in admin panel, do not obscure screen
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'TV', path: '/tv', icon: Tv, isLive: true },
    { name: 'Radio', path: '/radio', icon: Radio },
    { name: 'About', path: '/about', icon: Info },
  ];

  // Offset bottom if radio player active
  const hasRadioPlayer = isPlaying && currentStation && currentStation.station_type === 'RADIO';

  return (
    <div
      className={`md:hidden fixed left-0 right-0 z-40 bg-rba-dark/95 border-t border-white/10 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-2xl transition-all duration-300 ${
        hasRadioPlayer ? 'bottom-16' : 'bottom-0'
      }`}
    >
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const active = isActive(item.path);

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-semibold transition-all relative ${
              active
                ? 'text-rba-yellow scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <IconComponent className={`w-5 h-5 ${active ? 'text-rba-yellow' : 'text-slate-400'}`} />
              {item.isLive && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </div>
            <span>{item.name}</span>
          </Link>
        );
      })}

      {/* Coffee Support Action */}
      <button
        onClick={() => openCoffeeModal(1)}
        className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-all active:scale-95"
      >
        <span className="text-base leading-none">☕</span>
        <span>Coffee</span>
      </button>
    </div>
  );
};
