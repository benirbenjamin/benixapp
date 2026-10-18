import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CheckCircle2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenWallet?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  category: 'wallet' | 'tv' | 'radio' | 'dating' | 'system';
  route: string;
  icon: any;
  color: string;
  unread: boolean;
}

export const NotificationTray: React.FC<Props> = ({ isOpen, onClose, onOpenWallet }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'wallet' | 'broadcasts'>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(notificationSound.isEnabled());
  const [pushStatus, setPushStatus] = useState<string>('');

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Welcome Bonus Credited',
      body: '100 RWF has been deposited to your Central Wallet. Tap to view or transfer.',
      time: 'Just now',
      category: 'wallet',
      route: '/dashboard#wallet',
      icon: Wallet,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      unread: true
    },
    {
      id: 'n2',
      title: 'RTV Tele-Amakuru is Live',
      body: 'Rwanda Television evening broadcast is streaming live in Full HD.',
      time: '15m ago',
      category: 'tv',
      route: '/tv',
      icon: Tv,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      unread: true
    },
    {
      id: 'n3',
      title: 'Kiss FM 102.3 Kigali',
      body: 'Urban hits & Afrobeats mix currently broadcasting on Benix Radio FM.',
      time: '1h ago',
      category: 'radio',
      route: '/radio',
      icon: Radio,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      unread: true
    },
    {
      id: 'n4',
      title: 'Kunda Space Matchmaker',
      body: 'New verified Rwandan profiles match your dating preferences.',
      time: '3h ago',
      category: 'dating',
      route: '/dating',
      icon: Heart,
      color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      unread: false
    }
  ]);

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
    setPushStatus('Requesting browser permission...');
    const granted = await notificationSound.requestPushPermissionAndSend(
      'Benix.Space Notifications Active',
      { body: 'You will receive real-time updates for wallet transfers and live broadcasts.' }
    );
    if (granted) {
      setPushStatus('Web Push Enabled!');
    } else {
      setPushStatus('Permission not granted or unsupported in browser.');
    }
    setTimeout(() => setPushStatus(''), 3000);
  };

  const handleClickItem = (item: NotificationItem) => {
    notificationSound.playNotificationChime();
    // Mark as read
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, unread: false } : n));
    onClose();

    if (item.category === 'wallet' && onOpenWallet) {
      onOpenWallet();
    } else {
      navigate(item.route);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:w-96 bg-[#0F1420] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-white font-sans mt-16 mr-0 sm:mr-4">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#131926]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white flex items-center gap-2">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.2 rounded-full font-bold">
                    {unreadCount} New
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400">Platform telemetry, wallet & alerts</p>
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
            <div className="flex gap-1.5 text-xs">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('wallet')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  filter === 'wallet' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Wallet
              </button>
              <button
                onClick={() => setFilter('broadcasts')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  filter === 'broadcasts' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Broadcasts
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-blue-400 hover:underline font-semibold"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Simple Push Notification activator */}
          <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-800/70 border border-slate-700/60">
            <span className="text-slate-300">Browser Web Push</span>
            <button
              onClick={handleEnablePush}
              className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-colors"
            >
              Enable Push
            </button>
          </div>
          {pushStatus && (
            <div className="text-[10px] text-emerald-400 text-center font-semibold">
              {pushStatus}
            </div>
          )}
        </div>

        {/* Notification Cards List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {notifications
            .filter(n => {
              if (filter === 'wallet') return n.category === 'wallet';
              if (filter === 'broadcasts') return n.category === 'tv' || n.category === 'radio';
              return true;
            })
            .map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleClickItem(item)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 group ${
                    item.unread
                      ? 'bg-[#161F30] border-blue-500/40 hover:border-blue-400'
                      : 'bg-[#121824] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl border shrink-0 ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                        <span>{item.title}</span>
                        {item.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        )}
                      </h4>
                      <span className="text-[10px] text-slate-500">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 self-center" />
                </div>
              );
            })}
        </div>

      </div>
    </div>
  );
};
