'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useChoir } from '@/lib/context/ChoirContext';
import { notificationService } from '@/lib/services/notificationService';
import { NotificationItem } from '@/lib/types/database.types';
import {
  Bell,
  CheckCircle2,
  Volume2,
  Calendar,
  Sparkles,
  CheckCheck,
  ExternalLink,
  MessageSquare,
  Loader2,
  BellOff,
  ShoppingBag,
  Wallet,
  AlertTriangle,
  DollarSign,
  UserPlus,
  Mic,
} from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { activeChoir } = useChoir();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      if (!user) return;
      setLoading(true);
      const data = await notificationService.getUserNotifications(user.id);
      setNotifications(data);
      setLoading(false);
    }
    loadNotifications();
  }, [user]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    setActionLoading(true);
    await notificationService.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setActionLoading(false);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIconForType = (type: string) => {
    switch (type) {
      case 'song':
      case 'song_published':
        return <Volume2 className="w-4 h-4 text-purple-400" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-indigo-400" />;
      case 'announcement':
        return <MessageSquare className="w-4 h-4 text-amber-400" />;
      case 'song_purchased':
      case 'purchase_success':
        return <ShoppingBag className="w-4 h-4 text-amber-400" />;
      case 'payout_approved':
        return <Wallet className="w-4 h-4 text-emerald-400" />;
      case 'payout_rejected':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'payout_request':
        return <DollarSign className="w-4 h-4 text-indigo-400" />;
      case 'user_registered':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'artist_registered':
        return <Mic className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getIconBgForType = (type: string) => {
    switch (type) {
      case 'song_purchased':
      case 'purchase_success':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60';
      case 'payout_approved':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
      case 'payout_rejected':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60';
      case 'payout_request':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60';
      case 'artist_registered':
      case 'song':
      case 'song_published':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60';
      case 'user_registered':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-900 dark:text-white py-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800 shadow-xs">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Live Notifications</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live updates, marketplace sales, payouts, and choir worship notices {activeChoir ? `for ${activeChoir.name}` : ''}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-blue-600/30 active:scale-95"
          >
            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs font-extrabold px-4 py-2 rounded-xl transition-all ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`text-xs font-extrabold px-4 py-2 rounded-xl transition-all ${
            filter === 'unread'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-xs">Loading live notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 p-8 shadow-sm">
          <BellOff className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Notifications</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {filter === 'unread'
              ? 'You have read all your notifications! Great job keeping up with your choir.'
              : 'No notifications available yet. You will be notified when new songs, events, or announcements are posted.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(n => {
            const cardContent = (
              <div
                key={n.id}
                className={`p-5 sm:p-6 rounded-3xl border transition-all flex items-start gap-4 shadow-sm ${
                  !n.is_read
                    ? 'bg-white dark:bg-slate-900 border-blue-500 dark:border-blue-500 shadow-md ring-1 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className={`p-3 rounded-2xl shrink-0 border mt-0.5 shadow-xs ${getIconBgForType(n.type)}`}>
                  {getIconForType(n.type)}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{n.title}</h3>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</p>

                  {n.link && (
                    <div className="pt-1.5 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      View details <ExternalLink className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {!n.is_read && (
                  <button
                    onClick={e => handleMarkAsRead(n.id, e)}
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                    title="Mark as Read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );

            if (n.link) {
              return (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => {
                    if (!n.is_read) notificationService.markAsRead(n.id);
                  }}
                  className="block"
                >
                  {cardContent}
                </Link>
              );
            }

            return <div key={n.id}>{cardContent}</div>;
          })}
        </div>
      )}
    </div>
  );
}
