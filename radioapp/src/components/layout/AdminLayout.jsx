import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Palette,
  Radio,
  Calendar,
  Newspaper,
  Video,
  SlidersHorizontal,
  Settings,
  BarChart3,
  Globe,
  LogOut,
  Building2,
  Users,
  User,
  ShieldAlert,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../common/NotificationBell';

export function AdminLayout() {
  const { user, isSuperAdmin, isStationAdmin, assignedStations, activeAdminStation, switchActiveStation, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stationSelectOpen, setStationSelectOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const currentPath = location.pathname;

  // Station admin menu items
  const stationNavItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Appearance & Themes', path: '/admin/appearance', icon: Palette },
    { label: 'Radio Streams', path: '/admin/streams', icon: Radio },
    { label: 'Programs / Shows', path: '/admin/programs', icon: Calendar },
    { label: 'News CMS', path: '/admin/news', icon: Newspaper },
    { label: 'YouTube Videos', path: '/admin/videos', icon: Video },
    { label: 'Homepage Sections', path: '/admin/sections', icon: SlidersHorizontal },
    { label: 'Station Settings', path: '/admin/settings', icon: Settings },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  ];

  // Super admin specific menu items
  const superAdminNavItems = [
    { label: 'Overall Analytics', path: '/admin/superadmin/stats', icon: BarChart3 },
    { label: 'Radio Requests', path: '/admin/superadmin/requests', icon: Inbox },
    { label: 'Radio Stations', path: '/admin/superadmin/stations', icon: Building2 },
    { label: 'Administrators', path: '/admin/superadmin/admins', icon: Users },
    { label: 'Audit Logs', path: '/admin/superadmin/audit-logs', icon: ShieldAlert },
  ];

  const publicStationSlug = activeAdminStation?.slug || 'kigali-wave';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
        <div className="px-4 sm:px-6 flex items-center justify-between h-16">
          
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/admin" className="flex items-center gap-2.5 font-black text-lg text-white">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Radio className="w-5 h-5" />
              </div>
              <span className="hidden sm:inline">RadioAdmin Hub</span>
            </Link>

            {/* Station Switcher Dropdown (Super Admin or multiple stations) */}
            {(isSuperAdmin || assignedStations.length > 1) && (
              <div className="relative ml-2 sm:ml-4">
                <button
                  type="button"
                  onClick={() => setStationSelectOpen(!stationSelectOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="truncate max-w-[140px] sm:max-w-[180px]">
                    {activeAdminStation?.name || 'Select Station'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {stationSelectOpen && (
                  <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white text-slate-900 shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Station
                    </div>
                    {assignedStations.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => {
                          switchActiveStation(st);
                          setStationSelectOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-100 ${
                          st.id === activeAdminStation?.id ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{st.name}</span>
                        {st.is_default && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">Default</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Actions & User Info */}
          <div className="flex items-center gap-3">
            {/* Notification Bell Dropdown */}
            <NotificationBell />

            {/* View Public Station Site */}
            <a
              href={`/station/${publicStationSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Preview Website</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* User role badge */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs">
              <span className={`w-2 h-2 rounded-full ${isSuperAdmin ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className="font-semibold text-slate-300">
                {isSuperAdmin ? 'SUPER ADMIN' : 'STATION ADMIN'}
              </span>
            </div>

            {/* User info & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <Link
                to="/admin/profile"
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Manage profile & password"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px]">
                  {(user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs font-bold truncate max-w-[130px]">
                  {user?.full_name || user?.username}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto md:z-auto pt-16 md:pt-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col justify-between overflow-y-auto p-4 space-y-6">
            <div className="space-y-6">
              
              {/* Super Admin Navigation Group */}
              {isSuperAdmin && (
                <div>
                  <div className="px-3 mb-2 text-[10px] font-bold text-amber-700 bg-amber-50 rounded-md py-1 uppercase tracking-wider">
                    Super Admin Console
                  </div>
                  <nav className="space-y-1">
                    {superAdminNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = currentPath === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            active
                              ? 'bg-amber-100 text-amber-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${active ? 'text-amber-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              )}

              {/* Station Management Navigation Group */}
              <div>
                <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Station Content</span>
                  {activeAdminStation && (
                    <span className="text-[9px] text-indigo-600 font-extrabold truncate max-w-[90px]">
                      {activeAdminStation.name}
                    </span>
                  )}
                </div>
                <nav className="space-y-1">
                  {stationNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = currentPath === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                          active
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Account Settings Navigation Group */}
              <div>
                <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Account & Security
                </div>
                <nav className="space-y-1">
                  <Link
                    to="/admin/profile"
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      currentPath === '/admin/profile'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <User className={`w-4 h-4 ${currentPath === '/admin/profile' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Profile & Password</span>
                  </Link>
                </nav>
              </div>

            </div>

            {/* Bottom Station Info Card */}
            {activeAdminStation && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] font-bold text-slate-700 truncate">{activeAdminStation.name}</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">Slug: /{activeAdminStation.slug}</p>
              </div>
            )}

          </div>
        </aside>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}
