import React from 'react';
import { useTheme, ThemeMode, AccentColor } from '../../context/ThemeContext';
import { X, Sun, Moon, Sparkles, Check, Palette } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { mode, accent, setMode, setAccent } = useTheme();

  if (!isOpen) return null;

  const modes: { id: ThemeMode; label: string; desc: string; icon: any }[] = [
    { id: 'light', label: 'Daylight', desc: 'Crisp white & clean glass', icon: Sun },
    { id: 'dark', label: 'Dark Mode', desc: 'Slate gray, easy on eyes', icon: Moon },
    { id: 'midnight', label: 'Midnight', desc: 'Deep cosmic starlight blue', icon: Sparkles },
    { id: 'cyber', label: 'Cyberpunk', desc: 'High-contrast neon tech', icon: Palette }
  ];

  const accents: { id: AccentColor; label: string; bg: string; border: string }[] = [
    { id: 'sky', label: 'Sky Blue', bg: 'bg-sky-500', border: 'border-sky-500' },
    { id: 'indigo', label: 'Deep Indigo', bg: 'bg-indigo-600', border: 'border-indigo-600' },
    { id: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-500', border: 'border-emerald-500' },
    { id: 'rose', label: 'Kunda Rose', bg: 'bg-rose-500', border: 'border-rose-500' },
    { id: 'amber', label: 'Golden Amber', bg: 'bg-amber-500', border: 'border-amber-500' },
    { id: 'purple', label: 'Voxify Purple', bg: 'bg-purple-600', border: 'border-purple-600' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-sky-600" />
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Customize Experience
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display Mode Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Display Mode
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {modes.map((m) => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-600' : 'text-slate-500'}`} />
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-900 dark:text-white">{m.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{m.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color Palette */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Platform Accent Color
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {accents.map((acc) => {
              const isSelected = accent === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => setAccent(acc.id)}
                  className={`p-2.5 rounded-2xl border flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${acc.bg} shrink-0 shadow-sm`} />
                  <span className="text-xs text-slate-800 dark:text-slate-200 truncate">{acc.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Close / Done */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-sky-600 text-white font-bold text-xs shadow-md hover:bg-sky-700 transition-all"
          >
            Apply & Save Preferences
          </button>
        </div>

      </div>
    </div>
  );
};
