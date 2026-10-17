import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { KeyRound, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

import { api, getErrorMessage } from '../../lib/api';

export const ForgotPassword: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      const data = res.data;
      if (data.success) {
        setSubmitted(true);
      } else {
        const errorMsg = data.error ? getErrorMessage(data.error) : 'Failed to dispatch password recovery email';
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-card p-8 sm:p-10 space-y-8 animate-in fade-in zoom-in-95">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto shadow-sm">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recover Password</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter your email and we will send you a 6-digit password reset code via Resend / SMTP.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-600 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{typeof error === 'string' ? error : getErrorMessage(error)}</span>
          </div>
        )}

        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              If an account is associated with <strong>{email}</strong>, a recovery code has been dispatched.
            </p>
            <Link to={`/auth/reset-password?email=${encodeURIComponent(email)}`} className="block">
              <Button className="w-full">
                Enter Reset Code Now <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
            />

            <Button type="submit" loading={loading} className="w-full py-3 shadow-md shadow-violet-200" variant="secondary">
              Send Reset Code
            </Button>
          </form>
        )}

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          <Link to="/auth/login" className="hover:text-rose-600 font-medium">
            Remember your password? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
