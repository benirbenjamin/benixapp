import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  let envUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voxify.space';
  if (envUrl.includes('localhost') || envUrl.includes('vercel.app')) {
    envUrl = 'https://voxify.space';
  }
  const baseUrl = envUrl.replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
