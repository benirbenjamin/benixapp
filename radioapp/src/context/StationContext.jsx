import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client';

const StationContext = createContext(null);

export function StationProvider({ children, initialSlug, initialBundle = null, isCustomDomain = false }) {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const slug = initialSlug || params.slug;

  const [stationBundle, setStationBundle] = useState(initialBundle);
  const [loading, setLoading] = useState(!initialBundle);
  const [error, setError] = useState(null);

  // Audio player state
  const audioRef = useRef(null);
  const [activeStream, setActiveStream] = useState(() => {
    if (initialBundle?.streams?.length > 0) {
      return initialBundle.streams.find(s => s.is_default) || initialBundle.streams[0];
    }
    return null;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerStatus, setPlayerStatus] = useState('idle'); // 'idle' | 'connecting' | 'live' | 'error'
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  // Fetch station bundle
  const loadStation = async (targetSlug) => {
    // If bundle is already provided via custom domain and no explicit slug requested, use it
    if (initialBundle && !targetSlug) {
      setStationBundle(initialBundle);
      if (initialBundle.streams?.length > 0) {
        setActiveStream(initialBundle.streams.find(s => s.is_default) || initialBundle.streams[0]);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let endpoint = `/stations/${targetSlug}`;
      if (!targetSlug) {
        // Fetch default station
        const stationsList = await api.get('/stations');
        if (stationsList.length === 0) {
          throw new Error('No active radio stations found.');
        }
        const defaultStation = stationsList.find(s => s.is_default) || stationsList[0];
        endpoint = `/stations/${defaultStation.slug}`;
      }

      const data = await api.get(endpoint);
      setStationBundle(data);

      // Set default active stream
      if (data.streams && data.streams.length > 0) {
        const defaultStream = data.streams.find(s => s.is_default) || data.streams[0];
        setActiveStream(defaultStream);
      } else {
        setActiveStream(null);
      }
    } catch (err) {
      console.error('[StationContext] Failed to load station:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialBundle || slug) {
      loadStation(slug);
    }
  }, [slug, initialBundle]);

  // Visitor Session Management & Telemetry
  const getSessionId = () => {
    try {
      let sess = sessionStorage.getItem('radio_analytics_session_id');
      if (!sess) {
        sess = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        sessionStorage.setItem('radio_analytics_session_id', sess);
      }
      return sess;
    } catch {
      return `sess-${Date.now()}`;
    }
  };

  const getDeviceType = () => {
    const ua = navigator.userAgent || '';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) return 'Mobile';
    return 'Desktop';
  };

  const getTrafficSource = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const utm = urlParams.get('utm_source') || urlParams.get('ref') || urlParams.get('source');
      if (utm) return utm;
      return document.referrer || 'Direct';
    } catch {
      return 'Direct';
    }
  };

  // Register session & pageview on station load or route navigation
  useEffect(() => {
    const stationId = stationBundle?.station?.id;
    if (!stationId) return;

    const sessionId = getSessionId();
    api.post(`/stations/${stationId}/analytics/session`, {
      session_id: sessionId,
      traffic_source: getTrafficSource(),
      referrer: document.referrer || '',
      device_type: getDeviceType(),
      page_path: location.pathname,
    }).catch(() => {});
  }, [stationBundle?.station?.id, location.pathname]);

  // Periodic Heartbeat Ping (Time on site & Listening duration)
  useEffect(() => {
    const stationId = stationBundle?.station?.id;
    if (!stationId) return;

    const interval = setInterval(() => {
      // If tab is in background and not listening to audio, skip accumulating duration
      if (document.hidden && !isPlaying) return;

      const sessionId = getSessionId();
      api.post(`/stations/${stationId}/analytics/ping`, {
        session_id: sessionId,
        duration_increment: 20,
        is_listening: isPlaying,
        listening_increment: isPlaying ? 20 : 0,
      }).catch(() => {});
    }, 20000);

    return () => clearInterval(interval);
  }, [stationBundle?.station?.id, isPlaying]);

  // Audio element management
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;

    const handleWaiting = () => setPlayerStatus('connecting');
    const handlePlaying = () => {
      setPlayerStatus('live');
      setIsPlaying(true);
      if (stationBundle?.station?.id) {
        api.post(`/stations/${stationBundle.station.id}/analytics/event`, {
          event_type: 'play',
          event_data: { stream_id: activeStream?.id, stream_name: activeStream?.name }
        }).catch(() => {});
      }
    };
    const handlePause = () => {
      if (playerStatus !== 'connecting' && playerStatus !== 'error') {
        setPlayerStatus('idle');
      }
      setIsPlaying(false);
    };
    const handleError = () => {
      console.warn('[AudioPlayer] Stream error occurred.');
      setPlayerStatus('error');
      setIsPlaying(false);
      if (stationBundle?.station?.id) {
        api.post(`/stations/${stationBundle.station.id}/analytics/event`, {
          event_type: 'error',
          event_data: { stream_id: activeStream?.id, url: activeStream?.stream_url }
        }).catch(() => {});
      }
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [activeStream, volume, isMuted, stationBundle]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !activeStream) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setPlayerStatus('idle');
    } else {
      setPlayerStatus('connecting');
      // If audio src is different from current active stream, update it
      if (audio.src !== activeStream.stream_url) {
        audio.src = activeStream.stream_url;
        audio.load();
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlayerStatus('live');
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('[AudioPlayer] Autoplay prevented or stream unreachable:', err.message);
            setPlayerStatus('error');
            setIsPlaying(false);
          });
      }
    }
  };

  const changeStream = (stream) => {
    setActiveStream(stream);
    const audio = audioRef.current;
    if (audio) {
      audio.src = stream.stream_url;
      audio.load();
      if (isPlaying) {
        setPlayerStatus('connecting');
        audio.play().catch(() => setPlayerStatus('error'));
      }
    }
  };

  const retryPlayback = () => {
    const audio = audioRef.current;
    if (!audio || !activeStream) return;
    setPlayerStatus('connecting');
    audio.src = `${activeStream.stream_url}?t=${Date.now()}`;
    audio.load();
    audio.play()
      .then(() => {
        setPlayerStatus('live');
        setIsPlaying(true);
      })
      .catch(() => setPlayerStatus('error'));
  };

  const basePath = isCustomDomain
    ? ''
    : (stationBundle?.station?.slug ? `/station/${stationBundle.station.slug}` : (slug ? `/station/${slug}` : ''));

  return (
    <StationContext.Provider
      value={{
        stationBundle,
        station: stationBundle?.station,
        branding: stationBundle?.branding,
        streams: stationBundle?.streams || [],
        programs: stationBundle?.programs || [],
        nowOnAir: stationBundle?.nowOnAir,
        comingNext: stationBundle?.comingNext,
        news: stationBundle?.news || [],
        videos: stationBundle?.videos || [],
        sections: stationBundle?.sections,
        settings: stationBundle?.settings,
        activeStream,
        setActiveStream: changeStream,
        isPlaying,
        playerStatus,
        volume,
        setVolume,
        isMuted,
        setIsMuted,
        togglePlay,
        retryPlayback,
        loading,
        error,
        basePath,
        isCustomDomain,
        refreshStation: () => loadStation(slug)
      }}
    >
      {/* Persistent global audio element */}
      <audio ref={audioRef} preload="none" />
      {children}
    </StationContext.Provider>
  );
}

export function useStation() {
  const context = useContext(StationContext);
  if (!context) {
    throw new Error('useStation must be used within a StationProvider');
  }
  return context;
}
