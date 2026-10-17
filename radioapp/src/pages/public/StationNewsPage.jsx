import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStation } from '../../context/StationContext';
import { ThemeProvider } from '../../components/themes/ThemeProvider';
import { PublicNavbar } from '../../components/layout/PublicNavbar';
import { PublicFooter } from '../../components/layout/PublicFooter';
import { PersistentPlayerBar } from '../../components/player/PersistentPlayerBar';
import { Newspaper, Search, ArrowRight, Calendar, Eye, Tag } from 'lucide-react';
import { api } from '../../api/client';
import { AdSenseUnit } from '../../components/ads/AdSenseUnit';

export function StationNewsPage() {
  const { station, branding } = useStation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');

  const [searchInput, setSearchInput] = useState(currentSearch);

  // Fetch articles & categories
  useEffect(() => {
    async function loadData() {
      if (!station?.id) return;
      setLoading(true);
      try {
        const queryStr = new URLSearchParams({
          page: currentPage,
          limit: 9,
          status: 'published',
          ...(currentCategory ? { category: currentCategory } : {}),
          ...(currentSearch ? { search: currentSearch } : {})
        }).toString();

        const [newsData, catData] = await Promise.all([
          api.get(`/stations/${station.id}/news?${queryStr}`),
          api.get(`/stations/${station.id}/news-categories`)
        ]);

        setArticles(newsData.articles || []);
        setPagination(newsData.pagination || { page: 1, limit: 9, total: 0, totalPages: 1 });
        setCategories(catData || []);
      } catch (err) {
        console.error('Failed to load news:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [station?.id, currentCategory, currentSearch, currentPage]);

  const handleCategorySelect = (slug) => {
    const params = new URLSearchParams(searchParams);
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      params.set('search', searchInput.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const basePath = `/station/${station?.slug}`;

  return (
    <ThemeProvider branding={branding}>
      <div className="min-h-screen flex flex-col justify-between">
        <div>
          <PublicNavbar />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
            
            {/* Page Title & Search Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-color)]">
                  Journalism & Stories
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-color)]">
                  Latest News & Articles
                </h1>
                <p className="text-xs sm:text-sm text-[var(--muted-color)]">
                  Stories, entertainment news, and bulletins from {station?.name}.
                </p>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--surface-color)] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs sm:text-sm text-[var(--text-color)]"
                />
              </form>
            </div>

            {/* Categories Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => handleCategorySelect('')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-colors ${
                  !currentCategory
                    ? 'bg-[var(--primary-color)] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Stories
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-colors flex items-center gap-1.5 ${
                    currentCategory === cat.slug
                      ? 'bg-[var(--primary-color)] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Articles Grid */}
            {loading ? (
              <div className="text-center py-20 text-slate-400">Loading articles...</div>
            ) : articles.length === 0 ? (
              <div className="text-center py-20 rounded-3xl bg-[var(--surface-color)] border border-slate-200 p-8">
                <Newspaper className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[var(--text-color)]">No articles found</h3>
                <p className="text-xs text-[var(--muted-color)] mt-1">Try clearing your search or selecting a different category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((item) => (
                  <article
                    key={item.id}
                    className="group rounded-3xl overflow-hidden bg-[var(--surface-color)] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <Link to={`${basePath}/news/${item.slug}`} className="aspect-[16/10] overflow-hidden bg-slate-100 relative block">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                            <Newspaper className="w-12 h-12" />
                          </div>
                        )}
                        {item.category_name && (
                          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-slate-900 backdrop-blur-sm shadow-xs">
                            {item.category_name}
                          </span>
                        )}
                      </Link>

                      <div className="p-6 space-y-2">
                        <div className="flex items-center gap-3 text-[11px] text-[var(--muted-color)]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(item.published_at).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{item.views_count || 0} views</span>
                          </span>
                        </div>

                        <Link to={`${basePath}/news/${item.slug}`}>
                          <h2 className="font-extrabold text-lg text-[var(--text-color)] group-hover:text-[var(--primary-color)] transition-colors line-clamp-2">
                            {item.title}
                          </h2>
                        </Link>

                        <p className="text-xs text-[var(--muted-color)] line-clamp-3 leading-relaxed">
                          {item.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 pt-0">
                      <Link
                        to={`${basePath}/news/${item.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary-color)] hover:underline"
                      >
                        <span>Read Full Story</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* In-feed AdSense Slot (Zero blank space if unfilled) */}
            <AdSenseUnit
              slot="7034214536"
              client="ca-pub-4078466828008985"
              className="my-8"
            />

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="pt-8 flex items-center justify-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-slate-500 px-3">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

          </div>
        </div>

        <PublicFooter />
        <PersistentPlayerBar />
      </div>
    </ThemeProvider>
  );
}
