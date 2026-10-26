import React, { useState } from 'react';
import { X, Eye, Plus, Minus, Save, Sparkles, CheckCircle2 } from 'lucide-react';
import { getAuthToken } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  video: { id: string; title: string; views: number; thumbnail?: string } | null;
  onSuccess: () => void;
}

export const AdminVideoEditViewsModal: React.FC<Props> = ({ isOpen, onClose, video, onSuccess }) => {
  if (!isOpen || !video) return null;

  const [viewsCount, setViewsCount] = useState<number>(video.views || 0);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg('');

    try {
      const token = getAuthToken();
      const res = await fetch(`/api/admin/videos/${video.id}/views`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ views: Number(viewsCount) })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(`Views updated to ${Number(viewsCount).toLocaleString()}!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        alert(data.error || 'Failed to update views.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating views.');
    } finally {
      setSaving(false);
    }
  };

  const adjustViews = (delta: number) => {
    setViewsCount((prev) => Math.max(0, prev + delta));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#0F141F] border border-slate-800 rounded-3xl shadow-2xl p-6 text-white space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <h3 className="font-black text-sm text-white">Adjust Video Views</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{video.title}</h4>
          <p className="text-[11px] text-slate-400">Set a custom public view count or increment/decrement with quick presets.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Public View Count
            </label>
            <div className="relative">
              <Eye className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="number"
                min="0"
                required
                value={viewsCount}
                onChange={(e) => setViewsCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-lg font-black text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Quick Increment/Decrement Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '+500', delta: 500 },
              { label: '+2,500', delta: 2500 },
              { label: '+10,000', delta: 10000 },
              { label: '+50,000', delta: 50000 }
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => adjustViews(btn.delta)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>

          {statusMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating...' : 'Save Views'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
