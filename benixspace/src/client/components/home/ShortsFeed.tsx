import React, { useState } from 'react';
import { Play, Heart, MessageCircle, Share2, Sparkles, Tv, CheckCircle2, UserCheck } from 'lucide-react';

interface ShortItem {
  id: string;
  type: 'video_short' | 'kunda_post';
  title: string;
  author: string;
  avatar: string;
  badge: string;
  mediaUrl: string;
  likes: number;
  comments: number;
  bio?: string;
  age?: number;
  location?: string;
}

const SHORTS_ITEMS: ShortItem[] = [
  {
    id: 'sh1',
    type: 'video_short',
    title: 'Top 5 Tech Startups in Kigali 2026 🇷🇼',
    author: 'Benix Tech Insights',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    badge: 'TV Shorts',
    mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    likes: 1240,
    comments: 86
  },
  {
    id: 'kp1',
    type: 'kunda_post',
    title: 'Looking for someone who loves gospel music & mountain hiking in Musanze!',
    author: 'Grace Uwase',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    badge: 'Kunda Verified',
    mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    likes: 428,
    comments: 32,
    age: 24,
    location: 'Kigali, Gasabo'
  },
  {
    id: 'sh2',
    type: 'video_short',
    title: 'Voxify Choir Tenor Harmony Breakdown 🎶',
    author: 'Voxify Masterclasses',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    badge: 'Voxify Music',
    mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    likes: 890,
    comments: 45
  },
  {
    id: 'kp2',
    type: 'kunda_post',
    title: 'Architect & photographer. Passionate about art exhibitions & Sunday brunches.',
    author: 'David Mugisha',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    badge: 'Kunda Verified',
    mediaUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    likes: 312,
    comments: 18,
    age: 28,
    location: 'Kigali, Nyarugenge'
  }
];

export const ShortsFeed: React.FC = () => {
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [likedStatus, setLikedStatus] = useState<Record<string, boolean>>({});

  const handleLike = (id: string, initial: number) => {
    const isLiked = likedStatus[id];
    setLikedStatus({ ...likedStatus, [id]: !isLiked });
    setLikesMap({
      ...likesMap,
      [id]: (likesMap[id] ?? initial) + (isLiked ? -1 : 1)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-500" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Trending Shorts & Kunda Community Feed
          </h3>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Curated cross-app highlights
        </span>
      </div>

      {/* Grid of Shorts & Kunda Posts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {SHORTS_ITEMS.map((item) => {
          const currentLikes = likesMap[item.id] ?? item.likes;
          const isLiked = !!likedStatus[item.id];

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md group hover:shadow-xl transition-all flex flex-col justify-between"
            >
              {/* Media Card */}
              <div className="relative h-64 w-full overflow-hidden bg-slate-950">
                <img
                  src={item.mediaUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Overlay Badge */}
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-md border border-white/20 flex items-center gap-1">
                    {item.type === 'video_short' ? (
                      <Tv className="w-3 h-3 text-sky-400" />
                    ) : (
                      <Heart className="w-3 h-3 text-rose-400" />
                    )}
                    <span>{item.badge}</span>
                  </span>
                </div>

                {item.type === 'video_short' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md border border-white/50 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>
                )}
              </div>

              {/* Card Details & Actions */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <img
                      src={item.avatar}
                      alt={item.author}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.author}
                      {item.age && ` • ${item.age}`}
                    </span>
                    {item.type === 'kunda_post' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {item.title}
                  </p>
                  {item.location && (
                    <span className="text-[10px] text-slate-400 block mt-1">
                      📍 {item.location}
                    </span>
                  )}
                </div>

                {/* Footer Engagement Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <button
                    onClick={() => handleLike(item.id, item.likes)}
                    className={`flex items-center gap-1.5 transition-colors font-semibold ${
                      isLiked ? 'text-rose-600' : 'hover:text-rose-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{currentLikes}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4 text-slate-400" />
                    <span>{item.comments}</span>
                  </div>

                  {item.type === 'kunda_post' ? (
                    <button className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors">
                      Connect
                    </button>
                  ) : (
                    <button className="p-1 text-slate-400 hover:text-sky-600">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
