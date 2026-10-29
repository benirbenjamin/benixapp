import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { APP_REQUIREMENTS, type AppRequirementConfig } from '../../config/appRequirements';
import {
  X,
  Heart,
  Music,
  ShoppingBag,
  Tv,
  Radio,
  Gamepad2,
  Calculator,
  Lock,
  User,
  Mail,
  Phone,
  Globe,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';

interface AppAccessWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAppKey: string | null;
  onSuccess?: () => void;
  initialTab?: 'register' | 'login';
}

const ICON_MAP: Record<string, any> = {
  Heart,
  Music,
  ShoppingBag,
  Tv,
  Radio,
  Gamepad2,
  Calculator
};

export const AppAccessWizardModal: React.FC<AppAccessWizardModalProps> = ({
  isOpen,
  onClose,
  targetAppKey,
  onSuccess,
  initialTab = 'register'
}) => {
  const navigate = useNavigate();
  const { user, login, registerWizard, verifyAccount, resendVerificationCode, saveAppProfile } = useAuth();

  // Mode: 'register' | 'login' | 'verify' (if not logged in) or 'wizard' (if logged in but needs requirement fields)
  const [authTab, setAuthTab] = useState<'register' | 'login' | 'verify'>(initialTab);
  const [authError, setAuthError] = useState<string>('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Email verification state
  const [verifyEmail, setVerifyEmail] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [resendLoading, setResendLoading] = useState<boolean>(false);

  // Forgot Password 5-Digit Verification State
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');
  const [receivedDemoCode, setReceivedDemoCode] = useState('');

  // 5-field registration form state
  const [name, setName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Rwanda');

  // App requirement wizard form state
  const [wizardData, setWizardData] = useState<Record<string, any>>({});
  const [wizardError, setWizardError] = useState('');
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardSuccess, setWizardSuccess] = useState(false);

  // Voxify Choir Code / Independent Mode State
  const [choirCodeMode, setChoirCodeMode] = useState<'code' | 'none'>('code');
  const [choirCodeInput, setChoirCodeInput] = useState<string>('');
  const [verifiedChoir, setVerifiedChoir] = useState<any>(null);
  const [choirLookupLoading, setChoirLookupLoading] = useState<boolean>(false);
  const [choirLookupError, setChoirLookupError] = useState<string>('');

  // Sync initialTab when modal opens or initialTab changes
  useEffect(() => {
    if (initialTab) {
      setAuthTab(initialTab);
    }
    if (user?.email) {
      setVerifyEmail(user.email);
    }
    if (targetAppKey === 'account_verification') {
      setAuthTab('verify');
    }
  }, [initialTab, isOpen, user, targetAppKey]);

  const normalizedKey = targetAppKey === 'dating' ? 'kunda' : (targetAppKey === 'music' ? 'voxify' : (targetAppKey === 'videos' ? 'tv' : (targetAppKey || 'tv')));
  const appConfig: AppRequirementConfig = APP_REQUIREMENTS[normalizedKey] || APP_REQUIREMENTS[targetAppKey || 'tv'] || APP_REQUIREMENTS['tv'];
  const AppIcon = (appConfig && ICON_MAP[appConfig.icon]) || Sparkles;

  // Pre-populate wizard data with defaults (e.g. favorite_content multiselect for TV)
  useEffect(() => {
    if (appConfig) {
      const initial: Record<string, any> = {};
      appConfig.fields?.forEach((f) => {
        if (f.defaultValue !== undefined) {
          initial[f.name] = f.defaultValue;
        } else if (f.type === 'multiselect') {
          initial[f.name] = [];
        }
      });
      setWizardData((prev) => ({ ...initial, ...prev }));
    }
  }, [targetAppKey, isOpen, appConfig]);

  if (!isOpen || !targetAppKey) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');
    setAuthLoading(true);

    console.log('🔵 [MODAL_LOGIN_SUBMIT_START]:', { email });

    try {
      const res = await login(email, password);
      setAuthLoading(false);

      if (res.requiresVerification) {
        console.log('🟡 [MODAL_LOGIN_REQUIRES_VERIFICATION]:', res.email);
        setVerifyEmail(res.email || email);
        setAuthTab('verify');
        setAuthSuccessMsg('Account pending verification. A 6-digit verification code has been dispatched to your email.');
        return;
      }

      if (!res.success) {
        console.error('🔴 [MODAL_LOGIN_FAILED_RESPONSE]:', res);
        setAuthError(res.error || 'Login failed. Please check your credentials.');
      } else {
      // If user has already completed this app's profile, navigate immediately
      if (appConfig) {
        const updatedUser = JSON.parse(localStorage.getItem('benix_user') || '{}');
        if (updatedUser?.app_profiles?.[targetAppKey]?.completed) {
          onClose();
          navigate(appConfig.route);
          if (onSuccess) onSuccess();
        }
      }
    }
  } catch (err: any) {
    setAuthLoading(false);
    console.error('🔴 [MODAL_LOGIN_EXCEPTION_CAUGHT]:', err);
    setAuthError(err.message || 'Login failed with an unexpected error.');
  }
};

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');
    if (!forgotEmail.trim()) {
      setForgotErrorMsg('Please enter your account email address.');
      return;
    }
    try {
      setForgotLoading(true);
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send verification code.');
      }
      setForgotStep(2);
      setForgotSuccessMsg(data.message || '5-digit code sent! Check your email.');
      if (data.verificationCode) {
        setReceivedDemoCode(data.verificationCode);
      }
    } catch (err: any) {
      setForgotErrorMsg(err.message || 'Failed to send verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');
    if (!forgotCode.trim() || forgotCode.trim().length !== 5) {
      setForgotErrorMsg('Please enter the exact 5-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotErrorMsg('Passwords do not match. Please re-enter your new password.');
      return;
    }
    try {
      setForgotLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          code: forgotCode.trim(),
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update password.');
      }
      setForgotSuccessMsg(data.message || 'Password updated successfully! Redirecting to sign in...');
      setTimeout(() => {
        setEmail(forgotEmail);
        setPassword('');
        setShowForgotPw(false);
        setForgotStep(1);
        setForgotCode('');
        setNewPassword('');
        setConfirmPassword('');
        setForgotSuccessMsg('');
        setAuthTab('login');
      }, 1800);
    } catch (err: any) {
      setForgotErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (!name.trim() || !email.trim() || !password || !phone.trim() || !country.trim()) {
      setAuthError('Please fill in all 5 fields to create your super-account.');
      return;
    }

    setAuthLoading(true);
    const res = await registerWizard({
      name,
      channel_name: channelName.trim() || name.trim(),
      nickname: channelName.trim() || name.trim(),
      email,
      password,
      whatsapp: phone,
      phone,
      country
    });
    setAuthLoading(false);

    if (res.requiresVerification) {
      setVerifyEmail(res.email || email);
      setAuthTab('verify');
      setAuthSuccessMsg('Account registered! A 6-digit verification code has been sent to your email. Enter it below to activate your account.');
      return;
    }

    if (!res.success) {
      setAuthError(res.error || 'Registration failed. Please try again.');
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (!verifyCode.trim()) {
      setAuthError('Please enter the 6-digit verification code.');
      return;
    }

    setAuthLoading(true);
    const res = await verifyAccount(verifyEmail || email, verifyCode.trim());
    setAuthLoading(false);

    if (!res.success) {
      setAuthError(res.error || 'Invalid verification code. Please check your code or request a new one.');
    } else {
      setAuthSuccessMsg('Account verified successfully! Welcome to Benix.Space.');
      if (appConfig) {
        const updatedUser = JSON.parse(localStorage.getItem('benix_user') || '{}');
        if (updatedUser?.app_profiles?.[targetAppKey]?.completed) {
          onClose();
          navigate(appConfig.route);
          if (onSuccess) onSuccess();
        }
      }
    }
  };

  const handleResendCode = async () => {
    setAuthError('');
    setResendLoading(true);
    const res = await resendVerificationCode(verifyEmail || email);
    setResendLoading(false);
    if (res.success) {
      setAuthSuccessMsg(res.message || 'New verification code sent to your email.');
    } else {
      setAuthError(res.error || 'Failed to resend code.');
    }
  };

  const handleVerifyChoirCode = async (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean.length !== 5) {
      setVerifiedChoir(null);
      setChoirLookupError('');
      return;
    }
    setChoirLookupLoading(true);
    setChoirLookupError('');
    try {
      const res = await fetch(`/api/modules/voxify/choirs/code/${clean}`);
      const data = await res.json();
      if (res.ok && data.choir) {
        setVerifiedChoir(data.choir);
        setWizardData(prev => ({
          ...prev,
          choir_name: data.choir.name,
          choir_code: data.choir.choir_code,
          choir_id: data.choir.id
        }));
      } else {
        setVerifiedChoir(null);
        setChoirLookupError(data.error || 'Choir code not found.');
      }
    } catch {
      setVerifiedChoir(null);
      setChoirLookupError('Network error verifying choir code.');
    } finally {
      setChoirLookupLoading(false);
    }
  };

  const handleWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appConfig) return;

    // Apply Voxify specific choir selections
    if (normalizedKey === 'voxify') {
      if (choirCodeMode === 'none') {
        wizardData.choir_name = 'Independent';
        wizardData.choir_code = '';
        wizardData.choir_id = null;
      } else if (verifiedChoir?.choir_code) {
        // Automatically join choir using verified choir code
        try {
          const token = localStorage.getItem('benix_token');
          if (token) {
            await fetch('/api/modules/voxify/choirs/join-code', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                choir_code: verifiedChoir.choir_code,
                voice_part: wizardData.voice_part || 'soprano'
              })
            });
          }
        } catch (err) {
          console.warn('Auto-join choir notice:', err);
        }
      }
    }

    // Validate required fields
    for (const f of appConfig.fields) {
      if (f.required) {
        const val = wizardData[f.name];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          setWizardError(`Please provide ${f.label}`);
          return;
        }
      }
    }

    setWizardLoading(true);
    setWizardError('');

    const res = await saveAppProfile(targetAppKey, wizardData);
    setWizardLoading(false);

    if (res.success) {
      setWizardSuccess(true);
      setTimeout(() => {
        setWizardSuccess(false);
        onClose();
        navigate(appConfig?.route || `/${targetAppKey}`);
        if (onSuccess) onSuccess();
      }, 1000);
    } else {
      setWizardError(res.error || 'Failed to save preferences.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0F141F] border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        
        {/* Modal Top Header with gradient banner - fixed at top */}
        <div className={`p-4 sm:p-5 bg-gradient-to-r ${appConfig?.color || 'from-indigo-600 to-purple-600'} text-white relative shrink-0`}>
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-sm">
              <AppIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                Benix.Space Feature
              </span>
              <h2 className="text-lg sm:text-xl font-black mt-0.5">{appConfig?.title || 'Unlock Feature'}</h2>
            </div>
          </div>
          <p className="text-[11px] sm:text-xs text-white/90 mt-1.5 font-medium line-clamp-1">
            {appConfig?.subtitle || 'Please complete the setup to proceed.'}
          </p>
        </div>

        {/* Modal Body - Scrollable within viewport */}
        <div className="p-4 sm:p-6 text-slate-200 overflow-y-auto flex-1 overscroll-contain">
          
          {/* STEP A: User is NOT logged in OR verifying account -> Ask to Register, Login, or Verify */}
          {(!user || authTab === 'verify' || targetAppKey === 'account_verification') ? (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  Authentication Required
                </span>
                <h3 className="text-lg font-bold text-white">
                  Join Benix.Space to Access {appConfig?.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Create your unified super-account in seconds with just 5 simple details.
                </p>
              </div>

              {/* Tabs or Verification Header */}
              {authTab !== 'verify' ? (
                <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => { setAuthTab('register'); setAuthError(''); setAuthSuccessMsg(''); }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      authTab === 'register'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccessMsg(''); }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${
                      authTab === 'login'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Log In
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">Email Verification</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccessMsg(''); }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-medium underline"
                  >
                    Switch Account
                  </button>
                </div>
              )}

              {authSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{authSuccessMsg}</span>
                </div>
              )}

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authTab === 'verify' ? (
                /* 6-Digit Email Verification Form */
                <form onSubmit={handleVerifySubmit} className="space-y-4">
                  <div className="text-center p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
                      <Mail className="w-5 h-5 animate-pulse" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Verify Your Email Address</h4>
                    <p className="text-xs text-slate-400">
                      We sent a 6-digit activation code to{' '}
                      <span className="font-semibold text-blue-400">{verifyEmail || email}</span>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Enter 6-Digit Code *
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        autoFocus
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="123456"
                        className="w-full pl-9 pr-3 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-center text-xl tracking-[10px] font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading || verifyCode.length < 6}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                  >
                    {authLoading ? 'Activating Account...' : 'Verify & Activate Account'}
                    <CheckCircle className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendLoading}
                      className="text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50 transition-colors"
                    >
                      {resendLoading ? 'Sending new code...' : 'Resend Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthTab('login'); setAuthError(''); setAuthSuccessMsg(''); }}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              ) : authTab === 'register' ? (
                /* 5-Field Registration Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Full Names *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Jean Paul Mugisha"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Nickname / Creator Channel Name *
                    </label>
                    <div className="relative">
                      <Sparkles className="absolute left-3 top-3 w-4 h-4 text-purple-400" />
                      <input
                        type="text"
                        required
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        placeholder="e.g. KigaliBeats or @jeanpaul"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">YouTube-style channel name used for video uploads and live comments.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. user@gmail.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a secure password"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                        WhatsApp / Phone *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+250 78..."
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                        Country *
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="Rwanda">Rwanda</option>
                          <option value="Uganda">Uganda</option>
                          <option value="Kenya">Kenya</option>
                          <option value="Tanzania">Tanzania</option>
                          <option value="Burundi">Burundi</option>
                          <option value="DR Congo">DR Congo</option>
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="Other">Other Country</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                  >
                    {authLoading ? 'Creating Super-Account...' : 'Register & Continue'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : showForgotPw ? (
                /* Forgot Password Form (5-Digit Verification Code Flow) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-black text-white">Reset Password</h4>
                      <p className="text-[11px] text-slate-400">
                        {forgotStep === 1 ? 'Step 1 of 2: Request 5-digit verification code' : 'Step 2 of 2: Enter 5-digit code & set new password'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPw(false)}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      ← Back to Sign In
                    </button>
                  </div>

                  {forgotSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{forgotSuccessMsg}</span>
                    </div>
                  )}

                  {forgotErrorMsg && (
                    <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{forgotErrorMsg}</span>
                    </div>
                  )}

                  {receivedDemoCode && forgotStep === 2 && (
                    <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs flex items-center justify-between">
                      <span>Verification Code: <strong className="text-white font-mono text-sm tracking-wider">{receivedDemoCode}</strong></span>
                      <button
                        type="button"
                        onClick={() => setForgotCode(receivedDemoCode)}
                        className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  {forgotStep === 1 ? (
                    <form onSubmit={handleSendResetCode} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                          Registered Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                          <input
                            type="email"
                            required
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="user@gmail.com"
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                      >
                        {forgotLoading ? 'Sending 5-Digit Code...' : 'Send Verification Code (5 Digits)'}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                          5-Digit Verification Code *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          value={forgotCode}
                          onChange={(e) => setForgotCode(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="12345"
                          className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-center text-lg font-mono font-black tracking-widest text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                          New Password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                          Confirm New Password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-type new password"
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                      >
                        {forgotLoading ? 'Updating Password...' : 'Update Password with Code'}
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => setForgotStep(1)}
                          className="text-[11px] text-slate-400 hover:text-slate-200"
                        >
                          Didn't receive code? Change email or resend
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* Login Form */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@gmail.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-300 uppercase">
                        Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setShowForgotPw(true);
                          setForgotStep(1);
                          setForgotErrorMsg('');
                          setForgotSuccessMsg('');
                        }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                  >
                    {authLoading ? 'Signing In...' : 'Sign In'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* STEP B: User IS Logged in -> Collect specific App Requirements */
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-extrabold text-white text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{user.name}</h4>
                    <p className="text-[11px] text-slate-400">{user.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Verified Super-Account
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Complete your {appConfig?.title} Profile</span>
                </h3>
                <p className="text-xs text-slate-400">
                  To provide you with the best experience, please answer these quick preferences for {appConfig?.title}:
                </p>
              </div>

              {wizardError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{wizardError}</span>
                </div>
              )}

              {wizardSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-bounce">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>Preferences saved! Entering {appConfig?.title}...</span>
                </div>
              )}

              <form onSubmit={handleWizardSubmit} className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {appConfig?.fields.map((f) => (
                  <div key={f.name} className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      {f.label} {f.required && <span className="text-rose-400">*</span>}
                    </label>

                    {f.type === 'select' && (
                      <select
                        value={wizardData[f.name] || ''}
                        onChange={(e) => setWizardData({ ...wizardData, [f.name]: e.target.value })}
                        required={f.required}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select an option...</option>
                        {f.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {f.type === 'multiselect' && (
                      <div className="space-y-2 mt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {f.options?.map((opt) => {
                            const selected = Array.isArray(wizardData[f.name]) && wizardData[f.name].includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  const current: string[] = Array.isArray(wizardData[f.name]) ? [...wizardData[f.name]] : [];
                                  const next = current.includes(opt)
                                    ? current.filter((x) => x !== opt)
                                    : [...current, opt];
                                  setWizardData({ ...wizardData, [f.name]: next });
                                }}
                                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all text-left ${
                                  selected
                                    ? 'bg-blue-600/25 border-blue-500 text-blue-200 shadow-sm'
                                    : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-slate-500 hover:text-white'
                                }`}
                              >
                                <span className="truncate pr-1">{opt}</span>
                                <div
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                    selected
                                      ? 'bg-blue-500 border-blue-400 text-white'
                                      : 'border-slate-600 bg-slate-800'
                                  }`}
                                >
                                  {selected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-center justify-between">
                          <span>Click to toggle your preferred choices</span>
                          <span className="font-bold text-blue-400">
                            {Array.isArray(wizardData[f.name]) ? wizardData[f.name].length : 0} of {f.options?.length || 0} selected
                          </span>
                        </p>
                      </div>
                    )}

                    {f.type === 'radio' && (
                      <div className="space-y-2 mt-1">
                        {f.options?.map((opt) => {
                          const selected = wizardData[f.name] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setWizardData({ ...wizardData, [f.name]: opt })}
                              className={`w-full px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all text-left ${
                                selected
                                  ? 'bg-blue-600/25 border-blue-500 text-blue-200'
                                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                              }`}
                            >
                              <span>{opt}</span>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selected ? 'border-blue-400 bg-blue-500' : 'border-slate-600'}`}>
                                {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {f.type === 'text' && (
                      normalizedKey === 'voxify' && f.name === 'choir_name' ? (
                        <div className="space-y-2 mt-1">
                          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                            <button
                              type="button"
                              onClick={() => {
                                setChoirCodeMode('code');
                                setWizardData({ ...wizardData, choir_name: verifiedChoir ? verifiedChoir.name : '' });
                              }}
                              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                choirCodeMode === 'code'
                                  ? 'bg-emerald-600 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <Music className="w-3.5 h-3.5" />
                              <span>Join with Choir Code</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setChoirCodeMode('none');
                                setChoirCodeInput('');
                                setVerifiedChoir(null);
                                setChoirLookupError('');
                                setWizardData({ ...wizardData, choir_name: 'Independent', choir_code: '' });
                              }}
                              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                choirCodeMode === 'none'
                                  ? 'bg-slate-700 text-white shadow'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <User className="w-3.5 h-3.5" />
                              <span>Continue without Choir</span>
                            </button>
                          </div>

                          {choirCodeMode === 'code' ? (
                            <div className="space-y-2 pt-1">
                              <div className="relative">
                                <input
                                  type="text"
                                  maxLength={5}
                                  value={choirCodeInput}
                                  onChange={(e) => {
                                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                    setChoirCodeInput(val);
                                    if (val.length === 5) {
                                      handleVerifyChoirCode(val);
                                    } else {
                                      setVerifiedChoir(null);
                                      setChoirLookupError('');
                                    }
                                  }}
                                  placeholder="ENTER 5-DIGIT CODE (e.g. 7X9KQ)"
                                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono tracking-widest text-center text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase font-black"
                                />
                                {choirLookupLoading && (
                                  <div className="absolute right-3 top-2.5 text-[10px] text-emerald-400 animate-pulse font-bold">
                                    Checking...
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 text-center">
                                Enter the 5-character code from your Choir Director or Maestro to join rehearsal rooms.
                              </p>

                              {verifiedChoir && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                                  <div>
                                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Choir Verified ✓</span>
                                    <h4 className="text-xs font-bold text-white mt-0.5">{verifiedChoir.name}</h4>
                                    <p className="text-[10px] text-slate-400">
                                      {verifiedChoir.church_denomination || 'Sacred Choral'} • Director: {verifiedChoir.director_name || 'Choir Master'} ({verifiedChoir.member_count || 1} members)
                                    </p>
                                  </div>
                                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                                </div>
                              )}

                              {choirLookupError && (
                                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] rounded-xl flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{choirLookupError}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-300 text-xs flex items-center gap-2">
                              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>
                                Continuing as an <strong>Independent Musician / Listener</strong> (no choir code required). You can join or create a choir anytime in Voxify!
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={wizardData[f.name] || ''}
                          onChange={(e) => setWizardData({ ...wizardData, [f.name]: e.target.value })}
                          placeholder={f.placeholder}
                          required={f.required}
                          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      )
                    )}

                    {f.type === 'number' && (
                      <input
                        type="number"
                        min="18"
                        max="100"
                        value={wizardData[f.name] || ''}
                        onChange={(e) => setWizardData({ ...wizardData, [f.name]: e.target.value })}
                        placeholder={f.placeholder}
                        required={f.required}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    )}

                    {f.type === 'textarea' && (
                      <textarea
                        rows={3}
                        value={wizardData[f.name] || ''}
                        onChange={(e) => setWizardData({ ...wizardData, [f.name]: e.target.value })}
                        placeholder={f.placeholder}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    )}

                    {f.type === 'checkbox' && (
                      <label className="flex items-center gap-2 cursor-pointer mt-1">
                        <input
                          type="checkbox"
                          checked={!!wizardData[f.name]}
                          onChange={(e) => setWizardData({ ...wizardData, [f.name]: e.target.checked })}
                          required={f.required}
                          className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                        />
                        <span className="text-xs text-slate-300">{f.label}</span>
                      </label>
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={wizardLoading || wizardSuccess}
                  className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                >
                  {wizardLoading ? 'Saving Setup...' : `Save & Open ${appConfig?.title}`}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
