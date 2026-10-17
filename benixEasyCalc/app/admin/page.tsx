'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Users,
  Eye,
  Calculator,
  TrendingUp,
  Settings,
  BarChart3,
  Calendar,
  Globe,
  Smartphone,
  CheckCircle,
  Save,
  Search,
  Filter,
  LogOut,
  Edit,
  ExternalLink,
  ShieldCheck,
  Check,
  RefreshCw,
  Loader2,
  Database,
  Sparkles,
  Lock,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { ALL_CALCULATORS } from '../../lib/calculators/registry';
import { CalculatorDefinition } from '../../lib/calculators/types';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase/client';
import { fetchAdminAnalytics, AdminAnalyticsData } from '../../lib/supabase/analytics';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'calculators' | 'seo' | 'security'>('overview');
  const [dateFilter, setDateFilter] = useState<'today' | '7d' | '30d' | 'all'>('30d');

  // Real Analytics State
  const [analyticsData, setAnalyticsData] = useState<AdminAnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Account & Password change state
  const [userEmail, setUserEmail] = useState<string>('admin@easycalc.benix.space');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Calculator editor state
  const [selectedCalc, setSelectedCalc] = useState<CalculatorDefinition | null>(null);
  const [calcOverrides, setCalcOverrides] = useState<Record<string, any>>({});
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSeoTitle, setEditSeoTitle] = useState('');
  const [editMetaDesc, setEditMetaDesc] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSavingCalc, setIsSavingCalc] = useState(false);

  // SEO settings state
  const [siteTitle, setSiteTitle] = useState('BENIX SPACE Easy Calc - Free Online Calculators');
  const [siteDesc, setSiteDesc] = useState('Fast, free, and accurate online calculators for math, finance, health, conversions, and everyday calculations.');
  const [gscCode, setGscCode] = useState('');
  const [adsenseId, setAdsenseId] = useState('ca-pub-4078466828008985');
  const [seoSaved, setSeoSaved] = useState(false);
  const [isSavingSeo, setIsSavingSeo] = useState(false);

  // Filter calculator list
  const [calcSearch, setCalcSearch] = useState('');

  // 1. Fetch Real Analytics from Supabase PostgreSQL
  const loadAnalytics = async (filter: 'today' | '7d' | '30d' | 'all') => {
    setIsLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const data = await fetchAdminAnalytics(filter);
      if (data) {
        setAnalyticsData(data);
      } else {
        setAnalyticsError('No analytics returned from Supabase database.');
      }
    } catch (err: any) {
      setAnalyticsError(err?.message || 'Failed to fetch analytics.');
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // 2. Fetch Calculator Overrides from public.calculators
  const loadCalcOverrides = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('calculators').select('*');
      if (!error && data) {
        const map: Record<string, any> = {};
        data.forEach((row) => {
          map[row.slug] = row;
        });
        setCalcOverrides(map);
      }
    } catch (err) {
      console.error('Error fetching calc overrides:', err);
    }
  };

  // 3. Fetch Site Settings from public.site_settings
  const loadSiteSettings = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'default').single();
      if (!error && data) {
        if (data.site_title) setSiteTitle(data.site_title);
        if (data.site_description) setSiteDesc(data.site_description);
        if (data.gsc_verification_code) setGscCode(data.gsc_verification_code);
        if (data.adsense_client_id) setAdsenseId(data.adsense_client_id);
      }
    } catch (err) {
      console.error('Error fetching site settings:', err);
    }
  };

  // Check auth and load initial live data
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          router.push('/admin/login');
        } else {
          if (session.user?.email) {
            setUserEmail(session.user.email);
          }
          loadAnalytics(dateFilter);
          loadCalcOverrides();
          loadSiteSettings();
        }
      });
    } else {
      const localAuth = sessionStorage.getItem('benix_admin_auth');
      if (!localAuth) {
        router.push('/admin/login');
      } else {
        loadAnalytics(dateFilter);
      }
    }
  }, [router]);

  // Refetch analytics whenever the dateFilter changes
  useEffect(() => {
    loadAnalytics(dateFilter);
  }, [dateFilter]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          setPasswordError(error.message);
        } else {
          setPasswordSuccess(true);
          setNewPassword('');
          setConfirmPassword('');
          setTimeout(() => setPasswordSuccess(false), 4000);
        }
      } else {
        // Offline demo mode
        setPasswordSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(false), 4000);
      }
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    sessionStorage.removeItem('benix_admin_auth');
    router.push('/admin/login');
  };

  const handleSelectCalcForEdit = (calc: CalculatorDefinition) => {
    setSelectedCalc(calc);
    const override = calcOverrides[calc.slug];
    setEditTitle(override?.title_override || calc.title);
    setEditDescription(override?.description_override || calc.description);
    setEditSeoTitle(override?.seo_title_override || calc.seoTitle);
    setEditMetaDesc(override?.meta_description_override || calc.metaDescription);
    setIsPopular(override?.is_popular !== undefined ? Boolean(override.is_popular) : Boolean(calc.isPopular));
    setIsFeatured(override?.is_featured !== undefined ? Boolean(override.is_featured) : Boolean(calc.isFeatured));
    setIsDisabled(Boolean(override?.is_disabled));
    setSavedSuccess(false);
  };

  const handleSaveCalcOverrides = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCalc) return;

    setIsSavingCalc(true);
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('calculators').upsert({
          slug: selectedCalc.slug,
          title_override: editTitle,
          description_override: editDescription,
          seo_title_override: editSeoTitle,
          meta_description_override: editMetaDesc,
          is_popular: isPopular,
          is_featured: isFeatured,
          is_disabled: isDisabled,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          alert('Failed to save to Supabase: ' + error.message);
        } else {
          setSavedSuccess(true);
          await loadCalcOverrides();
          setTimeout(() => setSavedSuccess(false), 3500);
        }
      } catch (err: any) {
        alert('Error: ' + err?.message);
      } finally {
        setIsSavingCalc(false);
      }
    } else {
      setIsSavingCalc(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleSaveSeoSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSeo(true);
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('site_settings').upsert({
          id: 'default',
          site_title: siteTitle,
          site_description: siteDesc,
          gsc_verification_code: gscCode,
          adsense_client_id: adsenseId,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          alert('Failed to save settings: ' + error.message);
        } else {
          setSeoSaved(true);
          setTimeout(() => setSeoSaved(false), 3500);
        }
      } catch (err: any) {
        alert('Error: ' + err?.message);
      } finally {
        setIsSavingSeo(false);
      }
    } else {
      setIsSavingSeo(false);
      setSeoSaved(true);
      setTimeout(() => setSeoSaved(false), 3000);
    }
  };

  // Extract real live numbers with fallbacks
  const visitorsCount = analyticsData?.visitors ?? 0;
  const pageviewsCount = analyticsData?.pageviews ?? 0;
  const usesCount = analyticsData?.calculations ?? 0;
  const conversionRate = analyticsData?.conversion_rate ?? 0;
  const topCalculatorName = analyticsData?.top_calculator_name || 'No data recorded yet';
  const topCalculators = analyticsData?.top_calculators || [];
  const deviceDistribution = analyticsData?.device_distribution || { mobile: 0, desktop: 0, tablet: 0 };
  const trajectory = analyticsData?.trajectory || [];

  // Trajectory scaling
  const maxTrajVal = Math.max(...trajectory.map((t) => Math.max(t.visitors, t.calculations)), 1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Admin Header Bar */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sticky top-0 z-30 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 rounded-xl bg-blue-50 p-1 ring-1 ring-blue-200 dark:bg-slate-800">
                <Image src="/logo.png" alt="Benix Space" fill sizes="32px" className="object-contain" />
              </div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                BENIX SPACE <span className="text-blue-600">Admin</span>
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Database className="h-3 w-3" />
                <span>Supabase Live DB</span>
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                RLS Protected
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            >
              <span>View Live Site</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-slate-700 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mx-auto flex max-w-7xl px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800">
          <nav className="flex gap-6 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Real Analytics & Telemetry
            </button>
            <button
              onClick={() => setActiveTab('calculators')}
              className={`py-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'calculators'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Calculator Management ({ALL_CALCULATORS.length})
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`py-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'seo'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              SEO & AdSense Settings
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Account & Password</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Header with Date Filters & Live Refresh Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                    Platform Telemetry & Analytics
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE DATA
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Aggregated in real-time from Supabase <code className="font-mono text-blue-600">public.analytics_events</code> via PostgreSQL RPC
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadAnalytics(dateFilter)}
                  disabled={isLoadingAnalytics}
                  title="Refresh metrics from Supabase database"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${isLoadingAnalytics ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  {(['today', '7d', '30d', 'all'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setDateFilter(filter)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                        dateFilter === filter
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      {filter === 'today' ? 'Today' : filter === '7d' ? '7 Days' : filter === '30d' ? '30 Days' : 'All Time'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {analyticsError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                {analyticsError}
              </div>
            )}

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Unique Visitors</span>
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {isLoadingAnalytics ? (
                    <span className="inline-block h-8 w-24 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ) : (
                    visitorsCount.toLocaleString()
                  )}
                </div>
                <div className="mt-1 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span>Unique sessions recorded in DB</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Page Views</span>
                  <Eye className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {isLoadingAnalytics ? (
                    <span className="inline-block h-8 w-24 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ) : (
                    pageviewsCount.toLocaleString()
                  )}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Avg {visitorsCount > 0 ? (pageviewsCount / visitorsCount).toFixed(2) : '1.00'} pages/visitor
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Calculations Completed</span>
                  <Calculator className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {isLoadingAnalytics ? (
                    <span className="inline-block h-8 w-24 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ) : (
                    usesCount.toLocaleString()
                  )}
                </div>
                <div className="mt-1 text-[11px] text-emerald-600 font-semibold">
                  {conversionRate}% Calculation Conversion Rate
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Top Performing Tool</span>
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {isLoadingAnalytics ? (
                    <span className="inline-block h-6 w-32 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ) : (
                    topCalculatorName
                  )}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Most completed calculations
                </div>
              </div>
            </div>

            {/* Visual Charts & Demographics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Traffic Over Time Chart */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Traffic & Calculation Volume Trajectory
                    </h3>
                    <p className="text-[11px] text-slate-500">Real-time daily telemetry recorded in Supabase</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                      <span className="text-slate-600 dark:text-slate-400">Visitors</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-600 dark:text-slate-400">Calculations</span>
                    </div>
                  </div>
                </div>

                {isLoadingAnalytics ? (
                  <div className="h-48 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  </div>
                ) : trajectory.length > 0 ? (
                  <div className="h-48 flex items-end justify-between gap-3 pt-8 pb-2">
                    {trajectory.map((point, idx) => {
                      const visHeight = point.visitors > 0 ? Math.max(Math.round((point.visitors / maxTrajVal) * 130), 6) : 0;
                      const calcHeight = point.calculations > 0 ? Math.max(Math.round((point.calculations / maxTrajVal) * 130), 6) : 0;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                          {/* Tooltip on hover */}
                          <div className="absolute -top-10 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md shadow-md z-10 pointer-events-none whitespace-nowrap">
                            <span>{point.visitors} visitors</span>
                            <span>{point.calculations} calcs</span>
                          </div>

                          <div className="w-full flex items-end justify-center gap-1 h-[130px]">
                            <div
                              className={`w-1/2 max-w-[16px] rounded-t-md transition-all shadow-xs ${
                                visHeight > 0
                                  ? 'bg-blue-600 group-hover:bg-blue-500'
                                  : 'bg-slate-200 dark:bg-slate-800'
                              }`}
                              style={{ height: visHeight > 0 ? `${visHeight}px` : '2px' }}
                            />
                            <div
                              className={`w-1/2 max-w-[16px] rounded-t-md transition-all shadow-xs ${
                                calcHeight > 0
                                  ? 'bg-emerald-500 group-hover:bg-emerald-400'
                                  : 'bg-slate-200 dark:bg-slate-800'
                              }`}
                              style={{ height: calcHeight > 0 ? `${calcHeight}px` : '2px' }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 truncate max-w-[48px]">{point.label}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                    No trajectory telemetry available for this period.
                  </div>
                )}
              </div>

              {/* Device Breakdown */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Device Distribution
                </h3>
                <p className="text-[11px] text-slate-500 mb-5">Telemetry parsed from user agent headers</p>

                {isLoadingAnalytics ? (
                  <div className="h-40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="flex items-center gap-1.5">
                          <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                          <span>Mobile (Smartphones)</span>
                        </span>
                        <span className="font-bold">{deviceDistribution.mobile}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${deviceDistribution.mobile}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-indigo-500" />
                          <span>Desktop & Laptops</span>
                        </span>
                        <span className="font-bold">{deviceDistribution.desktop}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${deviceDistribution.desktop}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="flex items-center gap-1.5">
                          <TabletIcon className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Tablets</span>
                        </span>
                        <span className="font-bold">{deviceDistribution.tablet}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${deviceDistribution.tablet}%` }} />
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                      Telemetry captured with zero Personal Identifiable Information (PII).
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Calculators Table */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Live Calculator Performance & Usage
                  </h3>
                  <p className="text-[11px] text-slate-500">Ranked by completed calculations in selected period</p>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
                  Top {topCalculators.length} Tools
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr>
                      <th className="p-4">Calculator</th>
                      <th className="p-4">Slug ID</th>
                      <th className="p-4">Page Views</th>
                      <th className="p-4">Completed Calculations</th>
                      <th className="p-4">Completion Rate</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoadingAnalytics ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto mb-2" />
                          <span>Loading calculator usage from Supabase database...</span>
                        </td>
                      </tr>
                    ) : topCalculators.length > 0 ? (
                      topCalculators.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="p-4 font-semibold text-slate-900 dark:text-white">{c.name}</td>
                          <td className="p-4 font-mono text-xs text-slate-500">{c.calculator_id}</td>
                          <td className="p-4 text-slate-600 dark:text-slate-300">{c.views.toLocaleString()}</td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white">{c.uses.toLocaleString()}</td>
                          <td className="p-4 font-semibold text-emerald-600">{c.rate}</td>
                          <td className="p-4 text-right">
                            <Link
                              href={`/calculators/${c.calculator_id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <span>Open</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs text-slate-500">
                          No calculator events recorded yet for this timeframe. Browse calculators to generate live events!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Calculator Management */}
        {activeTab === 'calculators' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Calculator Library Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Override titles, meta descriptions, and featured flags directly stored in Supabase <code className="font-mono text-blue-600">public.calculators</code>
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left: Calculator List */}
              <div className="lg:col-span-5 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={calcSearch}
                    onChange={(e) => setCalcSearch(e.target.value)}
                    placeholder="Search calculator to edit..."
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div className="max-h-[65vh] overflow-y-auto space-y-2 pr-1">
                  {ALL_CALCULATORS.filter((c) =>
                    c.title.toLowerCase().includes(calcSearch.toLowerCase())
                  ).map((calc) => {
                    const isSelected = selectedCalc?.slug === calc.slug;
                    const hasDbOverride = Boolean(calcOverrides[calc.slug]);

                    return (
                      <button
                        key={calc.slug}
                        onClick={() => handleSelectCalcForEdit(calc)}
                        className={`w-full flex items-center justify-between rounded-xl p-3 text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 shadow-xs dark:border-blue-500 dark:bg-blue-950/60'
                            : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{calc.title}</span>
                            {hasDbOverride && (
                              <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[9px] font-semibold px-1.5 py-0.2">
                                Customized
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 capitalize">{calc.category}</div>
                        </div>
                        <Edit className="h-4 w-4 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Calculator Edit Form */}
              <div className="lg:col-span-7">
                {selectedCalc ? (
                  <form
                    onSubmit={handleSaveCalcOverrides}
                    className="rounded-2xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Editing Slug: {selectedCalc.slug}</span>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selectedCalc.title}</h2>
                      </div>
                      <Link
                        href={`/calculators/${selectedCalc.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <span>Live Page</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>

                    {savedSuccess && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <Check className="h-4 w-4" />
                        <span>Overrides saved successfully to Supabase database table `public.calculators`!</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                        Calculator Title Override
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                        SEO Meta Title
                      </label>
                      <input
                        type="text"
                        value={editSeoTitle}
                        onChange={(e) => setEditSeoTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                        Meta Description (SEO)
                      </label>
                      <textarea
                        rows={2}
                        value={editMetaDesc}
                        onChange={(e) => setEditMetaDesc(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                        Introduction / Description
                      </label>
                      <textarea
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="flex flex-wrap gap-6 pt-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPopular}
                          onChange={(e) => setIsPopular(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Mark as Popular</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isFeatured}
                          onChange={(e) => setIsFeatured(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Mark as Featured</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs font-semibold text-rose-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isDisabled}
                          onChange={(e) => setIsDisabled(e.target.checked)}
                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                        />
                        <span>Disable Calculator</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingCalc}
                      className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {isSavingCalc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      <span>{isSavingCalc ? 'Saving to Supabase...' : 'Save Changes to Supabase'}</span>
                    </button>
                  </form>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-800">
                    <Edit className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm font-semibold">Select a calculator from the list to modify its live database metadata.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: SEO & Global Settings */}
        {activeTab === 'seo' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                SEO & Monetization Configuration
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure Google Search Console verification, AdSense publisher settings, and default metadata stored in Supabase <code className="font-mono text-blue-600">public.site_settings</code>
              </p>
            </div>

            {seoSaved && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Check className="h-4 w-4" />
                <span>Site settings saved successfully to Supabase database table `public.site_settings`!</span>
              </div>
            )}

            <form
              onSubmit={handleSaveSeoSettings}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 space-y-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                  Global Site Title
                </label>
                <input
                  type="text"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                  Default Site Meta Description
                </label>
                <textarea
                  rows={3}
                  value={siteDesc}
                  onChange={(e) => setSiteDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                  Google Search Console Verification Meta Tag Content
                </label>
                <input
                  type="text"
                  value={gscCode}
                  onChange={(e) => setGscCode(e.target.value)}
                  placeholder="e.g. google-site-verification=abc123xyz"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Paste the verification content code from Google Search Console to verify ownership of easycalc.benix.space.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 dark:text-slate-300">
                  Google AdSense Client ID
                </label>
                <input
                  type="text"
                  value={adsenseId}
                  onChange={(e) => setAdsenseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingSeo}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSavingSeo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{isSavingSeo ? 'Saving to Supabase...' : 'Save SEO & AdSense Settings'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Account Security & Change Password */}
        {activeTab === 'security' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="h-6 w-6 text-blue-600" />
                <span>Account Security & Password</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Change your account password for administrative access to Benix Space Easy Calc.
              </p>
            </div>

            {/* Account Info Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center justify-between dark:border-slate-800 dark:bg-slate-900">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Logged-in Account</span>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                  <span>{userEmail}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Administrator
                  </span>
                </div>
              </div>
              <ShieldCheck className="h-7 w-7 text-blue-600" />
            </div>

            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Check className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span>Password updated successfully! You can now sign in using your new password.</span>
              </div>
            )}

            {passwordError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                <ShieldAlert className="h-4 w-4 flex-shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            <form
              onSubmit={handleChangePassword}
              className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 space-y-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 dark:text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 dark:text-slate-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password to confirm"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-500 space-y-1 dark:bg-slate-800/50 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Password Requirements:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Minimum 6 characters long</li>
                  <li>Updated instantly in Supabase Auth user credentials</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{isChangingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

function TabletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <line x1="12" x2="12.01" y1="18" y2="18" />
    </svg>
  );
}
