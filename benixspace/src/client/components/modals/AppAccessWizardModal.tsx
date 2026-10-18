import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

interface AppAccessWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetAppKey: string | null;
  onSuccess?: () => void;
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
  onSuccess
}) => {
  const navigate = useNavigate();
  const { user, login, registerWizard, saveAppProfile } = useAuth();

  // Mode: 'auth' (if not logged in) or 'wizard' (if logged in but needs requirement fields)
  const [authTab, setAuthTab] = useState<'register' | 'login'>('register');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // 5-field registration form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Rwanda');

  // App requirement wizard form state
  const [wizardData, setWizardData] = useState<Record<string, any>>({});
  const [wizardError, setWizardError] = useState('');
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardSuccess, setWizardSuccess] = useState(false);

  if (!isOpen || !targetAppKey) return null;

  const appConfig: AppRequirementConfig | undefined = APP_REQUIREMENTS[targetAppKey];
  const AppIcon = (appConfig && ICON_MAP[appConfig.icon]) || Sparkles;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const res = await login(email, password);
    setAuthLoading(false);

    if (!res.success) {
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
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!name.trim() || !email.trim() || !password || !phone.trim() || !country.trim()) {
      setAuthError('Please fill in all 5 fields to create your super-account.');
      return;
    }

    setAuthLoading(true);
    const res = await registerWizard({
      name,
      email,
      password,
      whatsapp: phone,
      phone,
      country
    });
    setAuthLoading(false);

    if (!res.success) {
      setAuthError(res.error || 'Registration failed. Please try again.');
    }
  };

  const handleWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appConfig) return;

    // Validate required fields
    for (const f of appConfig.fields) {
      if (f.required && !wizardData[f.name]) {
        setWizardError(`Please provide ${f.label}`);
        return;
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
        navigate(appConfig.route);
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
          
          {/* STEP A: User is NOT logged in -> Ask to Register or Login */}
          {!user ? (
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

              {/* Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setAuthError(''); }}
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
                  onClick={() => { setAuthTab('login'); setAuthError(''); }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    authTab === 'login'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Log In
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authTab === 'register' ? (
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
                        placeholder="benirabok@gmail.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Password *
                    </label>
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
                    {authLoading ? 'Signing In...' : 'Sign In with Axios'}
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

                    {f.type === 'text' && (
                      <input
                        type="text"
                        value={wizardData[f.name] || ''}
                        onChange={(e) => setWizardData({ ...wizardData, [f.name]: e.target.value })}
                        placeholder={f.placeholder}
                        required={f.required}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
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
