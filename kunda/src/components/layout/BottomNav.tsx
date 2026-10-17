import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  Compass,
  Heart,
  MessageCircle,
  User,
  Sparkles,
  Shield,
  Home,
  CheckCircle,
  Flame,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden">
      <div className="max-w-md mx-auto px-3 py-1.5 flex items-center justify-around">
        {isAuthenticated ? (
          <>
            {/* Discover */}
            <Link
              to="/dashboard/discover"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive('/dashboard/discover')
                  ? 'text-rose-600 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Compass className={`w-5 h-5 ${isActive('/dashboard/discover') ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">Discover</span>
            </Link>

            {/* Feed / Community Posts */}
            <Link
              to="/dashboard/feed"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive('/dashboard/feed')
                  ? 'text-rose-600 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Flame className={`w-5 h-5 ${isActive('/dashboard/feed') ? 'fill-rose-500 text-rose-600' : ''}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">Feed</span>
            </Link>

            {/* Matches */}
            <Link
              to="/dashboard/matches"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive('/dashboard/matches')
                  ? 'text-rose-600 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Heart className={`w-5 h-5 ${isActive('/dashboard/matches') ? 'fill-rose-500 stroke-rose-600' : ''}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">Matches</span>
            </Link>

            {/* Messages with live unread badge */}
            <Link
              to="/dashboard/messages"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive('/dashboard/messages')
                  ? 'text-rose-600 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <MessageCircle className={`w-5 h-5 ${isActive('/dashboard/messages') ? 'fill-rose-50 stroke-rose-600' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-xs animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">Messages</span>
            </Link>

            {/* Passes & Subscription */}
            <Link
              to="/dashboard/subscription"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive('/dashboard/subscription')
                  ? 'text-violet-600 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <Sparkles className={`w-5 h-5 ${isActive('/dashboard/subscription') ? 'stroke-[2.5] text-violet-600' : ''}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">Passes</span>
            </Link>

            {/* Profile */}
            <Link
              to="/dashboard/profile"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive('/dashboard/profile')
                  ? 'text-rose-600 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <User className={`w-5 h-5 ${isActive('/dashboard/profile') ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">Profile</span>
            </Link>

            {/* Admin (Only if Admin user) */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  isActive('/admin')
                    ? 'text-violet-700 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <Shield className="w-5 h-5 text-violet-600" />
                <span className="text-[10px] mt-0.5 tracking-tight">Admin</span>
              </Link>
            )}
          </>
        ) : (
          <>
            {/* Public Visitors Bottom Navigation */}
            <Link
              to="/"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive('/') ? 'text-rose-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Home</span>
            </Link>
            <Link
              to="/make-money"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive('/make-money') ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] mt-0.5 font-bold">Earn</span>
            </Link>
            <Link
              to="/membership"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive('/membership') ? 'text-rose-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Plans</span>
            </Link>
            <Link
              to="/safety"
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive('/safety') ? 'text-rose-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Safety</span>
            </Link>
            <Link
              to="/auth/register"
              className="flex flex-col items-center justify-center py-1 px-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl shadow-sm"
            >
              <Heart className="w-5 h-5 fill-white" />
              <span className="text-[10px] font-bold mt-0.5">Join</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};
