import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Building2, Plus, ArrowRight, ShieldCheck, X, Trash2, ExternalLink, Radio, LogIn } from 'lucide-react';
import { api } from '../../../api/client';

export function StationsManagerPage() {
  const { switchActiveStation } = useAuth();
  const [stations, setStations] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slogan: '',
    description: '',
    theme: 'theme1_modern',
    primary_color: '#4F46E5',
    admin_user_id: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [stList, adList] = await Promise.all([
        api.get('/superadmin/stations'),
        api.get('/superadmin/admins'),
      ]);
      setStations(stList);
      setAdmins(adList);
    } catch (err) {
      console.error('Failed to load stations data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/superadmin/stations', formData);
      setModalOpen(false);
      setFormData({
        name: '',
        slogan: '',
        description: '',
        theme: 'theme1_modern',
        primary_color: '#4F46E5',
        admin_user_id: '',
      });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create station.');
    }
  };

  const handleEnterStation = (station) => {
    switchActiveStation(station);
    window.location.href = '/admin';
  };

  const handleDeleteStation = async (stationId) => {
    if (confirm('Are you sure you want to delete or deactivate this station? All station-owned content will be removed.')) {
      try {
        await api.delete(`/superadmin/stations/${stationId}`);
        loadData();
      } catch (err) {
        alert(err.message || 'Failed to remove station.');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Radio Stations Management</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create, deploy, enter, and administer all radio stations across the multi-tenant platform.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Radio Station</span>
        </button>
      </div>

      {/* Stations List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading radio stations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((st) => (
            <div
              key={st.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-6 hover:shadow-lg transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {st.logo_url ? (
                      <img src={st.logo_url} alt="" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 flex-shrink-0" />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black"
                        style={{ backgroundColor: st.primary_color || '#4F46E5' }}
                      >
                        <Radio className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-base text-slate-900 truncate">{st.name}</h3>
                      <p className="text-xs text-indigo-600 font-mono font-medium">/{st.slug}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      st.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {st.status}
                  </span>
                </div>

                {st.slogan && <p className="text-xs text-slate-500 line-clamp-1">{st.slogan}</p>}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Theme</span>
                    <span className="font-bold text-slate-700 capitalize">
                      {st.theme ? st.theme.replace('theme', 'T').replace('_', ' ') : 'Theme 1'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Admin</span>
                    <span className="font-bold text-slate-700 truncate block">
                      {st.assigned_admin || 'None Assigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleEnterStation(st)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  title="Switch console context to this station"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Enter Station</span>
                </button>

                <div className="flex items-center gap-1">
                  <a
                    href={`/station/${st.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    title="View public website"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDeleteStation(st.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-slate-100"
                    title="Delete station"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Create Station Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">Create New Radio Station</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStation} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Radio Station Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kigali Wave 94.7 FM or Nile Radio"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Slogan (Optional)
                </label>
                <input
                  type="text"
                  value={formData.slogan}
                  onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                  placeholder="e.g. The Sound of the Nation"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Station broadcast mission..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Initial Theme
                  </label>
                  <select
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="theme1_modern">Theme 1 (Modern Radio)</option>
                    <option value="theme2_classic">Theme 2 (Classic FM)</option>
                    <option value="theme3_entertainment">Theme 3 (Entertainment)</option>
                    <option value="theme4_news">Theme 4 (News Radio)</option>
                    <option value="theme5_minimal">Theme 5 (Minimal)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Assign Administrator
                  </label>
                  <select
                    value={formData.admin_user_id}
                    onChange={(e) => setFormData({ ...formData, admin_user_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="">None (Super Admin only)</option>
                    {admins.map((ad) => (
                      <option key={ad.id} value={ad.id}>
                        {ad.username} ({ad.email})
                      </option>
                    ))}
                  </select>
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
                  Deploy Station
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
