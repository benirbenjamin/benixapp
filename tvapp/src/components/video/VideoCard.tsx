import React from 'react';
import { Play, Calendar, Eye, Clock } from 'lucide-react';
import { Video } from '../../types';
import { Link } from 'react-router-dom';

interface VideoCardProps {
  video: Video;
  featured?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, featured = false }) => {
  const formattedDate = new Date(video.publication_date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Link
      to={`/tv/${video.slug || video.id}`}
      className={`group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col ${
        featured ? 'md:col-span-2' : ''
      }`}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
        <img
          src={video.thumbnail_url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80'}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Hover Play Icon Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-rba-blue text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </div>
        </div>

        {/* Category Pill */}
        {video.category_name && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-rba-navy/90 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-wider">
            {video.category_name}
          </span>
        )}

        {/* Platform Badge (e.g. YouTube) */}
        {video.platform === 'youtube' && (
          <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-white text-[10px] font-semibold">
            YouTube
          </span>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-rba-blue transition-colors line-clamp-2 leading-snug">
            {video.title}
          </h3>
          {video.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>

        {/* Metadata Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            <span>{(video.views_count || 0).toLocaleString()} views</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
