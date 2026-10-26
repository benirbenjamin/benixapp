import React, { useState } from 'react';
import { X, Play, CheckSquare, Square, Download, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getAuthToken } from '../../services/api';

interface PlaylistVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  creator: string;
  channelName: string;
  category: string;
  price: number;
  views: number;
  embedUrl: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const AdminYouTubePlaylistModal: React.FC<Props> = ({ isOpen, onClose, onImportComplete }) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleFetchPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/videos/youtube-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ playlistUrl: playlistUrl.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load playlist.');
      }

      setVideos(data.videos || []);
      // Default: select all
      const allIds = new Set<string>((data.videos || []).map((v: any) => v.id));
      setSelectedIds(allIds);
      setSuccessMsg(`Found ${data.videos?.length || 0} videos in playlist! Choose which to import.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching playlist.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === videos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(videos.map((v) => v.id)));
    }
  };

  const handleBatchImport = async () => {
    const toImport = videos.filter((v) => selectedIds.has(v.id));
    if (toImport.length === 0) {
      setErrorMsg('Please select at least one video to post.');
      return;
    }

    setImporting(true);
    setErrorMsg('');
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/videos/batch-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ videos: toImport })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import videos.');
      }

      setSuccessMsg(`🎉 Successfully posted ${toImport.length} videos to BenixSpace!`);
      setTimeout(() => {
        onImportComplete();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Batch import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-[#0F141F] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-red-600 via-rose-600 to-purple-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm">
              <Play className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                YouTube Automation Importer
              </span>
              <h2 className="text-lg font-black mt-0.5">Import YouTube Playlist to BenixSpace</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-200">
          <form onSubmit={handleFetchPlaylist} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              YouTube Playlist Link or Playlist ID
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                required
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="https://www.youtube.com/playlist?list=PLrAXtmErZgOdP_8GztsuKi9nrraNbKKp4"
                className="flex-1 p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Reading Playlist...' : 'Load All Videos'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Paste any public YouTube playlist URL. The app automatically fetches video titles, descriptions, and thumbnails with zero API key required.
            </p>
          </form>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Videos Grid / Selector */}
          {videos.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    {selectedIds.size === videos.length ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    <span>{selectedIds.size === videos.length ? 'Deselect All' : 'Select All'}</span>
                  </button>
                  <span className="text-xs font-semibold text-slate-400">
                    {selectedIds.size} of {videos.length} videos selected
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleBatchImport}
                  disabled={importing || selectedIds.size === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{importing ? 'Publishing to BenixSpace...' : `Publish ${selectedIds.size} Videos to BenixSpace`}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[46vh] overflow-y-auto pr-1">
                {videos.map((vid) => {
                  const isChecked = selectedIds.has(vid.id);
                  return (
                    <div
                      key={vid.id}
                      onClick={() => toggleSelect(vid.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                        isChecked
                          ? 'bg-slate-800/90 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                          : 'bg-[#121824] border-slate-800/80 hover:border-slate-700 opacity-60'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                          <img
                            src={vid.thumbnail}
                            alt={vid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-2 left-2">
                            {isChecked ? (
                              <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md">
                                <CheckSquare className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-black/60 text-white/70 flex items-center justify-center">
                                <Square className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                            {vid.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{vid.creator}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
