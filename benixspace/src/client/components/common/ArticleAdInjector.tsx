import React from 'react';
import { AdSenseUnit } from './AdSenseUnit';

interface ArticleAdInjectorProps {
  content: string;
  slot?: string;
  className?: string;
}

export const ArticleAdInjector: React.FC<ArticleAdInjectorProps> = ({
  content,
  slot,
  className = '',
}) => {
  if (!content) return null;

  // Split HTML string by paragraph or header closing tags
  const blocks = content.split(/(<\/p>|<\/h2>|<\/h3>|<\/div>)/i).filter(Boolean);

  // If content is very short, display single block with top and bottom ads
  if (blocks.length <= 4) {
    return (
      <div className={`article-content space-y-6 ${className}`}>
        <AdSenseUnit slot={slot} format="auto" className="my-6" />
        <div dangerouslySetInnerHTML={{ __html: content }} />
        <AdSenseUnit slot={slot} format="auto" className="my-6" />
      </div>
    );
  }

  // Recombine blocks and inject ads after 2nd block, 5th block, and 8th block
  const elements: React.ReactNode[] = [];
  let currentHtml = '';
  let blockCounter = 0;

  for (let i = 0; i < blocks.length; i++) {
    currentHtml += blocks[i];

    // Every closing tag completes a content block
    if (/^<\/(p|h2|h3|div)>$/i.test(blocks[i])) {
      blockCounter++;

      elements.push(
        <div
          key={`block-${i}`}
          dangerouslySetInnerHTML={{ __html: currentHtml }}
        />
      );
      currentHtml = '';

      // Inject ads after block 2, block 5, block 8
      if (blockCounter === 2 || blockCounter === 5 || blockCounter === 8) {
        elements.push(
          <div key={`ad-inj-${blockCounter}`} className="my-8 flex justify-center w-full">
            <AdSenseUnit slot={slot} format="auto" responsive className="w-full max-w-3xl" />
          </div>
        );
      }
    }
  }

  // Append any remaining HTML
  if (currentHtml.trim()) {
    elements.push(
      <div
        key="block-remaining"
        dangerouslySetInnerHTML={{ __html: currentHtml }}
      />
    );
  }

  return (
    <div className={`article-content space-y-6 ${className}`}>
      {/* Top Article Ad */}
      <AdSenseUnit slot={slot} format="auto" className="my-6 w-full" />
      
      {elements}
      
      {/* Bottom Article Ad */}
      <AdSenseUnit slot={slot} format="auto" className="my-6 w-full" />
    </div>
  );
};
