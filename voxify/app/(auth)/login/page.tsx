'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getAppUrl } from '@/lib/utils/appUrl';
import { useAuth } from '@/lib/context/AuthContext';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, artistProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnconfirmed, setIsUnconfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const redirectParam = searchParams.get('redirect');

  useEffect(() => {
    if (user) {
      if (redirectParam && redirectParam.startsWith('/')) {
        router.push(redirectParam);
        return;
      }
      router.push('/dashboard');
    }
  }, [user, router, redirectParam]);


  useEffect(() => {
    const errorType = searchParams.get('error');
    if (errorType === 'link_expired') {
      setError('This email verification link has expired or was already used. Please enter your email below to request a new link.');
      setIsUnconfirmed(true);
    } else if (errorType === 'verification_failed') {
      setError('Email verification failed. Please try signing in or request a new verification link.');
      setIsUnconfirmed(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsUnconfirmed(false);
    setResendSuccess(false);

    const supabase = createClient();
    const { data: authRes, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      if (authError.message.toLowerCase().includes('email not confirmed')) {
        setIsUnconfirmed(true);
      }
      setLoading(false);
    } else if (authRes.user) {
      // If a specific redirect param is passed (e.g. /songs/marketplace/[id] for purchase), go straight there
      if (redirectParam && redirectParam.startsWith('/')) {
        router.push(redirectParam);
        return;
      }

      // Query profile user_type, artist profile, and choir membership
      const [profRes, artProfRes, choirRes] = await Promise.all([
        supabase.from('profiles').select('user_type').eq('id', authRes.user.id).maybeSingle(),
        supabase.from('artist_profiles').select('id').eq('user_id', authRes.user.id).maybeSingle(),
        supabase.from('choir_members').select('id').eq('user_id', authRes.user.id).limit(1),
      ]);

      const isArtist = profRes.data?.user_type === 'artist' || !!artProfRes.data;
      const hasChoir = (choirRes.data && choirRes.data.length > 0);

      if (isArtist && hasChoir) {
        // User has both! Route to dashboard where both workspaces are seamlessly accessible
        router.push('/dashboard');
      } else if (isArtist) {
        router.push(artProfRes.data ? '/artist/dashboard' : '/onboarding/artist');
      } else {
        router.push('/dashboard');
      }
    }
  };


  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address above to resend the verification link.');
      return;
    }

    setResending(true);
    setError(null);

    const supabase = createClient();
    const customDomainUrl = getAppUrl();
    const redirectTo = `${customDomainUrl}/auth/callback`;

    const { error: resendErr } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    setResending(false);
    if (resendErr) {
      setError(resendErr.message);
    } else {
      setResendSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-900 dark:text-white transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-purple-600/10 dark:bg-purple-600/20 p-1 border border-purple-500/30 items-center justify-center mb-2">
            <Image src="/logo.png" alt="Voxify Logo" width={44} height={44} className="object-contain" />
          </div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">Welcome Back to Voxify</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Sign in to access your choir practice dashboard or purchase music</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 p-4 rounded-2xl text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>

            {isUnconfirmed && (
              <div className="pt-2 border-t border-rose-500/20 space-y-2">
                <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                  {email
                    ? `Click below to resend a new verification link to ${email}.`
                    : 'Enter your registered email address above and click below to resend a new link.'}
                </p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>{resending ? 'Resending Link...' : 'Resend Verification Email'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {resendSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 p-4 rounded-2xl text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-200">Verification Email Sent!</p>
              <p className="text-[11px] text-slate-700 dark:text-slate-300">Please check your inbox for <strong className="text-emerald-700 dark:text-emerald-400">{email}</strong> and click the link to confirm.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-300 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="singer@example.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-300">Password</label>
              <Link href="/forgot-password" className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer active:scale-98"
          >
            {loading ? 'Signing In...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-600 dark:text-slate-400 pt-2 font-medium">
          Don&apos;t have an account?{' '}
          <Link
            href={redirectParam ? `/register?redirect=${encodeURIComponent(redirectParam)}` : '/register'}
            className="text-purple-600 dark:text-purple-400 hover:underline font-bold"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
