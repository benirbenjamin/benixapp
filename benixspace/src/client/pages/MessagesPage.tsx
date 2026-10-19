import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationSound } from '../utils/notificationSound';
import { SeoHead } from '../components/common/SeoHead';
import { AppAccessWizardModal } from '../components/modals/AppAccessWizardModal';
import { formatCurrencyCompact } from '../utils/formatCurrency';
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
  Wallet as WalletIcon
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'them' | 'me';
  text: string;
  time: string;
  reaction?: string;
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
  messages: ChatMessage[];
}

const INITIAL_CONVERSATIONS: ChatConversation[] = [
  {
    partnerId: 'support',
    partnerName: 'Benix Support & Concierge',
    partnerAvatar: '/logo.png',
    partnerCity: 'Kigali, HQ',
    tag: 'Official Concierge',
    unreadCount: 0,
    lastMessage: 'Muraho! Welcome to Benix.Space. Our concierge team is available 24/7 if you need assistance.',
    lastMessageTime: 'Today',
    verified: true,
    online: true,
    messages: [
      { id: 's1', sender: 'them', text: 'Muraho! Welcome to Benix.Space Unified Platform.', time: 'Today' },
      { id: 's2', sender: 'them', text: 'Our concierge team is available 24/7 if you need any assistance.', time: 'Today' }
    ]
  }
];

const QUICK_EMOJIS = ['❤️', '🔥', '😂', '😍', '👋', '✨', '🌹', '👍'];

export const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get('user');
  const queryUserName = searchParams.get('name');
  const queryUserAvatar = searchParams.get('avatar');

  const { user, wallet } = useAuth();

  const [conversations, setConversations] = useState<ChatConversation[]>(INITIAL_CONVERSATIONS);
  const [activePartnerId, setActivePartnerId] = useState<string>(queryUserId || 'support');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(queryUserId ? 'chat' : 'list');
  const [inputMessage, setInputMessage] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [animatingHeartId, setAnimatingHeartId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // If navigated with query params (e.g. from Kunda dating profile "Private Chat")
  useEffect(() => {
    if (queryUserId) {
      setActivePartnerId(queryUserId);
      setConversations((prev) => {
        const exists = prev.find((c) => c.partnerId === queryUserId);
        if (exists) return prev;
        const newConvo: ChatConversation = {
          partnerId: queryUserId,
          partnerName: queryUserName ? decodeURIComponent(queryUserName) : 'Verified Member',
          partnerAvatar: queryUserAvatar ? decodeURIComponent(queryUserAvatar) : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
          partnerCity: 'Rwanda',
          tag: 'Kunda Match',
          unreadCount: 0,
          lastMessage: 'Conversation started',
          lastMessageTime: 'Just now',
          verified: true,
          online: true,
          messages: [
            {
              id: 'init_' + Date.now(),
              sender: 'them',
              text: `Muraho! Happy to connect with you on Kunda Space.`,
              time: 'Just now'
            }
          ]
        };
        return [newConvo, ...prev];
      });
    }
  }, [queryUserId, queryUserName, queryUserAvatar]);

  // Container-only smooth scroll to bottom without triggering window/footer scroll
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversations, activePartnerId, mobileView]);

  const activeConversation =
    conversations.find((c) => c.partnerId === activePartnerId) || conversations[0];

  const handleSendMessage = (textToSend?: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const text = (textToSend || inputMessage).trim();
    if (!text || !activeConversation) return;

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.partnerId === activeConversation.partnerId) {
          return {
            ...c,
            lastMessage: text,
            lastMessageTime: 'Just now',
            messages: [...c.messages, newMsg]
          };
        }
        return c;
      })
    );

    if (!textToSend) setInputMessage('');
    notificationSound.playNotificationChime();

    // Auto-reply simulation for interactive demo
    if (activeConversation.partnerId !== 'support') {
      setTimeout(() => {
        const replyMsg: ChatMessage = {
          id: 'rep_' + Date.now(),
          sender: 'them',
          text: `Thank you for your message! Looking forward to our chat on Benix.Space.`,
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
      }, 1500);
    }
  };

  const handleDoubleTapMessage = (messageId: string) => {
    setAnimatingHeartId(messageId);
    setTimeout(() => setAnimatingHeartId(null), 1000);
    setConversations((prev) =>
      prev.map((c) => {
        if (c.partnerId === activeConversation?.partnerId) {
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId ? { ...m, reaction: m.reaction === '❤️' ? undefined : '❤️' } : m
            )
          };
        }
        return c;
      })
    );
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.partnerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.tag.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="bg-[#0B0E14] text-white min-h-[calc(100vh-4rem)] flex flex-col font-sans">
      <SeoHead
        title="Direct Messages & Chat Room — Benix.Space"
        description="Encrypted private chat room for Kunda Space matches, verified creators, and support."
      />

      <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-6 lg:px-8 py-3 flex-1 flex flex-col">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between py-2 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <span>Benix Message Room</span>
              </h1>
              <p className="text-[10px] text-slate-400">Direct conversations, verified matches & support</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard#wallet"
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/25 transition-all"
            >
              <WalletIcon className="w-3.5 h-3.5" />
              <span>{formatCurrencyCompact(Number(wallet?.balance || 100))}</span>
            </Link>
          </div>
        </div>

        {/* Unified 2-Column Split: WhatsApp Style Conversation List & Active Thread Room */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 bg-[#0F1420] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl min-h-[580px]">
          
          {/* LEFT COLUMN: Conversation List (WhatsApp Style: full width on mobile when mobileView === 'list', 4 cols on desktop) */}
          <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} md:col-span-4 border-r border-slate-800 flex-col bg-[#0B0E14]/80 h-[75vh] md:h-auto`}>
            {/* Search Input */}
            <div className="p-3 border-b border-slate-800 bg-[#0F1420]">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search matches & chats..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Conversation Threads */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {filteredConversations.map((convo) => {
                const isActive = convo.partnerId === activePartnerId;
                return (
                  <div
                    key={convo.partnerId}
                    onClick={() => {
                      setActivePartnerId(convo.partnerId);
                      setMobileView('chat');
                    }}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-blue-600/15 border-l-4 border-blue-500'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={convo.partnerAvatar}
                        alt={convo.partnerName}
                        className="w-11 h-11 rounded-2xl object-cover border border-slate-700"
                      />
                      {convo.online && (
                        <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B0E14] absolute -bottom-0.5 -right-0.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <span>{convo.partnerName}</span>
                          {convo.verified && <ShieldCheck className="w-3 h-3 text-rose-500" />}
                        </h4>
                        <span className="text-[10px] text-slate-500">{convo.lastMessageTime}</span>
                      </div>
                      <span className="text-[9px] font-semibold text-rose-400 block mt-0.5">
                        {convo.tag}
                      </span>
                      <p className="text-[11px] text-slate-400 truncate mt-1">
                        {convo.lastMessage}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Chat Thread Room (WhatsApp Style: full width on mobile when mobileView === 'chat', 8 cols on desktop) */}
          <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} md:col-span-8 flex-col bg-[#121824] h-[75vh] md:h-auto`}>
            {activeConversation ? (
              <>
                {/* Chat Room Header */}
                <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-[#151D2C]">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    {/* WhatsApp Back Button to chat list on mobile */}
                    <button
                      onClick={() => setMobileView('list')}
                      className="md:hidden p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Back to Chat List"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="relative">
                      <img
                        src={activeConversation.partnerAvatar}
                        alt={activeConversation.partnerName}
                        className="w-10 h-10 rounded-2xl object-cover border border-slate-700"
                      />
                      {activeConversation.online && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#151D2C] absolute -bottom-0.5 -right-0.5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>{activeConversation.partnerName}</span>
                        {activeConversation.verified && (
                          <span className="text-[9px] bg-rose-600/90 text-white font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {activeConversation.partnerCity} • {activeConversation.tag}
                      </p>
                    </div>
                  </div>

                  {/* Contact Unlock Action */}
                  <div className="flex items-center gap-2">
                    {isUnlocked ? (
                      <a
                        href="https://wa.me/250783987223"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Chat WhatsApp (+250783987223)</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => setIsUnlocked(true)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                        title="Unlock direct verified phone number"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Unlock Phone</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Stream Container (Contained-only scroll, zero window footer jump) */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#0B0E14]/40">
                  <div className="text-center py-2">
                    <span className="text-[10px] bg-slate-800/80 text-slate-400 px-3 py-1 rounded-full">
                      Messages are encrypted & protected by Benix Privacy
                    </span>
                  </div>

                  {activeConversation.messages.map((msg) => {
                    const isMe = msg.sender === 'me';
                    return (
                      <div
                        key={msg.id}
                        onDoubleClick={() => handleDoubleTapMessage(msg.id)}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group select-none`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl relative shadow-md text-xs leading-relaxed transition-all ${
                            isMe
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                              : 'bg-[#1C2538] text-slate-200 border border-slate-700/60 rounded-bl-none'
                          }`}
                        >
                          <p>{msg.text}</p>
                          <div
                            className={`flex items-center gap-1 text-[9px] mt-1.5 ${
                              isMe ? 'text-blue-200 justify-end' : 'text-slate-400 justify-start'
                            }`}
                          >
                            <span>{msg.time}</span>
                            {isMe && <CheckCheck className="w-3 h-3 stroke-[2.5]" />}
                          </div>

                          {/* Reaction badge */}
                          {msg.reaction && (
                            <span className="absolute -bottom-2 right-2 px-1.5 py-0.2 bg-slate-900 border border-slate-700 rounded-full text-xs shadow-md">
                              {msg.reaction}
                            </span>
                          )}

                          {/* Heart pop animation */}
                          {animatingHeartId === msg.id && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
                              <Heart className="w-8 h-8 fill-rose-500 text-rose-500" />
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 px-1">
                          Double-tap to like ❤️
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Emojis Strip */}
                <div className="px-4 py-2 border-t border-slate-800/60 bg-[#121824] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSendMessage(emoji)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-sm transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Message Input Composer */}
                {!user ? (
                  <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#151D2C] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-slate-300 text-xs">
                      <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Sign in or create a free account to send messages and connect directly.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(true)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all shrink-0 text-center"
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
                    className="p-3 sm:p-4 border-t border-slate-800 bg-[#151D2C] flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={`Message ${activeConversation.partnerName}...`}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* Auth Wizard Modal */}
      {showAuthModal && (
        <AppAccessWizardModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          targetAppKey="dating"
          onSuccess={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};
