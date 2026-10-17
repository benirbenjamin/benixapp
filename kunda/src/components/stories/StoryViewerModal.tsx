import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Send, Trash2, Clock, CheckCircle, Eye } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export interface StoryItem {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  duration: number;
  caption?: string;
  segmentIndex?: number;
  totalSegments?: number;
  likesCount: number;
  viewsCount?: number;
  isLiked?: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface UserStoryGroup {
  userId: string;
  displayName: string;
  avatar: string;
  verifiedBadge?: boolean;
  isOwn?: boolean;
  stories: StoryItem[];
}

interface StoryViewerModalProps {
  isOpen: boolean;
  userGroups: UserStoryGroup[];
  initialUserIndex?: number;
  onClose: () => void;
  onStoryDeleted?: () => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  userGroups,
  initialUserIndex = 0,
  onClose,
  onStoryDeleted,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentUserIndex, setCurrentUserIndex] = useState<number>(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [replySent, setReplySent] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [viewsCount, setViewsCount] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressIntervalRef = useRef<any>(null);
  const [progressPct, setProgressPct] = useState<number>(0);

  const currentGroup = userGroups[currentUserIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  useEffect(() => {
    setCurrentUserIndex(initialUserIndex);
    setCurrentStoryIndex(0);
    setProgressPct(0);
  }, [initialUserIndex, isOpen]);

  useEffect(() => {
    if (!currentStory) return;
    setIsLiked(Boolean(currentStory.isLiked));
    setLikesCount(currentStory.likesCount || 0);
    setViewsCount(currentStory.viewsCount || 0);
    setProgressPct(0);
    setReplyText('');
    setReplySent(false);

    // Track story view in background
    api.post('/stories', { action: 'view', storyId: currentStory.id })
      .then((res) => {
        if (res.data?.success && typeof res.data.viewsCount === 'number') {
          setViewsCount(res.data.viewsCount);
        }
      })
      .catch(() => {});
  }, [currentStory]);

  // Timer loop for progress bar
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const durationSeconds = Math.max(3, currentStory.duration || (currentStory.mediaType === 'video' ? 15 : 5));
    const stepMs = 50;
    const increment = (stepMs / (durationSeconds * 1000)) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgressPct((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isOpen, currentStory, isPaused, currentUserIndex, currentStoryIndex]);

  if (!isOpen || !currentGroup || !currentStory) {
    return null;
  }

  const handleNextStory = () => {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else if (currentUserIndex < userGroups.length - 1) {
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex((prev) => prev - 1);
      const prevGroup = userGroups[currentUserIndex - 1];
      setCurrentStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const handleLike = async () => {
    try {
      const nextLiked = !isLiked;
      setIsLiked(nextLiked);
      setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));
      await api.post('/stories', { action: 'like', storyId: currentStory.id });
    } catch (e) {
      console.warn('Story like error:', e);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || replySent) return;

    try {
      await api.post('/messages/send', {
        recipientId: currentGroup.userId,
        content: `Replied to your story: "${replyText.trim()}"`,
      });
      setReplySent(true);
      setReplyText('');
      setTimeout(() => setReplySent(false), 3000);
    } catch (e) {
      console.warn('Story reply send error:', e);
    }
  };

  const handleDeleteStory = async () => {
    if (!window.confirm('Delete this story? It will be removed immediately.')) return;
    try {
      await api.delete(`/stories?id=${currentStory.id}`);
      if (onStoryDeleted) onStoryDeleted();
      handleNextStory();
    } catch (e) {
      console.warn('Delete story error:', e);
    }
  };

  const formatHoursLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.max(1, Math.round(diff / (1000 * 60 * 60)));
    return `${hours}h left`;
  };

  const isOwner = user?.id === currentGroup.userId || currentGroup.isOwn;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center select-none">
      {/* Background click to dismiss */}
      <div className="relative w-full max-w-sm md:max-w-md h-full md:h-[88vh] md:rounded-3xl overflow-hidden bg-black flex flex-col justify-between shadow-2xl">
        {/* Top Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 pt-4 flex gap-1">
          {currentGroup.stories.map((story, i) => {
            let width = '0%';
            if (i < currentStoryIndex) width = '100%';
            else if (i === currentStoryIndex) width = `${progressPct}%`;

            return (
              <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-white transition-all duration-75 ease-linear"
                  style={{ width }}
                />
              </div>
            );
          })}
        </div>

        {/* Top User Info Bar */}
        <div className="absolute top-7 left-0 right-0 z-30 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={currentGroup.avatar}
              alt={currentGroup.displayName}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-rose-500"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white text-xs font-semibold drop-shadow">{currentGroup.displayName}</span>
                {currentGroup.verifiedBadge && (
                  <CheckCircle className="w-3.5 h-3.5 text-rose-400 fill-rose-500/20" />
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-white/70">
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {formatHoursLeft(currentStory.expiresAt)}
                </span>
                <span className="flex items-center gap-1 bg-white/15 px-1.5 py-0.5 rounded-full text-[9px] text-white/90">
                  <Eye className="w-2.5 h-2.5 text-rose-300" />
                  {viewsCount} {viewsCount === 1 ? 'view' : 'views'}
                </span>
                {currentStory.totalSegments && currentStory.totalSegments > 1 && (
                  <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[9px]">
                    Part {currentStory.segmentIndex}/{currentStory.totalSegments}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isOwner && (
              <button
                onClick={handleDeleteStory}
                className="p-2 text-white/80 hover:text-rose-400 rounded-full hover:bg-white/10 transition-colors"
                title="Delete story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Story Media Viewer & Tap Navigation */}
        <div
          className="relative flex-1 flex items-center justify-center bg-black overflow-hidden"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {currentStory.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-contain"
            />
          )}

          {/* Left / Right Tap zones */}
          <button
            onClick={handlePrevStory}
            className="absolute left-0 top-16 bottom-24 w-1/3 z-20 focus:outline-none"
            aria-label="Previous story"
          />
          <button
            onClick={handleNextStory}
            className="absolute right-0 top-16 bottom-24 w-1/3 z-20 focus:outline-none"
            aria-label="Next story"
          />

          {/* Caption banner if present */}
          {currentStory.caption && (
            <div className="absolute bottom-20 left-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white text-xs px-3.5 py-2.5 rounded-2xl text-center leading-relaxed">
              {currentStory.caption}
            </div>
          )}
        </div>

        {/* Bottom Story Interaction Bar */}
        <div className="relative z-30 p-3 pb-4 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center gap-2">
          {!isOwner ? (
            <form onSubmit={handleSendReply} className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={replySent ? 'Reply sent! 🚀' : `Reply to ${currentGroup.displayName}...`}
                disabled={replySent}
                className="flex-1 bg-white/15 border border-white/20 focus:border-rose-400 rounded-full px-4 py-2 text-xs text-white placeholder-white/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || replySent}
                className="p-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-full transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex-1 text-center text-xs text-white/70 py-2">
              Your active 24h story • Visible to all members
            </div>
          )}

          <button
            onClick={handleLike}
            className={`p-2 rounded-full backdrop-blur-md transition-all ${
              isLiked ? 'bg-rose-500/20 text-rose-500 scale-110' : 'bg-white/15 text-white hover:text-rose-400'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500' : ''}`} />
          </button>
          {likesCount > 0 && (
            <span className="text-xs text-white font-semibold pr-1">{likesCount}</span>
          )}
        </div>
      </div>
    </div>
  );
};
