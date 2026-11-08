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
  AlertCircle,
  Clock,
  XCircle,
  FileText,
  Camera,
  Image,
  Trash2,
  Calendar,
  X,
  LogOut,
  Settings,
  Code,
  Key,
  Link2,
  Eye,
  EyeOff,
  PlayCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getAuthToken } from '../../services/api';
import { WalletModal } from '../../components/modals/WalletModal';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

export const CloudDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan');
  const token = getAuthToken();
  const { user, wallet, refreshWallet } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

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
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState<any>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Edit / Settings Modals
  const [showAppSettingsModal, setShowAppSettingsModal] = useState<any | null>(null);
  const [showWebhookModal, setShowWebhookModal] = useState<any | null>(null);
  const [showDbConsoleModal, setShowDbConsoleModal] = useState<any | null>(null);
  const [showDbSettingsModal, setShowDbSettingsModal] = useState<any | null>(null);
  const [showDomainSettingsModal, setShowDomainSettingsModal] = useState<any | null>(null);

  // Live Testing & Diagnostic States
  const [testingDbId, setTestingDbId] = useState<string | null>(null);
  const [dbTestResult, setDbTestResult] = useState<Record<string, any>>({});
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);
  const [domainVerifyResult, setDomainVerifyResult] = useState<Record<string, any>>({});

  // SQL Console Query State
  const [sqlQueryInput, setSqlQueryInput] = useState<string>('SELECT 1 as live_status, version(), current_database(), current_schema();');
  const [executingQuery, setExecutingQuery] = useState(false);
  const [queryOutput, setQueryOutput] = useState<{ columns: string[]; rows: any[]; rowCount: number } | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Subscription & Upgrade Modal State
  const [selectedPlanForSubscribe, setSelectedPlanForSubscribe] = useState<any | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [customMonthsInput, setCustomMonthsInput] = useState<string>('');
  const [isCustomMonths, setIsCustomMonths] = useState<boolean>(false);
  const [subscribePreview, setSubscribePreview] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [subscribing, setSubscribing] = useState<boolean>(false);

  // Deploy Form State
  const [deployName, setDeployName] = useState('');
  const [deployFramework, setDeployFramework] = useState('nodejs');
  const [deploySourceType, setDeploySourceType] = useState<'github' | 'zip'>('github');
  const [deployGitUrl, setDeployGitUrl] = useState('');
  const [deployBranch, setDeployBranch] = useState('main');
  const [deployPort, setDeployPort] = useState(3000);
  const [deployBuildCmd, setDeployBuildCmd] = useState('npm run build');
  const [deployStartCmd, setDeployStartCmd] = useState('npm start');
  const [deployRootDir, setDeployRootDir] = useState('/');
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  // GitHub Integration & Auto-Sync State
  const [githubAccount, setGithubAccount] = useState<{ username: string; avatarUrl: string; email: string; connectedAt: string } | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubPatInput, setGithubPatInput] = useState('');
  const [connectingGithub, setConnectingGithub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [userRepos, setUserRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoBranches, setRepoBranches] = useState<string[]>([]);
  const [syncingWebhookId, setSyncingWebhookId] = useState<string | null>(null);

  // GitHub Inspection State
  const [inspectingRepo, setInspectingRepo] = useState(false);
  const [inspectedRepo, setInspectedRepo] = useState<any | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Environment Variables Editor State (for new deployment)
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([
    { key: 'NODE_ENV', value: 'production' }
  ]);
  const [envInputMode, setEnvInputMode] = useState<'table' | 'raw'>('table');
  const [envRawText, setEnvRawText] = useState('NODE_ENV=production');

  // Edit App Settings Form State
  const [editAppName, setEditAppName] = useState('');
  const [editAppBranch, setEditAppBranch] = useState('main');
  const [editAppBuildCmd, setEditAppBuildCmd] = useState('');
  const [editAppStartCmd, setEditAppStartCmd] = useState('');
  const [editAppPort, setEditAppPort] = useState(3000);
  const [editAppRootDir, setEditAppRootDir] = useState('/');
  const [editAppEnvVars, setEditAppEnvVars] = useState<{ key: string; value: string }[]>([]);
  const [savingAppSettings, setSavingAppSettings] = useState(false);

  // Database Form State
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbEngine, setDbEngine] = useState<'postgres' | 'mysql' | 'mariadb'>('postgres');
  const [creatingDb, setCreatingDb] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showDbPassword, setShowDbPassword] = useState<Record<string, boolean>>({});

  // Domain Form State
  const [domainName, setDomainName] = useState('');
  const [domainDepId, setDomainDepId] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);

  // Manual Deposit Form State
  const [depositAmount, setDepositAmount] = useState('');
  const [depositPhone, setDepositPhone] = useState('');
  const [depositRef, setDepositRef] = useState('');
  const [depositProof, setDepositProof] = useState('');
  const [screenshotFileName, setScreenshotFileName] = useState<string | null>(null);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

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

      try {
        const ghRes = await fetch('/api/cloud/github/status', { headers }).then(r => r.json());
        if (ghRes && ghRes.success && ghRes.connected) {
          setGithubAccount(ghRes.account);
        } else {
          setGithubAccount(null);
        }
      } catch {}
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

  const DURATION_PRESETS = [
    { months: 1, label: '1 Month' },
    { months: 2, label: '2 Months' },
    { months: 3, label: '3 Months' },
    { months: 6, label: '6 Months' },
    { months: 8, label: '8 Months' },
    { months: 10, label: '10 Months' },
    { months: 12, label: '12 Mos (1 Yr)' },
    { months: 24, label: '24 Mos (2 Yrs)' }
  ];

  // Handle plan selection from landing page URL
  useEffect(() => {
    if (initialPlan && data && plans.length > 0) {
      if (initialPlan === 'free-trial') {
        if (!data.subscription) handleActivateTrial();
      } else {
        const target = plans.find((p) => p.id === initialPlan);
        if (target) {
          openSubscribeModal(target);
        }
      }
    }
  }, [initialPlan, data, plans]);

  // Fetch user repositories from connected GitHub account
  const fetchUserRepos = async () => {
    setLoadingRepos(true);
    try {
      const res = await fetch('/api/cloud/github/repos', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.repos)) {
        setUserRepos(json.repos);
      }
    } catch {} finally {
      setLoadingRepos(false);
    }
  };

  // Connect GitHub via Personal Access Token
  const handleConnectGithubToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubPatInput.trim()) return;
    setConnectingGithub(true);
    setGithubError(null);
    try {
      const res = await fetch('/api/cloud/github/connect-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ token: githubPatInput.trim() })
      });
      const json = await res.json();
      if (json.success) {
        setGithubAccount(json.account);
        setShowGithubModal(false);
        setGithubPatInput('');
        fetchUserRepos();
      } else {
        setGithubError(json.error || 'Failed to connect GitHub account.');
      }
    } catch (err: any) {
      setGithubError(err.message || 'Network error.');
    } finally {
      setConnectingGithub(false);
    }
  };

  // Disconnect GitHub
  const handleDisconnectGithub = async () => {
    if (!window.confirm('Disconnect your GitHub account?')) return;
    try {
      await fetch('/api/cloud/github/disconnect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setGithubAccount(null);
      setUserRepos([]);
    } catch {}
  };

  // Select a repo from dropdown
  const handleSelectRepo = async (repo: any) => {
    setDeployGitUrl(repo.htmlUrl);
    if (!deployName) {
      setDeployName(repo.name);
    }
    setDeployBranch(repo.defaultBranch || 'main');

    // Fetch branches for selected repo
    try {
      const bRes = await fetch(`/api/cloud/github/branches?repo=${encodeURIComponent(repo.fullName)}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const bJson = await bRes.json();
      if (bJson.success && Array.isArray(bJson.branches)) {
        setRepoBranches(bJson.branches);
      }
    } catch {}

    // Inspect repository
    await handleInspectGithubRepo(repo.htmlUrl);
  };

  // Auto-install / re-install webhook on deployment
  const handleSyncWebhook = async (depId: string) => {
    setSyncingWebhookId(depId);
    try {
      const res = await fetch(`/api/cloud/deployments/${depId}/sync-webhook`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message || 'GitHub webhook installed successfully!');
        await fetchCloudData();
      } else {
        alert(json.error || 'Failed to install GitHub webhook.');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSyncingWebhookId(null);
    }
  };

  // Live GitHub Inspector Function
  const handleInspectGithubRepo = async (urlToInspect?: string) => {
    const url = (urlToInspect || deployGitUrl).trim();
    if (!url) return;
    setInspectingRepo(true);
    setInspectError(null);
    try {
      const res = await fetch(`/api/cloud/github/inspect?url=${encodeURIComponent(url)}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const json = await res.json();
      if (json.success && json.repo) {
        setInspectedRepo(json.repo);
        if (json.repo.name && !deployName) {
          setDeployName(json.repo.name.toLowerCase().replace(/[^a-z0-9]/g, '-'));
        }
        if (json.repo.detectedFramework) {
          setDeployFramework(json.repo.detectedFramework);
        }
        if (json.repo.defaultBranch) {
          setDeployBranch(json.repo.defaultBranch);
        }
        if (json.repo.suggestedBuildCommand) {
          setDeployBuildCmd(json.repo.suggestedBuildCommand);
        }
        if (json.repo.suggestedStartCommand) {
          setDeployStartCmd(json.repo.suggestedStartCommand);
        }
        if (json.repo.suggestedPort) {
          setDeployPort(json.repo.suggestedPort);
        }
      } else {
        setInspectError(json.error || 'Could not inspect GitHub repository.');
      }
    } catch (err: any) {
      setInspectError(err.message || 'Network error inspecting GitHub repository.');
    } finally {
      setInspectingRepo(false);
    }
  };

  // Convert Raw .env text to Key/Value table
  const handleParseRawEnv = (raw: string) => {
    setEnvRawText(raw);
    const lines = raw.split('\n');
    const parsed: { key: string; value: string }[] = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const k = trimmed.substring(0, eqIdx).trim();
        let v = trimmed.substring(eqIdx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (k) parsed.push({ key: k, value: v });
      }
    });
    setEnvVars(parsed);
  };

  // Environment Variable Row Helpers
  const addEnvVarRow = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };
  const updateEnvVarRow = (idx: number, field: 'key' | 'value', val: string) => {
    const updated = [...envVars];
    updated[idx][field] = val;
    setEnvVars(updated);
  };
  const removeEnvVarRow = (idx: number) => {
    setEnvVars(envVars.filter((_, i) => i !== idx));
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Open Subscribe / Upgrade Modal
  const openSubscribeModal = (plan: any) => {
    setSelectedPlanForSubscribe(plan);
    setSelectedMonths(1);
    setIsCustomMonths(false);
    setCustomMonthsInput('');
    setSubscribePreview(null);
    fetchSubscribePreview(plan.id, 1);
  };

  const fetchSubscribePreview = async (planId: string, months: number) => {
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/cloud/subscribe/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ planId, months })
      });
      const json = await res.json();
      if (json.success) {
        setSubscribePreview(json.preview);
      }
    } catch (e) {
      console.warn('Error fetching preview:', e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSelectMonthsPreset = (m: number) => {
    setSelectedMonths(m);
    setIsCustomMonths(false);
    setCustomMonthsInput('');
    if (selectedPlanForSubscribe) {
      fetchSubscribePreview(selectedPlanForSubscribe.id, m);
    }
  };

  const handleCustomMonthsChange = (val: string) => {
    setCustomMonthsInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedMonths(parsed);
      if (selectedPlanForSubscribe) {
        fetchSubscribePreview(selectedPlanForSubscribe.id, parsed);
      }
    }
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlanForSubscribe) return;
    setSubscribing(true);
    try {
      const res = await fetch('/api/cloud/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          planId: selectedPlanForSubscribe.id,
          months: selectedMonths
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setSelectedPlanForSubscribe(null);
        await refreshWallet();
        await fetchCloudData();
      } else {
        alert(json.error || 'Subscription failed. Please check wallet balance.');
      }
    } catch (err: any) {
      alert(err.message || 'Subscription request failed.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleActivateTrial = async () => {
    if (!window.confirm('Activate your 2-Month Free Developer Trial with unlimited testing resources?')) return;
    try {
      const res = await fetch('/api/cloud/trial/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        await fetchCloudData();
      } else {
        alert(json.error || 'Trial activation failed.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Submit New Deployment
  const handleDeploySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeployError(null);
    setDeploying(true);

    try {
      const envMap: Record<string, string> = {};
      envVars.forEach((ev) => {
        if (ev.key.trim()) envMap[ev.key.trim()] = ev.value;
      });

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
          buildCommand: deployBuildCmd,
          startCommand: deployStartCmd,
          internalPort: Number(deployPort),
          rootDir: deployRootDir,
          envVariables: envMap
        })
      });

      const json = await res.json();
      if (json.success) {
        setShowDeployModal(false);
        setDeployName('');
        setDeployGitUrl('');
        setInspectedRepo(null);
        await fetchCloudData();
        setActiveTab('deployments');
      } else {
        setDeployError(json.error || 'Deployment failed.');
      }
    } catch (err: any) {
      setDeployError(err.message);
    } finally {
      setDeploying(false);
    }
  };

  // Open Edit App Settings Modal
  const openAppSettingsModal = (dep: any) => {
    setShowAppSettingsModal(dep);
    setEditAppName(dep.name);
    setEditAppBranch(dep.git_branch || 'main');
    setEditAppBuildCmd(dep.build_command || 'npm run build');
    setEditAppStartCmd(dep.start_command || 'npm start');
    setEditAppPort(dep.internal_port || 3000);
    setEditAppRootDir(dep.root_dir || '/');

    let parsedEnv: { key: string; value: string }[] = [];
    if (dep.env_variables) {
      try {
        const obj = typeof dep.env_variables === 'string' ? JSON.parse(dep.env_variables) : dep.env_variables;
        parsedEnv = Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
      } catch {}
    }
    setEditAppEnvVars(parsedEnv);
  };

  // Save App Settings & Environment Variables
  const handleSaveAppSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAppSettingsModal) return;
    setSavingAppSettings(true);

    try {
      const envMap: Record<string, string> = {};
      editAppEnvVars.forEach((ev) => {
        if (ev.key.trim()) envMap[ev.key.trim()] = ev.value;
      });

      const res = await fetch(`/api/cloud/deployments/${showAppSettingsModal.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          name: editAppName,
          gitBranch: editAppBranch,
          buildCommand: editAppBuildCmd,
          startCommand: editAppStartCmd,
          internalPort: Number(editAppPort),
          rootDir: editAppRootDir,
          envVariables: envMap
        })
      });

      const json = await res.json();
      if (json.success) {
        alert('Application settings and environment variables updated successfully!');
        setShowAppSettingsModal(null);
        await fetchCloudData();
      } else {
        alert(json.error || 'Failed to save settings.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingAppSettings(false);
    }
  };

  // Trigger Redeployment
  const handleTriggerRedeploy = async (depId: string) => {
    try {
      const res = await fetch(`/api/cloud/deployments/${depId}/redeploy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        await fetchCloudData();
      } else {
        alert(json.error || 'Redeploy failed.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Deployment
  const handleDeleteDeployment = async (depId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete application "${name}"? This will stop and remove the container.`)) return;
    try {
      const res = await fetch(`/api/cloud/deployments/${depId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const json = await res.json();
      if (json.success) {
        await fetchCloudData();
      } else {
        alert(json.error || 'Failed to delete application.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Container Action
  const handleContainerAction = async (id: string, action: 'restart' | 'stop' | 'redeploy') => {
    try {
      const res = await fetch(`/api/cloud/deployments/${id}/action`, {
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
      } else {
        alert(json.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Create Database
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
          dbName: dbName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          dbUser: dbUser || 'neondb_owner'
        })
      });

      const json = await res.json();
      if (json.success) {
        setShowDbModal(false);
        setDbName('');
        setDbUser('');
        await fetchCloudData();
        setActiveTab('databases');
      } else {
        setDbError(json.error || 'Failed to create database.');
      }
    } catch (err: any) {
      setDbError(err.message);
    } finally {
      setCreatingDb(false);
    }
  };

  // Test Database Connection Live
  const handleTestDatabaseConnection = async (dbId: string) => {
    setTestingDbId(dbId);
    setDbTestResult((prev) => ({ ...prev, [dbId]: { loading: true } }));
    try {
      const res = await fetch(`/api/cloud/databases/${dbId}/test-connection`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const json = await res.json();
      setDbTestResult((prev) => ({ ...prev, [dbId]: json }));
    } catch (err: any) {
      setDbTestResult((prev) => ({ ...prev, [dbId]: { success: false, error: err.message } }));
    } finally {
      setTestingDbId(null);
    }
  };

  // Open SQL Console Modal
  const openDbConsoleModal = (db: any) => {
    setShowDbConsoleModal(db);
    setQueryOutput(null);
    setQueryError(null);
    setSqlQueryInput(`SELECT 1 as live_status, '${db.name}' as database_name, version(), current_database(), current_schema();`);
  };

  // Execute SQL Query
  const handleExecuteSqlQuery = async () => {
    if (!showDbConsoleModal || !sqlQueryInput.trim()) return;
    setExecutingQuery(true);
    setQueryError(null);
    setQueryOutput(null);
    try {
      const res = await fetch(`/api/cloud/databases/${showDbConsoleModal.id}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ sqlQuery: sqlQueryInput })
      });
      const json = await res.json();
      if (json.success) {
        setQueryOutput({
          columns: json.columns || [],
          rows: json.rows || [],
          rowCount: json.rowCount || 0
        });
      } else {
        setQueryError(json.error || 'Query execution error.');
      }
    } catch (err: any) {
      setQueryError(err.message || 'Network error running query.');
    } finally {
      setExecutingQuery(false);
    }
  };

  // Delete Database
  const handleDeleteDatabase = async (dbId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete database "${name}"? All tables and data will be permanently dropped.`)) return;
    try {
      const res = await fetch(`/api/cloud/databases/${dbId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const json = await res.json();
      if (json.success) {
        await fetchCloudData();
      } else {
        alert(json.error || 'Failed to delete database.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Attach Custom Domain
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
        setDomainDepId('');
        await fetchCloudData();
        setActiveTab('domains');
      } else {
        setDomainError(json.error || 'Failed to attach domain.');
      }
    } catch (err: any) {
      setDomainError(err.message);
    } finally {
      setAddingDomain(false);
    }
  };

  // Real DNS Verification
  const handleVerifyDns = async (domainId: string) => {
    setVerifyingDomainId(domainId);
    setDomainVerifyResult((prev) => ({ ...prev, [domainId]: { loading: true } }));
    try {
      const res = await fetch(`/api/cloud/domains/${domainId}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const json = await res.json();
      setDomainVerifyResult((prev) => ({ ...prev, [domainId]: json }));
      if (json.success && json.verified) {
        await fetchCloudData();
      }
    } catch (err: any) {
      setDomainVerifyResult((prev) => ({ ...prev, [domainId]: { success: false, error: err.message } }));
    } finally {
      setVerifyingDomainId(null);
    }
  };

  // Delete Domain
  const handleDeleteDomain = async (domainId: string, name: string) => {
    if (!window.confirm(`Remove custom domain "${name}"?`)) return;
    try {
      const res = await fetch(`/api/cloud/domains/${domainId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const json = await res.json();
      if (json.success) {
        await fetchCloudData();
      } else {
        alert(json.error || 'Failed to delete domain.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const sub = data?.subscription;
  const isTrial = sub?.isTrial;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400">Loading Hosting Services Console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex flex-col">
      {/* IN-PAGE CONSOLE BREADCRUMBS & WALLET SUB-HEADER (Uses Universal App Navbar) */}
      <div className="border-b border-white/5 bg-slate-950/30 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link to="/" className="hover:text-white transition-colors">BenixSpace</Link>
            <span>/</span>
            <Link to="/cloud" className="hover:text-white transition-colors">Hosting Services</Link>
            <span>/</span>
            <span className="text-sky-400 font-semibold">Console</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow">
              <Cloud className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Hosting Services Console</h1>
          </div>
        </div>

        {/* Central Wallet Pill & Shortcuts */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 leading-none">Wallet Balance</span>
              <span className="font-bold text-white text-xs mt-0.5">
                {(wallet?.balance || 0).toLocaleString()} {wallet?.currency || 'RWF'}
              </span>
            </div>
            <button
              onClick={() => setShowWalletModal(true)}
              className="ml-2 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
            >
              + Top Up
            </button>
          </div>

          {isAdmin && (
            <Link
              to="/cloud/admin"
              className="px-3.5 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-xs font-semibold text-sky-300 transition-colors flex items-center gap-1.5"
            >
              <Server className="w-3.5 h-3.5 text-sky-400" />
              <span>Admin VPS Hub</span>
            </Link>
          )}
        </div>
      </div>

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
          <div className="bg-slate-900/60 border-b border-white/5 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Plan: <strong className="text-white">{sub.planName}</strong> • Renews:{' '}
                {new Date(sub.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('billing')}
              className="text-sky-400 hover:underline font-bold text-xs"
            >
              Change or Extend Plan →
            </button>
          </div>
        )
      ) : (
        <div className="bg-gradient-to-r from-sky-900/40 via-blue-900/40 to-indigo-900/40 border-b border-sky-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-300 shrink-0" />
            <span>
              <strong>Welcome to Benix Cloud:</strong> Activate your <strong>Free 2-Month Trial</strong> or choose a subscription plan to start deploying.
            </span>
          </div>
          <button
            onClick={handleActivateTrial}
            className="px-3.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors shadow shrink-0"
          >
            Activate 2-Month Free Trial
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-white/10 px-4 sm:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto bg-slate-950/20">
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
                  ? 'border-sky-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
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
            {/* GITHUB AUTO-SYNC STATUS CARD */}
            <div className="bg-[#121620] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <GithubIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">GitHub Account & Auto-Sync</h3>
                    {githubAccount ? (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Connected</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold">
                        Not Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {githubAccount ? (
                      <span>Connected as <strong>@{githubAccount.username}</strong>. Automatic push-to-deploy webhooks are enabled.</span>
                    ) : (
                      <span>Connect your GitHub account to enable zero-config auto-sync and select repositories directly.</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {githubAccount ? (
                  <>
                    <button
                      onClick={() => {
                        setShowDeployModal(true);
                        fetchUserRepos();
                      }}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white transition flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Deploy from GitHub</span>
                    </button>
                    <button
                      onClick={handleDisconnectGithub}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-400 hover:text-white transition"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowGithubModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition flex items-center gap-2 shadow"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>Connect GitHub Account</span>
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Applications</span>
                  <Cloud className="w-4 h-4 text-sky-400" />
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
                <div className="text-[11px] text-slate-500 mt-1">Free Let's Encrypt TLS</div>
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
            <div className="bg-gradient-to-r from-sky-900/20 via-indigo-900/10 to-transparent border border-white/10 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white mb-1">Quick Launch Workspace</h3>
                <p className="text-xs text-slate-400">Deploy real applications from GitHub or provision isolated Neon PostgreSQL databases.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDeployModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-xs text-white flex items-center gap-2 shadow"
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
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
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
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                          <Cloud className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            <span>{dep.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold capitalize">
                              {dep.status}
                            </span>
                          </div>
                          <a
                            href={dep.live_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-sky-400 hover:underline flex items-center gap-1 mt-0.5"
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
                          onClick={() => openAppSettingsModal(dep)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                          title="Settings & Environment Variables"
                        >
                          <Settings className="w-3.5 h-3.5" />
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
                <p className="text-xs text-slate-400">Manage running Docker containers, logs, environment variables, and auto-sync triggers.</p>
              </div>
              <button
                onClick={() => setShowDeployModal(true)}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-xs text-white flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Deploy Application</span>
              </button>
            </div>

            {deployments.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center">
                <Cloud className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">No Applications Deployed</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  Connect a public GitHub repository with your environment variables and start running your Node, React, Python, or Docker apps.
                </p>
                <button
                  onClick={() => setShowDeployModal(true)}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Deploy Application</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deployments.map((dep) => {
                  const envCount = dep.env_variables ? Object.keys(typeof dep.env_variables === 'string' ? JSON.parse(dep.env_variables || '{}') : dep.env_variables).length : 0;
                  return (
                    <div key={dep.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                            <Cloud className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{dep.name}</h4>
                            <div className="text-[11px] text-slate-400 uppercase">
                              {dep.framework} • Port {dep.internal_port} • Branch: {dep.git_branch || 'main'}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                            dep.status === 'running'
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              : dep.status === 'building'
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 animate-pulse'
                              : 'bg-slate-500/10 border border-slate-500/30 text-slate-400'
                          }`}
                        >
                          ● {dep.status}
                        </span>
                      </div>

                      <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs">
                        <span className="text-slate-400 truncate mr-2 font-mono">
                          {dep.live_url || `https://benix.space/apps/${dep.name}`}
                        </span>
                        <a
                          href={dep.live_url || `https://benix.space/apps/${dep.name}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-400 hover:text-sky-300 font-bold shrink-0 flex items-center gap-1"
                        >
                          <span>Open App</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Meta badges: Commit, Auto-Sync & Env count */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        {dep.auto_sync_enabled ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-300 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                            <span>Auto-Sync Active</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSyncWebhook(dep.id)}
                            disabled={syncingWebhookId === dep.id}
                            className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 flex items-center gap-1"
                          >
                            <GithubIcon className="w-2.5 h-2.5 text-slate-400" />
                            <span>{syncingWebhookId === dep.id ? 'Installing...' : 'Enable Auto-Sync'}</span>
                          </button>
                        )}
                        {dep.git_commit_hash && (
                          <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-mono text-[10px]">
                            #{dep.git_commit_hash}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-sky-300">
                          {envCount} Env Var{envCount === 1 ? '' : 's'}
                        </span>
                        {dep.last_deployed_at && (
                          <span className="text-[10px] text-slate-500">
                            Deployed: {new Date(dep.last_deployed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowLogsModal(dep)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-medium flex items-center gap-1"
                          >
                            <Terminal className="w-3.5 h-3.5 text-sky-400" />
                            <span>Logs</span>
                          </button>
                          <button
                            onClick={() => openAppSettingsModal(dep)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-medium flex items-center gap-1"
                            title="Edit Settings & Environment Variables"
                          >
                            <Settings className="w-3.5 h-3.5 text-slate-400" />
                            <span>Settings & Env</span>
                          </button>
                          <button
                            onClick={() => setShowWebhookModal(dep)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 font-medium flex items-center gap-1"
                            title="GitHub Auto-Sync Webhook"
                          >
                            <GithubIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>Auto-Sync</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleTriggerRedeploy(dep.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                            title="Re-run Deployment"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDeployment(dep.id, dep.name)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                            title="Delete Application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* DATABASES TAB */}
        {activeTab === 'databases' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Managed Relational Databases</h3>
                <p className="text-xs text-slate-400">Genuine PostgreSQL database instances running on high-speed Neon serverless cloud.</p>
              </div>
              <button
                onClick={() => setShowDbModal(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Create Database</span>
              </button>
            </div>

            {databases.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center">
                <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">No Databases Provisioned</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  Create your first PostgreSQL database with an isolated schema, live SQL console, and full DDL/query capabilities.
                </p>
                <button
                  onClick={() => setShowDbModal(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Database</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {databases.map((db) => {
                  const isVisible = Boolean(showDbPassword[db.id]);
                  const testStatus = dbTestResult[db.id];
                  return (
                    <div key={db.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black text-xs uppercase">
                            {db.engine.slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{db.name}</h4>
                            <div className="text-[11px] text-slate-400 uppercase">{db.engine} • Port 5432 • Neon PostgreSQL</div>
                          </div>
                        </div>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                          ● Active
                        </span>
                      </div>

                      {/* Connection URI Box */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-400">Connection URI</label>
                          <button
                            onClick={() => setShowDbPassword((prev) => ({ ...prev, [db.id]: !prev[db.id] }))}
                            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                          >
                            {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{isVisible ? 'Hide' : 'Reveal'}</span>
                          </button>
                        </div>
                        <div className="bg-black/50 border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono text-slate-300">
                          <span className="truncate mr-2">
                            {isVisible
                              ? db.connection_uri_masked
                              : db.connection_uri_masked?.replace(/:([^@]+)@/, ':••••••••@')}
                          </span>
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

                      {/* Connection Parameters Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/[0.01] border border-white/5 rounded-xl p-3">
                        <div>
                          <span className="text-slate-500 block">Host:</span>
                          <span className="font-mono text-slate-300 truncate block">ep-soft-hill...neon.tech</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Port:</span>
                          <span className="font-mono text-slate-300">5432</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Database:</span>
                          <span className="font-mono text-slate-300">neondb</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Schema:</span>
                          <span className="font-mono text-slate-300 truncate block">{db.schema_name || db.db_name}</span>
                        </div>
                      </div>

                      {/* Test Connection Result Banner */}
                      {testStatus && (
                        <div
                          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                            testStatus.loading
                              ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                              : testStatus.success
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {testStatus.loading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : testStatus.success ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="text-[11px]">{testStatus.loading ? 'Pinging Neon PostgreSQL server...' : testStatus.message || testStatus.error}</span>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTestDatabaseConnection(db.id)}
                            disabled={testingDbId === db.id}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs text-emerald-400 font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{testingDbId === db.id ? 'Testing...' : 'Test Connection'}</span>
                          </button>
                          <button
                            onClick={() => openDbConsoleModal(db)}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-xs text-purple-300 font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                            <span>SQL Console</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteDatabase(db.id, db.name)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="Delete Database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* DOMAINS TAB */}
        {activeTab === 'domains' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Custom Domains & SSL</h3>
                <p className="text-xs text-slate-400">Attach and verify custom domains with automatic Let's Encrypt TLS certificates.</p>
              </div>
              <button
                onClick={() => setShowDomainModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Connect Domain</span>
              </button>
            </div>

            {/* Clear DNS Instructions Box */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <Globe className="w-4 h-4" />
                <span>How to Connect Your Domain (DNS Records Setup)</span>
              </div>
              <p className="text-xs text-slate-400">
                To route your custom domain to your Benix Cloud application, open your domain registrar (such as Cloudflare, Namecheap, GoDaddy) and add this DNS record:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-white/10 rounded-xl overflow-hidden">
                  <thead className="bg-white/5 text-slate-300">
                    <tr>
                      <th className="p-2.5 font-bold">Type</th>
                      <th className="p-2.5 font-bold">Name / Host</th>
                      <th className="p-2.5 font-bold">Target / Points To</th>
                      <th className="p-2.5 font-bold">TTL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-400 font-mono">
                    <tr>
                      <td className="p-2.5 text-sky-400 font-bold">CNAME</td>
                      <td className="p-2.5">@ (or subdomain: api, app, www)</td>
                      <td className="p-2.5 text-white font-bold flex items-center justify-between">
                        <span>cloud.benix.space</span>
                        <button
                          onClick={() => copyToClipboard('cloud.benix.space')}
                          className="ml-2 p-1 hover:text-white"
                          title="Copy target"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="p-2.5">300s (Automatic)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {domains.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center">
                <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">No Custom Domains Connected</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  Connect your company domain or subdomain to route traffic with automated HTTPS.
                </p>
                <button
                  onClick={() => setShowDomainModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Connect Domain</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {domains.map((dom) => {
                  const isVerified = Boolean(dom.dns_verified);
                  const verifyStatus = domainVerifyResult[dom.id];
                  return (
                    <div key={dom.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">{dom.domain_name}</h4>
                            <div className="text-[11px] text-slate-400">
                              Routes to: <strong className="text-slate-300">{dom.app_name || 'Application'}</strong>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            isVerified
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                          }`}
                        >
                          ● {isVerified ? 'Connected & SSL Active' : 'DNS Pending'}
                        </span>
                      </div>

                      {/* Verification Diagnosis Banner if tested */}
                      {verifyStatus && (
                        <div
                          className={`p-3 rounded-xl text-xs space-y-1 ${
                            verifyStatus.loading
                              ? 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                              : verifyStatus.verified
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold">
                            {verifyStatus.loading ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : verifyStatus.verified ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5" />
                            )}
                            <span>{verifyStatus.loading ? 'Checking global DNS...' : verifyStatus.verified ? 'Verified Successfully!' : 'DNS Not Yet Propagated'}</span>
                          </div>
                          <p className="text-[11px] opacity-90">{verifyStatus.message}</p>
                          {verifyStatus.found && (
                            <p className="text-[10px] text-slate-400 font-mono">Detected record: {verifyStatus.found}</p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleVerifyDns(dom.id)}
                          disabled={verifyingDomainId === dom.id}
                          className="px-3 py-1.5 rounded-lg bg-sky-600/15 hover:bg-sky-600/25 border border-sky-500/30 text-xs text-sky-400 font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${verifyingDomainId === dom.id ? 'animate-spin' : ''}`} />
                          <span>{verifyingDomainId === dom.id ? 'Checking DNS...' : 'Verify DNS Records'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteDomain(dom.id, dom.domain_name)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="Delete Domain"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BILLING & PLANS TAB */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Hosting Plans & Duration Configurator</h3>
              <p className="text-xs text-slate-400">Choose prepaid billing durations from 1 month to 2 years, with automated pro-rated upgrade credits.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((p) => {
                const isCurrent = sub?.planId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl p-6 border flex flex-col justify-between space-y-6 transition-all ${
                      isCurrent
                        ? 'bg-sky-950/20 border-sky-500 shadow-xl shadow-sky-500/10'
                        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-extrabold text-base text-white">{p.name}</h4>
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30">
                            Current Plan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-4">{p.description}</p>
                      <div className="text-2xl font-black text-white">
                        {p.is_trial ? 'FREE' : `${p.price_rwf.toLocaleString()} RWF`}
                        <span className="text-xs text-slate-500 font-normal ml-1">/ month</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>{p.max_apps === -1 ? 'Unlimited Applications' : `Up to ${p.max_apps} Application(s)`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>{p.max_databases === -1 ? 'Unlimited Databases' : `${p.max_databases} Managed Database(s)`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>{p.storage_gb} GB SSD Storage</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>Free Let's Encrypt TLS SSL</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => openSubscribeModal(p)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        isCurrent
                          ? 'bg-white/10 text-white hover:bg-white/20'
                          : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20'
                      }`}
                    >
                      <span>{isCurrent ? 'Extend Duration' : p.is_trial ? 'Claim Trial' : 'Subscribe / Upgrade'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DEPOSITS HISTORY TAB */}
        {activeTab === 'deposits' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">My Wallet Top Up Requests</h3>
                <p className="text-xs text-slate-400">Review status of your MTN Mobile Money deposits reviewed by platform admin.</p>
              </div>
              <button
                onClick={() => setShowWalletModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" />
                <span>+ Top Up Central Wallet</span>
              </button>
            </div>

            {myDeposits.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center text-xs text-slate-500">
                No deposit requests submitted yet. Use "+ Top Up Central Wallet" to credit your balance.
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                {myDeposits.map((d) => (
                  <div key={d.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-sm text-white">
                        {Number(d.amount).toLocaleString()} {d.currency || 'RWF'}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Ref: <span className="font-mono text-slate-300">{d.transaction_reference}</span> • Phone: {d.sender_phone}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Submitted: {new Date(d.created_at).toLocaleString()}
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                        d.status === 'approved'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                          : d.status === 'rejected'
                          ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                          : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                      }`}
                    >
                      ● {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          MODALS SECTION
          ========================================================================= */}

      {/* CENTRAL WALLET MODAL (Real Flutterwave, MTN MoMo, Cards, Bank, Multi-currency) */}
      {showWalletModal && (
        <WalletModal
          isOpen={showWalletModal}
          onClose={() => {
            setShowWalletModal(false);
            refreshWallet();
            fetchCloudData();
          }}
          initialTab="deposit"
        />
      )}

      {/* DEPLOY NEW APP MODAL WITH LIVE GITHUB INSPECTOR & REAL ENVIRONMENT VARIABLES */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base text-white">Deploy New Application</h3>
              </div>
              <button onClick={() => setShowDeployModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {deployError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deployError}</span>
              </div>
            )}

            <form onSubmit={handleDeploySubmit} className="space-y-4">
              {/* GitHub Repo URL with Live Inspector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  GitHub Repository URL (Public)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <GithubIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      required
                      value={deployGitUrl}
                      onChange={(e) => setDeployGitUrl(e.target.value)}
                      onBlur={() => handleInspectGithubRepo()}
                      placeholder="https://github.com/username/repository"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInspectGithubRepo()}
                    disabled={inspectingRepo || !deployGitUrl.trim()}
                    className="px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white shrink-0 disabled:opacity-50"
                  >
                    {inspectingRepo ? 'Checking...' : 'Verify Repo'}
                  </button>
                </div>

                {/* Inspected Repo Card Preview */}
                {inspectedRepo && (
                  <div className="mt-2.5 p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                        <span>{inspectedRepo.fullName}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[10px] uppercase">
                        {inspectedRepo.detectedFramework}
                      </span>
                    </div>
                    {inspectedRepo.latestCommit && (
                      <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
                        <span className="font-mono text-sky-400">#{inspectedRepo.latestCommit.sha}</span>
                        <span className="truncate">"{inspectedRepo.latestCommit.message}"</span>
                        <span className="text-slate-500 shrink-0">by @{inspectedRepo.latestCommit.author}</span>
                      </div>
                    )}
                    {inspectedRepo.files && (
                      <div className="flex flex-wrap gap-1 text-[10px] text-slate-400 font-mono pt-1">
                        {inspectedRepo.files.map((f: string) => (
                          <span key={f} className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {inspectError && (
                  <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300">
                    {inspectError}
                  </div>
                )}
              </div>

              {/* App Name & Branch */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">App Name</label>
                  <input
                    type="text"
                    required
                    value={deployName}
                    onChange={(e) => setDeployName(e.target.value)}
                    placeholder="e.g. my-api"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Git Branch</label>
                  <input
                    type="text"
                    value={deployBranch}
                    onChange={(e) => setDeployBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Framework & Internal Port */}
              <div className="grid grid-cols-2 gap-3">
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
                    <option value="static">Static HTML</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Internal Port</label>
                  <input
                    type="number"
                    value={deployPort}
                    onChange={(e) => setDeployPort(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Build Command & Start Command */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Build Command</label>
                  <input
                    type="text"
                    value={deployBuildCmd}
                    onChange={(e) => setDeployBuildCmd(e.target.value)}
                    placeholder="npm run build"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Command</label>
                  <input
                    type="text"
                    value={deployStartCmd}
                    onChange={(e) => setDeployStartCmd(e.target.value)}
                    placeholder="npm start"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* ENVIRONMENT VARIABLES EDITOR (.env) */}
              <div className="border border-white/10 rounded-xl p-3.5 bg-black/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-sky-400" />
                    <label className="text-xs font-bold text-white">Environment Variables (.env)</label>
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => setEnvInputMode('table')}
                      className={`px-2 py-0.5 rounded ${envInputMode === 'table' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`}
                    >
                      Key-Value
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnvInputMode('raw')}
                      className={`px-2 py-0.5 rounded ${envInputMode === 'raw' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400'}`}
                    >
                      Raw .env Paste
                    </button>
                  </div>
                </div>

                {envInputMode === 'table' ? (
                  <div className="space-y-2">
                    {envVars.map((ev, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="VARIABLE_KEY"
                          value={ev.key}
                          onChange={(e) => updateEnvVarRow(i, 'key', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white"
                        />
                        <input
                          type="text"
                          placeholder="value"
                          value={ev.value}
                          onChange={(e) => updateEnvVarRow(i, 'value', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeEnvVarRow(i)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addEnvVarRow}
                      className="text-xs text-sky-400 hover:underline font-bold flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Variable</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={4}
                      value={envRawText}
                      onChange={(e) => handleParseRawEnv(e.target.value)}
                      placeholder={`PORT=3000\nDATABASE_URL=postgres://...\nAPI_KEY=xyz`}
                      className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-white"
                    />
                    <span className="text-[10px] text-slate-500">Paste multiple lines in KEY=VALUE format. Automatically parsed into environment variables.</span>
                  </div>
                )}
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
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-xs text-white disabled:opacity-50 shadow-lg shadow-sky-600/20"
                >
                  {deploying ? 'Deploying...' : 'Start Real Deployment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT APPLICATION SETTINGS & ENVIRONMENT VARIABLES MODAL */}
      {showAppSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base text-white">App Settings & Variables: {showAppSettingsModal.name}</h3>
              </div>
              <button onClick={() => setShowAppSettingsModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveAppSettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">App Name</label>
                  <input
                    type="text"
                    required
                    value={editAppName}
                    onChange={(e) => setEditAppName(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Git Branch</label>
                  <input
                    type="text"
                    value={editAppBranch}
                    onChange={(e) => setEditAppBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Build Command</label>
                  <input
                    type="text"
                    value={editAppBuildCmd}
                    onChange={(e) => setEditAppBuildCmd(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Command</label>
                  <input
                    type="text"
                    value={editAppStartCmd}
                    onChange={(e) => setEditAppStartCmd(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Internal Port</label>
                  <input
                    type="number"
                    value={editAppPort}
                    onChange={(e) => setEditAppPort(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Root Directory</label>
                  <input
                    type="text"
                    value={editAppRootDir}
                    onChange={(e) => setEditAppRootDir(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Environment Variables Editor */}
              <div className="border border-white/10 rounded-xl p-3.5 bg-black/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-sky-400" />
                    <label className="text-xs font-bold text-white">Environment Variables</label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditAppEnvVars([...editAppEnvVars, { key: '', value: '' }])}
                    className="text-xs text-sky-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Variable</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editAppEnvVars.length === 0 ? (
                    <div className="text-xs text-slate-500 py-2">No environment variables configured.</div>
                  ) : (
                    editAppEnvVars.map((ev, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="KEY"
                          value={ev.key}
                          onChange={(e) => {
                            const updated = [...editAppEnvVars];
                            updated[idx].key = e.target.value;
                            setEditAppEnvVars(updated);
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white"
                        />
                        <input
                          type="text"
                          placeholder="value"
                          value={ev.value}
                          onChange={(e) => {
                            const updated = [...editAppEnvVars];
                            updated[idx].value = e.target.value;
                            setEditAppEnvVars(updated);
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setEditAppEnvVars(editAppEnvVars.filter((_, i) => i !== idx))}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAppSettingsModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAppSettings}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-xs text-white disabled:opacity-50"
                >
                  {savingAppSettings ? 'Saving...' : 'Save & Apply Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GITHUB AUTO-SYNC WEBHOOK MODAL */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GithubIcon className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base text-white">GitHub Auto-Sync Webhook</h3>
              </div>
              <button onClick={() => setShowWebhookModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enable continuous deployment for <strong>{showWebhookModal.name}</strong>. Whenever you push commits to GitHub, Benix Cloud will automatically pull and rebuild your service!
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">Payload Webhook URL</label>
              <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs font-mono text-sky-300">
                <span className="truncate mr-2">
                  {`https://benix.space/api/cloud/webhooks/github?deploymentId=${showWebhookModal.id}`}
                </span>
                <button
                  onClick={() => copyToClipboard(`https://benix.space/api/cloud/webhooks/github?deploymentId=${showWebhookModal.id}`)}
                  className="p-1 hover:text-white"
                  title="Copy URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-slate-400 space-y-1.5">
              <span className="font-bold text-white block">Instructions:</span>
              <ol className="list-decimal list-inside space-y-1 text-[11px]">
                <li>Open your GitHub repo <strong>Settings → Webhooks</strong>.</li>
                <li>Click <strong>Add webhook</strong>.</li>
                <li>Paste the URL above into <strong>Payload URL</strong>.</li>
                <li>Select <strong>Content type: application/json</strong>.</li>
                <li>Choose <strong>Just the push event</strong> and click Add webhook.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowWebhookModal(null)}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-xs text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* IN-BROWSER SQL CONSOLE MODAL */}
      {showDbConsoleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base text-white">Live SQL Console: {showDbConsoleModal.name}</h3>
              </div>
              <button onClick={() => setShowDbConsoleModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Execute live SQL queries on your isolated schema <strong>{showDbConsoleModal.schema_name || showDbConsoleModal.db_name}</strong> on AWS Neon PostgreSQL.
            </p>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={sqlQueryInput}
                onChange={(e) => setSqlQueryInput(e.target.value)}
                placeholder="SELECT * FROM my_table;"
                className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-sky-300 focus:outline-none focus:border-purple-500"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                  <span>Schema: {showDbConsoleModal.schema_name || showDbConsoleModal.db_name}</span>
                </div>
                <button
                  onClick={handleExecuteSqlQuery}
                  disabled={executingQuery}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white flex items-center gap-1.5 shadow"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{executingQuery ? 'Running...' : 'Run Query'}</span>
                </button>
              </div>
            </div>

            {queryError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-mono">
                {queryError}
              </div>
            )}

            {queryOutput && (
              <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
                <div className="p-2.5 bg-white/5 border-b border-white/10 text-xs text-slate-400 flex items-center justify-between">
                  <span>Results: <strong>{queryOutput.rowCount} row(s)</strong> returned</span>
                </div>
                {queryOutput.rows.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">Query executed successfully. Zero rows returned.</div>
                ) : (
                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-white/5 text-purple-300 border-b border-white/10">
                        <tr>
                          {queryOutput.columns.map((col) => (
                            <th key={col} className="p-2.5 font-bold">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        {queryOutput.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-white/5">
                            {queryOutput.columns.map((col) => (
                              <td key={col} className="p-2.5 truncate max-w-xs">{String(row[col])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE DATABASE MODAL */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base text-white">Create Managed Database</h3>
              </div>
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
                  <option value="postgres">PostgreSQL 16 (AWS Cloud - Neon Serverless)</option>
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
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Database User (Optional)</label>
                <input
                  type="text"
                  value={dbUser}
                  onChange={(e) => setDbUser(e.target.value)}
                  placeholder="neondb_owner"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
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
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white disabled:opacity-50 shadow-lg shadow-purple-600/20"
                >
                  {creatingDb ? 'Provisioning Database...' : 'Create Database'}
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
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Connect Custom Domain</h3>
              </div>
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
                  <option value="">-- Choose Application to Route To --</option>
                  {deployments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.framework})
                    </option>
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
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 space-y-1">
                <span className="font-bold block text-white">Required DNS Settings:</span>
                <p className="text-[11px] text-slate-400">Add a CNAME record in your registrar pointing to:</p>
                <div className="font-mono text-emerald-400 bg-black/40 p-2 rounded-lg flex items-center justify-between">
                  <span>cloud.benix.space</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('cloud.benix.space')}
                    className="p-1 hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                >
                  {addingDomain ? 'Attaching...' : 'Attach & Setup Domain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONSOLE LOGS VIEWER MODAL */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base text-white">Build & Runtime Logs: {showLogsModal.name}</h3>
              </div>
              <button onClick={() => setShowLogsModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 my-4 bg-black/80 border border-white/10 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {showLogsModal.last_logs || '[Benix Cloud Pipeline] Service initialized. Waiting for build stream...'}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <button
                onClick={() => copyToClipboard(showLogsModal.last_logs || '')}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Logs</span>
              </button>
              <button
                onClick={() => setShowLogsModal(null)}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBSCRIBE & UPGRADE MODAL WITH PRO-RATED CALCULATION & DURATION PRESETS */}
      {selectedPlanForSubscribe && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121620] border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-base text-white">
                  {selectedPlanForSubscribe.is_trial ? 'Activate Free Developer Trial' : `Subscribe to ${selectedPlanForSubscribe.name}`}
                </h3>
                <p className="text-xs text-slate-400">Choose prepaid billing period with automatic pro-rated upgrade credit.</p>
              </div>
              <button onClick={() => setSelectedPlanForSubscribe(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {!selectedPlanForSubscribe.is_trial && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300">Choose Prepaid Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {DURATION_PRESETS.map((dp) => {
                    const isSelected = !isCustomMonths && selectedMonths === dp.months;
                    return (
                      <button
                        key={dp.months}
                        type="button"
                        onClick={() => handleSelectMonthsPreset(dp.months)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {dp.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Months Input */}
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomMonths(true);
                        if (customMonthsInput) handleCustomMonthsChange(customMonthsInput);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isCustomMonths
                          ? 'bg-sky-600 text-white border-sky-500'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Custom Months
                    </button>
                    {isCustomMonths && (
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={customMonthsInput}
                        onChange={(e) => handleCustomMonthsChange(e.target.value)}
                        placeholder="e.g. 5, 9, 18"
                        className="w-32 px-3 py-1.5 bg-black/40 border border-sky-500 rounded-lg text-xs text-white font-mono"
                        autoFocus
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Breakdown Card */}
            {loadingPreview ? (
              <div className="p-6 bg-white/[0.02] border border-white/10 rounded-xl text-center text-xs text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-sky-400" />
                <span>Calculating pro-rated upgrade credit...</span>
              </div>
            ) : subscribePreview ? (
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Selected Duration</span>
                  <span className="font-bold text-white">{subscribePreview.durationMonths} Month(s)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Base Plan Cost ({selectedPlanForSubscribe.price_rwf?.toLocaleString()} × {subscribePreview.durationMonths})</span>
                  <span className="font-mono text-white">{subscribePreview.rawTotal?.toLocaleString()} RWF</span>
                </div>

                {subscribePreview.isUpgrade && subscribePreview.unusedCredit > 0 && (
                  <div className="flex items-center justify-between text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    <span className="flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Credit from {subscribePreview.currentPlan?.name} ({subscribePreview.remainingDays} days unused)</span>
                    </span>
                    <span className="font-bold font-mono">-{subscribePreview.unusedCredit?.toLocaleString()} RWF</span>
                  </div>
                )}

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-sm">
                  <span className="font-bold text-white">Net Payable Amount</span>
                  <span className="font-black text-sky-400 font-mono text-base">{subscribePreview.netPayable?.toLocaleString()} RWF</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Your Current Wallet Balance</span>
                  <span className="font-mono text-slate-300">{(wallet?.balance || 0).toLocaleString()} RWF</span>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedPlanForSubscribe(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubscription}
                disabled={subscribing}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-xs text-white shadow-lg shadow-sky-600/20 disabled:opacity-50"
              >
                {subscribing ? 'Processing...' : 'Confirm & Pay from Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudDashboardPage;
