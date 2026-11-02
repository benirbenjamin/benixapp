import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Zap, Plus, Video, Tv } from 'lucide-react';
import { AppAccessWizardModal } from '../modals/AppAccessWizardModal';
import { CreateMediaModal } from '../modals/CreateMediaModal';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [showWizard, setShowWizard] = useState(false);
  const [wizardTab, setWizardTab] = useState<'register' | 'login'>('login');
  const [showCreateMedia, setShowCreateMedia] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-t border-slate-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] px-3 py-2 flex items-center justify-around transition-all text-slate-400">
        
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            isActive('/') ? 'text-blue-500 font-black' : 'text-slate-400 hover:text-white'
          }`}
          title="Home"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Home</span>
        </Link>

        {/* 2. Shorts */}
        <Link
          to="/shorts"
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            isActive('/shorts') ? 'text-rose-500 font-black' : 'text-slate-400 hover:text-white'
          }`}
          title="Shorts"
        >
          <Zap className="w-5 h-5 text-rose-400" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Shorts</span>
        </Link>

        {/* 3. Elevated Center Action Button (+) - Post Story or Video */}
        <div className="relative -top-4 flex items-center justify-center">
          <button
            onClick={() => {
              if (!user) {
                setWizardTab('register');
                setShowWizard(true);
              } else {
                setShowCreateMedia(true);
              }
            }}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-500 via-indigo-600 to-blue-600 hover:from-rose-400 hover:to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 border-4 border-[#0B0E14] active:scale-95 transition-all"
            title="Post Story or Video"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Videos */}
        <Link
          to="/videos"
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            isActive('/videos') ? 'text-purple-400 font-black' : 'text-slate-400 hover:text-white'
          }`}
          title="Videos"
        >
          <Video className="w-5 h-5 text-purple-400" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Videos</span>
        </Link>

        {/* 5. Live TV */}
        <Link
          to="/tv"
          className={`flex flex-col items-center justify-center py-1 transition-all ${
            isActive('/tv') ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-white'
          }`}
          title="Live TV"
        >
          <Tv className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">Live TV</span>
        </Link>

      </nav>

      {/* Auth / Onboarding Wizard Modal */}
      {showWizard && (
        <AppAccessWizardModal
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          targetAppKey="tv"
          initialTab={wizardTab}
          onSuccess={() => setShowWizard(false)}
        />
      )}

      {/* Creator Media Modal (Post Story / Upload Video) */}
      {showCreateMedia && (
        <CreateMediaModal
          isOpen={showCreateMedia}
          onClose={() => setShowCreateMedia(false)}
        />
      )}
    </>
  );
};
