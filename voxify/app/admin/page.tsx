'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { adminService } from '@/lib/services/adminService';
import { planService } from '@/lib/services/planService';
import { SubscriptionPlan } from '@/lib/types/database.types';
import { BackButton } from '@/components/ui/BackButton';
import {
  Users,
  Music,
  Plus,
  Shield,
  Edit3,
  Trash2,
  Calendar,
  Sparkles,
  BarChart3,
  Globe,
  ArrowRight,
  Power,
  CreditCard,
  ToggleLeft,
  ToggleRight,
  HardDrive,
  Mic,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [choirsCount, setChoirsCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [settingUpDb, setSettingUpDb] = useState(false);
  const [dbSetupMessage, setDbSetupMessage] = useState<string | null>(null);

  // Payment method toggles state
  const [googlePayEnabled, setGooglePayEnabled] = useState(true);
  const [flutterwaveEnabled, setFlutterwaveEnabled] = useState(true);
  const [flutterwaveSecretKey, setFlutterwaveSecretKey] = useState('');
  const [savingFlwKey, setSavingFlwKey] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !user.is_super_admin)) {
      router.push('/dashboard');
      return;
    }

    async function loadData() {
      try {
        const [plansData, choirs, users, settingsRes] = await Promise.all([
          planService.getAllPlans(),
          adminService.getAllChoirs(),
          adminService.getAllUsers(),
          fetch('/api/admin/settings'),
        ]);

        setPlans(plansData);
        setChoirsCount(choirs.length);
        setUsersCount(users.length);

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.google_pay_enabled !== undefined) setGooglePayEnabled(settings.google_pay_enabled);
          if (settings.flutterwave_enabled !== undefined) setFlutterwaveEnabled(settings.flutterwave_enabled);
          if (settings.flutterwave_secret_key) setFlutterwaveSecretKey(settings.flutterwave_secret_key);
        }
      } catch (err) {
        console.error('Error loading admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user?.is_super_admin) {
      loadData();
    }
  }, [user, authLoading, router]);

  const handleToggleGooglePay = async () => {
    const nextVal = !googlePayEnabled;
    setGooglePayEnabled(nextVal);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_pay_enabled: nextVal }),
      });
    } catch (err) {
      console.error('Failed to update Google Pay setting:', err);
    }
  };

  const handleToggleFlutterwave = async () => {
    const nextVal = !flutterwaveEnabled;
    setFlutterwaveEnabled(nextVal);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flutterwave_enabled: nextVal }),
      });
    } catch (err) {
      console.error('Failed to update Flutterwave setting:', err);
    }
  };

  const handleSaveFlwSecretKey = async () => {
    setSavingFlwKey(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flutterwave_secret_key: flutterwaveSecretKey }),
      });
      alert('Flutterwave Secret Key saved successfully!');
    } catch (err) {
      alert('Failed to save Flutterwave key.');
    } finally {
      setSavingFlwKey(false);
    }
  };

  const handleOneClickDbSetup = async () => {
    setSettingUpDb(true);
    setDbSetupMessage(null);
    try {
      const res = await fetch('/api/setup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setDbSetupMessage('✅ Database migration tables created and updated successfully!');
      } else {
        setDbSetupMessage(`❌ Setup error: ${data.error || 'Failed to run SQL migrations.'}`);
      }
    } catch (err: any) {
      setDbSetupMessage(`❌ Network error: ${err.message}`);
    } finally {
      setSettingUpDb(false);
    }
  };

  const handleTogglePlanActive = async (plan: SubscriptionPlan) => {
    const nextState = !plan.is_active;
    const success = await planService.updatePlan(plan.id, { is_active: nextState });
    if (success) {
      setPlans(plans.map(p => p.id === plan.id ? { ...p, is_active: nextState } : p));
    }
  };

  const handleDeletePlan = async (e: React.MouseEvent, plan: SubscriptionPlan) => {
    e.preventDefault();
    if (!confirm(`Are you sure you want to delete plan "${plan.name}"?`)) return;
    const success = await planService.deletePlan(plan.id);
    if (success) {
      setPlans(plans.filter(p => p.id !== plan.id));
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !user.is_super_admin) return null;

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* Back Button & Header */}
      <div>
        <BackButton href="/dashboard" label="Back to Choir Dashboard" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-extrabold text-[11px] uppercase tracking-wider mb-1">
              Super Admin Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Voxify SaaS Control Center</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/admin/analytics"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
          >
            <BarChart3 className="w-4 h-4" /> Platform Analytics
          </Link>
          <button
            onClick={handleOneClickDbSetup}
            disabled={settingUpDb}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
          >
            {settingUpDb ? 'Creating Tables...' : '⚡ Run DB Setup'}
          </button>
        </div>
      </div>

      {dbSetupMessage && (
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white">
          {dbSetupMessage}
        </div>
      )}

      {/* Featured Platform Web & App Analytics Hero Banner */}
      <Link
        href="/admin/analytics"
        className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500 dark:hover:border-blue-400 hover:scale-[1.003] transition-all shadow-sm group block"
      >
        <div className="space-y-2 flex-1">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800">
            <Globe className="w-3.5 h-3.5 text-blue-500" /> Traffic Sources, Session Time &amp; Visitor Trends
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Real-Time Web Traffic &amp; Performance Analytics
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Monitor where visitors originate (Google, Direct, Social, Referrals), daily/weekly/yearly visitor counts, time spent on site, and top visited pages.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          <span className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all">
            Open Analytics Dashboard <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </Link>

      {/* Payment Gateway Enable/Disable Controls Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment Method Controls</h2>
          </div>
          <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full font-extrabold uppercase">
            Live Gateway Toggles
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enable or disable payment methods across the entire platform in real-time. Disabling a gateway hides it from the plan checkout page.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Google Pay Toggle */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
            googlePayEnabled
              ? 'bg-slate-50 dark:bg-slate-950 border-blue-300 dark:border-blue-800'
              : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 opacity-60'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-black text-xs text-white">
                GPay
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Google Pay Gateway</h4>
                <span className={`text-[10px] font-semibold ${googlePayEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {googlePayEnabled ? '● ENABLED (Active on Checkout)' : '○ DISABLED (Hidden)'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleGooglePay}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                googlePayEnabled
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
              }`}
            >
              {googlePayEnabled ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
            </button>
          </div>

          {/* Flutterwave Toggle */}
          <div className={`p-4 rounded-2xl border space-y-3 transition-all ${
            flutterwaveEnabled
              ? 'bg-slate-50 dark:bg-slate-950 border-blue-300 dark:border-blue-800'
              : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 opacity-60'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                  FLW
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Flutterwave Gateway</h4>
                  <span className={`text-[10px] font-semibold ${flutterwaveEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    {flutterwaveEnabled ? '● ENABLED (USD, RWF, UGX, KES, NGN)' : '○ DISABLED (Hidden)'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleFlutterwave}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  flutterwaveEnabled
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                }`}
              >
                {flutterwaveEnabled ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
              </button>
            </div>

            {/* Secret Key Input Configuration */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                Flutterwave Secret Key (<code className="text-blue-600 dark:text-blue-400">FLWSECK_TEST-...</code> or <code className="text-blue-600 dark:text-blue-400">FLWSECK-...</code>)
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={flutterwaveSecretKey}
                  onChange={e => setFlutterwaveSecretKey(e.target.value)}
                  placeholder="Paste your FLWSECK_TEST- or FLWSECK- secret key here..."
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSaveFlwSecretKey}
                  disabled={savingFlwKey}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shrink-0 cursor-pointer transition-all shadow-xs"
                >
                  {savingFlwKey ? 'Saving...' : 'Save Key'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Found in <strong className="text-slate-700 dark:text-slate-300">Flutterwave Dashboard -&gt; Settings -&gt; API Keys &amp; Webhooks</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Statistics & Super Admin Global Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/marketplace"
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group cursor-pointer block shadow-xs"
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-extrabold uppercase tracking-wider">Music Marketplace &amp; Artists</span>
            <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Marketplace</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Payout Requests, Artist Approvals &amp; Commission % →</p>
        </Link>

        <Link
          href="/admin/storage"
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group cursor-pointer block shadow-xs"
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-extrabold uppercase tracking-wider">Storage &amp; Drive Pool</span>
            <HardDrive className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Storage Pool</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Google Drive Multi-Account Email Pool &amp; Settings →</p>
        </Link>

        <Link
          href="/admin/choirs"
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group cursor-pointer block shadow-xs"
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Choirs Management</span>
            <Music className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{choirsCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">View, edit &amp; delete choirs →</p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group cursor-pointer block shadow-xs"
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Users Management</span>
            <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{usersCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage user profiles &amp; roles →</p>
        </Link>

        <Link
          href="/admin/events"
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group cursor-pointer block shadow-xs"
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Global Events</span>
            <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Manage</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">View &amp; publish choir events →</p>
        </Link>

        <Link
          href="/admin/announcements"
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group cursor-pointer block shadow-xs"
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Global Notices</span>
            <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Manage</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Moderate &amp; hide announcements →</p>
        </Link>
      </div>

      {/* Dynamic SaaS Subscription Plan Management */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Dynamic SaaS Subscription Plans</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure free/paid plans, member limits, and enabled feature flags without hardcoded restrictions</p>
          </div>
          <Link
            href="/admin/plans/new"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create New Plan
          </Link>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 text-center py-10">Loading subscription plans...</p>
        ) : plans.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-10">No subscription plans found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div
                key={plan.id}
                className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-md border ${
                      plan.is_free
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/40'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800/40'
                    }`}>
                      {plan.is_free ? 'FREE PLAN' : `$${plan.price_monthly}/mo`}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Max: {plan.limits?.max_members || '50'} singers</span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{plan.description || 'No plan description.'}</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Storage:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{plan.limits?.max_storage_mb || 500} MB</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Included Features:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{plan.features?.length || 0} Enabled</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <Link
                      href={`/admin/plans/${plan.id}/edit`}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Plan
                    </Link>

                    <button
                      onClick={() => handleTogglePlanActive(plan)}
                      className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                        plan.is_active
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/40'
                          : 'bg-slate-200 dark:bg-slate-900 text-slate-500 border-slate-300 dark:border-slate-800'
                      }`}
                      title="Toggle Plan Active Status"
                    >
                      <Power className="w-3 h-3" /> {plan.is_active ? 'Active' : 'Disabled'}
                    </button>

                    <button
                      onClick={e => handleDeletePlan(e, plan)}
                      className="p-1.5 text-rose-500 hover:text-rose-600 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
