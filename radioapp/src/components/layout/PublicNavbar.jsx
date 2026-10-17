import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Radio, Menu, X, Play, Pause, Layers } from 'lucide-react';
import { useStation } from '../../context/StationContext';

export function PublicNavbar() {
  const { station, branding, isPlaying, togglePlay, basePath: contextBasePath, isCustomDomain } = useStation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const slug = station?.slug || '';
  const basePath = contextBasePath !== undefined ? contextBasePath : `/station/${slug}`;

  const navLinks = [
    { label: 'Home', path: basePath || '/' },
    { label: 'Schedule', path: `${basePath}/schedule` },
    { label: 'News', path: `${basePath}/news` },
    { label: 'Videos', path: `${basePath}/videos` },
    { label: 'Contact', path: `${basePath}/contact` },
  ];

  const isActive = (path) => {
    if ((path === basePath || path === '/') && (location.pathname === basePath || location.pathname === '/')) return true;
    if (path !== basePath && path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header
      className="sticky top-0 z-30 shadow-sm border-b transition-colors"
      style={{
        backgroundColor: branding?.header_color || '#FFFFFF',
        borderColor: 'rgba(226, 232, 240, 0.8)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Name */}
          <Link to={basePath || '/'} className="flex items-center gap-3.5 group">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={station?.name}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover ring-1 ring-slate-200 shadow-sm group-hover:scale-105 transition-transform"
              />
            ) : (
              <div
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-sm group-hover:scale-105 transition-transform"
                style={{ backgroundColor: branding?.primary_color || '#4F46E5' }}
              >
                <Radio className="w-6 h-6" />
              </div>
            )}

            <div className="min-w-0">
              <h1 className="font-extrabold text-lg sm:text-xl text-[var(--text-color)] tracking-tight leading-tight">
                {station?.name || 'Radio Platform'}
              </h1>
              {station?.slogan && (
                <p className="text-[11px] font-medium text-[var(--muted-color)] truncate max-w-[200px] sm:max-w-xs">
                  {station.slogan}
                </p>
              )}
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-slate-100/90 text-[var(--primary-color)] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  style={active ? { color: branding?.primary_color || '#4F46E5' } : {}}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Listen Live Button & Stations Portal */}
          <div className="hidden md:flex items-center gap-3">
            {!isCustomDomain ? (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Browse all radio stations"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span>All Stations</span>
              </Link>
            ) : (
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                title="Station Administrator Sign In"
              >
                <span>Station Login</span>
              </Link>
            )}

            <button
              onClick={togglePlay}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95"
              style={{ backgroundColor: branding?.primary_color || '#4F46E5' }}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>LISTEN LIVE</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2.5 rounded-full text-white shadow-sm"
              style={{ backgroundColor: branding?.primary_color || '#4F46E5' }}
              title="Play Live"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive(link.path)
                  ? 'bg-slate-100 text-[var(--primary-color)]'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>Browse All Stations</span>
            </Link>
            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Station Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
