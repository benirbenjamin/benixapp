"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowRight, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings } = useApp();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    const qEmail = searchParams.get("email");
    if (qEmail) setEmail(qEmail);
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Please provide your email address to resend the code.");
      return;
    }

    setResending(true);
    setResendMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resendOnly: true, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      if (data.emailSent === false) {
        setError(data.message || "Could not dispatch verification email. Please contact support.");
      } else {
        setResendMessage(data.message || "A fresh 6-digit verification code has been dispatched to your email.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
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
        <div className="w-12 h-12 bg-blue-100 text-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Verify Your Email</h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter the 6-digit code sent to <strong>{email || "your email address"}</strong>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Email Verified!</h3>
              <p className="text-xs text-slate-500">
                Your account is active. Redirecting you to sign in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {resendMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{resendMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="------"
                  className="w-full text-center tracking-[12px] text-2xl font-mono font-bold py-3 rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 px-4 bg-brand hover:bg-brand-hover text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify Code"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-brand hover:underline font-semibold flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                  Resend Code
                </button>
                <Link href="/login" className="text-slate-500 hover:text-slate-700">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
