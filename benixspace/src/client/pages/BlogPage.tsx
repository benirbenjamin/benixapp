import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { AdSenseUnit } from '../components/common/AdSenseUnit';
import { fetchArticles, fetchCategories } from '../services/api';
import { trackPageView } from '../analytics/tracker';
import { Article } from '../types';
import { Search, Calendar, User, ArrowRight, Eye, Newspaper, Flame, ExternalLink, Sparkles } from 'lucide-react';

export const BlogPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    trackPageView(window.location.href, 'blog');
    async function loadData() {
      try {
        const [articleList, catList] = await Promise.all([
          fetchArticles(),
          fetchCategories()
        ]);
        setArticles(articleList);
        setFilteredArticles(articleList);
        if (catList && catList.length > 0) {
          setCategories(['All', ...catList]);
        } else {
          setCategories(['All', 'Technology', 'Software Development', 'Digital Marketing & SEO', 'NebeluRw News']);
        }
      } catch (err) {
        console.error('Failed to fetch blog data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    let result = [...articles];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter((a) => a.category === selectedCategory);
    }

    setFilteredArticles(result);
  }, [searchQuery, selectedCategory, articles]);

  // Featured lead story (first article)
  const leadArticle = filteredArticles[0];
  const secondaryArticles = filteredArticles.slice(1);

  // Trending articles sorted by views
  const trendingArticles = [...articles]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 5);

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <SeoHead
        title="The NebeluRw Chronicle — Tech & Platform Insights"
        description="Read official publications, software engineering guides, digital marketing strategies, and technology news from NebeluRw Co. Ltd."
      />

      <div className="bg-slate-50 min-h-screen py-10 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Newspaper Editorial Masthead Banner */}
          <div className="text-center space-y-3 pb-6 border-b-2 border-slate-900/80">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-slate-500 font-bold border-b border-slate-200 pb-2 mb-4">
              <span>Vol. I — Digital Media & Tech Edition</span>
              <span className="flex items-center gap-1 text-slate-800">
                <Newspaper className="w-3.5 h-3.5 text-sky-600" /> NebeluRw Publications
              </span>
              <span>{currentDateStr}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tighter uppercase font-serif">
              The NebeluRw Chronicle
            </h1>
            <p className="text-slate-600 text-sm sm:text-base font-medium max-w-2xl mx-auto leading-relaxed">
              In-depth analysis, software engineering architecture, streaming technology, and digital innovation from NebeluRw Co. Ltd.
            </p>
          </div>

          {/* Search Bar & Dynamic Categories Pills */}
          <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 bg-white">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title, tags, or content..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
              />
            </div>

            {/* Dynamic Category Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold uppercase text-slate-400 mr-1">Categories:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Main 2-Column Newspaper Layout */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin mx-auto" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-20 glass-card rounded-3xl">
              <Newspaper className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-800 font-bold text-lg">No articles match your selection.</p>
              <p className="text-slate-500 text-sm">Try searching another term or choosing 'All' categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Lead Banner + Article Grid (8 cols) */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Lead Headline Article */}
                {leadArticle && (
                  <article className="glass-card rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-white hover:shadow-2xl transition-all group">
                    <div className="grid grid-cols-1 md:grid-cols-12">
                      <div className="md:col-span-6 h-64 md:h-auto overflow-hidden bg-slate-900 relative">
                        <img
                          src={leadArticle.featured_image_url || 'https://i.postimg.cc/85zP6mK2/benix-tv-cover.jpg'}
                          alt={leadArticle.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-4 left-4 bg-sky-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md">
                          Headline Feature
                        </span>
                      </div>

                      <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-sky-600">
                            <span className="uppercase tracking-wider">{leadArticle.category}</span>
                            <span>•</span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> {leadArticle.views_count || 120} views
                            </span>
                          </div>

                          <h2 className="text-2xl font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors leading-tight">
                            <Link to={`/blog/${leadArticle.slug}`}>{leadArticle.title}</Link>
                          </h2>

                          <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                            {leadArticle.summary}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-sky-600" /> {leadArticle.author_name}
                          </span>
                          <Link
                            to={`/blog/${leadArticle.slug}`}
                            className="inline-flex items-center gap-1 text-sky-600 font-bold text-xs hover:text-sky-700"
                          >
                            <span>Read Full Story</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                )}

                {/* Ad Banner between Headline and Grid */}
                <div className="my-6">
                  <AdSenseUnit className="w-full" />
                </div>

                {/* Secondary Articles Grid */}
                {secondaryArticles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {secondaryArticles.map((art, idx) => (
                      <React.Fragment key={art.id}>
                        <article className="glass-card rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-lg transition-all group bg-white flex flex-col justify-between">
                          <div>
                            <div className="h-44 overflow-hidden bg-slate-900 relative">
                              <img
                                src={art.featured_image_url || 'https://i.postimg.cc/85zP6mK2/benix-tv-cover.jpg'}
                                alt={art.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div className="p-5 space-y-2.5">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span className="font-bold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full text-[11px]">
                                  {art.category}
                                </span>
                                <span className="flex items-center gap-1 text-[11px]">
                                  <Eye className="w-3 h-3" /> {art.views_count || 45} views
                                </span>
                              </div>

                              <h3 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug">
                                <Link to={`/blog/${art.slug}`}>{art.title}</Link>
                              </h3>

                              <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                                {art.summary}
                              </p>
                            </div>
                          </div>

                          <div className="px-5 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500">
                              {new Date(art.published_at || art.created_at || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <Link
                              to={`/blog/${art.slug}`}
                              className="inline-flex items-center gap-1 text-sky-600 font-bold text-xs hover:text-sky-700"
                            >
                              <span>Read</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </article>

                        {/* In-feed Ad Unit every 4 items */}
                        {idx % 4 === 3 && (
                          <div className="col-span-1 sm:col-span-2 my-2">
                            <AdSenseUnit format="fluid" layoutKey="-6t+ed+2i-1n-4x" className="w-full" />
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

              </div>

              {/* Right Sidebar Column (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* 1. Trending Articles Widget */}
                <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md bg-white space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Flame className="w-5 h-5 text-amber-500" />
                    <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-tight">Most Read Stories</h3>
                  </div>

                  <div className="space-y-4 divide-y divide-slate-100">
                    {trendingArticles.map((art, rank) => (
                      <div key={art.id} className="pt-3 first:pt-0 flex items-start gap-3 group">
                        <span className="text-2xl font-black text-slate-300 group-hover:text-sky-600 transition-colors shrink-0">
                          0{rank + 1}
                        </span>
                        <div className="space-y-1">
                          <Link
                            to={`/blog/${art.slug}`}
                            className="font-bold text-slate-900 text-xs line-clamp-2 group-hover:text-sky-600 transition-colors leading-snug"
                          >
                            {art.title}
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="text-sky-600 font-semibold">{art.category}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {art.views_count || 120} views
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Sidebar Ad Placement */}
                <div className="glass-card rounded-3xl p-4 border border-slate-200/80 shadow-sm bg-white">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 text-center">Advertisement</span>
                  <AdSenseUnit className="w-full" />
                </div>

                {/* 3. NebeluRw Featured Platforms Spotlight Widget */}
                <div className="glass-card rounded-3xl p-6 border border-slate-200/80 shadow-md bg-gradient-to-br from-slate-900 to-sky-950 text-white space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Sparkles className="w-5 h-5 text-sky-400" />
                    <h3 className="font-extrabold text-white text-base uppercase tracking-tight">NebeluRw Ecosystem</h3>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed">
                    Explore our official digital platforms live on web and mobile.
                  </p>

                  <div className="space-y-3">
                    <a
                      href="https://tv.benix.space"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-between text-xs font-bold"
                    >
                      <span>Benix Space TV</span>
                      <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    </a>
                    <a
                      href="https://games.benix.space"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-between text-xs font-bold"
                    >
                      <span>Benix Games</span>
                      <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    </a>
                    <a
                      href="https://voxify.space"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-between text-xs font-bold"
                    >
                      <span>Voxify Choir Platform</span>
                      <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    </a>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
};
