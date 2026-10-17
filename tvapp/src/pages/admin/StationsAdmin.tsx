import React, { useEffect, useState } from 'react';
import {
  Radio,
  Tv,
  Plus,
  Edit2,
  Trash2,
  Activity,
  CheckCircle,
  XCircle,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Search,
} from 'lucide-react';
import { Station } from '../../types';
import { getStations, createStation, updateStation, deleteStation } from '../../services/api';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { StreamTesterModal } from '../../components/admin/StreamTesterModal';

export const StationsAdminPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Diagnostic modal state
  const [testModal, setTestModal] = useState<{ url: string; name: string } | null>(null);

  // Edit / Add modal state
  const [editingStation, setEditingStation] = useState<Partial<Station> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const data = await getStations({ include_inactive: true });
      setStations(data);
    } catch (err) {
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
    setEditingStation({
      name: '',
      slug: '',
      description: '',
      logo_url: '/logo.png',
      stream_url: '',
      stream_type: 'AUDIO',
      station_type: 'RADIO',
      location: 'Kigali, Rwanda',
      frequency: '',
      accent_color: '#0284c7',
      is_active: true,
      is_featured: false,
      display_order: stations.length + 1,
    });
    setErrorMsg(null);
  };

  const handleOpenEdit = (station: Station) => {
    setIsNew(false);
    setEditingStation({ ...station });
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      if (isNew) {
        await createStation(editingStation);
      } else if (editingStation.id) {
        await updateStation(editingStation.id, editingStation);
      }
      setEditingStation(null);
      await fetchStations();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save station');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (station: Station) => {
    if (!window.confirm(`Are you sure you want to delete "${station.name}"?`)) return;
    try {
      await deleteStation(station.id);
      await fetchStations();
    } catch (err: any) {
      alert(err.message || 'Failed to delete station');
    }
  };

  const handleToggleActive = async (station: Station) => {
    try {
      await updateStation(station.id, { is_active: !station.is_active });
      await fetchStations();
    } catch (err: any) {
      alert(err.message || 'Failed to update active state');
    }
  };

  const filteredStations = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.frequency && s.frequency.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.location && s.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Top Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Station & Live Stream Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Add, update streaming URLs, test reachability, and manage RTV & Radio channels
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-rba-blue hover:bg-rba-blueHover text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add New Station
          </button>
        </div>

        {/* Search Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stations by name, frequency, location..."
            className="w-full text-xs sm:text-sm bg-transparent focus:outline-none"
          />
        </div>

        {/* Stations Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Station</th>
                  <th className="px-4 py-4">Type / Format</th>
                  <th className="px-4 py-4">Stream URL</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-center">Active</th>
                  <th className="px-4 py-4 text-center">Featured</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      Loading stations from database...
                    </td>
                  </tr>
                ) : filteredStations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No stations found. Click "Add New Station" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredStations.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Logo */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl p-1.5 flex items-center justify-center shrink-0 border border-slate-200"
                            style={{ backgroundColor: st.accent_color || '#f1f5f9' }}
                          >
                            <img
                              src={st.logo_url || '/logo.png'}
                              alt={st.name}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm block">
                              {st.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {st.frequency ? `${st.frequency} • ` : ''}{st.location || 'Rwanda'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex font-bold text-[10px] uppercase tracking-wider ${
                            st.station_type === 'TV' ? 'text-red-600' : 'text-rba-blue'
                          }`}>
                            {st.station_type}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{st.stream_type}</span>
                        </div>
                      </td>

                      {/* Stream URL */}
                      <td className="px-4 py-4 max-w-xs">
                        <div className="font-mono text-[11px] text-slate-700 truncate" title={st.stream_url}>
                          {st.stream_url}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          st.status === 'ONLINE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {st.status}
                        </span>
                      </td>

                      {/* Active Toggle */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(st)}
                          className={`w-8 h-4 rounded-full transition-colors relative inline-block ${
                            st.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
                              st.is_active ? 'right-0.5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Featured */}
                      <td className="px-4 py-4 text-center">
                        {st.is_featured ? (
                          <span className="p-1 rounded-md bg-amber-100 text-amber-700 inline-block" title="Featured on Homepage">
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right space-x-1">
                        <button
                          onClick={() => setTestModal({ url: st.stream_url, name: st.name })}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors"
                          title="Run reachability diagnostic"
                        >
                          <Activity className="w-3.5 h-3.5 text-rba-blue" />
                          Test Stream
                        </button>

                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rba-blue hover:bg-slate-100 transition-colors"
                          title="Edit Station"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(st)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Station"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stream Diagnostic Modal */}
        {testModal && (
          <StreamTesterModal
            url={testModal.url}
            name={testModal.name}
            onClose={() => setTestModal(null)}
          />
        )}

        {/* Add/Edit Station Modal Form */}
        {editingStation && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp my-8">
              <h2 className="text-xl font-black text-slate-900 mb-4">
                {isNew ? 'Add New Broadcast Station' : `Edit Station: ${editingStation.name}`}
              </h2>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Station Name *</label>
                    <input
                      type="text"
                      required
                      value={editingStation.name || ''}
                      onChange={(e) => setEditingStation({ ...editingStation, name: e.target.value })}
                      placeholder="e.g. Radio Rwanda"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Slug (URL identifier)</label>
                    <input
                      type="text"
                      value={editingStation.slug || ''}
                      onChange={(e) => setEditingStation({ ...editingStation, slug: e.target.value })}
                      placeholder="e.g. radio-rwanda"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Live Stream URL *</label>
                  <input
                    type="url"
                    required
                    value={editingStation.stream_url || ''}
                    onChange={(e) => setEditingStation({ ...editingStation, stream_url: e.target.value })}
                    placeholder="https://listen.rba.co.rw:8008/rwanda or .m3u8"
                    className="w-full px-3.5 py-2 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Direct browser connection URL (Shoutcast/Icecast MP3/AAC or HLS .m3u8)
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Station Type</label>
                    <select
                      value={editingStation.station_type || 'RADIO'}
                      onChange={(e) =>
                        setEditingStation({
                          ...editingStation,
                          station_type: e.target.value as any,
                          stream_type: e.target.value === 'TV' ? 'HLS' : 'AUDIO',
                        })
                      }
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                    >
                      <option value="RADIO">RADIO</option>
                      <option value="TV">TV</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Stream Protocol</label>
                    <select
                      value={editingStation.stream_type || 'AUDIO'}
                      onChange={(e) => setEditingStation({ ...editingStation, stream_type: e.target.value as any })}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                    >
                      <option value="AUDIO">AUDIO (HTML5)</option>
                      <option value="HLS">HLS (.m3u8)</option>
                      <option value="VIDEO">VIDEO (MP4)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Frequency / Channel</label>
                    <input
                      type="text"
                      value={editingStation.frequency || ''}
                      onChange={(e) => setEditingStation({ ...editingStation, frequency: e.target.value })}
                      placeholder="e.g. 100.7 FM"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Location / Province</label>
                    <input
                      type="text"
                      value={editingStation.location || ''}
                      onChange={(e) => setEditingStation({ ...editingStation, location: e.target.value })}
                      placeholder="e.g. Kigali, Western Province"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Logo URL</label>
                    <input
                      type="text"
                      value={editingStation.logo_url || ''}
                      onChange={(e) => setEditingStation({ ...editingStation, logo_url: e.target.value })}
                      placeholder="/logo.png or https://..."
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editingStation.description || ''}
                    onChange={(e) => setEditingStation({ ...editingStation, description: e.target.value })}
                    placeholder="Short description of the broadcast station..."
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingStation.is_active ?? true}
                      onChange={(e) => setEditingStation({ ...editingStation, is_active: e.target.checked })}
                      className="rounded text-rba-blue"
                    />
                    <span>Active Station</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingStation.is_featured ?? false}
                      onChange={(e) => setEditingStation({ ...editingStation, is_featured: e.target.checked })}
                      className="rounded text-rba-blue"
                    />
                    <span>Feature on Homepage</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <label className="font-semibold text-slate-700">Display Order:</label>
                    <input
                      type="number"
                      value={editingStation.display_order || 0}
                      onChange={(e) => setEditingStation({ ...editingStation, display_order: parseInt(e.target.value, 10) || 0 })}
                      className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-center"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingStation(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-rba-blue hover:bg-rba-blueHover text-white font-bold transition-all shadow-md disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Station'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
