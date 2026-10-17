import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Save, CheckCircle2, Globe, Phone, Mail, MapPin, Share2, Search, Link2, ShieldCheck, RefreshCw, ExternalLink, Copy, Check, AlertTriangle, Trash2, CheckCircle, Info } from 'lucide-react';
import { api } from '../../api/client';

export function StationSettingsPage() {
  const { activeAdminStation } = useAuth();
  const stationId = activeAdminStation?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Custom Domain state
  const [domainConfig, setDomainConfig] = useState(null);
  const [domainInput, setDomainInput] = useState('');
  const [domainConnecting, setDomainConnecting] = useState(false);
  const [domainVerifying, setDomainVerifying] = useState(false);
  const [domainDisconnecting, setDomainDisconnecting] = useState(false);
  const [domainMessage, setDomainMessage] = useState(null);
  const [domainError, setDomainError] = useState(null);
  const [copiedTarget, setCopiedTarget] = useState(false);

  const [formData, setFormData] = useState({
    station_name: '',
    station_slogan: '',
    station_description: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    tiktok: '',
    whatsapp: '',
    copyright_text: '',
    timezone: 'Africa/Kigali',
    language: 'en',
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
  });

  useEffect(() => {
    async function loadSettings() {
      if (!stationId) return;
      setLoading(true);
      try {
        const data = await api.get(`/stations/${stationId}/settings`);
        setFormData({
          station_name: data.station_name || '',
          station_slogan: data.station_slogan || '',
          station_description: data.station_description || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          website: data.website || '',
          facebook: data.facebook || '',
          instagram: data.instagram || '',
          twitter: data.twitter || '',
          youtube: data.youtube || '',
          tiktok: data.tiktok || '',
          whatsapp: data.whatsapp || '',
          copyright_text: data.copyright_text || '',
          timezone: data.timezone || 'Africa/Kigali',
          language: data.language || 'en',
          seo_title: data.seo_title || '',
          seo_description: data.seo_description || '',
          seo_keywords: data.seo_keywords || '',
        });
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }

    async function loadDomain() {
      if (!stationId) return;
      try {
        const data = await api.get(`/stations/${stationId}/domain`);
        setDomainConfig(data);
        setDomainInput(data.custom_domain || '');
      } catch (err) {
        console.warn('Failed to load custom domain config:', err);
      }
    }

    loadSettings();
    loadDomain();
  }, [stationId]);

  const fetchDomainConfig = async () => {
    if (!stationId) return;
    try {
      const data = await api.get(`/stations/${stationId}/domain`);
      setDomainConfig(data);
      setDomainInput(data.custom_domain || '');
    } catch (err) {
      console.warn('Failed to load custom domain config:', err);
    }
  };

  const handleConnectDomain = async (e) => {
    e.preventDefault();
    setDomainConnecting(true);
    setDomainError(null);
    setDomainMessage(null);
    try {
      const res = await api.put(`/stations/${stationId}/domain`, { domain: domainInput });
      setDomainMessage(res.message);
      await fetchDomainConfig();
    } catch (err) {
      setDomainError(err.message || 'Failed to connect domain.');
    } finally {
      setDomainConnecting(false);
    }
  };

  const handleVerifyDomain = async () => {
    setDomainVerifying(true);
    setDomainError(null);
    setDomainMessage(null);
    try {
      const res = await api.post(`/stations/${stationId}/domain/verify`, {});
      setDomainMessage(res.message);
      await fetchDomainConfig();
    } catch (err) {
      setDomainError(err.message || 'DNS verification failed. Please check your DNS record.');
    } finally {
      setDomainVerifying(false);
    }
  };

  const handleDisconnectDomain = async () => {
    if (!window.confirm('Disconnect this custom domain? Listeners will only be able to reach your station through the standard platform directory and slug URL.')) {
      return;
    }
    setDomainDisconnecting(true);
    setDomainError(null);
    setDomainMessage(null);
    try {
      const res = await api.delete(`/stations/${stationId}/domain`);
      setDomainMessage(res.message);
      setDomainInput('');
      await fetchDomainConfig();
    } catch (err) {
      setDomainError(err.message || 'Failed to disconnect domain.');
    } finally {
      setDomainDisconnecting(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedTarget(true);
    setTimeout(() => setCopiedTarget(false), 2000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put(`/stations/${stationId}/settings`, formData);
      setMessage('Station profile, contact details, and SEO settings saved successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading station settings...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Station Settings & SEO</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure station profile, contact hotlines, social media profiles, and search engine metadata.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* CUSTOM DOMAIN & DNS CONFIGURATION CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2.5">
              <Link2 className="w-5 h-5 text-indigo-600" />
              <span>Custom Domain & DNS Setup</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect your independent domain so listeners access your station directly at your own URL without platform prefixes.
            </p>
          </div>

          {/* Connection Status Badge */}
          <div>
            {domainConfig?.custom_domain ? (
              domainConfig.custom_domain_verified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Domain Connected & Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <span>Pending DNS Verification</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>No Custom Domain</span>
              </span>
            )}
          </div>
        </div>

        {/* Feedback Messages */}
        {domainMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{domainMessage}</span>
          </div>
        )}

        {domainError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{domainError}</span>
          </div>
        )}

        {/* Domain Form */}
        <form onSubmit={handleConnectDomain} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Domain Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono select-none">
                  https://
                </span>
                <input
                  type="text"
                  required
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value.toLowerCase().replace(/^https?:\/\//i, '').trim())}
                  placeholder="e.g. kigaliwave.com or radio.mybrand.org"
                  className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={domainConnecting || !domainInput.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Link2 className="w-4 h-4" />
                <span>{domainConnecting ? 'Connecting...' : (domainConfig?.custom_domain ? 'Update Domain' : 'Connect Domain')}</span>
              </button>

              {domainConfig?.custom_domain && (
                <button
                  type="button"
                  onClick={handleDisconnectDomain}
                  disabled={domainDisconnecting}
                  className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors disabled:opacity-50"
                  title="Disconnect Custom Domain"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </form>

        {/* DNS Configuration Instructions (Displayed when domain is set) */}
        {domainConfig?.custom_domain && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Required DNS Records for {domainConfig.custom_domain}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add this CNAME record:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVerifyDomain}
                  disabled={domainVerifying}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${domainVerifying ? 'animate-spin' : ''}`} />
                  <span>{domainVerifying ? 'Checking...' : 'Verify DNS'}</span>
                </button>

                <a
                  href={`/?domain=${encodeURIComponent(domainConfig.custom_domain)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Test how your radio appears on this domain"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Test Preview</span>
                </a>
              </div>
            </div>

            {/* DNS Records Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    CNAME Record (Recommended)
                  </span>
                  <span className="text-[10px] text-slate-400">Subdomains & root</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Host / Name:</span>
                    <span className="font-mono text-slate-900 font-semibold">{domainConfig.dns_instructions?.cname_record?.name || '@'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Target / Points To:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-900 font-bold text-[11px]">
                        {domainConfig.dns_instructions?.cname_record?.target || 'cname.vercel-dns.com'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(domainConfig.dns_instructions?.cname_record?.target || 'cname.vercel-dns.com')}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Copy Target"
                      >
                        {copiedTarget ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    A Record (Apex alternative)
                  </span>
                  <span className="text-[10px] text-slate-400">Root domain @</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Host / Name:</span>
                    <span className="font-mono text-slate-900 font-semibold">@</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Value:</span>
                    <span className="font-mono text-slate-900 font-bold text-[11px]">
                      {domainConfig.dns_instructions?.a_record?.target || '76.76.21.21'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              DNS propagation can take from 2 to 30 minutes depending on your registrar. Once DNS propagates, click <strong>Verify DNS</strong> to finalize your custom domain.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8 text-xs">
        
        {/* Section 1: General Station Profile */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Station Identity</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Station Name
              </label>
              <input
                type="text"
                required
                value={formData.station_name}
                onChange={(e) => setFormData({ ...formData, station_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Slogan / Catchphrase
              </label>
              <input
                type="text"
                value={formData.station_slogan}
                onChange={(e) => setFormData({ ...formData, station_slogan: e.target.value })}
                placeholder="e.g. Your Sound, Your Energy, Your Kigali"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Station Description / About Bio
            </label>
            <textarea
              rows={3}
              value={formData.station_description}
              onChange={(e) => setFormData({ ...formData, station_description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Station Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              >
                <option value="Africa/Kigali">Africa/Kigali (CAT UTC+2)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (EAT UTC+3)</option>
                <option value="Africa/Johannesburg">Africa/Johannesburg (SAST UTC+2)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Default Language
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
              >
                <option value="en">English (en)</option>
                <option value="fr">Français (fr)</option>
                <option value="rw">Kinyarwanda (rw)</option>
                <option value="sw">Kiswahili (sw)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Copyright Text
              </label>
              <input
                type="text"
                value={formData.copyright_text}
                onChange={(e) => setFormData({ ...formData, copyright_text: e.target.value })}
                placeholder="© 2026 Wave FM. All Rights Reserved."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Studio Contact Info */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Studio Contact Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Phone Number / Studio Hotline
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+250 788 000 000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Studio Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="studio@station.fm"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Physical Studio Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Media Tower, Floor 4, City Center"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Primary Website URL
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Social Media Links */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-sky-600" />
            <span>Social Media Channels</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">Facebook URL</label>
              <input
                type="url"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                placeholder="https://facebook.com/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">Instagram URL</label>
              <input
                type="url"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="https://instagram.com/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">X (Twitter) URL</label>
              <input
                type="url"
                value={formData.twitter}
                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                placeholder="https://twitter.com/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">YouTube Channel URL</label>
              <input
                type="url"
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                placeholder="https://youtube.com/@..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">TikTok Profile URL</label>
              <input
                type="url"
                value={formData.tiktok}
                onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                placeholder="https://tiktok.com/@..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">WhatsApp Number</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="+250788123456"
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Dynamic Search Engine Optimization (SEO) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-600" />
            <span>Search Engine Optimization (SEO) Metadata</span>
          </h2>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Custom Page Meta Title
            </label>
            <input
              type="text"
              value={formData.seo_title}
              onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
              placeholder="e.g. Kigali Wave 94.7 FM | The Rhythm of Kigali Live"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Meta Description
            </label>
            <textarea
              rows={2}
              value={formData.seo_description}
              onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
              placeholder="Brief descriptive summary for Google Search and social sharing previews..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Keywords (Comma separated)
            </label>
            <input
              type="text"
              value={formData.seo_keywords}
              onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
              placeholder="radio, live stream, afrobeats, music, news, podcasts"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
        </div>

      </form>

    </div>
  );
}
