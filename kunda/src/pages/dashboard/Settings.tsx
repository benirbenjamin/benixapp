import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from '../../components/ui/Button';
import { Volume2, VolumeX, Globe, Trash2, ShieldCheck, Check } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, availableLanguages } = useLanguage();
  const { soundEnabled, setSoundEnabled, playNotificationSound } = useNotifications();

  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const handleTestSound = () => {
    playNotificationSound();
    setSavedMsg('Sound alert chime triggered!');
    setTimeout(() => setSavedMsg(null), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Account Settings</h1>
        <p className="text-xs text-slate-500">Language, notification sound, and security preferences</p>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-700">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* Language Preferences */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Globe className="w-4 h-4 text-rose-500" /> Interface Language
        </h3>
        <p className="text-xs text-slate-500">
          Choose your preferred language for the entire Kunda Space interface.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {(Object.keys(availableLanguages) as Array<keyof typeof availableLanguages>).map((code) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                language === code
                  ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {availableLanguages[code].flag} {availableLanguages[code].label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Sounds Toggle */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              Message Sound Alerts
            </h3>
            <p className="text-xs text-slate-500">
              Plays an audio chime when you receive a new private message.
            </p>
          </div>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
          />
        </div>

        <Button variant="outline" size="sm" onClick={handleTestSound}>
          Test Notification Chime
        </Button>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-white rounded-3xl border border-red-100 shadow-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-red-600 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-500" /> Account Termination
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Permanent removal of your profile, matching history, and stored preferences.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
              logout();
            }
          }}
        >
          Request Account Deletion
        </Button>
      </div>
    </div>
  );
};
