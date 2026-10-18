import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Search, Plus, MessageSquare, User, ShieldCheck } from 'lucide-react';
import { SearchModal } from '../modals/SearchModal';
import { AppAccessWizardModal } from '../modals/AppAccessWizardModal';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showSearch, setShowSearch] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showInboxNotice, setShowInboxNotice] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-t border-slate-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] px-4 py-2 flex items-center justify-around transition-all text-slate-400">
        
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            isActive('/') ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Home</span>
        </Link>

        {/* 2. Search */}
        <button
          onClick={() => setShowSearch(true)}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            showSearch ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Search</span>
        </button>

        {/* 3. Elevated Center Action Button (+) */}
        <div className="relative -top-4 flex items-center justify-center">
          <button
            onClick={() => {
              if (!user) {
                setShowWizard(true);
              } else {
                navigate('/dashboard');
              }
            }}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 border-4 border-[#0B0E14] active:scale-95 transition-all"
            title="Create & Explore"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Inbox Message Room */}
        <Link
          to={user ? "/messages" : "/dating"}
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              setShowWizard(true);
            }
          }}
          className={`relative flex flex-col items-center justify-center py-1 transition-all ${
            isActive('/messages') ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-tight">Inbox</span>
        </Link>

        {/* 5. Profile / Admin */}
        <Link
          to={isAdmin ? '/admin' : (user ? '/dashboard' : '#')}
          onClick={(e) => {
            if (!user && !isAdmin) {
              e.preventDefault();
              setShowWizard(true);
            }
          }}
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            isActive('/dashboard') || isActive('/admin') ? 'text-blue-500 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          {isAdmin ? (
            <div className="relative">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="text-[10px] font-bold mt-1 tracking-tight">
            {isAdmin ? 'Admin' : (user ? 'Profile' : 'Join')}
          </span>
        </Link>

      </nav>

      {/* Search Modal */}
      {showSearch && <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />}

      {/* Auth / Onboarding Wizard Modal */}
      {showWizard && (
        <AppAccessWizardModal
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          targetAppKey="tv"
          onSuccess={() => setShowWizard(false)}
        />
      )}
    </>
  );
};
