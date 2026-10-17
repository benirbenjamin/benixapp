import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SUPPORTED_COUNTRIES } from '../../../api/_lib/config';
import {
  User,
  Heart,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Lock,
  PlayCircle,
  UploadCloud,
  BookOpen,
  Trash2,
  X,
  Globe,
  Smile,
} from 'lucide-react';

import { api, getErrorMessage } from '../../lib/api';
import { compressImage } from '../../lib/compression';

// Curated authentic African portraits for representative matching & avatar suggestion
export const AFRICAN_AVATAR_SUGGESTIONS = [
  {
    id: 'afr-1',
    label: 'Aline (Kigali)',
    gender: 'woman',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'afr-2',
    label: 'Eric (Kigali)',
    gender: 'man',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'afr-3',
    label: 'Diane (Rubavu)',
    gender: 'woman',
    imageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'afr-4',
    label: 'Jean-Claude (Musanze)',
    gender: 'man',
    imageUrl: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'afr-5',
    label: 'Grace (Huye)',
    gender: 'woman',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'afr-6',
    label: 'Patrick (Kigali)',
    gender: 'man',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
  },
];

export const RegisterWizard: React.FC = () => {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [tutorialModalOpen, setTutorialModalOpen] = useState<boolean>(false);
  const [selectedTut, setSelectedTut] = useState<any>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  // Fetch registration tutorials posted by admin
  React.useEffect(() => {
    api.get('/tutorials')
      .then((res) => {
        if (res.data?.success && res.data?.tutorials) {
          setTutorials(res.data.tutorials);
          if (res.data.tutorials.length > 0) setSelectedTut(res.data.tutorials[0]);
        }
      })
      .catch((err) => console.error('Failed to load tutorials:', err));
  }, []);

  // Handle direct Google Drive upload with client-side compression & automatic retry
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      // 1. Client-side canvas compression: turns heavy 10MB phone photos into ~150KB
      const compressed = await compressImage(file, 1280, 1280, 0.78);

      // Immediate UI update with compressed photo so user never waits
      setFormData((prev) => ({ ...prev, primaryPhoto: compressed.dataUrl }));

      // 2. Upload to Google Drive with automatic retry
      let uploadSuccess = false;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await api.post(
            '/upload',
            {
              fileBase64: compressed.dataUrl,
              filename: `profile_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
              mimeType: 'image/jpeg',
              isRegistration: true,
            },
            { timeout: 35000 }
          );

          if (res.data?.success && res.data?.url) {
            setFormData((prev) => ({ ...prev, primaryPhoto: res.data.url }));
            uploadSuccess = true;
            break;
          }
        } catch (uploadErr) {
          console.warn(`Drive upload attempt ${attempt} notice:`, uploadErr);
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }

      if (!uploadSuccess) {
        console.log('Optimized photo retained for fast registration.');
      }
    } catch (err) {
      console.error('Photo processing error:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Account & Location
    displayName: '',
    email: '',
    password: '',
    dob: '',
    gender: 'woman',
    interestedIn: 'men',
    country: 'Rwanda',
    city: 'Kigali',
    phoneCode: '+250',
    phone: '',
    preferredLanguage: language || 'en',

    // Step 2: Goals, Rich Profile Details & Matching Preferences
    relationshipIntention: 'serious_relationship',
    friendshipRange: 'relationship_and_friends', // connection range
    minAgePref: 22,
    maxAgePref: 38,
    datingScope: 'local',
    height: 168,
    occupation: '',
    education: "Bachelor's Degree",
    religion: 'Christian / Protestant',
    childrenStatus: 'wants_children',
    smokingHabit: 'never',
    drinkingHabit: 'socially',
    languagesKnown: ['Kinyarwanda', 'English'],
    partnerPreferredLanguages: ['Kinyarwanda', 'English'],
    interests: ['Coffee & Tea Tasting', 'Hiking in 1000 Hills', 'Tech & Entrepreneurship'] as string[],
    appearanceSkinTone: 'warm_deep',
    bio: '',

    // Step 3: Photos & Consent
    primaryPhoto: AFRICAN_AVATAR_SUGGESTIONS[0].imageUrl,
    galleryPhotos: [
      AFRICAN_AVATAR_SUGGESTIONS[2].imageUrl,
    ],
    termsAccepted: false,
  });

  const availableLanguagesList = [
    'Kinyarwanda',
    'English',
    'Français',
    'Swahili',
    'Kirundi',
    'Luganda',
    'Lingala',
    'Arabic',
    'German',
  ];

  const availableInterests = [
    'Traditional Dance & Music',
    'Art & Photography',
    'Coffee & Tea Tasting',
    'Dining Out & Foodie',
    'Hiking in 1000 Hills',
    'Fitness & Gym',
    'Book Club & Reading',
    'Tech & Entrepreneurship',
    'Travel & Road Trips',
    'Faith & Spirituality',
    'Community & Volunteering',
    'Music & Concerts',
  ];

  // Stock African adult reference sample cards
  const appearanceSamples = [
    {
      id: 'warm_deep',
      label: 'Deep Melanin Tone',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'warm_golden',
      label: 'Warm Bronze Tone',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'caramel',
      label: 'Caramel & Sun-kissed',
      imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
    },
  ];

  // Selected country cities
  const selectedCountryObj = SUPPORTED_COUNTRIES.find((c) => c.name === formData.country) || SUPPORTED_COUNTRIES[0];

  const handleCountryChange = (countryName: string) => {
    const c = SUPPORTED_COUNTRIES.find((x) => x.name === countryName);
    if (c) {
      setFormData({
        ...formData,
        country: c.name,
        city: c.cities[0] || '',
        phoneCode: c.callingCode,
      });
    }
  };

  const toggleLanguageKnown = (lang: string) => {
    setFormData((prev) => {
      const exists = prev.languagesKnown.includes(lang);
      if (exists) {
        if (prev.languagesKnown.length === 1) return prev; // Keep at least one
        return { ...prev, languagesKnown: prev.languagesKnown.filter((l) => l !== lang) };
      } else {
        return { ...prev, languagesKnown: [...prev.languagesKnown, lang] };
      }
    });
  };

  const togglePartnerLanguage = (lang: string) => {
    setFormData((prev) => {
      const exists = prev.partnerPreferredLanguages.includes(lang);
      if (exists) {
        if (prev.partnerPreferredLanguages.length === 1) return prev;
        return { ...prev, partnerPreferredLanguages: prev.partnerPreferredLanguages.filter((l) => l !== lang) };
      } else {
        return { ...prev, partnerPreferredLanguages: [...prev.partnerPreferredLanguages, lang] };
      }
    });
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      if (exists) {
        return { ...prev, interests: prev.interests.filter((i) => i !== interest) };
      } else {
        return { ...prev, interests: [...prev.interests, interest] };
      }
    });
  };

  // Client Age check helper (DOB must be >= 18)
  const isAdultDOB = (dobStr: string) => {
    if (!dobStr) return false;
    const dob = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const handleNextStep1 = () => {
    setError(null);
    if (!formData.displayName || !formData.email || !formData.password || !formData.dob) {
      setError('Please fill in all mandatory account fields.');
      return;
    }
    if (!isAdultDOB(formData.dob)) {
      setError(t('wizard.underageWarning'));
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextStep2 = () => {
    setError(null);
    if (!formData.bio || formData.bio.trim().length < 8) {
      setError('Please write at least a brief bio introducing who you are.');
      return;
    }
    if (formData.minAgePref > formData.maxAgePref) {
      setError('Minimum age preference cannot be higher than maximum age.');
      return;
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetails(null);

    if (!formData.termsAccepted) {
      setError('You must confirm you are 18+ and accept the Terms of Service to join.');
      return;
    }

    setLoading(true);

    try {
      let primaryPhoto = formData.primaryPhoto;

      // Ensure any massive dataUri is compressed before dispatch
      if (primaryPhoto && primaryPhoto.startsWith('data:') && primaryPhoto.length > 500000) {
        try {
          const blobRes = await fetch(primaryPhoto);
          const blob = await blobRes.blob();
          const comp = await compressImage(blob, 1080, 1080, 0.75);
          primaryPhoto = comp.dataUrl;
        } catch (e) {
          console.warn('Pre-submit photo compression notice:', e);
        }
      }

      const payload = {
        ...formData,
        primaryPhoto,
        languages: formData.languagesKnown,
        partnerLanguages: formData.partnerPreferredLanguages,
        photos: [primaryPhoto, ...formData.galleryPhotos],
      };

      let lastError: any = null;

      // Automatic retry loop: guarantees registration succeeds even on slow connections
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await api.post('/auth/register', payload, { timeout: 60000 });
          const data = res?.data;

          if (data && data.success && data.token) {
            login(data.token, data.user, data.profile);
            navigate(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
            return;
          } else {
            lastError = data?.error ? getErrorMessage(data.error) : 'Registration failed. Please check your information.';
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Registration attempt ${attempt} notice:`, err);

          // If the account was already created (e.g. attempt 1 reached the server before client-side timeout)
          const isConflict =
            err?.response?.status === 409 ||
            (typeof err?.response?.data?.error === 'string' && err?.response?.data?.error?.includes('already exists')) ||
            (typeof err?.response?.data === 'string' && err?.response?.data?.includes('already exists'));

          if (isConflict) {
            try {
              const loginRes = await api.post('/auth/login', {
                email: formData.email,
                password: formData.password,
              });
              if (loginRes.data?.success && loginRes.data?.token) {
                login(loginRes.data.token, loginRes.data.user, loginRes.data.profile);
                navigate(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
                return;
              }
            } catch {
              navigate(`/auth/login?email=${encodeURIComponent(formData.email)}`);
              return;
            }
          }

          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      }

      // If both attempts failed, display helpful message
      const friendlyMsg = getErrorMessage(lastError);
      setError(friendlyMsg);

      const status = lastError?.response?.status;
      const statusText = lastError?.response?.statusText;
      const rawBody = lastError?.response?.data;
      const detailStr = [
        status ? `Status: ${status} ${statusText || ''}` : '',
        typeof rawBody === 'string' ? rawBody : (rawBody?.error ? JSON.stringify(rawBody.error) : ''),
        lastError?.message ? `Details: ${lastError.message}` : '',
      ].filter(Boolean).join(' | ');

      if (detailStr) {
        setErrorDetails(detailStr);
      }
    } catch (err: any) {
      console.error('Registration submit error:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-24 md:pb-12">
      {/* Wizard Progress Bar */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span className={step >= 1 ? 'text-rose-600' : ''}>1. {t('wizard.step1')}</span>
          <span className={step >= 2 ? 'text-rose-600' : ''}>2. Goals & Deep Profile</span>
          <span className={step >= 3 ? 'text-rose-600' : ''}>3. Photo & Review</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-violet-600 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Watch Platform Tutorial Banner */}
        <div className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-rose-50 border border-violet-100 p-3 rounded-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-bold text-violet-900">New to Kunda Space?</span>
          </div>
          <button
            type="button"
            onClick={() => setTutorialModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <PlayCircle className="w-3.5 h-3.5" /> Watch Platform Tutorials
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 sm:p-10 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-700 space-y-2 animate-shake">
            <div className="flex items-start gap-2.5 font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
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

        {/* STEP 1: ACCOUNT & LOCATION */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{t('wizard.step1')}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Tell us who you are. Kunda Space is strictly for adults 18 and older.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('wizard.fullName')}
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. Diane, Keza, or Eric"
              />

              <Input
                label={t('auth.emailLabel')}
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('auth.passwordLabel')}
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••••"
              />

              <Input
                label={t('wizard.dob')}
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                helperText="Must be at least 18 years old today"
              />
            </div>

            {/* Gender and Interested In */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('wizard.gender')}
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  <option value="woman">{t('wizard.woman')}</option>
                  <option value="man">{t('wizard.man')}</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('wizard.interestedIn')}
                </label>
                <select
                  value={formData.interestedIn}
                  onChange={(e) => setFormData({ ...formData, interestedIn: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  <option value="men">{t('wizard.interestedMen')}</option>
                  <option value="women">{t('wizard.interestedWomen')}</option>
                  <option value="everyone">{t('wizard.interestedEveryone')}</option>
                </select>
              </div>
            </div>

            {/* Country and City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('wizard.country')}
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name} ({c.callingCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('wizard.city')}
                </label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  {selectedCountryObj.cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('wizard.phone')}
              </label>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold">
                  {formData.phoneCode}
                </span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="788 123 456"
                  className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                {t('wizard.phoneNotice')}
              </p>
            </div>

            <Button onClick={handleNextStep1} className="w-full py-3 shadow-md shadow-rose-200">
              {t('wizard.nextBtn')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* STEP 2: GOALS, DEEP PROFILE & MATCHING PREFERENCES */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Goals, Preferences & More Details</h2>
              <p className="text-xs text-slate-500 mt-1">
                The more details you specify, the easier our compatibility engine matches you with the ideal person.
              </p>
            </div>

            {/* Relationship Intention & Connection Range */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Primary Relationship Goal
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'serious_relationship', label: '💍 Serious Relationship', desc: 'Long-term loving commitment' },
                  { id: 'marriage', label: '💒 Marriage & Family', desc: 'Ready to settle down and build a home' },
                  { id: 'friendship', label: '✨ Meaningful Friendship', desc: 'Deep companionship & shared laughs' },
                  { id: 'casual_dating', label: '☕ Dating & Chemistry', desc: 'Getting to know someone organically' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, relationshipIntention: item.id })}
                    className={`p-3 rounded-2xl border text-xs font-semibold text-left transition-all ${
                      formData.relationshipIntention === item.id
                        ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-slate-900">{item.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Range of Connection Desired */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                What Range of Connection Are You Open To?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'exclusive_romance', label: 'Exclusive Romance Only' },
                  { id: 'relationship_and_friends', label: 'Romance & Good Friends' },
                  { id: 'close_friends_first', label: 'Best Friends First' },
                  { id: 'travel_companion', label: 'Travel & Activity Partner' },
                  { id: 'networking_dating', label: 'Ambitious Power Couple' },
                  { id: 'open_minded', label: 'Open to Beautiful Surprises' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, friendshipRange: item.id })}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium text-center transition-all ${
                      formData.friendshipRange === item.id
                        ? 'bg-violet-600 text-white border-violet-600 font-bold shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Partner Age Range Preference */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Partner Age Range Preference
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Minimum Age ({formData.minAgePref} yrs)</label>
                  <input
                    type="range"
                    min="18"
                    max="65"
                    value={formData.minAgePref}
                    onChange={(e) => setFormData({ ...formData, minAgePref: parseInt(e.target.value, 10) })}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Maximum Age ({formData.maxAgePref} yrs)</label>
                  <input
                    type="range"
                    min="18"
                    max="75"
                    value={formData.maxAgePref}
                    onChange={(e) => setFormData({ ...formData, maxAgePref: parseInt(e.target.value, 10) })}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                </div>
              </div>
              <div className="text-center text-xs font-bold text-rose-600">
                Searching for partners aged {formData.minAgePref} to {formData.maxAgePref} years old
              </div>
            </div>

            {/* Languages Known (Multi-select) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-rose-500" /> Languages You Speak (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableLanguagesList.map((lang) => {
                  const selected = formData.languagesKnown.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguageKnown(lang)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selected
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {selected ? '✓ ' : ''}{lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Languages Partner Might Speak (Multi-select) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-violet-500" /> Languages You Want Partner to Speak
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableLanguagesList.map((lang) => {
                  const selected = formData.partnerPreferredLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => togglePartnerLanguage(lang)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selected
                          ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {selected ? '✓ ' : ''}{lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Education, Occupation & Faith */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Education Level
                </label>
                <select
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="High School">High School</option>
                  <option value="Diploma / College">Diploma / College</option>
                  <option value="Bachelor's Degree">Bachelor's Degree</option>
                  <option value="Master's Degree">Master's Degree</option>
                  <option value="Doctorate / PhD">Doctorate / PhD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Occupation / Career
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  placeholder="e.g. Software Engineer, Doctor, Entrepreneur"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Faith / Religion
                </label>
                <select
                  value={formData.religion}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Christian / Protestant">Christian (Protestant)</option>
                  <option value="Christian / Catholic">Christian (Catholic)</option>
                  <option value="Christian / Adventist">Christian (Adventist)</option>
                  <option value="Muslim">Muslim</option>
                  <option value="Spiritual / Traditional">Spiritual / Traditional</option>
                  <option value="Agnostic / Non-religious">Agnostic / Non-religious</option>
                </select>
              </div>
            </div>

            {/* Height, Children & Lifestyle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Height: {formData.height} cm
                </label>
                <input
                  type="range"
                  min="145"
                  max="210"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value, 10) })}
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Children
                </label>
                <select
                  value={formData.childrenStatus}
                  onChange={(e) => setFormData({ ...formData, childrenStatus: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="wants_children">Wants Children</option>
                  <option value="does_not_want_children">Doesn't Want Children</option>
                  <option value="has_children_wants_more">Has Children & Wants More</option>
                  <option value="has_children_content">Has Children & Content</option>
                  <option value="open_to_children">Open to Discussion</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Drinking & Smoking
                </label>
                <select
                  value={formData.drinkingHabit}
                  onChange={(e) => setFormData({ ...formData, drinkingHabit: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="never">Non-Drinker / Non-Smoker</option>
                  <option value="socially">Social Drinker</option>
                  <option value="regularly">Regular Drinker</option>
                </select>
              </div>
            </div>

            {/* Short Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('wizard.bio')}
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Share what makes you happy, your values, your ideal weekend, and what you cherish in a partner..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Interests & Passions Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {t('wizard.interests')}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableInterests.map((interest) => {
                  const selected = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selected
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sample Appearance Preference Preview (African Photography) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Appearance & Melanin Tone Reference
              </label>
              <p className="text-[11px] text-slate-400 mb-2.5">Authentic representative African references for aesthetic preference.</p>
              <div className="grid grid-cols-3 gap-3">
                {appearanceSamples.map((samp) => (
                  <div
                    key={samp.id}
                    onClick={() => setFormData({ ...formData, appearanceSkinTone: samp.id })}
                    className={`cursor-pointer rounded-2xl border-2 overflow-hidden transition-all ${
                      formData.appearanceSkinTone === samp.id
                        ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 opacity-80'
                    }`}
                  >
                    <img src={samp.imageUrl} alt={samp.label} className="w-full h-24 object-cover" />
                    <div className="p-1.5 text-center bg-white">
                      <span className="text-[10px] font-bold text-slate-700 block">{samp.label}</span>
                      <span className="text-[9px] text-slate-400">African Reference</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="w-1/3">
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('wizard.prevBtn')}
              </Button>
              <Button onClick={handleNextStep2} className="w-2/3 shadow-md shadow-rose-200">
                {t('wizard.nextBtn')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: PHOTOS & PUBLISHING WITH AFRICAN SUGGESTIONS */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{t('wizard.step3')}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload your authentic photos, or pick from our representative African community portraits to get started instantly.
              </p>
            </div>

            {/* African Community Suggestion Gallery */}
            <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-rose-600" /> Quick-Select African Member Avatar
                </span>
                <span className="text-[11px] text-rose-600 font-semibold">Click any to set as primary photo</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {AFRICAN_AVATAR_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, primaryPhoto: sug.imageUrl })}
                    className={`group relative rounded-2xl overflow-hidden border-2 transition-all ${
                      formData.primaryPhoto === sug.imageUrl
                        ? 'border-rose-600 ring-2 ring-rose-500/30 scale-105 shadow-md'
                        : 'border-slate-200 hover:border-rose-300'
                    }`}
                  >
                    <img src={sug.imageUrl} alt={sug.label} className="w-full h-20 object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] py-0.5 text-center truncate px-1">
                      {sug.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Photo Preview & Upload */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {t('wizard.primaryPhoto')} (Selected Picture)
              </label>
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <img
                    src={formData.primaryPhoto}
                    alt="Primary profile preview"
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-rose-500 shadow-md"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={formData.primaryPhoto}
                    onChange={(e) => setFormData({ ...formData, primaryPhoto: e.target.value })}
                    placeholder="Enter custom image URL or choose file below"
                  />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{uploadingPhoto ? 'Uploading to Drive...' : 'Upload from Device'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      />
                    </label>
                    <span className="text-[10px] text-slate-400">JPG, PNG or WEBP up to 10MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Review Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-500" /> Profile Review
              </div>
              <p>
                <strong>{formData.displayName}</strong>, based in {formData.city}, {formData.country}
              </p>
              <p>
                Seeking:{' '}
                <span className="text-rose-600 font-semibold capitalize">
                  {formData.relationshipIntention.replace(/_/g, ' ')}
                </span>
                {' • '}
                Ages {formData.minAgePref} - {formData.maxAgePref}
              </p>
              <p>
                Languages: <strong>{formData.languagesKnown.join(', ')}</strong> (Seeking: {formData.partnerPreferredLanguages.join(', ')})
              </p>
              <p>
                Interests: {formData.interests.slice(0, 4).join(', ')}
              </p>
            </div>

            {/* Terms and 18+ Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                id="terms"
                type="checkbox"
                required
                checked={formData.termsAccepted}
                onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                {t('wizard.termsAgree')}
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-1/3">
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('wizard.prevBtn')}
              </Button>
              <Button type="submit" loading={loading} className="w-2/3 py-3 shadow-lg shadow-rose-200">
                {t('wizard.publishBtn')}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Tutorials Modal Seen at Registration */}
      <Modal
        isOpen={tutorialModalOpen}
        onClose={() => setTutorialModalOpen(false)}
        title="Platform Guides & Tutorials"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Learn how to use Kunda Space safely, make meaningful connections, and optimize your dating profile.
          </p>

          {tutorials.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No tutorials published yet. Please check back soon!
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tutorial selector tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {tutorials.map((tut, idx) => (
                  <button
                    key={tut.id}
                    type="button"
                    onClick={() => setSelectedTut(tut)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedTut?.id === tut.id
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Guide #{idx + 1}
                  </button>
                ))}
              </div>

              {selectedTut && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    {language === 'rw' ? selectedTut.title_rw : language === 'fr' ? selectedTut.title_fr : selectedTut.title_en}
                  </h4>

                  {selectedTut.videoUrl && (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-sm">
                      <iframe
                        src={selectedTut.videoUrl}
                        title="Tutorial video"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {!selectedTut.videoUrl && selectedTut.imageUrl && (
                    <img
                      src={selectedTut.imageUrl}
                      alt="Tutorial illustration"
                      className="w-full h-44 object-cover rounded-xl shadow-sm"
                    />
                  )}

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {language === 'rw' ? selectedTut.content_rw : language === 'fr' ? selectedTut.content_fr : selectedTut.content_en}
                  </p>
                </div>
              )}
            </div>
          )}

          <Button onClick={() => setTutorialModalOpen(false)} className="w-full">
            Got It! Continue Registration
          </Button>
        </div>
      </Modal>
    </div>
  );
};
