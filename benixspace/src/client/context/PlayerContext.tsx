import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Station } from '../services/mediaService';

interface PlayerContextType {
  // Radio State & Methods
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

  // Radio Ad State & Controls
  showRadioAd: boolean;
  pendingRadioStation: Station | null;
  closeRadioAdAndPlay: () => void;
  cancelRadioAd: () => void;

  // TV & Picture-in-Picture State & Methods
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
  
  // TV Ad State
  showTvAd: boolean;
  dismissTvAd: () => void;
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

  // Radio Ad State
  const [showRadioAd, setShowRadioAd] = useState<boolean>(false);
  const [pendingRadioStation, setPendingRadioStation] = useState<Station | null>(null);

  // TV & Picture-in-Picture State
  const [activeTvStation, setActiveTvStation] = useState<Station | null>(null);
  const [isTvPlaying, setIsTvPlaying] = useState<boolean>(false);
  const [isTvMuted, setIsTvMuted] = useState<boolean>(false);
  const [isTvPipDismissed, setIsTvPipDismissed] = useState<boolean>(false);
  const [hasTvStarted, setHasTvStarted] = useState<boolean>(false);
  const [showTvAd, setShowTvAd] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize background HTML5 audio element
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
      setError('Live stream temporarily unavailable. Reconnecting...');
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

  // Actual radio audio playback execution (called after Ad completes or if ad skipped)
  const executeAudioPlay = (station: Station) => {
    if (isTvPlaying) {
      setIsTvPlaying(false);
    }

    if (!audioRef.current) return;

    audioRef.current.pause();
    setError(null);
    setIsLoading(true);
    setIsBuffering(false);
    setCurrentStation(station);

    let streamUrl = (station.stream_url || station.streamUrl || '').trim();
    if (!streamUrl) return;

    // Auto-format Shoutcast / Icecast streams if needed
    if (/:\d+\/?$/.test(streamUrl) && !streamUrl.endsWith(';') && !streamUrl.endsWith('.mp3')) {
      streamUrl = streamUrl.endsWith('/') ? `${streamUrl};stream.mp3` : `${streamUrl}/;stream.mp3`;
    }

    // Cache busting
    streamUrl = streamUrl.includes('?') ? `${streamUrl}&_t=${Date.now()}` : `${streamUrl}?_t=${Date.now()}`;

    audioRef.current.src = streamUrl;
    audioRef.current.load();

    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn('Audio play error:', err);
          setIsLoading(false);
          setIsPlaying(false);
          if (err.name === 'NotAllowedError') {
            setError('Click play to allow audio playback.');
          } else {
            setError('Unable to connect to live radio stream. Click retry.');
          }
        });
    }
  };

  // User requests to play a station -> triggers Radio Ad modal first
  const playStation = (station: Station) => {
    // If same station is already playing, do not show ad again
    if (currentStation?.id === station.id && isPlaying) {
      return;
    }

    // Pause TV if playing
    if (isTvPlaying) {
      setIsTvPlaying(false);
    }

    setPendingRadioStation(station);
    setShowRadioAd(true);
  };

  const closeRadioAdAndPlay = () => {
    setShowRadioAd(false);
    if (pendingRadioStation) {
      executeAudioPlay(pendingRadioStation);
      setPendingRadioStation(null);
    }
  };

  const cancelRadioAd = () => {
    setShowRadioAd(false);
    setPendingRadioStation(null);
  };

  const pauseStation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
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
        if (isTvPlaying) setIsTvPlaying(false);
        audioRef.current.play().catch(() => retryPlayback());
      }
    }
  };

  const retryPlayback = () => {
    if (currentStation) executeAudioPlay(currentStation);
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
    // When TV is played, pause background radio
    if (isPlaying) {
      pauseStation();
    }

    setActiveTvStation(station);
    setIsTvPlaying(true);
    setIsTvPipDismissed(false);
    setHasTvStarted(true);
    // Show TV sponsor video ad overlay on play
    setShowTvAd(true);
  };

  const pauseTv = () => {
    setIsTvPlaying(false);
  };

  const toggleTvPlay = () => {
    if (isTvPlaying) {
      pauseTv();
    } else if (activeTvStation) {
      if (isPlaying) pauseStation();
      setIsTvPlaying(true);
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
  };

  const dismissTvAd = () => {
    setShowTvAd(false);
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

        showRadioAd,
        pendingRadioStation,
        closeRadioAdAndPlay,
        cancelRadioAd,

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

        showTvAd,
        dismissTvAd
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
