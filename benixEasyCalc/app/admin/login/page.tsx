'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, Mail, ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase/client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      if (supabase && isSupabaseConfigured) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message);
          setIsLoading(false);
          return;
        }

        // Store session token and redirect
        router.push('/admin');
      } else {
        // Fallback for local development if Supabase credentials are not yet configured
        if (email.toLowerCase().includes('admin') && password.length >= 6) {
          sessionStorage.setItem('benix_admin_auth', 'true');
          router.push('/admin');
        } else {
          setError('Invalid credentials. (In offline demo mode, use email containing "admin" and any 6+ char password).');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 text-xs text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Easy Calc</span>
          </Link>

          <div className="relative mx-auto h-12 w-12 rounded-2xl bg-blue-50 p-2 shadow-xs ring-1 ring-blue-100 dark:bg-blue-950 dark:ring-blue-900">
            <Image src="/logo.png" alt="Benix Space" fill sizes="48px" className="object-contain p-1" />
          </div>

          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Admin Portal
          </h2>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Secure administrative access for Benix Space Easy Calc
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 dark:text-slate-300">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@easycalc.benix.space"
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 dark:text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span>{isLoading ? 'Signing in...' : 'Sign In to Dashboard'}</span>
          </button>
        </form>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-center text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
          Protected by Supabase Auth with Row-Level Security (RLS). Unauthorized access attempts are logged.
        </div>
      </div>
    </div>
  );
}
