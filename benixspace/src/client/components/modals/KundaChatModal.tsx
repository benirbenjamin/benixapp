import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationSound } from '../../utils/notificationSound';
import {
  X,
  Send,
  Heart,
  ShieldCheck,
  Lock,
  Unlock,
  Phone,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { getAuthToken } from '../../services/api';

interface MatchProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  profession: string;
  bio: string;
  interests: string[];
  image: string;
  verified: boolean;
  online: boolean;
}

interface MessageItem {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  partner: MatchProfile | null;
  onOpenSubscription: () => void;
  onOpenWallet: () => void;
}

export const KundaChatModal: React.FC<Props> = ({
  isOpen,
  onClose,
  partner,
  onOpenSubscription,
  onOpenWallet
}) => {
  const { user, wallet, refreshWallet } = useAuth();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [allowances, setAllowances] = useState<any>({
    initialRemaining: 3,
    perMessageFee: 50,
    hasActiveSubscription: false,
    contactUnlockPrice: 2000,
    isContactUnlocked: false,
    partnerPhone: null
  });
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen && partner) {
      loadMessages();
    }
  }, [isOpen, partner]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!partner) return;
    const token = getAuthToken();
    setLoading(true);
    try {
      const res = await fetch(`/api/modules/kunda/messages/${partner.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.allowances) {
          setAllowances(data.allowances);
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !partner || sending) return;

    const token = getAuthToken();
    if (!token) {
      setStatusNotice('Please sign in or complete your profile to send messages.');
      return;
    }

    setSending(true);
    setStatusNotice(null);

    try {
      const res = await fetch('/api/modules/kunda/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: partner.id,
          content: text
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setInputText('');
        setMessages((prev) => [...prev, data.message]);
        notificationSound.playPop();

        if (data.chargedAmount > 0) {
          setStatusNotice(`Delivered (-${data.chargedAmount} RWF deducted from wallet).`);
          refreshWallet();
        }

        // Poll for automated reply after 2 seconds
        setTimeout(() => {
          loadMessages();
          notificationSound.playNotificationChime();
        }, 2200);
      } else if (data.error === 'INSUFFICIENT_FUNDS') {
        setStatusNotice('⚠️ Insufficient wallet balance (50 RWF required per message). Please top up or get an Unlimited Pass.');
      } else {
        setStatusNotice(`⚠️ ${data.error || 'Failed to send message'}`);
      }
    } catch (err: any) {
      setStatusNotice('⚠️ Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleUnlockContact = async () => {
    if (!partner) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch('/api/modules/kunda/unlock-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetProfileId: partner.id,
          price: allowances.contactUnlockPrice || 2000
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAllowances((prev: any) => ({
          ...prev,
          isContactUnlocked: true,
          partnerPhone: data.phone,
          whatsappLink: data.whatsappLink
        }));
        setStatusNotice('🎉 Contact details unlocked! Direct WhatsApp link available.');
        refreshWallet();
        notificationSound.playNotificationChime();
      } else if (data.error === 'INSUFFICIENT_FUNDS') {
        setStatusNotice('⚠️ Insufficient wallet balance to unlock contact (2,000 RWF required). Please top up.');
        onOpenWallet();
      } else {
        setStatusNotice(`⚠️ ${data.error || 'Failed to unlock contact.'}`);
      }
    } catch (err: any) {
      setStatusNotice('⚠️ Failed to unlock contact. Please try again.');
    }
  };

  if (!isOpen || !partner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-xl h-[92vh] max-h-[720px] bg-[#0E1524] text-white rounded-3xl shadow-2xl border border-rose-500/30 flex flex-col overflow-hidden animate-scaleUp">
        
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-rose-900/60 via-[#141C2E] to-[#0E1524] border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={partner.image}
                alt={partner.name}
                className="w-11 h-11 rounded-2xl object-cover border border-rose-500/40"
              />
              {partner.online && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0E1524] animate-pulse" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                  {partner.name}, {partner.age}
                </h3>
                {partner.verified && (
                  <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" title="Verified Member" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {partner.city} • {partner.profession}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subscription / Allowance Status Pill Bar */}
        <div className="px-4 py-2 bg-[#12192A] border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
          {allowances.hasActiveSubscription ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Unlimited Pass Active (Free Messaging)</span>
            </div>
          ) : allowances.initialRemaining > 0 ? (
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{allowances.initialRemaining} Free Messages Remaining</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>50 RWF per message (or get unlimited pass)</span>
            </div>
          )}

          <button
            onClick={onOpenSubscription}
            className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>Passes from 500 RWF</span>
          </button>
        </div>

        {/* Contact Unlock Card */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-rose-950/40 to-slate-900 border-b border-rose-500/20 shrink-0">
          {allowances.isContactUnlocked ? (
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Verified Direct Phone: <strong className="text-white font-black ml-1">{allowances.partnerPhone || '+250783987223'}</strong></span>
              </div>
              <a
                href={`https://wa.me/250783987223?text=Muraho%20${encodeURIComponent(partner.name)}!%20Connected%20via%20Benix%20Kunda%20Space.`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shrink-0"
              >
                <Phone className="w-3.5 h-3.5 fill-current" />
                <span>WhatsApp</span>
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300 min-w-0">
                <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate">Unlock verified phone & direct WhatsApp</span>
              </div>
              <button
                onClick={handleUnlockContact}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-rose-500/30 text-rose-300 hover:text-white font-bold text-[11px] flex items-center gap-1 shrink-0 transition-colors"
              >
                <Unlock className="w-3.5 h-3.5 text-rose-400" />
                <span>Unlock ({allowances.contactUnlockPrice || 2000} RWF)</span>
              </button>
            </div>
          )}
        </div>

        {/* Status Notice alert */}
        {statusNotice && (
          <div className="px-4 py-2 bg-blue-950/60 border-b border-blue-500/30 text-blue-200 text-xs font-semibold flex items-center justify-between shrink-0">
            <span>{statusNotice}</span>
            <button onClick={() => setStatusNotice(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Message Thread Scroll Area (Container-only scroll) */}
        <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              <span>Loading encrypted chat...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <Heart className="w-7 h-7 fill-rose-500/40" />
              </div>
              <h4 className="font-extrabold text-sm text-white">Start the Conversation</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Say hello to {partner.name}! Compliment their bio or ask about their shared interests.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_id === (user?.id || 'demo-user');
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-md ${
                      isMe
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-br-sm'
                        : 'bg-slate-800/90 text-slate-100 rounded-bl-sm border border-slate-700/60'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 px-1">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Emojis Strip */}
        <div className="px-4 py-1.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {['❤️', '👋', '😍', '🔥', '✨', '🌹', '☕', '👍'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => setInputText((prev) => prev + emoji)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-base transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Bottom Input Area */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-[#0B0E14] border-t border-slate-800/90 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${partner.name}...`}
            className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="p-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-600/30 flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shrink-0"
            title="Send message"
          >
            <Send className="w-5 h-5 fill-current" />
          </button>
        </form>

      </div>
    </div>
  );
};
