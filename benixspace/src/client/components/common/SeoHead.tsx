import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  type?: 'website' | 'article' | 'profile';
  schemaJsonLd?: object;
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  title = 'BenixSpace — NebeluRw Co. Ltd Digital Ecosystem & Portfolio',
  description = 'BenixSpace is the official digital ecosystem and project showcase for NebeluRw Co. Ltd, featuring Benix Space TV, Benix Games, Easy Calc, Radio, and Voxify.',
  keywords = 'BenixSpace, NebeluRw Co. Ltd, Benir Benjamin, Rwanda software development, Benix Space TV, Benix Games, Voxify, Easy Calc',
  canonicalUrl,
  ogImage = 'https://i.postimg.cc/85zP6mK2/benix-tv-cover.jpg',
  type = 'website',
  schemaJsonLd
}) => {
  const currentUrl = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : 'https://benix.space');
  const siteTitle = title.includes('NebeluRw') || title.includes('BenixSpace') ? title : `${title} | BenixSpace — NebeluRw Co. Ltd`;

  // Default Organization & Website Schema
  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NebeluRw Co. Ltd',
    url: 'https://benix.space',
    logo: ogImage,
    founder: {
      '@type': 'Person',
      name: 'Benir Benjamin'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'benirabok@gmail.com',
      telephone: '0783987223',
      contactType: 'customer service'
    }
  };

  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph Tags */}
      <meta property="og:site_name" content="BenixSpace — NebeluRw Co. Ltd" />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@benirbenjamin" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Schema.org JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaJsonLd || defaultSchema)}
      </script>
    </Helmet>
  );
};
