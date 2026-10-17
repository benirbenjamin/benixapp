import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Heart,
  Reply,
  User,
  Clock,
  RefreshCw,
  Edit3,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  History,
  X,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { Station, Comment } from '../../types';
import { checkInappropriateLanguage } from '../../utils/moderation';
import { useCoffee } from '../../context/CoffeeContext';
import { parseJsonResponse } from '../../services/api';

interface TVLiveChatProps {

  station: Station;
}

// Generates consistent pleasant avatar colors from author name
function getAvatarBg(name: string): string {
  const colors = [
    'from-blue-600 to-indigo-600',
    'from-emerald-600 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-purple-600 to-violet-600',
    'from-cyan-600 to-blue-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Format date into "Today", "Yesterday", or "Month Day, Year"
function getDateGroupLabel(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// Format relative time (e.g., "Just now", "5m ago", "14:20")
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const TVLiveChat: React.FC<TVLiveChatProps> = ({ station }) => {
  const { openCoffeeModal } = useCoffee();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [hasEarlier, setHasEarlier] = useState(false);
  const [earlierCount, setEarlierCount] = useState(0);
  const [earliestTimestamp, setEarliestTimestamp] = useState<string | null>(null);
  const [loadingEarlier, setLoadingEarlier] = useState(false);

  // User nickname state stored in localStorage
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('benix_chat_username') || '';
  });
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  // Visitor persistent fingerprint
  const [visitorFingerprint] = useState<string>(() => {
    let fp = localStorage.getItem('benix_visitor_fp');
    if (!fp) {
      fp = 'fp_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem('benix_visitor_fp', fp);
    }
    return fp;
  });

  // Ban & Moderation feedback states
  const [isBanned, setIsBanned] = useState<boolean>(false);
  const [banReason, setBanReason] = useState<string>('');
  const [commentError, setCommentError] = useState<string | null>(null);

  // Comment inputs
  const [mainCommentText, setMainCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Liked comment IDs in current browser session
  const [likedIds, setLikedIds] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem('benix_liked_comments');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Track pending submission if user needed to provide a nickname first
  const pendingActionRef = useRef<{
    type: 'comment' | 'reply';
    parentId?: string;
    text: string;
  } | null>(null);

  const mainInputRef = useRef<HTMLTextAreaElement>(null);

  // 1. Fetch Today's comments for the active station
  const fetchTodayComments = async (silent = false) => {
    if (!station?.slug) return;
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(
        `/api/comments?station_slug=${encodeURIComponent(station.slug)}&station_id=${encodeURIComponent(station.id || '')}&scope=today`
      );
      const data = await parseJsonResponse(res);
      setComments(data.comments || []);
      setHasEarlier(data.has_earlier || false);
      setEarlierCount(data.earlier_count || 0);
      setEarliestTimestamp(data.earliest_timestamp || null);
    } catch (err) {
      console.warn('Could not fetch comments from server, using local fallback:', err);
      loadFromLocalCache();
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Local fallback storage for resilience
  const loadFromLocalCache = () => {
    try {
      const cached = localStorage.getItem(`benix_chat_${station.slug}`);
      if (cached) {
        setComments(JSON.parse(cached));
      }
    } catch (e) {
      // ignore
    }
  };

  const saveToLocalCache = (newComments: Comment[]) => {
    try {
      localStorage.setItem(`benix_chat_${station.slug}`, JSON.stringify(newComments.slice(0, 100)));
    } catch (e) {
      // ignore
    }
  };

  // Fetch when active station changes
  useEffect(() => {
    setComments([]);
    setReplyingToId(null);
    setMainCommentText('');
    setReplyText('');
    setHasEarlier(false);
    fetchTodayComments(false);

    // Auto-poll every 6 seconds for live TV discussion sync
    const interval = setInterval(() => {
      fetchTodayComments(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [station.slug]);

  // 2. Load earlier comments (Yesterday and earlier days)
  const handleLoadEarlier = async () => {
    if (!earliestTimestamp || loadingEarlier) return;
    setLoadingEarlier(true);

    try {
      const res = await fetch(
        `/api/comments?station_slug=${encodeURIComponent(station.slug)}&station_id=${encodeURIComponent(station.id || '')}&scope=earlier&before=${encodeURIComponent(earliestTimestamp)}&limit=40`
      );
      const data = await parseJsonResponse(res);
      const earlierComments: Comment[] = data.comments || [];

      // Merge without duplicates
      setComments((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const toAdd = earlierComments.filter((c) => !existingIds.has(c.id));
        const merged = [...prev, ...toAdd];
        saveToLocalCache(merged);
        return merged;
      });

      setHasEarlier(data.has_earlier || false);
      setEarlierCount(data.earlier_count || 0);
      if (data.earliest_timestamp) {
        setEarliestTimestamp(data.earliest_timestamp);
      }
    } catch (err) {
      console.error('Error loading earlier comments:', err);
    } finally {
      setLoadingEarlier(false);
    }
  };

  // 3. Check for nickname and prompt "How can we call you?" if needed
  const ensureNickname = (action: { type: 'comment' | 'reply'; parentId?: string; text: string }): boolean => {
    if (!userName.trim()) {
      pendingActionRef.current = action;
      setNameInput('');
      setIsNameModalOpen(true);
      return false;
    }
    return true;
  };

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) return;

    // Check name against multilingual moderation
    const nameCheck = checkInappropriateLanguage(cleanName);
    if (nameCheck.isInappropriate) {
      setNameError(
        `The name contains inappropriate or offensive words (${nameCheck.category || 'Moderation'}). Vulgar names (e.g. in Kinyarwanda, English, French) are not allowed. Please choose a respectful nickname.`
      );
      return;
    }

    setNameError(null);
    localStorage.setItem('benix_chat_username', cleanName);
    setUserName(cleanName);
    setIsNameModalOpen(false);

    // Resume pending action if one was queued
    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      if (action.type === 'comment' && action.text.trim()) {
        postCommentDirectly(cleanName, action.text);
      } else if (action.type === 'reply' && action.parentId && action.text.trim()) {
        postReplyDirectly(cleanName, action.parentId, action.text);
      }
    }
  };

  // 4. Post top-level comment
  const handleMainCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBanned) {
      setCommentError('You are restricted from posting comments.');
      return;
    }

    const text = mainCommentText.trim();
    if (!text) return;

    // Moderation check
    const contentCheck = checkInappropriateLanguage(text);
    if (contentCheck.isInappropriate) {
      setCommentError(
        `Comment contains inappropriate language (${contentCheck.category || 'Moderation'}). Vulgar or abusive comments are prohibited.`
      );
      return;
    }

    setCommentError(null);

    if (!ensureNickname({ type: 'comment', text })) {
      return;
    }

    postCommentDirectly(userName, text);
  };

  const postCommentDirectly = async (author: string, content: string) => {
    if (isBanned) return;
    setSubmitting(true);
    setCommentError(null);
    const tempId = 'temp-' + Date.now();
    const optimisticComment: Comment = {
      id: tempId,
      station_slug: station.slug,
      station_id: station.id,
      author_name: author,
      content: content,
      likes_count: 0,
      created_at: new Date().toISOString(),
      replies: [],
    };

    // Optimistic UI update (newest comment at top)
    setComments((prev) => {
      const next = [optimisticComment, ...prev];
      saveToLocalCache(next);
      return next;
    });
    setMainCommentText('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_slug: station.slug,
          station_id: station.id,
          author_name: author,
          content: content,
          author_fingerprint: visitorFingerprint,
        }),
      });

      if (res.status === 403) {
        const data = await parseJsonResponse(res).catch(() => ({}));
        setIsBanned(true);
        setBanReason(data.reason || data.error || 'Restricted from posting comments.');
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        return;
      }

      const data = await parseJsonResponse(res);
      const serverComment = data.comment;
      setComments((prev) => {
        const next = prev.map((c) => (c.id === tempId ? serverComment : c));
        saveToLocalCache(next);
        return next;
      });
    } catch (err: any) {
      setCommentError(err.message || 'Failed to post comment.');
      setComments((prev) => prev.filter((c) => c.id !== tempId));
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Post reply to an existing comment
  const handleReplySubmit = (parentId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (isBanned) {
      setCommentError('You are restricted from posting comments.');
      return;
    }

    const text = replyText.trim();
    if (!text) return;

    const contentCheck = checkInappropriateLanguage(text);
    if (contentCheck.isInappropriate) {
      setCommentError(
        `Reply contains inappropriate language (${contentCheck.category || 'Moderation'}). Vulgar or abusive comments are prohibited.`
      );
      return;
    }

    setCommentError(null);

    if (!ensureNickname({ type: 'reply', parentId, text })) {
      return;
    }

    postReplyDirectly(userName, parentId, text);
  };

  const postReplyDirectly = async (author: string, parentId: string, content: string) => {
    if (isBanned) return;
    setSubmitting(true);
    setCommentError(null);
    const tempId = 'temp-reply-' + Date.now();
    const optimisticReply: Comment = {
      id: tempId,
      station_slug: station.slug,
      station_id: station.id,
      parent_id: parentId,
      author_name: author,
      content: content,
      likes_count: 0,
      created_at: new Date().toISOString(),
    };

    // Optimistically attach reply to parent
    setComments((prev) => {
      const next = prev.map((c) => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), optimisticReply],
          };
        }
        return c;
      });
      saveToLocalCache(next);
      return next;
    });

    setReplyingToId(null);
    setReplyText('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_slug: station.slug,
          station_id: station.id,
          parent_id: parentId,
          author_name: author,
          content: content,
          author_fingerprint: visitorFingerprint,
        }),
      });

      if (res.status === 403) {
        const data = await parseJsonResponse(res).catch(() => ({}));
        setIsBanned(true);
        setBanReason(data.reason || data.error || 'Restricted from posting comments.');
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: (c.replies || []).filter((r) => r.id !== tempId) }
              : c
          )
        );
        return;
      }

      const data = await parseJsonResponse(res);
      const serverReply = data.comment;
      setComments((prev) => {
        const next = prev.map((c) => {
          if (c.id === parentId) {
            return {
              ...c,
              replies: (c.replies || []).map((r) => (r.id === tempId ? serverReply : r)),
            };
          }
          return c;
        });
        saveToLocalCache(next);
        return next;
      });
    } catch (err) {
      console.warn('Offline fallback for reply');
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Like comment
  const handleLike = async (commentId: string) => {
    if (likedIds.has(commentId)) return;

    // Optimistic like
    const newLiked = new Set(likedIds);
    newLiked.add(commentId);
    setLikedIds(newLiked);
    try {
      sessionStorage.setItem('benix_liked_comments', JSON.stringify(Array.from(newLiked)));
    } catch {
      // ignore
    }

    const updateLikesInTree = (list: Comment[]): Comment[] => {
      return list.map((c) => {
        if (c.id === commentId) {
          return { ...c, likes_count: (c.likes_count || 0) + 1 };
        }
        if (c.replies && c.replies.length > 0) {
          return { ...c, replies: updateLikesInTree(c.replies) };
        }
        return c;
      });
    };

    setComments((prev) => updateLikesInTree(prev));

    try {
      await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
    } catch (err) {
      // ignore
    }
  };

  // Group comments by Day (Today, Yesterday, Date)
  const groupedComments = useMemo(() => {
    const groups: { dateLabel: string; items: Comment[] }[] = [];
    let currentLabel = '';
    let currentItems: Comment[] = [];

    comments.forEach((c) => {
      const label = getDateGroupLabel(c.created_at);
      if (label !== currentLabel) {
        if (currentItems.length > 0) {
          groups.push({ dateLabel: currentLabel, items: currentItems });
        }
        currentLabel = label;
        currentItems = [c];
      } else {
        currentItems.push(c);
      }
    });

    if (currentItems.length > 0) {
      groups.push({ dateLabel: currentLabel, items: currentItems });
    }

    return groups;
  }, [comments]);

  return (
    <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl space-y-6 text-white">
      {/* 1. Header with live station indicator, daily scope & nickname badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-bold text-base sm:text-lg text-white tracking-tight">
                Live TV Discussion · {station.name}
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Showing today's chat broadcast. Earlier comments can be loaded.
            </p>
          </div>
        </div>

        {/* User Identity & Coffee Support pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => openCoffeeModal(1)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition"
            title="Buy Us a Coffee"
          >
            <span>☕</span>
            <span className="hidden xs:inline">Support</span>
          </button>

          {userName ? (
            <button
              onClick={() => {
                setNameInput(userName);
                setIsNameModalOpen(true);
              }}
              title="Click to change your name"
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition"
            >
              <div
                className={`w-5 h-5 rounded-full bg-gradient-to-tr ${getAvatarBg(userName)} flex items-center justify-center text-[10px] font-bold text-white uppercase`}
              >
                {userName.charAt(0)}
              </div>
              <span className="font-semibold text-slate-200">{userName}</span>
              <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-amber-400 transition" />
            </button>
          ) : (
            <button
              onClick={() => {
                setNameInput('');
                setIsNameModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rba-yellow/15 hover:bg-rba-yellow/25 border border-rba-yellow/30 text-xs font-semibold text-rba-yellow transition"
            >
              <User className="w-3.5 h-3.5" />
              <span>Set Your Name</span>
            </button>
          )}

          {/* Refresh indicator */}
          <button
            onClick={() => fetchTodayComments(true)}
            title="Refresh comments"
            disabled={isRefreshing}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>

      </div>

      {/* Ban restriction notice */}
      {isBanned && (
        <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/40 text-red-200 flex items-start gap-3 animate-fadeIn">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-red-300">Participation Restricted</p>
            <p className="text-red-200/90">
              {banReason || 'You have been restricted by an administrator from posting comments.'}
            </p>
          </div>
        </div>
      )}

      {/* Inappropriate language / validation error */}
      {commentError && !isBanned && (
        <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 flex items-center justify-between gap-2 text-xs animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">{commentError}</span>
          </div>
          <button
            type="button"
            onClick={() => setCommentError(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-amber-300 hover:text-white shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Top-level Comment Composer */}
      <form onSubmit={handleMainCommentSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            ref={mainInputRef}
            rows={2}
            disabled={isBanned}
            value={mainCommentText}
            onChange={(e) => {
              setMainCommentText(e.target.value);
              if (commentError) setCommentError(null);
            }}
            onFocus={() => {
              if (!userName && !isBanned) {
                ensureNickname({ type: 'comment', text: mainCommentText });
              }
            }}
            placeholder={isBanned ? 'Commenting is restricted on this device' : `Say something about ${station.name}...`}
            className="w-full bg-black/40 border border-white/15 focus:border-rba-yellow/70 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rba-yellow/30 transition resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={1000}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {isBanned ? 'Restricted by administrator' : 'Press Post to join the live conversation'}
          </span>
          <button
            type="submit"
            disabled={isBanned || submitting || !mainCommentText.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-600/30 transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Comment</span>
          </button>
        </div>
      </form>

      {/* 3. Earlier Comments Loader (Button to load yesterday / past comments) */}
      {hasEarlier && (
        <div className="pt-2 text-center">
          <button
            onClick={handleLoadEarlier}
            disabled={loadingEarlier}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200 hover:text-white transition shadow-sm"
          >
            <History className={`w-3.5 h-3.5 text-amber-400 ${loadingEarlier ? 'animate-spin' : ''}`} />
            <span>
              {loadingEarlier
                ? 'Loading earlier broadcast comments...'
                : `Load earlier comments (${earlierCount} earlier)`}
            </span>
          </button>
        </div>
      )}

      {/* 4. Comments Stream grouped daily */}
      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {loading && comments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rba-yellow" />
            <p>Connecting to {station.name} live chat...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center bg-black/20 rounded-2xl border border-white/5 p-6">
            <Sparkles className="w-8 h-8 text-amber-400/80 mx-auto mb-2" />
            <h4 className="text-white font-bold text-sm">No comments yet today</h4>
            <p className="text-slate-400 text-xs mt-1">
              Be the first to share your thoughts while watching {station.name}!
            </p>
          </div>
        ) : (
          groupedComments.map((group) => (
            <div key={group.dateLabel} className="space-y-4">
              {/* Daily Divider Header */}
              <div className="relative flex items-center justify-center my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative px-3 py-0.5 rounded-full bg-slate-800 border border-white/15 text-[10px] font-bold uppercase tracking-wider text-slate-300 shadow">
                  {group.dateLabel}
                </span>
              </div>

              {/* Threaded comments in this group */}
              {group.items.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white/[0.04] border border-white/10 hover:border-white/20 rounded-2xl p-4 transition space-y-3"
                >
                  {/* Top: Author & Time */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full bg-gradient-to-tr ${getAvatarBg(
                          comment.author_name
                        )} flex items-center justify-center text-xs font-bold text-white shadow`}
                      >
                        {comment.author_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">
                          {comment.author_name}
                        </span>
                        {userName && comment.author_name.toLowerCase() === userName.toLowerCase() && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rba-yellow/20 text-rba-yellow border border-rba-yellow/30">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(comment.created_at)}</span>
                    </div>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed break-words whitespace-pre-line pl-9">
                    {comment.content}
                  </p>

                  {/* Actions: Like & Reply buttons */}
                  <div className="flex items-center gap-3 pl-9 pt-1 text-xs">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                        likedIds.has(comment.id)
                          ? 'text-rose-400 bg-rose-500/10 font-bold'
                          : 'text-slate-400 hover:text-rose-400 hover:bg-white/5'
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          likedIds.has(comment.id) ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                      <span>{comment.likes_count || 0}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (replyingToId === comment.id) {
                          setReplyingToId(null);
                        } else {
                          setReplyingToId(comment.id);
                          setReplyText(`@${comment.author_name} `);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                        replyingToId === comment.id
                          ? 'text-amber-300 bg-amber-500/15 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </div>

                  {/* Inline Reply Form when this comment is being replied to */}
                  {replyingToId === comment.id && (
                    <form
                      onSubmit={(e) => handleReplySubmit(comment.id, e)}
                      className="ml-9 mt-2 p-3 bg-black/40 border border-white/15 rounded-xl space-y-2 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span className="font-semibold text-amber-300">
                          Replying to @{comment.author_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReplyingToId(null)}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onFocus={() => {
                          if (!userName) {
                            ensureNickname({
                              type: 'reply',
                              parentId: comment.id,
                              text: replyText,
                            });
                          }
                        }}
                        placeholder={`Write your reply to ${comment.author_name}...`}
                        className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 resize-none"
                        maxLength={1000}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyingToId(null)}
                          className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submitting || !replyText.trim()}
                          className="flex items-center gap-1.5 px-4 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 disabled:opacity-40 transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Nested Replies List */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-5 sm:ml-9 pl-3 border-l-2 border-white/10 space-y-3 pt-2">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="bg-black/25 border border-white/5 rounded-xl p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-5 h-5 rounded-full bg-gradient-to-tr ${getAvatarBg(
                                  reply.author_name
                                )} flex items-center justify-center text-[10px] font-bold text-white shadow`}
                              >
                                {reply.author_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-xs text-white">
                                {reply.author_name}
                              </span>
                              {userName &&
                                reply.author_name.toLowerCase() === userName.toLowerCase() && (
                                  <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-rba-yellow/20 text-rba-yellow">
                                    You
                                  </span>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {formatTimeAgo(reply.created_at)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-200 leading-relaxed break-words whitespace-pre-line pl-7">
                            {reply.content}
                          </p>

                          <div className="flex items-center gap-3 pl-7 text-[11px]">
                            <button
                              onClick={() => handleLike(reply.id)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
                                likedIds.has(reply.id)
                                  ? 'text-rose-400 bg-rose-500/10 font-bold'
                                  : 'text-slate-400 hover:text-rose-400'
                              }`}
                            >
                              <Heart
                                className={`w-3 h-3 ${
                                  likedIds.has(reply.id) ? 'fill-rose-500 text-rose-500' : ''
                                }`}
                              />
                              <span>{reply.likes_count || 0}</span>
                            </button>

                            <button
                              onClick={() => {
                                setReplyingToId(comment.id);
                                setReplyText(`@${reply.author_name} `);
                              }}
                              className="text-slate-400 hover:text-white"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* 5. "How can we call you?" Name Modal */}
      {isNameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20">
                <User className="w-5 h-5" />
              </div>
              <button
                onClick={() => {
                  setIsNameModalOpen(false);
                  pendingActionRef.current = null;
                }}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                How can we call you?
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Enter your name or nickname to comment and interact with other viewers on Benix Space TV. We'll save it on your device.
              </p>
            </div>

            <form onSubmit={handleSaveNickname} className="space-y-4">
              {nameError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{nameError}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={40}
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="e.g., Eric, Aline M., Keza"
                  className="w-full bg-black/50 border border-white/20 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNameModalOpen(false);
                    pendingActionRef.current = null;
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!nameInput.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 disabled:opacity-40 shadow-lg shadow-amber-400/20 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save & Continue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
