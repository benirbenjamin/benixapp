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
  X,
  AlertTriangle,
  Coffee,
  ShieldAlert
} from 'lucide-react';
import { checkInappropriateLanguage } from '../../utils/moderation';
import { useCoffee } from '../../context/CoffeeContext';

export interface Comment {
  id: string;
  station_slug?: string;
  station_id?: string;
  video_id?: string;
  parent_id?: string | null;
  author_name: string;
  content: string;
  likes_count: number;
  created_at: string;
  replies?: Comment[];
}

interface TVLiveChatProps {
  station?: any;
  videoId?: string;
  title?: string;
}

// Consistent pleasant avatar colors from author name
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

export const TVLiveChat: React.FC<TVLiveChatProps> = ({ station, videoId, title }) => {
  const { openCoffeeModal } = useCoffee();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User nickname state stored in localStorage
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('benix_chat_username') || '';
  });
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  // Ban & Moderation feedback states
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

  const pendingActionRef = useRef<{
    type: 'comment' | 'reply';
    parentId?: string;
    text: string;
  } | null>(null);

  const mainInputRef = useRef<HTMLTextAreaElement>(null);

  const identifierParam = videoId
    ? `video_id=${encodeURIComponent(videoId)}`
    : `station_slug=${encodeURIComponent(station?.slug || '')}&station_id=${encodeURIComponent(station?.id || '')}`;

  // 1. Fetch comments
  const fetchComments = async (silent = false) => {
    if (!station?.slug && !videoId) return;
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch(`/api/comments?${identifierParam}`);
      if (!res.ok) throw new Error('Failed to load comments');
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      // Local fallback
      try {
        const cacheKey = videoId ? `benix_vchat_${videoId}` : `benix_chat_${station?.slug}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) setComments(JSON.parse(cached));
      } catch (e) {}
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setComments([]);
    setReplyingToId(null);
    setMainCommentText('');
    setReplyText('');
    fetchComments(false);

    // Refresh every 6 seconds for live chat feeling
    const interval = setInterval(() => {
      fetchComments(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [station?.slug, videoId]);

  // Group comments by Day: "Today", "Yesterday", or "Month Day, Year"
  const groupedComments = useMemo(() => {
    const groups: { [dateLabel: string]: Comment[] } = {};

    comments.forEach((c) => {
      const label = getDateGroupLabel(c.created_at);
      if (!groups[label]) groups[label] = [];
      groups[label].push(c);
    });

    return groups;
  }, [comments]);

  // Handle Nickname Modal Save
  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    const trimmed = nameInput.trim();

    if (!trimmed) {
      setNameError('Please type your name or nickname.');
      return;
    }

    if (trimmed.length < 2) {
      setNameError('Nickname must be at least 2 letters.');
      return;
    }

    // Multilingual Name Moderation check (Kinyarwanda, English, French)
    const check = checkInappropriateLanguage(trimmed);
    if (check.isInappropriate) {
      setNameError(`Prohibited name detected (${check.category || 'Moderation'}). Please choose a respectful nickname.`);
      return;
    }

    localStorage.setItem('benix_chat_username', trimmed);
    setUserName(trimmed);
    setIsNameModalOpen(false);

    // Execute pending action if any
    if (pendingActionRef.current) {
      const pending = pendingActionRef.current;
      pendingActionRef.current = null;
      if (pending.type === 'comment') {
        postCommentOrReply(pending.text, undefined, trimmed);
      } else if (pending.type === 'reply' && pending.parentId) {
        postCommentOrReply(pending.text, pending.parentId, trimmed);
      }
    }
  };

  // Submit comment or reply with multilingual filter check
  const postCommentOrReply = async (text: string, parentId?: string, overrideName?: string) => {
    const activeName = overrideName || userName;

    if (!activeName) {
      pendingActionRef.current = {
        type: parentId ? 'reply' : 'comment',
        parentId,
        text,
      };
      setNameInput('');
      setNameError(null);
      setIsNameModalOpen(true);
      return;
    }

    setCommentError(null);
    const cleanContent = text.trim();

    if (!cleanContent) return;

    // Multilingual Content Moderation check
    const contentCheck = checkInappropriateLanguage(cleanContent);
    if (contentCheck.isInappropriate) {
      setCommentError(
        `Inappropriate message detected (${contentCheck.category || 'Moderation'}). Vulgar or offensive words (including ${contentCheck.flaggedWord}) are strictly prohibited.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        author_name: activeName,
        content: cleanContent,
        parent_id: parentId || null,
      };

      if (videoId) {
        payload.video_id = videoId;
      } else {
        payload.station_slug = station?.slug;
        payload.station_id = station?.id;
      }

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to post message.');
      }

      // Add to list
      const newComment: Comment = data.comment;
      if (parentId) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newComment],
              };
            }
            return c;
          })
        );
        setReplyingToId(null);
        setReplyText('');
      } else {
        setComments((prev) => [newComment, ...prev]);
        setMainCommentText('');
      }
    } catch (err: any) {
      setCommentError(err.message || 'Failed to submit comment. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Like a comment
  const handleLike = async (commentId: string) => {
    if (likedIds.has(commentId)) return;

    const newLiked = new Set(likedIds);
    newLiked.add(commentId);
    setLikedIds(newLiked);
    try {
      sessionStorage.setItem('benix_liked_comments', JSON.stringify(Array.from(newLiked)));
    } catch (e) {}

    // Optimistic UI update
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return { ...c, likes_count: (c.likes_count || 0) + 1 };
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId ? { ...r, likes_count: (r.likes_count || 0) + 1 } : r
            ),
          };
        }
        return c;
      })
    );

    try {
      await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
    } catch (err) {}
  };

  return (
    <div className="flex flex-col h-full bg-[#0F1420] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl font-sans text-slate-100">
      
      {/* Live Chat Header */}
      <div className="p-4 bg-[#141A29] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse block" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>{title || `${station?.name || 'Live'} Live Discussion`}</span>
            </h3>
            <p className="text-[10px] text-slate-400">
              {comments.length} community comments • Monitored 24/7
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* User Nickname Button */}
          <button
            onClick={() => {
              setNameInput(userName);
              setNameError(null);
              setIsNameModalOpen(true);
            }}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Change Chat Nickname"
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span className="max-w-[80px] truncate">{userName || 'Set Nickname'}</span>
            <Edit3 className="w-2.5 h-2.5 text-slate-400" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchComments(false)}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Refresh comments"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Moderation Error Banner */}
      {commentError && (
        <div className="p-3 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{commentError}</span>
          </div>
          <button onClick={() => setCommentError(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Comments Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            <span>Loading live comments...</span>
          </div>
        ) : Object.keys(groupedComments).length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-bold text-slate-400">No comments yet</p>
            <p className="text-[11px]">Be the first to share your thoughts on this stream!</p>
          </div>
        ) : (
          Object.entries(groupedComments).map(([dateGroup, groupComments]) => (
            <div key={dateGroup} className="space-y-4">
              {/* Daily Sticky Pill */}
              <div className="flex justify-center sticky top-0 z-10">
                <span className="px-3 py-1 rounded-full bg-slate-800/90 backdrop-blur-md text-slate-400 text-[10px] font-bold shadow-md border border-slate-700/60 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {dateGroup}
                </span>
              </div>

              {/* Threaded Root Comments */}
              <div className="space-y-4">
                {groupComments.map((comment) => (
                  <div key={comment.id} className="space-y-2 group">
                    <div className="p-3.5 rounded-2xl bg-[#141A29] border border-slate-800/80 hover:border-slate-700 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${getAvatarBg(
                              comment.author_name
                            )} flex items-center justify-center text-white font-extrabold text-xs shadow-md shrink-0`}
                          >
                            {comment.author_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-xs text-white block leading-tight">
                              {comment.author_name}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {formatTimeAgo(comment.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Like & Reply Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleLike(comment.id)}
                            className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                              likedIds.has(comment.id)
                                ? 'text-rose-500 bg-rose-500/10'
                                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
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
                                setReplyText('');
                              }
                            }}
                            className="px-2 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-blue-400 hover:bg-slate-800 flex items-center gap-1 transition-colors"
                          >
                            <Reply className="w-3.5 h-3.5" />
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed pl-9 break-words">
                        {comment.content}
                      </p>
                    </div>

                    {/* Inline Reply Composer */}
                    {replyingToId === comment.id && (
                      <div className="ml-9 p-3 rounded-2xl bg-slate-900 border border-blue-500/40 space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-[11px] text-blue-400 font-semibold">
                          <span>Replying to {comment.author_name}</span>
                          <button
                            onClick={() => setReplyingToId(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                postCommentOrReply(replyText, comment.id);
                              }
                            }}
                            placeholder="Type your reply..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => postCommentOrReply(replyText, comment.id)}
                            disabled={submitting || !replyText.trim()}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs disabled:opacity-50 transition-all flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Threaded Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-8 space-y-2 border-l-2 border-slate-800/80 pl-3 pt-1">
                        {comment.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="p-3 rounded-xl bg-[#121724] border border-slate-800/60"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className={`w-5 h-5 rounded-lg bg-gradient-to-tr ${getAvatarBg(
                                    reply.author_name
                                  )} flex items-center justify-center text-white font-bold text-[10px]`}
                                >
                                  {reply.author_name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-xs text-white">
                                  {reply.author_name}
                                </span>
                                <span className="text-[9px] text-slate-500">
                                  {formatTimeAgo(reply.created_at)}
                                </span>
                              </div>
                              <button
                                onClick={() => handleLike(reply.id)}
                                className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${
                                  likedIds.has(reply.id)
                                    ? 'text-rose-500'
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
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed pl-6 break-words">
                              {reply.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Main Composer & Coffee Support */}
      <div className="p-3 bg-[#141A29] border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <span>Speaking as:</span>
            <strong className="text-white">{userName || 'Guest User'}</strong>
          </span>
          <button
            onClick={() => openCoffeeModal(1)}
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-[10px] transition-colors"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Buy Us a Coffee</span>
          </button>
        </div>

        <div className="flex gap-2">
          <textarea
            ref={mainInputRef}
            rows={2}
            value={mainCommentText}
            onChange={(e) => setMainCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                postCommentOrReply(mainCommentText);
              }
            }}
            placeholder={
              userName
                ? `Join the live chat as ${userName}...`
                : 'Type your message (you will pick a nickname)...'
            }
            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />

          <button
            onClick={() => postCommentOrReply(mainCommentText)}
            disabled={submitting || !mainCommentText.trim()}
            className="px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-600/20 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Post</span>
          </button>
        </div>
      </div>

      {/* Nickname Selection Modal */}
      {isNameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F1420] border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-base flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span>Choose Your Nickname</span>
              </h4>
              <button
                onClick={() => setIsNameModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Pick a respectful nickname to participate in live TV and video comments.
            </p>

            {nameError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{nameError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNickname} className="space-y-4">
              <input
                type="text"
                autoFocus
                maxLength={40}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Mugabo Kigali"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Continue to Chat</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
