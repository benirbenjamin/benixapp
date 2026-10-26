import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppAccessWizardModal } from '../../components/modals/AppAccessWizardModal';
import { WalletModal } from '../../components/modals/WalletModal';
import { SeoHead } from '../../components/common/SeoHead';
import { getAuthToken } from '../../services/api';
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
  ArrowLeft,
  Share2,
  Copy,
  Check,
  X,
  Award
} from 'lucide-react';
import axios from 'axios';

interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  category: string;
  seller: string;
  sellerId?: string;
  rating: number;
  downloads: number;
  badge?: string;
  image_url?: string;
  imageUrl?: string;
  gallery_urls?: string[];
  isNewArrival?: boolean;
  commission_pct?: number;
  listingType?: 'product' | 'service';
  priceRange?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'Software & Code', label: 'Software & Code' },
  { id: 'Design & Graphics', label: 'Design & UI Kits' },
  { id: 'Services & Freelance', label: 'Tech Services' },
  { id: 'Creative & Audio', label: 'Creative & Audio' },
  { id: 'Business & Finance', label: 'Business Tools' }
];

export const MarketplacePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user, wallet, hasAppProfile } = useAuth();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [wizardTarget, setWizardTarget] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [shareProduct, setShareProduct] = useState<MarketItem | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Sync category or search query from URL parameters
  useEffect(() => {
    const cat = searchParams.get('category') || searchParams.get('cat');
    const q = searchParams.get('q') || searchParams.get('query');
    if (cat) {
      setSelectedCategory(cat);
    }
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Sell Item Modal State
  const [showSellModal, setShowSellModal] = useState<boolean>(false);
  const [listingType, setListingType] = useState<'product' | 'service'>('product');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState<number | string>(15000);
  const [newOldPrice, setNewOldPrice] = useState<number | string>(20000);
  const [newCategory, setNewCategory] = useState('Software & Code');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newGalleryUrls, setNewGalleryUrls] = useState('');
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [affiliateCommissionPct, setAffiliateCommissionPct] = useState<number>(10);
  const [servicePriceRange, setServicePriceRange] = useState('50,000 - 150,000 RWF');
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    axios
      .get('/api/modules/marketplace/items')
      .then((res) => {
        if (res.data?.items && Array.isArray(res.data.items)) {
          setItems(res.data.items);
        } else if (res.data?.products && Array.isArray(res.data.products)) {
          setItems(res.data.products);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleProtectedAction = async (item: MarketItem) => {
    if (!user || !hasAppProfile('marketplace')) {
      setWizardTarget('marketplace');
      return;
    }

    const totalBal = (wallet?.balance || 0) + (wallet?.bonus_balance || 0);
    if (totalBal < item.price) {
      setShowWalletModal(true);
      return;
    }

    try {
      const token = getAuthToken();
      const ref = localStorage.getItem('benix_ref') || '';
      const res = await axios.post(
        '/api/modules/marketplace/buy',
        { productId: item.id, ref },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      setActionSuccess(res.data?.message || `Purchased "${item.title}" successfully! Check your downloads.`);
      setTimeout(() => setActionSuccess(''), 5000);
      fetchItems();
    } catch (err: any) {
      setActionSuccess(err.response?.data?.error || `Order initiated for "${item.title}".`);
      setTimeout(() => setActionSuccess(''), 4000);
    }
  };

  const getAffiliateShareLink = (item: MarketItem) => {
    const refParam = user?.referral_code || user?.id || 'BENIX-STORE';
    return `${window.location.origin}/marketplace?ref=${refParam}&item=${item.id}`;
  };

  const handleCopyLink = (item: MarketItem) => {
    navigator.clipboard.writeText(getAffiliateShareLink(item));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCreateListing = () => {
    if (!user || !hasAppProfile('marketplace')) {
      setWizardTarget('marketplace');
      return;
    }
    setShowSellModal(true);
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setWizardTarget('marketplace');
      return;
    }
    if (!newTitle.trim() || Number(newPrice) < 0) {
      alert('Please fill in title and price.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const galleryList = newGalleryUrls
        .split(',')
        .map((u) => u.trim())
        .filter((u) => u.startsWith('http'));

      const res = await axios.post(
        '/api/modules/marketplace/publish',
        {
          type: listingType,
          title: newTitle.trim(),
          description: newDescription.trim(),
          price: listingType === 'service' ? (isNegotiable ? 0 : Number(newPrice) || 0) : Number(newPrice) || 0,
          oldPrice: listingType === 'product' && Number(newOldPrice) > Number(newPrice) ? Number(newOldPrice) : undefined,
          category: newCategory,
          featuredImage: newImageUrl.trim() || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
          galleryImages: galleryList,
          isNewArrival: listingType === 'product' ? isNewArrival : false,
          affiliateCommissionPct: Number(affiliateCommissionPct) || 10,
          priceRange: listingType === 'service' ? (isNegotiable ? 'Negotiable' : servicePriceRange) : undefined,
          isNegotiable
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );

      if (res.data?.item) {
        setItems((prev) => [res.data.item, ...prev]);
        setShowSellModal(false);
        setNewTitle('');
        setNewDescription('');
        setNewImageUrl('');
        setActionSuccess('🎉 Your product has been listed on Benix Marketplace!');
        setTimeout(() => setActionSuccess(''), 5000);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to list item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.seller || '').toLowerCase().includes(searchQuery.toLowerCase());

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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
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

          <button
            onClick={handleCreateListing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>List Product or Service</span>
          </button>
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
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading marketplace items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#131926] border border-slate-800 space-y-3">
            <ShoppingBag className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No Items Listed in Marketplace Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Be the first creator or developer in Rwanda to sell software, templates, design kits, or consulting services!
            </p>
            <button
              onClick={handleCreateListing}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Item</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group rounded-3xl bg-[#131926] border border-slate-800/80 hover:border-emerald-500/50 p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-950/20 flex flex-col justify-between"
              >
                <div>
                  {/* Item Image with Badges */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-black mb-4">
                    <img
                      src={item.imageUrl || item.image_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/75 backdrop-blur-sm text-emerald-400 border border-emerald-500/30">
                        {item.category}
                      </span>
                      {item.listingType === 'service' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-md">
                          Service
                        </span>
                      )}
                      {(item.isNewArrival || item.badge === 'New Arrival') && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md">
                          ✨ New Arrival
                        </span>
                      )}
                    </div>

                    {/* Auto Discount Badge */}
                    {item.oldPrice && item.oldPrice > item.price && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-600 text-white shadow-lg shadow-rose-600/30">
                        -{Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-base text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300 truncate max-w-[140px]">{item.seller}</span>
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{item.rating || 5.0}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Price & Purchase or Book Service */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      {item.listingType === 'service' ? 'Service Rate' : 'Price'}
                    </span>
                    {item.listingType === 'service' ? (
                      <span className="text-sm font-black text-white">
                        {item.priceRange || (item.price ? `${item.price.toLocaleString()} RWF` : 'Negotiable')}
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-white">
                          {(item.price || 0).toLocaleString()} <span className="text-xs text-emerald-400 font-bold">RWF</span>
                        </span>
                        {item.oldPrice && item.oldPrice > item.price && (
                          <span className="text-xs text-slate-500 line-through">
                            {item.oldPrice.toLocaleString()} RWF
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShareProduct(item)}
                      className="p-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-300 transition-colors"
                      title="Share & Earn Affiliate Commission"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {item.listingType === 'service' ? (
                      <Link
                        to={`/messages?chatWith=${encodeURIComponent(item.sellerId || item.seller)}&topic=${encodeURIComponent(`Service: ${item.title}`)}`}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                      >
                        Book & Deal
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleProtectedAction(item)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Buy Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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

      {/* List Product Modal */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121824] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>List a Product or Tech Service</span>
              </h3>
              <button onClick={() => setShowSellModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSellSubmit} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern React Native Starter Template"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe what the buyer gets..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Price (RWF) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Software & Code">Software & Code</option>
                    <option value="Design & Graphics">Design & UI Kits</option>
                    <option value="Services & Freelance">Tech Services</option>
                    <option value="Creative & Audio">Creative & Audio</option>
                    <option value="Business & Finance">Business Tools</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Preview Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://... cover image link"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'List Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Share & Earn Affiliate Modal */}
      {shareProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#121824] border border-slate-700 shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Share & Earn 10% Commission</h3>
                  <p className="text-xs text-slate-400">Paid straight to your Real Wallet upon sale</p>
                </div>
              </div>
              <button
                onClick={() => setShareProduct(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#15231D] border border-emerald-500/20 space-y-1">
              <p className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider">Product</p>
              <h4 className="font-bold text-sm text-white line-clamp-1">{shareProduct.title}</h4>
              <p className="text-xs text-slate-400">Price: {shareProduct.price.toLocaleString()} RWF • Earn {Math.round(shareProduct.price * 0.1).toLocaleString()} RWF per sale</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Your Unique Product Affiliate Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getAffiliateShareLink(shareProduct)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0B0E14] border border-slate-700 text-xs text-slate-200 font-mono focus:outline-none"
                />
                <button
                  onClick={() => handleCopyLink(shareProduct)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <p className="text-xs font-semibold text-slate-400">One-Click Share:</p>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Check out "${shareProduct.title}" on Benix Marketplace: ${getAffiliateShareLink(shareProduct)}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <span>WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Get "${shareProduct.title}" on Benix Marketplace: ${getAffiliateShareLink(shareProduct)}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <span>Twitter / X</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Deposit Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  );
};
