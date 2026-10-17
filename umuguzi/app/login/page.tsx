"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings, t, refreshUser } = useApp();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setSuccessMsg("Email verified successfully! You can now log in.");
    } else if (searchParams.get("reset") === "success") {
      setSuccessMsg("Password reset successfully! You can now log in with your new password.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.requires2FA) {
        const redirectParam = searchParams.get("redirect") || "";
        router.push(
          `/verify-2fa?email=${encodeURIComponent(data.email || identifier)}${
            redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : ""
          }`
        );
      } else {
        await refreshUser();
        const redirectParam = searchParams.get("redirect") || "/dashboard";
        router.push(redirectParam);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          {settings.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_url} alt="Logo" className="w-10 h-10 rounded-2xl object-cover shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-brand text-white flex items-center justify-center font-black text-xl">
              U
            </div>
          )}
          <span className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-brand transition-colors">
            {settings.app_name || "Umuguzipro"}
          </span>
        </Link>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In to Your Account</h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your email or username to access your account
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80">
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email or Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com or username"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-brand hover:bg-brand-hover text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Checking credentials..." : "Next: Verify with 2FA"}
              <Shield className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-bold text-brand hover:underline">
              {t.register}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
