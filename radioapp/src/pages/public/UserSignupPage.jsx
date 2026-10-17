import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Radio, Lock, User, Mail, Phone, AlertCircle, ArrowRight, ShieldCheck, KeyRound, RefreshCw } from 'lucide-react';

export function UserSignupPage() {
  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  // Form fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  // OTP Step state
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devCode, setDevCode] = useState(null);
  const [resending, setResending] = useState(false);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        full_name: fullName.trim(),
        phone: phone.trim(),
      });

      if (res?.require_otp) {
        setOtpStep(true);
        if (res.dev_code) {
          setDevCode(res.dev_code);
        }
        setInfoMessage(res.message || `We sent a 4-digit verification code to ${email}. Please enter it below to confirm your account.`);
      } else {
        navigate('/request-station');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 4) {
      setError('Please enter the 4-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyOtp(email.trim().toLowerCase(), otpCode.trim(), 'signup');
      navigate('/request-station');
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
      const res = await resendOtp(email.trim().toLowerCase(), 'signup');
      if (res?.dev_code) {
        setDevCode(res.dev_code);
      }
      setInfoMessage(res?.message || `A fresh 4-digit verification code has been dispatched to ${email}.`);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500">
      
      {/* Header / Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 px-4">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/30 ring-4 ring-indigo-500/20">
          <Radio className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">Create Broadcaster Account</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          {otpStep
            ? 'Verify your email to activate your account and submit your radio'
            : 'Join our platform to list and broadcast your radio station to thousands of listeners.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
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
            /* STEP 1: Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name / Station Contact
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jean Dupont"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. jeanradio"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+250 788 123 456"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@station.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  We'll send a 4-digit code to this address for account verification.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                <span>{loading ? 'Creating Account...' : 'Continue to Email Verification'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* STEP 2: 4-digit Email Verification */
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">Enter 4-Digit Verification Code</h3>
                <p className="text-xs text-slate-300">
                  We've sent a 4-digit code to <span className="text-indigo-300 font-bold">{email}</span>. Enter it below to complete registration:
                </p>
              </div>

              {devCode && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" /> Dev Verification Code
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
                    Emails are simulated in dev/mock mode. Set SMTP or Resend credentials in your environment for live inbox delivery.
                  </p>
                </div>
              )}

              <div>
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
                <span>{loading ? 'Verifying...' : 'Verify Code & Proceed to Station Request'}</span>
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
                  Edit Information
                </button>
              </div>
            </form>
          )}

          <div className="pt-4 border-t border-slate-800 space-y-3 text-center">
            <div className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/admin/login" className="text-indigo-400 hover:text-indigo-300 font-bold underline">
                Sign In
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
export default UserSignupPage;
