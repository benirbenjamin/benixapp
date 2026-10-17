import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import { MessageCircle, Heart, X, Bell, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { registerServiceWorker, setAppBadge, showSystemNotification } from '../lib/pwa';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface PushToastItem {
  id: string;
  title: string;
  body: string;
  linkUrl?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playNotificationSound: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  requestPushPermission: () => Promise<void>;
  pushPermissionStatus: NotificationPermission | 'unsupported';
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activePushToast, setActivePushToast] = useState<PushToastItem | null>(null);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    return localStorage.getItem('kunda_sound') !== 'false';
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef<boolean>(false);
  const toastTimeoutRef = useRef<any>(null);
  const isFetchingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const backoffUntilRef = useRef<number>(0);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem('kunda_sound', String(enabled));
  };

  /**
   * Request browser push notification permission directly without external dependencies
   */
  const requestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPushPermissionStatus(permission);
        if (permission === 'granted') {
          playNotificationSound();
        }
      } catch (err) {
        console.warn('Push notification permission prompt notice:', err);
      }
    }
  };

  /**
   * Gentle, elegant chime synthesized natively using Web Audio API
   * Zero external MP3 asset dependency, instant, zero latency!
   */
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: B5 (987.77 Hz) - Bright, uplifting tone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.18, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (err) {
      console.warn('Audio playback not permitted yet by browser policy:', err);
    }
  };

  /**
   * Dispatches both Native OS System Tray Push Notification (Phone/PC) and In-App Push Toast
   */
  const triggerPushAlert = (item: NotificationItem) => {
    // 1. Play sound chime
    playNotificationSound();

    // 2. Native OS System Notification (Phone Tray & PC Action Center)
    showSystemNotification(item.title, {
      body: item.body,
      icon: '/logo.svg',
      badge: '/logo.svg',
      url: item.linkUrl || '/dashboard/messages',
      tag: item.id,
    });

    // 3. In-App Floating Push Toast
    setActivePushToast({
      id: item.id,
      title: item.title,
      body: item.body,
      linkUrl: item.linkUrl,
    });

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setActivePushToast(null);
    }, 6000);
  };

  const refreshNotifications = async () => {
    if (!token) return;
    if (isFetchingRef.current) return;
    if (Date.now() < backoffUntilRef.current) return;
    if (typeof document !== 'undefined' && document.hidden) return;

    isFetchingRef.current = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await api.get('/notifications', { signal: controller.signal });
      if (res.data?.success && Array.isArray(res.data.notifications)) {
        const fetched: NotificationItem[] = res.data.notifications;
        setNotifications(fetched);

        if (!initialLoadDoneRef.current) {
          // Record existing notification IDs on first load to prevent spamming old alerts
          fetched.forEach((n) => seenIdsRef.current.add(n.id));
          initialLoadDoneRef.current = true;
        } else {
          // Check for any newly arrived unread notifications
          for (const n of fetched) {
            if (!n.isRead && !seenIdsRef.current.has(n.id)) {
              seenIdsRef.current.add(n.id);
              triggerPushAlert(n);
              break; // Trigger for the latest new notification
            }
          }
        }
      }
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        // Ignored: request intentionally timed out or aborted
      } else {
        const status = err?.response?.status;
        if (status === 403 || status === 429) {
          // Rate-limited or challenged: back off for 30 seconds
          backoffUntilRef.current = Date.now() + 30000;
        }
      }
    } finally {
      clearTimeout(timeoutId);
      isFetchingRef.current = false;
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Auto-prompt browser notification permission on login if default
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          setTimeout(() => {
            requestPushPermission();
          }, 3000);
        }
      }

      refreshNotifications();
      const interval = setInterval(refreshNotifications, 15000); // 15s gentle polling
      return () => {
        clearInterval(interval);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    } else {
      initialLoadDoneRef.current = false;
      seenIdsRef.current.clear();
    }
  }, [isAuthenticated, token]);

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      await api.post('/notifications', { notificationId: id });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error('Mark notification read error:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      await api.post('/notifications', { markAll: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Mark all notifications read error:', err);
    }
  };

  // Register PWA Service Worker on app launch
  useEffect(() => {
    registerServiceWorker();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Sync PWA App Badge on Phone home screen & PC taskbar
  useEffect(() => {
    setAppBadge(unreadCount);
  }, [unreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        soundEnabled,
        setSoundEnabled,
        playNotificationSound,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        requestPushPermission,
        pushPermissionStatus,
      }}
    >
      {children}

      {/* In-App Floating Push Notification Toast Banner */}
      {activePushToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl border border-rose-100 shadow-float p-3.5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <MessageCircle className="w-5 h-5 fill-white/20" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 truncate">{activePushToast.title}</h4>
                <button
                  onClick={() => setActivePushToast(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{activePushToast.body}</p>

              {activePushToast.linkUrl && (
                <div className="pt-2 flex justify-end">
                  <a
                    href={activePushToast.linkUrl}
                    onClick={() => setActivePushToast(null)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <span>View & Reply</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
