export function getAppUrl(): string {
  let url = process.env.NEXT_PUBLIC_APP_URL || 'https://voxify.space';
  
  // Clean up trailing slash if present
  url = url.replace(/\/$/, '');

  // Override any vercel.app default with custom domain voxify.space
  if (url.includes('vercel.app')) {
    url = 'https://voxify.space';
  }

  // Preserve localhost during local dev testing
  if (typeof window !== 'undefined' && window.location.origin.includes('localhost')) {
    return window.location.origin;
  }

  return url;
}
