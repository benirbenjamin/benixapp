import React, { useState } from 'react';
import { Play, Sparkles, Heart, Radio, Tv, Music, X } from 'lucide-react';

interface Story {
  id: string;
  source: 'kunda' | 'tv' | 'radio' | 'voxify';
  author: string;
  avatar: string;
  title: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  time: string;
  badge: string;
}

const STORIES_DATA: Story[] = [
  {
    id: 's1',
    source: 'tv',
    author: 'Benix Space TV',
    avatar: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=150&auto=format&fit=crop&q=80',
    title: 'Kigali Evening Prime News Live Stream',
    mediaUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    time: 'Live',
    badge: 'TV Live'
  },
  {
    id: 's2',
    source: 'radio',
    author: 'Benix Radio FM',
    avatar: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=150&auto=format&fit=crop&q=80',
    title: 'DJ Live Session — Afrobeat & Gakondo Mix',
    mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    time: '15m ago',
    badge: 'On Air'
  },
  {
    id: 's3',
    source: 'kunda',
    author: 'Aline & Keza',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    title: 'Sunset Coffee date in Kimihurura ✨',
    mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    time: '1h ago',
    badge: 'Kunda Dating'
  },
  {
    id: 's4',
    source: 'voxify',
    author: 'Bethany Choir',
    avatar: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=150&auto=format&fit=crop&q=80',
    title: 'Soprano section practicing new Easter hymn',
    mediaUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    time: '2h ago',
    badge: 'Voxify Choir'
  },
  {
    id: 's5',
    source: 'kunda',
    author: 'Eric M.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    title: 'Weekend hiking in Nyungwe National Park 🌿',
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    time: '3h ago',
    badge: 'Kunda Dating'
  },
  {
    id: 's6',
    source: 'tv',
    author: 'Benix Sports',
    avatar: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80',
    title: 'Rwanda Premier League Matchday Highlights',
    mediaUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    time: '4h ago',
    badge: 'TV Sports'
  }
];

export const StoriesBar: React.FC = () => {
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Cross-Platform Stories & Moments
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">Tap to view</span>
        </div>

        {/* Stories Horizontal Reel */}
        <div className="flex items-center gap-3.5 overflow-x-auto pb-1 scrollbar-none">
          {STORIES_DATA.map((story) => {
            const isLive = story.time === 'Live';
            return (
              <button
                key={story.id}
                onClick={() => setActiveStory(story)}
                className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
              >
                <div
                  className={`w-16 h-16 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
                    isLive
                      ? 'bg-gradient-to-tr from-rose-500 via-amber-500 to-rose-600 animate-pulse ring-2 ring-rose-500/30'
                      : 'bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600'
                  }`}
                >
                  <img
                    src={story.avatar}
                    alt={story.author}
                    className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                  />
                </div>
                <div className="text-center w-20">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate group-hover:text-sky-600 transition-colors">
                    {story.author}
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    {story.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Story View Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            {/* Top Bar with user info & close */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeStory.avatar}
                  alt={activeStory.author}
                  className="w-9 h-9 rounded-full object-cover border border-white/50"
                />
                <div>
                  <span className="text-xs font-bold block">{activeStory.author}</span>
                  <span className="text-[10px] text-slate-300">{activeStory.time} • {activeStory.badge}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveStory(null)}
                className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Image / Background */}
            <div className="h-[480px] w-full relative">
              <img
                src={activeStory.mediaUrl}
                alt={activeStory.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white">
                <p className="text-sm font-bold leading-snug">{activeStory.title}</p>
                <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider block mt-1">
                  Shared on Benix.Space {activeStory.badge}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
