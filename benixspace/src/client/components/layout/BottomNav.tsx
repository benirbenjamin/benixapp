import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useInAppActions } from '../../context/ActionNotificationContext';
import { Home, Zap, Plus, Video, Tv, MessageSquare, Music } from 'lucide-react';
import { AppAccessWizardModal } from '../modals/AppAccessWizardModal';
import { CreateMediaModal } from '../modals/CreateMediaModal';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const { inboxBadgeCount } = useInAppActions();
  const location = useLocation();
  const navigate = useNavigate();

  const [showWizard, setShowWizard] = useState(false);
  const [wizardTab, setWizardTab] = useState<'register' | 'login'>('login');
  const [showCreateMedia, setShowCreateMedia] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleChatClick = () => {
    if (!user) {
      setWizardTab('login');
      setShowWizard(true);
    } else {
      navigate('/messages');
    }
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0E14]/95 backdrop-blur-xl border-t border-slate-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] px-1.5 py-1.5 flex items-center justify-between transition-all text-slate-400">
        
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-0.5 transition-all ${
            isActive('/') ? 'text-blue-500 font-black' : 'text-slate-400 hover:text-white'
          }`}
          title="Home"
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-0.5 tracking-tight truncate">Home</span>
        </Link>

        {/* 2. Shorts */}
        <Link
          to="/shorts"
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-0.5 transition-all ${
            isActive('/shorts') ? 'text-rose-500 font-black' : 'text-slate-400 hover:text-white'
          }`}
          title="Shorts"
        >
          <Zap className="w-5 h-5 text-rose-400" />
          <span className="text-[9px] font-bold mt-0.5 tracking-tight truncate">Shorts</span>
        </Link>

        {/* 3. Music (Links to Voxify) */}
        <Link
          to="/voxify"
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-0.5 transition-all ${
            isActive('/voxify') || isActive('/music') ? 'text-cyan-400 font-black' : 'text-slate-400 hover:text-white'
          }`}
          title="Voxify Music"
        >
          <Music className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-0.5 tracking-tight truncate">Music</span>
        </Link>

        {/* 4. Elevated Center Action Button (+) - Post Story or Video */}
        <div className="relative -top-3 flex items-center justify-center shrink-0 mx-1">
          <button
            onClick={() => {
              if (!user) {
                setWizardTab('register');
                setShowWizard(true);
              } else {
                setShowCreateMedia(true);
              }
            }}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-500 via-indigo-600 to-blue-600 hover:from-rose-400 hover:to-blue-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 border-2 border-[#0B0E14] active:scale-95 transition-all"
            title="Post Story or Video"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 5. Chat (Direct Messages) */}
        <button
          onClick={handleChatClick}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-0.5 transition-all ${
            isActive('/messages') ? 'text-blue-400 font-black' : 'text-slate-400 hover:text-white'
          }`}
          title="Chat & Direct Messages"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {inboxBadgeCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-rose-600 text-[8px] font-black text-white flex items-center justify-center border border-[#0B0E14] animate-pulse">
                {inboxBadgeCount}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold mt-0.5 tracking-tight truncate">Chat</span>
        </button>

        {/* 6. Videos */}
        <Link
          to="/videos"
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-0.5 transition-all ${
            isActive('/videos') ? 'text-purple-400 font-black' : 'text-slate-400 hover:text-white'
          }`}
          title="Creator Videos"
        >
          <Video className="w-5 h-5 text-purple-400" />
          <span className="text-[9px] font-bold mt-0.5 tracking-tight truncate">Videos</span>
        </Link>

        {/* 7. Live TV */}
        <Link
          to="/tv"
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-0.5 transition-all ${
            isActive('/tv') ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-white'
          }`}
          title="Live TV"
        >
          <Tv className="w-5 h-5 text-emerald-400" />
          <span className="text-[9px] font-bold mt-0.5 tracking-tight truncate">Live TV</span>
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
