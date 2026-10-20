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
  CircleDot
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'them' | 'me';
  text: string;
  time: string;
  reaction?: string;
  isVoice?: boolean;
  voiceDuration?: string;
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

// Contact Moderation Rule: Block sending phone numbers directly in chat
function checkContactModerationText(message: string): { isViolation: boolean; reason?: string } {
  if (!message || typeof message !== 'string') return { isViolation: false };

  // Detect 7+ consecutive digits (e.g. 0783987223, +250788123456)
  const cleanedDigits = message.replace(/[\s.\-()+_]/g, '');
  if (cleanedDigits.match(/\d{7,15}/)) {
    return {
      isViolation: true,
      reason: 'Sharing personal phone numbers directly in chat is restricted by Benix privacy policy. Use the Unlock Phone button (500 RWF) to securely view verified contact information.'
    };
  }

  // Detect spelled numbers
  const numWords = ['zero', 'zeru', 'rimwe', 'kabiri', 'gatatu', 'kane', 'gatanu', 'gatandatu', 'karindwi', 'umunani', 'icyenda', 'icumi', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const words = message.toLowerCase().split(/[\s,.;:!?\-/]+/);
  let count = 0;
  for (const w of words) {
    if (numWords.includes(w)) {
      count++;
      if (count >= 4) {
        return {
          isViolation: true,
          reason: 'Spelling out phone numbers is prohibited. Please use the secure Unlock Contact Phone option.'
        };
      }
    }
  }

  // Detect direct external link invites
  const lower = message.toLowerCase();
  const prohibited = ['wa.me/', 'whatsapp.com/channel', 't.me/', 'call me on', 'reach me at', 'hamagara kuri', 'nimero yanjye'];
  for (const p of prohibited) {
    if (lower.includes(p)) {
      return {
        isViolation: true,
        reason: 'Direct contact redirection is restricted. Use the official Unlock Contact Phone feature.'
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

  // Moderation violation warning
  const [moderationWarning, setModerationWarning] = useState<string | null>(null);

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

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    fetchUnlockedContacts();
    fetchContacts();
    axios
      .get('/api/chat/settings')
      .then((res) => {
        if (res.data?.contactUnlockPrice) {
          setContactUnlockPrice(Number(res.data.contactUnlockPrice));
        }
      })
      .catch(() => {});
  }, [user]);

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
      }
    } catch (err: any) {
      if (err.response?.data?.error === 'INSUFFICIENT_FUNDS') {
        setShowWalletModal(true);
      } else {
        alert(err.response?.data?.message || 'Failed to unlock contact phone.');
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

    setModerationWarning(null);

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

    // Auto-reply simulation for responsive interactive feel
    if (activeConversation.partnerId !== 'support') {
      setTimeout(() => {
        const replyMsg: ChatMessage = {
          id: 'rep_' + Date.now(),
          sender: 'them',
          text: `Thank you for your message! Connected via Benix.Space.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setConversations((prev) =>
          prev.map((c) => {
            if (c.partnerId === activeConversation.partnerId) {
              return {
                ...c,
                lastMessage: replyMsg.text,
                lastMessageTime: 'Just now',
                messages: [...c.messages, replyMsg]
              };
            }
            return c;
          })
        );
        notificationSound.playNotificationChime();
      }, 1400);
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
        setActiveTab('chats');
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
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to dispatch broadcast');
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
        messages: [
          {
            id: 'convo_' + Date.now(),
            sender: 'them',
            text: `Muraho! Happy to connect with you on Benix.Space.`,
            time: 'Just now'
          }
        ],
        phone: contact.phone
      };
      setConversations((prev) => [newConvo, ...prev]);
    }
    setActivePartnerId(contact.id);
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
            <button
              onClick={() => setShowWalletModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/25 transition-all"
            >
              <WalletIcon className="w-3.5 h-3.5" />
              <span>{formatCurrencyCompact(Number(wallet?.balance || 0))}</span>
            </button>
          </div>
        </div>

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
              ) : (
                filteredConversations.map((convo) => {
                  const isActive = convo.partnerId === activePartnerId;
                  return (
                    <div
                      key={convo.partnerId}
                      onClick={() => {
                        setActivePartnerId(convo.partnerId);
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
                        <p className="text-[11px] text-slate-300 truncate mt-1">
                          {convo.lastMessage}
                        </p>
                      </div>
                    </div>
                  );
                })
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

                  {/* Header Actions: Contact Unlocking (500 RWF) */}
                  <div className="flex items-center gap-2">
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
                        title={`Unlock verified personal WhatsApp phone number for ${contactUnlockPrice} RWF`}
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Unlock Phone ({contactUnlockPrice} RWF)</span>
                      </button>
                    )}
                  </div>
                </div>

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
                            {isMe && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
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

                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Send Message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
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
                          <img src={c.avatar} alt={c.name} className="w-6 h-6 rounded-full object-cover" />
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
