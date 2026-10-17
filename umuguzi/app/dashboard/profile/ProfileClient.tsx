"use client";

import React, { useState } from "react";
import { User, Phone, MapPin, Globe, CheckCircle2, AlertCircle, Image as ImageIcon, Lock, KeyRound, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";

export default function ProfileClient({ profile }: { profile: any }) {
  const { refreshUser } = useApp();

  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [city, setCity] = useState(profile?.city || "Kigali");
  const [country, setCountry] = useState(profile?.country || "Rwanda");
  const [website, setWebsite] = useState(profile?.website || "");
  const [avatar, setAvatar] = useState(profile?.avatar || "");

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // 2FA state
  const [twoFactor, setTwoFactor] = useState(Boolean(profile?.twoFactorEnabled));
  const [toggling2FA, setToggling2FA] = useState(false);

  const handleToggle2FA = async () => {
    setToggling2FA(true);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twoFactorEnabled: !twoFactor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update 2FA");
      setTwoFactor(!twoFactor);
      await refreshUser();
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setToggling2FA(false);
    }
  };

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) setAvatar(data.url);
    } catch {
      setError("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          phone,
          city,
          country,
          website,
          avatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900">Profile Settings</h1>
        <p className="text-xs text-slate-500">
          Update your public profile, contact details, and account preferences.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile successfully updated!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-brand text-white flex items-center justify-center font-bold text-2xl">
                {displayName.charAt(0)}
              </div>
            )}

            <div>
              <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer inline-flex items-center gap-2 transition-colors">
                <ImageIcon className="w-4 h-4 text-brand" />
                <span>{uploadingAvatar ? "Uploading..." : "Change Avatar"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Bio / About You
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other members what you do or create..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number (For MoMo / Contact)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250 788 123 456"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Kigali"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Website / Portfolio URL
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourportfolio.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand hover:bg-brand-hover text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {loading ? "Saving Profile..." : "Save Profile Changes"}
          </button>
        </form>
      </div>

      {/* Security & Password Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand" />
            <span>Security & Password</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ensure your account is protected with a secure password.
          </p>
        </div>

        {passwordError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Password updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
            className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            {passwordLoading ? "Updating Password..." : "Update Password"}
          </button>
        </form>

        {/* Two-Factor Authentication Control */}
        <div className="pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand" />
                <span className="font-bold text-sm text-slate-900">Two-Factor Authentication (2FA)</span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${twoFactor ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                  {twoFactor ? "Enabled" : "Disabled (Bypassed)"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                When <strong>Disabled</strong>, you bypass 2FA upon login and log in directly using your password.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggle2FA}
              disabled={toggling2FA}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 ${
                twoFactor
                  ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                  : "bg-brand hover:bg-brand-hover text-white"
              }`}
            >
              {toggling2FA ? "Saving..." : twoFactor ? "Disable 2FA" : "Enable 2FA"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
