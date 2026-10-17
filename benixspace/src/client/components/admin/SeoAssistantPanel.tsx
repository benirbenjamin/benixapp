import React, { useState } from 'react';
import { calculateSeoScore } from '../../seo/seo-score';
import { extractSuggestedKeywords, INTERNAL_LINK_SUGGESTIONS } from '../../seo/keyword-extractor';
import { CheckCircle2, AlertTriangle, Eye, Sparkles, Link2 } from 'lucide-react';

interface SeoAssistantPanelProps {
  title: string;
  metaDescription: string;
  content: string;
  keywords: string;
  slug: string;
  featuredImageUrl: string;
  onSelectKeyword?: (kwd: string) => void;
  onInsertLink?: (url: string, text: string) => void;
}

export const SeoAssistantPanel: React.FC<SeoAssistantPanelProps> = ({
  title,
  metaDescription,
  content,
  keywords,
  slug,
  featuredImageUrl,
  onSelectKeyword,
  onInsertLink
}) => {
  const [activeTab, setActiveTab] = useState<'score' | 'preview'>('score');

  const seoResult = calculateSeoScore(title, metaDescription, content, keywords, slug, featuredImageUrl);
  const suggestedKwds = extractSuggestedKeywords(title, content);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-lg space-y-6">
      
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sky-600" />
          <h3 className="font-extrabold text-slate-900 text-base">BenixSpace SEO Assistant</h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('score')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'score' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            SEO Analysis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'preview' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            SERP & Social Preview
          </button>
        </div>
      </div>

      {activeTab === 'score' ? (
        <div className="space-y-6">
          
          {/* SEO Score Gauge */}
          <div className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">BenixSpace SEO Score</span>
              <p className="text-xs text-slate-500 mt-0.5">Real-time content audit</p>
            </div>
            <div className={`px-4 py-2 rounded-2xl border font-black text-2xl ${getScoreColor(seoResult.score)}`}>
              {seoResult.score} / 100
            </div>
          </div>

          {/* Checklist Suggestions */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actionable Recommendations</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {seoResult.suggestions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 text-xs">
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <span className={item.passed ? 'text-slate-700 font-medium' : 'text-amber-800 font-semibold'}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Keyword Suggestions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suggested Keywords</h4>
            <div className="flex flex-wrap gap-1.5">
              {suggestedKwds.map((kwd, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectKeyword && onSelectKeyword(kwd)}
                  className="text-xs bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white px-2.5 py-1 rounded-lg border border-sky-100 font-medium transition-colors"
                >
                  + {kwd}
                </button>
              ))}
            </div>
          </div>

          {/* Internal Link Suggestions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" /> Internal Link Suggestions
            </h4>
            <div className="space-y-1.5">
              {INTERNAL_LINK_SUGGESTIONS.slice(0, 4).map((link, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-800">{link.text}</span>
                    <span className="text-[10px] text-slate-400 block">{link.description}</span>
                  </div>
                  {onInsertLink && (
                    <button
                      type="button"
                      onClick={() => onInsertLink(link.url, link.text)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-sky-600 font-bold hover:bg-sky-50"
                    >
                      Insert
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Google SERP Snippet Preview */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Google SERP Preview</span>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1 font-sans">
              <span className="text-xs text-slate-500 truncate block">https://benix.space › blog › {slug || 'article-slug'}</span>
              <h4 className="text-lg text-blue-800 font-medium hover:underline line-clamp-1 cursor-pointer">
                {title || 'Article Title Preview — BenixSpace'}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2">
                {metaDescription || 'Add a meta description to see how your article will look in Google search engine results...'}
              </p>
            </div>
          </div>

          {/* Social OpenGraph Preview */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Social OpenGraph Card Preview</span>
            <div className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm space-y-0">
              <div className="h-36 bg-slate-900 overflow-hidden">
                <img
                  src={featuredImageUrl || 'https://i.postimg.cc/85zP6mK2/benix-tv-cover.jpg'}
                  alt="OG Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 bg-slate-50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">benix.space</span>
                <h5 className="text-xs font-bold text-slate-900 truncate">{title || 'Article Title'}</h5>
                <p className="text-[11px] text-slate-500 line-clamp-2">{metaDescription || 'Article description preview...'}</p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
