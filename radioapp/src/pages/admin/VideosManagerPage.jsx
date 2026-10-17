import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Video, Plus, Edit2, Trash2, X, Play, Youtube, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';

export function VideosManagerPage() {
  const { activeAdminStation } = useAuth();
  const stationId = activeAdminStation?.id;

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    youtube_url: '',
    description: '',
    status: 'active',
    show_on_homepage: true,
  });

  const loadVideos = async () => {
    if (!stationId) return;
    setLoading(true);
    try {
      const data = await api.get(`/stations/${stationId}/videos?status=all`);
      setVideos(data);
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [stationId]);

  const openCreateModal = () => {
    setEditingVideo(null);
    setFormData({
      title: '',
      youtube_url: '',
      description: '',
      status: 'active',
      show_on_homepage: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (v) => {
    setEditingVideo(v);
    setFormData({
      title: v.title,
      youtube_url: v.youtube_url,
      description: v.description || '',
      status: v.status,
      show_on_homepage: Boolean(v.show_on_homepage),
    });
    setModalOpen(true);
  };

  const handleSaveVideo = async (e) => {
    e.preventDefault();
    try {
      if (editingVideo) {
        await api.put(`/stations/${stationId}/videos/${editingVideo.id}`, formData);
      } else {
        await api.post(`/stations/${stationId}/videos`, formData);
      }
      setModalOpen(false);
      loadVideos();
    } catch (err) {
      alert(err.message || 'Failed to save video.');
    }
  };

  const handleDeleteVideo = async (id) => {
    if (confirm('Are you sure you want to delete this YouTube video?')) {
      try {
        await api.delete(`/stations/${stationId}/videos/${id}`);
        loadVideos();
      } catch (err) {
        alert(err.message || 'Failed to delete video.');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">YouTube Videos Gallery</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Add studio interviews, unplugged acoustic sessions, and show highlights from YouTube.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add YouTube Video</span>
        </button>
      </div>

      {/* Video Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading videos...</div>
      ) : videos.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
          <Video className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-base">No YouTube videos added yet</h3>
          <p className="text-xs text-slate-400">Click "Add YouTube Video" above to feature your first broadcast clip.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 relative">
                  <img
                    src={`https://img.youtube.com/vi/${vid.video_id}/hqdefault.jpg`}
                    alt={vid.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white flex items-center gap-1">
                    <Youtube className="w-3 h-3" />
                    <span>YouTube</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-2">{vid.title}</h3>
                  {vid.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{vid.description}</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    vid.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {vid.status}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(vid)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteVideo(vid.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Video Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingVideo ? 'Edit YouTube Video' : 'Add YouTube Video'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Video Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Studio Live Acoustic Session"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  YouTube Video Link
                </label>
                <input
                  type="url"
                  required
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  The video ID will automatically be parsed and embedded responsively.
                </span>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief context about this recording..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="disabled">Disabled (Hidden)</option>
                  </select>
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.show_on_homepage}
                      onChange={(e) => setFormData({ ...formData, show_on_homepage: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Show on Homepage</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm"
                >
                  Save Video
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
