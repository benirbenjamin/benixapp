import React, { useState, useEffect } from 'react';
import {
  Play,
  Eye,
  Trash2,
  Users,
  Search,
  RefreshCw,
  Clock,
  Sparkles,
  AlertTriangle,
  X,
  ExternalLink
} from 'lucide-react';
import { getAuthToken } from '../../services/api';

export const AdminStoriesPanel: React.FC = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [viewersModal, setViewersModal] = useState<{ caption: string; viewers: any[] } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/stories/all', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.stories && Array.isArray(data.stories)) {
        setStories(data.stories);
      } else {
        // Fallback to public stories if admin endpoint empty
        const fallbackRes = await fetch('/api/modules/tv/stories');
        const fallbackData = await fallbackRes.json();
        if (fallbackData.stories) {
          setStories(fallbackData.stories);
        }
      }
    } catch (err: any) {
      console.error('Failed to load stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleDeleteStory = async (id: string, caption: string) => {
    if (!confirm(`Are you sure you want to delete story "${caption || 'Untitled'}"?`)) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/stories/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s.id !== id));
        setStatusMessage({ type: 'success', text: 'Story removed from platform.' });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to delete story' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error deleting story' });
    } finally {
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const filtered = stories.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.caption && s.caption.toLowerCase().includes(q)) ||
      (s.user_name && s.user_name.toLowerCase().includes(q)) ||
      (s.user_email && s.user_email.toLowerCase().includes(q))
    );
  });

  const totalViews = stories.reduce((acc, curr) => acc + (Number(curr.views_count) || (curr.viewers?.length || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-rose-400" />
            Active Ephemeral Stories & Audience Viewers
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit user and creator ephemeral stories (24-hour expiration), inspect viewer engagement logs, and remove non-compliant content.
          </p>
        </div>
        <button
          onClick={fetchStories}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stories
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span className="font-medium">Active Stories</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-rose-300">{stories.length}</div>
          <p className="text-[11px] text-rose-500/80 mt-1">Live in user feeds right now</p>
        </div>

        <div className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20">
          <div className="flex items-center justify-between text-xs text-sky-400 mb-1">
            <span className="font-medium">Aggregated Views</span>
            <Eye className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-sky-300">{totalViews.toLocaleString()}</div>
          <p className="text-[11px] text-sky-500/80 mt-1">Total audience impressions</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
            <span className="font-medium">Auto-Expiration</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-300">24 Hours</div>
          <p className="text-[11px] text-amber-500/80 mt-1">Automatic lifecycle purge</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          Showing <span className="font-bold text-white">{filtered.length}</span> live stories
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by caption, creator, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
          />
        </div>
      </div>

      {/* Stories Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-400" />
          Loading active stories...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
          No active stories found matching your filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((story) => {
            const isVideo = story.media_type === 'video' || (story.media_url && story.media_url.endsWith('.mp4'));
            const viewCount = Number(story.views_count) || (story.viewers ? story.viewers.length : 0);

            return (
              <div
                key={story.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden flex flex-col group hover:border-slate-700 transition"
              >
                {/* Media Preview */}
                <div className="relative aspect-[9/14] bg-black overflow-hidden flex items-center justify-center">
                  {isVideo ? (
                    <video
                      src={story.media_url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={story.media_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80'}
                      alt={story.caption || 'Story preview'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                  {/* Top Creator Info Badge */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px]">
                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                      <div className="w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold flex items-center justify-center">
                        {(story.user_name || 'U')[0].toUpperCase()}
                      </div>
                      <span className="font-semibold truncate max-w-[100px]">{story.user_name || 'Creator'}</span>
                    </div>

                    <span className="text-[10px] bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-slate-300 border border-white/10">
                      {story.created_at ? new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
                    </span>
                  </div>

                  {/* Bottom Caption Overlay */}
                  {story.caption && (
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white text-xs font-medium line-clamp-2 drop-shadow">
                      {story.caption}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() =>
                      setViewersModal({
                        caption: story.caption || 'Active Story',
                        viewers: story.viewers || []
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                    title="View audience impressions"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span>{viewCount} views</span>
                  </button>

                  <button
                    onClick={() => handleDeleteStory(story.id, story.caption)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                    title="Delete story permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audience Viewers Modal */}
      {viewersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Audience Viewers</h3>
              </div>
              <button
                onClick={() => setViewersModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 truncate">Story: &ldquo;{viewersModal.caption}&rdquo;</p>

            {(!viewersModal.viewers || viewersModal.viewers.length === 0) ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p>No viewer records logged yet.</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {viewersModal.viewers.map((viewer: any, idx: number) => (
                  <div
                    key={viewer.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">{viewer.name || 'BenixSpace User'}</p>
                      <span className="text-[10px] text-slate-400">{viewer.email || 'Verified Account'}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {viewer.viewed_at ? new Date(viewer.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewersModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
