import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { getAuthToken } from '../services/api';
import { showToast } from '../utils/toast';
import { Share2, Zap } from 'lucide-react';

interface PostItem {
  id: string;
  title: string;
  thumbnailUrl?: string;
  authorName?: string;
  views?: number;
  isBoosted?: boolean;
  mediaUrl?: string;
}

export const PostsPage: React.FC = () => {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all([
      fetch('/api/shorts/feed', { headers }).then((r) => r.json()).catch(() => ({ shorts: [] })),
      fetch('/api/ads/active').then((r) => r.json()).catch(() => ({ ads: [] }))
    ])
      .then(([feedRes, adsRes]) => {
        const videos = (feedRes?.shorts || []).filter((s: any) => s.source === 'video' && s.isBoosted);
        setPosts(videos);
        setAds(adsRes?.ads || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const sharePost = async (item: PostItem) => {
    const token = getAuthToken();
    let shareId = '';
    if (token) {
      try {
        const res = await fetch('/api/videos/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ videoId: item.id })
        });
        const data = await res.json();
        if (data?.shareId) shareId = data.shareId;
      } catch {}
    }
    const url = `${window.location.origin}/videos/${item.id}${shareId ? `?shareId=${shareId}` : ''}`;
    if (navigator.share) {
      navigator.share({ title: item.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      showToast('Link copied! Share it to earn.', 'success');
    }
  };

  const shareAd = async (ad: any) => {
    const token = getAuthToken();
    if (token) {
      fetch('/api/ads/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adId: ad.id })
      }).catch(() => {});
    }
    const url = `${window.location.origin}/ad/${ad.id}`;
    if (navigator.share) {
      navigator.share({ title: ad.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      showToast('Ad link copied! Earn when friends click or view.', 'success');
    }
  };

  return (
    <>
      <SeoHead
        title="Posts — Boosted Videos & Sponsored Posts | BenixSpace"
        description="Browse boosted videos and sponsored posts on BenixSpace. Share posts to earn rewards."
      />
      <div className="min-h-screen bg-[#0B0E14] text-white py-8 px-4 sm:px-6 lg:px-10">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Posts</h1>
              <p className="text-xs text-slate-400">Boosted videos & sponsored posts — share to earn rewards</p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Loading posts...</div>
          ) : posts.length === 0 && ads.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              No posts yet. Boosted videos and sponsored ads will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Sponsored ads first */}
              {ads.map((ad) => (
                <div
                  key={`ad-${ad.id}`}
                  className="rounded-2xl overflow-hidden relative border border-amber-500/40 bg-slate-900 flex flex-col shadow-lg"
                >
                  <img
                    src={ad.mediaUrl || '/logo.png'}
                    alt={ad.title}
                    className="w-full aspect-[9/14] object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500 text-slate-950">
                      Sponsored
                    </span>
                  </div>
                  <div className="p-2.5 space-y-1.5 bg-[#0F141F]">
                    <p className="text-xs font-bold text-white line-clamp-2">{ad.title}</p>
                    <div className="flex gap-1.5">
                      <a
                        href={ad.targetUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          fetch('/api/ads/track-click', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ adId: ad.id })
                          }).catch(() => {});
                        }}
                        className="flex-1 px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black text-center"
                      >
                        Explore
                      </a>
                      <button
                        onClick={() => shareAd(ad)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold"
                        title="Share & Earn"
                      >
                        <Share2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Boosted video posts */}
              {posts.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl overflow-hidden relative border border-slate-800 hover:border-amber-500/40 bg-slate-900 flex flex-col shadow-lg transition"
                >
                  <Link to={`/videos/${item.id}`} className="block">
                    <img
                      src={item.thumbnailUrl || '/logo.png'}
                      alt={item.title}
                      className="w-full aspect-[9/14] object-cover"
                      loading="lazy"
                    />
                  </Link>
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Boosted
                    </span>
                  </div>
                  <div className="p-2.5 space-y-1.5 bg-[#0F141F]">
                    <p className="text-xs font-bold text-white line-clamp-2">{item.title}</p>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-slate-400 truncate">{item.authorName}</span>
                      <button
                        onClick={() => sharePost(item)}
                        className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shrink-0"
                        title="Share & Earn"
                      >
                        <Share2 className="w-3 h-3" /> Earn
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PostsPage;
