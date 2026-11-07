import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { usePwa } from './PwaContext';
import { notificationSound } from '../utils/notificationSound';
import { getAuthToken } from '../services/api';

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return 'Just now';
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export interface InAppActionItem {
  id: string;
  title: string;
  body: string;
  time: string;
  category: 'action' | 'wallet' | 'dating' | 'inbox' | 'system' | 'reward' | 'tv' | 'radio';
  route: string;
  actionLabel?: string;
  isActionable: boolean;
  unread: boolean;
  appKey?: string;
}

interface ActionNotificationContextType {
  items: InAppActionItem[];
  totalBadgeCount: number;
  inboxBadgeCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notif: { title: string; body: string; route?: string; category?: InAppActionItem['category']; actionLabel?: string }) => void;
  clearItem: (id: string) => void;
}

const ActionNotificationContext = createContext<ActionNotificationContextType>({
  items: [],
  totalBadgeCount: 0,
  inboxBadgeCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  addNotification: () => {},
  clearItem: () => {}
});

export const ActionNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, wallet, hasAppProfile } = useAuth();
  const { setBadgeCount, showTrayNotification } = usePwa();

  // Read dismissed actions/read notifications from localStorage
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('benix_read_notif_ids') || '[]');
    } catch {
      return [];
    }
  });

  // Custom user-triggered notifications
  const [customNotifications, setCustomNotifications] = useState<InAppActionItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('benix_custom_inapp_notifs') || '[]');
    } catch {
      return [];
    }
  });

  // Calculate dynamic real actionable tasks based on user state
  const computedActions = useMemo<InAppActionItem[]>(() => {
    const list: InAppActionItem[] = [];

    if (!user) {
      list.push({
        id: 'act_signin',
        title: 'Sign In to BenixSpace',
        body: 'Log in or create a free account to activate your wallet, access private messaging & claim rewards.',
        time: 'Action',
        category: 'action',
        route: '/dashboard',
        actionLabel: 'Sign In / Join',
        isActionable: true,
        unread: !readIds.includes('act_signin')
      });
      return list;
    }

    // 1. Kunda profile incomplete action
    if (!hasAppProfile('dating') && !hasAppProfile('kunda')) {
      list.push({
        id: 'act_kunda_setup',
        title: 'Complete Your Kunda Profile',
        body: 'Set your age, interests & photo to unlock Rwandan singles & receive direct messages.',
        time: 'Pending Action',
        category: 'dating',
        route: '/dating',
        actionLabel: 'Setup Kunda Profile',
        isActionable: true,
        appKey: 'dating',
        unread: !readIds.includes('act_kunda_setup')
      });
    }

    // 2. Unclaimed bonus or available wallet bonus
    if (wallet && Number(wallet.bonus_balance || 0) > 0) {
      list.push({
        id: 'act_bonus_ready',
        title: 'Activate Your Bonus Balance',
        body: `You have ${Number(wallet.bonus_balance).toLocaleString()} RWF bonus ready to spend on videos, TV & games.`,
        time: 'Wallet Action',
        category: 'wallet',
        route: '/dashboard#wallet',
        actionLabel: 'View Wallet',
        isActionable: true,
        unread: !readIds.includes('act_bonus_ready')
      });
    }

    // 3. Unverified account action
    if (user && !user.is_verified) {
      list.push({
        id: 'act_verify_account',
        title: 'Verify Your Account Email',
        body: 'Verify your account credentials to secure your balance and instant withdrawals.',
        time: 'Security Action',
        category: 'action',
        route: '/dashboard#profile',
        actionLabel: 'Verify Now',
        isActionable: true,
        unread: !readIds.includes('act_verify_account')
      });
    }

    // 4. Invite friends referral reward action
    if (user && user.referral_code) {
      list.push({
        id: 'act_referral_reward',
        title: 'Earn 1,000 RWF per Referral',
        body: `Share your referral code "${user.referral_code}" with friends to receive instant bonuses on each invite.`,
        time: 'Reward Action',
        category: 'reward',
        route: '/dashboard#referrals',
        actionLabel: 'Invite Friends',
        isActionable: true,
        unread: !readIds.includes('act_referral_reward')
      });
    }

    // 5. Welcome Concierge Message (Inbox action)
    const hasReadWelcome = localStorage.getItem('benix_welcome_inbox_read') === 'true';
    if (!hasReadWelcome) {
      list.push({
        id: 'act_welcome_inbox',
        title: 'New Message from Concierge',
        body: 'Welcome to Benix.Space! Tap to open your inbox and chat with our 24/7 team.',
        time: 'Inbox Message',
        category: 'inbox',
        route: '/messages',
        actionLabel: 'Open Inbox',
        isActionable: true,
        unread: !readIds.includes('act_welcome_inbox')
      });
    }

    return list;
  }, [user, wallet?.bonus_balance, hasAppProfile, readIds]);

  // Server-side real notifications (withdrawals, deposits, transfers, admin alerts)
  const [serverNotifications, setServerNotifications] = useState<InAppActionItem[]>([]);
  const knownNotificationIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef<boolean>(true);

  // Poll server notifications (user + admin activities)
  useEffect(() => {
    if (!user) {
      setServerNotifications([]);
      return;
    }

    const fetchServerNotifications = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        const isAdmin = user.role === 'admin' || user.role === 'superadmin';
        const endpoints = ['/api/notifications'];
        if (isAdmin) {
          endpoints.push('/api/admin/activities');
        }

        const responses = await Promise.all(
          endpoints.map((ep) =>
            axios.get(ep, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: {} }))
          )
        );

        const rawList: any[] = [];
        const seenRawIds = new Set<string>();

        responses.forEach((res) => {
          const list = res.data?.notifications || res.data?.activities || [];
          if (Array.isArray(list)) {
            list.forEach((item: any) => {
              const strId = String(item.id);
              if (!seenRawIds.has(strId)) {
                seenRawIds.add(strId);
                rawList.push(item);
              }
            });
          }
        });

        // Convert raw server records to InAppActionItem
        const mappedItems: InAppActionItem[] = rawList.map((n: any) => {
          const sId = `srv_${n.id}`;
          const isDeposit = n.type === 'deposit';
          const isWithdrawal = n.type === 'withdrawal';
          const isTransfer = n.type === 'transfer';
          const isChat = n.type === 'chat';

          let category: InAppActionItem['category'] = 'system';
          if (isDeposit || isWithdrawal || isTransfer) category = 'wallet';
          else if (isChat) category = 'inbox';

          let defaultRoute = '/dashboard#wallet';
          if (n.action_url) defaultRoute = n.action_url;
          else if (isWithdrawal && isAdmin) defaultRoute = '/admin#withdrawals';
          else if (isDeposit && isAdmin) defaultRoute = '/admin#withdrawals';

          let defaultActionLabel = 'View';
          if (isDeposit) defaultActionLabel = 'View Wallet';
          else if (isWithdrawal) defaultActionLabel = isAdmin ? 'Review Payout' : 'View Payout';
          else if (n.type === 'user_registered') defaultActionLabel = 'View Users';

          const timeAgo = formatTimeAgo(n.created_at);
          const isUnread = !n.is_read && !readIds.includes(sId) && !readIds.includes(String(n.id));

          return {
            id: sId,
            title: n.title,
            body: n.message,
            time: timeAgo,
            category,
            route: defaultRoute,
            actionLabel: defaultActionLabel,
            isActionable: true,
            unread: isUnread
          };
        });

        // Check for brand new incoming notifications
        mappedItems.forEach((item) => {
          if (!knownNotificationIdsRef.current.has(item.id)) {
            knownNotificationIdsRef.current.add(item.id);
            // Only trigger alert/push if this is not the initial load and it's unread
            if (!initialLoadRef.current && item.unread) {
              notificationSound.playNotificationChime();
              showTrayNotification(item.title, {
                body: item.body,
                url: item.route
              });
            }
          }
        });

        initialLoadRef.current = false;
        setServerNotifications(mappedItems);
      } catch (err) {
        console.warn('Could not fetch server notifications:', err);
      }
    };

    fetchServerNotifications();
    const interval = setInterval(fetchServerNotifications, 12000);
    return () => clearInterval(interval);
  }, [user, readIds, showTrayNotification]);

  // Dynamic real-time direct chat unread count from database
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      setUnreadChatCount(0);
      return;
    }

    const checkUnread = () => {
      const token = getAuthToken();
      if (!token) return;
      axios
        .get('/api/chat/unread-count', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (res.data?.success && typeof res.data.count === 'number') {
            const count = res.data.count;
            setUnreadChatCount((prev) => {
              if (count > prev && prev >= 0 && typeof window !== 'undefined') {
                const isMessagesRoute = window.location.pathname.startsWith('/messages');
                if (document.hidden || !isMessagesRoute) {
                  showTrayNotification('💬 New Message on Benix.Space', {
                    body: `You have ${count} unread chat message(s). Click to reply.`,
                    url: '/messages'
                  });
                }
              }
              return count;
            });
          }
        })
        .catch(() => {});
    };

    checkUnread();
    const interval = setInterval(checkUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Combine server activity notifications, computed actions and custom notifications
  const allItems = useMemo<InAppActionItem[]>(() => {
    return [...serverNotifications, ...computedActions, ...customNotifications];
  }, [serverNotifications, computedActions, customNotifications]);

  // Total unread/actionable items badge count
  const totalBadgeCount = useMemo(() => {
    return allItems.filter(item => item.unread).length + unreadChatCount;
  }, [allItems, unreadChatCount]);

  // Inbox specific badge count (actions related to inbox or real unread direct messages from chat)
  const inboxBadgeCount = useMemo(() => {
    const actionInboxCount = allItems.filter(item => item.unread && (item.category === 'inbox' || item.category === 'dating')).length;
    return unreadChatCount > 0 ? unreadChatCount : actionInboxCount;
  }, [allItems, unreadChatCount]);

  // Sync badge count with OS/PWA tray app badge
  useEffect(() => {
    setBadgeCount(totalBadgeCount);
  }, [totalBadgeCount, setBadgeCount]);

  const markAsRead = useCallback((id: string) => {
    setReadIds(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem('benix_read_notif_ids', JSON.stringify(next));
      return next;
    });

    if (id === 'act_welcome_inbox') {
      localStorage.setItem('benix_welcome_inbox_read', 'true');
    }

    // If server notification, notify backend
    if (id.startsWith('srv_')) {
      const rawId = id.replace('srv_', '');
      const token = getAuthToken();
      if (token) {
        axios.post(`/api/notifications/${rawId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
      }
    }

    setServerNotifications(prev =>
      prev.map(item => item.id === id ? { ...item, unread: false } : item)
    );

    setCustomNotifications(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, unread: false } : item);
      localStorage.setItem('benix_custom_inapp_notifs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const allIds = allItems.map(item => item.id);
    setReadIds(allIds);
    localStorage.setItem('benix_read_notif_ids', JSON.stringify(allIds));
    localStorage.setItem('benix_welcome_inbox_read', 'true');

    const token = getAuthToken();
    if (token) {
      axios.post('/api/notifications/read-all', {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }

    setServerNotifications(prev =>
      prev.map(item => ({ ...item, unread: false }))
    );

    setCustomNotifications(prev => {
      const updated = prev.map(item => ({ ...item, unread: false }));
      localStorage.setItem('benix_custom_inapp_notifs', JSON.stringify(updated));
      return updated;
    });
  }, [allItems]);

  const addNotification = useCallback((notif: {
    title: string;
    body: string;
    route?: string;
    category?: InAppActionItem['category'];
    actionLabel?: string;
  }) => {
    const newItem: InAppActionItem = {
      id: 'notif_' + Date.now(),
      title: notif.title,
      body: notif.body,
      time: 'Just now',
      category: notif.category || 'system',
      route: notif.route || '/dashboard',
      actionLabel: notif.actionLabel || 'View',
      isActionable: true,
      unread: true
    };

    setCustomNotifications(prev => {
      const next = [newItem, ...prev.slice(0, 19)]; // Keep latest 20
      localStorage.setItem('benix_custom_inapp_notifs', JSON.stringify(next));
      return next;
    });

    // Trigger OS System Tray push notification via Service Worker & chime sound
    showTrayNotification(notif.title, { body: notif.body, url: notif.route });
  }, [showTrayNotification]);

  const clearItem = useCallback((id: string) => {
    markAsRead(id);
    setCustomNotifications(prev => {
      const filtered = prev.filter(item => item.id !== id);
      localStorage.setItem('benix_custom_inapp_notifs', JSON.stringify(filtered));
      return filtered;
    });
  }, [markAsRead]);

  return (
    <ActionNotificationContext.Provider
      value={{
        items: allItems,
        totalBadgeCount,
        inboxBadgeCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        clearItem
      }}
    >
      {children}
    </ActionNotificationContext.Provider>
  );
};

export const useInAppActions = () => useContext(ActionNotificationContext);
