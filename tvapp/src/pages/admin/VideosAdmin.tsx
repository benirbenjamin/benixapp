import React, { useEffect, useState } from 'react';
import {
  Video as VideoIcon,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  Calendar,
  Sparkles,
  Search,
  Tag,
} from 'lucide-react';
import { Video, Category } from '../../types';
import { getVideos, getCategories, createVideo, updateVideo, deleteVideo } from '../../services/api';
import { AdminLayout } from '../../components/layout/AdminLayout';

export const VideosAdminPage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [editingVideo, setEditingVideo] = useState<Partial<Video> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [videosData, categoriesData] = await Promise.all([
        getVideos({ limit: 100, include_unpublished: true }),
        getCategories(),
      ]);
      setVideos(videosData.data || []);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleOpenAdd = () => {
    setIsNew(true);
    setEditingVideo({
      title: '',
      slug: '',
      description: '',
      original_url: '',
      thumbnail_url: '',
      category_id: categories[0]?.id || '',
      publication_date: new Date().toISOString().split('T')[0],
      is_featured: false,
      is_published: true,
    });
    setErrorMsg(null);
  };

  const handleOpenEdit = (v: Video) => {
    setIsNew(false);
    setEditingVideo({ ...v });
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    setSaving(true);
    setErrorMsg(null);

    try {
      if (isNew) {
        await createVideo(editingVideo);
      } else if (editingVideo.id) {
        await updateVideo(editingVideo.id, editingVideo);
      }
      setEditingVideo(null);
      await fetchAll();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: Video) => {
    if (!window.confirm(`Delete video "${v.title}"?`)) return;
    try {
      await deleteVideo(v.id);
      await fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to delete video');
    }
  };

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Video Bulletins & Programs
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Add external broadcast videos (YouTube / embed) and organize categories
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-rba-blue hover:bg-rba-blueHover text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Video
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos by title..."
            className="w-full text-xs sm:text-sm bg-transparent focus:outline-none"
          />
        </div>

        {/* Videos Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Video</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Views</th>
                  <th className="px-4 py-4 text-center">Featured</th>
                  <th className="px-4 py-4 text-center">Published</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      Loading videos...
                    </td>
                  </tr>
                ) : filteredVideos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No videos found. Click "Add Video" to add one.
                    </td>
                  </tr>
                ) : (
                  filteredVideos.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Video Thumbnail & Title */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={v.thumbnail_url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=400&q=80'}
                            alt={v.title}
                            className="w-16 h-10 object-cover rounded-lg shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0 max-w-xs">
                            <span className="font-extrabold text-slate-900 line-clamp-1 block text-sm">
                              {v.title}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 truncate block">
                              {v.original_url}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
                          {v.category_name || 'General'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 font-mono text-[11px] text-slate-500">
                        {v.publication_date}
                      </td>

                      {/* Views */}
                      <td className="px-4 py-4 font-bold text-slate-800">
                        {(v.views_count || 0).toLocaleString()}
                      </td>

                      {/* Featured */}
                      <td className="px-4 py-4 text-center">
                        {v.is_featured ? (
                          <Sparkles className="w-4 h-4 text-amber-500 mx-auto" />
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Published */}
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {v.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rba-blue hover:bg-slate-100 transition-colors"
                          title="Edit Video"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(v)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete Video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Add / Edit Video */}
        {editingVideo && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp my-8">
              <h2 className="text-xl font-black text-slate-900 mb-4">
                {isNew ? 'Embed New Video Bulletin' : 'Edit Video Details'}
              </h2>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Video Title *</label>
                  <input
                    type="text"
                    required
                    value={editingVideo.title || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                    placeholder="e.g. Amakuru Mashya ya RTV: Ubutumwa bwa Perezida..."
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Video URL (YouTube or external embed) *
                  </label>
                  <input
                    type="url"
                    required
                    value={editingVideo.original_url || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, original_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=kYJ5oVpC9kE"
                    className="w-full px-3.5 py-2 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    The backend automatically extracts the video ID and generates the clean embed player URL.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Category</label>
                    <select
                      value={editingVideo.category_id || ''}
                      onChange={(e) => setEditingVideo({ ...editingVideo, category_id: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Publication Date</label>
                    <input
                      type="date"
                      value={editingVideo.publication_date || ''}
                      onChange={(e) => setEditingVideo({ ...editingVideo, publication_date: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Custom Thumbnail URL (optional)</label>
                  <input
                    type="url"
                    value={editingVideo.thumbnail_url || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, thumbnail_url: e.target.value })}
                    placeholder="Leave blank to use automatic YouTube high-res thumbnail"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={editingVideo.description || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                    placeholder="Description and highlights of the broadcast..."
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rba-blue focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingVideo.is_featured ?? false}
                      onChange={(e) => setEditingVideo({ ...editingVideo, is_featured: e.target.checked })}
                      className="rounded text-rba-blue"
                    />
                    <span>Feature on Homepage</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingVideo.is_published ?? true}
                      onChange={(e) => setEditingVideo({ ...editingVideo, is_published: e.target.checked })}
                      className="rounded text-rba-blue"
                    />
                    <span>Published</span>
                  </label>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingVideo(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-rba-blue hover:bg-rba-blueHover text-white font-bold transition-all shadow-md disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Video'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
