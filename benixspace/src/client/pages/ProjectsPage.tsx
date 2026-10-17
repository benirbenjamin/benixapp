import React, { useEffect, useState } from 'react';
import { ProjectCard3D } from '../components/projects/ProjectCard3D';
import { SeoHead } from '../components/common/SeoHead';
import { AdSenseUnit } from '../components/common/AdSenseUnit';
import { fetchProjects } from '../services/api';
import { trackPageView } from '../analytics/tracker';
import { Project } from '../types';
import { Search, Filter, SlidersHorizontal, Layers } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTech, setSelectedTech] = useState('All');

  const categories = ['All', 'Streaming & Media', 'Gaming & Entertainment', 'Utility & Tools', 'Music Ecosystem'];
  const technologies = ['All', 'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'HTML5 Canvas', 'Web Audio API'];

  useEffect(() => {
    trackPageView(window.location.href, 'projects');
    async function loadProjects() {
      try {
        const data = await fetchProjects();
        setProjects(data);
        setFilteredProjects(data);
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    let result = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.short_description.toLowerCase().includes(q) ||
          (p.technologies && p.technologies.toString().toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (selectedTech !== 'All') {
      result = result.filter((p) => {
        const techArr: string[] = typeof p.technologies === 'string'
          ? JSON.parse(p.technologies || '[]')
          : (p.technologies || []);
        return techArr.includes(selectedTech);
      });
    }

    setFilteredProjects(result);
  }, [searchQuery, selectedCategory, selectedTech, projects]);

  return (
    <>
      <SeoHead
        title="Project Portfolio — BenixSpace & NebeluRw Co. Ltd"
        description="Explore digital platforms developed by NebeluRw Co. Ltd including Benix Space TV, Benix Games, Easy Calc, Benix Radio, and Voxify."
      />

      <div className="bg-slate-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-100/80 px-4 py-1.5 rounded-full border border-sky-200">
              NebeluRw Portfolio
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Our Digital Platforms & Products
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Discover web applications, streaming platforms, calculators, and media portals engineered by NebeluRw Co. Ltd.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-6">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name, description, or technology..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Category:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-500/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Technology Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Tech Stack:
              </span>
              {technologies.map((tech) => (
                <button
                  key={tech}
                  onClick={() => setSelectedTech(tech)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedTech === tech
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>

          </div>

          {/* Results Count & Grid */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-2">
            <span>Showing {filteredProjects.length} platforms</span>
            {(selectedCategory !== 'All' || selectedTech !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedTech('All');
                  setSearchQuery('');
                }}
                className="text-sky-600 font-bold hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="glass-card rounded-3xl p-6 h-96 animate-pulse bg-slate-200/50" />
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-3xl space-y-3">
              <p className="text-slate-700 font-bold text-lg">No projects match your search criteria.</p>
              <p className="text-slate-500 text-sm">Try clearing filters or searching for different keywords.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map((project, index) => (
                  <React.Fragment key={project.id}>
                    <ProjectCard3D project={project} />

                    {/* In-Feed Ad Unit every 3 project cards */}
                    {index % 3 === 2 && index !== filteredProjects.length - 1 && (
                      <div className="glass-card rounded-3xl p-4 border border-slate-200/80 flex items-center justify-center col-span-1 md:col-span-2 lg:col-span-3 my-4">
                        <AdSenseUnit format="fluid" layoutKey="-6t+ed+2i-1n-4x" className="w-full" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Bottom Scroll Banner Ad */}
              <div className="pt-8">
                <AdSenseUnit className="w-full" />
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
};
