import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { AdProvider, useAds } from './context/AdContext';
import { SettingsProvider } from './context/SettingsContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import { CoffeeProvider } from './context/CoffeeContext';
import { PWAProvider } from './context/PWAContext';

import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { GlobalRadioPlayer } from './components/player/GlobalRadioPlayer';
import { FloatingPipTV } from './components/player/FloatingPipTV';
import { AdPopupModal } from './components/ads/AdPopupModal';
import { BuyCoffeeModal } from './components/coffee/BuyCoffeeModal';
import { FloatingCoffeeButton } from './components/coffee/FloatingCoffeeButton';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';



// Pages
import { Home } from './pages/Home';
import { RadioPage } from './pages/Radio';
import { StationDetailPage } from './pages/StationDetail';
import { TVPage } from './pages/TV';
import { VideoDetailPage } from './pages/VideoDetail';
import { SearchPage } from './pages/Search';
import { AboutPage } from './pages/About';
import { ContactPage } from './pages/Contact';
import { PrivacyPage } from './pages/Privacy';
import { AdminLoginPage } from './pages/AdminLogin';

// Admin Pages
import { DashboardPage } from './pages/admin/Dashboard';
import { StationsAdminPage } from './pages/admin/StationsAdmin';
import { VideosAdminPage } from './pages/admin/VideosAdmin';
import { AnalyticsAdminPage } from './pages/admin/AnalyticsAdmin';
import { UsersAdminPage } from './pages/admin/UsersAdmin';
import { SettingsAdminPage } from './pages/admin/SettingsAdmin';
import { ProfileAdminPage } from './pages/admin/ProfileAdmin';
import { CommentsModerationAdminPage } from './pages/admin/CommentsModerationAdmin';
import { FeedbackAdminPage } from './pages/admin/FeedbackAdmin';
import { AdsAdminPage } from './pages/admin/AdsAdmin';
import { DonationsAdminPage } from './pages/admin/DonationsAdmin';
import { PublicAdAnalyticsPage } from './pages/PublicAdAnalytics';
import { RadioAdModal } from './components/ads/RadioAdModal';
import { NotFoundPage } from './pages/NotFound';
import { initSecurityGuard } from './utils/security';


// Protected Route Helpers
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-rba-blue border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

const ProtectedSuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSuperAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-rba-blue border-t-transparent" />
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

// Layout with persistent header & footer
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
};

// Global Ad Popup Component attached to AdContext
const GlobalAdPopup: React.FC = () => {
  const { isPopupOpen, closePopup } = useAds();
  return <AdPopupModal isOpen={isPopupOpen} onClose={closePopup} />;
};

// Global Radio Pre-Roll Ad Modal (10s forced ad before radio play)
const GlobalRadioAdModal: React.FC = () => {
  const { isRadioAdOpen, pendingRadioStation, completeRadioAd } = useAds();
  return (
    <RadioAdModal
      isOpen={isRadioAdOpen}
      station={pendingRadioStation}
      onComplete={completeRadioAd}
    />
  );
};

export const App: React.FC = () => {
  React.useEffect(() => {
    initSecurityGuard();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <PlayerProvider>
          <SettingsProvider>
            <AdProvider>
              <AnalyticsProvider>
                <CoffeeProvider>
                  <PWAProvider>
                    <div className="relative min-h-screen flex flex-col pb-14 md:pb-0">
                      <Routes>
                        {/* Public Website Routes */}
                        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
                        <Route path="/radio" element={<PublicLayout><RadioPage /></PublicLayout>} />
                        <Route path="/radio/:slug" element={<PublicLayout><StationDetailPage /></PublicLayout>} />
                        <Route path="/tv" element={<PublicLayout><TVPage /></PublicLayout>} />
                        <Route path="/tv/:id" element={<PublicLayout><VideoDetailPage /></PublicLayout>} />
                        <Route path="/search" element={<PublicLayout><SearchPage /></PublicLayout>} />
                        <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
                        <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
                        <Route path="/privacy" element={<PublicLayout><PrivacyPage /></PublicLayout>} />

                        {/* Admin Auth Route */}
                        <Route path="/admin/login" element={<AdminLoginPage />} />

                        {/* Protected Admin Routes */}
                        <Route
                          path="/admin"
                          element={
                            <ProtectedAdminRoute>
                              <DashboardPage />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/stations"
                          element={
                            <ProtectedAdminRoute>
                              <StationsAdminPage />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/videos"
                          element={
                            <ProtectedAdminRoute>
                              <VideosAdminPage />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/moderation"
                          element={
                            <ProtectedAdminRoute>
                              <CommentsModerationAdminPage />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/feedback"
                          element={
                            <ProtectedAdminRoute>
                              <FeedbackAdminPage />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/donations"
                          element={
                            <ProtectedAdminRoute>
                              <DonationsAdminPage />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/ads"
                          element={
                            <ProtectedAdminRoute>
                              <AdsAdminPage />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route path="/ad-analytics/:token" element={<PublicAdAnalyticsPage />} />
                        <Route
                          path="/admin/analytics"
                          element={
                            <ProtectedAdminRoute>
                              <AnalyticsAdminPage />
                            </ProtectedAdminRoute>
                          }
                        />

                        <Route
                          path="/admin/users"
                          element={
                            <ProtectedSuperAdminRoute>
                              <UsersAdminPage />
                            </ProtectedSuperAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/settings"
                          element={
                            <ProtectedAdminRoute>
                              <SettingsAdminPage />
                            </ProtectedAdminRoute>
                          }
                        />
                        <Route
                          path="/admin/profile"
                          element={
                            <ProtectedAdminRoute>
                              <ProfileAdminPage />
                            </ProtectedAdminRoute>
                          }
                        />

                        {/* 404 Route */}
                        <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
                      </Routes>

                      {/* Mobile Bottom Navigation Bar */}
                      <MobileBottomNav />

                      {/* Picture-in-Picture TV Player for Seamless Background Viewing */}
                      <FloatingPipTV />

                      {/* Persistent Global Radio Player */}
                      <GlobalRadioPlayer />

                      {/* Global Interstitial Ad Popup (Every 15 min with 10s countdown) */}
                      <GlobalAdPopup />

                      {/* 10-second Radio Pre-roll Ad Modal (4-min throttle) */}
                      <GlobalRadioAdModal />

                      {/* Buy Me a Coffee Modal & Floating Trigger */}
                      <BuyCoffeeModal />
                      <FloatingCoffeeButton />

                      {/* PWA Install Banner (14-day dismissal window) */}
                      <PWAInstallBanner />
                    </div>
                  </PWAProvider>
                </CoffeeProvider>
              </AnalyticsProvider>
            </AdProvider>
          </SettingsProvider>
        </PlayerProvider>
      </AuthProvider>
    </Router>
  );


};

export default App;
