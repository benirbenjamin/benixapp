import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Plus, Edit2, Trash2, Clock, User, X, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { api } from '../../api/client';

export function ProgramsPage() {
  const { activeAdminStation } = useAuth();
  const stationId = activeAdminStation?.id;

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [formData, setFormData] = useState({
    title: '',
    presenter: '',
    description: '',
    image_url: '',
    days_of_week: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    start_time: '06:00',
    end_time: '10:00',
    status: 'active',
    show_on_homepage: true,
  });

  const loadPrograms = async () => {
    if (!stationId) return;
    setLoading(true);
    try {
      const data = await api.get(`/stations/${stationId}/programs`);
      setPrograms(data);
    } catch (err) {
      console.error('Failed to load programs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, [stationId]);

  const openCreateModal = () => {
    setEditingProgram(null);
    setFormData({
      title: '',
      presenter: '',
      description: '',
      image_url: '',
      days_of_week: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      start_time: '06:00',
      end_time: '10:00',
      status: 'active',
      show_on_homepage: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProgram(p);
    let parsedDays = ['Monday'];
    try {
      parsedDays = typeof p.days_of_week === 'string' ? JSON.parse(p.days_of_week) : p.days_of_week;
    } catch (e) {}

    setFormData({
      title: p.title,
      presenter: p.presenter,
      description: p.description || '',
      image_url: p.image_url || '',
      days_of_week: Array.isArray(parsedDays) ? parsedDays : ['Monday'],
      start_time: p.start_time,
      end_time: p.end_time,
      status: p.status,
      show_on_homepage: Boolean(p.show_on_homepage),
    });
    setModalOpen(true);
  };

  const handleToggleDay = (day) => {
    const current = [...formData.days_of_week];
    if (current.includes(day)) {
      setFormData({ ...formData, days_of_week: current.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, days_of_week: [...current, day] });
    }
  };

  const handleSaveProgram = async (e) => {
    e.preventDefault();
    if (formData.days_of_week.length === 0) {
      alert('Please select at least one day of the week for this program.');
      return;
    }

    try {
      if (editingProgram) {
        await api.put(`/stations/${stationId}/programs/${editingProgram.id}`, formData);
      } else {
        await api.post(`/stations/${stationId}/programs`, formData);
      }
      setModalOpen(false);
      loadPrograms();
    } catch (err) {
      alert(err.message || 'Failed to save program.');
    }
  };

  const handleDeleteProgram = async (id) => {
    if (confirm('Are you sure you want to remove this radio show?')) {
      try {
        await api.delete(`/stations/${stationId}/programs/${id}`);
        loadPrograms();
      } catch (err) {
        alert(err.message || 'Failed to delete program.');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Programs & Schedule</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage daily radio shows, presenters, broadcast times, and On-Air highlights.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Show</span>
        </button>
      </div>

      {/* Program Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading programs...</div>
      ) : programs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-base">No radio shows configured</h3>
          <p className="text-xs text-slate-400">Click "Add New Show" above to populate the broadcast schedule.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((prog) => {
            let days = [];
            try {
              days = typeof prog.days_of_week === 'string' ? JSON.parse(prog.days_of_week) : prog.days_of_week;
            } catch (e) {}

            return (
              <div
                key={prog.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 relative">
                    {prog.image_url ? (
                      <img src={prog.image_url} alt={prog.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{prog.start_time} - {prog.end_time}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-base text-slate-900">{prog.title}</h3>
                    <p className="text-xs font-semibold text-indigo-600 flex items-center gap-1 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                      <span>{prog.presenter}</span>
                    </p>
                    {prog.description && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {prog.description}
                      </p>
                    )}
                  </div>

                  {/* Broadcast Days Badges */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {Array.isArray(days) && days.map(d => (
                      <span key={d} className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600">
                        {d.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase ${prog.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {prog.status}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(prog)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProgram(prog.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Program Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingProgram ? 'Edit Show' : 'Add Radio Show'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Show Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. The Morning Rush"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Presenter(s)
                </label>
                <input
                  type="text"
                  required
                  value={formData.presenter}
                  onChange={(e) => setFormData({ ...formData, presenter: e.target.value })}
                  placeholder="e.g. David & Sandrine"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Start Time (HH:MM)
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    End Time (HH:MM)
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Broadcast Days Picker */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Broadcast Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {daysList.map((day) => {
                    const selected = formData.days_of_week.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                          selected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                  placeholder="Show synopsis and music style..."
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
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
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
                  Save Show
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
