import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { usePwa } from './PwaContext';
import { notificationSound } from '../utils/notificationSound';

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
  const { setBadgeCount } = usePwa();

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

  // Combine computed actions and custom notifications
  const allItems = useMemo<InAppActionItem[]>(() => {
    return [...computedActions, ...customNotifications];
  }, [computedActions, customNotifications]);

  // Total unread/actionable items badge count
  const totalBadgeCount = useMemo(() => {
    return allItems.filter(item => item.unread).length;
  }, [allItems]);

  // Inbox specific badge count (actions related to inbox or unread direct messages)
  const inboxBadgeCount = useMemo(() => {
    return allItems.filter(item => item.unread && (item.category === 'inbox' || item.category === 'dating')).length;
  }, [allItems]);

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

    // Play chime sound
    notificationSound.playNotificationChime();
  }, []);

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
