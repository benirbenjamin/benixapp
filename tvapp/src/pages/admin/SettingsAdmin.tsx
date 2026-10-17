import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { SiteSettings } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { AdminLayout } from '../../components/layout/AdminLayout';

export const SettingsAdminPage: React.FC = () => {
  const { settings: globalSettings, updateSettings: saveSettings, isLoading } = useSettings();
  const [settings, setSettings] = useState<SiteSettings>(globalSettings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (globalSettings) {
      setSettings(globalSettings);
    }
  }, [globalSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await saveSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update system settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            System & Website Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure platform branding, metadata, contact channels, and social links
          </p>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Settings saved successfully to PostgreSQL.</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-800 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-xs sm:text-sm">
          
          {/* General Branding */}
          <div className="space-y-4">
            <h2 className="font-extrabold text-slate-900 text-base pb-2 border-b border-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-rba-blue" />
              General Platform Identity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Platform Name</label>
                <input
                  type="text"
                  required
                  value={settings.site_name}
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rba-blue focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Logo Asset Path / URL</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={settings.logo_url}
                    onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                    placeholder="/logo.png or https://..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rba-blue focus:bg-white"
                  />
                  <div className="w-14 h-11 rounded-xl bg-slate-900 border border-slate-200 p-1.5 flex items-center justify-center shrink-0" title="Logo Preview">
                    <img
                      src={settings.logo_url || '/logo.png'}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.png';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Default SEO Description</label>
              <textarea
                rows={2}
                value={settings.site_description}
                onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rba-blue focus:bg-white"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h2 className="font-extrabold text-slate-900 text-base pb-2 border-b border-slate-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-500" />
              Official Contacts
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Inquiry Email</label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rba-blue focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Telephone Line</label>
                <input
                  type="text"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rba-blue focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Studio Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rba-blue focus:bg-white"
              />
            </div>
          </div>

          {/* Social Networks */}
          <div className="space-y-4">
            <h2 className="font-extrabold text-slate-900 text-base pb-2 border-b border-slate-100">
              Social Media Accounts
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Twitter / X URL</label>
                <input
                  type="url"
                  value={settings.twitter_url}
                  onChange={(e) => setSettings({ ...settings, twitter_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rba-blue focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">YouTube Channel URL</label>
                <input
                  type="url"
                  value={settings.youtube_url}
                  onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rba-blue focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Facebook URL</label>
                <input
                  type="url"
                  value={settings.facebook_url}
                  onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rba-blue focus:bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Instagram URL</label>
                <input
                  type="url"
                  value={settings.instagram_url}
                  onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rba-blue focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Footer Copyright Notice</label>
            <input
              type="text"
              value={settings.footer_text}
              onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rba-blue focus:bg-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-rba-blue hover:bg-rba-blueHover text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

        </form>

      </div>
    </AdminLayout>
  );
};
