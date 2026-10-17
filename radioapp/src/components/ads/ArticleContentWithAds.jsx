import React, { useMemo } from 'react';
import { AdSenseUnit } from './AdSenseUnit';

/**
 * ArticleContentWithAds Component
 * 
 * Injects Google AdSense units between <p> paragraphs in news stories and articles.
 * - Injects after every 2-3 paragraphs.
 * - Ads are lazy-loaded via IntersectionObserver as the reader scrolls down.
 * - When an ad is not filled, it collapses completely (0 blank space).
 */
export function ArticleContentWithAds({ html = '', className = '' }) {
  const contentBlocks = useMemo(() => {
    if (!html) return [];

    // Check if content has HTML <p> tags
    if (html.toLowerCase().includes('</p>')) {
      // Split on closing </p> tag
      const rawParts = html.split(/<\/p>/i);
      const paragraphs = [];

      rawParts.forEach((part, idx) => {
        const trimmed = part.trim();
        if (trimmed) {
          // If the part opened a <p>, restore the closing </p>
          paragraphs.push(trimmed.toLowerCase().includes('<p') ? `${trimmed}</p>` : `<p>${trimmed}</p>`);
        }
      });

      return paragraphs;
    }

    // Otherwise split by double linebreaks
    const rawParagraphs = html.split(/\n\s*\n/);
    return rawParagraphs.map(p => `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`);
  }, [html]);

  if (!html) return null;

  return (
    <div className={`rich-text space-y-4 ${className}`}>
      {contentBlocks.map((blockHtml, index) => {
        // Inject an ad after paragraph 2 and every 3 paragraphs thereafter (e.g. after index 1, 4, 7...)
        const shouldInjectAd = (index === 1 && contentBlocks.length > 2) || (index > 1 && (index - 1) % 3 === 0);

        return (
          <React.Fragment key={index}>
            <div dangerouslySetInnerHTML={{ __html: blockHtml }} />

            {shouldInjectAd && (
              <AdSenseUnit
                slot="7034214536"
                client="ca-pub-4078466828008985"
                format="fluid"
                layout="in-article"
                className="my-6"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default ArticleContentWithAds;
