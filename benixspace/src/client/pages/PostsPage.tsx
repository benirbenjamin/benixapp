import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../utils/toast';
import { Share2, Zap, X, Copy, Check, ExternalLink } from 'lucide-react';

interface PostItem {
  id: string;
  title: string;
  thumbnailUrl?: string;
  authorName?: string;
  views?: number;
  isBoosted?: boolean;
  mediaUrl?: string;
}

interface ShareTarget {
  kind: 'video' | 'ad';
  id: string;
  title: string;
}

export const PostsPage: React.FC = () => {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Share & Earn modal state
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [creatingShare, setCreatingShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all([
      fetch('/api/shorts/feed', { headers }).then((r) => r.json()).catch(() => ({ shorts: [] })),
      fetch('/api/ads/active').then((r) => r.json()).catch(() => ({ ads: [] }))
    ])
      .then(([feedRes, adsRes]) => {
        const videos = (feedRes?.shorts || []).filter(
          (s: any) => s.source === 'video'
        );
        setPosts(videos);
        setAds(adsRes?.ads || []);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const buildShareLink = useCallback(
    (kind: 'video' | 'ad', id: string, shareId: string) => {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://benix.space';
      const path = kind === 'ad' ? `/ad/${id}` : `/videos/${id}`;
      const params = new URLSearchParams();
      if (shareId) params.set('shareId', shareId);
      if (user?.referral_code) params.set('ref', user.referral_code);
      const qs = params.toString();
      return `${origin}${path}${qs ? `?${qs}` : ''}`;
    },
    [user?.referral_code]
  );

  const openShare = async (kind: 'video' | 'ad', item: { id: string; title: string }) => {
    setShareTarget({ kind, id: item.id, title: item.title });
    setShareLink(buildShareLink(kind, item.id, ''));
    setCopied(false);
    setCreatingShare(true);
    try {
      if (token) {
        const endpoint = kind === 'ad' ? '/api/ads/share' : '/api/videos/share';
        const body = kind === 'ad' ? { adId: item.id } : { videoId: item.id };
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data?.shareId) {
          setShareLink(buildShareLink(kind, item.id, data.shareId));
        }
      }
    } catch {
      // Keep the referral link even if the tracking record could not be created
    } finally {
      setCreatingShare(false);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard?.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      showToast('Share & Earn link copied!', 'success');
    } catch {
      showToast('Unable to copy the link. Please copy it manually.', 'error');
    }
  };

  const nativeShare = async () => {
    if (!shareTarget || !shareLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTarget.title,
          text: `${shareTarget.title} — ${shareLink}`
        });
      } catch {
        copyShareLink();
      }
    } else {
      copyShareLink();
    }
  };

  const closeShare = () => {
    setShareTarget(null);
    setShareLink('');
    setCopied(false);
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
                        onClick={() => openShare('ad', ad)}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold flex items-center gap-1"
                        title="Share & Earn"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Share &amp; Earn</span>
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
                        onClick={() => openShare('video', item)}
                        className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shrink-0"
                        title="Share & Earn"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Share &amp; Earn</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share & Earn Modal */}
      {shareTarget && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#121824] border border-amber-500/40 p-6 sm:p-8 shadow-2xl space-y-5">
            <button
              onClick={closeShare}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">Share &amp; Earn</h3>
                <p className="text-xs text-slate-400">Share this post with your referral link</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#1C1236]/60 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <p className="font-bold">How it works:</p>
              <p className="text-slate-300">
                {shareTarget.kind === 'ad'
                  ? 'Earn a reward when friends open your link and view or click the sponsored post.'
                  : 'Earn a reward when friends open your link and watch the boosted video for at least 2 minutes.'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Your Share &amp; Earn referral link:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={creatingShare ? 'Generating your link...' : shareLink}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-300 font-mono focus:outline-none"
                />
                <button
                  onClick={copyShareLink}
                  disabled={creatingShare || !shareLink}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 ${
                    copied ? 'bg-emerald-600 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={nativeShare}
                disabled={creatingShare || !shareLink}
                className="py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareTarget.title} — ${shareLink}`)}`}
                target="_blank"
                rel="noreferrer"
                className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostsPage;
