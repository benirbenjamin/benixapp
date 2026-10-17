'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { createClient } from '@/lib/supabase/client';
import { ChoirSettings } from '@/lib/types/database.types';
import {
  ArrowLeft,
  Settings,
  ShieldCheck,
  Copy,
  Check,
  Save,
  CheckCircle2,
  AlertCircle,
  Download,
  FileText,
  UserCheck,
  Bell
} from 'lucide-react';

export default function ChoirSettingsPage() {
  const { activeChoir, isAdmin, selectChoir } = useChoir();

  const [settings, setSettings] = useState<ChoirSettings>({
    auto_approve_members: false,
    allow_code_join: true,
    allow_invite_links: true,
    allow_audio_downloads: true,
    allow_pdf_downloads: true,
    enable_email_notifications: true,
    enable_push_notifications: true,
  });

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (activeChoir?.settings) {
      setSettings(prev => ({
        ...prev,
        ...activeChoir.settings,
      }));
    }
  }, [activeChoir]);

  if (!isAdmin) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-4">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-xs">You must be a Choir Director or Admin to access settings.</p>
      </div>
    );
  }

  const handleCopyCode = () => {
    if (!activeChoir?.choir_code) return;
    navigator.clipboard.writeText(activeChoir.choir_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = (key: keyof ChoirSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChoir) return;

    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from('choirs')
      .update({
        settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeChoir.id);

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update settings.' });
    } else {
      setMessage({ type: 'success', text: 'Choir settings saved successfully!' });
      // Refresh active choir context
      selectChoir(activeChoir.id);
    }

    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-900 dark:text-white">
      <Link href="/manage" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Choir Admin
      </Link>

      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" /> Choir Settings &amp; Rules
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure member auto-approval, downloadable media permissions, and notifications</p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Choir Join Code Card */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Choir Invitation Code</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Share this code with singers to let them join {activeChoir?.name}</p>

        <div className="flex items-center gap-4 max-w-sm">
          <div className="bg-slate-50 dark:bg-slate-950 border border-blue-200 dark:border-blue-800/40 px-5 py-3 rounded-2xl font-mono text-xl font-bold tracking-widest text-blue-700 dark:text-blue-300 flex-1 text-center shadow-inner">
            {activeChoir?.choir_code}
          </div>
          <button
            onClick={handleCopyCode}
            className="bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-4 py-3.5 rounded-2xl border border-blue-200 dark:border-blue-800/40 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Member Approval &amp; Access
          </h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-400 dark:hover:border-slate-700 transition-colors">
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white block">Auto-Approve New Members</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Automatically admit new singers when they enter the choir code without manual review</span>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_approve_members}
                onChange={() => handleToggle('auto_approve_members')}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-400 dark:hover:border-slate-700 transition-colors">
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white block">Allow Code Join</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Enable singers to find and request to join using the 6-character choir code</span>
              </div>
              <input
                type="checkbox"
                checked={settings.allow_code_join}
                onChange={() => handleToggle('allow_code_join')}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 pt-4">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Media &amp; Downloads
          </h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-400 dark:hover:border-slate-700 transition-colors">
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white block flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Allow Audio Track Downloads
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Allow choir members to download MP3/WAV voice parts for offline practice</span>
              </div>
              <input
                type="checkbox"
                checked={settings.allow_audio_downloads}
                onChange={() => handleToggle('allow_audio_downloads')}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-400 dark:hover:border-slate-700 transition-colors">
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white block flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-500" /> Allow Sheet Music PDF Downloads
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Allow choir members to download original PDF sheet music files</span>
              </div>
              <input
                type="checkbox"
                checked={settings.allow_pdf_downloads}
                onChange={() => handleToggle('allow_pdf_downloads')}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </label>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 pt-4">
            <Bell className="w-5 h-5 text-amber-500" /> Notifications
          </h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-400 dark:hover:border-slate-700 transition-colors">
              <div>
                <span className="font-semibold text-sm text-slate-900 dark:text-white block">Email Notifications</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Send automatic emails to singers when new events or announcements are scheduled</span>
              </div>
              <input
                type="checkbox"
                checked={settings.enable_email_notifications}
                onChange={() => handleToggle('enable_email_notifications')}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving Settings...' : 'Save Choir Settings'}
        </button>
      </form>
    </div>
  );
}
