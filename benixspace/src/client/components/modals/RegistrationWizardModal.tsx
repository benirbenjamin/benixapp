import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme, ThemeMode, AccentColor } from '../../context/ThemeContext';
import {
  X,
  CheckCircle2,
  Tv,
  Music,
  Heart,
  ShoppingBag,
  Radio,
  Dices,
  Calculator,
  Newspaper,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Palette,
  Sun,
  Moon
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AVAILABLE_MODULES = [
  { id: 'videos', name: 'Videos & Live TV', icon: Tv, desc: 'Watch streaming TV, video broadcasts, and original content' },
  { id: 'radio', name: 'Live Radio', icon: Radio, desc: 'Listen to 24/7 digital radio stations, DJ mixes, and live talk shows' },
  { id: 'dating', name: 'Kunda Space Dating', icon: Heart, desc: 'Connect with verified matches for serious and genuine relationships' },
  { id: 'music', name: 'Voxify Music & Choirs', icon: Music, desc: 'Stream choir tracks, vocal rehearsal audio, and gospel releases' },
  { id: 'marketplace', name: 'Benix Marketplace', icon: ShoppingBag, desc: 'Discover digital products, services, and creative freelance work' },
  { id: 'games', name: 'RollDice Games', icon: Dices, desc: 'Compete in multiplayer roll-dice challenges with your central wallet' },
  { id: 'calc', name: 'EasyCalc Smart Utilities', icon: Calculator, desc: 'Instant finance, scientific, business, and unit conversion calculators' }
];

export const RegistrationWizardModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { registerWizard, login, verifyAccount, resendVerificationCode } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { mode, setMode } = useTheme();

  const [isLoginMode, setIsLoginMode] = useState<boolean>(false);
  const [isVerificationMode, setIsVerificationMode] = useState<boolean>(false);
  const [verifyEmail, setVerifyEmail] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Step 1: Core Credentials
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [referralCode, setReferralCode] = useState('');

  // Step 2: Selected Modules
  const [selectedModules, setSelectedModules] = useState<string[]>([
    'videos', 'radio', 'dating', 'music', 'marketplace', 'games', 'calc'
  ]);

  // Step 3: Dynamic App-Specific Questions State
  const [datingGender, setDatingGender] = useState<'woman' | 'man' | 'other'>('woman');
  const [datingInterestedIn, setDatingInterestedIn] = useState<'men' | 'women' | 'everyone'>('men');
  const [datingAge, setDatingAge] = useState<number>(22);
  const [datingIntent, setDatingIntent] = useState<'serious' | 'casual' | 'friends' | 'networking'>('serious');

  const [musicVoicePart, setMusicVoicePart] = useState<'soprano' | 'alto' | 'tenor' | 'bass' | 'director' | 'listener'>('listener');

  const [marketRole, setMarketRole] = useState<'buyer' | 'seller' | 'freelancer'>('buyer');

  const [gamerTag, setGamerTag] = useState('');
  const [luckyNumber, setLuckyNumber] = useState<number>(7);

  // Step 4: Preferences
  const [preferredLang, setPreferredLang] = useState<'en' | 'rw' | 'fr' | 'sw'>(language || 'en');
  const [preferredTheme, setPreferredTheme] = useState<ThemeMode>(mode || 'light');

  if (!isOpen) return null;

  const toggleModule = (id: string) => {
    if (selectedModules.includes(id)) {
      if (selectedModules.length === 1) return;
      setSelectedModules(selectedModules.filter((m) => m !== id));
    } else {
      setSelectedModules([...selectedModules, id]);
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!fullName.trim() || !email.trim() || !password) {
        setError('Please fill in all required fields.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (!acceptedTerms) {
        setError('You must accept the terms and privacy policy.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(Math.max(1, step - 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    const res = await registerWizard({
      name: fullName,
      email,
      password,
      phone,
      selected_modules: selectedModules,
      preferred_language: preferredLang,
      homepage_layout: { order: selectedModules },
      referral_code: referralCode.trim() || undefined,
      app_onboarding: {
        dating: selectedModules.includes('dating') ? {
          gender: datingGender,
          interestedIn: datingInterestedIn,
          age: datingAge,
          intent: datingIntent
        } : null,
        voxify: selectedModules.includes('music') ? { voicePart: musicVoicePart } : null,
        marketplace: selectedModules.includes('marketplace') ? { role: marketRole } : null,
        games: selectedModules.includes('games') ? { gamerTag: gamerTag || fullName, luckyNumber } : null
      }
    });
    setLoading(false);

    if (res.requiresVerification) {
      setVerifyEmail(res.email || email);
      setIsVerificationMode(true);
      setSuccessMsg('Account registered! A 6-digit verification code has been dispatched to your email.');
      return;
    }

    if (res.success) {
      setLanguage(preferredLang);
      setMode(preferredTheme);
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setError(res.error || 'Failed to complete registration.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    const res = await login(email.trim(), password);
    setLoading(false);

    if (res.requiresVerification) {
      setVerifyEmail(res.email || email);
      setIsVerificationMode(true);
      setSuccessMsg('Your account is not verified yet. A 6-digit verification code has been sent to your email.');
      return;
    }

    if (res.success) {
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setError(res.error || 'Invalid email or password.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    const res = await verifyAccount(verifyEmail || email, verifyCode.trim());
    setLoading(false);
    if (res.success) {
      setLanguage(preferredLang);
      setMode(preferredTheme);
      onClose();
      if (onSuccess) onSuccess();
    } else {
      setError(res.error || 'Invalid verification code. Please check your inbox or resend.');
    }
  };

  const handleResend = async () => {
    setError('');
    setResendLoading(true);
    const res = await resendVerificationCode(verifyEmail || email);
    setResendLoading(false);
    if (res.success) {
      setSuccessMsg(res.message || 'Verification code resent to your email.');
    } else {
      setError(res.error || 'Failed to resend code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header with Step Tracker */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            {isVerificationMode ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-100/70 dark:bg-sky-950 px-2.5 py-0.5 rounded-full">
                    Activation
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                  Email Verification Required
                </h2>
              </>
            ) : !isLoginMode ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-100/70 dark:bg-sky-950 px-2.5 py-0.5 rounded-full">
                    Step {step} of 5
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {step === 1 && 'Account Credentials'}
                    {step === 2 && 'Select Apps'}
                    {step === 3 && 'App Onboarding (Customized)'}
                    {step === 4 && 'Theme & Language'}
                    {step === 5 && 'Preview & Complete'}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                  Join Benix.Space Unified Super-App
                </h2>
              </>
            ) : (
              <>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-100/70 px-2.5 py-0.5 rounded-full">
                  Sign In
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                  Log In to Your Super-Account
                </h2>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        {!isLoginMode && !isVerificationMode && (
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5">
            <div
              className="bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-500 h-1.5 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        )}

        {/* Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {successMsg && (
            <div className="p-3 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {isVerificationMode ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 rounded-2xl space-y-1">
                <ShieldCheck className="w-8 h-8 text-sky-600 dark:text-sky-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Verify Your Email Address</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Enter the 6-digit code sent to <span className="font-semibold text-sky-600">{verifyEmail || email}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  6-Digit Verification Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-center font-mono font-bold text-lg tracking-[8px] focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || verifyCode.length < 6}
                className="w-full py-3 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 shadow-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Activating Account...' : 'Verify & Activate Account'}
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-sky-600 hover:underline font-semibold disabled:opacity-50"
                >
                  {resendLoading ? 'Sending new code...' : 'Resend Code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsVerificationMode(false); setIsLoginMode(true); setError(''); setSuccessMsg(''); }}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : isLoginMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-sky-600 text-white font-semibold text-sm hover:bg-sky-700 shadow-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsLoginMode(false); setError(''); }}
                  className="text-xs text-sky-600 hover:underline font-semibold"
                >
                  Don't have an account? Start registration wizard
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* STEP 1: Account Creation */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Benir Benjamin"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Phone (MoMo / SMS)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0783987223"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Secure Password *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Referral Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      placeholder="e.g. BENIX-SUPERADMIN"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                    />
                    <label htmlFor="terms" className="text-xs text-slate-600 dark:text-slate-400">
                      I agree to the <span className="font-semibold text-sky-600">Terms of Service</span> and <span className="font-semibold text-sky-600">Privacy Policy</span>.
                    </label>
                  </div>

                  <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setIsLoginMode(true); setError(''); }}
                      className="text-xs text-sky-600 hover:underline font-semibold"
                    >
                      Already have an account? Sign in here
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Choose Interests & Modules */}
              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Choose which apps you want enabled on your super-app homepage and mobile navigation:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AVAILABLE_MODULES.map((mod) => {
                      const Icon = mod.icon;
                      const isSelected = selectedModules.includes(mod.id);
                      return (
                        <div
                          key={mod.id}
                          onClick={() => toggleModule(mod.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 opacity-60'
                          }`}
                        >
                          <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{mod.name}</h4>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {mod.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: DYNAMIC APP-SPECIFIC QUESTIONS (BASED ON WHAT USER CHOSE) */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="p-3 bg-sky-50 dark:bg-sky-950/50 rounded-2xl border border-sky-100 dark:border-sky-900 text-xs text-sky-800 dark:text-sky-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Personalizing onboarding based on your {selectedModules.length} selected apps:</span>
                  </div>

                  {/* Kunda Dating Specific Questions */}
                  {selectedModules.includes('dating') && (
                    <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                          Kunda Space Dating Profile (18+)
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            I am a:
                          </label>
                          <select
                            value={datingGender}
                            onChange={(e) => setDatingGender(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-xs"
                          >
                            <option value="woman">Woman</option>
                            <option value="man">Man</option>
                            <option value="other">Non-binary / Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Looking for:
                          </label>
                          <select
                            value={datingInterestedIn}
                            onChange={(e) => setDatingInterestedIn(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-xs"
                          >
                            <option value="men">Men</option>
                            <option value="women">Women</option>
                            <option value="everyone">Everyone</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Your Age (18+):
                          </label>
                          <input
                            type="number"
                            min={18}
                            max={99}
                            value={datingAge}
                            onChange={(e) => setDatingAge(parseInt(e.target.value) || 18)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Relationship Intent:
                          </label>
                          <select
                            value={datingIntent}
                            onChange={(e) => setDatingIntent(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-xs"
                          >
                            <option value="serious">Long-term Relationship</option>
                            <option value="friends">New Friends & Networking</option>
                            <option value="casual">Casual Dating</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Voxify Music Specific Questions */}
                  {selectedModules.includes('music') && (
                    <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                          Voxify Music & Choir Part
                        </h4>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Select your vocal part or choir involvement:
                        </label>
                        <select
                          value={musicVoicePart}
                          onChange={(e) => setMusicVoicePart(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-xs"
                        >
                          <option value="listener">Music Listener / Supporter</option>
                          <option value="soprano">Soprano (High voice)</option>
                          <option value="alto">Alto (Low female voice)</option>
                          <option value="tenor">Tenor (High male voice)</option>
                          <option value="bass">Bass (Low male voice)</option>
                          <option value="director">Choir Conductor / Director</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Benix Marketplace Specific Questions */}
                  {selectedModules.includes('marketplace') && (
                    <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                          Benix Marketplace Role
                        </h4>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          How do you plan to use Benix Marketplace?
                        </label>
                        <select
                          value={marketRole}
                          onChange={(e) => setMarketRole(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-xs"
                        >
                          <option value="buyer">Shopper (Discover & buy digital goods)</option>
                          <option value="seller">Seller / Creator (List digital downloads)</option>
                          <option value="freelancer">Service Freelancer (Offer tech & design services)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* RollDice Gaming Specific Questions */}
                  {selectedModules.includes('games') && (
                    <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                      <div className="flex items-center gap-2">
                        <Dices className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                          RollDice Gaming Profile
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Gamertag Alias:
                          </label>
                          <input
                            type="text"
                            value={gamerTag}
                            onChange={(e) => setGamerTag(e.target.value)}
                            placeholder={fullName.split(' ')[0] || 'DiceMaster'}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            Lucky Number (1-12):
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={12}
                            value={luckyNumber}
                            onChange={(e) => setLuckyNumber(parseInt(e.target.value) || 7)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-800 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Language & Customizable Theme */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Preferred Language
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { code: 'en', label: 'English', native: 'English (EN)' },
                        { code: 'rw', label: 'Kinyarwanda', native: 'Ikinyarwanda (RW)' },
                        { code: 'fr', label: 'French', native: 'Français (FR)' },
                        { code: 'sw', label: 'Swahili', native: 'Kiswahili (SW)' }
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => setPreferredLang(lang.code as any)}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            preferredLang === lang.code
                              ? 'border-sky-600 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="text-sm font-bold">{lang.native}</div>
                          <div className="text-[10px] text-slate-500">{lang.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Customizable Theme Mode
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'light', label: 'Daylight', icon: Sun },
                        { id: 'dark', label: 'Dark Mode', icon: Moon },
                        { id: 'midnight', label: 'Midnight Blue', icon: Sparkles },
                        { id: 'cyber', label: 'Cyberpunk', icon: Palette }
                      ].map((t) => {
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setPreferredTheme(t.id as any)}
                            className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                              preferredTheme === t.id
                                ? 'border-sky-600 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold'
                                : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="text-xs font-semibold">{t.label}</span>
                            <Icon className="w-4 h-4 text-sky-500" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Live Preview & Confirmation */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Overview</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200">
                        +100 RWF Welcome Bonus Included
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Name</span>
                        <strong className="text-slate-800 dark:text-slate-200">{fullName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Email</span>
                        <strong className="text-slate-800 dark:text-slate-200">{email}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Language & Theme</span>
                        <strong className="text-slate-800 dark:text-slate-200 uppercase">{preferredLang} • {preferredTheme}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Active Modules</span>
                        <strong className="text-sky-600 font-bold">{selectedModules.length} Connected</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Customized Super-App Suite:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedModules.map((mId) => {
                        const mod = AVAILABLE_MODULES.find((m) => m.id === mId);
                        return (
                          <span
                            key={mId}
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
                            <span>{mod?.name}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {!isLoginMode && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={handleBack}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-xs hover:bg-sky-700 shadow-md transition-colors"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-md transition-colors disabled:opacity-50"
              >
                <span>{loading ? 'Creating Super-Account...' : 'Launch My Super-App'}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
