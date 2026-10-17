'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useChoir } from '@/lib/context/ChoirContext';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Lock,
  KeyRound,
  Crown,
  CreditCard
} from 'lucide-react';

export default function ProfileSettingsPage() {
  const { user, refreshProfile } = useAuth();
  const { activeChoir, refreshChoirs } = useChoir();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subscription Cancellation State
  const [cancelingSub, setCancelingSub] = useState(false);
  const [subMsg, setSubMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatar_url || null);
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file (PNG, JPG, WEBP).' });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'avatars');
      formData.append('choirId', user.id);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setAvatarUrl(data.url);
        setMessage({ type: 'success', text: 'Profile picture uploaded! Click "Save Changes" to save your profile.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to upload profile picture.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Server error uploading profile picture.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const updatedFields = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('profiles')
        .update(updatedFields)
        .eq('id', user.id);

      if (dbError) throw dbError;

      await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          avatar_url: avatarUrl,
        },
      });

      await refreshProfile();
      setMessage({ type: 'success', text: 'Your profile settings have been updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save profile changes.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setUpdatingPassword(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordMsg({ type: 'error', text: error.message || 'Failed to update password.' });
      } else {
        setPasswordMsg({ type: 'success', text: 'Your password has been changed successfully!' });
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeChoir) return;
    if (!confirm(`Are you sure you want to cancel the subscription for "${activeChoir.name}"? You will be downgraded to the Free tier.`)) return;

    setCancelingSub(true);
    setSubMsg(null);

    try {
      const res = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choirId: activeChoir.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubMsg({ type: 'success', text: 'Subscription canceled. Your choir has been downgraded to the Free plan.' });
        await refreshChoirs(activeChoir.id);
      } else {
        setSubMsg({ type: 'error', text: data.error || 'Failed to cancel subscription.' });
      }
    } catch (err: any) {
      setSubMsg({ type: 'error', text: 'Server error processing subscription cancellation.' });
    } finally {
      setCancelingSub(false);
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-4 max-w-xl mx-auto">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
        <p className="text-xs">Loading profile settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4 text-slate-900 dark:text-white">
      {/* Back to Dashboard Link */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <User className="w-8 h-8 text-blue-600 dark:text-blue-400" /> Account &amp; Profile Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Update your personal details, contact number, profile picture, and account security
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
          message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Avatar Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl flex flex-col sm:flex-row items-center gap-6 shadow-sm">
        <div className="relative group">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName || 'User Avatar'}
              className="w-24 h-24 rounded-3xl object-cover border-2 border-blue-200 dark:border-blue-800 shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-md border-2 border-blue-400">
              {fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          <label className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl shadow-md border border-blue-400 cursor-pointer transition-transform hover:scale-110">
            {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={uploadingAvatar}
            />
          </label>
        </div>

        <div className="space-y-1 text-center sm:text-left flex-1">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{fullName || 'Your Name'}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1">
            <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {user.email}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 px-2.5 py-0.5 rounded-full">
              Member Account
            </span>
            {user.is_super_admin && (
              <span className="text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Platform Super Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Subscription & Billing Card */}
      {activeChoir && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" /> Choir Subscription &amp; Billing
            </h3>
            <Link
              href={`/choir/plan-select?choirId=${activeChoir.id}`}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 px-3 py-1.5 rounded-xl transition-all"
            >
              Change Plan →
            </Link>
          </div>

          {subMsg && (
            <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
              subMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}>
              {subMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{subMsg.text}</span>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">Current Active Choir: <strong className="text-slate-900 dark:text-white">{activeChoir.name}</strong></div>
              <div className="text-sm font-extrabold text-blue-600 dark:text-blue-300 flex items-center gap-2">
                <span>Active Subscription Tier</span>
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-full font-mono uppercase">
                  Recurring Monthly
                </span>
              </div>
            </div>

            <button
              onClick={handleCancelSubscription}
              disabled={cancelingSub}
              className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
            >
              {cancelingSub ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cancel Subscription Anytime'}
            </button>
          </div>
        </div>
      )}

      {/* Profile Details Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Personal Details
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +1 555 123 4567"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Used by Choir Masters &amp; Section Leaders to communicate regarding rehearsal schedules.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-80"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Email address is managed via login credentials.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>


      {/* Password & Security Settings Card */}
      <form onSubmit={handlePasswordChange} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Security &amp; Password Reset
        </h3>

        {passwordMsg && (
          <div className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
            passwordMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}>
            {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={updatingPassword}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            {updatingPassword ? 'Updating Password...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
