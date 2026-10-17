import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Eye,
  Share2,
  ArrowLeft,
  Tv,
  Check,
  Tag,
  Clock,
} from 'lucide-react';
import { Video } from '../types';
import { getVideoDetail, trackEvent } from '../services/api';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { VideoCard } from '../components/video/VideoCard';
import { SEO } from '../components/common/SEO';
import { AdSenseBanner } from '../components/ads/AdSenseBanner';
import { InContentAdBanner } from '../components/ads/InContentAdBanner';
import { ADS_CONFIG } from '../config/ads';

export const VideoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getVideoDetail(id);
        setVideo(data.video);
        setRelatedVideos(data.relatedVideos || []);

        // Track video view
        trackEvent({
          event_type: 'VIDEO_VIEW',
          video_id: data.video.id,
        });
      } catch (err) {
        console.error('Failed to load video:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
    window.scrollTo(0, 0);
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-rba-blue border-t-transparent" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Tv className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Video Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">The requested video may have been moved or unpublished.</p>
        <Link to="/tv" className="px-5 py-2.5 rounded-xl bg-rba-navy text-white font-bold text-sm">
          Return to TV & Videos
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(video.publication_date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-rba-grayBg pb-20">
      <SEO
        title={video.title}
        description={video.description || 'Watch official RTV Rwanda video.'}
        ogImage={video.thumbnail_url}
        ogType="video.other"
      />

      {/* Top Breadcrumb Bar */}
      <div className="bg-rba-navy text-white py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/tv"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Videos & TV
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-10">
        {/* Main Video Player Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden p-4 sm:p-6 lg:p-8">
          
          <div className="max-w-5xl mx-auto mb-6">
            <VideoPlayer video={video} />
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Category & Share Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {video.category_name && (
                  <span className="px-3 py-1 rounded-lg bg-rba-blue/10 text-rba-blue font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {video.category_name}
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>{(video.views_count || 0).toLocaleString()} views</span>
                </div>

                <button
                  onClick={handleShare}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  <span>{copied ? 'Link Copied!' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* Title & Description */}
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight mb-4">
              {video.title}
            </h1>

            {video.description && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {video.description}
              </div>
            )}
          </div>

        </div>

        {/* Video Watch Companion Ad Banner (Auto-refreshes periodically without interrupting video) */}
        <div className="max-w-5xl mx-auto">
          <AdSenseBanner
            slot={ADS_CONFIG.SLOTS.TV_COMPANION_BANNER}
            format="horizontal"
            responsive={true}
            refreshInterval={ADS_CONFIG.TV_BANNER_REFRESH_SECONDS}
            label="Video Broadcast Sponsor"
          />
        </div>

        {/* Related & More Videos */}
        {relatedVideos.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900">More Videos from RTV</h2>
              <Link to="/tv" className="text-xs font-bold text-rba-blue hover:underline">
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {relatedVideos.map((item) => (
                <VideoCard key={item.id} video={item} />
              ))}
            </div>
          </section>
        )}

        {/* In-content sponsor banner */}
        <div className="max-w-5xl mx-auto">
          <InContentAdBanner sponsorIndex={4} label="Video Sponsored Partner" />
        </div>

      </div>
    </div>
  );
};
