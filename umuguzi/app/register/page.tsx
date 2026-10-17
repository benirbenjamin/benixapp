"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Mail, Lock, AtSign, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings, refreshUser, t } = useApp();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setRefCode(ref);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          username,
          email,
          password,
          refCode: refCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      if (data.requiresVerification === false) {
        await refreshUser();
        const redirectParam = searchParams.get("redirect") || "/dashboard";
        router.push(redirectParam);
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
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
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Your Account</h2>
        <p className="mt-1 text-xs text-slate-500">
          Join Rwanda&apos;s leading platform for video, freelance services, and digital products
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name / Brand Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Kigali Cinema Studio"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  placeholder="kigalicinema"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                />
                <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@kigalicinema.rw"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            {refCode && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-brand flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand shrink-0" />
                <span>Referred by partner code: <strong>{refCode}</strong></span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-brand hover:bg-brand-hover text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Continue to Verification"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-brand hover:underline">
              {t.signIn}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
