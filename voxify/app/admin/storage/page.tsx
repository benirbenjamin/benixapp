'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BackButton } from '@/components/ui/BackButton';
import {
  HardDrive,
  Cloud,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Mail,
  Folder,
  Layers,
  Key,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Check,
  Copy,
  Zap,
} from 'lucide-react';

interface GoogleDriveAccount {
  id: string;
  account_email: string;
  folder_id: string;
  credentials_json?: any;
  status: 'active' | 'full' | 'disabled';
  max_storage_mb: number;
  used_storage_mb: number;
  file_count: number;
  created_at?: string;
}

interface PlatformStorageOverview {
  storage_mode: 'dual_storage';
  bucket: {
    quota_mb: number;
    used_mb: number;
    available_mb: number;
    usage_percent: number;
    is_full: boolean;
    file_count: number;
  };
  drive_pool: {
    total_quota_mb: number;
    total_used_mb: number;
    total_available_mb: number;
    usage_percent: number;
    active_count: number;
    total_count: number;
    accounts: GoogleDriveAccount[];
  };
  combined: {
    total_quota_mb: number;
    total_used_mb: number;
    total_available_mb: number;
    usage_percent: number;
    total_files: number;
  };
}

export default function AdminStoragePage() {
  const [overview, setOverview] = useState<PlatformStorageOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Setup Guide Toggle
  const [showSetupGuide, setShowSetupGuide] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Bucket Quota Edit State
  const [editingBucketQuota, setEditingBucketQuota] = useState(false);
  const [newBucketQuotaGb, setNewBucketQuotaGb] = useState('1');
  const [updatingQuota, setUpdatingQuota] = useState(false);

  // Modal / Form state for adding new Google Drive account
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'fields' | 'json'>('fields');
  const [addingAccount, setAddingAccount] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form Fields for OAuth Refresh Token Setup
  const [accountEmail, setAccountEmail] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [folderId, setFolderId] = useState('');
  const [maxGb, setMaxGb] = useState('15');
  const [rawJson, setRawJson] = useState('');

  // Per-account test status tracker
  const [testingAccountId, setTestingAccountId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Using AXIOS for all API requests
      const response = await axios.get('/api/admin/storage');
      setOverview(response.data);
      if (response.data?.bucket?.quota_mb) {
        setNewBucketQuotaGb((response.data.bucket.quota_mb / 1024).toFixed(1));
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to load storage configuration';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  }

  function buildCredentialsObject() {
    if (addMode === 'json') {
      try {
        return JSON.parse(rawJson);
      } catch {
        return { access_token: rawJson.trim() };
      }
    }

    return {
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
      refresh_token: refreshToken.trim(),
    };
  }

  async function handleTestConnectionInModal() {
    const creds = buildCredentialsObject();
    if (!creds.refresh_token && !creds.client_email && !creds.access_token) {
      setTestResult({
        success: false,
        message: 'Please provide at least a Refresh Token, Client ID, and Client Secret to test.',
      });
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      const res = await axios.post('/api/admin/storage', {
        action: 'test_connection',
        credentials_json: creds,
      });

      if (res.data?.success) {
        const quota = res.data.storageQuota;
        const info = `${res.data.email || 'Drive Account'} connected! (Capacity: ${quota?.limitGb || 15} GB, Available: ${quota?.availableGb ?? 'N/A'} GB)`;
        setTestResult({ success: true, message: `✅ ${info}` });
        if (!accountEmail && res.data.email) {
          setAccountEmail(res.data.email);
        }
      } else {
        setTestResult({
          success: false,
          message: `❌ Connection failed: ${res.data?.error || 'Could not authenticate with Google Drive'}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `❌ Error testing credentials: ${err.response?.data?.error || err.message}`,
      });
    } finally {
      setTestingConnection(false);
    }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    const creds = buildCredentialsObject();

    if (!accountEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter a Google Drive account email' });
      return;
    }

    if (addMode === 'fields') {
      if (!clientId.trim() || !clientSecret.trim() || !refreshToken.trim()) {
        setMessage({
          type: 'error',
          text: 'Please provide Client ID, Client Secret, and Refresh Token.',
        });
        return;
      }
    } else if (!rawJson.trim()) {
      setMessage({ type: 'error', text: 'Please paste credentials JSON.' });
      return;
    }

    setAddingAccount(true);
    setMessage(null);

    try {
      const maxMb = (parseFloat(maxGb) || 15) * 1024;
      const res = await axios.post('/api/admin/storage', {
        action: 'add_account',
        account_email: accountEmail.trim(),
        folder_id: folderId.trim(),
        credentials_json: creds,
        max_storage_mb: maxMb,
      });

      if (res.data?.data) {
        setShowAddModal(false);
        setAccountEmail('');
        setClientId('');
        setClientSecret('');
        setRefreshToken('');
        setFolderId('');
        setMaxGb('15');
        setRawJson('');
        setTestResult(null);
        setMessage({
          type: 'success',
          text: `Google Drive account '${res.data.data.account_email}' verified and added to pool with Refresh Token!`,
        });
        await loadData();
      } else {
        setMessage({ type: 'error', text: res.data?.error || 'Failed to add Google Drive account' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Error adding account' });
    } finally {
      setAddingAccount(false);
    }
  }

  async function handleUpdateBucketQuota() {
    setUpdatingQuota(true);
    setMessage(null);
    try {
      const quotaMb = Math.round((parseFloat(newBucketQuotaGb) || 1) * 1024);
      const res = await axios.post('/api/admin/storage', {
        action: 'update_bucket_quota',
        quota_mb: quotaMb,
      });

      if (res.data?.success) {
        setEditingBucketQuota(false);
        setMessage({ type: 'success', text: `Bucket storage quota updated to ${newBucketQuotaGb} GB!` });
        await loadData();
      } else {
        setMessage({ type: 'error', text: res.data?.error || 'Failed to update quota' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Error updating quota' });
    } finally {
      setUpdatingQuota(false);
    }
  }

  async function handleToggleStatus(account: GoogleDriveAccount) {
    const nextStatus = account.status === 'active' ? 'disabled' : 'active';
    try {
      const res = await axios.post('/api/admin/storage', {
        action: 'update_account',
        id: account.id,
        updates: { status: nextStatus },
      });

      if (res.data?.success) {
        setMessage({
          type: 'success',
          text: `Account '${account.account_email}' status set to ${nextStatus}`,
        });
        await loadData();
      } else {
        setMessage({ type: 'error', text: res.data?.error || 'Failed to update account status' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  }

  async function handleDeleteAccount(id: string, email: string) {
    if (!confirm(`Are you sure you want to remove '${email}' from the Google Drive pool?`)) return;

    try {
      const res = await axios.post('/api/admin/storage', {
        action: 'delete_account',
        id,
      });

      if (res.data?.success) {
        setMessage({ type: 'success', text: `Removed '${email}' from pool.` });
        await loadData();
      } else {
        setMessage({ type: 'error', text: res.data?.error || 'Failed to delete account' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  }

  async function handleResetFullAccounts() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post('/api/admin/storage', {
        action: 'reset_full_accounts',
      });

      if (res.data?.count !== undefined) {
        setMessage({
          type: 'success',
          text: `Reactivated ${res.data.count || 0} account(s) back to active status!`,
        });
        setOverview(res.data);
      } else {
        setMessage({ type: 'error', text: res.data?.error || 'Failed to reactivate accounts' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleTestAccount(account: GoogleDriveAccount) {
    setTestingAccountId(account.id);
    try {
      const res = await axios.post('/api/admin/storage', {
        action: 'test_connection',
        id: account.id,
      });

      if (res.data?.success) {
        const q = res.data.storageQuota;
        setMessage({
          type: 'success',
          text: `✅ Connection Verified for ${account.account_email}! Free: ${q?.availableGb ?? 'N/A'} GB / ${q?.limitGb ?? 'N/A'} GB.`,
        });
      } else {
        setMessage({
          type: 'error',
          text: `❌ Connection error for ${account.account_email}: ${res.data?.error || 'Failed to refresh token'}`,
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `❌ Error testing account: ${err.response?.data?.error || err.message}`,
      });
    } finally {
      setTestingAccountId(null);
    }
  }

  const bucket = overview?.bucket;
  const drivePool = overview?.drive_pool;
  const combined = overview?.combined;
  const accounts = drivePool?.accounts || [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <BackButton href="/admin" label="Back to Super Admin Dashboard" className="mb-3" />
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
              <HardDrive className="w-8 h-8 text-purple-500" />
              Unified Dual Storage &amp; Google Drive Setup
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Dual storage engine: stores in both Bucket &amp; Google Drive. When Bucket is full, automatically routes to Drive only.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* System Alert Messages */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between border ${
              message.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Architecture Status Banner */}
        <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Unified Storage Policy: Dual Storing + Drive Overflow
                </h2>
                <p className="text-xs text-slate-300">
                  {bucket?.is_full
                    ? '⚠️ Bucket Storage is currently FULL! All new tracks are storing in Google Drive ONLY.'
                    : '✅ Files are stored in BOTH Google Drive and Supabase Bucket for instant access and zero file loss.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  bucket?.is_full
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                {bucket?.is_full ? 'Overflow Mode: Drive Only' : 'Active: Dual Storage (Drive + Bucket)'}
              </span>
            </div>
          </div>
        </div>

        {/* 1. Storage Quota, Used Storage & Available Storage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Supabase Bucket Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Database className="w-5 h-5" /> Supabase Storage Bucket
                </div>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    bucket?.is_full
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {bucket?.is_full ? 'FULL' : 'OK'}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Storage Used</span>
                  <span className="text-2xl font-black text-white">
                    {bucket ? (bucket.used_mb >= 1024 ? `${(bucket.used_mb / 1024).toFixed(2)} GB` : `${bucket.used_mb.toFixed(1)} MB`) : '0 MB'}
                  </span>
                </div>

                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className={`h-full rounded-full transition-all ${
                      bucket?.is_full ? 'bg-rose-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${bucket?.usage_percent || 0}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Storage Quota:</span>
                    <strong className="text-slate-200">
                      {bucket ? `${(bucket.quota_mb / 1024).toFixed(1)} GB (${bucket.quota_mb} MB)` : '1.0 GB'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Available Storage:</span>
                    <strong className={bucket?.is_full ? 'text-rose-400' : 'text-emerald-400'}>
                      {bucket ? `${(bucket.available_mb / 1024).toFixed(2)} GB` : '0 GB'}
                    </strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Stored Files: <strong className="text-white">{bucket?.file_count || 0}</strong></span>
                  <span>Usage: <strong className="text-white">{bucket?.usage_percent || 0}%</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/60">
              {editingBucketQuota ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={newBucketQuotaGb}
                    onChange={(e) => setNewBucketQuotaGb(e.target.value)}
                    className="w-24 bg-slate-900 border border-purple-500 rounded-lg px-2.5 py-1 text-xs text-white"
                    placeholder="1.0"
                  />
                  <span className="text-xs text-slate-400">GB</span>
                  <button
                    onClick={handleUpdateBucketQuota}
                    disabled={updatingQuota}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingBucketQuota(false)}
                    className="px-2 py-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingBucketQuota(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  ⚙️ Configure Bucket Quota Limit
                </button>
              )}
            </div>
          </div>

          {/* Google Drive Storage Pool Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Cloud className="w-5 h-5" /> Google Drive Storage Pool
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-950 text-blue-400 border border-blue-800">
                  {drivePool?.active_count || 0} Active Accounts
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Storage Used</span>
                  <span className="text-2xl font-black text-white">
                    {drivePool ? `${(drivePool.total_used_mb / 1024).toFixed(2)} GB` : '0 GB'}
                  </span>
                </div>

                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${drivePool?.usage_percent || 0}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Storage Quota:</span>
                    <strong className="text-slate-200">
                      {drivePool ? `${(drivePool.total_quota_mb / 1024).toFixed(1)} GB` : '0 GB'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Available Storage:</span>
                    <strong className="text-emerald-400">
                      {drivePool ? `${(drivePool.total_available_mb / 1024).toFixed(2)} GB` : '0 GB'}
                    </strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Total Drive Files: <strong className="text-white">{accounts.reduce((sum, a) => sum + (a.file_count || 0), 0)}</strong></span>
                  <span>Usage: <strong className="text-white">{drivePool?.usage_percent || 0}%</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Drive Account
              </button>
              <button
                onClick={handleResetFullAccounts}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Reactivate Pool
              </button>
            </div>
          </div>

          {/* Combined Platform Storage Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Layers className="w-5 h-5" /> Total Platform Storage
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Drive + Bucket
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Total Used Storage</span>
                  <span className="text-2xl font-black text-white">
                    {combined ? `${(combined.total_used_mb / 1024).toFixed(2)} GB` : '0 GB'}
                  </span>
                </div>

                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${combined?.usage_percent || 0}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Total Quota:</span>
                    <strong className="text-slate-200">
                      {combined ? `${(combined.total_quota_mb / 1024).toFixed(1)} GB` : '0 GB'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Total Available:</span>
                    <strong className="text-emerald-400">
                      {combined ? `${(combined.total_available_mb / 1024).toFixed(2)} GB` : '0 GB'}
                    </strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Total Tracks &amp; PDFs: <strong className="text-white">{combined?.total_files || 0}</strong></span>
                  <span>Overall Usage: <strong className="text-white">{combined?.usage_percent || 0}%</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-700/60 text-xs text-slate-400">
              Fast CDN delivery + resilient Google Drive redundancy
            </div>
          </div>
        </div>

        {/* 2. Interactive Setup Instructions for Google Drive with Refresh Token */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
          <button
            onClick={() => setShowSetupGuide(!showSetupGuide)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-800/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  How to Setup Google Drive Storage using Refresh Token (Step-by-Step Guide)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Follow these 6 steps to link any personal or workspace Google Drive account for 100% free storage.
                </p>
              </div>
            </div>

            {showSetupGuide ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {showSetupGuide && (
            <div className="p-6 pt-0 border-t border-slate-700/60 space-y-6 text-sm text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {/* Step 1 */}
                <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Step 1
                    </span>
                    <a
                      href="https://console.cloud.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      console.cloud.google.com <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <h4 className="font-bold text-white text-sm">Create or Select Google Cloud Project</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Log into Google Cloud Console with your Google account. Click the project dropdown at the top and click <strong>&quot;New Project&quot;</strong> (name it e.g. <code className="text-purple-300">Voxify-Storage</code>).
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Step 2
                    </span>
                    <a
                      href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      Enable Drive API <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <h4 className="font-bold text-white text-sm">Enable the Google Drive API</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    In the navigation menu, go to <strong>APIs &amp; Services &gt; Library</strong>. Search for <strong>&quot;Google Drive API&quot;</strong> and click <strong>&quot;Enable&quot;</strong>.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Step 3
                    </span>
                    <span className="text-xs text-slate-400">OAuth Consent Screen</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Configure OAuth Consent Screen</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Go to <strong>APIs &amp; Services &gt; OAuth consent screen</strong>:
                    <br />• Select User Type: <strong>External</strong>.
                    <br />• Fill App Name (<code className="text-purple-300">Voxify</code>) and user support email.
                    <br />• Under <strong>Test Users</strong>, add your Google account email!
                  </p>
                </div>

                {/* Step 4 */}
                <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Step 4
                    </span>
                    <span className="text-xs text-slate-400">Create Credentials</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Create OAuth 2.0 Client ID</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Go to <strong>APIs &amp; Services &gt; Credentials &gt; Create Credentials &gt; OAuth client ID</strong>:
                    <br />• Application Type: <strong>Web application</strong>
                    <br />• Under <strong>Authorized redirect URIs</strong>, add:
                  </p>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs font-mono">
                    <span className="truncate text-blue-300">https://developers.google.com/oauthplayground</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('https://developers.google.com/oauthplayground', 'redirect')}
                      className="ml-2 text-slate-400 hover:text-white"
                      title="Copy URI"
                    >
                      {copiedText === 'redirect' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">Copy your <strong>Client ID</strong> and <strong>Client Secret</strong>.</p>
                </div>

                {/* Step 5 */}
                <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Step 5 (Key Step)
                    </span>
                    <a
                      href="https://developers.google.com/oauthplayground"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      Open Google OAuth Playground <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <h4 className="font-bold text-white text-sm">Generate Refresh Token in OAuth Playground</h4>
                  <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Open <strong>developers.google.com/oauthplayground</strong> in your browser.</li>
                    <li>Click the <strong>⚙️ Gear icon (OAuth 2.0 configuration)</strong> in the top-right corner.</li>
                    <li>Check the checkbox <strong>&quot;Use your own OAuth credentials&quot;</strong>.</li>
                    <li>Paste your <strong>OAuth Client ID</strong> and <strong>OAuth Client secret</strong> from Step 4.</li>
                    <li>On the left pane, under <strong>Step 1 Select &amp; authorize APIs</strong>, scroll to <strong>Drive API v3</strong>.</li>
                    <li>Select: <code className="text-purple-300">https://www.googleapis.com/auth/drive</code> and <code className="text-purple-300">https://www.googleapis.com/auth/drive.file</code>.</li>
                    <li>Click the blue <strong>&quot;Authorize APIs&quot;</strong> button &gt; Sign in with your Google account &gt; Click Allow.</li>
                    <li>In Step 2 on Playground, click <strong>&quot;Exchange authorization code for tokens&quot;</strong>.</li>
                    <li>Look at the response on the right and copy the <strong>Refresh token</strong> value!</li>
                  </ol>
                </div>

                {/* Step 6 */}
                <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Step 6
                    </span>
                    <span className="text-xs text-emerald-400">Save to Voxify</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">Add the Account Below</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Click <strong>&quot;Add Google Drive Account&quot;</strong> below, enter your Account Email, Client ID, Client Secret, and Refresh Token, then click <strong>&quot;Test Connection&quot;</strong> and save! Voxify will automatically refresh tokens via axios forever with zero interruptions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Google Drive Email Accounts Pool Manager */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" />
                Google Drive Account Rotation Pool
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Multi-account rotation pool powered by OAuth Refresh Tokens. When an account fills up, uploads automatically move to the next account.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFullAccounts}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-medium text-xs transition cursor-pointer"
                title="Reactivate accounts"
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-400" /> Reactivate Pool
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-purple-600/30 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Google Drive Account
              </button>
            </div>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/40 p-6">
              <Cloud className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Google Drive Accounts Configured Yet</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto mt-1 mb-4">
                Add your Google Drive accounts with OAuth Refresh Tokens to enable permanent free storage for Choir tracks and Artist songs.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl text-sm transition cursor-pointer shadow-lg shadow-purple-600/30"
              >
                Add First Drive Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((acc) => {
                const usedGb = (acc.used_storage_mb / 1024).toFixed(2);
                const maxGbVal = (acc.max_storage_mb / 1024).toFixed(0);
                const availGb = Math.max(0, (acc.max_storage_mb - acc.used_storage_mb) / 1024).toFixed(2);
                const pct = Math.min(100, Math.round((acc.used_storage_mb / (acc.max_storage_mb || 15000)) * 100));

                return (
                  <div
                    key={acc.id}
                    className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-5 space-y-4 shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-9 h-9 rounded-lg bg-purple-900/40 border border-purple-500/30 flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="truncate">
                            <h4 className="font-bold text-white text-sm truncate">{acc.account_email}</h4>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Folder className="w-3 h-3 text-slate-500" /> Folder ID: {acc.folder_id || 'Root Drive'}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${
                            acc.status === 'active'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : acc.status === 'full'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {acc.status}
                        </span>
                      </div>

                      {/* Usage Details */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-400">Used: {usedGb} GB</span>
                          <span className="text-emerald-400">Available: {availGb} GB</span>
                          <span className="text-slate-200 font-bold">Quota: {maxGbVal} GB</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 90 ? 'bg-amber-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
                        <span>Stored Files: <strong className="text-white">{acc.file_count || 0}</strong></span>
                        <span className="text-[11px] opacity-70">
                          Added: {new Date(acc.created_at || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestAccount(acc)}
                          disabled={testingAccountId === acc.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                        >
                          {testingAccountId === acc.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                          ) : (
                            <Key className="w-3 h-3 text-purple-400" />
                          )}
                          Test Connection
                        </button>

                        <button
                          onClick={() => handleToggleStatus(acc)}
                          className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            acc.status === 'active'
                              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                          }`}
                        >
                          {acc.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteAccount(acc.id, acc.account_email)}
                        className="text-rose-400 hover:text-rose-300 p-1.5 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                        title="Delete from pool"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Modal: Add Google Drive Email Account with Refresh Token */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl my-8">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-purple-400" />
                  Add Google Drive Account (OAuth Refresh Token)
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Mode Switcher */}
              <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setAddMode('fields')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    addMode === 'fields' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  OAuth Credentials Form (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('json')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    addMode === 'json' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Paste JSON Key
                </button>
              </div>

              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Google Account Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    placeholder="e.g. your-email@gmail.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                {addMode === 'fields' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Google OAuth Client ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Google OAuth Client Secret *
                      </label>
                      <input
                        type="password"
                        required
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        placeholder="e.g. GOCSPX-xxxxxxxxxxxxxxxx"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Google OAuth Refresh Token *
                      </label>
                      <input
                        type="password"
                        required
                        value={refreshToken}
                        onChange={(e) => setRefreshToken(e.target.value)}
                        placeholder="e.g. 1//04xxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Generated in Step 5 from Google OAuth Playground with Drive API scope.
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Credentials JSON *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={rawJson}
                      onChange={(e) => setRawJson(e.target.value)}
                      placeholder='Paste JSON containing { "client_id": "...", "client_secret": "...", "refresh_token": "..." }'
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target Folder ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={folderId}
                      onChange={(e) => setFolderId(e.target.value)}
                      placeholder="Leave empty for Root Drive"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Max Storage Limit (GB)
                    </label>
                    <input
                      type="number"
                      value={maxGb}
                      onChange={(e) => setMaxGb(e.target.value)}
                      placeholder="15"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Test Connection Banner */}
                {testResult && (
                  <div
                    className={`p-3 rounded-xl text-xs border ${
                      testResult.success
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleTestConnectionInModal}
                    disabled={testingConnection}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {testingConnection ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    Test Connection
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={addingAccount}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/30 transition flex items-center gap-2 cursor-pointer"
                    >
                      {addingAccount && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      Save to Pool
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
