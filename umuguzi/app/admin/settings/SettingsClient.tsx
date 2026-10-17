"use client";

import React, { useState } from "react";
import {
  Palette,
  Mail,
  CreditCard,
  HardDrive,
  Save,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Smartphone,
  Shield,
  Send,
  Loader2,
  Share2,
  Layers,
  Megaphone,
  DollarSign,
  Sparkles,
  Cloud,
  Plus,
  Trash2,
  RefreshCw,
  Server,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { SiteSettings } from "@/types";

interface DriveAccountConfig {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId?: string;
}

export default function SettingsClient({ initialSettings }: { initialSettings: SiteSettings }) {
  const { updateLocalSettings } = useApp();
  const [formData, setFormData] = useState<SiteSettings>(initialSettings);
  const [activeTab, setActiveTab] = useState<"branding" | "contacts" | "payments" | "storage" | "security" | "referrals" | "ads">("branding");
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<any>(null);

  // Google Drive Multi-Drive Pool State
  const [driveAccounts, setDriveAccounts] = useState<DriveAccountConfig[]>(() => {
    try {
      if (initialSettings.google_drive_accounts) {
        const parsed = JSON.parse(initialSettings.google_drive_accounts);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: "drive-1",
        name: "Primary Google Drive (Drive #1)",
        clientId: "",
        clientSecret: "",
        refreshToken: "",
        folderId: "",
      },
      {
        id: "drive-2",
        name: "Secondary Failover Google Drive (Drive #2)",
        clientId: "",
        clientSecret: "",
        refreshToken: "",
        folderId: "",
      },
    ];
  });
  const [testingDriveId, setTestingDriveId] = useState<string | null>(null);
  const [driveTestResults, setDriveTestResults] = useState<Record<string, any>>({});

  const handleDriveAccountChange = (id: string, field: keyof DriveAccountConfig, value: string) => {
    setDriveAccounts((prev) => {
      const updated = prev.map((acc) => (acc.id === id ? { ...acc, [field]: value } : acc));
      handleChange("google_drive_accounts", JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddDriveAccount = () => {
    setDriveAccounts((prev) => {
      const nextNum = prev.length + 1;
      const newAcc: DriveAccountConfig = {
        id: `drive-${Date.now().toString().slice(-4)}`,
        name: `Failover Google Drive #${nextNum}`,
        clientId: "",
        clientSecret: "",
        refreshToken: "",
        folderId: "",
      };
      const updated = [...prev, newAcc];
      handleChange("google_drive_accounts", JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveDriveAccount = (id: string) => {
    setDriveAccounts((prev) => {
      const updated = prev.filter((acc) => acc.id !== id);
      handleChange("google_drive_accounts", JSON.stringify(updated));
      return updated;
    });
  };

  const handleTestDrive = async (account: DriveAccountConfig) => {
    if (!account.clientId || !account.refreshToken) {
      setDriveTestResults((prev) => ({
        ...prev,
        [account.id]: { success: false, error: "Please provide Client ID and Refresh Token first." },
      }));
      return;
    }

    setTestingDriveId(account.id);
    setDriveTestResults((prev) => ({ ...prev, [account.id]: null }));
    try {
      const res = await fetch("/api/admin/drives/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: account.clientId,
          clientSecret: account.clientSecret,
          refreshToken: account.refreshToken,
          name: account.name,
        }),
      });
      const data = await res.json();
      setDriveTestResults((prev) => ({ ...prev, [account.id]: data }));
    } catch (err: any) {
      setDriveTestResults((prev) => ({
        ...prev,
        [account.id]: { success: false, error: err.message || "Connection failed" },
      }));
    } finally {
      setTestingDriveId(null);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailRecipient) return;
    setTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: testEmailRecipient }),
      });
      const data = await res.json();
      setTestEmailResult(data);
    } catch (err: any) {
      setTestEmailResult({ success: false, error: err.message });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleChange = (field: keyof SiteSettings, value: string) => {
    setFormData((prev: SiteSettings) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) {
        handleChange("logo_url", data.url);
      }
    } catch {
      setError("Failed to upload logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");

      // Update global context so the entire app reflects new colors and name immediately
      updateLocalSettings(formData);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Site Branding &amp; Platform Customizer
        </h1>
        <p className="text-xs text-slate-500">
          Dynamically rebrand the app, change colors, configure Flutterwave/MoMo payments, and manage contacts.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("branding")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "branding"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Palette className="w-4 h-4" />
          Branding &amp; Colors
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("contacts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "contacts"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Mail className="w-4 h-4" />
          Contact &amp; Social Links
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "payments"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Payment Gateways
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("storage")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "storage"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Cloud Storage
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "security"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Shield className="w-4 h-4" />
          Security &amp; Auth
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("referrals")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "referrals"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Share2 className="w-4 h-4" />
          Referrals &amp; MLM
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ads")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "ads"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-500" />
          Advertising &amp; Monetization
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Settings saved and brand styles updated across the entire site!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Branding & Colors */}
        {activeTab === "branding" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-extrabold text-base text-slate-900">App Identity &amp; Colors</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.app_name}
                  onChange={(e) => handleChange("app_name", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Application Tagline
                </label>
                <input
                  type="text"
                  value={formData.app_tagline}
                  onChange={(e) => handleChange("app_tagline", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            {/* Logo URL & Uploader */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                App Logo URL or Upload
              </label>
              <div className="flex items-center gap-3">
                {formData.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.logo_url}
                    alt="Logo Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
                  />
                )}
                <input
                  type="text"
                  value={formData.logo_url}
                  onChange={(e) => handleChange("logo_url", e.target.value)}
                  placeholder="https://... or upload file"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-xs"
                />
                <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0">
                  <ImageIcon className="w-4 h-4 text-brand" />
                  <span>{uploadingLogo ? "Uploading..." : "Upload Logo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                </label>
              </div>
            </div>

            {/* Color Customization */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.brand_primary}
                    onChange={(e) => handleChange("brand_primary", e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.brand_primary}
                    onChange={(e) => handleChange("brand_primary", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Hover Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.brand_primary_hover}
                    onChange={(e) => handleChange("brand_primary_hover", e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.brand_primary_hover}
                    onChange={(e) => handleChange("brand_primary_hover", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.brand_accent}
                    onChange={(e) => handleChange("brand_accent", e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.brand_accent}
                    onChange={(e) => handleChange("brand_accent", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Live Brand Preview:
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  style={{ backgroundColor: formData.brand_primary }}
                  className="px-4 py-2 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  Primary Button
                </button>
                <span style={{ color: formData.brand_primary }} className="font-bold text-sm">
                  {formData.app_name} Highlight Text
                </span>
                <span
                  style={{ backgroundColor: formData.brand_accent }}
                  className="px-2.5 py-1 text-white text-[10px] font-bold rounded-full"
                >
                  Accent Tag
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Contacts & Socials */}
        {activeTab === "contacts" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-extrabold text-base text-slate-900">Contact Details &amp; Social Links</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Support Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleChange("contact_email", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => handleChange("contact_phone", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Office / Physical Address
              </label>
              <input
                type="text"
                value={formData.contact_address}
                onChange={(e) => handleChange("contact_address", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  WhatsApp Contact URL / Number
                </label>
                <input
                  type="text"
                  value={formData.social_whatsapp || ""}
                  onChange={(e) => handleChange("social_whatsapp", e.target.value)}
                  placeholder="https://wa.me/250788000111"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Twitter / X Profile URL
                </label>
                <input
                  type="text"
                  value={formData.social_twitter || ""}
                  onChange={(e) => handleChange("social_twitter", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  YouTube Channel URL
                </label>
                <input
                  type="text"
                  value={formData.social_youtube || ""}
                  onChange={(e) => handleChange("social_youtube", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Instagram Profile URL
                </label>
                <input
                  type="text"
                  value={formData.social_instagram || ""}
                  onChange={(e) => handleChange("social_instagram", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Payment Gateways */}
        {activeTab === "payments" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-extrabold text-base text-slate-900">
              Payment Gateway Credentials &amp; Commission
            </h3>

            {/* Flutterwave Section */}
            <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand" /> Flutterwave Integration
                </span>
                <select
                  value={formData.flutterwave_enabled}
                  onChange={(e) => handleChange("flutterwave_enabled", e.target.value)}
                  className="text-xs font-bold px-3 py-1 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Public Key</label>
                  <input
                    type="text"
                    value={formData.flutterwave_public_key}
                    onChange={(e) => handleChange("flutterwave_public_key", e.target.value)}
                    placeholder="FLWPUBK_TEST-..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Secret Key</label>
                  <input
                    type="password"
                    value={formData.flutterwave_secret_key}
                    onChange={(e) => handleChange("flutterwave_secret_key", e.target.value)}
                    placeholder="FLWSECK_TEST-..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Encryption Key</label>
                  <input
                    type="password"
                    value={formData.flutterwave_encryption_key || ""}
                    onChange={(e) => handleChange("flutterwave_encryption_key", e.target.value)}
                    placeholder="FLWSECK_TEST_ENCR-..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Manual MoMo / Bank Payments Section */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-600" /> Manual Payment (MoMo &amp; Bank Transfer)
                </span>
                <select
                  value={formData.manual_payment_enabled}
                  onChange={(e) => handleChange("manual_payment_enabled", e.target.value)}
                  className="text-xs font-bold px-3 py-1 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Instructions displayed to buyers
                </label>
                <textarea
                  rows={3}
                  value={formData.manual_payment_instructions}
                  onChange={(e) => handleChange("manual_payment_instructions", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={formData.manual_payment_account_name}
                    onChange={(e) => handleChange("manual_payment_account_name", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account / Phone Numbers</label>
                  <input
                    type="text"
                    value={formData.manual_payment_account_number}
                    onChange={(e) => handleChange("manual_payment_account_number", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Platform Commission */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Platform Commission Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.commission_rate}
                  onChange={(e) => handleChange("commission_rate", e.target.value)}
                  placeholder="10"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Default Platform Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="RWF">RWF (Rwandan Franc)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Cloud Storage */}
        {activeTab === "storage" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-brand" /> Cloud Storage &amp; Multi-Drive Infrastructure
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure your video and media storage providers. Umuguzipro supports cascading Google Drive storage pools with refresh-token auto-failover, Vercel Blob, AWS S3, and Cloudflare R2.
              </p>
            </div>

            {/* Provider Selector */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Primary Storage Provider
              </label>
              <select
                value={formData.storage_provider}
                onChange={(e) => handleChange("storage_provider", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-bold text-slate-900"
              >
                <option value="GOOGLE_DRIVE">Google Drive Multi-Account Cloud (Cascading Refresh-Token Pool)</option>
                <option value="VERCEL_BLOB">Vercel Blob Storage (Fast Edge CDN)</option>
                <option value="AWS_S3">Amazon Web Services S3</option>
                <option value="CLOUDFLARE_R2">Cloudflare R2</option>
              </select>
              <p className="text-xs text-slate-500 leading-relaxed">
                {formData.storage_provider === "GOOGLE_DRIVE" && (
                  <span>
                    <strong>Recommended for Unlimited Video Storage:</strong> Stores videos across multiple Google Drive accounts. When one drive reaches its 15GB or quota limit, uploads fail over automatically to subsequent drives in the pool.
                  </span>
                )}
                {formData.storage_provider === "VERCEL_BLOB" && (
                  <span>Requires <code>BLOB_READ_WRITE_TOKEN</code> in your environment variables. High-speed video delivery via Vercel Edge.</span>
                )}
                {(formData.storage_provider === "AWS_S3" || formData.storage_provider === "CLOUDFLARE_R2") && (
                  <span>Requires <code>STORAGE_ACCESS_KEY</code>, <code>STORAGE_SECRET_KEY</code>, and <code>STORAGE_ENDPOINT</code>.</span>
                )}
              </p>
            </div>

            {/* Google Drive Multi-Drive Pool Configuration */}
            <div className="border border-blue-200 bg-blue-50/40 rounded-2xl p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Google Drive Multi-Account Cascading Pool
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                    Configure multiple Google Drive OAuth accounts. If Account #1 hits its storage limit (15GB free quota) or rate limit, new video uploads cascade seamlessly to Account #2, then Account #3.
                  </p>
                </div>

                {/* Auto Failover Toggle */}
                <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-blue-200 shrink-0">
                  <span className="text-xs font-bold text-slate-700">Auto-Failover</span>
                  <select
                    value={formData.google_drive_auto_failover || "true"}
                    onChange={(e) => handleChange("google_drive_auto_failover", e.target.value)}
                    className="text-xs font-bold text-brand bg-transparent focus:outline-none"
                  >
                    <option value="true">Enabled (Auto-Cascade)</option>
                    <option value="false">Disabled (Single Drive)</option>
                  </select>
                </div>
              </div>

              {/* Drive Accounts List */}
              <div className="space-y-4">
                {driveAccounts.map((account, index) => {
                  const testRes = driveTestResults[account.id];
                  const isTesting = testingDriveId === account.id;

                  return (
                    <div
                      key={account.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 transition-all"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            index === 0
                              ? "bg-brand text-white"
                              : "bg-purple-100 text-purple-700 border border-purple-200"
                          }`}>
                            {index === 0 ? "Drive #1 (Primary)" : `Drive #${index + 1} (Failover ${index})`}
                          </span>
                          <span className="font-bold text-xs text-slate-800">{account.name}</span>
                        </div>

                        {driveAccounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDriveAccount(account.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Remove account from pool"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Account Label / Name
                          </label>
                          <input
                            type="text"
                            value={account.name}
                            onChange={(e) => handleDriveAccountChange(account.id, "name", e.target.value)}
                            placeholder="e.g. Main Rwanda Google Drive 15GB"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Folder ID (Optional destination folder)
                          </label>
                          <input
                            type="text"
                            value={account.folderId || ""}
                            onChange={(e) => handleDriveAccountChange(account.id, "folderId", e.target.value)}
                            placeholder="e.g. 1a2B3c4D5e... (Leave blank for root)"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Google Client ID *
                          </label>
                          <input
                            type="text"
                            value={account.clientId}
                            onChange={(e) => handleDriveAccountChange(account.id, "clientId", e.target.value)}
                            placeholder="xxxx.apps.googleusercontent.com"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Google Client Secret *
                          </label>
                          <input
                            type="password"
                            value={account.clientSecret}
                            onChange={(e) => handleDriveAccountChange(account.id, "clientSecret", e.target.value)}
                            placeholder="GOCSPX-xxxxxxxxxxxxxx"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Google Refresh Token * (Permanent token for auto-refreshing video uploads)
                          </label>
                          <input
                            type="password"
                            value={account.refreshToken}
                            onChange={(e) => handleDriveAccountChange(account.id, "refreshToken", e.target.value)}
                            placeholder="1//0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white font-mono"
                          />
                        </div>
                      </div>

                      {/* Test Connection Button & Result */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleTestDrive(account)}
                          disabled={isTesting}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
                        >
                          {isTesting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                              <span>Testing OAuth Token...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 text-brand" />
                              <span>Test Connection &amp; Quota</span>
                            </>
                          )}
                        </button>

                        {testRes && (
                          <div className="flex-1">
                            {testRes.success ? (
                              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span>
                                    <strong>Connected:</strong> {testRes.storageInfo?.email || "Google Drive Active"}
                                  </span>
                                </div>
                                {testRes.storageInfo && (
                                  <span className="font-bold text-[11px] bg-emerald-100 px-2 py-0.5 rounded-md">
                                    Quota: {testRes.storageInfo.usageGB} GB / {testRes.storageInfo.limitGB} GB used
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{testRes.error || "Token authorization failed"}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Account Button */}
              <button
                type="button"
                onClick={handleAddDriveAccount}
                className="w-full py-2.5 border-2 border-dashed border-blue-300 hover:border-brand rounded-2xl text-xs font-bold text-brand hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Failover Google Drive to Pool</span>
              </button>

              {/* Quick instructions */}
              <div className="p-4 bg-white/80 rounded-xl border border-blue-200/60 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">How to get a Google Drive Refresh Token:</span>
                <p>
                  1. In Google Cloud Console, create OAuth 2.0 Credentials (Authorized redirect: <code>https://developers.google.com/oauthplayground</code>).
                </p>
                <p>
                  2. In Google OAuth Playground, select Drive API v3 (<code>https://www.googleapis.com/auth/drive.file</code>) and authorize.
                </p>
                <p>
                  3. Exchange authorization code for refresh token, and paste the Client ID, Secret, and Refresh Token above.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Security & Authentication */}
        {activeTab === "security" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Security, Two-Factor &amp; Account Verification
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Control login friction, 2FA bypass behavior, and test outbound email connectivity.
              </p>
            </div>

            {/* 2FA Bypass Toggle */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Two-Factor Authentication (2FA) Globally</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    When <strong>Disabled</strong>, users bypass 2FA upon login and authenticate immediately with their password.
                  </p>
                </div>
                <select
                  value={formData.two_factor_enabled || "false"}
                  onChange={(e) => handleChange("two_factor_enabled", e.target.value)}
                  className="text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-300 bg-white shrink-0"
                >
                  <option value="false">Disabled (Bypass 2FA for all users)</option>
                  <option value="true">Enabled (Require 6-digit email code)</option>
                </select>
              </div>
            </div>

            {/* Email Verification Toggle */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Email Verification for New Signups</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    When <strong>Disabled</strong>, newly registered users are automatically verified and log in directly without requiring an email code.
                  </p>
                </div>
                <select
                  value={formData.email_verification_enabled || "false"}
                  onChange={(e) => handleChange("email_verification_enabled", e.target.value)}
                  className="text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-300 bg-white shrink-0"
                >
                  <option value="false">Disabled (Auto-verify accounts immediately)</option>
                  <option value="true">Enabled (Require email verification)</option>
                </select>
              </div>
            </div>

            {/* Email Credentials & Dispatch Configuration */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand" /> Outbound Email &amp; Resend Configuration
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Emails can be configured here in database settings (instant without redeployment) or via Vercel Environment Variables.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Resend API Key
                  </label>
                  <input
                    type="password"
                    value={formData.resend_api_key || ""}
                    onChange={(e) => handleChange("resend_api_key", e.target.value)}
                    placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Leave blank to use Vercel <code>RESEND_API_KEY</code> env variable.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sender Email Address (EMAIL_FROM)
                  </label>
                  <input
                    type="text"
                    value={formData.email_from || ""}
                    onChange={(e) => handleChange("email_from", e.target.value)}
                    placeholder="Umuguzipro <onboarding@resend.dev>"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Use <code>onboarding@resend.dev</code> for unverified domains.
                  </p>
                </div>
              </div>
            </div>

            {/* Outbound Email Diagnostics & Tester */}
            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand" /> Outbound Email Tester &amp; Resend Diagnostics
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Send a live test email to verify whether Resend or SMTP is correctly dispatching messages from your server.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="Enter email address to receive test (e.g. benirabok@gmail.com)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail || !testEmailRecipient}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shrink-0 shadow-sm"
                >
                  {testingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{testingEmail ? "Sending Test..." : "Send Test Email"}</span>
                </button>
              </div>

              {testEmailResult && (
                <div
                  className={`p-4 rounded-xl text-xs space-y-2 border ${
                    testEmailResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <div className="font-bold flex items-center gap-2">
                    {testEmailResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>
                      {testEmailResult.success
                        ? `Test Email Sent Successfully via ${testEmailResult.provider?.toUpperCase()}! (Message ID: ${testEmailResult.messageId})`
                        : `Email Delivery Failed: ${testEmailResult.error || "Unknown error"}`}
                    </span>
                  </div>

                  {testEmailResult.diagnostic && (
                    <div className="text-[11px] font-mono bg-white/80 p-3 rounded-lg border border-slate-200 space-y-1 mt-2 text-slate-700">
                      <div>Sender Address: <strong>{testEmailResult.diagnostic.configuredSender}</strong></div>
                      <div>
                        Resend Key: <strong>
                          {testEmailResult.diagnostic.hasResendKey
                            ? `Active (${testEmailResult.diagnostic.resendKeyPrefix}) [Source: ${testEmailResult.diagnostic.keySource || "Configured"}]`
                            : "Missing (Not found in Database or Vercel RESEND_API_KEY)"}
                        </strong>
                      </div>
                      <div>SMTP Fallback: <strong>{testEmailResult.diagnostic.hasSmtp ? "Configured" : "Not configured"}</strong></div>
                      {!testEmailResult.success && (
                        <div className="text-amber-700 font-sans mt-2 pt-2 border-t border-slate-200 leading-relaxed">
                          💡 <strong>Resend Sandbox Notice:</strong> With unverified custom domains, Resend sandbox only permits sending from <code>onboarding@resend.dev</code> directly to your Resend account owner email. To send to any recipient, verify your domain at <strong>resend.com/domains</strong>.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "referrals" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <div>
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-brand" /> Referral &amp; Multi-Level Marketing (MLM) Engine
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Toggle the platform referral reward system, multi-level commission tiers, and payout percentages.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Master Referral Switch */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Referral System (Master Switch)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enable or disable referral code tracking, invite links, and commission earnings.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="referral_system_enabled"
                      checked={formData.referral_system_enabled !== "false"}
                      onChange={() => handleChange("referral_system_enabled", "true")}
                      className="text-brand focus:ring-brand"
                    />
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      ON (Enabled)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="referral_system_enabled"
                      checked={formData.referral_system_enabled === "false"}
                      onChange={() => handleChange("referral_system_enabled", "false")}
                      className="text-brand focus:ring-brand"
                    />
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300">
                      OFF (Disabled)
                    </span>
                  </label>
                </div>
              </div>

              {/* Multi-Level Switch */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Multi-Level System (Tiered MLM)</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enable 2nd and 3rd tier commissions when invitees invite other creators and buyers.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="multilevel_referral_enabled"
                      checked={formData.multilevel_referral_enabled !== "false"}
                      onChange={() => handleChange("multilevel_referral_enabled", "true")}
                      className="text-brand focus:ring-brand"
                    />
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      ON (Multi-Tier)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="multilevel_referral_enabled"
                      checked={formData.multilevel_referral_enabled === "false"}
                      onChange={() => handleChange("multilevel_referral_enabled", "false")}
                      className="text-brand focus:ring-brand"
                    />
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300">
                      OFF (Direct Only)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Commission Rates */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand" /> Commission Tier Rates (%)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Level 1 (Direct Inviter %)
                  </label>
                  <input
                    type="number"
                    value={formData.referral_commission_rate || "5"}
                    onChange={(e) => handleChange("referral_commission_rate", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Paid to the direct sponsor of the user.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Level 2 (Parent Sponsor %)
                  </label>
                  <input
                    type="number"
                    value={formData.multilevel_level2_rate || "3"}
                    onChange={(e) => handleChange("multilevel_level2_rate", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Active when Multi-Level is ON.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Level 3 (Grandparent Sponsor %)
                  </label>
                  <input
                    type="number"
                    value={formData.multilevel_level3_rate || "1"}
                    onChange={(e) => handleChange("multilevel_level3_rate", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Active when Multi-Level is ON.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Advertising & Monetization */}
        {activeTab === "ads" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                Google AdSense &amp; Creator Monetization Settings
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure in-stream video ads, feed advertisements, Google AdSense IDs, and creator milestone payouts.
              </p>
            </div>

            {/* 1. Google AdSense Global Switch & IDs */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-600" /> Google AdSense Network
                </span>
                <select
                  value={formData.ads_enabled || "true"}
                  onChange={(e) => handleChange("ads_enabled", e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="true">Active (Show Ads Across App)</option>
                  <option value="false">Disabled (No Ads)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Google AdSense Publisher Client ID
                  </label>
                  <input
                    type="text"
                    value={formData.adsense_client_id || "ca-pub-4078466828008985"}
                    onChange={(e) => handleChange("adsense_client_id", e.target.value)}
                    placeholder="ca-pub-4078466828008985"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Found in your AdSense code tag.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Default Ad Slot ID
                  </label>
                  <input
                    type="text"
                    value={formData.adsense_slot_id || "7034214536"}
                    onChange={(e) => handleChange("adsense_slot_id", e.target.value)}
                    placeholder="7034214536"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Slot ID from your AdSense unit.</p>
                </div>
              </div>
            </div>

            {/* 2. Creator Monetization Milestones */}
            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Creator Monetization Requirements (Auto-Income Activation)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Channels meeting or exceeding both criteria automatically start earning income when ads are seen on their videos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Minimum Subscribers Required
                  </label>
                  <input
                    type="number"
                    value={formData.monetization_min_subscribers || "30"}
                    onChange={(e) => handleChange("monetization_min_subscribers", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Default: 30 subscribers.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Minimum Watch Hours Required
                  </label>
                  <input
                    type="number"
                    value={formData.monetization_min_watch_hours || "300"}
                    onChange={(e) => handleChange("monetization_min_watch_hours", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Default: 300 watch hours (18,000 mins).</p>
                </div>
              </div>
            </div>

            {/* 3. Ad Income Payout Rates */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Creator Ad Reward Rates (Configurable Payouts)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Amount credited directly to creator wallet. Internal formula is hidden from end-users.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Earnings per Successful Ad View (RWF)
                  </label>
                  <input
                    type="number"
                    value={formData.ad_reward_view_rwf || "3"}
                    onChange={(e) => handleChange("ad_reward_view_rwf", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Default: 3 RWF per completed/non-skipped view.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Additional Earnings per Ad Click (RWF)
                  </label>
                  <input
                    type="number"
                    value={formData.ad_reward_click_rwf || "4"}
                    onChange={(e) => handleChange("ad_reward_click_rwf", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Default: 4 RWF when viewer clicks advertiser link.</p>
                </div>
              </div>
            </div>

            {/* 4. In-Stream Video Ad Timings */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Video Player Ad Break Schedule &amp; Skip Controller
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control when ads trigger during video playback and unskippable countdown times.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    First Ad Delay (Sec)
                  </label>
                  <input
                    type="number"
                    value={formData.ad_initial_delay_seconds || "15"}
                    onChange={(e) => handleChange("ad_initial_delay_seconds", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Default: 15s into video.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Repeat Interval (Sec)
                  </label>
                  <input
                    type="number"
                    value={formData.ad_interval_seconds || "300"}
                    onChange={(e) => handleChange("ad_interval_seconds", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Default: 300s (every 5 mins).</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Ad Duration (Sec)
                  </label>
                  <input
                    type="number"
                    value={formData.ad_duration_seconds || "12"}
                    onChange={(e) => handleChange("ad_duration_seconds", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Default: 12 seconds.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unskippable Time (Sec)
                  </label>
                  <input
                    type="number"
                    value={formData.ad_skip_delay_seconds || "8"}
                    onChange={(e) => handleChange("ad_skip_delay_seconds", e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Default: 8s before Skip enables.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-brand hover:bg-brand-hover text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Saving Settings..." : "Save & Apply Customizations"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
