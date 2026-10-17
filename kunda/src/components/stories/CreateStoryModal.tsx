import React, { useState, useRef } from 'react';
import { X, Upload, Video, Image as ImageIcon, Scissors, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';
import { compressImage, getVideoMetadata, calculateWhatsAppSegments, trimVideoClientSide, VideoCutSegment } from '../../lib/compression';
import { api } from '../../lib/api';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: () => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ isOpen, onClose, onStoryCreated }) => {
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [duration, setDuration] = useState<number>(5);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressionStats, setCompressionStats] = useState<{ original: string; compressed: string; saved: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // WhatsApp Auto-Cut state for videos > 45 seconds
  const [videoSegments, setVideoSegments] = useState<VideoCutSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<VideoCutSegment | null>(null);
  const [isTrimming, setIsTrimming] = useState<boolean>(false);
  const [trimProgress, setTrimProgress] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setCompressionStats(null);
    setVideoSegments([]);
    setSelectedSegment(null);

    const isVid = file.type.startsWith('video/');
    setMediaType(isVid ? 'video' : 'image');
    setSelectedFile(file);

    if (isVid) {
      try {
        setIsCompressing(true);
        const meta = await getVideoMetadata(file);
        setDuration(Math.min(45, Math.round(meta.duration)));
        setPreviewUrl(meta.url);

        // If video is longer than 45 seconds, generate 45-second clips
        if (meta.duration > 45.0) {
          const segments = calculateWhatsAppSegments(meta.duration, 45);
          setVideoSegments(segments);
          setSelectedSegment(segments[0]); // default to first 45s segment
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Could not load video preview');
      } finally {
        setIsCompressing(false);
      }
    } else {
      // Image: compress quickly
      try {
        setIsCompressing(true);
        const compressed = await compressImage(file, 1080, 1920, 0.75);
        setPreviewUrl(compressed.dataUrl);
        setDuration(5);
        setCompressionStats({
          original: compressed.formattedOriginal,
          compressed: compressed.formattedCompressed,
          saved: compressed.savedPercent,
        });
      } catch (err: any) {
        setErrorMessage(err.message || 'Image compression failed');
        setPreviewUrl(URL.createObjectURL(file));
      } finally {
        setIsCompressing(false);
      }
    }
  };

  // Only select segment and preview boundaries - DO NOT trim yet!
  const handleSelectSegment = (segment: VideoCutSegment) => {
    setSelectedSegment(segment);
    setDuration(Math.round(segment.duration));
    if (videoRef.current) {
      videoRef.current.currentTime = segment.startTime;
      videoRef.current.play().catch(() => {});
    }
  };

  // Background upload logic
  const handleSubmit = async () => {
    if (!previewUrl && !selectedFile) {
      setErrorMessage('Please choose a photo or video for your story.');
      return;
    }

    // Capture current values for background execution
    const fileToUpload = selectedFile;
    const currentMediaType = mediaType;
    const currentCaption = caption;
    const currentDuration = Math.min(45, Math.max(3, duration));
    const segmentToTrim = selectedSegment;
    const currentPreviewUrl = previewUrl;
    const totalSegs = videoSegments.length || 1;

    // Immediately close modal & notify parent UI optimistically!
    onStoryCreated();
    onClose();

    // Run upload asynchronously in background with zero delay / no timeout blocking
    (async () => {
      try {
        let finalMediaUrl = currentPreviewUrl;

        // If trimming is needed on submit, execute now
        if (fileToUpload && currentMediaType === 'video' && segmentToTrim && (fileToUpload.size > 0)) {
          try {
            const trimmedBlob = await trimVideoClientSide(
              fileToUpload,
              segmentToTrim.startTime,
              segmentToTrim.endTime
            );
            const base64Payload = await new Promise<string>((resolve) => {
              const r = new FileReader();
              r.onloadend = () => resolve(r.result as string);
              r.readAsDataURL(trimmedBlob);
            });
            finalMediaUrl = base64Payload;
          } catch (e) {
            console.warn('Trim fallback to direct preview:', e);
          }
        }

        // Upload media (with quick fallback if upload takes too long)
        if (finalMediaUrl.startsWith('data:') || finalMediaUrl.startsWith('blob:')) {
          let base64Payload = finalMediaUrl;
          if (finalMediaUrl.startsWith('blob:')) {
            const blobRes = await fetch(finalMediaUrl);
            const blobData = await blobRes.blob();
            base64Payload = await new Promise<string>((resolve) => {
              const r = new FileReader();
              r.onloadend = () => resolve(r.result as string);
              r.readAsDataURL(blobData);
            });
          }

          try {
            // Quick 5-second timeout on upload call so user never encounters a timeout error
            const uploadPromise = api.post('/upload', {
              fileBase64: base64Payload,
              filename: `story_${Date.now()}.${currentMediaType === 'video' ? 'mp4' : 'jpg'}`,
              mimeType: currentMediaType === 'video' ? 'video/mp4' : 'image/jpeg',
            });
            const timeoutPromise = new Promise<{ data: any }>((_, reject) =>
              setTimeout(() => reject(new Error('Upload timeout fallback')), 5000)
            );
            const uploadRes = (await Promise.race([uploadPromise, timeoutPromise])) as any;

            if (uploadRes.data?.success && uploadRes.data?.url) {
              finalMediaUrl = uploadRes.data.url;
            }
          } catch {
            finalMediaUrl = base64Payload;
          }
        }

        await api.post('/stories', {
          mediaUrl: finalMediaUrl,
          mediaType: currentMediaType,
          caption: currentCaption,
          duration: currentDuration,
          segmentIndex: segmentToTrim?.index || 1,
          totalSegments: totalSegs,
        });
      } catch (backgroundErr) {
        console.warn('Background story publish handled:', backgroundErr);
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full text-white shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h3 className="text-base font-bold text-white">Create 24h Story</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Media Selector / Preview Area */}
          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-800/40 hover:bg-slate-800/70 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 group-hover:scale-110 flex items-center justify-center mb-3 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">Select Photo or Video</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Photos are compressed automatically. Videos up to 45s with automatic clip splitter.
              </p>
              <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> JPEG, PNG, WEBP</span>
                <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" /> MP4, MOV (≤45s)</span>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[220px] sm:max-h-[300px] mx-auto border border-slate-800 flex items-center justify-center">
              {mediaType === 'video' ? (
                <video ref={videoRef} src={previewUrl} controls className="w-full h-full object-contain" autoPlay loop muted />
              ) : (
                <img src={previewUrl} alt="Story preview" className="w-full h-full object-contain" />
              )}

              {/* Compression badge */}
              {compressionStats && (
                <div className="absolute top-3 left-3 bg-emerald-950/80 border border-emerald-600/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-medium text-emerald-300 flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Space Saved: {compressionStats.saved}% ({compressionStats.original} → {compressionStats.compressed})
                </div>
              )}

              <button
                onClick={() => {
                  setPreviewUrl('');
                  setSelectedFile(null);
                  setVideoSegments([]);
                }}
                className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
                title="Change media"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Video Clip Splitter (45-second clips) */}
          {videoSegments.length > 1 && (
            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-2.5 animate-in fade-in-50">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                <Scissors className="w-4 h-4 text-rose-400" />
                <span>Video Clip Splitter (Video exceeds 45s)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Stories are 45 seconds max. Choose which 45-second clip you would like to share (it trims automatically when posting):
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {videoSegments.map((seg) => {
                  const isSelected = selectedSegment?.index === seg.index;
                  return (
                    <button
                      key={seg.index}
                      type="button"
                      onClick={() => handleSelectSegment(seg)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all ${
                        isSelected
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{seg.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                      </div>
                      <span className="text-[10px] text-slate-400">{seg.duration}s clip</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Caption Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Caption (Optional)
            </label>
            <input
              type="text"
              maxLength={200}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a moment or quote to your story..."
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-rose-500 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!previewUrl || isCompressing}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Share Story (24h)
          </button>
        </div>
      </div>
    </div>
  );
};
