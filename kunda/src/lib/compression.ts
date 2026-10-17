// =====================================================================
// KUNDA SPACE: HIGH-EFFICIENCY CLIENT-SIDE COMPRESSION & AUTO-CUT
// Saves server storage space & enforces WhatsApp-style 45s story limits
// =====================================================================

export interface CompressionResult {
  dataUrl: string;
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  formattedOriginal: string;
  formattedCompressed: string;
}

/**
 * Formats byte size into human readable string (KB, MB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Compresses an image file client-side using HTML5 Canvas
 * Dramatically reduces 5-15MB phone photos down to 150-300KB (up to 95% space saved!)
 */
export async function compressImage(
  file: File | Blob,
  maxWidth: number = 1440,
  maxHeight: number = 1440,
  quality: number = 0.78
): Promise<CompressionResult> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (e) => reject(new Error('Failed to read image file'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale down
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get 2D canvas context'));
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG dataUrl
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas to Blob compression failed'));
            }

            const compressedSize = blob.size;
            const saved = Math.max(0, originalSize - compressedSize);
            const savedPercent = originalSize > 0 ? Math.round((saved / originalSize) * 100) : 0;

            resolve({
              dataUrl,
              blob,
              originalSize,
              compressedSize,
              savedPercent,
              formattedOriginal: formatBytes(originalSize),
              formattedCompressed: formatBytes(compressedSize),
            });
          },
          'image/jpeg',
          quality
        );
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Reads video metadata (duration in seconds, dimensions)
 */
export async function getVideoMetadata(
  file: File | Blob
): Promise<{ duration: number; width: number; height: number; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;
      resolve({ duration, width, height, url });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to inspect video duration or format'));
    };

    video.src = url;
  });
}

export interface VideoCutSegment {
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  label: string;
}

/**
 * Generates WhatsApp-style 45-second segments for a long video
 */
export function calculateWhatsAppSegments(totalDurationSeconds: number, maxSegmentSeconds: number = 45): VideoCutSegment[] {
  const segments: VideoCutSegment[] = [];
  let start = 0;
  let index = 1;

  while (start < totalDurationSeconds) {
    const end = Math.min(totalDurationSeconds, start + maxSegmentSeconds);
    const dur = end - start;

    const startMin = Math.floor(start / 60);
    const startSec = Math.floor(start % 60);
    const endMin = Math.floor(end / 60);
    const endSec = Math.floor(end % 60);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const label = `Part ${index} (${pad(startMin)}:${pad(startSec)} - ${pad(endMin)}:${pad(endSec)})`;

    segments.push({
      index,
      startTime: Math.round(start * 10) / 10,
      endTime: Math.round(end * 10) / 10,
      duration: Math.round(dur * 10) / 10,
      label,
    });

    start = end;
    index++;
  }

  return segments;
}

/**
 * Trims / cuts a video segment client-side using MediaRecorder & Canvas
 * Allows cutting long videos into 45s WhatsApp-style status clips
 */
export async function trimVideoClientSide(
  file: File | Blob,
  startTime: number,
  endTime: number,
  onProgress?: (progressPct: number) => void
): Promise<Blob> {
  const targetDuration = endTime - startTime;
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.muted = false; // capture audio
  video.currentTime = startTime;

  await new Promise((res) => {
    video.onloadeddata = () => res(true);
  });

  const canvas = document.createElement('canvas');
  // Downscale slightly if 4K to conserve memory and bandwidth
  const maxWidth = 1080;
  let scale = 1;
  if (video.videoWidth > maxWidth) {
    scale = maxWidth / video.videoWidth;
  }
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext('2d');

  // Capture canvas video stream & audio
  const canvasStream = canvas.captureStream(30);

  // Audio capture
  let combinedStream = canvasStream;
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(video);
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    source.connect(audioCtx.destination);
    const audioTrack = dest.stream.getAudioTracks()[0];
    if (audioTrack) {
      combinedStream.addTrack(audioTrack);
    }
  } catch (audioErr) {
    // If audio element source isn't permitted in browser context, continue without sound
  }

  const mimeType = MediaRecorder.isTypeSupported('video/mp4')
    ? 'video/mp4'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 1_800_000, // 1.8 Mbps clean lightweight mobile stream
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      URL.revokeObjectURL(url);
      const outputBlob = new Blob(chunks, { type: mimeType });
      resolve(outputBlob);
    };

    recorder.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Video recording/cutting failed'));
    };

    recorder.start(100);
    video.play();

    const drawFrame = () => {
      if (video.currentTime >= endTime || video.ended) {
        video.pause();
        recorder.stop();
        return;
      }

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      if (onProgress) {
        const elapsed = video.currentTime - startTime;
        const pct = Math.min(100, Math.round((elapsed / targetDuration) * 100));
        onProgress(pct);
      }

      requestAnimationFrame(drawFrame);
    };

    requestAnimationFrame(drawFrame);
  });
}
