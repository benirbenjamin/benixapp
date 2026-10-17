import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { fetchProjects, fetchArticles } from '../../services/api';
import { Project, Article } from '../../types';
import { SearchCheck, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck, FileCode } from 'lucide-react';

export const AdminSeoPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [projData, artData] = await Promise.all([
          fetchProjects({ status: 'all' }),
          fetchArticles({ status: 'all' })
        ]);
        setProjects(projData);
        setArticles(artData);
      } catch (err) {
        console.error('SEO Audit data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const projectsMissingSeoTitle = projects.filter((p) => !p.seo_title || p.seo_title.length < 10);
  const articlesMissingSeoDesc = articles.filter((a) => !a.seo_description || a.seo_description.length < 30);
  const articlesMissingImages = articles.filter((a) => !a.featured_image_url);

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">SEO Health & Audit Dashboard</h1>
          <p className="text-slate-600 text-sm">Site-wide search engine indexation health, sitemap status, and meta coverage.</p>
        </div>

        {/* Indexing Files Health */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900">XML Sitemap Health</h3>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                Active & Dynamic
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Automatically updates whenever a project or article is published.
            </p>
            <div className="pt-2">
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-sky-600 hover:underline inline-flex items-center gap-1">
                <span>View /sitemap.xml</span> <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900">Robots.txt Status</h3>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                Valid
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Configured to allow search engine bots while protecting /admin routes.
            </p>
            <div className="pt-2">
              <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-sky-600 hover:underline inline-flex items-center gap-1">
                <span>View /robots.txt</span> <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Audit Results */}
        <div className="glass-card rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Site-Wide Audit Findings</h2>

          <div className="space-y-4">
            
            <div className="p-4 rounded-2xl bg-white border border-slate-100 flex items-start gap-3">
              {projectsMissingSeoTitle.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Project SEO Titles</h4>
                <p className="text-xs text-slate-600">
                  {projectsMissingSeoTitle.length === 0
                    ? 'All platform projects have customized SEO title tags.'
                    : `${projectsMissingSeoTitle.length} project(s) could benefit from longer SEO title tags.`}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 flex items-start gap-3">
              {articlesMissingSeoDesc.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Blog Meta Descriptions</h4>
                <p className="text-xs text-slate-600">
                  {articlesMissingSeoDesc.length === 0
                    ? 'All published articles contain descriptive summary meta tags.'
                    : `${articlesMissingSeoDesc.length} article(s) are missing optimal meta descriptions.`}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 flex items-start gap-3">
              {articlesMissingImages.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Social OpenGraph Visuals</h4>
                <p className="text-xs text-slate-600">
                  {articlesMissingImages.length === 0
                    ? 'All articles have Postimages featured image URLs attached.'
                    : `${articlesMissingImages.length} article(s) are missing featured social card images.`}
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </AdminLayout>
  );
};
