import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { removeAuthToken } from '../../services/api';
import {
  LayoutDashboard, Layers, FileText, BarChart3, SearchCheck,
  Settings, LogOut, Menu, X, Rocket, ShieldCheck, Mail, Users, UserCheck
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    removeAuthToken();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Project Portfolio', path: '/admin/projects', icon: Layers },
    { name: 'Blog Articles CMS', path: '/admin/blog', icon: FileText },
    { name: 'Users & Editors', path: '/admin/users', icon: Users },
    { name: 'Visitor Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'SEO Health & Audit', path: '/admin/seo', icon: SearchCheck },
    { name: 'Company Settings', path: '/admin/settings/company', icon: Settings },
    { name: 'My Profile & Security', path: '/admin/profile', icon: UserCheck },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <img src="/logo.png" alt="NebeluRw Logo" className="w-9 h-9 object-contain" />
          <div>
            <span className="font-extrabold text-lg text-white block tracking-tight">BenixSpace</span>
            <span className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive(item.path)
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Admin User Card */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-2xl">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-slate-950 flex items-center justify-center font-bold text-sm">
              BB
            </div>
            <div className="truncate">
              <span className="block text-xs font-bold text-white truncate">Benir Benjamin</span>
              <span className="text-[10px] text-slate-400 block truncate">benirabok@gmail.com</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Rocket className="w-6 h-6 text-sky-400" />
          <span className="font-extrabold text-lg">BenixSpace Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {sidebarOpen && (
        <div className="md:hidden bg-slate-900 text-slate-300 p-4 space-y-2 border-b border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                  isActive(item.path) ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 text-red-400 font-bold text-sm"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
};
