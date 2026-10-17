import { NextResponse } from 'next/server';
import { ALL_CALCULATORS } from '../../lib/calculators/registry';
import { SITE_URL } from '../../lib/seo/metadata';

export async function GET() {
  const today = new Date().toISOString().split('T')[0];

  const staticUrls = [
    { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${SITE_URL}/calculators`, priority: '0.9', changefreq: 'daily' },
    { loc: `${SITE_URL}/categories`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${SITE_URL}/compare/online-calculator-tools`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${SITE_URL}/about`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/contact`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${SITE_URL}/privacy-policy`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${SITE_URL}/terms`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${SITE_URL}/cookie-policy`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${SITE_URL}/disclaimer`, priority: '0.3', changefreq: 'yearly' },
  ];

  const calculatorUrls = ALL_CALCULATORS.map((calc) => ({
    loc: `${SITE_URL}/calculators/${calc.slug}`,
    priority: calc.isPopular ? '0.9' : '0.8',
    changefreq: 'weekly',
  }));

  const allUrls = [...staticUrls, ...calculatorUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
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
