import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Heart, Lock, AlertCircle } from 'lucide-react';

import { api, getErrorMessage } from '../../lib/api';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetails(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });

      const data = res?.data;
      if (data && data.success && data.token) {
        login(data.token, data.user, data.profile);
        navigate('/dashboard/discover');
      } else {
        const errorMsg = data?.error ? getErrorMessage(data.error) : t('auth.loginError');
        setError(errorMsg);
        if (data?.error && typeof data.error === 'object') {
          setErrorDetails(JSON.stringify(data.error));
        }
      }
    } catch (err: any) {
      console.error('Login submit caught error:', err);
      const rawBody = err?.response?.data;

      // Unverified account redirect
      if (rawBody?.requiresVerification || rawBody?.error === 'EMAIL_NOT_VERIFIED') {
        navigate(`/auth/verify-email?email=${encodeURIComponent(email.trim())}`);
        return;
      }

      const friendlyMsg = getErrorMessage(err);
      setError(friendlyMsg);

      // Collect technical details for user transparency
      const status = err?.response?.status;
      const statusText = err?.response?.statusText;
      const detailStr = [
        status ? `Status: ${status} ${statusText || ''}` : '',
        typeof rawBody === 'string' ? rawBody : (rawBody?.error ? JSON.stringify(rawBody.error) : ''),
        err?.message ? `Details: ${err.message}` : '',
      ].filter(Boolean).join(' | ');

      if (detailStr) {
        setErrorDetails(detailStr);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-card p-8 sm:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-violet-600 flex items-center justify-center mx-auto shadow-md shadow-rose-200">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('auth.loginTitle')}</h1>
          <p className="text-xs text-slate-500">{t('auth.loginSubtitle')}</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2.5 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <span>{typeof error === 'string' ? error : getErrorMessage(error)}</span>
              </div>
            </div>
            {errorDetails && (
              <div className="pt-2 border-t border-red-200/60 font-mono text-[11px] text-red-600/90 break-words max-h-24 overflow-y-auto bg-red-100/40 p-2 rounded-lg">
                {errorDetails}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('auth.emailLabel')}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.emailPlaceholder')}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {t('auth.passwordLabel')}
              </label>
              <Link to="/auth/forgot-password" className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full py-3 mt-2 shadow-md shadow-rose-200">
            {t('auth.signInBtn')}
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
          <span>{t('auth.noAccount')} </span>
          <Link to="/auth/register" className="font-bold text-rose-600 hover:text-rose-700 underline">
            {t('auth.registerNow')}
          </Link>
        </div>
      </div>
    </div>
  );
};
