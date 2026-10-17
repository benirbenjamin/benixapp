'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getAppUrl } from '@/lib/utils/appUrl';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const customDomainUrl = getAppUrl();
    const redirectTo = `${customDomainUrl}/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-white">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-purple-600/20 p-1 border border-purple-500/30 items-center justify-center mb-2">
            <Image src="/logo.png" alt="Voxify Logo" width={44} height={44} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold">Reset Your Password</h1>
          <p className="text-xs text-slate-400">Enter your registered email to receive a password reset link</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-6 rounded-2xl text-xs space-y-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-white">Password Reset Link Sent!</h3>
            <p className="text-slate-300">
              We sent a password reset email to <strong className="text-emerald-400">{email}</strong> via custom domain link.
            </p>
            <p className="text-[11px] text-slate-400">Please check your inbox and click the link to set a new password.</p>
            <div className="pt-2">
              <Link href="/login" className="text-purple-400 font-semibold hover:underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="yourname@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? 'Sending Reset Link...' : 'Send Password Reset Link'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center text-xs text-slate-400 pt-2">
          Remembered your password?{' '}
          <Link href="/login" className="text-purple-400 hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
