import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Key,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Bell,
  Webhook,
  Send,
  Lock,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Search,
  Zap,
  ArrowRight,
  ShieldAlert,
  Sliders,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { uploadFileInChunks } from '../../utils/chunkedUpload';

interface BenixPayMerchant {
  id: string;
  business_name: string;
  business_email: string;
  test_public_key: string;
  test_secret_key_masked: string;
  live_public_key: string;
  live_secret_key_masked: string;
  webhook_url: string | null;
  webhook_secret: string | null;
  fee_bearer: 'merchant' | 'customer';
  fee_percent: number;
  is_live_enabled: boolean;
  kyc_status?: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  kyc_data?: any;
  notify_on_payment: boolean;
  created_at: string;
}

export const BenixPayMerchantTab: React.FC = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();

  const [merchant, setMerchant] = useState<BenixPayMerchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mode and form states
  const [mode, setMode] = useState<'sandbox' | 'live'>('sandbox');
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [feeBearer, setFeeBearer] = useState<'merchant' | 'customer'>('merchant');
  
  // Modals & transient outputs
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycIdFront, setKycIdFront] = useState('');
  const [kycIdBack, setKycIdBack] = useState('');
  const [kycPassport, setKycPassport] = useState('');
  const [kycCompanyDocs, setKycCompanyDocs] = useState<string[]>([]);
  const [kycUploading, setKycUploading] = useState<string | null>(null);
  const [kycSubmitting, setKycSubmitting] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New rolled key display modal
  const [revealedKey, setRevealedKey] = useState<{ mode: string; key: string } | null>(null);
  const [testWebhookResult, setTestWebhookResult] = useState<{ success: boolean; status?: number; latency?: number; message?: string } | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('benix_auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const loadMerchant = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/benixpay/merchant/me', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        if (data.merchant) {
          setMerchant(data.merchant);
          setWebhookUrl(data.merchant.webhook_url || '');
          setFeeBearer(data.merchant.fee_bearer || 'merchant');
        }
      }
    } catch (err: any) {
      console.warn('Could not load Benix Pay merchant data:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setTxLoading(true);
      const res = await fetch('/api/benixpay/merchant/transactions', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err: any) {
      console.warn('Could not load merchant transactions:', err?.message);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    loadMerchant();
    loadTransactions();
  }, []);

  // Handle Onboarding / Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setStatusMsg({ type: 'error', text: 'Please enter your registered business or app name.' });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/benixpay/merchant/register', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          business_name: businessName.trim(),
          business_email: businessEmail.trim() || user?.email,
          fee_bearer: feeBearer
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register merchant account');

      setMerchant(data.merchant);
      setStatusMsg({ type: 'success', text: '🎉 Benix Pay Merchant Account registered! You can start sandbox testing immediately.' });
      
      // If a raw test secret key was returned upon creation, show it to copy
      if (data.credentials?.testSecretKey || data.raw_keys?.test_secret_key) {
        const key = data.credentials?.testSecretKey || data.raw_keys?.test_secret_key;
        setRevealedKey({ mode: 'Test', key });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Registration failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Roll API Keys
  const handleRollKey = async (targetMode: 'sandbox' | 'live') => {
    if (!window.confirm(`Are you sure you want to regenerate your ${targetMode.toUpperCase()} secret key? Previous API keys will stop working immediately.`)) {
      return;
    }

    try {
      setStatusMsg(null);
      const res = await fetch('/api/benixpay/merchant/keys/rotate', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ mode: targetMode })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Key rotation failed');

      const rotKey = data.credentials?.secretKey || data.secret_key;
      setRevealedKey({ mode: targetMode === 'sandbox' ? 'Test' : 'Live', key: rotKey });
      loadMerchant();
      setStatusMsg({ type: 'success', text: `Successfully rotated ${targetMode.toUpperCase()} API key!` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  // Update Settings (Webhook URL & Fee Bearer)
  const handleSaveSettings = async () => {
    try {
      setStatusMsg(null);
      const res = await fetch('/api/benixpay/merchant/settings', {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify({
          webhook_url: webhookUrl.trim() || null,
          fee_bearer: feeBearer
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      setMerchant(data.merchant);
      setStatusMsg({ type: 'success', text: 'Merchant webhook and fee configuration saved!' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  // Test Webhook Dispatch Ping
  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      setStatusMsg({ type: 'error', text: 'Please enter a webhook URL first.' });
      return;
    }

    try {
      setTestingWebhook(true);
      setTestWebhookResult(null);
      const res = await fetch('/api/benixpay/merchant/test-webhook', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ webhook_url: webhookUrl })
      });

      const data = await res.json();
      setTestWebhookResult(data);
    } catch (err: any) {
      setTestWebhookResult({ success: false, message: err.message });
    } finally {
      setTestingWebhook(false);
    }
  };

  // Upload KYC documents from the user's computer
  const handleKycUpload = async (
    files: FileList | null,
    kind: 'idFront' | 'idBack' | 'passport' | 'company'
  ) => {
    if (!files || files.length === 0) return;
    setKycUploading(kind);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadFileInChunks(file, { folder: 'kyc' });
        if (url) urls.push(url);
      }
      if (urls.length === 0) throw new Error('Upload failed. Please try again.');
      if (kind === 'idFront') setKycIdFront(urls[0]);
      else if (kind === 'idBack') setKycIdBack(urls[0]);
      else if (kind === 'passport') setKycPassport(urls[0]);
      else setKycCompanyDocs((prev) => [...prev, ...urls]);
    } catch (err: any) {
      alert(err?.message || 'Could not upload document.');
    } finally {
      setKycUploading(null);
    }
  };

  // Submit KYC for Live Activation
  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycIdFront || !kycIdBack || !kycPassport) {
      alert('Please upload the National ID front, National ID back, and your passport photo.');
      return;
    }
    try {
      setKycSubmitting(true);
      const res = await fetch('/api/benixpay/merchant/kyc', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          id_front_url: kycIdFront,
          id_back_url: kycIdBack,
          passport_photo_url: kycPassport,
          company_documents: kycCompanyDocs
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit KYC');

      setShowKycModal(false);
      setStatusMsg({ type: 'success', text: 'KYC documents submitted to Admin review! You will receive email/in-app notification upon review.' });
      loadMerchant();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setKycSubmitting(false);
    }
  };

  // Quick Sandbox Test Trigger
  const handleQuickSandboxTest = async () => {
    try {
      const res = await fetch('/api/benixpay/merchant/quick-test', {
        method: 'POST',
        headers: getAuthHeader()
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not initiate test checkout');

      if (data.checkout_url) {
        window.open(data.checkout_url, '_blank');
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <p className="text-xs font-semibold">Loading Benix Pay Merchant Hub...</p>
      </div>
    );
  }

  // Not Registered: Onboarding View
  if (!merchant) {
    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        {statusMsg && (
          <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}>
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#121824] via-[#0F141F] to-[#0B0E14] border border-blue-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>Instant Merchant Onboarding</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Accept MTN MoMo, Airtel & Cards <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Directly on Your Website or App
              </span>
            </h2>

            <p className="text-sm text-slate-400 leading-relaxed">
              Equip your online store, SaaS, or mobile app with seamless payment collection in Rwanda (RWF) and internationally (USD). Automatic wallet settlement, timing-safe webhooks, and developer-friendly REST APIs.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/docs/benixpay"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Developer Integration Guide</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <form onSubmit={handleRegister} className="p-6 rounded-2xl bg-black/40 border border-slate-800 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Registered Business / App Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kigali Fresh Market, TechCorp Ltd"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Support / Business Email</label>
                <input
                  type="email"
                  placeholder={user?.email || 'payments@yourcompany.com'}
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Transaction Fee Bearer (4.50%)</label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className={`p-3 rounded-xl border cursor-pointer text-xs flex flex-col gap-1 transition ${
                    feeBearer === 'merchant' ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="fee_bearer"
                      className="sr-only"
                      checked={feeBearer === 'merchant'}
                      onChange={() => setFeeBearer('merchant')}
                    />
                    <span className="font-bold">Merchant Absorbs Fee</span>
                    <span className="text-[10px] text-slate-400">Customer pays exact listed price. Fee deducted from payout.</span>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer text-xs flex flex-col gap-1 transition ${
                    feeBearer === 'customer' ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="fee_bearer"
                      className="sr-only"
                      checked={feeBearer === 'customer'}
                      onChange={() => setFeeBearer('customer')}
                    />
                    <span className="font-bold">Customer Pays Fee</span>
                    <span className="text-[10px] text-slate-400">Checkout adds 4.5% to customer. You receive 100% net amount.</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  'Activate Benix Pay Merchant Account'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Active Merchant Dashboard View
  const isLive = mode === 'live';
  const activePubKey = isLive ? merchant.live_public_key : merchant.test_public_key;
  const activeSecKeyMasked = isLive ? merchant.live_secret_key_masked : merchant.test_secret_key_masked;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Status Alert Banner */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
          statusMsg.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
        }`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Top Merchant Summary Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#121824] to-[#0F141F] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-white">{merchant.business_name}</h2>
            
            {merchant.is_live_enabled ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Live Active
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Sandbox Only (KYC Needed for Live)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Merchant ID: <code className="text-slate-300 font-mono">{merchant.id}</code> • Standard platform processing fee: <strong>{merchant.fee_percent}%</strong>
          </p>
        </div>

        {/* Mode Toggle & Live Activation CTA */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Environment Switcher */}
          <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center">
            <button
              onClick={() => setMode('sandbox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                !isLive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sandbox (Test)
            </button>
            <button
              onClick={() => {
                if (!merchant.is_live_enabled) {
                  setShowKycModal(true);
                } else {
                  setMode('live');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                isLive ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Mode
            </button>
          </div>

          <button
            onClick={handleQuickSandboxTest}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition active:scale-95"
            title="Open test checkout session in Sandbox"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Test Simulator</span>
          </button>
        </div>
      </div>

      {/* API Credentials Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box 1: API Keys */}
        <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">API Credentials ({mode.toUpperCase()})</h3>
            </div>
            <a
              href="/docs/benixpay"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>API Reference</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Public Key */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Public Key</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={activePubKey || 'Generating...'}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono select-all focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(activePubKey, 'pub_key')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Copy Public Key"
              >
                {copiedId === 'pub_key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Secret Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Secret Key</label>
              <button
                onClick={() => handleRollKey(mode)}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Roll Key</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={activeSecKeyMasked || '••••••••••••••••••••••••'}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono select-none focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              For security, secret keys are hashed with SHA-256 and only visible when generated or rotated.
            </p>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Webhook Signing Secret</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={merchant.webhook_secret || 'None'}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-purple-300 text-xs font-mono select-all focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(merchant.webhook_secret || '', 'wh_sec')}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Copy Webhook Secret"
              >
                {copiedId === 'wh_sec' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Box 2: Webhook Endpoint Configuration */}
        <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Webhook className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Webhook Configuration</h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                HMAC-SHA256 Protected
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Webhook Listener URL</label>
              <input
                type="url"
                placeholder="https://yourdomain.com/api/webhooks/benixpay"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-purple-500 transition"
              />
              <p className="text-[10px] text-slate-500">
                Must be an active public HTTPS endpoint. Localhost/RFC1918 subnets are blocked by SSRF firewall.
              </p>
            </div>

            {/* Fee Bearer Preference in Dashboard */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fee Bearer Mode</label>
              <select
                value={feeBearer}
                onChange={(e) => setFeeBearer(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-none"
              >
                <option value="merchant">Merchant Absorbs 4.5% (Customer pays exact amount)</option>
                <option value="customer">Customer Pays 4.5% (Fee added at checkout, merchant gets 100%)</option>
              </select>
            </div>

            {/* Test Webhook Output */}
            {testWebhookResult && (
              <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                testWebhookResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <span>{testWebhookResult.message || `HTTP ${testWebhookResult.status}`}</span>
                {testWebhookResult.latency && <span>{testWebhookResult.latency}ms</span>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80">
            <button
              onClick={handleSaveSettings}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition active:scale-95"
            >
              Save Webhook URL
            </button>
            <button
              onClick={handleTestWebhook}
              disabled={testingWebhook}
              className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {testingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Ping URL</span>
            </button>
          </div>
        </div>

      </div>

      {/* Transaction Ledger Table */}
      <div className="p-6 rounded-2xl bg-[#0F141F] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Merchant Transaction Ledger</h3>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference or txn ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No transactions recorded yet in this environment. Use the sandbox simulator to test!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Txn ID / Ref</th>
                  <th className="p-3">Environment</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Net Credited</th>
                  <th className="p-3">Payer Email</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions
                  .filter((t) => {
                    const q = searchQuery.toLowerCase();
                    return !q || t.id.toLowerCase().includes(q) || t.order_reference.toLowerCase().includes(q) || (t.customer_email || '').toLowerCase().includes(q);
                  })
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/30 transition">
                      <td className="p-3 font-mono">
                        <div className="font-bold text-white">{t.id}</div>
                        <div className="text-[10px] text-slate-400">{t.order_reference}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          t.mode === 'live' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {t.mode}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white">
                        {formatAmount(Number(t.amount))} {t.currency}
                      </td>
                      <td className="p-3 font-bold text-emerald-400">
                        {formatAmount(Number(t.net_amount))} {t.currency}
                      </td>
                      <td className="p-3 text-slate-400 font-sans truncate max-w-[150px]">
                        {t.customer_email || t.customer_phone || '—'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                          t.status === 'successful'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : t.status === 'failed'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {t.status === 'successful' && <CheckCircle2 className="w-3 h-3" />}
                          {t.status === 'failed' && <XCircle className="w-3 h-3" />}
                          {t.status === 'pending' && <Clock className="w-3 h-3" />}
                          <span>{t.status}</span>
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Secret Key Revealed Modal */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F141F] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Copy Your {revealedKey.mode} Secret Key</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This secret key will <strong>never be shown again</strong>. Please copy and store it securely in your server environment variables (.env).
            </p>

            <div className="p-3 rounded-xl bg-black/60 border border-slate-800 font-mono text-xs text-amber-300 break-all select-all">
              {revealedKey.key}
            </div>

            <button
              onClick={() => {
                copyToClipboard(revealedKey.key, 'revealed_key');
                setRevealedKey(null);
              }}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition"
            >
              Copy Key & Done
            </button>
          </div>
        </div>
      )}

      {/* KYC Submission Modal */}
      {showKycModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0F141F] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Submit KYC for Live Mode</h3>
              </div>
              <button onClick={() => setShowKycModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Upload clear photos or scans from your computer. Your National ID (front and back) and a passport photo are required. Company documents are optional.
            </p>

            <form onSubmit={handleSubmitKyc} className="space-y-4 pt-2">
              {/* National ID Front */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">National ID — Front *</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:border-blue-500 transition-colors">
                    {kycUploading === 'idFront' ? 'Uploading...' : kycIdFront ? 'Replace file' : 'Choose from computer'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleKycUpload(e.target.files, 'idFront')}
                    />
                  </label>
                  {kycIdFront && (
                    <a href={kycIdFront} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-emerald-400 truncate">
                      Uploaded ✓
                    </a>
                  )}
                </div>
              </div>

              {/* National ID Back */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">National ID — Back *</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:border-blue-500 transition-colors">
                    {kycUploading === 'idBack' ? 'Uploading...' : kycIdBack ? 'Replace file' : 'Choose from computer'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleKycUpload(e.target.files, 'idBack')}
                    />
                  </label>
                  {kycIdBack && (
                    <a href={kycIdBack} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-emerald-400 truncate">
                      Uploaded ✓
                    </a>
                  )}
                </div>
              </div>

              {/* Passport Photo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Passport Photo *</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:border-blue-500 transition-colors">
                    {kycUploading === 'passport' ? 'Uploading...' : kycPassport ? 'Replace file' : 'Choose from computer'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleKycUpload(e.target.files, 'passport')}
                    />
                  </label>
                  {kycPassport && (
                    <a href={kycPassport} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-emerald-400 truncate">
                      Uploaded ✓
                    </a>
                  )}
                </div>
              </div>

              {/* Optional Company Documents */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Company Documents (optional)</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:border-blue-500 transition-colors">
                    {kycUploading === 'company' ? 'Uploading...' : 'Choose files'}
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => handleKycUpload(e.target.files, 'company')}
                    />
                  </label>
                  <span className="text-[11px] text-slate-500">{kycCompanyDocs.length} file(s) attached</span>
                </div>
                {kycCompanyDocs.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {kycCompanyDocs.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-[11px] text-blue-400 hover:text-blue-300 truncate"
                      >
                        Company document {idx + 1} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKycModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={kycSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50"
                >
                  {kycSubmitting ? 'Submitting...' : 'Submit to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BenixPayMerchantTab;
