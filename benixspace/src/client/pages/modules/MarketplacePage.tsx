import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppAccessWizardModal } from '../../components/modals/AppAccessWizardModal';
import { WalletModal } from '../../components/modals/WalletModal';
import { SeoHead } from '../../components/common/SeoHead';
import {
  ShoppingBag,
  Tag,
  Star,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  ShieldCheck,
  Package,
  Layers,
  ChevronRight,
  PlusCircle,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';

interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  seller: string;
  rating: number;
  downloads: number;
  badge?: string;
}

const SAMPLE_MARKET_ITEMS: MarketItem[] = [
  {
    id: 'mp1',
    title: 'Modern Super-App React & Vite Template',
    description: 'Production-ready starter repository with Tailwind CSS, dark mode, authentication hooks, and Neon DB integration.',
    price: 35000,
    category: 'Software & Code',
    seller: 'Benix Tech Studio',
    rating: 4.9,
    downloads: 142,
    badge: 'BESTSELLER'
  },
  {
    id: 'mp2',
    title: 'Rwandan High-Resolution Brand Identity UI Kit',
    description: 'Figma component library tailored for East African fintech, media, and e-commerce web applications.',
    price: 25000,
    category: 'Design & Graphics',
    seller: 'Kigali Visuals Lab',
    rating: 4.8,
    downloads: 89,
    badge: 'POPULAR'
  },
  {
    id: 'mp3',
    title: 'Full-Stack Web App Development (1 Week Sprint)',
    description: 'Custom React & Node.js web development service delivered with tested APIs, responsive layouts, and cloud deployment.',
    price: 250000,
    category: 'Services & Freelance',
    seller: 'Verified Benix Partner',
    rating: 5.0,
    downloads: 34
  },
  {
    id: 'mp4',
    title: 'Professional Audio Mixing & Gospel Mastering',
    description: 'Studio acoustic master for choir performances, choral multitrack balancing, and vocal clarity enhancement.',
    price: 45000,
    category: 'Creative & Audio',
    seller: 'Voxify Audio Pro',
    rating: 4.9,
    downloads: 67
  },
  {
    id: 'mp5',
    title: 'Rwanda Small Business Tax & Accounting Toolkit',
    description: 'Pre-formatted Excel and Google Sheets models for PAYE payroll, VAT declaration, and cash flow tracking.',
    price: 18000,
    category: 'Business & Finance',
    seller: 'EasyCalc Solutions',
    rating: 4.7,
    downloads: 215,
    badge: 'ESSENTIAL'
  },
  {
    id: 'mp6',
    title: 'SEO Audit & Regional Search Engine Ranking Package',
    description: 'Comprehensive keyword audit, Google Search Console indexing, backlink profiling, and speed optimization.',
    price: 80000,
    category: 'Services & Freelance',
    seller: 'Benix SEO Guild',
    rating: 4.9,
    downloads: 51
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'Software & Code', label: 'Software & Code' },
  { id: 'Design & Graphics', label: 'Design & UI Kits' },
  { id: 'Services & Freelance', label: 'Tech Services' },
  { id: 'Creative & Audio', label: 'Creative & Audio' },
  { id: 'Business & Finance', label: 'Business Tools' }
];

export const MarketplacePage: React.FC = () => {
  const { user, wallet, hasAppProfile } = useAuth();
  const [wizardTarget, setWizardTarget] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  const handleProtectedAction = (item: MarketItem) => {
    if (!user || !hasAppProfile('marketplace')) {
      setWizardTarget('marketplace');
      return;
    }

    if ((wallet?.balance || 0) < item.price) {
      setShowWalletModal(true);
      return;
    }

    setActionSuccess(`Order initiated for "${item.title}". Check your downloads.`);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleCreateListing = () => {
    if (!user || !hasAppProfile('marketplace')) {
      setWizardTarget('marketplace');
      return;
    }
    setActionSuccess('Creator dashboard opened. Upload your digital product files.');
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const filteredItems = SAMPLE_MARKET_ITEMS.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="bg-[#0B0E14] text-slate-100 min-h-screen pb-24 font-sans selection:bg-emerald-600 selection:text-white">
      <SeoHead
        title="Benix Marketplace — Digital Goods, Store & Tech Services"
        description="Buy and sell digital assets, design kits, source code, and professional tech services in Rwanda using your central BenixSpace wallet."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* Prominent Back to Home Button */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#121824] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all hover:scale-105 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 bg-[#121824] px-3 py-1.5 rounded-xl border border-slate-800">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Direct Rwandan Marketplace</span>
          </span>
        </div>

        {/* Top Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-[#0c2419] via-[#091a12] to-[#0B0E14] shadow-2xl p-6 sm:p-10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-72 h-72 rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Benix Marketplace
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Direct Wallet Settlement
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                  Instant Digital Delivery
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Digital Products, Tools & <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-300 bg-clip-text text-transparent">
                  Professional Services Store
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Empowering creators, software engineers, and businesses. Buy verified digital downloads, source templates, and book freelance tech services.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleCreateListing}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 flex items-center gap-2.5 transition-all transform active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  List a Product or Service
                </button>
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="px-5 py-3.5 rounded-2xl bg-[#15231D] hover:bg-[#1c3027] text-emerald-300 font-semibold text-sm border border-emerald-500/30 flex items-center gap-2 transition-all"
                >
                  <DollarSign className="w-4 h-4" />
                  Wallet: {(wallet?.balance || 0).toLocaleString()} RWF
                </button>
              </div>
            </div>

            {/* Marketplace Buyer Protection Card */}
            <div className="w-full md:w-80 p-5 rounded-2xl bg-[#11241C]/90 border border-emerald-500/30 shadow-2xl backdrop-blur-md space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Escrow Protection</h4>
                  <p className="text-[11px] text-slate-400">Funds released upon delivery</p>
                </div>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified seller identity</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant ZIP & license key download</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zero hidden payment gateway fees</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Search & Category Filter */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-[#131926] text-slate-400 hover:text-white hover:bg-[#1a2234] border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#131926] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl bg-[#131926] border border-slate-800/80 hover:border-emerald-500/50 p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-950/20 flex flex-col justify-between"
            >
              <div>
                {/* Top Badges */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.category}
                  </span>

                  {item.badge && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 shadow-md">
                      {item.badge}
                    </span>
                  )}
                </div>

                <h3 className="font-black text-base text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">{item.seller}</span>
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{item.rating}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Price & Purchase */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Price</span>
                  <span className="text-xl font-black text-white">
                    {item.price.toLocaleString()} <span className="text-xs text-emerald-400 font-bold">RWF</span>
                  </span>
                </div>

                <button
                  onClick={() => handleProtectedAction(item)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Non-Logged In Callout Banner */}
        {!user && (
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#131926] to-teal-950/60 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-lg font-black text-white">Open your Benix Marketplace Account</h3>
              <p className="text-xs text-slate-400">
                Register in seconds to download digital tools, hire certified Rwandan developers, or start selling your own software and designs.
              </p>
            </div>
            <button
              onClick={() => setWizardTarget('marketplace')}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 whitespace-nowrap transition-all"
            >
              Sign Up in 10 Seconds
            </button>
          </div>
        )}

      </div>

      {/* Access Wizard Modal for Marketplace Requirements */}
      <AppAccessWizardModal
        isOpen={!!wizardTarget}
        targetAppKey={wizardTarget}
        onClose={() => setWizardTarget(null)}
        onSuccess={() => {
          setWizardTarget(null);
          setActionSuccess('Your Marketplace role and profile are active!');
          setTimeout(() => setActionSuccess(''), 5000);
        }}
      />

      {/* Wallet Deposit Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  );
};
