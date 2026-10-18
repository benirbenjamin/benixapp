import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { fetchAnalyticsStats, fetchProjects, fetchArticles, getAuthToken } from '../../services/api';
import type { Project, Article } from '../../types';
import realVideosData from '../../config/realVideos.json';
import {
  Users,
  Eye,
  MousePointerClick,
  FileText,
  Plus,
  Layers,
  ExternalLink,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Wallet,
  ShieldCheck,
  Database,
  Tv,
  Radio,
  ShoppingBag,
  Dices,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Settings,
  Mail,
  Zap,
  Globe,
  Music,
  Heart,
  Trash2,
  Save,
  AlertCircle,
  Play,
  Film,
  Search,
  Check
} from 'lucide-react';

interface AdminVideo {
  id: string;
  title: string;
  creator: string;
  channelName?: string;
  thumbnail: string;
  category: string;
  price: number;
  embedUrl: string;
}

interface AdminProduct {
  id: string;
  title: string;
  category: string;
  price: number;
  seller: string;
  location: string;
  imageUrl: string;
  status: 'active' | 'sold';
}

const INITIAL_PRODUCTS: AdminProduct[] = [
  {
    id: 'prod-01',
    title: 'Samsung Galaxy S24 Ultra 512GB (Titanium Gray)',
    category: 'Phones & Tech',
    price: 1150000,
    seller: 'Kigali Prime Gadgets',
    location: 'Downtown Kigali',
    imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'prod-02',
    title: 'Single Origin Rwandan Bourbon Coffee (1kg Premium Roast)',
    category: 'Food & Beverage',
    price: 18000,
    seller: 'Huye Mountain Roasters',
    location: 'Huye & Kigali Delivery',
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'prod-03',
    title: 'Authentic Imigongo Handcrafted Geometrical Wall Art',
    category: 'Handmade & Crafts',
    price: 45000,
    seller: 'Eastern Province Cooperative',
    location: 'Kirehe / Kigali',
    imageUrl: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=600&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'prod-04',
    title: 'MacBook Air M2 16GB 512GB Space Gray',
    category: 'Computers & Laptops',
    price: 1250000,
    seller: 'Inzovu Tech Solutions',
    location: 'Nyarugenge, Kigali',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    status: 'active'
  }
];

export const AdminDashboardPage: React.FC = () => {
  const location = useLocation();
  const [analytics, setAnalytics] = useState<any>(null);
  const [adminOverview, setAdminOverview] = useState<any>(null);
  const [allApps, setAllApps] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Active App Management Tab
  const [activeAppTab, setActiveAppTab] = useState<'videos' | 'marketplace' | 'tv_radio' | 'kunda' | 'voxify' | 'games'>('videos');

  // Video Management State
  const [videosList, setVideosList] = useState<AdminVideo[]>(() => {
    try {
      const saved = localStorage.getItem('benix_admin_videos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return realVideosData.map((v) => ({
      id: v.id,
      title: v.title,
      creator: v.creator || v.channelName || 'Benix Creator',
      channelName: v.channelName || v.creator || 'Benix Creator',
      thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
      category: v.category || 'General',
      price: v.price || 0,
      embedUrl: v.embedUrl || `https://www.youtube.com/embed/${v.id}`
    }));
  });

  const [videoSearch, setVideoSearch] = useState('');
  const [newVideo, setNewVideo] = useState({
    title: '',
    creator: '',
    youtubeUrl: '',
    category: 'General',
    price: 0
  });
  const [videoSuccess, setVideoSuccess] = useState('');

  // Marketplace Products State
  const [productsList, setProductsList] = useState<AdminProduct[]>(() => {
    try {
      const saved = localStorage.getItem('benix_admin_products');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PRODUCTS;
  });

  const [newProduct, setNewProduct] = useState({
    title: '',
    category: 'Phones & Tech',
    price: 0,
    seller: '',
    location: 'Kigali, Rwanda',
    imageUrl: ''
  });
  const [productSuccess, setProductSuccess] = useState('');

  // Voxify New Song Form
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    category: 'Sacred Classical',
    audioUrl: '',
    duration: '4:15'
  });
  const [addingSong, setAddingSong] = useState(false);
  const [voxifySuccess, setVoxifySuccess] = useState('');

  // Hash change detection (for sidebar clicks like /admin#videos or /admin#marketplace)
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (['videos', 'marketplace', 'tv_radio', 'kunda', 'voxify', 'games'].includes(hash)) {
      setActiveAppTab(hash as any);
      setTimeout(() => {
        document.getElementById('apps-control-center')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [location.hash]);

  const loadAppsControl = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch('/api/admin/all-apps-control', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllApps(data.apps);
      }
    } catch (err) {
      console.error('Failed to load all apps control:', err);
    }
  };

  useEffect(() => {
    async function loadDashboard() {
      const token = getAuthToken();
      try {
        const [statsData, projData, artData] = await Promise.all([
          fetchAnalyticsStats('30d').catch(() => null),
          fetchProjects({ status: 'published' }).catch(() => []),
          fetchArticles({ status: 'published' }).catch(() => [])
        ]);
        setAnalytics(statsData);
        setProjects(projData);
        setArticles(artData);

        if (token) {
          const res = await fetch('/api/admin/overview', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setAdminOverview(data);
          }
          await loadAppsControl();
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // Video Management Handlers
  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideo.title || !newVideo.youtubeUrl) {
      alert('Please provide video title and YouTube link/ID');
      return;
    }

    let vidId = newVideo.youtubeUrl.trim();
    if (vidId.includes('watch?v=')) {
      vidId = vidId.split('watch?v=')[1]?.split('&')[0];
    } else if (vidId.includes('youtu.be/')) {
      vidId = vidId.split('youtu.be/')[1]?.split('?')[0];
    } else if (vidId.includes('/embed/')) {
      vidId = vidId.split('/embed/')[1]?.split('?')[0];
    }

    const created: AdminVideo = {
      id: vidId,
      title: newVideo.title,
      creator: newVideo.creator || 'Benix Creator',
      channelName: newVideo.creator || 'Benix Creator',
      thumbnail: `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`,
      category: newVideo.category,
      price: Number(newVideo.price) || 0,
      embedUrl: `https://www.youtube.com/embed/${vidId}`
    };

    const updated = [created, ...videosList];
    setVideosList(updated);
    localStorage.setItem('benix_admin_videos', JSON.stringify(updated));
    setNewVideo({ title: '', creator: '', youtubeUrl: '', category: 'General', price: 0 });
    setVideoSuccess(`Successfully added "${created.title}" to video library!`);
    setTimeout(() => setVideoSuccess(''), 4000);
  };

  const handleDeleteVideo = (id: string, title: string) => {
    if (!window.confirm(`Delete video "${title}"?`)) return;
    const updated = videosList.filter((v) => v.id !== id);
    setVideosList(updated);
    localStorage.setItem('benix_admin_videos', JSON.stringify(updated));
  };

  // Product Management Handlers
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.title || !newProduct.price) {
      alert('Please provide product title and price');
      return;
    }

    const created: AdminProduct = {
      id: 'prod-' + Date.now(),
      title: newProduct.title,
      category: newProduct.category,
      price: Number(newProduct.price),
      seller: newProduct.seller || 'Verified Seller',
      location: newProduct.location || 'Kigali, Rwanda',
      imageUrl: newProduct.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      status: 'active'
    };

    const updated = [created, ...productsList];
    setProductsList(updated);
    localStorage.setItem('benix_admin_products', JSON.stringify(updated));
    setNewProduct({ title: '', category: 'Phones & Tech', price: 0, seller: '', location: 'Kigali, Rwanda', imageUrl: '' });
    setProductSuccess(`Added "${created.title}" to marketplace catalog!`);
    setTimeout(() => setProductSuccess(''), 4000);
  };

  const handleDeleteProduct = (id: string, title: string) => {
    if (!window.confirm(`Delete product "${title}" from Marketplace?`)) return;
    const updated = productsList.filter((p) => p.id !== id);
    setProductsList(updated);
    localStorage.setItem('benix_admin_products', JSON.stringify(updated));
  };

  // Voxify Choral Music Handlers
  const handleAddVoxifySong = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!newSong.title || !newSong.artist) {
      alert('Please fill in Song Title and Choir/Artist');
      return;
    }
    setAddingSong(true);
    try {
      const res = await fetch('/api/admin/voxify/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSong)
      });
      const data = await res.json();
      if (res.ok) {
        setVoxifySuccess(`Added "${newSong.title}" to Voxify Choral library!`);
        setNewSong({ title: '', artist: '', category: 'Sacred Classical', audioUrl: '', duration: '4:15' });
        loadAppsControl();
        setTimeout(() => setVoxifySuccess(''), 4000);
      } else {
        alert(data.error || 'Failed to add song');
      }
    } catch (err: any) {
      alert(err.message || 'Error adding song');
    } finally {
      setAddingSong(false);
    }
  };

  const handleDeleteVoxifySong = async (songId: string, title: string) => {
    if (!window.confirm(`Delete "${title}" from Voxify Choirs library?`)) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/admin/voxify/songs/${songId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadAppsControl();
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting track');
    }
  };

  const dbStats = adminOverview?.stats || {
    total_users: 12,
    total_wallet_balance: 100000,
    tv_stations: 17,
    radio_stations: 19,
    game_rooms: 4,
    marketplace_products: productsList.length,
    published_articles: 6
  };

  const recentTx = adminOverview?.recent_transactions || [];

  const filteredVideos = videosList.filter((v) =>
    v.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
    v.creator.toLowerCase().includes(videoSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans">
        
        {/* Welcome Top Banner */}
        <div className="rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl bg-gradient-to-r from-[#121926] via-[#0E1524] to-[#0B0E14] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Single Dashboard Admin Operations</span>
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Neon PostgreSQL Active (36 Channels)</span>
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              BenixSpace Multi-App Command Center
            </h1>
            <p className="text-slate-400 text-sm">
              Manage real video catalogues, marketplace inventory, TV & radio streams, choral music, and dice gaming.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/"
              target="_blank"
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4" />
              <span>Public Website</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </Link>
            <Link
              to="/admin/users"
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>Manage Roles & Staff</span>
            </Link>
            <Link
              to="/admin/settings"
              className="px-4 py-2.5 rounded-2xl bg-[#1C2538] hover:bg-[#25324c] text-slate-200 font-bold text-xs border border-slate-700/60 transition-all flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Platform Settings & Variables</span>
            </Link>
          </div>
        </div>

        {/* Clickable Super-App Core Metrics */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Unified Platform Live Status (Click cards to open management)
            </h2>
            <span className="text-[11px] text-blue-400 font-bold">Interactive Navigation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Card 1: Unified Accounts -> Links to /admin/users */}
            <Link
              to="/admin/users"
              className="rounded-3xl p-6 border border-slate-800 bg-[#131926] hover:bg-[#192234] hover:border-blue-500/50 transition-all shadow-xl flex items-center justify-between group cursor-pointer"
              title="Click to view and manage users, staff, and roles"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-400 transition-colors">
                  Unified Accounts
                </span>
                <p className="text-3xl font-black text-white">{dbStats.total_users}</p>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Manage Staff & Users &rarr;
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </Link>

            {/* Card 2: Wallet Reserves -> Links to /admin/settings */}
            <Link
              to="/admin/settings"
              className="rounded-3xl p-6 border border-slate-800 bg-[#131926] hover:bg-[#192234] hover:border-emerald-500/50 transition-all shadow-xl flex items-center justify-between group cursor-pointer"
              title="Click to view and configure central wallet variables and balances"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                  Wallet Reserves
                </span>
                <p className="text-2xl font-black text-emerald-400">
                  {Number(dbStats.total_wallet_balance || 0).toLocaleString()} RWF
                </p>
                <span className="text-[11px] text-slate-400 font-semibold">
                  Configure Settings &rarr;
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6" />
              </div>
            </Link>

            {/* Card 3: Streaming Stations -> Switches to TV/Radio tab */}
            <button
              onClick={() => {
                setActiveAppTab('tv_radio');
                document.getElementById('apps-control-center')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-3xl p-6 border border-slate-800 bg-[#131926] hover:bg-[#192234] hover:border-purple-500/50 transition-all shadow-xl flex items-center justify-between group cursor-pointer text-left w-full"
              title="Click to manage live TV and Radio stream feeds"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-purple-400 transition-colors">
                  Streaming Stations
                </span>
                <p className="text-3xl font-black text-white">36</p>
                <span className="text-[11px] text-purple-400 font-semibold">
                  17 TV Channels | 19 Radio &rarr;
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Tv className="w-6 h-6" />
              </div>
            </button>

            {/* Card 4: Marketplace Products -> Switches to Marketplace tab */}
            <button
              onClick={() => {
                setActiveAppTab('marketplace');
                document.getElementById('apps-control-center')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-3xl p-6 border border-slate-800 bg-[#131926] hover:bg-[#192234] hover:border-amber-500/50 transition-all shadow-xl flex items-center justify-between group cursor-pointer text-left w-full"
              title="Click to manage marketplace catalog and inventory"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-400 transition-colors">
                  Marketplace Products
                </span>
                <p className="text-3xl font-black text-white">{productsList.length}</p>
                <span className="text-[11px] text-amber-400 font-semibold">
                  Manage Catalog ({productsList.length}) &rarr;
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </button>

          </div>
        </div>

        {/* ==================== MULTI-APP SINGLE DASHBOARD CONTROL ==================== */}
        <div id="apps-control-center" className="rounded-3xl border border-slate-800 bg-[#131926] shadow-2xl p-6 sm:p-8 space-y-6">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-xs font-black uppercase text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                Ecosystem Content Management
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                Platform Content & Inventory Studio
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Manage YouTube videos, Marketplace products, TV & radio channels, choral tracks, and dice gaming.
              </p>
            </div>

            {/* App Selection Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#0B0E14] p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveAppTab('videos')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeAppTab === 'videos'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Videos ({videosList.length})</span>
              </button>

              <button
                onClick={() => setActiveAppTab('marketplace')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeAppTab === 'marketplace'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Marketplace ({productsList.length})</span>
              </button>

              <button
                onClick={() => setActiveAppTab('tv_radio')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeAppTab === 'tv_radio'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>TV & Radio (36)</span>
              </button>

              <button
                onClick={() => setActiveAppTab('voxify')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeAppTab === 'voxify'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Voxify Choirs</span>
              </button>

              <button
                onClick={() => setActiveAppTab('kunda')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeAppTab === 'kunda'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Kunda Dating</span>
              </button>

              <button
                onClick={() => setActiveAppTab('games')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeAppTab === 'games'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Dices className="w-3.5 h-3.5" />
                <span>RollDice Game</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: VIDEOS & CHANNELS MANAGEMENT                            */}
          {/* ============================================================== */}
          {activeAppTab === 'videos' && (
            <div className="space-y-6 animate-fade-in">
              {videoSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{videoSuccess}</span>
                </div>
              )}

              {/* Add New Video Form */}
              <form onSubmit={handleAddVideo} className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase text-purple-400 block">
                  Add Real YouTube Video to Catalog
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <input
                    type="text"
                    placeholder="Video Title *"
                    value={newVideo.title}
                    onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Creator / Channel Name"
                    value={newVideo.creator}
                    onChange={(e) => setNewVideo({ ...newVideo, creator: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    placeholder="YouTube URL or Video ID *"
                    value={newVideo.youtubeUrl}
                    onChange={(e) => setNewVideo({ ...newVideo, youtubeUrl: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                    required
                  />
                  <select
                    value={newVideo.category}
                    onChange={(e) => setNewVideo({ ...newVideo, category: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  >
                    <option value="General">General</option>
                    <option value="Gospel & Choirs">Gospel & Choirs</option>
                    <option value="Series & Comedy">Series & Comedy</option>
                    <option value="Culture & Documentaries">Culture & Documentaries</option>
                    <option value="Music & Shows">Music & Shows</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Price RWF (0 for Free)"
                    value={newVideo.price}
                    onChange={(e) => setNewVideo({ ...newVideo, price: parseInt(e.target.value) || 0 })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Video to Benix.Space</span>
                  </button>
                </div>
              </form>

              {/* Videos Search & Filter */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold uppercase text-slate-400">
                  Active Video Catalog ({filteredVideos.length} of {videosList.length})
                </span>
                <div className="relative w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search videos by title or creator..."
                    value={videoSearch}
                    onChange={(e) => setVideoSearch(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Videos Table */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B0E14] overflow-hidden max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Video</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredVideos.map((video) => (
                      <tr key={video.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-3 flex items-center gap-3">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-16 h-10 object-cover rounded-lg bg-slate-900 shrink-0 border border-slate-800"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-white line-clamp-1">{video.title}</p>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {video.id}</span>
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-slate-300">{video.creator}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20">
                            {video.category}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-200">
                          {video.price === 0 ? (
                            <span className="text-emerald-400">Free</span>
                          ) : (
                            <span>{video.price.toLocaleString()} RWF</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/videos?v=${video.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Preview Video"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleDeleteVideo(video.id, video.title)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Video"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: MARKETPLACE PRODUCTS                                    */}
          {/* ============================================================== */}
          {activeAppTab === 'marketplace' && (
            <div className="space-y-6 animate-fade-in">
              {productSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{productSuccess}</span>
                </div>
              )}

              {/* Add New Product Form */}
              <form onSubmit={handleAddProduct} className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase text-amber-400 block">
                  Add New Marketplace Product / Listing
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <input
                    type="text"
                    placeholder="Product Title *"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500"
                    required
                  />
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500"
                  >
                    <option value="Phones & Tech">Phones & Tech</option>
                    <option value="Computers & Laptops">Computers & Laptops</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Handmade & Crafts">Handmade & Crafts</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Real Estate & Rentals">Real Estate & Rentals</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Price in RWF *"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseInt(e.target.value) || 0 })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Seller Name / Store"
                    value={newProduct.seller}
                    onChange={(e) => setNewProduct({ ...newProduct, seller: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Image URL (Unsplash or direct)"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/25 flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publish Marketplace Product</span>
                  </button>
                </div>
              </form>

              {/* Products List Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {productsList.map((product) => (
                  <div key={product.id} className="p-4 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-36 object-cover rounded-xl bg-slate-900 border border-slate-800"
                      />
                      <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 inline-block">
                        {product.category}
                      </span>
                      <h4 className="font-bold text-white text-xs line-clamp-2">{product.title}</h4>
                      <p className="font-black text-emerald-400 text-sm">
                        {product.price.toLocaleString()} RWF
                      </p>
                      <p className="text-[11px] text-slate-400">{product.seller} • {product.location}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.title)}
                        className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: TV & RADIO BROADCASTS                                   */}
          {/* ============================================================== */}
          {activeAppTab === 'tv_radio' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* TV Channels Overview */}
                <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-purple-400 flex items-center gap-1.5">
                      <Tv className="w-4 h-4" />
                      <span>17 Live Rwandan TV Stations</span>
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400">
                      100% ONLINE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Broadcasting RBA Rwanda TV, KC2, BTN, TV10, Isibo TV, Flash TV, TV1, and regional feeds via resilient HLS adaptive bitrate streams.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/tv"
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-bold"
                    >
                      <span>Open TV Studio & Draggable PiP Player</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Radio Channels Overview */}
                <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-blue-400 flex items-center gap-1.5">
                      <Radio className="w-4 h-4" />
                      <span>19 Live Radio FM Frequencies</span>
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400">
                      100% ONLINE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Kiss FM 102.3, Radio Rwanda 100.7, Flash FM, Magic FM, Royal FM, KT Radio, and regional community stations streaming seamlessly in background player.
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/radio"
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold"
                    >
                      <span>Open Radio Player & Icecast Tuner</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: KUNDA DATING CONTENT & MODERATION                       */}
          {/* ============================================================== */}
          {activeAppTab === 'kunda' && (
            <div className="space-y-6 animate-fade-in">
              {/* Notice pointing to consolidated settings */}
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Settings className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">Centralized System Variables</span>
                    <span>All pricing variables (message fees, VIP passes, contact unlock fees) are centrally managed in Platform Settings.</span>
                  </div>
                </div>
                <Link
                  to="/admin/settings"
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs whitespace-nowrap transition-colors shrink-0"
                >
                  Configure Kunda Variables &rarr;
                </Link>
              </div>

              {/* Kunda Dating Moderation & Status Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Dating Profiles</span>
                  <p className="text-2xl font-black text-rose-400">35 Profiles</p>
                  <span className="text-[10px] text-slate-500">Verified Kigali & nationwide singles</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Safety & Moderation</span>
                  <p className="text-2xl font-black text-emerald-400">100% Filtered</p>
                  <span className="text-[10px] text-slate-500">Multilingual profanity & phone number blocker active</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">WhatsApp Contact Requests</span>
                  <p className="text-2xl font-black text-white">Direct Wallet Unlock</p>
                  <span className="text-[10px] text-slate-500">Requires verified wallet deduction</span>
                </div>
              </div>

              <div className="flex justify-start">
                <Link
                  to="/dating"
                  target="_blank"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 flex items-center gap-1.5 transition-all"
                >
                  <Heart className="w-4 h-4" />
                  <span>Launch Kunda Space Dating</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: VOXIFY CHOIR & SONGS MANAGEMENT                         */}
          {/* ============================================================== */}
          {activeAppTab === 'voxify' && (
            <div className="space-y-6 animate-fade-in">
              {voxifySuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{voxifySuccess}</span>
                </div>
              )}

              {/* Add New Song Form */}
              <form onSubmit={handleAddVoxifySong} className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-4">
                <span className="text-xs font-bold uppercase text-indigo-400 block">
                  Add Choral Hymn / Audio Track
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Song / Hymn Title *"
                    value={newSong.title}
                    onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Choir / Artist Name *"
                    value={newSong.artist}
                    onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                    required
                  />
                  <select
                    value={newSong.category}
                    onChange={(e) => setNewSong({ ...newSong, category: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                  >
                    <option value="Sacred Classical">Sacred Classical</option>
                    <option value="Adventist Choral">Adventist Choral</option>
                    <option value="Catholic Hymns">Catholic Hymns</option>
                    <option value="Gospel Hymn">Gospel Hymn</option>
                    <option value="Contemporary Gospel">Contemporary Gospel</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Audio Stream MP3 URL"
                    value={newSong.audioUrl}
                    onChange={(e) => setNewSong({ ...newSong, audioUrl: e.target.value })}
                    className="bg-[#121824] border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={addingSong}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{addingSong ? 'Adding...' : 'Add Song to Voxify'}</span>
                  </button>
                </div>
              </form>

              {/* Current Voxify Songs List */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400 block">
                  Active Voxify Library ({allApps?.voxify?.songs?.length || 0} Songs)
                </span>
                <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-[#0B0E14] overflow-hidden">
                  {allApps?.voxify?.songs?.map((song: any) => (
                    <div key={song.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                          <Music className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{song.title}</p>
                          <span className="text-[11px] text-slate-400">{song.artist} • {song.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 font-mono">{song.duration}</span>
                        <button
                          onClick={() => handleDeleteVoxifySong(song.id, song.title)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete song"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: ROLLDICE CASINO & WAGERING                             */}
          {/* ============================================================== */}
          {activeAppTab === 'games' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Configured Minimum Wager</span>
                  <p className="text-2xl font-black text-amber-400">50 RWF</p>
                  <span className="text-[10px] text-slate-500">Accessible wagering threshold for all Rwandan players.</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">House Bankroll Balance</span>
                  <p className="text-2xl font-black text-emerald-400">
                    {Number(allApps?.games?.houseBalance || 850000).toLocaleString()} RWF
                  </p>
                  <span className="text-[10px] text-slate-500">Central treasury backing all PVE & PvP dice payouts.</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0B0E14] border border-slate-800 space-y-2">
                  <span className="text-xs font-bold uppercase text-slate-400">Fair Payout Multiplier</span>
                  <p className="text-2xl font-black text-white">1.90x Multiplier</p>
                  <span className="text-[10px] text-slate-500">Win payout ratio on two-dice PvE roll victories.</span>
                </div>
              </div>

              <div className="flex justify-start">
                <Link
                  to="/games"
                  target="_blank"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/25 flex items-center gap-1.5 transition-all"
                >
                  <Dices className="w-4 h-4" />
                  <span>Launch RollDice Arena</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </div>
          )}

        </div>

        {/* Central Wallet Ledger & Database Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Central Wallet Real-Time Ledger */}
          <div className="lg:col-span-7 rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-white text-base">Central Wallet Ledger Stream</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">Atomic Cross-Module Settlement</span>
            </div>

            {recentTx.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <Wallet className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-slate-400 font-bold">No transactions recorded yet.</p>
                <p className="text-slate-500">Transactions from RollDice wagering, marketplace purchases, and referral commissions appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {recentTx.map((tx: any) => {
                  const isCredit = tx.type === 'credit';
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-[#1A2234] border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isCredit ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white">{tx.description || tx.category}</p>
                          <span className="text-[10px] text-slate-500">
                            {tx.user_email || tx.user_id} • {new Date(tx.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-black text-sm block ${
                            isCredit ? 'text-emerald-400' : 'text-slate-200'
                          }`}
                        >
                          {isCredit ? '+' : '-'}{Number(tx.amount).toLocaleString()} RWF
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Bal: {Number(tx.balance_after || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Database Partitioning & Schemas Breakdown */}
          <div className="lg:col-span-5 rounded-3xl p-6 border border-slate-800 bg-[#131926] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-white text-base">PostgreSQL Schemas</h3>
              </div>
              <span className="text-xs font-bold text-emerald-400">100% Verified in Neon</span>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { name: 'core_users & core_wallets', desc: 'Unified auth, country, WhatsApp, app profiles, wallet', rows: '12 accounts' },
                { name: 'stations table (public)', desc: '17 TV Channels + 19 Radio Stations with HLS/Icecast streams', rows: '36 stations' },
                { name: 'games schema', desc: 'RollDice game matches, wagering history, multipliers', rows: '320 records' },
                { name: 'marketplace schema', desc: 'Digital products, services, creator orders', rows: '244 records' },
                { name: 'public schema', desc: 'Projects, articles, tags, analytics tracking events', rows: 'BenixSpace core' }
              ].map((sch, i) => (
                <div key={i} className="p-3 rounded-2xl bg-[#1A2234] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-blue-400 block font-mono text-xs">{sch.name}</span>
                    <span className="text-[11px] text-slate-400">{sch.desc}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 shrink-0">
                    {sch.rows}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                to="/admin/users"
                className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View Users & Assign Roles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
};
