import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { removeAuthToken } from '../../services/api';
import { useInAppActions } from '../../context/ActionNotificationContext';
import { NotificationTray } from '../modals/NotificationTray';
import {
  LayoutDashboard, Layers, FileText, BarChart3, SearchCheck, ArrowUpRight,
  Settings, LogOut, Menu, X, ShieldCheck, Users, UserCheck,
  Globe, ExternalLink, Film, ShoppingBag, Tv, Radio, Heart, Music, Gamepad2, Bell, Server
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [customLogo, setCustomLogo] = useState<string>('/logo.png');
  const { totalBadgeCount } = useInAppActions();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedLogo = localStorage.getItem('benix_platform_logo');
    if (savedLogo) {
      setCustomLogo(savedLogo);
    }
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    navigate('/admin/login');
  };

  const coreNavItems = [
    { name: 'Dashboard Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Users & Permissions', path: '/admin/users', icon: Users },
    { name: 'Withdrawals & Payouts', path: '/admin#withdrawals', icon: ArrowUpRight, badge: 'Payouts' },
    { name: 'Benix Cloud & VPS', path: '/cloud/admin', icon: Server, badge: 'Cloud' },
    { name: 'Project Portfolio', path: '/admin/projects', icon: Layers },
    { name: 'Blog Articles CMS', path: '/admin/blog', icon: FileText },
    { name: 'Visitor Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'SEO Health & Audit', path: '/admin/seo', icon: SearchCheck },
  ];

  const platformNavItems = [
    { name: 'Videos & Shows', path: '/admin#videos', icon: Film, badge: '94 Videos' },
    { name: 'Marketplace Store', path: '/admin#marketplace', icon: ShoppingBag, badge: 'Products' },
    { name: 'Live TV & Radio', path: '/admin#tv_radio', icon: Tv, badge: '36 Live' },
    { name: 'Kunda Dating Hub', path: '/admin#kunda', icon: Heart },
    { name: 'Voxify Choral Music', path: '/admin#voxify', icon: Music },
    { name: 'RollDice Games', path: '/admin#games', icon: Gamepad2 },
  ];

  const configNavItems = [
    { name: 'Platform Settings & Variables', path: '/admin/settings', icon: Settings },
    { name: 'My Profile & Security', path: '/admin/profile', icon: UserCheck },
  ];

  const isActive = (path: string) => {
    if (path.includes('#')) {
      return location.pathname === '/admin' && location.hash === path.substring(path.indexOf('#'));
    }
    if (path === '/cloud/admin') {
      return location.pathname === '/cloud/admin';
    }
    if (path === '/admin') {
      return location.pathname === '/admin' && !location.hash;
    }
    if (path === '/admin/settings') {
      return location.pathname === '/admin/settings' || location.pathname === '/admin/settings/company';
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#111724] text-slate-300 border-r border-slate-800 shrink-0">
        
        {/* Clickable Brand Logo Header */}
        <Link
          to="/"
          title="Go to BenixSpace Public Website"
          className="p-5 border-b border-slate-800 flex items-center gap-3 hover:bg-[#161D2E] transition-all group"
        >
          <img
            src={customLogo}
            alt="BenixSpace Logo"
            className="w-10 h-10 object-contain rounded-xl shadow-md group-hover:scale-105 transition-transform"
          />
          <div>
            <span className="font-black text-lg text-white block tracking-tight group-hover:text-blue-400 transition-colors">
              BenixSpace
            </span>
            <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Admin Console
            </span>
          </div>
        </Link>

        {/* Visit Public Website Action Button */}
        <div className="p-3">
          <Link
            to="/"
            target="_blank"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center justify-between transition-all group"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-white" />
              <span>Visit Public Website</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-1 space-y-4 overflow-y-auto">
          {/* Group 1: Core Operations */}
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 block">
              Core Operations
            </span>
            {coreNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:bg-[#161D2E] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Group 2: Ecosystem Platforms Content */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 px-3 block">
              Ecosystem Platforms
            </span>
            {platformNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive(item.path)
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-400 hover:bg-[#161D2E] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 text-purple-400" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Group 3: Configuration */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 block">
              Configuration
            </span>
            {configNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:bg-[#161D2E] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Admin User Card */}
        <div className="p-4 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center gap-3 bg-[#161D2E] p-3 rounded-2xl border border-slate-800/80">
            <div className="w-9 h-9 rounded-xl bg-blue-500 text-slate-950 flex items-center justify-center font-black text-xs">
              BB
            </div>
            <div className="truncate">
              <span className="block text-xs font-bold text-white truncate">Benir Benjamin</span>
              <span className="text-[10px] text-slate-400 block truncate">benirabok@gmail.com</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#111724] text-white p-4 flex items-center justify-between border-b border-slate-800">
        <Link to="/" className="flex items-center gap-2">
          <img src={customLogo} alt="BenixSpace Logo" className="w-7 h-7 object-contain rounded-lg" />
          <span className="font-black text-base text-white">BenixSpace Admin</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Mobile Admin Notification Bell */}
          <button
            onClick={() => setShowNotifications(true)}
            className="relative p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            title="Platform Activities"
          >
            <Bell className="w-5 h-5 text-amber-400" />
            {totalBadgeCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-600 text-[9px] font-black text-white flex items-center justify-center border-2 border-[#111724]">
                {totalBadgeCount}
              </span>
            )}
          </button>
          <Link
            to="/"
            className="p-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1"
            title="Visit Public Website"
          >
            <Globe className="w-4 h-4" />
            <span className="text-[11px]">Site</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {sidebarOpen && (
        <div className="md:hidden bg-[#111724] text-slate-300 p-4 space-y-3 border-b border-slate-800 max-h-[80vh] overflow-y-auto">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Visit Public Website</span>
            </span>
            <ExternalLink className="w-4 h-4" />
          </Link>

          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-2 block">
              Core Operations
            </span>
            {coreNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive(item.path) ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 px-2 block">
              Ecosystem Platforms
            </span>
            {platformNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive(item.path) ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-purple-400" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-2 block">
              Configuration
            </span>
            {configNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive(item.path) ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-bold text-xs"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      )}

      {/* Right Content Wrap with Sticky Top Header */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Top Header Bar with Live Bell */}
        <header className="hidden md:flex h-16 px-6 lg:px-10 bg-[#111724]/95 backdrop-blur-md border-b border-slate-800 items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm text-slate-200">
              Admin Console & Operations
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Platform
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700/60"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Public Website</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition-all shadow-md active:scale-95 border border-slate-700/60 cursor-pointer"
              title="Platform Activities & Alerts"
            >
              <Bell className="w-5 h-5 text-amber-400" />
              {totalBadgeCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-rose-600 text-[10px] font-black text-white flex items-center justify-center border-2 border-[#111724] shadow-md animate-pulse">
                  {totalBadgeCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto">
          <div className="w-full max-w-[1720px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* In-App Notifications Tray Modal for Admin */}
      <NotificationTray
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

    </div>
  );
};
