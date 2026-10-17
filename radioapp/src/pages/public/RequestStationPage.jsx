import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import {
  Radio,
  Sparkles,
  HelpCircle,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileText,
  Music,
  Send,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { PostimagesGuideModal } from '../../components/common/PostimagesGuideModal';

export function RequestStationPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Form Fields
  const [radioName, setRadioName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [radioLogoLink, setRadioLogoLink] = useState('');
  const [description, setDescription] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [names, setNames] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phonenumber, setPhonenumber] = useState(user?.phone || '');

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submittedRequestData, setSubmittedRequestData] = useState(null);
  const [showPostimagesGuide, setShowPostimagesGuide] = useState(false);

  // User's previous requests
  const [myRequests, setMyRequests] = useState([]);
  const [loadingMyRequests, setLoadingMyRequests] = useState(false);

  // Sync user profile data if available
  useEffect(() => {
    if (user) {
      if (!names && user.full_name) setNames(user.full_name);
      if (!email && user.email) setEmail(user.email);
      if (!phonenumber && user.phone) setPhonenumber(user.phone);
    }
  }, [user]);

  // Load existing requests for this user
  useEffect(() => {
    if (token) {
      loadMyRequests();
    }
  }, [token]);

  const loadMyRequests = async () => {
    setLoadingMyRequests(true);
    try {
      const data = await api.get('/requests/my');
      setMyRequests(data || []);
    } catch (err) {
      console.warn('Could not load user requests:', err);
    } finally {
      setLoadingMyRequests(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in to submit a station request. Please create an account or log in first.');
      return;
    }

    if (!radioName.trim()) {
      setError('Please provide a Radio Station Name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const applicantName = names.trim() || user?.full_name || '';
      const applicantPhone = phonenumber.trim() || user?.phone || '';
      const applicantEmail = email.trim() || user?.email || '';

      const payload = {
        radio_name: radioName.trim(),
        slogan: slogan.trim(),
        radio_logo_link: radioLogoLink.trim(),
        logo_url: radioLogoLink.trim(),
        description: description.trim(),
        stream_url: streamUrl.trim(),
        names: applicantName,
        full_name: applicantName,
        phonenumber: applicantPhone,
        phone: applicantPhone,
        email: applicantEmail,
      };

      const result = await api.post('/requests/submit', payload);
      setSubmittedSuccess(true);
      setSubmittedRequestData(result.request || payload);
      loadMyRequests();
    } catch (err) {
      console.error('[RequestStationPage] Error submitting request:', err);
      setError(err.message || 'Failed to submit radio request. Please check your data and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setRadioName('');
    setSlogan('');
    setRadioLogoLink('');
    setDescription('');
    setStreamUrl('');
    setSubmittedSuccess(false);
    setSubmittedRequestData(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500">
      
      {/* Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white leading-tight">Radio Station Network</h1>
              <p className="text-[11px] text-slate-400 font-medium">Station Listing Portal</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-xs font-semibold text-slate-400">
                  Signed in as <strong className="text-white">{user.full_name || user.username}</strong>
                </span>
                <Link
                  to="/admin"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-12 text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Broadcaster Onboarding</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Apply to List Your Radio Station
        </h2>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Submit your station credentials, brand logo, and broadcast stream. Upon approval by our administrator team, your station will be published live and your account upgraded to Station Administrator.
        </p>
      </section>

      {/* Main Form & Preview Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        
        {/* If user is not logged in: Banner */}
        {!user && (
          <div className="mb-8 p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Account Required Before Submitting</h4>
                <p className="text-xs text-amber-300/90 mt-0.5">
                  You need a verified broadcaster account so we can automatically assign you as the Station Administrator when your application is approved.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs text-center shadow-md transition-colors"
              >
                Sign Up First (Quick)
              </Link>
              <Link
                to="/admin/login"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs text-center border border-slate-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}

        {submittedSuccess ? (
          /* SUCCESS SCREEN */
          <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Application Submitted Successfully!</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Thank you, <span className="text-white font-semibold">{names || user?.full_name}</span>. We have received your request to list <strong className="text-indigo-400">{radioName || submittedRequestData?.radio_name}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-left space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700">
                <span className="text-slate-400">Application Status:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Pending Review
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Our administration team has received an in-app alert and email notification. Once approved:
              </p>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Your station will be published live on the directory.</li>
                <li>Your account role will be promoted to <strong>Station Admin</strong>.</li>
                <li>You'll get full access to edit themes, stream servers, schedule, and news.</li>
                <li>An approval confirmation email will be dispatched to <strong>{email || user?.email}</strong>.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
              >
                Submit Another Station
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-colors"
              >
                Browse Stations Directory
              </Link>
            </div>
          </div>
        ) : (
          /* APPLICATION FORM & LIVE PREVIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Form (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
              
              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Station Basics Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <Radio className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Station Identity</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Radio Station Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={radioName}
                      onChange={(e) => setRadioName(e.target.value)}
                      placeholder="e.g. Kigali Wave Radio, Afrobeat FM, Jazz Lounge"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Slogan / Tagline / Frequency
                    </label>
                    <input
                      type="text"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      placeholder="e.g. 94.3 FM - The Heartbeat of Kigali"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none"
                    />
                  </div>

                  {/* Logo Link with Postimages helper button */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                        Radio Logo Link (Image URL)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPostimagesGuide(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 underline"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>How to upload on Postimages.org</span>
                      </button>
                    </div>
                    <input
                      type="url"
                      value={radioLogoLink}
                      onChange={(e) => setRadioLogoLink(e.target.value)}
                      placeholder="https://i.postimg.cc/your-logo.png"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Paste a direct image link ending in .png or .jpg (square 500x500 recommended).
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Station Description & Music Genres
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the format of your radio station, music genres, languages, and target community..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Live Audio Stream URL <span className="text-slate-500 text-[10px] font-normal">(Icecast, Shoutcast, or HLS)</span>
                    </label>
                    <input
                      type="url"
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                      placeholder="https://stream.example.com:8000/live.mp3"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none font-mono"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Optional during application. You can also configure multiple stream bitrates once inside the admin hub.
                    </p>
                  </div>
                </div>

                {/* Applicant Contact Section */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <User className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Station Administrator Contact</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Your Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={names}
                        onChange={(e) => setNames(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phonenumber}
                        onChange={(e) => setPhonenumber(e.target.value)}
                        placeholder="+250 788 000 000"
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@station.com"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm text-white focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Approval alerts and station login credentials link to this email address.
                    </p>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading || !user}
                  className="w-full py-4 rounded-2xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Submitting Application...' : 'Submit Radio Station Application'}</span>
                </button>

                {!user && (
                  <p className="text-xs text-amber-400 text-center font-medium">
                    * Please create an account or sign in before submitting.
                  </p>
                )}

              </form>
            </div>

            {/* Right: Live Preview Card & Guide (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Card Preview */}
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Live Directory Card Preview
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                    Directory View
                  </span>
                </div>

                {/* The Preview Card */}
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-4 shadow-inner">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {radioLogoLink ? (
                        <img
                          src={radioLogoLink}
                          alt="Station Logo Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                          }}
                        />
                      ) : (
                        <Radio className="w-8 h-8 text-slate-500" />
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Live 24/7</span>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-white line-clamp-1">
                      {radioName || 'Your Station Name'}
                    </h4>
                    <p className="text-xs font-semibold text-indigo-400 mt-0.5 line-clamp-1">
                      {slogan || 'Your Station Slogan or Frequency'}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {description || 'Your station description, musical identity, and broadcast mission will be featured here for listeners.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">Audio Preview</span>
                    <span className="px-3 py-1.5 rounded-lg bg-indigo-600 font-bold text-white text-[11px]">
                      Listen Live →
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  This preview updates in real-time as you enter your station details.
                </p>
              </div>

              {/* Steps overview */}
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  What Happens Next?
                </h4>
                
                <ol className="space-y-3 text-xs text-slate-400">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                    <span><strong>Instant Alert:</strong> Super Administrators receive an in-app ping and email review notice.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                    <span><strong>Verification:</strong> Station identity and streams are validated for compliance.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">3</span>
                    <span><strong>Auto-Provisioning:</strong> Upon approval, your station website is initialized and you become its administrator.</span>
                  </li>
                </ol>
              </div>

            </div>

          </div>
        )}

        {/* Existing User Requests Section */}
        {user && myRequests.length > 0 && (
          <section className="mt-16 pt-12 border-t border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">Your Submitted Applications</h3>
                <p className="text-xs text-slate-400">Track the status of your radio station applications</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-bold">
                {myRequests.length} {myRequests.length === 1 ? 'application' : 'applications'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';
                const isRejected = req.status === 'rejected';

                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {req.radio_logo_link ? (
                            <img src={req.radio_logo_link} alt={req.radio_name} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                              <Radio className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-sm text-white truncate max-w-[150px]">{req.radio_name}</h4>
                            <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{req.slogan || 'No slogan'}</p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isRejected
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isApproved && <CheckCircle2 className="w-3 h-3" />}
                          {isRejected && <XCircle className="w-3 h-3" />}
                          {isPending && <Clock className="w-3 h-3" />}
                          <span>{req.status}</span>
                        </span>
                      </div>

                      {req.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">{req.description}</p>
                      )}

                      {isRejected && req.admin_notes && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                          <p className="font-bold mb-0.5">Admin Feedback:</p>
                          <p>{req.admin_notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span className="text-[11px]">
                        Submitted {new Date(req.created_at).toLocaleDateString()}
                      </span>

                      {isApproved && (
                        <Link
                          to="/admin"
                          className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          <span>Go to Admin Hub</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* Postimages Guide Modal */}
      <PostimagesGuideModal
        isOpen={showPostimagesGuide}
        onClose={() => setShowPostimagesGuide(false)}
        title="How to Upload Your Radio Logo on Postimages.org"
        subject="radio logo"
        description={
          <>
            To display your radio logo cleanly without file hosting limits, you can host your square logo for free on <strong>Postimages.org</strong>. Follow these simple steps:
          </>
        }
      />

    </div>
  );
}
export default RequestStationPage;
