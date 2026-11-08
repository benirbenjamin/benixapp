import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Cloud,
  Server,
  Database,
  Globe,
  ShieldCheck,
  Zap,
  Terminal,
  Cpu,
  HardDrive,
  Layers,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Lock,
  Wallet,
  Play
} from 'lucide-react';
import { getAuthToken } from '../../services/api';

interface CloudPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_rwf: number;
  billing_cycle: string;
  is_trial: boolean;
  trial_duration_days: number;
  max_apps: number;
  vcpu_limit: number;
  ram_mb: number;
  storage_gb: number;
  max_databases: number;
  custom_domains_allowed: number;
  has_free_ssl: boolean;
  has_backups: boolean;
  has_priority_support: boolean;
}

export const CloudLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<CloudPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currency, setCurrency] = useState<'RWF' | 'USD' | 'EUR' | 'KES'>('RWF');
  const token = getAuthToken();

  useEffect(() => {
    fetch('/api/cloud/plans')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.plans) {
          setPlans(data.plans);
        }
      })
      .catch((err) => console.warn('Could not load plans:', err))
      .finally(() => setLoading(false));
  }, []);

  const exchangeRates: Record<string, number> = {
    RWF: 1,
    USD: 0.00072,
    EUR: 0.00067,
    KES: 0.093
  };

  const formatPrice = (rwf: number) => {
    if (rwf === 0) return 'FREE';
    const rate = exchangeRates[currency] || 1;
    const converted = rwf * rate;
    if (currency === 'RWF') return `${rwf.toLocaleString()} RWF`;
    if (currency === 'USD') return `$${converted.toFixed(2)}`;
    if (currency === 'EUR') return `€${converted.toFixed(2)}`;
    return `${converted.toFixed(1)} KES`;
  };

  const handleSelectPlan = (planId: string) => {
    if (!token) {
      navigate('/cloud/login?redirect=' + encodeURIComponent(`/cloud/dashboard?plan=${planId}`));
    } else {
      navigate(`/cloud/dashboard?plan=${planId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      {/* Top Banner: Free 2-Month Developer Trial */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-center text-xs md:text-sm font-medium text-white flex items-center justify-center gap-2 shadow-lg">
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
        <span>
          <strong>Special Launch Offer:</strong> Start Free for 2 Months with Unlimited Apps, Unlimited CPU, 3 Managed DBs & 1GB Storage!
        </span>
        <button
          onClick={() => handleSelectPlan('free-trial')}
          className="ml-2 underline hover:text-amber-200 transition-colors font-bold inline-flex items-center gap-1"
        >
          Claim Trial <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6">
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span>NebeluRw Co. Ltd. Cloud Infrastructure</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Deploy in Seconds. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Scale Without Limits.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 mb-8 leading-relaxed">
            Benix Cloud is an enterprise multi-tenant VPS hosting platform. Deploy Node, React, Next.js, Python, PHP, or Docker apps directly from GitHub or ZIP archives, manage databases, and pay seamlessly using your <strong>BenixSpace Real Wallet</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleSelectPlan('free-trial')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold text-white shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Start Free for 2 Months</span>
            </button>

            <Link
              to="/cloud/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Open Cloud Console</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-white/5 text-left">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-xs text-slate-400 mt-1">Uptime SLA Guaranteed</div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">&lt; 60s</div>
              <div className="text-xs text-slate-400 mt-1">Average Build & Deploy</div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">Let's Encrypt</div>
              <div className="text-xs text-slate-400 mt-1">Auto-SSL on all Domains</div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="text-2xl font-bold text-white">Central Wallet</div>
              <div className="text-xs text-slate-400 mt-1">Instant Top-ups & Renewals</div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Tech Stack & Execution Plane Showcase */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-white/5 bg-slate-950/40">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">
            Supported Frameworks & Execution Engines
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm font-medium text-slate-300">
            {['React', 'Next.js', 'Node.js', 'Python', 'PHP', 'Go', 'Docker', 'PostgreSQL', 'MySQL', 'MariaDB', 'Coolify', 'Traefik'].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-blue-500/40 hover:bg-white/[0.08] transition-all"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing & Hosting Plans Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">
              Transparent Hosting Plans. No Surprises.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Begin with our <strong>Free 2-Month Trial</strong> or choose a plan that suits your production needs. Pay flexibly for 1, 2, 3, 6, 8, 12, 24, or custom months via your <strong>BenixSpace Wallet</strong> with instant pro-rated upgrade credits.
            </p>

            {/* Currency Selector */}
            <div className="mt-6 inline-flex items-center p-1 bg-white/5 border border-white/10 rounded-xl">
              {(['RWF', 'USD', 'EUR', 'KES'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currency === curr ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Plan Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {plans.map((plan) => {
                const isTrial = plan.is_trial;
                const isPro = plan.id === 'pro';

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl flex flex-col justify-between p-6 transition-all ${
                      isTrial
                        ? 'bg-gradient-to-b from-purple-950/40 to-slate-900 border-2 border-purple-500/50 shadow-xl shadow-purple-500/10'
                        : isPro
                        ? 'bg-gradient-to-b from-blue-950/40 to-slate-900 border-2 border-blue-500/50 shadow-xl shadow-blue-500/10'
                        : 'bg-white/[0.02] border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {isTrial && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-purple-500 text-white text-[11px] font-bold uppercase tracking-wider shadow">
                        Free 2 Months
                      </span>
                    )}
                    {isPro && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-500 text-white text-[11px] font-bold uppercase tracking-wider shadow">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                      <p className="text-xs text-slate-400 min-h-[36px] mb-4">{plan.description}</p>

                      <div className="mb-6">
                        <div className="text-2xl sm:text-3xl font-extrabold text-white">
                          {formatPrice(plan.price_rwf)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {isTrial ? `${plan.trial_duration_days} days trial duration` : '/month • Pay 1, 3, 6, 12, 24+ mos'}
                        </div>
                      </div>

                      {/* Specs List */}
                      <ul className="space-y-2.5 text-xs text-slate-300 border-t border-white/5 pt-4 mb-6">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            <strong>{plan.max_apps === -1 ? 'Unlimited' : plan.max_apps}</strong> App Deployment{plan.max_apps !== 1 ? 's' : ''}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            <strong>{plan.vcpu_limit === -1 ? 'Unlimited' : `${plan.vcpu_limit} vCPU`}</strong> compute
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            <strong>{plan.ram_mb >= 1024 ? `${plan.ram_mb / 1024} GB` : `${plan.ram_mb} MB`}</strong> RAM
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            <strong>{plan.storage_gb} GB</strong> Fast SSD Storage
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>
                            <strong>{plan.max_databases === -1 ? 'Unlimited' : plan.max_databases}</strong> Managed Database{plan.max_databases !== 1 ? 's' : ''}
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Free <strong>.apps.benix.space</strong> domain</span>
                        </li>
                        {plan.custom_domains_allowed !== 0 && (
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>
                              <strong>{plan.custom_domains_allowed === -1 ? 'Unlimited' : plan.custom_domains_allowed}</strong> Custom Domain{plan.custom_domains_allowed !== 1 ? 's' : ''}
                            </span>
                          </li>
                        )}
                        {plan.has_backups && (
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span>Automated Daily Backups</span>
                          </li>
                        )}
                        {plan.has_priority_support && (
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span>24/7 Priority Support</span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        isTrial
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                          : isPro
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      <span>{isTrial ? 'Claim Free Trial' : 'Select Plan'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Central Wallet & MTN MoMo Integration Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-slate-950/60">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Unified Super-App Payments</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                  Pay Instantly With Your BenixSpace Wallet
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  No credit card required. Top up your central wallet anytime via <strong>MTN Mobile Money</strong> (Manual approval to <strong>0783987223</strong>) or <strong>Flutterwave</strong>. Your hosting plans renew smoothly without disruption.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Safe & Verified
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" /> Instant Deductions
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock className="w-4 h-4 text-purple-400" /> Multi-Currency
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  to="/cloud/dashboard"
                  className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-sm shadow-xl shadow-blue-500/20 flex items-center gap-2 transition-all"
                >
                  <span>Go to Cloud Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center border-t border-white/5 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Benix Cloud. Owned and operated by NebeluRw Co. Ltd. (Primary domain: cloud.benix.space)</p>
      </footer>
    </div>
  );
};
