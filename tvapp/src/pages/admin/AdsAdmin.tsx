import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Share2,
  ExternalLink,
  MessageCircle,
  Eye,
  MousePointer,
  Clock,
  Sparkles,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  Calendar,
  Phone,
  Settings,
  X,
  Play,
  Pause,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { CustomAd, AdSettings } from '../../types';
import {
  getAdminAds,
  createCustomAd,
  updateCustomAd,
  deleteCustomAd,
  manageShareToken,
  saveAdSettings,
} from '../../services/api';

export const AdsAdminPage: React.FC = () => {
  const [ads, setAds] = useState<CustomAd[]>([]);
  const [settings, setSettings] = useState<AdSettings>({
    whatsapp_number: '+250783987223',
    google_ads_per_custom_ad: 2,
    enable_custom_ads: true,
    enable_google_adsense: true,
    default_share_expiry_hours: 168,
    radio_ad_interval_seconds: 240,
    radio_ad_countdown_seconds: 10,
    tv_ad_initial_delay_seconds: 60,
    tv_ad_interval_seconds: 300,
    tv_ad_countdown_seconds: 10,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingAd, setEditingAd] = useState<CustomAd | null>(null);
  const [formData, setFormData] = useState<Partial<CustomAd>>({
    title: '',
    sponsor_name: '',
    owner_phone: '+250783987223',
    category: 'General',
    tagline: '',
    description: '',
    cta_text: 'Learn More',
    cta_url: 'https://',
    media_type: 'IMAGE',
    banner_url: '',
    bg_gradient: 'from-blue-900 via-indigo-900 to-slate-900',
    accent_color: '#0284c7',
    badge_text: 'Sponsored',
    status: 'ACTIVE',
  });
  const [formExpiryHours, setFormExpiryHours] = useState<number>(168);

  // Share Modal State
  const [shareModalAd, setShareModalAd] = useState<CustomAd | null>(null);
  const [shareExpiryHours, setShareExpiryHours] = useState<number>(168);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Settings Drawer State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAdminAds();
      setAds(data.ads || []);
      if (data.settings) setSettings(data.settings);
    } catch (err) {
      console.error('Failed to load admin ads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered ads
  const filteredAds = ads.filter((ad) => {
    const matchesSearch =
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.sponsor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.owner_phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || ad.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle Form Submission (Create or Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAd) {
        await updateCustomAd(editingAd.id, formData);
      } else {
        await createCustomAd({ ...formData, expiry_hours: formExpiryHours });
      }
      setIsFormOpen(false);
      setEditingAd(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save ad');
    }
  };

  const handleEditClick = (ad: CustomAd) => {
    setEditingAd(ad);
    setFormData(ad);
    setIsFormOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this custom ad?')) return;
    try {
      await deleteCustomAd(id);
      loadData();
    } catch (err: any) {
      alert('Failed to delete ad');
    }
  };

  const handleToggleStatus = async (ad: CustomAd) => {
    const nextStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await updateCustomAd(ad.id, { status: nextStatus });
      loadData();
    } catch (err) {
      alert('Failed to update ad status');
    }
  };

  // Generate / Refresh / Revoke Share Token
  const handleUpdateShareToken = async (id: string, expiryHours?: number, revoke?: boolean) => {
    try {
      const res = await manageShareToken(id, { expiry_hours: expiryHours, revoke });
      if (shareModalAd && shareModalAd.id === id) {
        setShareModalAd(res.ad);
      }
      loadData();
    } catch (err) {
      alert('Failed to update share token');
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      await saveAdSettings(settings);
      setIsSettingsOpen(false);
      loadData();
    } catch (err) {
      alert('Failed to save settings');
    }
  };

  const getPublicShareUrl = (token?: string) => {
    if (!token) return '';
    const origin = window.location.origin;
    return `${origin}/ad-analytics/${token}`;
  };

  const getWhatsAppShareUrl = (ad: CustomAd) => {
    if (!ad.share_token) return '#';
    const shareUrl = getPublicShareUrl(ad.share_token);
    const cleanPhone = ad.owner_phone.replace(/[^0-9]/g, '');
    const message = `Hello ${ad.sponsor_name}! Here is your live performance analytics link for your "${ad.title}" ad on Benix Space TV: ${shareUrl}`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-rba-blue/10 text-rba-blue">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Custom Ad Management</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submit sponsor ads, configure Google AdSense rotation ratio, and share WhatsApp analytics links.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Rotation Settings</span>
            </button>

            <button
              onClick={() => {
                setEditingAd(null);
                setFormData({
                  title: '',
                  sponsor_name: '',
                  owner_phone: '+250783987223',
                  category: 'General',
                  tagline: '',
                  description: '',
                  cta_text: 'Learn More',
                  cta_url: 'https://',
                  media_type: 'IMAGE',
                  banner_url: '',
                  bg_gradient: 'from-blue-900 via-indigo-900 to-slate-900',
                  accent_color: '#0284c7',
                  badge_text: 'Sponsored',
                  status: 'ACTIVE',
                });
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rba-blue hover:bg-rba-navy text-white font-extrabold text-xs shadow-md transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New Ad</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-rba-blue">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Total Custom Ads</p>
              <p className="text-2xl font-black text-slate-900">{ads.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Active Campaign Ads</p>
              <p className="text-2xl font-black text-slate-900">
                {ads.filter((a) => a.status === 'ACTIVE').length}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Total Ad Impressions</p>
              <p className="text-2xl font-black text-slate-900">
                {ads.reduce((acc, a) => acc + (a.impressions_count || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <MousePointer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Total Clicks Received</p>
              <p className="text-2xl font-black text-slate-900">
                {ads.reduce((acc, a) => acc + (a.clicks_count || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ad title, sponsor, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rba-blue"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Ads</option>
              <option value="PAUSED">Paused Ads</option>
              <option value="EXPIRED">Expired Ads</option>
            </select>

            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
              title="Refresh Ads"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Custom Ads Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-rba-blue border-t-transparent mx-auto mb-3" />
              Loading custom ads...
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Megaphone className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">No custom ads found.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Submit New Ad" to add your first sponsor advertisement and start tracking analytics.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-extrabold uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="p-4">Sponsor & Campaign Title</th>
                    <th className="p-4">Owner Phone</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Impressions</th>
                    <th className="p-4 text-center">Clicks</th>
                    <th className="p-4 text-center">CTR %</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAds.map((ad) => {
                    const ctr =
                      ad.impressions_count > 0
                        ? ((ad.clicks_count / ad.impressions_count) * 100).toFixed(1)
                        : '0.0';

                    return (
                      <tr key={ad.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black shrink-0"
                              style={{ backgroundColor: ad.accent_color || '#0284c7' }}
                            >
                              <Megaphone className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 truncate max-w-xs">{ad.title}</p>
                              <p className="text-[11px] text-slate-500 font-medium">
                                {ad.sponsor_name} • {ad.category}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 font-mono font-bold text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{ad.owner_phone}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              ad.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : ad.status === 'PAUSED'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {ad.status}
                          </span>
                        </td>

                        <td className="p-4 text-center font-extrabold text-slate-900">
                          {ad.impressions_count.toLocaleString()}
                        </td>

                        <td className="p-4 text-center font-extrabold text-slate-900">
                          {ad.clicks_count.toLocaleString()}
                        </td>

                        <td className="p-4 text-center font-mono font-bold text-rba-blue">
                          {ctr}%
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Analytics Share Link */}
                            <button
                              onClick={() => setShareModalAd(ad)}
                              className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors flex items-center gap-1"
                              title="Share Analytics on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-current" />
                              <span className="hidden sm:inline">Share</span>
                            </button>

                            {/* Pause/Resume Toggle */}
                            <button
                              onClick={() => handleToggleStatus(ad)}
                              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                              title={ad.status === 'ACTIVE' ? 'Pause Ad' : 'Resume Ad'}
                            >
                              {ad.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditClick(ad)}
                              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                              title="Edit Ad"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteClick(ad.id)}
                              className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              title="Delete Ad"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SUBMIT / EDIT AD MODAL */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
              
              <div className="px-6 py-4 bg-rba-navy text-white flex items-center justify-between shrink-0">
                <h3 className="font-black text-base flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-rba-yellow" />
                  {editingAd ? 'Edit Custom Ad' : 'Submit New Sponsor Ad'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-slate-700 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-bold">Campaign Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Inyange Milk Special Promo"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rba-blue"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-bold">Sponsor / Business Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Inyange Industries"
                      value={formData.sponsor_name || ''}
                      onChange={(e) => setFormData({ ...formData, sponsor_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rba-blue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-bold">Owner Phone Number (WhatsApp) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +250783987223"
                      value={formData.owner_phone || ''}
                      onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rba-blue"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-bold">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Banking, Telecom, Beverages"
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rba-blue"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-bold">CTA Link URL *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://example.com"
                      value={formData.cta_url || ''}
                      onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rba-blue"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-bold">CTA Button Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Learn More, Order Now"
                      value={formData.cta_text || ''}
                      onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rba-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-bold">Tagline (Short Summary)</label>
                  <input
                    type="text"
                    placeholder="e.g. Refresh your day with 100% natural juices"
                    value={formData.tagline || ''}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rba-blue"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold">Banner Image URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.banner_url || ''}
                    onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rba-blue"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 font-bold">Accent Color</label>
                    <input
                      type="color"
                      value={formData.accent_color || '#0284c7'}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      className="w-full h-10 rounded-xl cursor-pointer"
                    />
                  </div>

                  {!editingAd && (
                    <div>
                      <label className="block mb-1 font-bold">Analytics Link Expiry</label>
                      <select
                        value={formExpiryHours}
                        onChange={(e) => setFormExpiryHours(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      >
                        <option value={24}>24 Hours (1 Day)</option>
                        <option value={168}>7 Days (1 Week)</option>
                        <option value={720}>30 Days (1 Month)</option>
                        <option value={0}>Never (Unlimited)</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-rba-blue hover:bg-rba-navy text-white font-extrabold shadow-md"
                  >
                    {editingAd ? 'Update Ad' : 'Save & Publish Ad'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* SHARE ANALYTICS MODAL */}
        {shareModalAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-600 fill-current" />
                  <h3 className="font-extrabold text-sm text-slate-900">WhatsApp Analytics Share</h3>
                </div>
                <button
                  onClick={() => setShareModalAd(null)}
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Send this secret analytics report link directly to <strong>{shareModalAd.sponsor_name}</strong> via WhatsApp. They can view real-time impression & click performance without logging in.
                </p>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono break-all font-semibold text-slate-800">
                  {shareModalAd.share_token ? (
                    getPublicShareUrl(shareModalAd.share_token)
                  ) : (
                    <span className="text-red-500 italic">No active token. Click "Generate Link" below.</span>
                  )}
                </div>

                {shareModalAd.token_expires_at && (
                  <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expires: {new Date(shareModalAd.token_expires_at).toLocaleString()}</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-2">
                {shareModalAd.share_token && (
                  <a
                    href={getWhatsAppShareUrl(shareModalAd)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-102"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Send Link to {shareModalAd.owner_phone}</span>
                  </a>
                )}

                <div className="flex items-center gap-2">
                  {shareModalAd.share_token && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getPublicShareUrl(shareModalAd.share_token));
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleUpdateShareToken(shareModalAd.id, shareExpiryHours)}
                    className="flex-1 py-2.5 rounded-xl bg-rba-blue hover:bg-rba-navy font-bold text-xs text-white flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generate New Token</span>
                  </button>
                </div>

                {shareModalAd.share_token && (
                  <button
                    onClick={() => handleUpdateShareToken(shareModalAd.id, undefined, true)}
                    className="w-full py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Expire / Revoke Link Now</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* SETTINGS DRAWER */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-rba-blue" />
                  <h3 className="font-extrabold text-sm text-slate-900">Ad Engine & Rotation Settings</h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block mb-1 font-bold">Rotation Ratio (Google AdSense vs Custom Ads) *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={settings.google_ads_per_custom_ad}
                      onChange={(e) => setSettings({ ...settings, google_ads_per_custom_ad: Number(e.target.value) })}
                      className="w-24 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-black text-sm text-rba-blue text-center"
                    />
                    <span className="text-slate-500">Google Ads shown before 1 Custom Ad</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Example: Setting to <strong>2</strong> means 2 Google AdSense ads, 1 Custom Ad, 2 Google AdSense ads...
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-bold">1st TV Ad Delay (Seconds)</label>
                    <input
                      type="number"
                      min={10}
                      value={settings.tv_ad_initial_delay_seconds || 60}
                      onChange={(e) => setSettings({ ...settings, tv_ad_initial_delay_seconds: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Default: <strong>60s (1 min)</strong> after starting TV play.
                    </p>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold">TV Ad Repeat Interval (Seconds)</label>
                    <input
                      type="number"
                      min={30}
                      value={settings.tv_ad_interval_seconds || 300}
                      onChange={(e) => setSettings({ ...settings, tv_ad_interval_seconds: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Default: <strong>300s (5 mins)</strong> repeat interval.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-bold">TV Ad Duration Countdown (Seconds)</label>
                    <input
                      type="number"
                      min={3}
                      max={60}
                      value={settings.tv_ad_countdown_seconds || 10}
                      onChange={(e) => setSettings({ ...settings, tv_ad_countdown_seconds: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Ad watch timer before user can skip/close TV ad.
                    </p>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold">Radio Pre-Roll Countdown (Seconds)</label>
                    <input
                      type="number"
                      min={3}
                      max={60}
                      value={settings.radio_ad_countdown_seconds || 10}
                      onChange={(e) => setSettings({ ...settings, radio_ad_countdown_seconds: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Ad timer before radio stream starts.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-bold">Radio Throttle Interval (Seconds)</label>
                  <input
                    type="number"
                    min={30}
                    value={settings.radio_ad_interval_seconds}
                    onChange={(e) => setSettings({ ...settings, radio_ad_interval_seconds: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Default: <strong>240 seconds (4 minutes)</strong> throttle between radio ads.
                  </p>
                </div>

                <div>
                  <label className="block mb-1 font-bold">Contact WhatsApp Number for Advertisers *</label>
                  <input
                    type="text"
                    value={settings.whatsapp_number}
                    onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enable_custom_ads}
                      onChange={(e) => setSettings({ ...settings, enable_custom_ads: e.target.checked })}
                      className="w-4 h-4 rounded text-rba-blue"
                    />
                    <span>Enable Custom Sponsor Ads Rotation</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enable_google_adsense}
                      onChange={(e) => setSettings({ ...settings, enable_google_adsense: e.target.checked })}
                      className="w-4 h-4 rounded text-rba-blue"
                    />
                    <span>Enable Google AdSense (Global worldwide loading)</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="px-5 py-2 rounded-xl bg-rba-blue text-white font-extrabold shadow-md"
                  >
                    Save Settings
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
