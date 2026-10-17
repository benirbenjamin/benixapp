/**
 * Formats seconds into MM:SS format (e.g. 195 -> "03:15")
 */
export function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
  const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${formattedMins}:${formattedSecs}`;
}

/**
 * Parses MM:SS or seconds string back to number
 */
export function parseAudioTime(timeStr: string): number {
  if (!timeStr) return 0;
  if (timeStr.includes(':')) {
    const parts = timeStr.split(':');
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return mins * 60 + secs;
  }
  return parseFloat(timeStr) || 0;
}
