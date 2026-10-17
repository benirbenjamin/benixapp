import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Radio, Plus, Trash2, Edit2, CheckCircle2, Play, Pause, AlertCircle, X, Volume2 } from 'lucide-react';
import { api } from '../../api/client';

export function StreamsPage() {
  const { activeAdminStation } = useAuth();
  const stationId = activeAdminStation?.id;

  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStream, setEditingStream] = useState(null);

  // Test player state in dashboard
  const [testingStreamUrl, setTestingStreamUrl] = useState(null);
  const [testPlaying, setTestPlaying] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    stream_url: '',
    description: '',
    is_default: false,
    status: 'active',
  });

  const loadStreams = async () => {
    if (!stationId) return;
    setLoading(true);
    try {
      const data = await api.get(`/stations/${stationId}/streams`);
      setStreams(data);
    } catch (err) {
      console.error('Failed to load streams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStreams();
  }, [stationId]);

  const openCreateModal = () => {
    setEditingStream(null);
    setFormData({
      name: '',
      stream_url: '',
      description: '',
      is_default: streams.length === 0,
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (stream) => {
    setEditingStream(stream);
    setFormData({
      name: stream.name,
      stream_url: stream.stream_url,
      description: stream.description || '',
      is_default: Boolean(stream.is_default),
      status: stream.status,
    });
    setModalOpen(true);
  };

  const handleSaveStream = async (e) => {
    e.preventDefault();
    try {
      if (editingStream) {
        await api.put(`/stations/${stationId}/streams/${editingStream.id}`, formData);
      } else {
        await api.post(`/stations/${stationId}/streams`, formData);
      }
      setModalOpen(false);
      loadStreams();
    } catch (err) {
      alert(err.message || 'Failed to save stream.');
    }
  };

  const handleDeleteStream = async (id) => {
    if (confirm('Are you sure you want to delete this radio stream?')) {
      try {
        await api.delete(`/stations/${stationId}/streams/${id}`);
        loadStreams();
      } catch (err) {
        alert(err.message || 'Failed to delete stream.');
      }
    }
  };

  const handleToggleTestPlay = (url) => {
    const audioEl = document.getElementById('dashboard-test-audio');
    if (!audioEl) return;

    if (testingStreamUrl === url && testPlaying) {
      audioEl.pause();
      setTestPlaying(false);
      setTestingStreamUrl(null);
    } else {
      setTestingStreamUrl(url);
      audioEl.src = url;
      audioEl.play()
        .then(() => setTestPlaying(true))
        .catch(() => alert('Could not connect to this stream URL. Please verify the URL format and CORS headers.'));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Hidden test audio element */}
      <audio id="dashboard-test-audio" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Radio Streams Manager</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure live broadcast audio feeds, MP3/AAC streams, and secondary channels for {activeAdminStation?.name}.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Stream</span>
        </button>
      </div>

      {/* Stream Cards List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading radio streams...</div>
      ) : streams.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
          <Radio className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-base">No streams configured yet</h3>
          <p className="text-xs text-slate-400">Click "Add New Stream" above to configure your station's live audio feed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {streams.map((st) => (
            <div
              key={st.id}
              className={`p-6 rounded-3xl bg-white border shadow-xs space-y-4 transition-all ${
                st.is_default ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900 truncate">{st.name}</h3>
                    {st.is_default && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                        Default Channel
                      </span>
                    )}
                  </div>
                  {st.description && <p className="text-xs text-slate-500 line-clamp-2">{st.description}</p>}
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    st.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {st.status}
                </span>
              </div>

              {/* Stream URL Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <code className="text-xs font-mono text-slate-600 truncate flex-1">{st.stream_url}</code>
                <button
                  onClick={() => handleToggleTestPlay(st.stream_url)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    testingStreamUrl === st.stream_url && testPlaying
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                  title="Test stream playback"
                >
                  {testingStreamUrl === st.stream_url && testPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Test</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Test Audio</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(st)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleDeleteStream(st.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Stream Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingStream ? 'Edit Radio Stream' : 'Add New Radio Stream'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStream} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Stream Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Main FM Live (94.7 FM) or Afrobeats Chill"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Stream Audio URL (HTTPS / MP3 / AAC / Icecast)
                </label>
                <input
                  type="url"
                  required
                  value={formData.stream_url}
                  onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                  placeholder="https://stream.zeno.fm/... or https://icecast.example.com/live"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Must be an active HTTPS streaming endpoint supported by web browsers.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Studio A Master audio feed at 320kbps"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value="active">Active (Visible Publicly)</option>
                    <option value="disabled">Disabled (Hidden)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Primary Default Stream</span>
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
                  Save Stream
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
