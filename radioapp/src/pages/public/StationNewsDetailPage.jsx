import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStation } from '../../context/StationContext';
import { ThemeProvider } from '../../components/themes/ThemeProvider';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { PersistentPlayerBar } from '../../components/player/PersistentPlayerBar';
import { Calendar, Eye, ArrowLeft, Share2, Facebook, Twitter, MessageCircle, Newspaper } from 'lucide-react';
import { api } from '../../api/client';
import { ArticleContentWithAds } from '../../components/ads/ArticleContentWithAds';
import { AdSenseUnit } from '../../components/ads/AdSenseUnit';

export function StationNewsDetailPage() {
  const { articleSlug } = useParams();
  const { station, branding } = useStation();

  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadArticle() {
      if (!station?.id || !articleSlug) return;
      setLoading(true);
      setError(null);
      try {
        const data = await api.get(`/stations/${station.id}/news/${articleSlug}`);
        setArticle(data.article);
        setRelated(data.related || []);
      } catch (err) {
        console.error('Failed to load article:', err);
        setError('Article not found.');
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [station?.id, articleSlug]);

  const basePath = `/station/${station?.slug}`;
  const currentUrl = window.location.href;

  return (
    <ThemeProvider branding={branding}>
      <div className="min-h-screen flex flex-col justify-between">
        <div>
          <PublicNavbar />

          <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            {/* Back to news button */}
            <Link
              to={`${basePath}/news`}
              className="inline-flex items-center gap-2 text-xs font-bold text-[var(--primary-color)] hover:underline mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to News Archive</span>
            </Link>

            {loading ? (
              <div className="text-center py-20 text-slate-400">Loading article...</div>
            ) : error || !article ? (
              <div className="text-center py-20 p-8 rounded-3xl bg-[var(--surface-color)] border border-slate-200 space-y-4">
                <h2 className="text-2xl font-black text-red-500">Article Not Found</h2>
                <p className="text-sm text-slate-500">This story might have been moved or removed.</p>
                <Link to={`${basePath}/news`} className="inline-block px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">
                  Browse All News
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Article Header */}
                <div className="space-y-4">
                  {article.category_name && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                      {article.category_name}
                    </span>
                  )}

                  <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-color)] tracking-tight leading-tight">
                    {article.title}
                  </h1>

                  {/* Metadata & Share */}
                  <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-200 text-xs text-[var(--muted-color)]">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>Published {new Date(article.published_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4" />
                        <span>{article.views_count || 0} reads</span>
                      </span>
                    </div>

                    {/* Share links */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">Share:</span>
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(article.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-500 hover:text-white text-slate-600 transition-colors"
                        title="Share on X"
                      >
                        <Twitter className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 transition-colors"
                        title="Share on Facebook"
                      >
                        <Facebook className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + currentUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 transition-colors"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Main Article Image */}
                {article.image_url && (
                  <div className="rounded-3xl overflow-hidden shadow-md bg-slate-100">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full max-h-[500px] object-cover"
                    />
                  </div>
                )}

                {/* Excerpt Lead */}
                {article.excerpt && (
                  <p className="text-lg sm:text-xl font-medium text-slate-700 leading-relaxed italic border-l-4 border-[var(--primary-color)] pl-4">
                    {article.excerpt}
                  </p>
                )}

                {/* Full Rich Content HTML with Scroll-Injected Paragraph Ads */}
                <ArticleContentWithAds
                  html={article.content_html}
                  className="text-base sm:text-lg text-[var(--text-color)] leading-relaxed space-y-4"
                />

                {/* In-Article Bottom Ad Slot */}
                <AdSenseUnit
                  slot="7034214536"
                  client="ca-pub-4078466828008985"
                  className="my-8"
                />

                {/* Related Articles */}
                {related.length > 0 && (
                  <div className="pt-16 mt-16 border-t border-slate-200 space-y-6">
                    <h3 className="text-xl font-extrabold text-[var(--text-color)]">Related Stories</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {related.map((rel) => (
                        <Link
                          key={rel.id}
                          to={`${basePath}/news/${rel.slug}`}
                          className="group rounded-2xl overflow-hidden bg-[var(--surface-color)] border border-slate-200 p-4 hover:shadow-lg transition-all"
                        >
                          <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 mb-3">
                            {rel.image_url ? (
                              <img src={rel.image_url} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Newspaper className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-[var(--text-color)] group-hover:text-[var(--primary-color)] transition-colors line-clamp-2">
                            {rel.title}
                          </h4>
                          <span className="text-[10px] text-[var(--muted-color)] mt-1 block">
                            {new Date(rel.published_at).toLocaleDateString()}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </article>
        </div>

        <PublicFooter />
        <PersistentPlayerBar />
      </div>
    </ThemeProvider>
  );
}
