import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Radio, Lock, User, AlertCircle, ArrowRight, ShieldCheck, KeyRound, RefreshCw, Mail } from 'lucide-react';

export function AdminLoginPage() {
  const { login, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  // OTP 2FA State
  const [otpStep, setOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [devCode, setDevCode] = useState(null);
  const [resending, setResending] = useState(false);

  const handleSubmitCredentials = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    try {
      const res = await login(username, password);
      if (res?.require_otp) {
        setOtpEmail(res.email || username);
        setOtpStep(true);
        if (res.dev_code) {
          setDevCode(res.dev_code);
        }
        setInfoMessage(res.message || `We sent a 4-digit security code to ${res.email}. Enter it to complete login.`);
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 4) {
      setError('Please enter the complete 4-digit verification code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(otpEmail, otpCode.trim(), 'login');
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError(null);
    try {
      const res = await resendOtp(otpEmail, 'login');
      if (res?.dev_code) {
        setDevCode(res.dev_code);
      }
      setInfoMessage(res?.message || 'A new 4-digit code has been dispatched to your email.');
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/30 ring-4 ring-indigo-500/20">
          <Radio className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">RadioAdmin Portal</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          {otpStep
            ? 'Two-Step Verification: Enter your 4-digit security code'
            : 'Sign in to customize branding, audio streams, programs, and news.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-3 animate-in fade-in leading-relaxed">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="break-words">{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-3 animate-in fade-in">
              <Mail className="w-4 h-4 flex-shrink-0 text-indigo-400" />
              <span>{infoMessage}</span>
            </div>
          )}

          {!otpStep ? (
            /* STEP 1: Username & Password */
            <form onSubmit={handleSubmitCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="superadmin or your@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Verifying Credentials...' : 'Continue to Verification'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* STEP 2: 4-digit OTP Code */
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Enter the 4-digit code sent to <span className="text-white font-bold">{otpEmail}</span>
                </p>
              </div>

              {devCode && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" /> Dev Security Code
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(devCode)}
                      className="text-[11px] underline text-amber-200 hover:text-white font-bold"
                    >
                      Auto-fill
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 text-xs">Your 4-digit code is:</span>
                    <span className="font-mono text-base font-black tracking-widest text-white px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">
                      {devCode}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Mock console mode active. Enter this code to authenticate.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  4-Digit Security Code
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="0000"
                  className="w-full text-center text-3xl tracking-[1em] font-mono font-black py-3 rounded-2xl bg-slate-800 border-2 border-indigo-500/40 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-white focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Code expires in 15 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 4}
                className="w-full py-3.5 rounded-xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Verifying Code...' : 'Verify & Enter Dashboard'}</span>
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>{resending ? 'Sending...' : 'Resend Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(false);
                    setOtpCode('');
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Change Account
                </button>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-slate-800 space-y-3 text-center">
            <div className="text-xs text-slate-400">
              Want to list your radio station?{' '}
              <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-bold underline">
                Create an account
              </Link>
            </div>

            <div>
              <a href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1.5 font-medium">
                <span>← Return to Stations Directory</span>
              </a>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
