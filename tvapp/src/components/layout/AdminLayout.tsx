import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Video,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Tv,
  ExternalLink,
  Shield,
  User,
  Key,
  MessageSquare,
  Inbox,
  Mail,
  Megaphone,
  Coffee,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { getAdminFeedback } from '../../services/api';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadFeedback, setUnreadFeedback] = useState<number>(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperAdmin, logout } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    const checkUnread = async () => {
      try {
        const res = await getAdminFeedback({ status: 'UNREAD' });
        setUnreadFeedback(res.stats.unread || 0);
      } catch (err) {
        // Silently fail if unauthenticated or error
      }
    };
    checkUnread();
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Coffee Blessings ☕', path: '/admin/donations', icon: Coffee },
    { name: 'Feedback & Inquiries', path: '/admin/feedback', icon: Inbox, badge: unreadFeedback },
    { name: 'Custom Ads Engine', path: '/admin/ads', icon: Megaphone },
    { name: 'Stations & Live Streams', path: '/admin/stations', icon: Radio },
    { name: 'Videos & Bulletins', path: '/admin/videos', icon: Video },
    { name: 'Comments & Moderation', path: '/admin/moderation', icon: MessageSquare },
    { name: 'Analytics & Insights', path: '/admin/analytics', icon: BarChart3 },
    ...(isSuperAdmin ? [{ name: 'User Management', path: '/admin/users', icon: Users }] : []),
    { name: 'System Settings', path: '/admin/settings', icon: Settings },
    { name: 'Profile & Password', path: '/admin/profile', icon: Key },
  ];


  const isActive = (item: { path: string; exact?: boolean }) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-rba-navy text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <img
            src={settings.logo_url || '/logo.png'}
            alt="Logo"
            className="h-8 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
          <span className="font-bold text-sm text-rba-yellow">Admin Portal</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white/10 text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-rba-navy text-white flex flex-col justify-between p-4 shadow-xl transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="pb-6 mb-6 border-b border-white/10 flex items-center gap-3">
            <img
              src={settings.logo_url || '/logo.png'}
              alt="Logo"
              className="h-10 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div>
              <h2 className="font-extrabold text-sm text-white tracking-wide">Benix Control</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rba-blue/30 text-rba-blueLight border border-rba-blue/40 uppercase">
                {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-rba-blue text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>

              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Actions */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Tv className="w-3.5 h-3.5 text-rba-yellow" />
              View Public Website
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <Link to="/admin/profile" className="min-w-0 pr-2 block hover:opacity-80 transition-opacity">
              <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Administrator'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
