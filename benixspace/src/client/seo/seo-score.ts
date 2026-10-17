import { SeoScoreResult } from '../types';

export function calculateSeoScore(
  title: string,
  metaDescription: string,
  content: string,
  keywords: string,
  slug: string,
  featuredImageUrl: string
): SeoScoreResult {
  let score = 0;
  const suggestions: { text: string; passed: boolean }[] = [];

  const titleLen = title ? title.trim().length : 0;
  const descLen = metaDescription ? metaDescription.trim().length : 0;
  const cleanContent = content ? content.replace(/<[^>]+>/g, '') : '';
  const words = cleanContent.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const keywordList = keywords
    ? keywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean)
    : [];
  const primaryKeyword = keywordList[0] || '';

  // 1. Title Length Check (15 pts)
  if (titleLen >= 30 && titleLen <= 60) {
    score += 15;
    suggestions.push({ text: 'Good title length (30-60 characters)', passed: true });
  } else if (titleLen > 0) {
    score += 8;
    suggestions.push({
      text: titleLen < 30 ? 'Title is too short (aim for 30-60 chars)' : 'Title is too long (aim for 30-60 chars)',
      passed: false
    });
  } else {
    suggestions.push({ text: 'Add a title for search engines', passed: false });
  }

  // 2. Meta Description Check (15 pts)
  if (descLen >= 120 && descLen <= 160) {
    score += 15;
    suggestions.push({ text: 'Optimal meta description length (120-160 characters)', passed: true });
  } else if (descLen > 0) {
    score += 8;
    suggestions.push({
      text: descLen < 120 ? 'Meta description is short (aim for 120-160 chars)' : 'Meta description is too long',
      passed: false
    });
  } else {
    suggestions.push({ text: 'Add a meta description', passed: false });
  }

  // 3. Keyword Presence in Title & Intro (15 pts)
  if (primaryKeyword) {
    const titleHasKwd = title.toLowerCase().includes(primaryKeyword);
    const introHasKwd = cleanContent.slice(0, 300).toLowerCase().includes(primaryKeyword);
    
    if (titleHasKwd && introHasKwd) {
      score += 15;
      suggestions.push({ text: `Primary keyword "${primaryKeyword}" appears in title & introduction`, passed: true });
    } else if (titleHasKwd || introHasKwd) {
      score += 8;
      suggestions.push({ text: `Primary keyword "${primaryKeyword}" missing from title or introduction`, passed: false });
    } else {
      suggestions.push({ text: `Include target keyword "${primaryKeyword}" in your title & first paragraph`, passed: false });
    }
  } else {
    suggestions.push({ text: 'Add target keywords for analysis', passed: false });
  }

  // 4. Content Length Check (20 pts)
  if (wordCount >= 500) {
    score += 20;
    suggestions.push({ text: `Comprehensive content depth (${wordCount} words)`, passed: true });
  } else if (wordCount >= 300) {
    score += 14;
    suggestions.push({ text: `Good content length (${wordCount} words)`, passed: true });
  } else {
    suggestions.push({ text: `Content is short (${wordCount} words). Aim for 300+ words for better ranking`, passed: false });
  }

  // 5. Headings Check (10 pts)
  const hasHeadings = /<h[2-4][^>]*>/i.test(content);
  if (hasHeadings) {
    score += 10;
    suggestions.push({ text: 'Good heading structure (H2/H3 subheadings used)', passed: true });
  } else {
    suggestions.push({ text: 'Use subheadings (H2, H3) to structure your article', passed: false });
  }

  // 6. Featured Image & Alt Text Check (10 pts)
  if (featuredImageUrl) {
    score += 10;
    suggestions.push({ text: 'Featured image provided for social sharing & SERP visual', passed: true });
  } else {
    suggestions.push({ text: 'Add a featured image', passed: false });
  }

  // 7. Internal / External Links Check (15 pts)
  const hasLinks = /<a\s+[^>]*href=["'][^"']+["'][^>]*>/i.test(content);
  if (hasLinks) {
    score += 15;
    suggestions.push({ text: 'Includes internal or contextual links', passed: true });
  } else {
    suggestions.push({ text: 'Consider adding internal links to NebeluRw services or projects', passed: false });
  }

  return {
    score: Math.min(100, score),
    suggestions,
    titleLength: titleLen,
    descLength: descLen,
    wordCount
  };
}
