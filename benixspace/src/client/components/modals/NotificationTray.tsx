import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePwa } from '../../context/PwaContext';
import { useInAppActions, InAppActionItem } from '../../context/ActionNotificationContext';
import { notificationSound } from '../../utils/notificationSound';
import {
  Bell,
  X,
  Tv,
  Radio,
  Heart,
  Wallet,
  Sparkles,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  LogIn,
  MessageSquare,
  ShieldCheck,
  Gift,
  ArrowRight
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenWallet?: () => void;
  onOpenVerify?: () => void;
}

export const NotificationTray: React.FC<Props> = ({ isOpen, onClose, onOpenWallet, onOpenVerify }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showTrayNotification } = usePwa();
  const { items, totalBadgeCount, markAsRead, markAllAsRead, clearItem } = useInAppActions();

  const [filter, setFilter] = useState<'all' | 'actions' | 'wallet' | 'broadcasts'>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(notificationSound.isEnabled());
  const [pushStatus, setPushStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    notificationSound.setEnabled(next);
    if (next) {
      notificationSound.playNotificationChime();
    }
  };

  const handleEnablePush = async () => {
    setPushStatus('Requesting notification permission...');
    const granted = await showTrayNotification('Benix.Space Notifications Active', {
      body: 'Real-time broadcast alerts and wallet notifications will appear in your system tray.'
    });

    if (granted) {
      setPushStatus('System Tray Notifications Active!');
    } else {
      setPushStatus('Tray notification permission granted or active.');
    }
    setTimeout(() => setPushStatus(''), 3000);
  };

  const handleClickItem = (item: InAppActionItem) => {
    notificationSound.playNotificationChime();
    markAsRead(item.id);
    onClose();

    if (item.id === 'act_verify_account' || item.title.toLowerCase().includes('verify your account')) {
      if (onOpenVerify) {
        onOpenVerify();
        return;
      }
    }

    if (item.category === 'wallet' && onOpenWallet && item.route.includes('#wallet')) {
      onOpenWallet();
    } else {
      navigate(item.route);
    }
  };

  const getCategoryIcon = (category: InAppActionItem['category']) => {
    switch (category) {
      case 'dating':
        return { icon: Heart, color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
      case 'wallet':
        return { icon: Wallet, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'inbox':
        return { icon: MessageSquare, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'reward':
        return { icon: Gift, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'tv':
        return { icon: Tv, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
      case 'radio':
        return { icon: Radio, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
      default:
        return { icon: Bell, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'actions') return item.isActionable && item.unread;
    if (filter === 'wallet') return item.category === 'wallet' || item.category === 'reward';
    if (filter === 'broadcasts') return item.category === 'tv' || item.category === 'radio';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:w-96 bg-[#0F1420] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-white font-sans mt-16 mr-0 sm:mr-4">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#131926]">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Bell className="w-4 h-4" />
              {totalBadgeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-600 text-[9px] font-black text-white flex items-center justify-center">
                  {totalBadgeCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-xs font-black text-white flex items-center gap-2">
                <span>In-App Notifications</span>
                {totalBadgeCount > 0 && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold border border-rose-500/30">
                    {totalBadgeCount} Pending Action{totalBadgeCount > 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400">Actions to be done & system alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleSound}
              className={`p-1.5 rounded-lg border transition-all ${
                soundEnabled
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                  : 'border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'Chime Sound Enabled' : 'Chime Sound Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills & Push Banner */}
        <div className="p-3 border-b border-slate-800 space-y-2 bg-[#111724]">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 text-xs overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('actions')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  filter === 'actions' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Actions ({totalBadgeCount})
              </button>
              {user && (
                <button
                  onClick={() => setFilter('wallet')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                    filter === 'wallet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Wallet
                </button>
              )}
              <button
                onClick={() => setFilter('broadcasts')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  filter === 'broadcasts' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Broadcasts
              </button>
            </div>

            {totalBadgeCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-blue-400 hover:underline font-semibold whitespace-nowrap ml-2"
              >
                Mark all done
              </button>
            )}
          </div>

          {/* Simple Push Notification in Tray activator */}
          <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <span className="text-slate-300">System Tray Push</span>
            <button
              onClick={handleEnablePush}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-colors"
            >
              Enable in Tray
            </button>
          </div>
          {pushStatus && (
            <div className="text-[10px] text-emerald-400 text-center font-semibold">
              {pushStatus}
            </div>
          )}
        </div>

        {/* Guest Callout when not logged in */}
        {!user && (
          <div className="m-3 p-3.5 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-xs space-y-2">
            <p className="text-slate-300 font-medium leading-relaxed text-[11px]">
              Sign in to your Benix.Space account to view pending actions, your wallet bonus, and direct messages.
            </p>
            <button
              onClick={() => {
                onClose();
                navigate('/dashboard');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In / Register</span>
            </button>
          </div>
        )}

        {/* Actionable Notification Cards List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
              <p className="font-semibold text-slate-300">All caught up!</p>
              <p className="text-[11px]">You have no pending actions or unread notifications.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const { icon: Icon, color } = getCategoryIcon(item.category);
              return (
                <div
                  key={item.id}
                  onClick={() => handleClickItem(item)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 group ${
                    item.unread
                      ? 'bg-[#151D2C] border-blue-500/40 hover:border-blue-400 shadow-md shadow-blue-500/5'
                      : 'bg-[#121824] border-slate-800/80 hover:border-slate-700 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl border shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                          <span>{item.title}</span>
                          {item.unread && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          )}
                        </h4>
                        <span className="text-[9px] text-slate-400 font-medium px-1.5 py-0.5 rounded-md bg-slate-800">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  </div>

                  {/* Action Button Strip */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">
                      {item.category}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClickItem(item);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                    >
                      <span>{item.actionLabel || 'Take Action'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
