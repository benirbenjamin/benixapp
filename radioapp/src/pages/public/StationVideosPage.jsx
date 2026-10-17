import React, { useState } from 'react';
import { useStation } from '../../context/StationContext';
import { ThemeProvider } from '../../components/themes/ThemeProvider';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { PersistentPlayerBar } from '../../components/player/PersistentPlayerBar';
import { Video, Play, X } from 'lucide-react';

export function StationVideosPage() {
  const { station, branding, videos } = useStation();
  const [selectedVideo, setSelectedVideo] = useState(null);

  const activeVideos = videos.filter(v => v.status === 'active');

  return (
    <ThemeProvider branding={branding}>
      <div className="min-h-screen flex flex-col justify-between">
        <div>
          <PublicNavbar />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
            
            {/* Page Header */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-color)]">
                Video Highlights
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-color)] tracking-tight">
                Studio Sessions & Interviews
              </h1>
              <p className="text-sm sm:text-base text-[var(--muted-color)]">
                Watch behind-the-scenes clips, live acoustic performances, and studio guest panels.
              </p>
            </div>

            {/* Videos Grid */}
            {activeVideos.length === 0 ? (
              <div className="text-center py-20 rounded-3xl bg-[var(--surface-color)] border border-slate-200 p-8">
                <Video className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[var(--text-color)]">No videos published yet</h3>
                <p className="text-xs text-[var(--muted-color)] mt-1">Check back soon for latest studio video recordings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className="group rounded-3xl overflow-hidden bg-[var(--surface-color)] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
                    onClick={() => setSelectedVideo(vid)}
                  >
                    <div>
                      {/* Video Thumbnail with Play Button Overlay */}
                      <div className="aspect-video w-full overflow-hidden bg-slate-900 relative">
                        <img
                          src={`https://img.youtube.com/vi/${vid.video_id}/hqdefault.jpg`}
                          alt={vid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-red-600 group-hover:bg-red-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            <Play className="w-6 h-6 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-2">
                        <h3 className="font-extrabold text-base text-[var(--text-color)] group-hover:text-[var(--primary-color)] transition-colors line-clamp-2">
                          {vid.title}
                        </h3>
                        {vid.description && (
                          <p className="text-xs text-[var(--muted-color)] line-clamp-2 leading-relaxed">
                            {vid.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary-color)]">
                        <span>Watch Video</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Modal Player */}
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
              
              <div className="p-4 flex items-center justify-between border-b border-slate-800 text-white">
                <h4 className="font-extrabold text-sm sm:text-base truncate max-w-xl">{selectedVideo.title}</h4>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-video w-full bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.video_id}?autoplay=1`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                ></iframe>
              </div>

              {selectedVideo.description && (
                <div className="p-4 bg-slate-950 text-xs text-slate-400">
                  {selectedVideo.description}
                </div>
              )}

            </div>
          </div>
        )}

        <PublicFooter />
        <PersistentPlayerBar />
      </div>
    </ThemeProvider>
  );
}
