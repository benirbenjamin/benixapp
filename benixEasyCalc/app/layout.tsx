import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AnalyticsTracker from '../components/AnalyticsTracker';
import { generateWebSiteSchema } from '../lib/seo/schema';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563EB',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://easycalc.benix.space'),
  title: {
    default: 'BENIX SPACE Easy Calc – Free Fast Online Calculators',
    template: '%s | Benix Space',
  },
  description:
    'Free online calculators for math, finance, health, business, conversions, time, education and everyday calculations. Fast, accurate, and no registration required.',
  keywords: [
    'online calculator',
    'free online calculator',
    'calculator online',
    'free calculator',
    'easy calculator',
    'online math calculator',
    'all calculators',
    'calculator tools',
    'free online tools',
    'benix space',
  ],
  authors: [{ name: 'Benix Space', url: 'https://easycalc.benix.space' }],
  creator: 'Benix Space',
  publisher: 'Benix Space',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'BENIX SPACE Easy Calc – Free Online Calculators',
    description:
      'Fast, free, and accurate online calculators for math, finance, health, conversions, and everyday calculations.',
    url: 'https://easycalc.benix.space',
    siteName: 'BENIX SPACE Easy Calc',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'BENIX SPACE Easy Calc Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'BENIX SPACE Easy Calc – Free Online Calculators',
    description:
      'Free, fast, and accurate online calculators for math, finance, conversions, and health.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteSchema = generateWebSiteSchema();

  return (
    <html lang="en" className="light h-full scroll-smooth">
      <head>
        {/* Google AdSense Integration (Official ca-pub-4078466828008985) */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4078466828008985"
          crossOrigin="anonymous"
        />
        {/* JSON-LD WebSite Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />

        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-134B41RVG8"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-134B41RVG8');
            `,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
        <AnalyticsTracker />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
