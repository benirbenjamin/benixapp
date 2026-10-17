import React from 'react';
import { Video } from '../../types';

interface VideoPlayerProps {
  video: Video;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, className = '' }) => {
  return (
    <div className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      <iframe
        src={`${video.embed_url}?autoplay=1&rel=0&modestbranding=1`}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
};
