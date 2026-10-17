import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { AdSenseUnit } from '../components/common/AdSenseUnit';
import { fetchProjectBySlug, fetchProjects } from '../services/api';
import { trackPageView, trackProjectClick } from '../analytics/tracker';
import { Project } from '../types';
import { getProjectImageUrl } from '../utils/images';
import { ExternalLink, ArrowLeft, Layers, Monitor, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEmbed, setShowEmbed] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function loadProjectData() {
      setLoading(true);
      try {
        const data = await fetchProjectBySlug(slug as string);
        setProject(data);
        trackPageView(window.location.href, 'project', data.id);

        // Fetch related platforms
        const allProjects = await fetchProjects();
        const related = allProjects.filter((p) => p.id !== data.id && p.slug !== data.slug).slice(0, 3);
        setRelatedProjects(related);
      } catch (err: any) {
        setError('Project not found or invalid URL.');
      } finally {
        setLoading(false);
      }
    }
    loadProjectData();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-20 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-50 py-20 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h1 className="text-2xl font-bold text-slate-900">Project Not Found</h1>
        <p className="text-slate-600 text-sm">The requested platform does not exist or has been moved.</p>
        <Link to="/projects" className="px-6 py-2.5 rounded-full bg-sky-600 text-white font-semibold text-sm">
          Return to Projects Portfolio
        </Link>
      </div>
    );
  }

  const tags: string[] = typeof project.tags === 'string'
    ? JSON.parse(project.tags || '[]')
    : (project.tags || []);

  const technologies: string[] = typeof project.technologies === 'string'
    ? JSON.parse(project.technologies || '[]')
    : (project.technologies || []);

  const handleVisit = () => {
    trackProjectClick(project.id, project.url);
    window.open(project.url, '_blank', 'noopener,noreferrer');
  };

  const schemaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.name,
    operatingSystem: 'All',
    applicationCategory: 'WebApplication',
    url: project.url,
    description: project.short_description,
    author: {
      '@type': 'Organization',
      name: 'NebeluRw Co. Ltd'
    }
  };

  return (
    <>
      <SeoHead
        title={project.seo_title || `${project.name} — NebeluRw Platform Showcase`}
        description={project.seo_description || project.short_description}
        keywords={project.seo_keywords || `${project.name}, NebeluRw, BenixSpace, Rwanda web app`}
        ogImage={project.og_image_url || project.image_url}
        schemaJsonLd={schemaJsonLd}
      />

      <div className="bg-slate-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Back Button */}
          <div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-600 font-semibold text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Projects</span>
            </Link>
          </div>

          {/* Header Banner */}
          <div className="glass-card rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-6 bg-white">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3.5 py-1 rounded-full border border-sky-100">
                    {project.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">NebeluRw Ecosystem</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                  {project.name}
                </h1>
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                  {project.short_description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <button
                  onClick={handleVisit}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all"
                >
                  <span>Visit Platform</span>
                  <ExternalLink className="w-4 h-4" />
                </button>

                {(project.embed_mode === 'embed' || project.embed_mode === 'both') && (
                  <button
                    onClick={() => setShowEmbed(!showEmbed)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-all"
                  >
                    <Monitor className="w-4 h-4 text-sky-600" />
                    <span>{showEmbed ? 'Close Live Preview' : 'Live Embed Preview'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tech Badges */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Built With:
              </span>
              {technologies.map((tech, idx) => (
                <span key={idx} className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Embedded Live Preview Modal/Container */}
          {showEmbed && (
            <div className="glass-card rounded-3xl p-4 border border-slate-200 shadow-2xl space-y-3 bg-white">
              <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-500">
                <span>Interactive Live Preview: {project.url}</span>
                <span className="text-sky-600">Secure Sandboxed View</span>
              </div>
              <div className="h-[600px] w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 relative">
                {iframeError ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-900 text-white space-y-4">
                    <AlertCircle className="w-10 h-10 text-amber-400" />
                    <h3 className="text-lg font-bold">Direct Embedding Restricted</h3>
                    <p className="text-slate-400 text-sm max-w-md">
                      This platform enforces strict browser security (X-Frame-Options / Content-Security-Policy). You can open it directly in a new browser window.
                    </p>
                    <button onClick={handleVisit} className="px-6 py-2.5 rounded-full bg-sky-500 text-slate-950 font-bold text-sm">
                      Open Website in New Tab
                    </button>
                  </div>
                ) : (
                  <iframe
                    src={project.url}
                    title={project.name}
                    className="w-full h-full border-0"
                    onError={() => setIframeError(true)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Main Visual Frame */}
          <div className="rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl relative">
            <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs text-slate-400 font-mono ml-2">{project.url}</span>
            </div>
            <img
              src={getProjectImageUrl(project)}
              alt={project.name}
              className="w-full h-auto max-h-[500px] object-cover object-top"
            />
          </div>

          {/* AdSense Unit */}
          <div className="my-6">
            <AdSenseUnit className="w-full" />
          </div>

          {/* Detailed Description */}
          <div className="glass-card rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-6 bg-white">
            <h2 className="text-2xl font-bold text-slate-900">About {project.name}</h2>
            <div className="prose max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
              {project.full_description || project.short_description}
            </div>

            {tags.length > 0 && (
              <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <span key={idx} className="text-xs font-medium bg-sky-50 text-sky-700 px-3 py-1 rounded-full border border-sky-100">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* YOU MAY ALSO LIKE (RELATED PLATFORMS) */}
          {relatedProjects.length > 0 && (
            <div className="space-y-6 pt-6">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <Sparkles className="w-5 h-5 text-sky-600" />
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">You May Also Like</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {relatedProjects.map((rel) => (
                  <div key={rel.id} className="glass-card rounded-3xl overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all group bg-white flex flex-col justify-between">
                    <div>
                      <div className="h-44 overflow-hidden bg-slate-900">
                        <img
                          src={rel.image_url || 'https://i.postimg.cc/85zP6mK2/benix-tv-cover.jpg'}
                          alt={rel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-5 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                          {rel.category}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-lg group-hover:text-sky-600 transition-colors">
                          <Link to={`/projects/${rel.slug}`}>{rel.name}</Link>
                        </h4>
                        <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                          {rel.short_description}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <Link
                        to={`/projects/${rel.slug}`}
                        className="inline-flex items-center gap-1.5 text-sky-600 font-bold text-xs hover:text-sky-700"
                      >
                        <span>View Platform Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};
