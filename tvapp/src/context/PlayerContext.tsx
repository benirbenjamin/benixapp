import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Station } from '../types';
import { trackEvent } from '../services/api';

interface PlayerContextType {
  // Radio State
  currentStation: Station | null;
  isPlaying: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  volume: number;
  isMuted: boolean;
  error: string | null;
  isExpanded: boolean;
  playStation: (station: Station) => void;
  pauseStation: () => void;
  togglePlay: () => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  retryPlayback: () => void;
  stopStation: () => void;
  setIsExpanded: (expanded: boolean) => void;

  // TV & Picture-in-Picture State
  activeTvStation: Station | null;
  isTvPlaying: boolean;
  isTvMuted: boolean;
  isTvPipDismissed: boolean;
  hasTvStarted: boolean;
  playTv: (station: Station) => void;
  pauseTv: () => void;
  toggleTvPlay: () => void;
  toggleTvMute: () => void;
  setTvMuted: (muted: boolean) => void;
  closeTvPip: () => void;
  setActiveTvStation: (station: Station) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Radio State
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // TV & Picture-in-Picture State
  const [activeTvStation, setActiveTvStation] = useState<Station | null>(null);
  const [isTvPlaying, setIsTvPlaying] = useState<boolean>(false);
  // Starts unmuted as requested by user
  const [isTvMuted, setIsTvMuted] = useState<boolean>(false);
  const [isTvPipDismissed, setIsTvPipDismissed] = useState<boolean>(false);
  const [hasTvStarted, setHasTvStarted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.volume = volume;
    audioRef.current = audio;

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      setIsBuffering(false);
      setError(null);
    };
    const handlePlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setIsBuffering(false);
      setError(null);
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = (e: any) => {
      console.warn('Audio playback error:', e);
      setIsLoading(false);
      setIsBuffering(false);
      setIsPlaying(false);
      setError('Live stream temporarily unavailable. Click retry to reconnect.');
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Radio Controls
  const playStation = (station: Station) => {
    // Crucial requirement: When a radio is played, pause any active TV broadcast!
    if (isTvPlaying) {
      setIsTvPlaying(false);
    }

    if (!audioRef.current) return;

    if (currentStation?.id === station.id && isPlaying) {
      return;
    }

    audioRef.current.pause();
    setError(null);
    setIsLoading(true);
    setIsBuffering(false);
    setCurrentStation(station);

    let streamUrl = station.stream_url.trim();

    // Auto-format Shoutcast streams (e.g. http://ip:port/ -> http://ip:port/;stream.mp3)
    if (/:\d+\/?$/.test(streamUrl) && !streamUrl.endsWith(';') && !streamUrl.endsWith('.mp3')) {
      streamUrl = streamUrl.endsWith('/') ? `${streamUrl};stream.mp3` : `${streamUrl}/;stream.mp3`;
    }

    // Automatic Mixed Content Proxy:
    // If site is loaded over HTTPS and station stream is HTTP, route through backend audio proxy
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && streamUrl.startsWith('http:')) {
      streamUrl = `/api/stations/proxy-stream?url=${encodeURIComponent(streamUrl)}`;
    } else {
      streamUrl = streamUrl.includes('?')
        ? `${streamUrl}&_t=${Date.now()}`
        : `${streamUrl}?_t=${Date.now()}`;
    }

    audioRef.current.src = streamUrl;
    audioRef.current.load();

    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          trackEvent({
            event_type: 'RADIO_PLAY',
            station_id: station.id,
          });
        })
        .catch((err) => {
          console.warn('Audio play error:', err);
          setIsLoading(false);
          setIsPlaying(false);
          if (err.name === 'NotAllowedError') {
            setError('Click play to allow audio in your browser.');
          } else {
            setError('Unable to connect to live radio stream. Try again.');
          }
        });
    }
  };

  const pauseStation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (currentStation) {
        trackEvent({
          event_type: 'RADIO_STOP',
          station_id: currentStation.id,
        });
      }
    }
  };

  const togglePlay = () => {
    if (!currentStation) return;
    if (isPlaying) {
      pauseStation();
    } else {
      if (error) {
        retryPlayback();
      } else if (audioRef.current) {
        // Pause TV if playing
        if (isTvPlaying) setIsTvPlaying(false);
        audioRef.current.play().catch(() => retryPlayback());
      }
    }
  };

  const retryPlayback = () => {
    if (currentStation) playStation(currentStation);
  };

  const stopStation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
    setCurrentStation(null);
    setIsExpanded(false);
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      audioRef.current.muted = clamped === 0;
    }
    setIsMuted(clamped === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    audioRef.current.muted = newMute;
  };

  // TV & Picture-in-Picture Controls
  const playTv = (station: Station) => {
    // When TV is played, pause any active radio stream
    if (isPlaying) {
      pauseStation();
    }

    setActiveTvStation(station);
    setIsTvPlaying(true);
    setIsTvPipDismissed(false);
    setHasTvStarted(true);
  };

  const pauseTv = () => {
    setIsTvPlaying(false);
  };

  const toggleTvPlay = () => {
    if (isTvPlaying) {
      pauseTv();
    } else if (activeTvStation) {
      playTv(activeTvStation);
    }
  };

  const toggleTvMute = () => {
    setIsTvMuted((prev) => !prev);
  };

  const setTvMuted = (muted: boolean) => {
    setIsTvMuted(muted);
  };

  const closeTvPip = () => {
    setIsTvPipDismissed(true);
    setIsTvPlaying(false);
    setHasTvStarted(false);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentStation,
        isPlaying,
        isLoading,
        isBuffering,
        volume,
        isMuted,
        error,
        isExpanded,
        playStation,
        pauseStation,
        togglePlay,
        setVolume,
        toggleMute,
        retryPlayback,
        stopStation,
        setIsExpanded,

        // TV
        activeTvStation,
        isTvPlaying,
        isTvMuted,
        isTvPipDismissed,
        hasTvStarted,
        playTv,
        pauseTv,
        toggleTvPlay,
        toggleTvMute,
        setTvMuted,
        closeTvPip,
        setActiveTvStation,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
