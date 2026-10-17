import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PwaProvider } from './contexts/PwaContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { BottomNav } from './components/layout/BottomNav';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Public Pages
import { Home } from './pages/public/Home';
import { HowItWorks } from './pages/public/HowItWorks';
import { MembershipPlans } from './pages/public/MembershipPlans';
import { SafetyCenter } from './pages/public/SafetyCenter';
import { Faq } from './pages/public/Faq';
import { MakeMoney } from './pages/public/MakeMoney';
import { Terms, Privacy, CommunityGuidelines, Contact } from './pages/public/LegalPages';

// Auth Pages
import { Login } from './pages/auth/Login';
import { RegisterWizard } from './pages/auth/RegisterWizard';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';

// Dashboard Pages
import { Discover } from './pages/dashboard/Discover';
import { Feed } from './pages/dashboard/Feed';
import { Matches } from './pages/dashboard/Matches';
import { Messages } from './pages/dashboard/Messages';
import { Wallet } from './pages/dashboard/Wallet';
import { Referrals } from './pages/dashboard/Referrals';
import { Subscription } from './pages/dashboard/Subscription';
import { Profile } from './pages/dashboard/Profile';
import { Settings } from './pages/dashboard/Settings';
import { PwaInstallPrompt } from './components/pwa/PwaInstallPrompt';

// Admin Page
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Loading session...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  return <>{children}</>;
};

// Admin Route Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Loading admin session...</div>;
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard/discover" replace />;
  }
  return <>{children}</>;
};

// Route wrapper that checks for language path prefix (e.g. /rw/..., /fr/...)
const LanguageSyncer: React.FC = () => {
  const location = useLocation();
  const { setLanguage } = useLanguage();

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/rw')) {
      setLanguage('rw');
    } else if (path.startsWith('/fr')) {
      setLanguage('fr');
    } else if (path.startsWith('/en')) {
      setLanguage('en');
    }
  }, [location.pathname, setLanguage]);

  return null;
};

export const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-rose-100 selection:text-rose-700">
      <LanguageSyncer />
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary>
          <Routes>
          {/* Public Website Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<HowItWorks />} />
          <Route path="/membership" element={<MembershipPlans />} />
          <Route path="/make-money" element={<MakeMoney />} />
          <Route path="/safety" element={<SafetyCenter />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/community-guidelines" element={<CommunityGuidelines />} />
          <Route path="/contact" element={<Contact />} />

          {/* Multilingual SEO Alias Routes */}
          <Route path="/:lang/" element={<Home />} />
          <Route path="/:lang/how-it-works" element={<HowItWorks />} />
          <Route path="/:lang/about" element={<HowItWorks />} />
          <Route path="/:lang/uko-bikora" element={<HowItWorks />} />
          <Route path="/:lang/comment-ca-marche" element={<HowItWorks />} />
          <Route path="/:lang/membership" element={<MembershipPlans />} />
          <Route path="/:lang/ibiciro" element={<MembershipPlans />} />
          <Route path="/:lang/abonnements" element={<MembershipPlans />} />
          <Route path="/:lang/make-money" element={<MakeMoney />} />
          <Route path="/:lang/gushaka-amafaranga" element={<MakeMoney />} />
          <Route path="/:lang/gagner-de-largent" element={<MakeMoney />} />
          <Route path="/:lang/safety" element={<SafetyCenter />} />
          <Route path="/:lang/faq" element={<Faq />} />

          {/* Authentication */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<RegisterWizard />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          {/* Member Protected Dashboard */}
          <Route
            path="/dashboard/discover"
            element={
              <ProtectedRoute>
                <Discover />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/feed"
            element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/matches"
            element={
              <ProtectedRoute>
                <Matches />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/referrals"
            element={
              <ProtectedRoute>
                <Referrals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/subscription"
            element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Administrative Portal */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
      <BottomNav />
      <PwaInstallPrompt />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <WalletProvider>
              <NotificationProvider>
                <PwaProvider>
                  <AppContent />
                </PwaProvider>
              </NotificationProvider>
            </WalletProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
