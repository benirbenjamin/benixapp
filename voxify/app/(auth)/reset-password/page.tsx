'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, ArrowRight, AlertCircle, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifyAuthSession() {
      const supabase = createClient();
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error') || searchParams.get('error_code');

      if (errorParam) {
        setError('Password reset link is invalid or expired. Please request a new one.');
        setCheckingSession(false);
        return;
      }

      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.log('Code exchange note:', exchangeError);
          }
        } catch (e) {
          console.log('Code exchange error:', e);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsSessionValid(true);
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (newSession?.user) {
            setIsSessionValid(true);
            setCheckingSession(false);
          }
        });

        setTimeout(() => {
          setCheckingSession(false);
        }, 1500);

        return () => subscription.unsubscribe();
      }

      setCheckingSession(false);
    }

    verifyAuthSession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-purple-600/20 p-1 border border-purple-500/30 items-center justify-center mb-2">
          <Image src="/logo.png" alt="Voxify Logo" width={44} height={44} className="object-contain" />
        </div>
        <h1 className="text-2xl font-bold">Set New Password</h1>
        <p className="text-xs text-slate-400">Enter a new secure password for your Voxify account</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3.5 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {checkingSession ? (
        <div className="py-8 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Verifying secure password reset link...</p>
        </div>
      ) : success ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-6 rounded-2xl text-xs space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-white">Password Updated Successfully!</h3>
          <p className="text-slate-300">Your password has been reset. You can now log in with your new password.</p>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-600/30 text-xs transition-all"
          >
            Sign In to Voxify <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : isSessionValid ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {loading ? 'Updating Password...' : 'Update Password'} <KeyRound className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-2xl text-center space-y-4">
          <p className="text-xs text-slate-400">
            This password reset link is invalid, expired, or has already been used.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex w-full items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl text-xs transition-all"
          >
            Request New Reset Link <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-white">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 p-8 rounded-3xl text-center space-y-3">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading password reset form...</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
