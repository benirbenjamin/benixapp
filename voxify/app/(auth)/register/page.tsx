'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getAppUrl } from '@/lib/utils/appUrl';
import { useAuth } from '@/lib/context/AuthContext';
import { notificationService } from '@/lib/services/notificationService';
import { User, Mail, Lock, Phone, ArrowRight, AlertCircle, Crown, Mic, MailCheck, CheckCircle2 } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const redirectParam = searchParams.get('redirect');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rolePreference, setRolePreference] = useState<'director' | 'singer' | 'artist'>('director');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  React.useEffect(() => {
    if (user) {
      if (redirectParam && redirectParam.startsWith('/')) {
        router.push(redirectParam);
        return;
      }
      if (user.user_type === 'artist') {
        router.push('/artist/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router, redirectParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const customDomainUrl = getAppUrl();
    const redirectTo = redirectParam && redirectParam.startsWith('/')
      ? `${customDomainUrl}/auth/callback?next=${encodeURIComponent(redirectParam)}`
      : `${customDomainUrl}/auth/callback`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: fullName,
          phone: phone,
          role_preference: rolePreference,
          user_type: rolePreference === 'artist' ? 'artist' : rolePreference === 'director' ? 'choir_admin' : 'regular',
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Trigger Super Admin Notification for new user registration
    try {
      await notificationService.sendNotificationToSuperAdmins({
        title: 'New User Registered 👤',
        message: `${fullName} (${email}) signed up on Voxify as ${rolePreference === 'artist' ? 'Artist' : rolePreference === 'director' ? 'Choir Director' : 'Choir Singer'}.`,
        type: 'user_registered',
        link: '/admin/users',
        priority: 'normal',
      });
    } catch (notifErr) {
      console.warn('Registration admin notification note:', notifErr);
    }

    // If session is active (auto-confirmed)
    if (authData.session) {
      if (redirectParam && redirectParam.startsWith('/')) {
        router.push(redirectParam);
        return;
      }
      if (rolePreference === 'artist') {
        router.push('/onboarding/artist');
      } else if (rolePreference === 'director') {
        router.push('/choir/create');
      } else {
        router.push('/dashboard');
      }
    } else {
      // Email verification required
      setVerificationSent(true);
      setLoading(false);
    }
  };

  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const handleResend = async () => {
    setResending(true);
    setResendMsg(null);
    try {
      const supabase = createClient();
      const customDomainUrl = getAppUrl();
      const redirectTo = redirectParam && redirectParam.startsWith('/')
        ? `${customDomainUrl}/auth/callback?next=${encodeURIComponent(redirectParam)}`
        : `${customDomainUrl}/auth/callback`;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });
      if (error) {
        setResendMsg('Note: ' + error.message);
      } else {
        setResendMsg('Verification link resent! Please check your spam folder as well.');
      }
    } catch (e: any) {
      setResendMsg(e.message || 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  // State: Verification Email Sent Card
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-900 dark:text-white transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl space-y-6 text-center">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-purple-600/10 dark:bg-purple-600/20 border border-purple-500/30 items-center justify-center text-purple-600 dark:text-purple-400">
            <MailCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-950 dark:text-white">Check Your Email Inbox</h1>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              We sent a verification link to <strong className="text-purple-600 dark:text-purple-400">{email}</strong>.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left text-xs text-slate-700 dark:text-slate-400 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Click the verification link in your email to activate your account.</span>
            </div>
            {redirectParam ? (
              <div className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <span>After clicking the link, you will be taken directly back to complete your song purchase!</span>
              </div>
            ) : rolePreference === 'artist' ? (
              <div className="flex items-start gap-2">
                <Mic className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>As a <strong>Music Artist</strong>, after clicking the link you will be guided to complete your Artist Profile!</span>
              </div>
            ) : rolePreference === 'director' ? (
              <div className="flex items-start gap-2">
                <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <span>As a <strong>Choir Master</strong>, after clicking the link you will automatically be guided to <strong>Register &amp; Create Your Choir</strong>!</span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>As a <strong>Member / Listener</strong>, after clicking the link you will land on your Voxify Dashboard.</span>
              </div>
            )}
          </div>

          {resendMsg && (
            <div className="text-xs text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl font-medium">
              {resendMsg}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              {resending ? 'Sending...' : 'Didn’t receive it? Resend verification email'}
            </button>
            <Link
              href={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-purple-600/30 transition-all text-xs cursor-pointer"
            >
              Verified Email? Proceed to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-900 dark:text-white my-8 transition-colors">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-purple-600/10 dark:bg-purple-600/20 p-1 border border-purple-500/30 items-center justify-center mb-2">
            <Image src="/logo.png" alt="Voxify Logo" width={44} height={44} className="object-contain" />
          </div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white">Create Your Voxify Account</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Join Voxify as a Choir Master, Music Artist, or Listener</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Preference Selection - Clear High Contrast in Light & Dark Mode */}
          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-300 block mb-2">I am registering as *</label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setRolePreference('director')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  rolePreference === 'director'
                    ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-600 dark:border-purple-500 shadow-md ring-2 ring-purple-500/30'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Crown className={`w-5 h-5 mb-1.5 ${rolePreference === 'director' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className={`text-xs font-black block ${rolePreference === 'director' ? 'text-purple-950 dark:text-white' : 'text-slate-900 dark:text-slate-200'}`}>
                  Choir Master
                </span>
                <span className={`text-[10px] block mt-0.5 font-semibold ${rolePreference === 'director' ? 'text-purple-700 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  Manage choir
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRolePreference('artist')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  rolePreference === 'artist'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-600 dark:border-amber-500 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Mic className={`w-5 h-5 mb-1.5 ${rolePreference === 'artist' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className={`text-xs font-black block ${rolePreference === 'artist' ? 'text-amber-950 dark:text-white' : 'text-slate-900 dark:text-slate-200'}`}>
                  Music Artist
                </span>
                <span className={`text-[10px] block mt-0.5 font-semibold ${rolePreference === 'artist' ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  Sell music
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRolePreference('singer')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  rolePreference === 'singer'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-blue-500 shadow-md ring-2 ring-blue-500/30'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <User className={`w-5 h-5 mb-1.5 ${rolePreference === 'singer' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className={`text-xs font-black block ${rolePreference === 'singer' ? 'text-blue-950 dark:text-white' : 'text-slate-900 dark:text-slate-200'}`}>
                  Join &amp; Listen
                </span>
                <span className={`text-[10px] block mt-0.5 font-semibold ${rolePreference === 'singer' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  Member / Buyer
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-300 block mb-1.5">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-300 block mb-1.5">Phone Number *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+250 788 000 000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-300 block mb-1.5">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="director@example.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 dark:text-slate-300 block mb-1.5">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          {/* Terms and Conditions Acceptance Notice */}
          <p className="text-[11px] text-slate-500 text-center leading-relaxed">
            By creating an account, you accept our{' '}
            <Link href="/terms" target="_blank" className="text-purple-600 hover:underline font-bold">
              Terms and Conditions
            </Link>{' '}
            and acknowledge our{' '}
            <Link href="/disclaimer" target="_blank" className="text-purple-600 hover:underline font-bold">
              Disclaimer
            </Link>.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer active:scale-98"
          >
            {loading
              ? 'Creating Account...'
              : rolePreference === 'artist'
              ? 'Register as Artist'
              : rolePreference === 'director'
              ? 'Register & Create Choir'
              : 'Register'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-600 dark:text-slate-400 pt-2 font-medium">
          Already registered?{' '}
          <Link
            href={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}
            className="text-purple-600 dark:text-purple-400 hover:underline font-bold"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 text-xs">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
