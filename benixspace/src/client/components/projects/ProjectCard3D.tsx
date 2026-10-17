import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Info, Sparkles, Layers } from 'lucide-react';
import { getProjectImageUrl } from '../../utils/images';

interface ProjectCard3DProps {
  project: Project;
}

export const ProjectCard3D: React.FC<ProjectCard3DProps> = ({ project }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const rX = ((mouseY / height) - 0.5) * -16;
    const rY = ((mouseX / width) - 0.5) * 16;

    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const handleVisitClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trackProjectClick(project.id, project.url);
    window.open(project.url, '_blank', 'noopener,noreferrer');
  };

  const tags: string[] = typeof project.tags === 'string'
    ? JSON.parse(project.tags || '[]')
    : (project.tags || []);

  const technologies: string[] = typeof project.technologies === 'string'
    ? JSON.parse(project.technologies || '[]')
    : (project.technologies || []);

  return (
    <Link
      to={`/projects/${project.slug}`}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="perspective-1000 group cursor-pointer block"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div
        className="glass-card rounded-3xl p-6 transition-all duration-200 ease-out border border-slate-200/80 shadow-3d hover:shadow-3d-hover relative overflow-hidden h-full flex flex-col justify-between"
        style={{
          transform: isHovered
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(12px)`
            : 'rotateX(0deg) rotateY(0deg) translateZ(0px)',
        }}
      >
        <div>
          {/* Subtle top light reflection sheen on hover */}
          {isHovered && (
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none transition-opacity duration-300" />
          )}

          {/* Featured Badge */}
          {project.featured && (
            <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-sky-500 to-sky-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3" />
              <span>Featured</span>
            </div>
          )}

          {/* Browser Mockup Image Frame */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-inner group-hover:scale-[1.02] transition-transform duration-300">
            <div className="bg-slate-800/90 px-3 py-2 flex items-center gap-1.5 border-b border-slate-700/50">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              <span className="text-[10px] text-slate-400 font-mono ml-2 truncate max-w-[180px]">
                {project.url.replace('https://', '')}
              </span>
            </div>

            <div className="h-44 sm:h-48 w-full overflow-hidden bg-slate-900 relative">
              <img
                src={getProjectImageUrl(project)}
                alt={project.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-60" />
            </div>
          </div>

          {/* Project Meta Details */}
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-3 py-0.5 rounded-full border border-sky-100">
                {project.category}
              </span>
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                {technologies[0] || 'Web Platform'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
              {project.name}
            </h3>

            <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
              {project.short_description}
            </p>

            <div className="flex flex-wrap gap-1 pt-1">
              {technologies.slice(0, 3).map((tech, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 mt-4 flex items-center justify-between gap-3 border-t border-slate-100">
          <span className="inline-flex items-center gap-1 text-sky-600 font-semibold text-xs group-hover:underline">
            <Info className="w-3.5 h-3.5" />
            <span>View Details</span>
          </span>

          <button
            onClick={handleVisitClick}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white font-semibold text-xs shadow-sm shadow-sky-500/20 hover:shadow-sky-500/35 transition-all transform active:scale-95"
          >
            <span>Visit Platform</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </Link>
  );
};
