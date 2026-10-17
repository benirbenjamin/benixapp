import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RichTextEditor } from '../../components/common/RichTextEditor';
import { PostimagesGuideModal } from '../../components/common/PostimagesGuideModal';
import {
  ArrowLeft,
  Save,
  ExternalLink,
  HelpCircle,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { api } from '../../api/client';

export function NewsEditPage() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { activeAdminStation } = useAuth();
  const stationId = activeAdminStation?.id;

  const isEditing = Boolean(articleId);

  const [categories, setCategories] = useState([]);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    excerpt: '',
    content_html: '',
    image_url: '',
    youtube_url: '',
    status: 'published',
  });

  // Load article & categories
  useEffect(() => {
    async function loadData() {
      if (!stationId) return;
      try {
        const catData = await api.get(`/stations/${stationId}/news-categories`);
        setCategories(catData || []);

        if (isEditing) {
          const artData = await api.get(`/stations/${stationId}/news/${articleId}`);
          if (artData.article) {
            setFormData({
              title: artData.article.title || '',
              category_id: artData.article.category_id || '',
              excerpt: artData.article.excerpt || '',
              content_html: artData.article.content_html || '',
              image_url: artData.article.image_url || '',
              youtube_url: artData.article.youtube_url || '',
              status: artData.article.status || 'published',
            });
          }
        }
      } catch (err) {
        console.error('Failed to load article details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [stationId, articleId, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content_html) {
      alert('Please provide both a headline and article content.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/stations/${stationId}/news/${articleId}`, formData);
      } else {
        await api.post(`/stations/${stationId}/news`, formData);
      }
      navigate('/admin/news');
    } catch (err) {
      alert(err.message || 'Failed to save news article.');
    } finally {
      setSaving(false);
    }
  };

  const isImageUrlValid = formData.image_url && formData.image_url.startsWith('http');

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading article editor...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <Link
          to="/admin/news"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles</span>
        </Link>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : isEditing ? 'Update Article' : 'Publish Article'}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Title */}
        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Article Title / Headline
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Kigali Wave Music Awards 2026 Nominees Revealed"
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-base sm:text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Category & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              News Category
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
            >
              <option value="">General News</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Publication Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
            >
              <option value="published">Published (Visible Publicly)</option>
              <option value="draft">Draft (Private to Admin)</option>
              <option value="disabled">Disabled (Hidden)</option>
            </select>
          </div>
        </div>

        {/* Lead Excerpt */}
        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Excerpt / Summary Lead
          </label>
          <textarea
            rows={2}
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="Brief summary appearing on homepage cards and search snippets..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* POSTIMAGES.ORG EXTERNAL IMAGE HOSTING GUIDANCE BOX */}
        <div className="p-5 sm:p-6 rounded-3xl bg-indigo-50/60 border border-indigo-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm">
              <ImageIcon className="w-5 h-5 text-indigo-600" />
              <span>Article Cover Image (Hosted on Postimages.org)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGuideModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>How to upload?</span>
              </button>

              <a
                href="https://postimages.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <span>Open Postimages.org</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <p className="text-xs text-indigo-950/80 leading-relaxed">
            Upload your picture to <strong>Postimages.org</strong>, copy the generated <code className="font-bold bg-indigo-100 px-1.5 py-0.5 rounded">Direct Link</code>, and paste it below.
          </p>

          <div className="space-y-2">
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value.trim() })}
              placeholder="https://i.postimg.cc/.../image.jpg or https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />

            {/* Live Image Preview */}
            {isImageUrlValid && (
              <div className="p-3 rounded-2xl bg-white border border-indigo-200 flex items-center gap-4">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/150?text=Invalid+Image+URL';
                  }}
                  className="w-20 h-16 rounded-xl object-cover ring-1 ring-slate-200"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Direct Image Link Verified</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-sm font-mono">
                    {formData.image_url}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rich Text Editor */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Article Story & Rich Content
          </label>
          <RichTextEditor
            value={formData.content_html}
            onChange={(html) => setFormData({ ...formData, content_html: html })}
            placeholder="Write the complete news article here. Use formatting tools, quotes, lists, and embeds..."
          />
        </div>

        {/* Optional YouTube Video Embed URL */}
        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Featured YouTube Video URL (Optional)
          </label>
          <input
            type="url"
            value={formData.youtube_url}
            onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

      </form>

      {/* Postimages Guidance Modal */}
      <PostimagesGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />

    </div>
  );
}
