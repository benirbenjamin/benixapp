import { Metadata } from 'next';
import { CalculatorDefinition } from '../calculators/types';

export const SITE_URL = 'https://easycalc.benix.space';
export const SITE_NAME = 'BENIX SPACE Easy Calc';
export const SITE_DEFAULT_DESCRIPTION = 'Free online calculators for math, finance, health, business, conversions, time, education and everyday calculations. Fast, accurate and mobile friendly.';

export function getCalculatorMetadata(calc: CalculatorDefinition): Metadata {
  const url = `${SITE_URL}/calculators/${calc.slug}`;
  const title = calc.seoTitle;
  const description = calc.metaDescription;

  return {
    title,
    description,
    keywords: calc.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: `${SITE_URL}/logo.png`,
          width: 512,
          height: 512,
          alt: `${calc.title} – ${SITE_NAME}`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [`${SITE_URL}/logo.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function getCategoryMetadata(categoryName: string, categoryDesc: string, slug: string): Metadata {
  const title = `${categoryName} Calculators – Free Online Tools | Benix Space`;
  const url = `${SITE_URL}/categories/${slug}`;

  return {
    title,
    description: categoryDesc,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description: categoryDesc,
      url,
      siteName: SITE_NAME,
      images: [`${SITE_URL}/logo.png`],
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description: categoryDesc,
    },
  };
}
