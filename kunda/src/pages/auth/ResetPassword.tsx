import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';

import { api, getErrorMessage } from '../../lib/api';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');
  const urlEmail = searchParams.get('email');

  const navigate = useNavigate();

  const [email, setEmail] = useState(urlEmail || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        email: email.trim(),
        code: code.trim(),
        token: urlToken,
        newPassword,
      });

      const data = res.data;
      if (data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/auth/login'), 2500);
      } else {
        const errorMsg = data.error ? getErrorMessage(data.error) : 'Failed to reset password. Please check the code.';
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
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create New Password</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter the 6-digit reset code from your email and your new password.
          </p>
        </div>

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
            <h3 className="text-lg font-bold text-slate-900">Password Successfully Reset!</h3>
            <p className="text-xs text-slate-500">Redirecting to sign in...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {!urlToken && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  6-Digit Recovery Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center text-xl font-black tracking-widest px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>
            )}

            <Input
              label="New Password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
            />

            <Input
              label="Confirm New Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
            />

            <Button type="submit" loading={loading} className="w-full py-3 shadow-md shadow-rose-200">
              Update Password
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
