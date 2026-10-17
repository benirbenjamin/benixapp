import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SlidersHorizontal, Save, CheckCircle2, Eye, EyeOff, Radio, Calendar, Newspaper, Video, Info, Share2, Mail } from 'lucide-react';
import { api } from '../../api/client';

export function SectionsManagerPage() {
  const { activeAdminStation } = useAuth();
  const stationId = activeAdminStation?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [sections, setSections] = useState({
    player_enabled: true,
    on_air_enabled: true,
    programs_enabled: true,
    news_enabled: true,
    videos_enabled: true,
    about_enabled: true,
    social_enabled: true,
    contact_enabled: true,
  });

  const sectionDefinitions = [
    {
      key: 'player_enabled',
      title: 'Hero / Live Radio Player',
      description: 'The primary station branding hero with the live audio stream player, stream switcher, and audio visualizer.',
      icon: Radio,
    },
    {
      key: 'on_air_enabled',
      title: 'Now On Air & Next Up Widget',
      description: 'Dynamic show display that automatically calculates which presenter and program is broadcasting right now.',
      icon: Radio,
    },
    {
      key: 'programs_enabled',
      title: 'Radio Programs & Lineup',
      description: 'Daily schedule showcase cards with program covers, presenters, and broadcast times.',
      icon: Calendar,
    },
    {
      key: 'news_enabled',
      title: 'Latest News & Articles',
      description: 'Editorial article feed highlighting latest news stories, music updates, and press releases.',
      icon: Newspaper,
    },
    {
      key: 'videos_enabled',
      title: 'YouTube Studio Videos',
      description: 'Video cards with responsive embedded YouTube clips and interviews.',
      icon: Video,
    },
    {
      key: 'about_enabled',
      title: 'About the Station Section',
      description: 'Station biography, frequency overview, and station mission statement.',
      icon: Info,
    },
    {
      key: 'social_enabled',
      title: 'Social Media Links & Community',
      description: 'Direct icon links to Instagram, Facebook, X/Twitter, TikTok, YouTube, and WhatsApp.',
      icon: Share2,
    },
    {
      key: 'contact_enabled',
      title: 'Contact Studio & Map/Form',
      description: 'On-air studio hotline, studio email, physical address, and interactive listener message form.',
      icon: Mail,
    },
  ];

  useEffect(() => {
    async function loadSections() {
      if (!stationId) return;
      setLoading(true);
      try {
        const data = await api.get(`/stations/${stationId}/sections`);
        setSections({
          player_enabled: Boolean(data.player_enabled),
          on_air_enabled: Boolean(data.on_air_enabled),
          programs_enabled: Boolean(data.programs_enabled),
          news_enabled: Boolean(data.news_enabled),
          videos_enabled: Boolean(data.videos_enabled),
          about_enabled: Boolean(data.about_enabled),
          social_enabled: Boolean(data.social_enabled),
          contact_enabled: Boolean(data.contact_enabled),
        });
      } catch (err) {
        console.error('Failed to load sections:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSections();
  }, [stationId]);

  const handleToggle = (key) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.put(`/stations/${stationId}/sections`, sections);
      setMessage('Homepage section visibility updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update section visibility.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading section settings...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Homepage Sections Visibility</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control which blocks appear on the public station website. Disabled sections are completely omitted from the layout.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Section Settings'}</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Sections Toggle List */}
      <div className="space-y-3">
        {sectionDefinitions.map((sec) => {
          const Icon = sec.icon;
          const isEnabled = sections[sec.key];

          return (
            <div
              key={sec.key}
              onClick={() => handleToggle(sec.key)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                isEnabled
                  ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900">{sec.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isEnabled ? 'VISIBLE' : 'HIDDEN'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{sec.description}</p>
                </div>
              </div>

              {/* Switch pill */}
              <div
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 p-0.5 ${
                  isEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    isEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
