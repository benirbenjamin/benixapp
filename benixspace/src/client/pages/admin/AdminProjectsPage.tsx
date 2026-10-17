import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { fetchProjects, saveProject, deleteProject } from '../../services/api';
import { Project } from '../../types';
import { Plus, Edit, Trash2, ExternalLink, Sparkles, X, CheckCircle2, AlertCircle } from 'lucide-react';

import { getProjectImageUrl } from '../../utils/images';

export const AdminProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadProjects = async () => {
    try {
      const data = await fetchProjects({ status: 'all' });
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleOpenNew = () => {
    setEditingProject({
      name: '',
      slug: '',
      url: '',
      short_description: '',
      full_description: '',
      image_url: 'https://i.postimg.cc/85zP6mK2/benix-tv-cover.jpg',
      category: 'Streaming & Media',
      tags: ['NebeluRw', 'Platform'],
      technologies: ['React', 'TypeScript', 'Node.js'],
      status: 'published',
      featured: false,
      embed_mode: 'both',
      sort_order: 1
    });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleOpenEdit = (proj: Project) => {
    setEditingProject({
      ...proj,
      tags: typeof proj.tags === 'string' ? JSON.parse(proj.tags || '[]') : proj.tags,
      technologies: typeof proj.technologies === 'string' ? JSON.parse(proj.technologies || '[]') : proj.technologies
    });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(id);
      loadProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setFormError('');

    if (!editingProject.name || !editingProject.slug || !editingProject.url || !editingProject.short_description) {
      setFormError('Please fill in Name, Slug, URL, and Short Description.');
      return;
    }

    try {
      await saveProject(editingProject, !!editingProject.id);
      setFormSuccess('Project saved successfully!');
      setTimeout(() => {
        setShowModal(false);
        loadProjects();
      }, 800);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save project.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Project Management</h1>
            <p className="text-slate-600 text-sm">Create, edit, feature, and configure NebeluRw digital platforms.</p>
          </div>
          <button
            onClick={handleOpenNew}
            className="px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Project
          </button>
        </div>

        {/* Datatable */}
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs uppercase font-extrabold border-b border-slate-200">
                  <th className="p-4">Platform Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">URL</th>
                  <th className="p-4">Embed Mode</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">Loading projects...</td>
                  </tr>
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No projects found. Click "Add New Project".</td>
                  </tr>
                ) : (
                  projects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <img src={getProjectImageUrl(proj)} alt={proj.name} className="w-10 h-10 rounded-xl object-cover" />
                          <div>
                            <span className="block">{proj.name}</span>
                            {proj.featured && (
                              <span className="text-[10px] text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full font-semibold">Featured</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 text-xs font-semibold">{proj.category}</td>
                      <td className="p-4 text-slate-600 text-xs font-mono">
                        <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline flex items-center gap-1">
                          {proj.url.replace('https://', '')} <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-700 capitalize">{proj.embed_mode}</td>
                      <td className="p-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                          proj.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {proj.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(proj)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-sky-600 hover:text-white text-slate-700 transition-colors"
                          title="Edit Project"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(proj.id)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-red-600 hover:text-white text-slate-700 transition-colors"
                          title="Delete Project"
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

        {/* Add/Edit Modal */}
        {showModal && editingProject && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="glass-card bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 border border-slate-200 shadow-2xl">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingProject.id ? 'Edit Platform Details' : 'Add New NebeluRw Project'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" /> <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4 text-xs font-semibold">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-600 uppercase">Project Name</label>
                    <input
                      type="text"
                      value={editingProject.name || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                      placeholder="Benix Space TV"
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm font-normal"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-600 uppercase">Slug Identifier</label>
                    <input
                      type="text"
                      value={editingProject.slug || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, slug: e.target.value })}
                      placeholder="benix-space-tv"
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm font-normal"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-600 uppercase">External Website URL</label>
                    <input
                      type="url"
                      value={editingProject.url || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, url: e.target.value })}
                      placeholder="https://tv.benix.space"
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm font-normal"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-600 uppercase">Category</label>
                    <select
                      value={editingProject.category || 'Streaming & Media'}
                      onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm font-normal"
                    >
                      <option value="Streaming & Media">Streaming & Media</option>
                      <option value="Gaming & Entertainment">Gaming & Entertainment</option>
                      <option value="Utility & Tools">Utility & Tools</option>
                      <option value="Music Ecosystem">Music Ecosystem</option>
                      <option value="Web Application">Web Application</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 uppercase">Image URL (Postimages.org Supported)</label>
                  <input
                    type="url"
                    value={editingProject.image_url || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, image_url: e.target.value })}
                    placeholder="https://i.postimg.cc/..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-normal"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 uppercase">Short Description</label>
                  <textarea
                    rows={2}
                    value={editingProject.short_description || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, short_description: e.target.value })}
                    placeholder="Brief description for homepage 3D cards..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-normal"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 uppercase">Full Overview & Features</label>
                  <textarea
                    rows={4}
                    value={editingProject.full_description || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, full_description: e.target.value })}
                    placeholder="Detailed platform breakdown for project page..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-normal"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-slate-600 uppercase">Embed Mode</label>
                    <select
                      value={editingProject.embed_mode || 'both'}
                      onChange={(e) => setEditingProject({ ...editingProject, embed_mode: e.target.value as any })}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm font-normal"
                    >
                      <option value="both">External & Embed</option>
                      <option value="external">External Only</option>
                      <option value="embed">Embed Only</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-600 uppercase">Status</label>
                    <select
                      value={editingProject.status || 'published'}
                      onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm font-normal"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={!!editingProject.featured}
                      onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                      className="w-4 h-4 text-sky-600 rounded"
                    />
                    <label htmlFor="featured" className="text-sm font-bold text-slate-800">Feature on Homepage</label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-md"
                  >
                    Save Project
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
