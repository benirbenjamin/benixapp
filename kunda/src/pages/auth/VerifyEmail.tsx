import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MailCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

import { api, getErrorMessage } from '../../lib/api';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');
  const urlEmail = searchParams.get('email');

  const { t } = useLanguage();
  const { refreshSession } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState<string>('');
  const [email, setEmail] = useState<string>(urlEmail || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Auto-verify if url token is provided
  useEffect(() => {
    if (urlToken) {
      handleVerify(urlToken);
    }
  }, [urlToken]);

  const handleVerify = async (tokenOverride?: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-email', {
        email: email.trim(),
        code: code.trim(),
        token: tokenOverride || urlToken,
      });

      const data = res.data;
      if (data.success) {
        setSuccess(true);
        await refreshSession();
        setTimeout(() => navigate('/dashboard/discover'), 2500);
      } else {
        const errorMsg = data.error ? getErrorMessage(data.error) : 'Verification failed. Please check the code.';
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const [resending, setResending] = useState<boolean>(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleResendCode = async () => {
    if (!email.trim()) {
      setError('Please provide your email address to resend confirmation code.');
      return;
    }
    setResending(true);
    setResendStatus(null);
    try {
      const res = await api.post('/auth/verify-email', {
        email: email.trim(),
        action: 'resend',
      });
      if (res.data?.success) {
        setResendStatus(res.data.message || 'A fresh code has been sent to your email.');
      } else {
        setError(res.data?.error || 'Failed to resend confirmation code.');
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-card p-8 sm:p-10 space-y-8 animate-in fade-in zoom-in-95">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <MailCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Verify Your Email</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            We sent a 6-digit confirmation code to your email inbox. Enter it below to activate your account.
          </p>
        </div>

        {resendStatus && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold text-center">
            {resendStatus}
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-600 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{typeof error === 'string' ? error : getErrorMessage(error)}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Email Verified!</h3>
            <p className="text-xs text-slate-500">Redirecting to your member dashboard...</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="space-y-4"
          >
            {!urlEmail && (
              <Input
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                6-Digit Confirmation Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center text-2xl font-black tracking-widest px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">Didn't receive the email?</span>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="font-bold text-rose-600 hover:text-rose-700 underline disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>

            <Button type="submit" loading={loading} className="w-full py-3 shadow-md shadow-rose-200">
              Confirm & Activate Account
            </Button>
          </form>
        )}

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <Link to="/auth/login" className="hover:text-rose-600 font-medium">
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
