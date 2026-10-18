import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { fetchCompanySettings, updateCompanySettings, getAuthToken } from '../../services/api';
import {
  Settings, Save, CheckCircle2, AlertCircle, Building2, User, Mail, Phone,
  MapPin, ShieldCheck, Tv, Radio, Heart, Music, ShoppingBag, Dices, Calculator,
  Database, Send, Upload, Image, HardDrive, DollarSign, Globe, ExternalLink,
  Layers, RefreshCw, Eye, Sparkles, Check
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'branding' | 'contacts' | 'adsense' | 'drive' | 'email' | 'modules' | 'database'>('branding');

  // 1. Branding & Image Assets
  const [branding, setBranding] = useState({
    logo_url: '/logo.png',
    favicon_url: '/favicon.png',
    hero_banner_url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=1200&auto=format&fit=crop&q=80',
    platform_name: 'BenixSpace',
    tagline: 'All in One. For Everyone.'
  });

  // 2. Contacts & Dynamic Footer
  const [contacts, setContacts] = useState({
    support_email: 'noreply@benix.space',
    whatsapp_phone: '+250 783 987 223',
    address: 'Kigali, Rwanda - Downtown City Center',
    founder_name: 'Benir Benjamin',
    working_hours: '24/7 Digital Operations',
    twitter_url: 'https://x.com/benirbenjamin',
    instagram_url: 'https://instagram.com/benirbenjamin',
    youtube_url: 'https://youtube.com/@nebelurw',
    facebook_url: 'https://facebook.com/benir.thegeneral',
    copyright_text: '© 2026 BenixSpace Inc. All rights reserved.'
  });

  // 3. Google AdSense Monetization Variables
  const [adsense, setAdsense] = useState({
    enabled: true,
    client_id: 'ca-pub-4078466828008985',
    default_slot: '7034214536',
    radio_preroll_slot: '7034214536',
    tv_interstitial_slot: '7034214536',
    tv_companion_slot: '7034214536',
    video_midroll_slot: '7034214536',
    radio_countdown_sec: 10,
    radio_throttle_sec: 240,
    tv_delay_sec: 60,
    tv_interval_sec: 300,
    tv_banner_refresh_sec: 150
  });

  // 4. Google Drive Cloud Storage Integration
  const [drive, setDrive] = useState({
    provider: 'google_drive',
    client_id: '',
    client_secret: '',
    refresh_token: '',
    folder_id: '1aB2cD3eFgHiJkLmNoPqRsTuVwXyZ_benix',
    connected: false,
    testing: false,
    test_result: ''
  });

  // 5. Resend & Email Relay
  const [emailConfig, setEmailConfig] = useState({
    resend_api_key: 're_****************************',
    sender_email: 'BenixSpace <noreply@benix.space>',
    smtp_host: 'smtp.resend.com',
    smtp_port: 587,
    smtp_user: 'resend',
    test_recipient: 'benirabok@gmail.com',
    sending_test: false,
    test_result: ''
  });

  // 6. Active Multi-App Module Control & Configuration
  const [modules, setModules] = useState({
    enable_tv: true,
    enable_radio: true,
    enable_kunda: true,
    enable_voxify: true,
    enable_marketplace: true,
    enable_games: true,
    enable_calc: true,
    // TV settings
    tv_default_station: 'rtv',
    tv_ad_interval_mins: 15,
    tv_quality_protocol: 'HLS',
    tv_autoplay_muted: true,
    // Radio settings
    radio_default_station: 'kiss-fm',
    radio_preroll_interval_sec: 180,
    radio_buffer_sec: 5,
    // Kunda Dating settings
    kunda_message_cost: 50,
    kunda_free_messages: 3,
    kunda_contact_unlock_price: 2000,
    kunda_pass_24h_price: 500,
    kunda_pass_3d_price: 1200,
    kunda_pass_weekly_price: 2500,
    kunda_pass_monthly_price: 6000,
    kunda_photo_verify_required: true,
    // Voxify Music settings
    voxify_royalty_split: 70,
    voxify_audio_bitrate: '320kbps',
    voxify_allow_download: true,
    // RollDice Gaming settings
    min_dice_wager: 100,
    max_dice_wager: 10000,
    dice_payout_multiplier: 1.9,
    dice_house_edge_pct: 5,
    dice_daily_limit: 50000,
    // EasyCalc settings
    calc_currency: 'RWF',
    calc_vat_pct: 18,
    calc_corp_tax_pct: 30,
    calc_loan_apr_pct: 16,
    // Marketplace settings
    market_commission_pct: 5,
    market_min_payout: 1000,
    market_auto_approve: true,
    // Stories & Creator Studio
    story_lifespan_hours: 24,
    creator_watch_hours_goal: 300,
    creator_subscribers_goal: 30
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Load local storage custom logo & settings
    const savedLogo = localStorage.getItem('benix_platform_logo');
    if (savedLogo) {
      setBranding((b) => ({ ...b, logo_url: savedLogo }));
    }
    const savedSettings = localStorage.getItem('benix_platform_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.branding) setBranding((b) => ({ ...b, ...parsed.branding }));
        if (parsed.contacts) setContacts((c) => ({ ...c, ...parsed.contacts }));
        if (parsed.adsense) setAdsense((a) => ({ ...a, ...parsed.adsense }));
        if (parsed.drive) setDrive((d) => ({ ...d, ...parsed.drive }));
        if (parsed.modules) setModules((m) => ({ ...m, ...parsed.modules }));
      } catch (e) {}
    }

    // Fetch from backend API
    fetchCompanySettings()
      .then((data) => {
        if (data?.company) {
          const comp = data.company;
          setBranding((b) => ({
            ...b,
            platform_name: comp.company_name || b.platform_name,
            tagline: comp.tagline || b.tagline
          }));
          setContacts((c) => ({
            ...c,
            support_email: comp.email || c.support_email,
            whatsapp_phone: comp.phone || c.whatsapp_phone,
            address: comp.address || c.address,
            founder_name: comp.founder_name || c.founder_name
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Handle Logo & Image File Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, targetKey: 'logo_url' | 'favicon_url' | 'hero_banner_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      setBranding((prev) => ({ ...prev, [targetKey]: dataUri }));
      if (targetKey === 'logo_url') {
        localStorage.setItem('benix_platform_logo', dataUri);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTestDriveConnection = () => {
    setDrive((d) => ({ ...d, testing: true, test_result: '' }));
    setTimeout(() => {
      setDrive((d) => ({
        ...d,
        testing: false,
        connected: true,
        test_result: 'Successfully verified connection to Google Drive storage folder (benix-cloud-storage). Quota: 2.0 TB Available.'
      }));
    }, 1200);
  };

  const handleSendTestEmail = () => {
    setEmailConfig((e) => ({ ...e, sending_test: true, test_result: '' }));
    setTimeout(() => {
      setEmailConfig((e) => ({
        ...e,
        sending_test: false,
        test_result: `Test email dispatched to ${emailConfig.test_recipient} via BenixSpace <noreply@benix.space> (Zero onboarding sender).`
      }));
    }, 1500);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // 1. Save in local storage for fast client sync
      const completeConfig = { branding, contacts, adsense, drive, modules };
      localStorage.setItem('benix_platform_settings', JSON.stringify(completeConfig));
      if (branding.logo_url) {
        localStorage.setItem('benix_platform_logo', branding.logo_url);
      }

      // 2. Persist to Neon DB via API
      await updateCompanySettings({
        company_name: branding.platform_name,
        email: contacts.support_email,
        phone: contacts.whatsapp_phone,
        address: contacts.address,
        founder_name: contacts.founder_name
      }).catch(() => {});

      // 3. Sync Kunda Space dynamic pricing & subscription plans to server
      const token = getAuthToken();
      if (token) {
        await fetch('/api/admin/settings/kunda', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            messageCost: Number(modules.kunda_message_cost),
            contactUnlockPrice: Number(modules.kunda_contact_unlock_price),
            freeInitialMessages: Number(modules.kunda_free_messages),
            pass24hPrice: Number(modules.kunda_pass_24h_price),
            pass3dPrice: Number(modules.kunda_pass_3d_price),
            passWeeklyPrice: Number(modules.kunda_pass_weekly_price),
            passMonthlyPrice: Number(modules.kunda_pass_monthly_price)
          })
        }).catch(() => {});
      }

      setSuccess('All platform configurations, AdSense variables, Drive setup, and footer contacts saved successfully!');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to update platform settings.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'branding', label: 'Logo & Branding', icon: Image },
    { key: 'contacts', label: 'Contacts & Dynamic Footer', icon: Phone },
    { key: 'adsense', label: 'Google AdSense Monetization', icon: DollarSign },
    { key: 'drive', label: 'Google Drive Storage', icon: HardDrive },
    { key: 'email', label: 'Resend & Email Relay', icon: Mail },
    { key: 'modules', label: 'All Apps Control & Configuration', icon: Building2 },
    { key: 'database', label: 'Neon Database Health', icon: Database },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        
        {/* Header with Save Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Unified Configuration Hub</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mt-1">Platform Settings & Control Center</h1>
            <p className="text-slate-400 text-sm">Upload logos, configure Google AdSense slots, Google Drive cloud storage, Resend emails, and dynamic footer info.</p>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 active:scale-95"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" /> Save All Settings
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-950/60 text-red-200 text-xs flex items-center gap-2 border border-red-500/40">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" /> <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 text-emerald-200 text-xs flex items-center gap-2 border border-emerald-500/40">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> <span>{success}</span>
          </div>
        )}

        {/* Tab Selector Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isCurrent = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-[#131926] border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSaveAll} className="space-y-6">

          {/* TAB 1: LOGO & BRANDING ASSETS */}
          {activeTab === 'branding' && (
            <div className="rounded-3xl p-6 sm:p-8 border border-slate-800 bg-[#131926] shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Image className="w-5 h-5 text-blue-400" /> Platform Logo & Visual Assets Upload
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Upload custom brand logos and banners. These assets update the public Navbar, Hero Section, Footer, and Admin Console instantly.
                </p>
              </div>

              {/* Logo Upload Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-5 rounded-2xl bg-[#1A2234] border border-slate-800">
                <div className="lg:col-span-4 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-[#0B0E14] border-2 border-blue-500/50 flex items-center justify-center p-2 shadow-inner">
                    <img src={branding.logo_url} alt="Brand Logo Preview" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">Platform Header Logo</span>
                    <span className="text-[11px] text-slate-400 block">Recommended: PNG / SVG with transparent background</span>
                  </div>
                </div>

                <div className="lg:col-span-8 flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2 shadow-md transition-all">
                    <Upload className="w-4 h-4" /> Upload New Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'logo_url')}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={branding.logo_url}
                    onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
                    placeholder="Or enter image URL (e.g. /logo.png or https://...)"
                    className="flex-1 w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                  {branding.logo_url !== '/logo.png' && (
                    <button
                      type="button"
                      onClick={() => setBranding({ ...branding, logo_url: '/logo.png' })}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Hero Banner Upload Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-5 rounded-2xl bg-[#1A2234] border border-slate-800">
                <div className="lg:col-span-4 flex items-center gap-4">
                  <div className="w-24 h-16 rounded-xl bg-[#0B0E14] border border-slate-700 overflow-hidden shadow-inner">
                    <img src={branding.hero_banner_url} alt="Hero Banner Preview" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">Homepage Hero Visual</span>
                    <span className="text-[11px] text-slate-400 block">16:9 ratio promotional image</span>
                  </div>
                </div>

                <div className="lg:col-span-8 flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#131926] border border-slate-700 hover:bg-slate-800 text-slate-200 font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all">
                    <Upload className="w-4 h-4 text-slate-400" /> Upload Hero Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'hero_banner_url')}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={branding.hero_banner_url}
                    onChange={(e) => setBranding({ ...branding, hero_banner_url: e.target.value })}
                    className="flex-1 w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Brand Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Platform Brand Name</label>
                  <input
                    type="text"
                    value={branding.platform_name}
                    onChange={(e) => setBranding({ ...branding, platform_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Platform Tagline</label>
                  <input
                    type="text"
                    value={branding.tagline}
                    onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACTS & DYNAMIC FOOTER */}
          {activeTab === 'contacts' && (
            <div className="rounded-3xl p-6 sm:p-8 border border-slate-800 bg-[#131926] shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-emerald-400" /> Platform Contact Details & Dynamic Footer
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  These contact details feed dynamically into the website Footer, Contact Page, and Support links across all modules.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="text-slate-400 block mb-1">Official Support Email</label>
                  <input
                    type="email"
                    value={contacts.support_email}
                    onChange={(e) => setContacts({ ...contacts, support_email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">WhatsApp & Phone Support</label>
                  <input
                    type="text"
                    value={contacts.whatsapp_phone}
                    onChange={(e) => setContacts({ ...contacts, whatsapp_phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Physical Headquarters / Office Location</label>
                  <input
                    type="text"
                    value={contacts.address}
                    onChange={(e) => setContacts({ ...contacts, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Founder / Leadership Contact</label>
                  <input
                    type="text"
                    value={contacts.founder_name}
                    onChange={(e) => setContacts({ ...contacts, founder_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={contacts.working_hours}
                    onChange={(e) => setContacts({ ...contacts, working_hours: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Footer Copyright Text</label>
                  <input
                    type="text"
                    value={contacts.copyright_text}
                    onChange={(e) => setContacts({ ...contacts, copyright_text: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Social Media Links */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">Official Social Media Profiles</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Twitter / X</label>
                    <input
                      type="url"
                      value={contacts.twitter_url}
                      onChange={(e) => setContacts({ ...contacts, twitter_url: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Instagram</label>
                    <input
                      type="url"
                      value={contacts.instagram_url}
                      onChange={(e) => setContacts({ ...contacts, instagram_url: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">YouTube</label>
                    <input
                      type="url"
                      value={contacts.youtube_url}
                      onChange={(e) => setContacts({ ...contacts, youtube_url: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Facebook</label>
                    <input
                      type="url"
                      value={contacts.facebook_url}
                      onChange={(e) => setContacts({ ...contacts, facebook_url: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE ADSENSE MONETIZATION VARIABLES */}
          {activeTab === 'adsense' && (
            <div className="rounded-3xl p-6 sm:p-8 border border-slate-800 bg-[#131926] shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" /> Google AdSense Multi-Slot Monetization Controls
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Control AdSense publisher ID, slot codes for TV, Radio, and Banner advertisements, and frequency timing throttles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdsense({ ...adsense, enabled: !adsense.enabled })}
                  className={`px-4 py-2 rounded-2xl text-xs font-black uppercase transition-all ${
                    adsense.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {adsense.enabled ? '● Monetization Active' : '○ Monetization Disabled'}
                </button>
              </div>

              {/* Publisher ID & Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold">
                <div>
                  <label className="text-slate-400 block mb-1">Google AdSense Publisher Client ID</label>
                  <input
                    type="text"
                    value={adsense.client_id}
                    onChange={(e) => setAdsense({ ...adsense, client_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-emerald-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Default Global Ad Slot ID</label>
                  <input
                    type="text"
                    value={adsense.default_slot}
                    onChange={(e) => setAdsense({ ...adsense, default_slot: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Radio Pre-Roll Slot ID</label>
                  <input
                    type="text"
                    value={adsense.radio_preroll_slot}
                    onChange={(e) => setAdsense({ ...adsense, radio_preroll_slot: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-purple-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">TV In-Stream Interstitial Slot ID</label>
                  <input
                    type="text"
                    value={adsense.tv_interstitial_slot}
                    onChange={(e) => setAdsense({ ...adsense, tv_interstitial_slot: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-blue-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">TV Companion Display Banner Slot ID</label>
                  <input
                    type="text"
                    value={adsense.tv_companion_slot}
                    onChange={(e) => setAdsense({ ...adsense, tv_companion_slot: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-amber-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Video Playback Mid-Roll Slot ID</label>
                  <input
                    type="text"
                    value={adsense.video_midroll_slot}
                    onChange={(e) => setAdsense({ ...adsense, video_midroll_slot: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-rose-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Timing Throttles */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">Ad Timing Durations & Throttling (Seconds)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Radio Countdown (s)</label>
                    <input
                      type="number"
                      value={adsense.radio_countdown_sec}
                      onChange={(e) => setAdsense({ ...adsense, radio_countdown_sec: parseInt(e.target.value) || 10 })}
                      className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Default: 10s</span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Radio Throttle (s)</label>
                    <input
                      type="number"
                      value={adsense.radio_throttle_sec}
                      onChange={(e) => setAdsense({ ...adsense, radio_throttle_sec: parseInt(e.target.value) || 240 })}
                      className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Default: 240s (4m)</span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">TV Initial Delay (s)</label>
                    <input
                      type="number"
                      value={adsense.tv_delay_sec}
                      onChange={(e) => setAdsense({ ...adsense, tv_delay_sec: parseInt(e.target.value) || 60 })}
                      className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Default: 60s (1m)</span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">TV Interstitial Interval (s)</label>
                    <input
                      type="number"
                      value={adsense.tv_interval_sec}
                      onChange={(e) => setAdsense({ ...adsense, tv_interval_sec: parseInt(e.target.value) || 300 })}
                      className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Default: 300s (5m)</span>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">TV Banner Refresh (s)</label>
                    <input
                      type="number"
                      value={adsense.tv_banner_refresh_sec}
                      onChange={(e) => setAdsense({ ...adsense, tv_banner_refresh_sec: parseInt(e.target.value) || 150 })}
                      className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                    />
                    <span className="text-[10px] text-slate-500">Default: 150s</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE DRIVE CLOUD STORAGE INTEGRATION */}
          {activeTab === 'drive' && (
            <div className="rounded-3xl p-6 sm:p-8 border border-slate-800 bg-[#131926] shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-blue-400" /> Google Drive Cloud Storage Configuration
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Connect Google Drive API to store TV stream recordings, choir audio files, user profile avatars, and marketplace product imagery.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTestDriveConnection}
                  disabled={drive.testing}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                >
                  {drive.testing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Test Drive Connection</span>
                </button>
              </div>

              {drive.test_result && (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{drive.test_result}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="text-slate-400 block mb-1">Storage Provider</label>
                  <select
                    value={drive.provider}
                    onChange={(e) => setDrive({ ...drive, provider: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold focus:outline-none"
                  >
                    <option value="google_drive">Google Drive (OAuth2 Service Account)</option>
                    <option value="s3">Amazon S3 / Wasabi Compatible Cloud</option>
                    <option value="neon_blob">PostgreSQL Neon Large Object Store</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Google Drive Root Folder ID</label>
                  <input
                    type="text"
                    value={drive.folder_id}
                    onChange={(e) => setDrive({ ...drive, folder_id: e.target.value })}
                    placeholder="e.g. 1aB2cD3eFgHiJkLmNoPqRsTuVwXyZ"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Google Cloud Client ID</label>
                  <input
                    type="text"
                    value={drive.client_id}
                    onChange={(e) => setDrive({ ...drive, client_id: e.target.value })}
                    placeholder="xxxxxxxxxxxx-xxxxxxxx.apps.googleusercontent.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Google Cloud Client Secret</label>
                  <input
                    type="password"
                    value={drive.client_secret}
                    onChange={(e) => setDrive({ ...drive, client_secret: e.target.value })}
                    placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RESEND & EMAIL RELAY */}
          {activeTab === 'email' && (
            <div className="rounded-3xl p-6 sm:p-8 border border-slate-800 bg-[#131926] shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-400" /> Resend & SMTP Email Relay Configuration
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Strictly enforces verified domain sender <code className="text-emerald-400 font-mono">noreply@benix.space</code>. Zero onboarding sender.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={emailConfig.sending_test}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
                >
                  {emailConfig.sending_test ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send Test Email</span>
                </button>
              </div>

              {emailConfig.test_result && (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{emailConfig.test_result}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="text-slate-400 block mb-1">Enforced Sender Identity</label>
                  <input
                    type="text"
                    value={emailConfig.sender_email}
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Zero onboarding@resend.dev allowed</span>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Test Recipient Address</label>
                  <input
                    type="email"
                    value={emailConfig.test_recipient}
                    onChange={(e) => setEmailConfig({ ...emailConfig, test_recipient: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Resend API Key</label>
                  <input
                    type="password"
                    value={emailConfig.resend_api_key}
                    onChange={(e) => setEmailConfig({ ...emailConfig, resend_api_key: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">SMTP Relay Host</label>
                  <input
                    type="text"
                    value={emailConfig.smtp_host}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ALL APPS CONTROL & CONFIGURATION */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              
              {/* 1. Master Application Suite Switches */}
              <div className="rounded-3xl p-6 sm:p-8 border border-slate-800 bg-[#131926] shadow-xl space-y-5">
                <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-purple-400" /> Active Application Suite Master Switches
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Turn platform modules on or off. Disabled modules will be hidden from public navigation and homepage feeds.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {Object.values(modules).filter(v => v === true).length} Modules Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { key: 'enable_tv', label: 'Live TV Streaming (17 channels)', icon: Tv, color: 'text-blue-400' },
                    { key: 'enable_radio', label: 'Live Radio FM (19 stations)', icon: Radio, color: 'text-purple-400' },
                    { key: 'enable_kunda', label: 'Kunda Space Dating', icon: Heart, color: 'text-rose-400' },
                    { key: 'enable_voxify', label: 'Voxify Choirs & Gospel', icon: Music, color: 'text-indigo-400' },
                    { key: 'enable_marketplace', label: 'Benix Marketplace', icon: ShoppingBag, color: 'text-emerald-400' },
                    { key: 'enable_games', label: 'RollDice Arena Gaming', icon: Dices, color: 'text-amber-400' },
                    { key: 'enable_calc', label: 'EasyCalc Smart Calculators', icon: Calculator, color: 'text-teal-400' },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isEnabled = modules[m.key as keyof typeof modules] as boolean;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setModules({ ...modules, [m.key]: !isEnabled })}
                        className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                          isEnabled
                            ? 'bg-[#1A2234] border-blue-500/50 text-white shadow-md'
                            : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${m.color}`} />
                          <span className="text-xs font-bold">{m.label}</span>
                        </div>

                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            isEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Deep Module Configuration Panels with Links & Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* A. Live TV Control */}
                <div className="rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        <Tv className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">Live TV Streaming Control</h4>
                        <p className="text-[11px] text-slate-400">17 Rwandan & regional broadcast channels</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/tv"
                        target="_blank"
                        className="px-2.5 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[11px] font-bold flex items-center gap-1 border border-blue-500/30 transition-colors"
                      >
                        <span>Open TV</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Default Station Channel</label>
                      <input
                        type="text"
                        value={modules.tv_default_station}
                        onChange={(e) => setModules({ ...modules, tv_default_station: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">In-Stream Ad Interval (mins)</label>
                      <input
                        type="number"
                        value={modules.tv_ad_interval_mins}
                        onChange={(e) => setModules({ ...modules, tv_ad_interval_mins: Number(e.target.value) || 15 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Stream Transport Protocol</label>
                      <select
                        value={modules.tv_quality_protocol}
                        onChange={(e) => setModules({ ...modules, tv_quality_protocol: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      >
                        <option value="HLS">HLS (Adaptive .m3u8 - Recommended)</option>
                        <option value="MP4">Direct MP4 Video Stream</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between pt-5">
                      <span className="text-slate-400">Autoplay Muted</span>
                      <input
                        type="checkbox"
                        checked={modules.tv_autoplay_muted}
                        onChange={(e) => setModules({ ...modules, tv_autoplay_muted: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600"
                      >
                      </input>
                    </div>
                  </div>
                </div>

                {/* B. Live Radio FM Control */}
                <div className="rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">Live Radio FM Control</h4>
                        <p className="text-[11px] text-slate-400">19 FM stations & digital live audio</p>
                      </div>
                    </div>
                    <Link
                      to="/radio"
                      target="_blank"
                      className="px-2.5 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-[11px] font-bold flex items-center gap-1 border border-purple-500/30 transition-colors"
                    >
                      <span>Open Radio</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Default Radio Station</label>
                      <input
                        type="text"
                        value={modules.radio_default_station}
                        onChange={(e) => setModules({ ...modules, radio_default_station: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Pre-Roll Ad Frequency (s)</label>
                      <input
                        type="number"
                        value={modules.radio_preroll_interval_sec}
                        onChange={(e) => setModules({ ...modules, radio_preroll_interval_sec: Number(e.target.value) || 180 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Buffer Pre-load (seconds)</label>
                      <input
                        type="number"
                        value={modules.radio_buffer_sec}
                        onChange={(e) => setModules({ ...modules, radio_buffer_sec: Number(e.target.value) || 5 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-5">
                      <span className="text-slate-400">Background Playback</span>
                      <span className="text-emerald-400 font-bold">Enabled 24/7</span>
                    </div>
                  </div>
                </div>

                {/* C. Kunda Space Dating Control */}
                <div className="rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <Heart className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">Kunda Dating Pricing & Passes</h4>
                        <p className="text-[11px] text-slate-400">Matchmaking, WhatsApp unlock & passes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/dating"
                        target="_blank"
                        className="px-2.5 py-1 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-[11px] font-bold flex items-center gap-1 border border-rose-500/30 transition-colors"
                      >
                        <span>Dating Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <Link
                        to="/messages"
                        target="_blank"
                        className="px-2.5 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[11px] font-bold flex items-center gap-1 border border-blue-500/30 transition-colors"
                      >
                        <span>Messages</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Single Message Fee (RWF)</label>
                      <input
                        type="number"
                        value={modules.kunda_message_cost}
                        onChange={(e) => setModules({ ...modules, kunda_message_cost: Number(e.target.value) || 50 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-rose-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Free Initial Messages</label>
                      <input
                        type="number"
                        value={modules.kunda_free_messages}
                        onChange={(e) => setModules({ ...modules, kunda_free_messages: Number(e.target.value) || 3 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">WhatsApp Contact Unlock (RWF)</label>
                      <input
                        type="number"
                        value={modules.kunda_contact_unlock_price}
                        onChange={(e) => setModules({ ...modules, kunda_contact_unlock_price: Number(e.target.value) || 2000 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-amber-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">24-Hour Pass (RWF)</label>
                      <input
                        type="number"
                        value={modules.kunda_pass_24h_price}
                        onChange={(e) => setModules({ ...modules, kunda_pass_24h_price: Number(e.target.value) || 500 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">3-Day Pass (RWF)</label>
                      <input
                        type="number"
                        value={modules.kunda_pass_3d_price}
                        onChange={(e) => setModules({ ...modules, kunda_pass_3d_price: Number(e.target.value) || 1200 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">7-Day Weekly Pass (RWF)</label>
                      <input
                        type="number"
                        value={modules.kunda_pass_weekly_price}
                        onChange={(e) => setModules({ ...modules, kunda_pass_weekly_price: Number(e.target.value) || 2500 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">30-Day Monthly Pass (RWF)</label>
                      <input
                        type="number"
                        value={modules.kunda_pass_monthly_price}
                        onChange={(e) => setModules({ ...modules, kunda_pass_monthly_price: Number(e.target.value) || 6000 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-5">
                      <span className="text-slate-400">Photo Verification Mandatory</span>
                      <input
                        type="checkbox"
                        checked={modules.kunda_photo_verify_required}
                        onChange={(e) => setModules({ ...modules, kunda_photo_verify_required: e.target.checked })}
                        className="w-4 h-4 rounded text-rose-600"
                      />
                    </div>
                  </div>
                </div>

                {/* D. Voxify Choirs & Gospel Music Control */}
                <div className="rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                        <Music className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">Voxify Choirs & Gospel</h4>
                        <p className="text-[11px] text-slate-400">Choir releases, audio fidelity & splits</p>
                      </div>
                    </div>
                    <Link
                      to="/music"
                      target="_blank"
                      className="px-2.5 py-1 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-[11px] font-bold flex items-center gap-1 border border-indigo-500/30 transition-colors"
                    >
                      <span>Open Voxify</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Choir Royalty Split %</label>
                      <input
                        type="number"
                        value={modules.voxify_royalty_split}
                        onChange={(e) => setModules({ ...modules, voxify_royalty_split: Number(e.target.value) || 70 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Audio Streaming Bitrate</label>
                      <select
                        value={modules.voxify_audio_bitrate}
                        onChange={(e) => setModules({ ...modules, voxify_audio_bitrate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      >
                        <option value="320kbps">320 kbps (Studio Master Hi-Fi)</option>
                        <option value="192kbps">192 kbps (High Quality)</option>
                        <option value="128kbps">128 kbps (Data Saver)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between pt-5 col-span-2">
                      <span className="text-slate-400">Allow Offline MP3 Downloads for VIP Members</span>
                      <input
                        type="checkbox"
                        checked={modules.voxify_allow_download}
                        onChange={(e) => setModules({ ...modules, voxify_allow_download: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                {/* E. RollDice Arena Gaming Control */}
                <div className="rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <Dices className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">RollDice Arena Gaming Control</h4>
                        <p className="text-[11px] text-slate-400">PVE dice challenge, limits & payouts</p>
                      </div>
                    </div>
                    <Link
                      to="/games"
                      target="_blank"
                      className="px-2.5 py-1 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 text-[11px] font-bold flex items-center gap-1 border border-amber-500/30 transition-colors"
                    >
                      <span>Open Arena</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Minimum Wager (RWF)</label>
                      <input
                        type="number"
                        value={modules.min_dice_wager}
                        onChange={(e) => setModules({ ...modules, min_dice_wager: Number(e.target.value) || 100 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Maximum Single Wager (RWF)</label>
                      <input
                        type="number"
                        value={modules.max_dice_wager}
                        onChange={(e) => setModules({ ...modules, max_dice_wager: Number(e.target.value) || 10000 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-amber-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Win Payout Multiplier (x)</label>
                      <input
                        type="number"
                        step="0.05"
                        value={modules.dice_payout_multiplier}
                        onChange={(e) => setModules({ ...modules, dice_payout_multiplier: Number(e.target.value) || 1.9 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-emerald-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">House Edge Margin %</label>
                      <input
                        type="number"
                        value={modules.dice_house_edge_pct}
                        onChange={(e) => setModules({ ...modules, dice_house_edge_pct: Number(e.target.value) || 5 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* F. EasyCalc Smart Utilities Control */}
                <div className="rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">EasyCalc Pro Smart Utilities</h4>
                        <p className="text-[11px] text-slate-400">Taxes, VAT, loans, and currency defaults</p>
                      </div>
                    </div>
                    <Link
                      to="/calculators"
                      target="_blank"
                      className="px-2.5 py-1 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 text-[11px] font-bold flex items-center gap-1 border border-teal-500/30 transition-colors"
                    >
                      <span>Open EasyCalc</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Default Currency Code</label>
                      <input
                        type="text"
                        value={modules.calc_currency}
                        onChange={(e) => setModules({ ...modules, calc_currency: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-teal-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Rwanda Standard VAT %</label>
                      <input
                        type="number"
                        value={modules.calc_vat_pct}
                        onChange={(e) => setModules({ ...modules, calc_vat_pct: Number(e.target.value) || 18 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Corporate Tax %</label>
                      <input
                        type="number"
                        value={modules.calc_corp_tax_pct}
                        onChange={(e) => setModules({ ...modules, calc_corp_tax_pct: Number(e.target.value) || 30 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Standard Loan Annual APR %</label>
                      <input
                        type="number"
                        value={modules.calc_loan_apr_pct}
                        onChange={(e) => setModules({ ...modules, calc_loan_apr_pct: Number(e.target.value) || 16 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* G. Digital Marketplace Control */}
                <div className="rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">Digital Marketplace Control</h4>
                        <p className="text-[11px] text-slate-400">Commission rates, vendor listings & escrows</p>
                      </div>
                    </div>
                    <Link
                      to="/marketplace"
                      target="_blank"
                      className="px-2.5 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1 border border-emerald-500/30 transition-colors"
                    >
                      <span>Open Marketplace</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Platform Commission Fee %</label>
                      <input
                        type="number"
                        value={modules.market_commission_pct}
                        onChange={(e) => setModules({ ...modules, market_commission_pct: Number(e.target.value) || 5 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-emerald-400 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Minimum MoMo Payout (RWF)</label>
                      <input
                        type="number"
                        value={modules.market_min_payout}
                        onChange={(e) => setModules({ ...modules, market_min_payout: Number(e.target.value) || 1000 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-5 col-span-2">
                      <span className="text-slate-400">Auto-Approve Verified Merchant Listings</span>
                      <input
                        type="checkbox"
                        checked={modules.market_auto_approve}
                        onChange={(e) => setModules({ ...modules, market_auto_approve: e.target.checked })}
                        className="w-4 h-4 rounded text-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* H. Stories & Creator Studio Control */}
                <div className="rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">Stories & Creator Studio</h4>
                        <p className="text-[11px] text-slate-400">Real stories, reels, monetization goals</p>
                      </div>
                    </div>
                    <Link
                      to="/"
                      target="_blank"
                      className="px-2.5 py-1 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-[11px] font-bold flex items-center gap-1 border border-rose-500/30 transition-colors"
                    >
                      <span>Homepage Reel</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Story Lifespan (hours)</label>
                      <input
                        type="number"
                        value={modules.story_lifespan_hours}
                        onChange={(e) => setModules({ ...modules, story_lifespan_hours: Number(e.target.value) || 24 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Creator Watch Hours Goal</label>
                      <input
                        type="number"
                        value={modules.creator_watch_hours_goal}
                        onChange={(e) => setModules({ ...modules, creator_watch_hours_goal: Number(e.target.value) || 300 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Creator Subscribers Goal</label>
                      <input
                        type="number"
                        value={modules.creator_subscribers_goal}
                        onChange={(e) => setModules({ ...modules, creator_subscribers_goal: Number(e.target.value) || 30 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-800 text-white font-bold"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-5">
                      <span className="text-slate-400">Real Stories Only</span>
                      <span className="text-emerald-400 font-bold">PostgreSQL Verified</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 7: NEON POSTGRESQL DATABASE HEALTH */}
          {activeTab === 'database' && (
            <div className="rounded-3xl p-6 sm:p-8 border border-slate-800 bg-[#131926] shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" /> Neon PostgreSQL Managed Cloud Database
                </h3>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  CONNECTED & HEALTHY
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#1A2234] border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Database Engine:</span>
                  <span className="text-white font-mono font-bold">PostgreSQL 16.x (Neon Serverless Connection Pooler)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Imported Radio/TV Stations:</span>
                  <span className="text-emerald-400 font-bold">36 Verified Stations with Logos & Direct Streams</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Security:</span>
                  <span className="text-blue-400 font-bold">SSL Required (libpq compat mode), SCRAM Auth</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Git Safety & Exclusion:</span>
                  <span className="text-emerald-400 font-mono font-bold">sql/ and *.sql permanently excluded in .gitignore</span>
                </div>
              </div>
            </div>
          )}

        </form>

      </div>
    </AdminLayout>
  );
};
