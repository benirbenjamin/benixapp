'use client';

import React, { useState } from 'react';
import { SongPart, LearningStatus } from '@/lib/types/database.types';
import { useAudioPlayer } from '@/lib/hooks/useAudioPlayer';
import { formatAudioTime } from '@/lib/utils/audioUtils';
import { Play, Pause, Repeat, Volume2, Music, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface AudioPracticePlayerProps {
  parts: SongPart[];
  songTitle: string;
  composer?: string | null;
  onStatusChange?: (partName: string, status: LearningStatus) => void;
  initialStatusMap?: Record<string, LearningStatus>;
}

export const AudioPracticePlayer: React.FC<AudioPracticePlayerProps> = ({
  parts,
  songTitle,
  composer,
  onStatusChange,
  initialStatusMap = {},
}) => {
  const {
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
  } = useAudioPlayer(parts);

  const [partStatuses, setPartStatuses] = useState<Record<string, LearningStatus>>(initialStatusMap);
  const [showLoopSettings, setShowLoopSettings] = useState(false);
  const [tempStart, setTempStart] = useState<number>(0);
  const [tempEnd, setTempEnd] = useState<number>(duration || 60);

  const currentPartName = activePart?.part_name || 'Full Mix';
  const currentStatus = partStatuses[currentPartName] || 'not_started';

  const handleStatusToggle = (newStatus: LearningStatus) => {
    setPartStatuses(prev => ({ ...prev, [currentPartName]: newStatus }));
    if (onStatusChange) {
      onStatusChange(currentPartName, newStatus);
    }
  };

  const applyLoop = () => {
    setLoopBounds(tempStart, tempEnd);
    if (!isLooping) toggleLoop();
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
      {/* Hidden HTML5 Audio Element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Header Info & Logo Icon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-blue-200 dark:border-blue-800">
              <Sparkles className="w-3.5 h-3.5" /> Practice Mode
            </span>
            <span className="text-slate-400 text-xs">Voxify Audio Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{songTitle}</h2>
          {composer && <p className="text-slate-500 dark:text-slate-400 text-sm">Composer: {composer}</p>}
        </div>

        {/* Voice Part Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {parts.map(part => {
            const isActive = activePart?.id === part.id;
            return (
              <button
                key={part.id}
                onClick={() => selectPart(part)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Music className="w-4 h-4" />
                {part.part_name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress Waveform / Scrub Bar */}
      <div className="space-y-2">
        <div className="relative group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={e => seek(Number(e.target.value))}
            className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          {/* Loop Region Highlight Overlay */}
          {isLooping && duration > 0 && (
            <div
              className="absolute top-0 h-3 bg-blue-500/30 rounded-lg pointer-events-none"
              style={{
                left: `${(loopStart / duration) * 100}%`,
                width: `${((loopEnd - loopStart) / duration) * 100}%`,
              }}
            />
          )}
        </div>
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
        {/* Play/Pause Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 hover:scale-105 active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </button>

          {/* Speed Preset Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {[0.5, 0.75, 1.0, 1.25, 1.5].map(rate => (
              <button
                key={rate}
                onClick={() => setSpeed(rate)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  playbackRate === rate
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* A-B Loop Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLoop}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              isLooping
                ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Repeat className="w-4 h-4" />
            {isLooping ? 'Loop ON' : 'Loop OFF'}
          </button>

          <button
            onClick={() => setShowLoopSettings(prev => !prev)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Set Segment A-B
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 w-32">
          <Volume2 className="w-4 h-4 text-slate-400" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={e => setAudioVolume(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>

      {/* Expandable A-B Loop Settings Panel */}
      {showLoopSettings && (
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">A-B Segment Repeat Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400">Start (A): {formatAudioTime(tempStart)}</label>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={tempStart}
                onChange={e => setTempStart(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400">End (B): {formatAudioTime(tempEnd)}</label>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={tempEnd}
                onChange={e => setTempEnd(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
          <button
            onClick={applyLoop}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl font-bold"
          >
            Set Loop Region ({formatAudioTime(tempStart)} → {formatAudioTime(tempEnd)})
          </button>
        </div>
      )}

      {/* Member Readiness Status Selector */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          My Status for <strong className="text-blue-600 dark:text-blue-400">{currentPartName}</strong>:
        </span>
        <div className="flex items-center gap-2">
          {(['not_started', 'learning', 'ready'] as LearningStatus[]).map(status => {
            const isSelected = currentStatus === status;
            const labels = {
              not_started: { text: 'Not Started', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
              learning: { text: '🟡 Learning', color: 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30' },
              ready: { text: '🟢 Ready for Worship', color: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' },
            };
            return (
              <button
                key={status}
                onClick={() => handleStatusToggle(status)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? `${labels[status].color} shadow-sm scale-105`
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {labels[status].text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
