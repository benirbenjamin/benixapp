'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SongPart } from '../types/database.types';

export interface UseAudioPlayerReturn {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isLooping: boolean;
  loopStart: number;
  loopEnd: number;
  activePart: SongPart | null;
  togglePlay: () => void;
  seek: (time: number) => void;
  setSpeed: (rate: number) => void;
  setAudioVolume: (vol: number) => void;
  setLoopBounds: (start: number, end: number) => void;
  toggleLoop: () => void;
  selectPart: (part: SongPart | null) => void;
}

export function useAudioPlayer(parts: SongPart[] = []): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [activePart, setActivePart] = useState<SongPart | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  
  // A-B Loop Controls
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [loopStart, setLoopStart] = useState<number>(0);
  const [loopEnd, setLoopEnd] = useState<number>(0);

  // Auto select Full Mix or first available part on load
  useEffect(() => {
    if (parts.length > 0 && !activePart) {
      const fullMix = parts.find(p => p.part_name === 'Full Mix') || parts[0];
      setActivePart(fullMix);
    }
  }, [parts, activePart]);

  // Handle active audio track change
  useEffect(() => {
    if (!audioRef.current) return;
    if (activePart?.audio_url) {
      const wasPlaying = isPlaying;
      audioRef.current.src = activePart.audio_url;
      audioRef.current.load();
      if (wasPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [activePart]);

  // Sync time & enforce A-B loop boundary
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);

    // Enforce A-B loop jump
    if (isLooping && loopEnd > loopStart && time >= loopEnd) {
      audioRef.current.currentTime = loopStart;
    }
  }, [isLooping, loopStart, loopEnd]);

  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration || 0;
    setDuration(dur);
    if (loopEnd === 0) {
      setLoopEnd(dur);
    }
  }, [loopEnd]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [handleTimeUpdate, handleLoadedMetadata]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const setSpeed = (rate: number) => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const setAudioVolume = (vol: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = vol;
    setVolume(vol);
  };

  const setLoopBounds = (start: number, end: number) => {
    setLoopStart(start);
    setLoopEnd(end);
    if (currentTime < start || currentTime > end) {
      seek(start);
    }
  };

  const toggleLoop = () => {
    setIsLooping(prev => !prev);
  };

  const selectPart = (part: SongPart | null) => {
    setActivePart(part);
  };

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isLooping,
    loopStart,
    loopEnd,
    activePart,
    togglePlay,
    seek,
    setSpeed,
    setAudioVolume,
    setLoopBounds,
    toggleLoop,
    selectPart,
  };
}
