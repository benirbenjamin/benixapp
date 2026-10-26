import React, { useState, useEffect } from 'react';
import {
  Tv,
  Radio,
  Plus,
  Search,
  ExternalLink,
  Zap,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Save,
  Globe,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAuthToken } from '../../services/api';
import { StreamTesterModal } from './StreamTesterModal';

export const AdminStationsPanel: React.FC = () => {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'TV' | 'RADIO'>('all');
  const [search, setSearch] = useState<string>('');

  // Diagnostic Tester Modal
  const [testModal, setTestModal] = useState<{ url: string; name: string } | null>(null);

  // Add / Edit Station Modal
  const [editingStation, setEditingStation] = useState<any | null>(null);
  const [isNew, setIsNew] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/stations', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.stations) {
        setStations(data.stations);
      }
    } catch (err: any) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleOpenAdd = () => {
    setIsNew(true);
    setErrorMsg(null);
    setEditingStation({
      name: '',
      slug: '',
      description: '',
      logo_url: '/logo.png',
      stream_url: '',
      stream_type: 'HLS',
      station_type: 'TV',
      location: 'Kigali, Rwanda',
      frequency: '',
      accent_color: '#0284c7',
      is_active: true,
      is_featured: false,
      display_order: stations.length + 1
    });
  };

  const handleOpenEdit = (station: any) => {
    setIsNew(false);
    setErrorMsg(null);
    setEditingStation({ ...station });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      const token = getAuthToken();
      const url = isNew ? '/api/admin/stations' : `/api/admin/stations/${editingStation.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editingStation)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save station');

      setEditingStation(null);
      await fetchStations();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving station');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (station: any) => {
    if (!window.confirm(`Are you sure you want to delete station "${station.name}"?`)) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/stations/${station.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to delete station');
      await fetchStations();
    } catch (err: any) {
      alert(err.message || 'Error deleting station');
    }
  };

  const handleToggleActive = async (station: any) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/stations/${station.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ is_active: !station.is_active })
      });
      if (!res.ok) throw new Error('Failed to toggle station');
      await fetchStations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = stations.filter((s) => {
    if (filter !== 'all' && s.station_type !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || (s.frequency || '').toLowerCase().includes(q) || (s.location || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top TV and Radio Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TV Channels Card */}
        <div className="p-5 rounded-3xl bg-[#0B0E14] border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-purple-400 flex items-center gap-2">
              <Tv className="w-4 h-4" />
              <span>Rwandan TV Broadcasters ({stations.filter(s => s.station_type === 'TV').length} Channels)</span>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400">
              100% ONLINE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            National and commercial television feeds broadcasting via adaptive bitrate HLS. Supports picture-in-picture draggable player.
          </p>
          <div className="pt-1">
            <Link
              to="/tv"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-bold"
            >
              <span>Open TV Studio & PiP Player</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Radio Frequencies Card */}
        <div className="p-5 rounded-3xl bg-[#0B0E14] border border-slate-800 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-blue-400 flex items-center gap-2">
              <Radio className="w-4 h-4" />
              <span>Live Radio FM Frequencies ({stations.filter(s => s.station_type === 'RADIO').length} Stations)</span>
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400">
              100% ONLINE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Flagship national, commercial, and regional FM stations streaming seamlessly through HTTP Icecast audio stream proxies.
          </p>
          <div className="pt-1">
            <Link
              to="/radio"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold"
            >
              <span>Open Radio Player & Icecast Tuner</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Station Control Console */}
      <div className="p-6 rounded-3xl bg-[#0B0E14] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          
          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              All Broadcasts ({stations.length})
            </button>
            <button
              onClick={() => setFilter('TV')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'TV'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              TV Channels ({stations.filter(s => s.station_type === 'TV').length})
            </button>
            <button
              onClick={() => setFilter('RADIO')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'RADIO'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Radio Stations ({stations.filter(s => s.station_type === 'RADIO').length})
            </button>
          </div>

          {/* Search & Add Station Button */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search station or frequency..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 text-white outline-none focus:border-blue-500 w-64"
              />
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Station</span>
            </button>
          </div>
        </div>

        {/* Stations Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-3">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading TV and Radio stations from database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <Tv className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-white font-bold text-sm">No stations match your filter.</p>
            <p className="text-slate-400">Click &ldquo;Add Station&rdquo; above to register a new TV or Radio station.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121824] text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Station</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Frequency / Location</th>
                  <th className="p-3.5">Stream URL & Format</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#0E1422]">
                {filtered.map((station) => (
                  <tr key={station.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={station.logo_url || '/logo.png'}
                          alt={station.name}
                          className="w-9 h-9 rounded-xl object-contain bg-slate-900 border border-slate-800 shrink-0 p-1"
                        />
                        <div>
                          <span className="font-extrabold text-white text-xs block">{station.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">slug: {station.slug}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        station.station_type === 'TV'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {station.station_type}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-slate-200 block">{station.frequency || 'Web Stream'}</span>
                      <span className="text-[10px] text-slate-400">{station.location || 'Rwanda'}</span>
                    </td>

                    <td className="p-3.5">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 inline-block mb-1">
                        {station.stream_type || 'HLS'}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px] block truncate max-w-xs" title={station.stream_url}>
                        {station.stream_url}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleActive(station)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider transition-all ${
                          station.is_active
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                        }`}
                        title="Click to toggle active state"
                      >
                        {station.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Stream Diagnostic Tester Button */}
                        <button
                          onClick={() => setTestModal({ url: station.stream_url, name: station.name })}
                          className="px-2.5 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-[11px] flex items-center gap-1 transition-all"
                          title="Run Stream Diagnostic Ping"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Test Stream</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(station)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit Station"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(station)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Station"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Diagnostic Stream Tester Modal */}
      {testModal && (
        <StreamTesterModal
          url={testModal.url}
          name={testModal.name}
          onClose={() => setTestModal(null)}
        />
      )}

      {/* Add / Edit Station Modal */}
      {editingStation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-[#131926] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {editingStation.station_type === 'TV' ? <Tv className="w-5 h-5 text-purple-400" /> : <Radio className="w-5 h-5 text-blue-400" />}
                <h3 className="font-black text-white text-base">
                  {isNew ? 'Register New Station' : `Edit Station: ${editingStation.name}`}
                </h3>
              </div>
              <button
                onClick={() => setEditingStation(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Station Type *</label>
                  <select
                    value={editingStation.station_type}
                    onChange={(e) => setEditingStation({ ...editingStation, station_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-xs text-white rounded-xl outline-none focus:border-blue-500"
                  >
                    <option value="TV">TV Channel</option>
                    <option value="RADIO">Radio Station</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Stream Type *</label>
                  <select
                    value={editingStation.stream_type}
                    onChange={(e) => setEditingStation({ ...editingStation, stream_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-xs text-white rounded-xl outline-none focus:border-blue-500"
                  >
                    <option value="HLS">HLS (m3u8) Adaptive Stream</option>
                    <option value="AUDIO">Audio (MP3 / Icecast / Shoutcast)</option>
                    <option value="AAC">AAC Stream</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Station Name *</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., RTV Live, Kiss FM 102.3"
                  value={editingStation.name}
                  onChange={(e) => setEditingStation({ ...editingStation, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-xs text-white rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Live Stream URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://.../live/playlist.m3u8 or http://.../stream.mp3"
                  value={editingStation.stream_url}
                  onChange={(e) => setEditingStation({ ...editingStation, stream_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-xs text-white font-mono rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Frequency / Channel</label>
                  <input
                    type="text"
                    placeholder="E.g. 102.3 FM or Channel 01"
                    value={editingStation.frequency || ''}
                    onChange={(e) => setEditingStation({ ...editingStation, frequency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-xs text-white rounded-xl outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="E.g. Kigali, National Broadcast"
                    value={editingStation.location || ''}
                    onChange={(e) => setEditingStation({ ...editingStation, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-xs text-white rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Logo URL</label>
                <input
                  type="text"
                  placeholder="/logo.png or direct image URL"
                  value={editingStation.logo_url || ''}
                  onChange={(e) => setEditingStation({ ...editingStation, logo_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-xs text-white rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Station programming description..."
                  value={editingStation.description || ''}
                  onChange={(e) => setEditingStation({ ...editingStation, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-xs text-white rounded-xl outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStation(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving Station...' : 'Save Station'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
