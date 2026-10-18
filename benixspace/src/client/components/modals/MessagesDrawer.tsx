import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationSound } from '../../utils/notificationSound';
import {
  X,
  MessageSquare,
  Send,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Heart,
  ShoppingBag,
  Dices,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatThread {
  id: string;
  senderName: string;
  senderAvatar: string;
  module: 'support' | 'dating' | 'marketplace' | 'games';
  route: string;
  badgeText: string;
  badgeColor: string;
  preview: string;
  time: string;
  unread: boolean;
  messages: Array<{ id: string; sender: 'them' | 'me'; text: string; time: string }>;
}

export const MessagesDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'recent' | 'all'>('recent');
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [replyText, setReplyText] = useState('');

  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: 'thread-support',
      senderName: 'Benix Support & Concierge',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      module: 'support',
      route: '/contact',
      badgeText: 'Official Support',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      preview: 'Hello! Your central wallet is active with 100 RWF bonus. Feel free to reach out if you need help.',
      time: '10m ago',
      unread: true,
      messages: [
        { id: 'm1', sender: 'them', text: 'Hello! Welcome to Benix.Space Unified Platform.', time: '10:45 AM' },
        { id: 'm2', sender: 'them', text: 'Your central wallet is active with 100 RWF bonus. Feel free to reach out if you need help with TV, radio, or withdrawals.', time: '10:46 AM' }
      ]
    },
    {
      id: 'thread-kunda',
      senderName: 'Aline M. (Kunda Dating Match)',
      senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      module: 'dating',
      route: '/dating',
      badgeText: 'Kunda Space Match',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      preview: 'Hi! I saw you also enjoy live choir and acoustic music.',
      time: '35m ago',
      unread: true,
      messages: [
        { id: 'm3', sender: 'them', text: 'Hi! I saw you also enjoy live choir and acoustic music.', time: '10:20 AM' },
        { id: 'm4', sender: 'them', text: 'Are you based in Kigali?', time: '10:21 AM' }
      ]
    },
    {
      id: 'thread-market',
      senderName: 'David K. (Benix Market Merchant)',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      module: 'marketplace',
      route: '/marketplace',
      badgeText: 'Marketplace Order',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      preview: 'Your digital asset receipt has been issued.',
      time: '2h ago',
      unread: false,
      messages: [
        { id: 'm5', sender: 'them', text: 'Your digital asset receipt has been issued.', time: '08:15 AM' }
      ]
    },
    {
      id: 'thread-games',
      senderName: 'RollDice Arena Host',
      senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      module: 'games',
      route: '/games',
      badgeText: 'RollDice Challenge',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      preview: 'Player "KigaliPro" challenged you to a 500 RWF RollDice match.',
      time: '3h ago',
      unread: false,
      messages: [
        { id: 'm6', sender: 'them', text: 'Player "KigaliPro" challenged you to a 500 RWF RollDice match.', time: '07:30 AM' }
      ]
    }
  ]);

  if (!isOpen) return null;

  const handleOpenThread = (t: ChatThread) => {
    notificationSound.playMessageSound();
    setActiveThread(t);
    // Mark as read
    setThreads(prev => prev.map(item => item.id === t.id ? { ...item, unread: false } : item));
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    notificationSound.playMessageSound();
    const newMsg = {
      id: 'm-' + Date.now(),
      sender: 'me' as const,
      text: replyText.trim(),
      time: 'Just now'
    };

    setActiveThread({
      ...activeThread,
      messages: [...activeThread.messages, newMsg]
    });

    setReplyText('');
  };

  const handleNavigateApp = (route: string) => {
    onClose();
    navigate(route);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:w-96 bg-[#0F1420] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[640px] text-white font-sans sm:mr-4 sm:mb-4">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#131926]">
          {activeThread ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveThread(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-700">
                <img src={activeThread.senderAvatar} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{activeThread.senderName}</h4>
                <span className="text-[10px] text-slate-400">Direct Message</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white">Inbox & Messages</h3>
                <p className="text-[10px] text-slate-400">Direct chats, matches, and support</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1">
            {activeThread && (
              <button
                onClick={() => handleNavigateApp(activeThread.route)}
                className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 text-[10px] font-bold flex items-center gap-1 border border-blue-500/30"
                title="Open Mini-App"
              >
                <span>Open App</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher: Recent Chats vs All Messages (when not viewing a thread) */}
        {!activeThread && (
          <div className="px-5 pt-3 pb-2 flex gap-2 border-b border-slate-800">
            <button
              onClick={() => setTab('recent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tab === 'recent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Recent ({threads.filter(t => t.unread).length} Unread)
            </button>
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              All Messages ({threads.length})
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {activeThread ? (
            /* Inside Active Chat Thread */
            <div className="flex flex-col h-full space-y-3">
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
                {activeThread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`px-3.5 py-2 rounded-2xl max-w-[80%] text-xs leading-relaxed ${
                        m.sender === 'me'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-[#182236] text-slate-200 border border-slate-700/60 rounded-bl-none'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-0.5 px-1">{m.time}</span>
                  </div>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendReply} className="pt-2 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#161D2E] border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* Threads List */
            <div className="space-y-2">
              {threads
                .filter(t => tab === 'all' || t.unread)
                .map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleOpenThread(t)}
                    className="p-3 rounded-2xl bg-[#141B2B] hover:bg-[#182236] border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer flex items-start gap-3 group"
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-700">
                        <img src={t.senderAvatar} alt="" className="w-full h-full object-cover" />
                      </div>
                      {t.unread && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0F1420] animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                          {t.senderName}
                        </h4>
                        <span className="text-[10px] text-slate-500 shrink-0">{t.time}</span>
                      </div>
                      <span className={`text-[9px] px-2 py-0.2 rounded-full border font-mono inline-block ${t.badgeColor}`}>
                        {t.badgeText}
                      </span>
                      <p className="text-[11px] text-slate-400 truncate line-clamp-1">{t.preview}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
