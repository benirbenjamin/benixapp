import { NextResponse } from 'next/server';
import { CATEGORIES } from '../../lib/calculators/categories';
import { SITE_URL } from '../../lib/seo/metadata';

export async function GET() {
  const today = new Date().toISOString().split('T')[0];

  const categoryUrls = CATEGORIES.map((cat) => ({
    loc: `${SITE_URL}/categories/${cat.slug}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categoryUrls
  .map(
    (item) => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
