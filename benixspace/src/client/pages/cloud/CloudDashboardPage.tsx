import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
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
  Play,
  Square,
  RotateCw,
  Plus,
  ExternalLink,
  Copy,
  Check,
  UploadCloud,
  Github,
  AlertCircle,
  Clock,
  XCircle,
  FileText,
  Camera,
  Image,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAuthToken } from '../../services/api';

export const CloudDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan');
  const token = getAuthToken();

  const [activeTab, setActiveTab] = useState<'overview' | 'deployments' | 'databases' | 'domains' | 'billing' | 'deposits'>('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [databases, setDatabases] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [myDeposits, setMyDeposits] = useState<any[]>([]);

  // Modals
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState<any>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Deploy Form State
  const [deployName, setDeployName] = useState('');
  const [deployFramework, setDeployFramework] = useState('nodejs');
  const [deploySourceType, setDeploySourceType] = useState<'github' | 'zip'>('github');
  const [deployGitUrl, setDeployGitUrl] = useState('');
  const [deployBranch, setDeployBranch] = useState('main');
  const [deployPort, setDeployPort] = useState(3000);
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  // Database Form State
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbEngine, setDbEngine] = useState<'postgres' | 'mysql' | 'mariadb'>('postgres');
  const [creatingDb, setCreatingDb] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Domain Form State
  const [domainName, setDomainName] = useState('');
  const [domainDepId, setDomainDepId] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);

  // Manual Deposit Form State (MTN MoMo 0783987223)
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPhone, setDepositPhone] = useState('');
  const [depositRef, setDepositRef] = useState('');
  const [depositProof, setDepositProof] = useState('');
  const [screenshotFileName, setScreenshotFileName] = useState<string | null>(null);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  const handleScreenshotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Screenshot file is too large (maximum 10 MB).');
      return;
    }

    setScreenshotFileName(`${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
    const reader = new FileReader();
    reader.onload = () => {
      setDepositProof(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setDepositProof('');
    setScreenshotFileName(null);
  };

  const fetchCloudData = async () => {
    try {
      const headers = { Authorization: `Bearer ${getAuthToken()}` };
      const [meRes, plansRes, depsRes, dbsRes, domsRes, depositsRes] = await Promise.all([
        fetch('/api/cloud/me', { headers }).then((r) => r.json()),
        fetch('/api/cloud/plans').then((r) => r.json()),
        fetch('/api/cloud/deployments', { headers }).then((r) => r.json()),
        fetch('/api/cloud/databases', { headers }).then((r) => r.json()),
        fetch('/api/cloud/domains', { headers }).then((r) => r.json()),
        fetch('/api/cloud/wallet/manual-deposits/my', { headers }).then((r) => r.json())
      ]);

      if (meRes.success) setData(meRes);
      if (plansRes.success) setPlans(plansRes.plans);
      if (depsRes.success) setDeployments(depsRes.deployments);
      if (dbsRes.success) setDatabases(dbsRes.databases);
      if (domsRes.success) setDomains(domsRes.domains);
      if (depositsRes.success) setMyDeposits(depositsRes.deposits);
    } catch (err) {
      console.warn('Error fetching cloud data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/cloud/login?redirect=' + encodeURIComponent('/cloud/dashboard'));
      return;
    }
    fetchCloudData();
  }, [token]);

  // Handle plan selection from landing page url
  useEffect(() => {
    if (initialPlan && data && !data.subscription) {
      if (initialPlan === 'free-trial') {
        handleActivateTrial();
      } else {
        handleSubscribePlan(initialPlan);
      }
    }
  }, [initialPlan, data]);

  const handleActivateTrial = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cloud/trial/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        await fetchCloudData();
      } else {
        alert(json.error || 'Could not activate trial.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribePlan = async (planId: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/cloud/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ planId })
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        await fetchCloudData();
      } else {
        if (json.error && json.error.includes('Insufficient wallet balance')) {
          setShowTopUpModal(true);
        }
        alert(json.error || 'Subscription failed.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeployError(null);
    setDeploying(true);

    try {
      const res = await fetch('/api/cloud/deployments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          name: deployName,
          framework: deployFramework,
          sourceType: deploySourceType,
          gitRepoUrl: deployGitUrl,
          gitBranch: deployBranch,
          internalPort: deployPort
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowDeployModal(false);
        setDeployName('');
        setDeployGitUrl('');
        await fetchCloudData();
      } else {
        setDeployError(json.error || 'Deployment failed.');
      }
    } catch (err: any) {
      setDeployError(err.message);
    } finally {
      setDeploying(false);
    }
  };

  const handleCreateDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbError(null);
    setCreatingDb(true);

    try {
      const res = await fetch('/api/cloud/databases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          name: dbName,
          engine: dbEngine,
          dbName: dbName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          dbUser: dbUser.toLowerCase().replace(/[^a-z0-9]/g, '_')
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowDbModal(false);
        setDbName('');
        setDbUser('');
        await fetchCloudData();
      } else {
        setDbError(json.error || 'Database creation failed.');
      }
    } catch (err: any) {
      setDbError(err.message);
    } finally {
      setCreatingDb(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setDomainError(null);
    setAddingDomain(true);

    try {
      const res = await fetch('/api/cloud/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          deploymentId: domainDepId,
          domainName
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowDomainModal(false);
        setDomainName('');
        await fetchCloudData();
      } else {
        setDomainError(json.error || 'Domain attachment failed.');
      }
    } catch (err: any) {
      setDomainError(err.message);
    } finally {
      setAddingDomain(false);
    }
  };

  const handleContainerAction = async (depId: string, action: 'restart' | 'stop' | 'redeploy') => {
    try {
      const res = await fetch(`/api/cloud/deployments/${depId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ action })
      });
      const json = await res.json();
      if (json.success) {
        await fetchCloudData();
      }
    } catch (err) {
      console.warn('Action failed:', err);
    }
  };

  const handleManualDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError(null);
    setDepositSuccess(null);
    setSubmittingDeposit(true);

    try {
      const res = await fetch('/api/cloud/wallet/manual-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          amount: depositAmount,
          senderPhone: depositPhone,
          transactionReference: depositRef,
          proofImageUrl: depositProof
        })
      });
      const json = await res.json();
      if (json.success) {
        setDepositSuccess(json.message);
        setDepositAmount('');
        setDepositPhone('');
        setDepositRef('');
        setDepositProof('');
        await fetchCloudData();
      } else {
        setDepositError(json.error || 'Deposit submission failed.');
      }
    } catch (err: any) {
      setDepositError(err.message);
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const sub = data?.subscription;
  const isTrial = sub?.isTrial;
  const wallet = data?.wallet;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading your cloud workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col">
      {/* Top Header */}
      <header className="border-b border-white/5 bg-slate-950/40 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/cloud" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow">
              <Cloud className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">Benix Cloud</span>
          </Link>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
            Console
          </span>
        </div>

        {/* Central Wallet & Action Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-none">Wallet Balance</span>
              <span className="font-bold text-white text-xs mt-0.5">
                {(wallet?.balance || 0).toLocaleString()} {wallet?.currency || 'RWF'}
              </span>
            </div>
            <button
              onClick={() => setShowTopUpModal(true)}
              className="ml-2 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
            >
              + Top Up
            </button>
          </div>

          <Link
            to="/cloud/admin"
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Admin VPS Hub</span>
          </Link>
        </div>
      </header>

      {/* Trial Countdown or Plan Bar */}
      {sub ? (
        isTrial ? (
          <div className="bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 border-b border-purple-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                <strong>Free Developer Trial Active:</strong> You have <strong>{sub.trialDaysRemaining} days remaining</strong> with 3 databases and 1GB storage.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('billing')}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shrink-0"
            >
              Upgrade to Unlimited SSD
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/60 border-b border-white/5 px-4 py-2 flex items-center justify-between text-xs text-slate-300">
            <span>
              Active Plan: <strong>{sub.planName}</strong> ({sub.planPriceRwf.toLocaleString()} RWF/mo)
            </span>
            <span className="text-emerald-400 font-semibold">● Healthy & Active</span>
          </div>
        )
      ) : (
        <div className="bg-blue-900/40 border-b border-blue-500/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span>You do not have an active cloud hosting plan yet.</span>
          <button
            onClick={handleActivateTrial}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
          >
            Activate Free 2-Month Trial
          </button>
        </div>
      )}

      {/* Main Workspace Navigation Tabs */}
      <div className="border-b border-white/5 bg-slate-950/20 px-4 sm:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'deployments', label: `Deployments (${deployments.length})`, icon: Cloud },
          { id: 'databases', label: `Databases (${databases.length})`, icon: Database },
          { id: 'domains', label: `Domains (${domains.length})`, icon: Globe },
          { id: 'billing', label: 'Hosting Plans & Billing', icon: Zap },
          { id: 'deposits', label: `Deposits (${myDeposits.length})`, icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Workspace Content */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Applications</span>
                  <Cloud className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">{deployments.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Quota: {sub?.maxApps === -1 ? 'Unlimited' : `${deployments.length} / ${sub?.maxApps || 1}`}
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Managed Databases</span>
                  <Database className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">{databases.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Quota: {sub?.maxDatabases === -1 ? 'Unlimited' : `${databases.length} / ${sub?.maxDatabases || 3}`}
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Custom Domains</span>
                  <Globe className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">{domains.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Free SSL Enabled</div>
              </div>

              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>SSD Storage</span>
                  <HardDrive className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">{sub?.storageGb || 1} GB</div>
                <div className="text-[11px] text-slate-500 mt-1">Allocated Volume</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-900/20 via-indigo-900/10 to-transparent border border-white/10 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Quick Deployment</h3>
                <p className="text-xs text-slate-400">Launch a new web service via GitHub continuous deployment or ZIP archive.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeployModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white flex items-center gap-2 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Deploy New App</span>
                </button>
                <button
                  onClick={() => setShowDbModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white flex items-center gap-2 shadow"
                >
                  <Database className="w-4 h-4" />
                  <span>Create Database</span>
                </button>
              </div>
            </div>

            {/* Recent Deployments Table */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Active Applications</h4>
                <button
                  onClick={() => setActiveTab('deployments')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  View All
                </button>
              </div>

              {deployments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No applications deployed yet. Click "Deploy New App" above to launch your first service.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {deployments.slice(0, 3).map((dep) => (
                    <div key={dep.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Cloud className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            <span>{dep.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                              {dep.status}
                            </span>
                          </div>
                          <a
                            href={dep.live_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <span>{dep.live_url}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowLogsModal(dep)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-medium"
                        >
                          Logs
                        </button>
                        <button
                          onClick={() => handleContainerAction(dep.id, 'restart')}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                          title="Restart Container"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEPLOYMENTS TAB */}
        {activeTab === 'deployments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Your Applications</h3>
                <p className="text-xs text-slate-400">Manage running Docker containers, logs, and build triggers.</p>
              </div>
              <button
                onClick={() => setShowDeployModal(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Deploy Application</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deployments.map((dep) => (
                <div key={dep.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Cloud className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{dep.name}</h4>
                        <div className="text-[11px] text-slate-400 uppercase">{dep.framework} • Port {dep.internal_port}</div>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        dep.status === 'running'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-500/10 border border-slate-500/30 text-slate-400'
                      }`}
                    >
                      ● {dep.status}
                    </span>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate mr-2">{dep.live_url}</span>
                    <a
                      href={dep.live_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-bold shrink-0 flex items-center gap-1"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button
                      onClick={() => setShowLogsModal(dep)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-medium flex items-center gap-1.5"
                    >
                      <Terminal className="w-3.5 h-3.5 text-blue-400" />
                      <span>Console Logs</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleContainerAction(dep.id, 'restart')}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-medium flex items-center gap-1"
                        title="Restart Container"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Restart</span>
                      </button>
                      <button
                        onClick={() => handleContainerAction(dep.id, 'stop')}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-400 font-medium flex items-center gap-1"
                        title="Stop Container"
                      >
                        <Square className="w-3 h-3" />
                        <span>Stop</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DATABASES TAB */}
        {activeTab === 'databases' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Managed Relational Databases</h3>
                <p className="text-xs text-slate-400">PostgreSQL, MySQL, and MariaDB instances running in isolated containers.</p>
              </div>
              <button
                onClick={() => setShowDbModal(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Create Database</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {databases.map((db) => (
                <div key={db.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black text-xs uppercase">
                        {db.engine.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{db.name}</h4>
                        <div className="text-[11px] text-slate-400 uppercase">{db.engine} • Port {db.host_port}</div>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                      ● Active
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Connection URI
                    </label>
                    <div className="bg-black/50 border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono text-slate-300">
                      <span className="truncate mr-2">{db.connection_uri_masked}</span>
                      <button
                        onClick={() => copyToClipboard(db.connection_uri_masked)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                        title="Copy URI"
                      >
                        {copiedText === db.connection_uri_masked ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DOMAINS TAB */}
        {activeTab === 'domains' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Custom Domains & SSL</h3>
                <p className="text-xs text-slate-400">Attach custom domains with automatic Let's Encrypt SSL certificates.</p>
              </div>
              <button
                onClick={() => setShowDomainModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Connect Domain</span>
              </button>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
              {domains.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No custom domains connected yet. You can bind any custom domain (e.g. api.yourdomain.com) to your running applications.
                </div>
              ) : (
                domains.map((dom) => (
                  <div key={dom.id} className="p-4 sm:p-5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>{dom.domain_name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>SSL Active</span>
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Bound to: <strong>{dom.app_name}</strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* BILLING & PLANS TAB */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-white">Hosting Plans & Quota Management</h3>
              <p className="text-xs text-slate-400">
                Upgrade or switch your hosting tier anytime. Subscriptions are billed directly from your <strong>BenixSpace Central Wallet</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {plans.map((p) => {
                const isCurrent = sub?.planId === p.id;
                const isTrial = p.is_trial;

                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl p-5 flex flex-col justify-between border ${
                      isCurrent
                        ? 'bg-blue-950/40 border-blue-500 shadow-xl shadow-blue-500/10'
                        : 'bg-white/[0.02] border-white/10'
                    }`}
                  >
                    <div>
                      {isCurrent && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold uppercase mb-2">
                          Active Plan
                        </span>
                      )}
                      <h4 className="font-bold text-base text-white">{p.name}</h4>
                      <p className="text-xs text-slate-400 min-h-[32px] mt-1">{p.description}</p>

                      <div className="my-4">
                        <span className="text-2xl font-black text-white">
                          {p.price_rwf === 0 ? 'FREE' : `${p.price_rwf.toLocaleString()} RWF`}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {isTrial ? `${p.trial_duration_days} days trial` : '/month via wallet'}
                        </span>
                      </div>

                      <ul className="text-xs text-slate-300 space-y-2 border-t border-white/5 pt-3 mb-6">
                        <li>• {p.max_apps === -1 ? 'Unlimited' : p.max_apps} Apps</li>
                        <li>• {p.storage_gb} GB SSD Storage</li>
                        <li>• {p.max_databases === -1 ? 'Unlimited' : p.max_databases} Databases</li>
                        <li>• {p.vcpu_limit === -1 ? 'Unlimited' : `${p.vcpu_limit} vCPU`}</li>
                      </ul>
                    </div>

                    <button
                      disabled={isCurrent}
                      onClick={() => handleSubscribePlan(p.id)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
                        isCurrent
                          ? 'bg-white/10 text-slate-400 cursor-default'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow'
                      }`}
                    >
                      {isCurrent ? 'Current Plan' : isTrial ? 'Activate Free Trial' : 'Subscribe With Wallet'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MY DEPOSITS TAB (Manual Deposit Verification Queue for User) */}
        {activeTab === 'deposits' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">My Wallet Deposit Requests</h3>
                <p className="text-xs text-slate-400">
                  Track the verification status of your MTN Mobile Money manual deposits.
                </p>
              </div>
              <button
                onClick={() => setShowTopUpModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Submit New Deposit</span>
              </button>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
              {myDeposits.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No deposit submissions found. Use the "+ Top Up" button to add funds via MTN MoMo (0783987223).
                </div>
              ) : (
                myDeposits.map((dep) => (
                  <div key={dep.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>{Number(dep.amount).toLocaleString()} RWF</span>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            dep.status === 'approved'
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              : dep.status === 'rejected'
                              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                              : 'bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse'
                          }`}
                        >
                          {dep.status === 'pending' ? 'Pending Admin Review' : dep.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        MTN MoMo Ref: <strong className="font-mono text-slate-200">{dep.transaction_reference}</strong> • From: {dep.sender_phone}
                      </div>
                      {dep.rejection_reason && (
                        <div className="text-xs text-rose-400 mt-1">
                          Reason: {dep.rejection_reason}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(dep.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* TOP UP WALLET MODAL (MTN MoMo Manual Verification) */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Top Up Central Wallet (MTN MoMo)</h3>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* MTN MoMo Instructions Box */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-amber-300 text-sm">Payment Instructions:</div>
              <div>
                1. Send your deposit via <strong>MTN Mobile Money</strong> to:{' '}
                <strong className="text-white font-mono text-sm">0783987223</strong> (NebeluRw Co. Ltd. / Benir Benjamin).
              </div>
              <div>
                2. Enter your payment details below with the <strong>SMS Transaction Reference</strong> code.
              </div>
              <div className="text-amber-200/90 font-medium pt-1">
                ⚠️ Strict Policy: All manual deposits are reviewed by the platform administrator before money is added to your account wallet.
              </div>
            </div>

            {depositSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
                {depositSuccess}
              </div>
            )}
            {depositError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {depositError}
              </div>
            )}

            <form onSubmit={handleManualDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deposit Amount (RWF)
                </label>
                <input
                  type="number"
                  required
                  min={500}
                  step={500}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your MTN Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={depositPhone}
                  onChange={(e) => setDepositPhone(e.target.value)}
                  placeholder="078xxxxxxx"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  MTN Transaction ID / SMS Reference
                </label>
                <input
                  type="text"
                  required
                  value={depositRef}
                  onChange={(e) => setDepositRef(e.target.value)}
                  placeholder="e.g. 12984920492"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Upload Payment Screenshot / SMS Photo</span>
                  <span className="text-[10px] text-amber-400 font-normal">Fast admin verification</span>
                </label>

                <input
                  type="file"
                  id="momo-screenshot-file"
                  accept="image/*"
                  onChange={handleScreenshotFileChange}
                  className="hidden"
                />

                {!depositProof ? (
                  <label
                    htmlFor="momo-screenshot-file"
                    className="border-2 border-dashed border-white/15 hover:border-emerald-500/50 bg-black/30 hover:bg-black/50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-white mt-1">
                      Click to Browse or Take Screenshot Photo
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Supports PNG, JPG, JPEG, WebP from phone or computer
                    </div>
                  </label>
                ) : (
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-3 space-y-2">
                    <div className="relative group max-h-52 overflow-hidden rounded-xl bg-black/60 flex items-center justify-center border border-white/5">
                      <img
                        src={depositProof}
                        alt="MTN MoMo Deposit Proof"
                        className="max-h-52 w-auto object-contain rounded-xl"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-emerald-400 font-semibold truncate flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">{screenshotFileName || 'Screenshot Uploaded'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded-lg hover:bg-rose-500/10 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDeposit}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white disabled:opacity-50"
                >
                  {submittingDeposit ? 'Submitting...' : 'Submit Deposit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPLOY NEW APP MODAL */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white">Deploy New Application</h3>
              <button onClick={() => setShowDeployModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {deployError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {deployError}
              </div>
            )}

            <form onSubmit={handleDeploySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">App Name</label>
                <input
                  type="text"
                  required
                  value={deployName}
                  onChange={(e) => setDeployName(e.target.value)}
                  placeholder="e.g. my-node-api"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Source Type</label>
                  <select
                    value={deploySourceType}
                    onChange={(e) => setDeploySourceType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  >
                    <option value="github">GitHub Repo</option>
                    <option value="zip">ZIP Upload</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Framework</label>
                  <select
                    value={deployFramework}
                    onChange={(e) => setDeployFramework(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  >
                    <option value="nodejs">Node.js</option>
                    <option value="react">React</option>
                    <option value="nextjs">Next.js</option>
                    <option value="python">Python</option>
                    <option value="php">PHP</option>
                    <option value="docker">Dockerfile</option>
                  </select>
                </div>
              </div>

              {deploySourceType === 'github' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">GitHub Repository URL</label>
                  <input
                    type="url"
                    required
                    value={deployGitUrl}
                    onChange={(e) => setDeployGitUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Application Archive (.zip)</label>
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center text-xs text-slate-400 hover:border-blue-500/50 cursor-pointer">
                    <UploadCloud className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <span>Click or drag and drop application .zip file</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Git Branch</label>
                  <input
                    type="text"
                    value={deployBranch}
                    onChange={(e) => setDeployBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Internal Port</label>
                  <input
                    type="number"
                    value={deployPort}
                    onChange={(e) => setDeployPort(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deploying}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white disabled:opacity-50"
                >
                  {deploying ? 'Deploying...' : 'Start Deployment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DATABASE MODAL */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white">Create Managed Database</h3>
              <button onClick={() => setShowDbModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {dbError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {dbError}
              </div>
            )}

            <form onSubmit={handleCreateDatabase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Database Engine</label>
                <select
                  value={dbEngine}
                  onChange={(e) => setDbEngine(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                >
                  <option value="postgres">PostgreSQL 16</option>
                  <option value="mysql">MySQL 8.0</option>
                  <option value="mariadb">MariaDB 11</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Database Name</label>
                <input
                  type="text"
                  required
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="e.g. app_production"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Database Username</label>
                <input
                  type="text"
                  required
                  value={dbUser}
                  onChange={(e) => setDbUser(e.target.value)}
                  placeholder="e.g. db_admin"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDbModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDb}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white disabled:opacity-50"
                >
                  {creatingDb ? 'Provisioning...' : 'Provision Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONNECT CUSTOM DOMAIN MODAL */}
      {showDomainModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white">Connect Custom Domain</h3>
              <button onClick={() => setShowDomainModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {domainError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {domainError}
              </div>
            )}

            <form onSubmit={handleAddDomain} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Application</label>
                <select
                  required
                  value={domainDepId}
                  onChange={(e) => setDomainDepId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                >
                  <option value="">-- Choose Application --</option>
                  {deployments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Domain Name</label>
                <input
                  type="text"
                  required
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  placeholder="e.g. api.yourcompany.com"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-white">Required DNS Settings:</div>
                <div>Add a <strong>CNAME</strong> or <strong>A Record</strong> pointing to:</div>
                <div className="font-mono text-blue-400 bg-black/40 p-1.5 rounded">cloud.benix.space</div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDomainModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDomain}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white disabled:opacity-50"
                >
                  {addingDomain ? 'Verifying...' : 'Attach & Issue SSL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TERMINAL LOGS MODAL */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#0e1117] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <h4 className="font-bold text-sm text-white">Deployment Console Logs — {showLogsModal.name}</h4>
              </div>
              <button onClick={() => setShowLogsModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 bg-black/80 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-y-auto whitespace-pre-wrap">
              {showLogsModal.last_logs || '[Benix Cloud] Application container is running. No errors reported.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
