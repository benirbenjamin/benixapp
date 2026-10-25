import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationSound } from '../utils/notificationSound';
import { SeoHead } from '../components/common/SeoHead';
import { AppAccessWizardModal } from '../components/modals/AppAccessWizardModal';
import { WalletModal } from '../components/modals/WalletModal';
import { formatCurrencyCompact } from '../utils/formatCurrency';
import { getAuthToken } from '../services/api';
import axios from 'axios';
import {
  MessageSquare,
  Send,
  Heart,
  ShieldCheck,
  CheckCheck,
  Search,
  ArrowLeft,
  Phone,
  Lock,
  Unlock,
  Wallet as WalletIcon,
  Users,
  Radio,
  UserPlus,
  Mic,
  MicOff,
  Smile,
  Paperclip,
  MoreVertical,
  Check,
  X,
  Play,
  Pause,
  AlertTriangle,
  ExternalLink,
  CircleDot,
  Globe,
  Sparkles,
  DollarSign,
  Info
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'them' | 'me';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  reaction?: string;
  isVoice?: boolean;
  voiceDuration?: string;
  isPaid?: boolean;
}

interface ChatConversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  partnerCity: string;
  tag: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageTime: string;
  verified: boolean;
  online: boolean;
  isGroup?: boolean;
  messages: ChatMessage[];
  phone?: string;
  privacyMode?: 'public' | 'private';
}

interface DirectoryContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  online: boolean;
  tag: string;
  city: string;
  privacyMode?: 'public' | 'private';
}

const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    partnerId: 'support',
    partnerName: 'Benix Support & Concierge',
    partnerAvatar: '/logo.png',
    partnerCity: 'Kigali, HQ',
    tag: 'Official Concierge',
    unreadCount: 0,
    lastMessage: 'Muraho! Welcome to Benix.Space. Our concierge team is available 24/7.',
    lastMessageTime: 'Today',
    verified: true,
    online: true,
    messages: [
      { id: 's1', sender: 'them', text: 'Muraho! Welcome to Benix.Space Unified Platform.', time: 'Today' },
      { id: 's2', sender: 'them', text: 'Our concierge team is available 24/7 if you need any assistance.', time: 'Today' }
    ]
  }
];

const QUICK_EMOJIS = ['❤️', '🔥', '😂', '😍', '👋', '✨', '🌹', '👍', '🙏', '💯'];

const ALL_NUMBER_WORDS_MAP: Record<string, string> = {
  // English
  zero: '0', oh: '0', one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  // Kinyarwanda
  zeru: '0', rimwe: '1', kabiri: '2', gatatu: '3', kane: '4',
  gatanu: '5', gatandatu: '6', karindwi: '7', umunani: '8', icyenda: '9', icumi: '10', mirongo: '',
  // French
  zéro: '0', un: '1', une: '1', deux: '2', trois: '3',
  quatre: '4', cinq: '5', sept: '7', huit: '8', neuf: '9', dix: '10',
  // Swahili
  sifuri: '0', moja: '1', mbili: '2', tatu: '3', nne: '4',
  tano: '5', sita: '6', saba: '7', nane: '8', tisa: '9', kumi: '10'
};

const SOCIAL_MEDIA_KEYWORDS = [
  'whatsapp', 'whatsap', 'whats app', 'wa.me', 'watsapp',
  'instagram', 'insta', 'telegram', 't.me', 'snapchat', 'facebook', 'tiktok',
  'call me on', 'reach me at', 'text me on',
  'hamagara kuri', 'unyandikire kuri', 'nimero yanjye', 'nimero yange',
  'appelle moi sur', 'mon numero est'
];

// Contact Moderation Rule: Block sending phone numbers in digits or words
function checkContactModerationText(message: string): { isViolation: boolean; reason?: string } {
  if (!message || typeof message !== 'string') return { isViolation: false };

  const rawLower = message.toLowerCase();

  // 1. Detect external links / social redirection keywords
  for (const p of SOCIAL_MEDIA_KEYWORDS) {
    if (rawLower.includes(p)) {
      return {
        isViolation: true,
        reason: `Direct contact redirection (${p}) is restricted. Use the official Unlock Phone button.`
      };
    }
  }

  // 2. Detect 7+ consecutive digits (e.g. 0783987223, +250788123456)
  const cleanedDigits = message.replace(/[\s.\-()+_]/g, '');
  if (cleanedDigits.match(/\d{7,15}/)) {
    return {
      isViolation: true,
      reason: 'Sharing personal phone numbers directly in chat is restricted by Benix privacy policy. Use the Unlock Phone button to securely view verified contact information.'
    };
  }

  // 3. Robust Number Words & Spelled Digits Detection across all languages
  const normalizedText = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s,.;:!?\-_/\\*~()+=@#]+/g, ' ')
    .trim();

  const tokens = normalizedText.split(' ').filter(Boolean);

  let numberWordsCount = 0;
  let translatedDigitStream = '';

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      numberWordsCount++;
      translatedDigitStream += token;
    } else if (ALL_NUMBER_WORDS_MAP[token] !== undefined) {
      numberWordsCount++;
      translatedDigitStream += ALL_NUMBER_WORDS_MAP[token];
    }
  }

  // If 3 or more number words/digits appear anywhere in the message
  if (numberWordsCount >= 3) {
    return {
      isViolation: true,
      reason: 'Spelling out phone numbers in words or digits is prohibited. Please use the secure Unlock Contact Phone option.'
    };
  }

  // If translated stream contains 6 or more digits or matches Rwandan mobile patterns (07... / 2507...)
  if (translatedDigitStream.length >= 6 || /07\d{4,}/.test(translatedDigitStream) || /2507\d{4,}/.test(translatedDigitStream)) {
    return {
      isViolation: true,
      reason: 'Sharing contact information in words or digits is restricted. Please use the official Unlock Phone feature.'
    };
  }

  // 4. Contact solicitation keywords combined with any digits/number words
  const solicitationPhrases = [
    'call me', 'hamagara', 'reach me', 'unyandikire', 'nimero', 'numero', 'contact me', 'text me'
  ];
  for (const phrase of solicitationPhrases) {
    if (rawLower.includes(phrase) && (numberWordsCount >= 2 || /\d{2,}/.test(message))) {
      return {
        isViolation: true,
        reason: 'Sharing direct contact information is prohibited. Use the verified Unlock Phone feature.'
      };
    }
  }

  return { isViolation: false };
}

export const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get('user');
  const queryUserName = searchParams.get('name');
  const queryUserAvatar = searchParams.get('avatar');

  const { user, wallet, refreshMe, updateWalletBalance } = useAuth();

  // WhatsApp Tab State
  const [activeTab, setActiveTab] = useState<'chats' | 'groups' | 'broadcasts' | 'contacts'>('chats');

  // Conversations & Contacts
  const [conversations, setConversations] = useState<ChatConversation[]>(INITIAL_CONVERSATIONS);
  const [activePartnerId, setActivePartnerId] = useState<string>(queryUserId || 'support');
  const [contacts, setContacts] = useState<DirectoryContact[]>([]);
  const [unlockedContactIds, setUnlockedContactIds] = useState<string[]>([]);
  const [unlockedPhones, setUnlockedPhones] = useState<Record<string, string>>({});

  const [mobileView, setMobileView] = useState<'list' | 'chat'>(queryUserId ? 'chat' : 'list');
  const [inputMessage, setInputMessage] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [animatingHeartId, setAnimatingHeartId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [contactUnlockPrice, setContactUnlockPrice] = useState<number>(500);
  const [creatorRevSharePct, setCreatorRevSharePct] = useState<number>(15);
  const [messageCost, setMessageCost] = useState<number>(50);
  const [freeMessagesLimit, setFreeMessagesLimit] = useState<number>(3);

  // Account Privacy & Monetization State (Public vs Private VIP Account)
  const [myPrivacyMode, setMyPrivacyMode] = useState<'public' | 'private'>((user as any)?.chat_privacy_mode || 'public');
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [isSwitchingPrivacy, setIsSwitchingPrivacy] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Partner Quota & Restriction State
  const [partnerStatus, setPartnerStatus] = useState<{
    partnerPrivacy: 'public' | 'private';
    isFree: boolean;
    freeRemaining: number | null;
    messageCost: number;
    revSharePct: number;
    sentCount: number;
  }>({
    partnerPrivacy: 'public',
    isFree: true,
    freeRemaining: null,
    messageCost: 50,
    revSharePct: 15,
    sentCount: 0
  });

  // Moderation violation warning
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

  // Scroll window to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
  }, []);

  // Group Creation Modal
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('/logo.png');
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([]);

  // Broadcast Message Modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedBroadcastRecipientIds, setSelectedBroadcastRecipientIds] = useState<string[]>([]);

  // Audio Voice Note Simulation
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // Broadcasts list from database
  const [broadcastsList, setBroadcastsList] = useState<any[]>([]);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const lastNotifiedMsgIdRef = useRef<string>('');
  const lastTotalUnreadRef = useRef<number>(0);

  // Load user's unlocked contacts list
  const fetchUnlockedContacts = () => {
    const token = getAuthToken();
    if (!token) return;
    axios
      .get('/api/chat/unlocked', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data?.unlockedContactIds && Array.isArray(res.data.unlockedContactIds)) {
          setUnlockedContactIds(res.data.unlockedContactIds);
        }
        if (res.data?.unlockedPhones && typeof res.data.unlockedPhones === 'object') {
          setUnlockedPhones((prev) => ({ ...prev, ...res.data.unlockedPhones }));
        }
      })
      .catch(() => {});
  };

  // Load registered contacts directory from database
  const fetchContacts = () => {
    const token = getAuthToken();
    axios
      .get('/api/chat/contacts', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      })
      .then((res) => {
        if (res.data?.contacts && Array.isArray(res.data.contacts)) {
          setContacts(res.data.contacts);
        }
      })
      .catch(() => {});
  };

  // Load conversations from PostgreSQL chat_direct_messages
  const fetchConversations = () => {
    const token = getAuthToken();
    if (!token) return;
    axios
      .get('/api/chat/conversations', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data?.conversations && Array.isArray(res.data.conversations)) {
          const incomingConvos: ChatConversation[] = res.data.conversations;
          const currentTotalUnread = incomingConvos.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

          if (currentTotalUnread > lastTotalUnreadRef.current && lastTotalUnreadRef.current !== 0) {
            notificationSound.playMessageSound();
            const topConvoWithUnread = incomingConvos.find((c) => c.unreadCount > 0);
            if (topConvoWithUnread) {
              notificationSound.requestPushPermissionAndSend(
                `💬 Message from ${topConvoWithUnread.partnerName}`,
                {
                  body: topConvoWithUnread.lastMessage || 'Sent you a direct message on Benix.Space',
                  url: `/messages?user=${topConvoWithUnread.partnerId}`
                }
              );
            }
          }
          lastTotalUnreadRef.current = currentTotalUnread;

          setConversations((prev) => {
            const map = new Map<string, ChatConversation>();
            // Keep support conversation
            const supportConvo = prev.find((c) => c.partnerId === 'support') || INITIAL_CONVERSATIONS[0];

            for (const c of incomingConvos) {
              const existing = prev.find((p) => p.partnerId === c.partnerId);
              map.set(c.partnerId, {
                ...c,
                messages: existing?.messages && existing.messages.length > 0 ? existing.messages : []
              });
            }

            // Put support at the end if not already in list
            if (!map.has('support')) {
              map.set('support', supportConvo);
            }

            for (const p of prev) {
              if (!map.has(p.partnerId)) map.set(p.partnerId, p);
            }

            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
  };

  // Load message history with specific partner from PostgreSQL
  const fetchMessages = (partnerId: string) => {
    if (!partnerId) return;
    const token = getAuthToken();
    if (!token) return;
    axios
      .get(`/api/chat/messages/${partnerId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data?.messages && Array.isArray(res.data.messages)) {
          const msgs: ChatMessage[] = res.data.messages;

          // Check if a new message from partner arrived
          if (msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.sender === 'them' && lastMsg.id !== lastNotifiedMsgIdRef.current) {
              lastNotifiedMsgIdRef.current = lastMsg.id;
              notificationSound.playMessageSound();
              if (document.hidden || !document.hasFocus()) {
                const partnerObj = conversations.find((c) => c.partnerId === partnerId);
                notificationSound.requestPushPermissionAndSend(
                  `💬 ${partnerObj?.partnerName || 'New Message'}`,
                  {
                    body: lastMsg.text || 'Sent an attachment',
                    url: `/messages?user=${partnerId}`
                  }
                );
              }
            }
          }

          setConversations((prev) =>
            prev.map((c) => {
              if (c.partnerId === partnerId) {
                return {
                  ...c,
                  unreadCount: 0,
                  messages: msgs
                };
              }
              return c;
            })
          );
        }
      })
      .catch(() => {});
  };

  // Load groups from PostgreSQL chat_groups
  const fetchGroups = () => {
    const token = getAuthToken();
    if (!token) return;
    axios
      .get('/api/chat/groups', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data?.groups && Array.isArray(res.data.groups)) {
          setConversations((prev) => {
            const map = new Map<string, ChatConversation>();
            for (const c of prev) map.set(c.partnerId, c);
            for (const g of res.data.groups) {
              if (!map.has(g.id)) {
                map.set(g.id, {
                  partnerId: g.id,
                  partnerName: g.name,
                  partnerAvatar: g.avatarUrl || '/logo.png',
                  partnerCity: `${g.membersCount || g.members?.length || 1} members`,
                  tag: 'Group Chat',
                  unreadCount: 0,
                  lastMessage: 'Group active',
                  lastMessageTime: 'Today',
                  verified: true,
                  online: true,
                  isGroup: true,
                  messages: []
                });
              }
            }
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
  };

  // Load broadcasts from PostgreSQL chat_broadcasts
  const fetchBroadcasts = () => {
    const token = getAuthToken();
    if (!token) return;
    axios
      .get('/api/chat/broadcasts', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data?.broadcasts && Array.isArray(res.data.broadcasts)) {
          setBroadcastsList(res.data.broadcasts);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnlockedContacts();
    fetchContacts();
    fetchConversations();
    fetchGroups();
    fetchBroadcasts();

    const token = getAuthToken();
    if (token) {
      axios
        .get('/api/chat/privacy-mode', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (res.data?.mode) setMyPrivacyMode(res.data.mode);
        })
        .catch(() => {});
    }

    axios
      .get('/api/chat/settings')
      .then((res) => {
        if (res.data) {
          if (res.data.contactUnlockPrice) setContactUnlockPrice(Number(res.data.contactUnlockPrice));
          if (res.data.creatorRevSharePct) setCreatorRevSharePct(Number(res.data.creatorRevSharePct));
          if (res.data.messageCost) setMessageCost(Number(res.data.messageCost));
          if (res.data.freeMessages) setFreeMessagesLimit(Number(res.data.freeMessages));
        }
      })
      .catch(() => {});
  }, [user]);

  // Load messages when active partner changes
  useEffect(() => {
    if (activePartnerId) {
      fetchMessages(activePartnerId);
    }
  }, [activePartnerId]);

  // Real-time Chat Polling (2.5 seconds) for instant messaging, delivered/read receipts and push notifications
  useEffect(() => {
    if (!user) return;

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const interval = setInterval(() => {
      fetchConversations();
      if (activePartnerId && activePartnerId !== 'support') {
        fetchMessages(activePartnerId);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [user, activePartnerId]);

  // Sync active partner's privacy mode & message restrictions
  useEffect(() => {
    if (!activePartnerId || activePartnerId === 'support') {
      setPartnerStatus({
        partnerPrivacy: 'public',
        isFree: true,
        freeRemaining: null,
        messageCost,
        revSharePct: creatorRevSharePct,
        sentCount: 0
      });
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setPartnerStatus({
        partnerPrivacy: 'public',
        isFree: true,
        freeRemaining: null,
        messageCost,
        revSharePct: creatorRevSharePct,
        sentCount: 0
      });
      return;
    }

    axios
      .get(`/api/chat/partner-status/${activePartnerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        if (res.data?.success) {
          setPartnerStatus({
            partnerPrivacy: res.data.partnerPrivacy || 'public',
            isFree: !!res.data.isFree,
            freeRemaining: res.data.freeRemaining,
            messageCost: res.data.messageCost || 50,
            revSharePct: res.data.revSharePct || 15,
            sentCount: res.data.sentCount || 0
          });
          if (res.data.contactUnlockPrice) {
            setContactUnlockPrice(Number(res.data.contactUnlockPrice));
          }
        }
      })
      .catch(() => {});
  }, [activePartnerId, user, messageCost, creatorRevSharePct]);

  // Handle Privacy Mode Switching (Public vs Private Account)
  const handleTogglePrivacyMode = async (targetMode: 'public' | 'private') => {
    const token = getAuthToken();
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    setIsSwitchingPrivacy(true);
    try {
      const res = await axios.post(
        '/api/chat/privacy-mode',
        { mode: targetMode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setMyPrivacyMode(targetMode);
        setToastMessage(res.data.message);
        setShowPrivacyModal(false);
        refreshMe();
        notificationSound.playNotificationChime();
      }
    } catch {
      alert('Failed to update account privacy mode. Please try again.');
    } finally {
      setIsSwitchingPrivacy(false);
    }
  };

  // If navigated with query params (e.g. from Kunda dating profile "Private Chat")
  useEffect(() => {
    if (queryUserId) {
      setActivePartnerId(queryUserId);
      setMobileView('chat');
      setConversations((prev) => {
        const exists = prev.find((c) => c.partnerId === queryUserId);
        if (exists) return prev;
        const newConvo: ChatConversation = {
          partnerId: queryUserId,
          partnerName: queryUserName ? decodeURIComponent(queryUserName) : 'Verified Member',
          partnerAvatar: queryUserAvatar ? decodeURIComponent(queryUserAvatar) : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
          partnerCity: 'Rwanda',
          tag: 'Direct Connection',
          unreadCount: 0,
          lastMessage: 'Conversation started',
          lastMessageTime: 'Just now',
          verified: true,
          online: true,
          messages: [
            {
              id: 'init_' + Date.now(),
              sender: 'them',
              text: `Muraho! Happy to connect with you on Benix.Space.`,
              time: 'Just now'
            }
          ]
        };
        return [newConvo, ...prev];
      });
    }
  }, [queryUserId, queryUserName, queryUserAvatar]);

  // Auto-scroll chat container to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversations, activePartnerId, mobileView]);

  const activeConversation =
    conversations.find((c) => c.partnerId === activePartnerId) || conversations[0];

  const isContactUnlocked = (partnerId: string): boolean => {
    if (partnerId === 'support') return true;
    return unlockedContactIds.includes(partnerId);
  };

  // Unlock contact phone handler (Deducts contactUnlockPrice RWF via central wallet)
  const handleUnlockContact = async (partnerId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const available = (wallet?.balance || 0) + (wallet?.bonus_balance || 0);
    if (available < contactUnlockPrice) {
      setShowWalletModal(true);
      return;
    }

    try {
      const token = getAuthToken();
      const res = await axios.post(
        '/api/chat/unlock-contact',
        { contactId: partnerId, price: contactUnlockPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        setUnlockedContactIds((prev) => Array.from(new Set([...prev, partnerId])));
        if (res.data.phone) {
          setUnlockedPhones((prev) => ({ ...prev, [partnerId]: res.data.phone }));
        }
        if (res.data.newBalance !== undefined) {
          updateWalletBalance(res.data.newBalance, res.data.newBonusBalance);
        }
        refreshMe();
        notificationSound.playNotificationChime();
        if (res.data.creatorEarned) {
          setToastMessage(`🎉 Contact unlocked! ${activeConversation.partnerName} received ${res.data.creatorEarned} RWF (${res.data.creatorSharePct}%) commission in their wallet.`);
        }
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to unlock contact phone.';
      if (err.response?.status === 400 && (errMsg.toLowerCase().includes('insufficient') || errMsg.toLowerCase().includes('wallet') || errMsg.toLowerCase().includes('funds'))) {
        alert(errMsg);
        setShowWalletModal(true);
      } else {
        alert(errMsg);
      }
    }
  };

  const handleSendMessage = (textToSend?: string, isVoice = false) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const text = (textToSend || inputMessage).trim();
    if (!text || !activeConversation) return;

    // Contact Moderation Check
    if (!isVoice) {
      const moderation = checkContactModerationText(text);
      if (moderation.isViolation) {
        setModerationWarning(moderation.reason || 'Direct phone sharing is restricted. Use the Unlock Phone button.');
        return;
      }
    }

    // Check Wallet Balance for Paid Messages to Private VIP Accounts
    const available = (wallet?.balance || 0) + (wallet?.bonus_balance || 0);
    if (activeConversation.partnerId !== 'support' && !partnerStatus.isFree && available < partnerStatus.messageCost) {
      setShowWalletModal(true);
      return;
    }

    setModerationWarning(null);

    const localMsgId = 'msg_' + Date.now();
    const newMsg: ChatMessage = {
      id: localMsgId,
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      isVoice,
      voiceDuration: isVoice ? '0:07' : undefined
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.partnerId === activeConversation.partnerId) {
          return {
            ...c,
            lastMessage: isVoice ? '🎤 Voice message' : text,
            lastMessageTime: 'Just now',
            messages: [...c.messages, newMsg]
          };
        }
        return c;
      })
    );

    if (!textToSend) setInputMessage('');
    notificationSound.playNotificationChime();

    // Call backend to handle pay-as-you-chat & creator split
    const token = getAuthToken();
    if (token && activeConversation.partnerId !== 'support') {
      axios
        .post(
          '/api/chat/send-message',
          {
            recipientId: activeConversation.partnerId,
            message: text,
            isVoice,
            voiceDuration: isVoice ? '0:07' : undefined
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then((res) => {
          if (res.data?.message) {
            setConversations((prev) =>
              prev.map((c) => {
                if (c.partnerId === activeConversation.partnerId) {
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === localMsgId
                        ? { ...m, id: res.data.message.id, status: res.data.message.status || 'delivered' }
                        : m
                    )
                  };
                }
                return c;
              })
            );
          }

          if (res.data?.isPaid) {
            if (res.data.newBalance !== undefined) {
              updateWalletBalance(res.data.newBalance, res.data.newBonusBalance);
            }
            refreshMe();
            setToastMessage(`💸 Paid message sent (${res.data.amountPaid} RWF). ${activeConversation.partnerName} received ${res.data.creatorEarning} RWF!`);
          }
          setPartnerStatus((prev) => ({
            ...prev,
            sentCount: prev.sentCount + 1,
            freeRemaining: prev.freeRemaining !== null ? Math.max(0, prev.freeRemaining - 1) : null,
            isFree: prev.freeRemaining !== null ? prev.freeRemaining - 1 > 0 : prev.isFree
          }));
          fetchConversations();
        })
        .catch((err) => {
          if (err.response?.data?.error === 'INSUFFICIENT_FUNDS') {
            setShowWalletModal(true);
          }
        });
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      const token = getAuthToken();
      const res = await axios.post(
        '/api/chat/groups/create',
        {
          name: groupName.trim(),
          avatarUrl: groupAvatar || '/logo.png',
          memberIds: selectedGroupMemberIds
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.group) {
        const newGroupConvo: ChatConversation = {
          partnerId: res.data.group.id,
          partnerName: res.data.group.name,
          partnerAvatar: res.data.group.avatarUrl || '/logo.png',
          partnerCity: `${res.data.group.members.length} members`,
          tag: 'Group Chat',
          unreadCount: 0,
          lastMessage: 'Group created',
          lastMessageTime: 'Just now',
          verified: true,
          online: true,
          isGroup: true,
          messages: [
            {
              id: 'grp_init_' + Date.now(),
              sender: 'them',
              text: `Welcome to "${res.data.group.name}"! Members can now chat and collaborate here.`,
              time: 'Just now'
            }
          ]
        };

        setConversations((prev) => [newGroupConvo, ...prev]);
        setActivePartnerId(newGroupConvo.partnerId);
        setShowGroupModal(false);
        setGroupName('');
        setSelectedGroupMemberIds([]);
        setMobileView('chat');
        setActiveTab('groups');
        fetchGroups();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create group');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim() || selectedBroadcastRecipientIds.length === 0) {
      alert('Please select recipients and enter a message.');
      return;
    }

    try {
      const token = getAuthToken();
      const res = await axios.post(
        '/api/chat/broadcast',
        {
          recipientIds: selectedBroadcastRecipientIds,
          message: broadcastMessage.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        alert(`Broadcast sent simultaneously to ${selectedBroadcastRecipientIds.length} contact(s)!`);
        setShowBroadcastModal(false);
        setBroadcastMessage('');
        setSelectedBroadcastRecipientIds([]);
        fetchBroadcasts();
        fetchConversations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to dispatch broadcast');
    }
  };

  const handleStartChatWithContact = (contact: DirectoryContact) => {
    const existing = conversations.find((c) => c.partnerId === contact.id);
    if (!existing) {
      const newConvo: ChatConversation = {
        partnerId: contact.id,
        partnerName: contact.name,
        partnerAvatar: contact.avatar,
        partnerCity: contact.city || 'Kigali, Rwanda',
        tag: contact.tag,
        unreadCount: 0,
        lastMessage: 'Conversation started',
        lastMessageTime: 'Just now',
        verified: true,
        online: contact.online,
        messages: [],
        phone: contact.phone,
        privacyMode: contact.privacyMode
      };
      setConversations((prev) => [newConvo, ...prev]);
    }
    setActivePartnerId(contact.id);
    fetchMessages(contact.id);
    setMobileView('chat');
    setActiveTab('chats');
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.partnerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.tag.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.tag.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.city.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="bg-[#0B141A] text-slate-100 min-h-[calc(100vh-4rem)] flex flex-col font-sans select-none">
      <SeoHead
        title="WhatsApp-Style Chat & Messenger — BenixSpace"
        description="Encrypted real-time messaging, group chats, broadcasts, and verified member contact unlocking."
      />

      <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-6 lg:px-8 py-3 flex-1 flex flex-col">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between py-2 border-b border-[#202C33] mb-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl bg-[#111B21] hover:bg-[#202C33] text-slate-300 hover:text-white transition-colors"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <span>Benix WhatsApp Messenger</span>
              </h1>
              <p className="text-[10px] text-slate-400">Direct chats, groups, broadcasts & verified contacts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Account Privacy & Monetization Switcher */}
            <button
              onClick={() => setShowPrivacyModal(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all shadow-sm ${
                myPrivacyMode === 'private'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/25'
              }`}
              title="Click to view benefits and switch between Public & Private VIP account anytime"
            >
              {myPrivacyMode === 'private' ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Private VIP</span>
                  <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold">
                    Earning {creatorRevSharePct}%
                  </span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Public Account</span>
                  <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded-full bg-blue-400/20 text-blue-200 font-extrabold">
                    Free Chat
                  </span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowWalletModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/25 transition-all"
            >
              <WalletIcon className="w-3.5 h-3.5" />
              <span>{formatCurrencyCompact(Number(wallet?.balance || 0))}</span>
            </button>
          </div>
        </div>

        {/* Global Toast Alert */}
        {toastMessage && (
          <div className="mb-3 p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center justify-between shadow-xl animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Unified 2-Column Split WhatsApp Layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 bg-[#111B21] border border-[#202C33] rounded-3xl overflow-hidden shadow-2xl min-h-[620px]">
          
          {/* ============================================================== */}
          {/* LEFT COLUMN: WhatsApp Sidebar (Tabs, Search, List)             */}
          {/* ============================================================== */}
          <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} md:col-span-4 border-r border-[#202C33] flex-col bg-[#111B21] h-[75vh] md:h-auto`}>
            
            {/* WhatsApp Navigation Tabs */}
            <div className="p-2 border-b border-[#202C33] bg-[#202C33]/60 flex items-center justify-between gap-1">
              <button
                onClick={() => setActiveTab('chats')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'chats'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-[#202C33]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chats</span>
              </button>

              <button
                onClick={() => setActiveTab('groups')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'groups'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-[#202C33]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Groups</span>
              </button>

              <button
                onClick={() => setActiveTab('broadcasts')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'broadcasts'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-[#202C33]'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Broadcast</span>
              </button>

              <button
                onClick={() => setActiveTab('contacts')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'contacts'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-[#202C33]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Contacts</span>
              </button>
            </div>

            {/* Search Bar & Action Buttons */}
            <div className="p-3 border-b border-[#202C33] bg-[#111B21] space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={activeTab === 'contacts' ? 'Search members & creators...' : 'Search chats & groups...'}
                  className="w-full pl-9 pr-3 py-2 bg-[#202C33] border border-[#2A3942] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {activeTab === 'groups' && (
                <button
                  onClick={() => setShowGroupModal(true)}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Create New Group</span>
                </button>
              )}

              {activeTab === 'broadcasts' && (
                <button
                  onClick={() => setShowBroadcastModal(true)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>New Broadcast Blast</span>
                </button>
              )}
            </div>

            {/* List Body: Conversations vs Contacts */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#202C33]/60">
              {activeTab === 'contacts' ? (
                filteredContacts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No contacts found. Register or follow creators to see them here.
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => handleStartChatWithContact(contact)}
                      className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#202C33]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={contact.avatar}
                            alt={contact.name}
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || 'Member')}&background=10B981&color=fff&bold=true`;
                            }}
                            className="w-10 h-10 rounded-full object-cover border border-[#2A3942]"
                          />
                          {contact.online && (
                            <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#111B21] absolute bottom-0 right-0" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{contact.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {contact.tag}
                            </span>
                            {contact.privacyMode === 'private' ? (
                              <span className="text-[8px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                🔒 VIP
                              </span>
                            ) : (
                              <span className="text-[8px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                                🌐 Free
                              </span>
                            )}
                          </h4>
                          <p className="text-[10px] text-slate-400">{contact.city}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChatWithContact(contact);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-sm"
                      >
                        Message
                      </button>
                    </div>
                  ))
                )
              ) : activeTab === 'broadcasts' ? (
                broadcastsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-3">
                    <Radio className="w-8 h-8 text-emerald-400/60 mx-auto" />
                    <p>No past broadcast blasts. Create a broadcast to message multiple contacts at once.</p>
                    <button
                      onClick={() => setShowBroadcastModal(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                    >
                      New Broadcast Blast
                    </button>
                  </div>
                ) : (
                  broadcastsList.map((b) => (
                    <div key={b.id} className="p-3.5 space-y-1 hover:bg-[#202C33]/40 border-b border-[#202C33]/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5" /> Broadcast to {b.recipientsCount} recipient(s)
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-white line-clamp-2">{b.message}</p>
                    </div>
                  ))
                )
              ) : (
                (activeTab === 'groups'
                  ? filteredConversations.filter((c) => c.isGroup)
                  : filteredConversations.filter((c) => !c.isGroup)
                ).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-3">
                    {activeTab === 'groups' ? (
                      <>
                        <Users className="w-8 h-8 text-emerald-400/60 mx-auto" />
                        <p>No group chats yet.</p>
                        <button
                          onClick={() => setShowGroupModal(true)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                        >
                          Create Group
                        </button>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-8 h-8 text-emerald-400/60 mx-auto" />
                        <p>No direct chats yet. Pick a contact from the Contacts tab to start chatting.</p>
                        <button
                          onClick={() => setActiveTab('contacts')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                        >
                          View Contacts
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  (activeTab === 'groups'
                    ? filteredConversations.filter((c) => c.isGroup)
                    : filteredConversations.filter((c) => !c.isGroup)
                  ).map((convo) => {
                    const isActive = convo.partnerId === activePartnerId;
                    return (
                      <div
                        key={convo.partnerId}
                        onClick={() => {
                          setActivePartnerId(convo.partnerId);
                          fetchMessages(convo.partnerId);
                          setMobileView('chat');
                        }}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                          isActive ? 'bg-[#2A3942]/70 border-l-4 border-emerald-500' : 'hover:bg-[#202C33]/40'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={convo.partnerAvatar}
                            alt={convo.partnerName}
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(convo.partnerName || 'Member')}&background=0D8ABC&color=fff&bold=true`;
                            }}
                            className="w-11 h-11 rounded-full object-cover border border-[#2A3942]"
                          />
                          {convo.online && (
                            <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#111B21] absolute bottom-0 right-0" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white truncate flex items-center gap-1">
                              <span>{convo.partnerName}</span>
                              {convo.verified && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
                            </h4>
                            <span className="text-[10px] text-slate-400">{convo.lastMessageTime}</span>
                          </div>
                          <span className="text-[9px] font-semibold text-emerald-400 block mt-0.5">
                            {convo.tag}
                          </span>
                          <div className="flex items-center justify-between mt-1 gap-2">
                            <p className="text-[11px] text-slate-300 truncate">
                              {convo.lastMessage}
                            </p>
                            {convo.unreadCount > 0 && (
                              <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-emerald-500 text-[10px] font-black text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                                {convo.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: Active WhatsApp Chat Room Stream                 */}
          {/* ============================================================== */}
          <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} md:col-span-8 flex-col bg-[#0B141A] h-[75vh] md:h-auto`}>
            {activeConversation ? (
              <>
                {/* Chat Room Header (WhatsApp Bar) */}
                <div className="p-3 sm:p-3.5 border-b border-[#202C33] flex items-center justify-between bg-[#202C33]">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <button
                      onClick={() => setMobileView('list')}
                      className="md:hidden p-2 rounded-xl bg-[#111B21] text-slate-300 hover:text-white"
                      title="Back to Chats"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="relative">
                      <img
                        src={activeConversation.partnerAvatar}
                        alt={activeConversation.partnerName}
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeConversation.partnerName || 'Member')}&background=0D8ABC&color=fff&bold=true`;
                        }}
                        className="w-10 h-10 rounded-full object-cover border border-[#2A3942]"
                      />
                      {activeConversation.online && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#202C33] absolute bottom-0 right-0" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                        <span>{activeConversation.partnerName}</span>
                        {activeConversation.verified && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-emerald-400">
                        {activeConversation.online ? 'Online' : 'Last seen recently'} • {activeConversation.partnerCity}
                      </p>
                    </div>
                  </div>

                  {/* Header Actions: Contact Unlocking & Privacy Status */}
                  <div className="flex items-center gap-2">
                    {activeConversation.partnerId !== 'support' && (
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl flex items-center gap-1 border ${
                        partnerStatus.partnerPrivacy === 'private'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                      }`}>
                        {partnerStatus.partnerPrivacy === 'private' ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                            <span>Private VIP</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-3 h-3 text-blue-400" />
                            <span>Public</span>
                          </>
                        )}
                      </span>
                    )}

                    {activeConversation.partnerId === 'support' ? (
                      <span className="text-[11px] font-bold text-slate-400 bg-[#111B21] px-3 py-1.5 rounded-xl border border-[#2A3942]">
                        24/7 Concierge
                      </span>
                    ) : isContactUnlocked(activeConversation.partnerId) ? (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://wa.me/${(unlockedPhones[activeConversation.partnerId] || activeConversation.phone || '250783987223').replace(/[^0-9]/g, '')}?text=Muraho!%20Connected%20via%20BenixSpace.`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <Phone className="w-3.5 h-3.5 fill-current" />
                          <span>WhatsApp Direct ({unlockedPhones[activeConversation.partnerId] || activeConversation.phone || '+250783987223'})</span>
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUnlockContact(activeConversation.partnerId)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        title={`Unlock verified personal WhatsApp phone number for ${contactUnlockPrice} RWF (${creatorRevSharePct}% goes to creator)`}
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Unlock Phone ({contactUnlockPrice} RWF)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Partner Quota & Restriction Notice */}
                {activeConversation.partnerId !== 'support' && (
                  partnerStatus.partnerPrivacy === 'private' ? (
                    <div className="px-3.5 py-1.5 bg-amber-950/40 border-b border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          {partnerStatus.isFree ? (
                            <>
                              <strong>Private VIP Account</strong>: First {freeMessagesLimit} messages free ({partnerStatus.freeRemaining ?? 3} left). Then {messageCost} RWF/msg ({creatorRevSharePct}% goes directly to {activeConversation.partnerName}).
                            </>
                          ) : (
                            <>
                              💎 <strong>Pay-As-You-Chat Active</strong>: {messageCost} RWF per message ({creatorRevSharePct}% goes to {activeConversation.partnerName}'s wallet).
                            </>
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                        {partnerStatus.isFree ? `${partnerStatus.freeRemaining} free left` : `${messageCost} RWF/msg`}
                      </span>
                    </div>
                  ) : (
                    <div className="px-3.5 py-1.5 bg-emerald-950/30 border-b border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          <strong>Public Account</strong>: All messages are 100% free! Unlocking WhatsApp ({contactUnlockPrice} RWF) rewards {activeConversation.partnerName} with {creatorRevSharePct}% commission.
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                        Free Chat
                      </span>
                    </div>
                  )
                )}

                {/* Moderation Warning Toast */}
                {moderationWarning && (
                  <div className="p-3 bg-rose-950/90 border-b border-rose-500/50 text-rose-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{moderationWarning}</span>
                    </div>
                    <button onClick={() => setModerationWarning(null)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Messages Stream Container (WhatsApp dark wallpaper pattern) */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#0B141A]"
                  style={{
                    backgroundImage: 'radial-gradient(#1c2930 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}
                >
                  <div className="text-center py-2">
                    <span className="text-[10px] bg-[#182229] text-slate-400 px-3 py-1 rounded-full shadow-sm">
                      🔒 Messages are end-to-end encrypted & moderated by Benix Security
                    </span>
                  </div>

                  {activeConversation.messages.map((msg) => {
                    const isMe = msg.sender === 'me';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group select-none`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl relative shadow-md text-xs leading-relaxed transition-all ${
                            isMe
                              ? 'bg-[#005C4B] text-white rounded-tr-none'
                              : 'bg-[#202C33] text-slate-100 rounded-tl-none border border-[#2A3942]/60'
                          }`}
                        >
                          {msg.isVoice ? (
                            <div className="flex items-center gap-3 py-1">
                              <button
                                onClick={() => setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id)}
                                className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shrink-0"
                              >
                                {playingVoiceId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                              </button>
                              <div className="flex-1">
                                <div className="h-1.5 w-32 bg-slate-600 rounded-full overflow-hidden">
                                  <div className={`h-full bg-emerald-400 ${playingVoiceId === msg.id ? 'w-full transition-all duration-3000' : 'w-1/3'}`} />
                                </div>
                                <span className="text-[9px] text-slate-400 mt-1 block">{msg.voiceDuration || '0:07'}</span>
                              </div>
                            </div>
                          ) : (
                            <p>{msg.text}</p>
                          )}

                          <div
                            className={`flex items-center gap-1 text-[9px] mt-1 ${
                              isMe ? 'text-emerald-200 justify-end' : 'text-slate-400 justify-start'
                            }`}
                          >
                            <span>{msg.time}</span>
                            {isMe && (
                              <span className="inline-flex items-center ml-0.5">
                                {msg.status === 'read' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-sky-400" title="Read" />
                                ) : msg.status === 'delivered' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-slate-300" title="Delivered" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-slate-300" title="Sent" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Emojis Strip */}
                <div className="px-4 py-1.5 border-t border-[#202C33] bg-[#202C33]/70 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSendMessage(emoji)}
                      className="p-1 rounded-lg hover:bg-[#2A3942] text-sm transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Message Input Composer */}
                {!user ? (
                  <div className="p-3 sm:p-4 border-t border-[#202C33] bg-[#202C33] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-300 text-xs">
                      <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Sign in or create a free account to send messages and connect directly.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(true)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all shrink-0 text-center"
                    >
                      Sign In / Register
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="p-2.5 sm:p-3 border-t border-[#202C33] bg-[#202C33] flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={`Type a message to ${activeConversation.partnerName}...`}
                      className="flex-1 bg-[#2A3942] border border-transparent focus:border-emerald-500 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none"
                    />

                    {/* Voice Note Record Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecordingVoice(true);
                        setTimeout(() => {
                          setIsRecordingVoice(false);
                          handleSendMessage('Voice note', true);
                        }, 2000);
                      }}
                      className={`p-2.5 rounded-2xl transition-all ${
                        isRecordingVoice ? 'bg-rose-600 text-white animate-pulse' : 'bg-[#2A3942] hover:bg-[#34444f] text-slate-300'
                      }`}
                      title="Record Voice Note"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    {activeConversation.partnerId !== 'support' && partnerStatus.partnerPrivacy === 'private' && !partnerStatus.isFree ? (
                      <button
                        type="submit"
                        disabled={!inputMessage.trim()}
                        className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-xs shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                        title={`Send Paid Message (${messageCost} RWF)`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline font-mono text-[11px]">{messageCost} RWF</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!inputMessage.trim()}
                        className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Send Message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-sm font-bold text-slate-400">Select a conversation to start messaging</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* New Group Chat Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111B21] border border-[#202C33] rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#202C33]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Create WhatsApp Group</span>
              </h3>
              <button onClick={() => setShowGroupModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kigali Tech Leaders"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#202C33] border border-[#2A3942] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Select Group Members</label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-[#202C33]/50 rounded-xl border border-[#2A3942]">
                  {contacts.map((c) => {
                    const isSelected = selectedGroupMemberIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedGroupMemberIds((prev) =>
                            isSelected ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          );
                        }}
                        className={`p-2 rounded-lg flex items-center justify-between cursor-pointer text-xs ${
                          isSelected ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-300 hover:bg-[#202C33]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={c.avatar}
                            alt={c.name}
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'Member')}&background=10B981&color=fff&bold=true`;
                            }}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span>{c.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#202C33] text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111B21] border border-[#202C33] rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#202C33]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>New Broadcast Dispatch</span>
              </h3>
              <button onClick={() => setShowBroadcastModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Select Recipients ({selectedBroadcastRecipientIds.length} selected)</label>
                <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-[#202C33]/50 rounded-xl border border-[#2A3942]">
                  {contacts.map((c) => {
                    const isSelected = selectedBroadcastRecipientIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedBroadcastRecipientIds((prev) =>
                            isSelected ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          );
                        }}
                        className={`p-2 rounded-lg flex items-center justify-between cursor-pointer text-xs ${
                          isSelected ? 'bg-emerald-600/20 text-emerald-300' : 'text-slate-300 hover:bg-[#202C33]'
                        }`}
                      >
                        <span>{c.name} ({c.city})</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Broadcast Message</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter message to send to all selected contacts simultaneously..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#202C33] border border-[#2A3942] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#202C33] text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md"
                >
                  Dispatch Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Privacy & Monetization Benefits Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111B21] border border-[#202C33] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-[#202C33]/60 hover:bg-[#202C33] transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-black uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" /> Account Privacy & Earnings Model
              </div>
              <h2 className="text-xl font-black text-white">Choose Your Chat Account Mode</h2>
              <p className="text-xs text-slate-400 mt-1">
                You can switch between <strong>Public Account</strong> and <strong>Private VIP Account</strong> anytime.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* PRIVATE VIP OPTION */}
              <div
                onClick={() => handleTogglePrivacyMode('private')}
                className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
                  myPrivacyMode === 'private'
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-xl shadow-amber-500/10'
                    : 'bg-[#202C33]/40 border-[#2A3942] hover:border-amber-500/40 hover:bg-[#202C33]/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>Private VIP Account</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold">
                          Recommended for Creators
                        </span>
                      </h4>
                      <p className="text-xs text-amber-300/90 font-bold">
                        Earn {creatorRevSharePct}% on Paid Messages & WhatsApp Unlocks
                      </p>
                    </div>
                  </div>
                  {myPrivacyMode === 'private' && (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <ul className="text-xs text-slate-300 space-y-2 pt-2.5 pl-1 border-t border-slate-700/50">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-black">✓</span>
                    <span>
                      <strong>Earn {creatorRevSharePct}% on Every Paid Message</strong>: Members receive {freeMessagesLimit} free messages. After that, they pay {messageCost} RWF per message, and <strong>{creatorRevSharePct}% ({Math.round(messageCost * creatorRevSharePct / 100)} RWF)</strong> is credited directly into your Central Wallet!
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-black">✓</span>
                    <span>
                      <strong>Earn {creatorRevSharePct}% on WhatsApp Unlocks</strong>: When someone pays {contactUnlockPrice} RWF to unlock your direct WhatsApp contact, you automatically receive <strong>{Math.round(contactUnlockPrice * creatorRevSharePct / 100)} RWF</strong>!
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-black">✓</span>
                    <span>
                      <strong>Spam & Distraction Shield</strong>: Filters out spam; only serious connections who truly value your time will message you.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-black">⭐</span>
                    <span>
                      <strong>VIP Gold Badge</strong>: Stand out across all chat, video, and dating directories as a verified creator.
                    </span>
                  </li>
                </ul>
              </div>

              {/* PUBLIC OPTION */}
              <div
                onClick={() => handleTogglePrivacyMode('public')}
                className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
                  myPrivacyMode === 'public'
                    ? 'bg-blue-500/10 border-blue-500/60 shadow-xl shadow-blue-500/10'
                    : 'bg-[#202C33]/40 border-[#2A3942] hover:border-blue-500/40 hover:bg-[#202C33]/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>Public Account</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-extrabold">
                          Free Open Chat
                        </span>
                      </h4>
                      <p className="text-xs text-blue-300/90 font-bold">
                        Anyone can message you for free • Still earn on WhatsApp unlocks
                      </p>
                    </div>
                  </div>
                  {myPrivacyMode === 'public' && (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                <ul className="text-xs text-slate-300 space-y-2 pt-2.5 pl-1 border-t border-slate-700/50">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 font-black">✓</span>
                    <span>
                      <strong>100% Free Messages</strong>: Any member or creator can send unlimited messages to you at zero cost, maximizing reach and networking.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-black">✓</span>
                    <span>
                      <strong>You STILL Earn {creatorRevSharePct}% on WhatsApp Unlocks</strong>: When a member unlocks your verified phone number ({contactUnlockPrice} RWF), you still receive your <strong>{creatorRevSharePct}% ({Math.round(contactUnlockPrice * creatorRevSharePct / 100)} RWF)</strong> cash reward!
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="flex-1 py-3 rounded-2xl bg-[#202C33] hover:bg-[#2A3942] text-slate-300 font-bold text-xs transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleTogglePrivacyMode(myPrivacyMode === 'public' ? 'private' : 'public')}
                disabled={isSwitchingPrivacy}
                className={`flex-1 py-3 rounded-2xl font-black text-xs text-white shadow-xl transition-all ${
                  myPrivacyMode === 'public'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-600/30'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30'
                }`}
              >
                {isSwitchingPrivacy ? 'Updating...' : myPrivacyMode === 'public' ? 'Activate Private VIP (Earn 15%)' : 'Switch to Public (Free Messages)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Wizard Modal */}
      {showAuthModal && (
        <AppAccessWizardModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          targetAppKey="dating"
          onSuccess={() => setShowAuthModal(false)}
        />
      )}

      {/* Wallet Deposit Modal */}
      {showWalletModal && (
        <WalletModal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
        />
      )}
    </div>
  );
};
