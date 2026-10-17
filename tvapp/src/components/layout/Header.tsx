import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Radio,
  Tv,
  Search,
  Menu,
  X,
  ShieldAlert,
  ChevronRight,
  Volume2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlayer } from '../../context/PlayerContext';
import { useSettings } from '../../context/SettingsContext';
import { useCoffee } from '../../context/CoffeeContext';


export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { currentStation, isPlaying } = usePlayer();
  const { settings } = useSettings();
  const { openCoffeeModal } = useCoffee();


  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'TV', path: '/tv' },
    { name: 'Radio', path: '/radio' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-rba-navy text-white border-b border-rba-navyLight shadow-md">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <img
            src={settings.logo_url || '/logo.png'}
            alt={settings.site_name || 'Benix Space TV'}
            className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive(link.path)
                  ? 'bg-rba-blue text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right Search Input & Buy Coffee */}
        <div className="hidden lg:flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search radio, TV, videos..."
              className="w-48 xl:w-56 pl-9 pr-4 py-1.5 text-xs bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rba-blue focus:bg-white/15 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </form>

          <button
            onClick={() => openCoffeeModal(1)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-transform hover:scale-105"
          >
            <span className="text-sm">☕</span>
            <span>Buy Us a Coffee</span>
          </button>

          <Link
            to="/tv"
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            Watch Live
          </Link>
        </div>


        {/* Mobile Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/search"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-rba-navy border-t border-rba-navyLight px-4 pt-2 pb-6 space-y-3 animate-fadeIn">
          {/* Mobile Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stations, videos..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/10 border border-white/15 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rba-blue"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </form>

          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                  isActive(link.path)
                    ? 'bg-rba-blue text-white'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <span>{link.name}</span>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </Link>
            ))}
          </div>

          {/* Mobile Buy Me a Coffee Support Banner */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">☕</span>
              <div>
                <span className="text-xs font-bold text-amber-300 block">Support Our Stream</span>
                <span className="text-[10px] text-slate-300">Fuel 24/7 broadcasting</span>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openCoffeeModal(1);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md"
            >
              Buy Coffee
            </button>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
            <Link
              to="/tv"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-center text-sm shadow-md"
            >
              Watch RTV Live
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-rba-yellow text-rba-dark font-bold text-sm"
              >
                Admin
              </Link>
            )}
          </div>

        </div>
      )}
    </header>
  );
};
