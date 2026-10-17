import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroSection } from '../components/home/HeroSection';
import { TvSection } from '../components/home/TvSection';
import { RadioSection } from '../components/home/RadioSection';
import { RollDiceSection } from '../components/home/RollDiceSection';
import { MarketplaceSection } from '../components/home/MarketplaceSection';
import { VoxifySection } from '../components/home/VoxifySection';
import { KundaSection } from '../components/home/KundaSection';
import { EasyCalcSection } from '../components/home/EasyCalcSection';
import { StoriesBar } from '../components/home/StoriesBar';
import { ShortsFeed } from '../components/home/ShortsFeed';
import { ServicesSection } from '../components/home/ServicesSection';
import { ProjectCard3D } from '../components/projects/ProjectCard3D';
import { SeoHead } from '../components/common/SeoHead';
import { AdSenseUnit } from '../components/common/AdSenseUnit';
import { fetchProjects, fetchArticles } from '../services/api';
import { trackPageView } from '../analytics/tracker';
import { Project, Article } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Mail,
  Phone,
  Tv,
  Radio,
  Dices,
  ShoppingBag,
  Music,
  Heart,
  Calculator,
  SlidersHorizontal
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [projects, setProjects] = useState<Project[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    trackPageView(window.location.href, 'home');
    async function loadData() {
      try {
        const [projData, artData] = await Promise.all([
          fetchProjects({ featured: true }),
          fetchArticles()
        ]);
        setProjects(projData);
        setArticles(artData.slice(0, 3));
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const tabs = [
    { id: 'all', label: 'All Experiences', icon: Sparkles },
    { id: 'tv', label: 'TV & Video', icon: Tv },
    { id: 'radio', label: 'Live Radio', icon: Radio },
    { id: 'games', label: 'RollDice Game', icon: Dices },
    { id: 'marketplace', label: 'Umuguzi Market', icon: ShoppingBag },
    { id: 'music', label: 'Voxify Music', icon: Music },
    { id: 'dating', label: 'Kunda Dating', icon: Heart },
    { id: 'calc', label: 'Easy Calc', icon: Calculator },
  ];

  // Check if a module is enabled for user (or all if not logged in)
  const isModuleEnabled = (modId: string) => {
    if (!user || !user.selected_modules || user.selected_modules.length === 0) return true;
    if (modId === 'tv') return user.selected_modules.includes('videos');
    return user.selected_modules.includes(modId);
  };

  return (
    <>
      <SeoHead
        title="BenixSpace — NebeluRw Co. Ltd Digital Portfolio & Ecosystem"
        description="Official digital super-app for NebeluRw Co. Ltd. Featuring live streaming TV, 24/7 radio, games, marketplace, Voxify music, and digital smart calculators."
      />

      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Interactive Super-App Module Switcher & Dynamic Content */}
      <section className="py-10 bg-slate-100/60 dark:bg-slate-950/60 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Stories Bar across Kunda, TV, Radio & Voxify */}
          <StoriesBar />

          {/* Header & Tabs */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-100/80 px-3 py-1 rounded-full border border-sky-200">
                  Integrated Super-App Feed
                </span>
                {user && (
                  <span className="text-xs font-semibold text-slate-500">
                    Personalized for {user.name.split(' ')[0]}
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                Explore Integrated Platform Services
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shorts & Kunda Community Posts Feed */}
          <ShortsFeed />

          {/* Dynamic Module Rendering */}
          <div className="space-y-12">
            
            {/* TV Module */}
            {(activeTab === 'all' ? isModuleEnabled('tv') : activeTab === 'tv') && (
              <div id="section-tv">
                <TvSection />
              </div>
            )}

            {/* Radio Module */}
            {(activeTab === 'all' ? isModuleEnabled('radio') : activeTab === 'radio') && (
              <div id="section-radio">
                <RadioSection />
              </div>
            )}

            {/* RollDice Games Module */}
            {(activeTab === 'all' ? isModuleEnabled('games') : activeTab === 'games') && (
              <div id="section-games">
                <RollDiceSection />
              </div>
            )}

            {/* Marketplace Module */}
            {(activeTab === 'all' ? isModuleEnabled('marketplace') : activeTab === 'marketplace') && (
              <div id="section-marketplace">
                <MarketplaceSection />
              </div>
            )}

            {/* Voxify Music Module */}
            {(activeTab === 'all' ? isModuleEnabled('music') : activeTab === 'music') && (
              <div id="section-music">
                <VoxifySection />
              </div>
            )}

            {/* Kunda Dating Module */}
            {(activeTab === 'all' ? isModuleEnabled('dating') : activeTab === 'dating') && (
              <div id="section-dating">
                <KundaSection />
              </div>
            )}

            {/* Easy Calc Module */}
            {(activeTab === 'all' ? isModuleEnabled('calc') : activeTab === 'calc') && (
              <div id="section-calc">
                <EasyCalcSection />
              </div>
            )}

          </div>

        </div>
      </section>

      {/* 3. Featured Platforms Showcase (NebeluRw Ecosystem) */}
      <section className="py-12 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-4 py-1.5 rounded-full border border-sky-100">
                Portfolio Platforms
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                Explore NebeluRw Digital Ecosystem
              </h2>
            </div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 text-sky-600 font-bold text-xs sm:text-sm hover:text-sky-700 transition-colors"
            >
              <span>View All Platforms</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass-card rounded-3xl p-6 h-80 animate-pulse bg-slate-200/50" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 glass-card rounded-3xl">
              <p className="text-slate-500 font-medium">No featured projects found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard3D key={project.id} project={project} />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* AdSense Unit */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
        <AdSenseUnit className="w-full" />
      </div>

      {/* 4. Introduction to NebeluRw & Company Story */}
      <section className="py-16 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            
            <div className="space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-100/70 px-4 py-1.5 rounded-full border border-sky-200">
                About NebeluRw Co. Ltd
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Pioneering Digital Platforms & Media Innovations in Rwanda
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                NebeluRw Co. Ltd is a modern technology company developing scalable web platforms, streaming media infrastructure, audio-visual production, and online business platforms.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Under the leadership of <strong className="text-slate-800">Benir Benjamin</strong>, we build high-impact platforms including Benix Space TV, Benix Radio, Easy Calc, and Voxify.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  'Scalable Full-Stack Engineering',
                  'High-Performance Streaming',
                  'SEO & Digital Growth Strategy',
                  'Music Distribution Ecosystem'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white font-semibold text-xs shadow-md hover:bg-sky-600 transition-colors"
                >
                  <span>Read Full Company Story</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Leadership Spotlight Box */}
            <div className="glass-card bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 font-bold text-xl">
                  BB
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Benir Benjamin</h3>
                  <span className="text-xs font-semibold text-sky-600">Founder & Managing Director — NebeluRw Co. Ltd</span>
                </div>
              </div>
              <p className="text-slate-600 text-xs italic leading-relaxed">
                "Our vision with BenixSpace is to create a unified digital ecosystem where software, streaming media, and music tools seamlessly empower our communities."
              </p>
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-sky-600" />
                  <a href="mailto:benirabok@gmail.com" className="hover:text-sky-600">benirabok@gmail.com</a>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-sky-600" />
                  <a href="tel:0783987223" className="hover:text-sky-600">0783987223</a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Services Section */}
      <ServicesSection />

      {/* 6. Latest Blog Teaser Section */}
      {articles.length > 0 && (
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-4 py-1.5 rounded-full border border-sky-100">
                  News & Insights
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                  Latest Articles & Updates
                </h2>
              </div>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-sky-600 font-bold text-xs sm:text-sm hover:text-sky-700 transition-colors"
              >
                <span>Browse All Articles</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="glass-card rounded-3xl overflow-hidden border border-slate-200/80 hover:shadow-xl transition-all group flex flex-col justify-between"
                >
                  <div className="p-6 space-y-3">
                    <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                      {article.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2">
                      <Link to={`/blog/${article.slug}`}>{article.title}</Link>
                    </h3>
                    <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>
                  <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-100/60 mt-4">
                    <span className="text-[11px] text-slate-400 font-medium">{article.author_name}</span>
                    <Link
                      to={`/blog/${article.slug}`}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                    >
                      <span>Read More</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};
