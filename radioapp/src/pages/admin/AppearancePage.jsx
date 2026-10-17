import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ColorPickerWithHex } from '../../components/common/ColorPickerWithHex';
import {
  Palette,
  CheckCircle2,
  RefreshCw,
  Upload,
  Trash2,
  ExternalLink,
  Eye,
  Type,
  Layout,
  Sparkles,
  Save,
  RotateCcw,
  Radio,
  Play,
  Volume2,
} from 'lucide-react';
import { api } from '../../api/client';

export function AppearancePage() {
  const { activeAdminStation } = useAuth();
  const stationId = activeAdminStation?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Original saved configuration (for Reset button)
  const [savedConfig, setSavedConfig] = useState(null);

  // Form working state
  const [formData, setFormData] = useState({
    theme: 'theme1_modern',
    logo_url: '',
    primary_color: '#4F46E5',
    secondary_color: '#06B6D4',
    accent_color: '#F59E0B',
    background_color: '#FFFFFF',
    surface_color: '#F8FAFC',
    text_color: '#0F172A',
    muted_color: '#64748B',
    header_color: '#FFFFFF',
    footer_color: '#0F172A',
    font_family: 'Plus Jakarta Sans',
    custom_font_url: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('theme'); // 'theme' | 'colors' | 'font' | 'logo'

  const fontOptions = [
    { name: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Modern & Clean)' },
    { name: 'Inter', label: 'Inter (High Legibility & Neutral)' },
    { name: 'Poppins', label: 'Poppins (Geometric & Friendly)' },
    { name: 'Montserrat', label: 'Montserrat (Bold & Editorial)' },
    { name: 'Outfit', label: 'Outfit (Sleek & Tech / Music)' },
    { name: 'Playfair Display', label: 'Playfair Display (Classic Serif)' },
    { name: 'Roboto', label: 'Roboto (Traditional Broadcast)' },
  ];

  const themeOptions = [
    {
      id: 'theme1_modern',
      name: 'Theme 1 — Modern Radio',
      description: 'Clean modern layout, large hero with wave visualizer, rounded-3xl cards, prominent live player, smooth animations.',
      badge: 'Urban Hits & Talk',
      tagColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'theme2_classic',
      name: 'Theme 2 — Classic FM',
      description: 'Professional traditional broadcast design, strong navigation, structured schedule timetable, compact cards, radio-station feel.',
      badge: 'Heritage & Traditional',
      tagColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'theme3_entertainment',
      name: 'Theme 3 — Entertainment',
      description: 'High energy visual design, large images, bold typography, dynamic playlist cards, music & club vibe, dark/neon backdrop.',
      badge: 'Music & Festivals',
      tagColor: 'bg-pink-100 text-pink-700',
    },
    {
      id: 'theme4_news',
      name: 'Theme 4 — News Radio',
      description: 'Clean editorial journalism appearance, breaking news bulletin ticker, strong headlines, multi-column article cards, information-dense.',
      badge: 'Journalism & Debates',
      tagColor: 'bg-red-100 text-red-700',
    },
    {
      id: 'theme5_minimal',
      name: 'Theme 5 — Minimal',
      description: 'Apple-inspired modern design, lots of whitespace, elegant light typography, minimal hairline cards, distraction-free player.',
      badge: 'Apple Style & Refined',
      tagColor: 'bg-slate-100 text-slate-800',
    },
  ];

  // Preset palettes for rapid styling
  const presetPalettes = [
    {
      name: 'Electric Wave',
      primary: '#4F46E5',
      secondary: '#06B6D4',
      accent: '#F59E0B',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#0F172A',
      header: '#FFFFFF',
      footer: '#0F172A'
    },
    {
      name: 'Classic Crimson',
      primary: '#DC2626',
      secondary: '#1E293B',
      accent: '#B91C1C',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#0F172A',
      header: '#1E293B',
      footer: '#0F172A'
    },
    {
      name: 'Cyber Neon',
      primary: '#EC4899',
      secondary: '#8B5CF6',
      accent: '#F43F5E',
      background: '#0A0A0A',
      surface: '#171717',
      text: '#F9FAFB',
      header: '#0F0F0F',
      footer: '#050505'
    },
    {
      name: 'Emerald FM',
      primary: '#059669',
      secondary: '#10B981',
      accent: '#D97706',
      background: '#FFFFFF',
      surface: '#F0FDF4',
      text: '#064E3B',
      header: '#FFFFFF',
      footer: '#064E3B'
    },
  ];

  // Load current branding
  useEffect(() => {
    async function loadBranding() {
      if (!stationId) return;
      setLoading(true);
      try {
        const data = await api.get(`/stations/${stationId}/branding`);
        const config = {
          theme: data.theme || 'theme1_modern',
          logo_url: data.logo_url || '',
          primary_color: data.primary_color || '#4F46E5',
          secondary_color: data.secondary_color || '#06B6D4',
          accent_color: data.accent_color || '#F59E0B',
          background_color: data.background_color || '#FFFFFF',
          surface_color: data.surface_color || '#F8FAFC',
          text_color: data.text_color || '#0F172A',
          muted_color: data.muted_color || '#64748B',
          header_color: data.header_color || '#FFFFFF',
          footer_color: data.footer_color || '#0F172A',
          font_family: data.font_family || 'Plus Jakarta Sans',
          custom_font_url: data.custom_font_url || '',
        };
        setFormData(config);
        setSavedConfig(config);
        setLogoPreview(data.logo_url || null);
      } catch (err) {
        console.error('Failed to load branding:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBranding();
  }, [stationId]);

  const handleColorChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const applyPalette = (palette) => {
    setFormData(prev => ({
      ...prev,
      primary_color: palette.primary,
      secondary_color: palette.secondary,
      accent_color: palette.accent,
      background_color: palette.background,
      surface_color: palette.surface,
      text_color: palette.text,
      header_color: palette.header,
      footer_color: palette.footer,
    }));
  };

  const handleLogoFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setLogoPreview(objectUrl);
      setFormData(prev => ({ ...prev, logo_url: '' }));
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo_url: '' }));
  };

  const handleReset = () => {
    if (savedConfig) {
      setFormData(savedConfig);
      setLogoPreview(savedConfig.logo_url || null);
      setLogoFile(null);
      setMessage('Appearance reset to last saved state.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      // 1. Upload logo if file selected
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logoFile);
        const uploadRes = await api.post(`/stations/${stationId}/branding/logo`, logoFormData);
        formData.logo_url = uploadRes.logo_url;
      } else if (!logoPreview) {
        await api.delete(`/stations/${stationId}/branding/logo`);
        formData.logo_url = null;
      }

      // 2. Save appearance parameters
      const updated = await api.put(`/stations/${stationId}/branding`, formData);
      setSavedConfig(formData);
      setLogoFile(null);
      setMessage('Appearance and branding settings saved successfully!');
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error('Failed to save appearance:', err);
      setError(err.message || 'Failed to save appearance settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading station appearance settings...</div>;
  }

  return (
    <div className="space-y-8">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Station Appearance & Themes</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Customize the 5 themes, brand colors, typography, and station logo with real-time live preview.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Main Split Grid: Left Editor (6 cols), Right Live Preview (6 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left: Configuration Panels (7 cols) */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-200/80 border border-slate-300/60">
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'theme' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>1. Themes (5)</span>
            </button>
            <button
              onClick={() => setActiveTab('colors')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'colors' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>2. Colors</span>
            </button>
            <button
              onClick={() => setActiveTab('font')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'font' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>3. Fonts</span>
            </button>
            <button
              onClick={() => setActiveTab('logo')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'logo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>4. Logo</span>
            </button>
          </div>

          {/* TAB 1: THEME SELECTION */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Choose Website Theme</h3>
                <span className="text-xs text-slate-500 font-medium">5 Architecturally Distinct Layouts</span>
              </div>

              <div className="space-y-3">
                {themeOptions.map((th) => {
                  const isSelected = formData.theme === th.id;
                  return (
                    <div
                      key={th.id}
                      onClick={() => setFormData(prev => ({ ...prev, theme: th.id }))}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-4 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900">{th.name}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${th.tagColor}`}>
                            {th.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{th.description}</p>
                      </div>

                      <div className="pt-1">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: COLOR SYSTEM */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              
              {/* Presets */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Quick Palette Presets</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {presetPalettes.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPalette(p)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-400 text-left transition-colors"
                    >
                      <div className="flex items-center gap-1 mb-1.5">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.primary }}></span>
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.secondary }}></span>
                        <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.accent }}></span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 block truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Token Customizers */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Detailed Design Tokens</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ColorPickerWithHex
                    label="Primary Color"
                    description="Hero, CTA buttons, active links"
                    value={formData.primary_color}
                    onChange={(val) => handleColorChange('primary_color', val)}
                  />
                  <ColorPickerWithHex
                    label="Secondary Color"
                    description="Badges, gradient accents"
                    value={formData.secondary_color}
                    onChange={(val) => handleColorChange('secondary_color', val)}
                  />
                  <ColorPickerWithHex
                    label="Accent Color"
                    description="Live dots, highlights"
                    value={formData.accent_color}
                    onChange={(val) => handleColorChange('accent_color', val)}
                  />
                  <ColorPickerWithHex
                    label="Background Color"
                    description="Main page body background"
                    value={formData.background_color}
                    onChange={(val) => handleColorChange('background_color', val)}
                  />
                  <ColorPickerWithHex
                    label="Surface / Card Color"
                    description="Card backgrounds & modals"
                    value={formData.surface_color}
                    onChange={(val) => handleColorChange('surface_color', val)}
                  />
                  <ColorPickerWithHex
                    label="Text Color"
                    description="Primary headings & story text"
                    value={formData.text_color}
                    onChange={(val) => handleColorChange('text_color', val)}
                  />
                  <ColorPickerWithHex
                    label="Muted Text Color"
                    description="Dates, metadata, subheads"
                    value={formData.muted_color}
                    onChange={(val) => handleColorChange('muted_color', val)}
                  />
                  <ColorPickerWithHex
                    label="Header Color"
                    description="Top navbar background"
                    value={formData.header_color}
                    onChange={(val) => handleColorChange('header_color', val)}
                  />
                  <ColorPickerWithHex
                    label="Footer Color"
                    description="Bottom footer background"
                    value={formData.footer_color}
                    onChange={(val) => handleColorChange('footer_color', val)}
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: FONT SELECTION */}
          {activeTab === 'font' && (
            <div className="space-y-6">
              <div className="space-y-4 p-5 rounded-2xl bg-white border border-slate-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Primary Typography
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fontOptions.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, font_family: f.name }))}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        formData.font_family === f.name
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-bold text-sm text-slate-900 block" style={{ fontFamily: f.name }}>
                        {f.name}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Web Font Link */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Custom Web Font Stylesheet URL (Optional)
                </label>
                <p className="text-xs text-slate-500">
                  Provide a valid Google Fonts or Adobe Fonts CSS link (e.g. <code>https://fonts.googleapis.com/css2?family=Space+Grotesk...</code>)
                </p>
                <input
                  type="url"
                  value={formData.custom_font_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_font_url: e.target.value }))}
                  placeholder="https://fonts.googleapis.com/css2?family=..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}

          {/* TAB 4: LOGO MANAGEMENT */}
          {activeTab === 'logo' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Station Logo Management</h3>

                {/* Logo Preview Banner */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Station logo" className="w-20 h-20 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-sm" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400">
                      <Radio className="w-8 h-8" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="font-bold text-sm text-slate-900">
                      {logoPreview ? 'Custom Station Logo Configured' : 'No Logo Configured (Using Default Badge)'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Recommended size: Square 512x512 PNG, JPG, or SVG with transparent background.
                    </p>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 pt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Logo</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* File Upload Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Upload Logo File</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileSelect}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>

                {/* Or Direct Image URL */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <label className="block text-xs font-bold text-slate-600">Or Paste Direct Image URL</label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, logo_url: e.target.value }));
                      setLogoPreview(e.target.value || null);
                      setLogoFile(null);
                    }}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Right: Real-Time Interactive Live Preview Viewport (5 cols) */}
        <div className="xl:col-span-5 sticky top-24 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Real-Time Website Live Preview</span>
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Interactive
            </span>
          </div>

          {/* Miniature Station Site Mockup */}
          <div
            className="rounded-3xl border border-slate-300 shadow-2xl overflow-hidden transition-all duration-300 text-xs"
            style={{
              backgroundColor: formData.background_color,
              color: formData.text_color,
              fontFamily: formData.font_family,
            }}
          >
            {/* Mock Header */}
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{ backgroundColor: formData.header_color, borderColor: 'rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center gap-2.5">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-8 h-8 rounded-xl object-cover shadow-xs" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: formData.primary_color }}
                  >
                    <Radio className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <span className="font-extrabold text-sm block leading-none">{activeAdminStation?.name || 'Radio'}</span>
                  <span className="text-[9px] text-slate-400">94.7 FM</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full text-[9px] font-bold text-white flex items-center gap-1 shadow-xs" style={{ backgroundColor: formData.primary_color }}>
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>PLAY</span>
                </span>
              </div>
            </div>

            {/* Mock Hero according to selected theme */}
            <div className="p-5 space-y-4">
              <div
                className="p-4 rounded-2xl shadow-sm text-white"
                style={{
                  background: formData.theme === 'theme3_entertainment'
                    ? 'linear-gradient(135deg, #4c0519 0%, #1e1b4b 100%)'
                    : formData.theme === 'theme2_classic'
                    ? '#0f172a'
                    : formData.theme === 'theme4_news'
                    ? '#ffffff'
                    : formData.theme === 'theme5_minimal'
                    ? '#ffffff'
                    : `linear-gradient(135deg, #0f172a 0%, ${formData.primary_color}99 100%)`,
                  color: (formData.theme === 'theme4_news' || formData.theme === 'theme5_minimal') ? formData.text_color : '#ffffff'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400">
                    LIVE BROADCAST
                  </span>
                  <span className="text-[10px] opacity-75">{formData.theme.replace('theme', 'Theme ').replace('_', ' ')}</span>
                </div>
                <h4 className="font-black text-base leading-snug">{activeAdminStation?.name}</h4>
                <p className="text-[10px] opacity-80 mt-1 line-clamp-1">
                  {activeAdminStation?.slogan || 'The rhythm of your day, non-stop hits and talk.'}
                </p>

                {/* Mock Player Bar */}
                <div
                  className="mt-3 p-2.5 rounded-xl flex items-center justify-between shadow-xs"
                  style={{ backgroundColor: formData.surface_color, color: formData.text_color }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: formData.primary_color }}>
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </span>
                    <div>
                      <span className="font-bold text-[10px] block leading-none">Studio Live Stream</span>
                      <span className="text-[8px] text-slate-400">High Quality 320kbps</span>
                    </div>
                  </div>
                  <Volume2 className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Mock Content Cards */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Preview Highlights</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl border shadow-xs" style={{ backgroundColor: formData.surface_color, borderColor: 'rgba(0,0,0,0.06)' }}>
                    <span className="text-[9px] font-bold text-red-600 uppercase">On Air</span>
                    <p className="font-bold text-[10px] truncate mt-0.5">The Morning Show</p>
                    <p className="text-[8px] text-slate-400">06:00 - 10:00</p>
                  </div>
                  <div className="p-2.5 rounded-xl border shadow-xs" style={{ backgroundColor: formData.surface_color, borderColor: 'rgba(0,0,0,0.06)' }}>
                    <span className="text-[9px] font-bold text-indigo-600 uppercase">News</span>
                    <p className="font-bold text-[10px] truncate mt-0.5">Top Daily Headlines</p>
                    <p className="text-[8px] text-slate-400">2.4k reads</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Mock Footer */}
            <div
              className="p-3 text-center text-[9px] text-slate-400 border-t"
              style={{ backgroundColor: formData.footer_color, borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <span>© 2026 {activeAdminStation?.name}. Powered by Radio Platform.</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
