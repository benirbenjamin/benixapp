import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './client/context/ThemeContext';
import { AuthProvider } from './client/context/AuthContext';
import { LanguageProvider } from './client/context/LanguageContext';
import { Navbar } from './client/components/layout/Navbar';
import { Footer } from './client/components/layout/Footer';
import { BottomNav } from './client/components/layout/BottomNav';
import { PlayerProvider, usePlayer } from './client/context/PlayerContext';
import { PwaProvider } from './client/context/PwaContext';
import { GlobalRadioPlayer } from './client/components/player/GlobalRadioPlayer';
import { FloatingPipTV } from './client/components/player/FloatingPipTV';
import { RadioAdModal } from './client/components/ads/RadioAdModal';

// Public Core Pages
import { HomePage } from './client/pages/HomePage';
import { ProjectsPage } from './client/pages/ProjectsPage';
import { ProjectDetailPage } from './client/pages/ProjectDetailPage';
import { ServicesPage } from './client/pages/ServicesPage';
import { AboutPage } from './client/pages/AboutPage';
import { BlogPage } from './client/pages/BlogPage';
import { BlogDetailPage } from './client/pages/BlogDetailPage';
import { ContactPage } from './client/pages/ContactPage';
import { PrivacyPage } from './client/pages/PrivacyPage';
import { CookiesPage } from './client/pages/CookiesPage';
import { NotFoundPage } from './client/pages/NotFoundPage';

// Unified Super-App Dashboard
import { DashboardPage } from './client/pages/DashboardPage';

// Integrated Super-App Module Pages
import { TvPage } from './client/pages/modules/TvPage';
import { RadioPage } from './client/pages/modules/RadioPage';
import { GamesPage } from './client/pages/modules/GamesPage';
import { MarketplacePage } from './client/pages/modules/MarketplacePage';
import { VoxifyPage } from './client/pages/modules/VoxifyPage';
import { KundaPage } from './client/pages/modules/KundaPage';
import { EasyCalcPage } from './client/pages/modules/EasyCalcPage';
import { MessagesPage } from './client/pages/MessagesPage';

// Admin System Pages
import { AdminLoginPage } from './client/pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './client/pages/admin/AdminDashboardPage';
import { AdminProjectsPage } from './client/pages/admin/AdminProjectsPage';
import { AdminBlogPage } from './client/pages/admin/AdminBlogPage';
import { AdminBlogEditPage } from './client/pages/admin/AdminBlogEditPage';
import { AdminAnalyticsPage } from './client/pages/admin/AdminAnalyticsPage';
import { AdminSeoPage } from './client/pages/admin/AdminSeoPage';
import { AdminSettingsPage } from './client/pages/admin/AdminSettingsPage';
import { AdminProfilePage } from './client/pages/admin/AdminProfilePage';
import { AdminUsersPage } from './client/pages/admin/AdminUsersPage';
import { getAuthToken } from './client/services/api';

import { RouteAnalyticsTracker } from './client/analytics/tracker';

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

const GlobalPlayerLayer: React.FC = () => {
  const { showRadioAd, pendingRadioStation, closeRadioAdAndPlay, cancelRadioAd } = usePlayer();
  return (
    <>
      <GlobalRadioPlayer />
      <FloatingPipTV />
      <RadioAdModal
        isOpen={showRadioAd}
        station={pendingRadioStation}
        onComplete={closeRadioAdAndPlay}
        onCancel={cancelRadioAd}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <PwaProvider>
              <PlayerProvider>
              <Router>
              <RouteAnalyticsTracker />
              <Routes>
                
                {/* Admin Routes (No default Navbar/Footer) */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedAdminRoute>
                      <AdminDashboardPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/projects"
                  element={
                    <ProtectedAdminRoute>
                      <AdminProjectsPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/blog"
                  element={
                    <ProtectedAdminRoute>
                      <AdminBlogPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/blog/new"
                  element={
                    <ProtectedAdminRoute>
                      <AdminBlogEditPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/blog/edit/:id"
                  element={
                    <ProtectedAdminRoute>
                      <AdminBlogEditPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedAdminRoute>
                      <AdminUsersPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/profile"
                  element={
                    <ProtectedAdminRoute>
                      <AdminProfilePage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedAdminRoute>
                      <AdminAnalyticsPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/seo"
                  element={
                    <ProtectedAdminRoute>
                      <AdminSeoPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedAdminRoute>
                      <AdminSettingsPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/admin/settings/company"
                  element={
                    <ProtectedAdminRoute>
                      <AdminSettingsPage />
                    </ProtectedAdminRoute>
                  }
                />

                {/* Public Super-App Routes (Wrapped with Unified Navbar, Footer, and BottomNav) */}
                <Route
                  path="*"
                  element={
                    <div className="flex flex-col min-h-screen pb-16 md:pb-0">
                      <Navbar />
                      <main className="flex-1">
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          
                          {/* Unified Dashboard */}
                          <Route path="/dashboard" element={<DashboardPage />} />
                          <Route path="/messages" element={<MessagesPage />} />

                          {/* Integrated Module Pages */}
                          <Route path="/tv" element={<TvPage />} />
                          <Route path="/radio" element={<RadioPage />} />
                          <Route path="/games" element={<GamesPage />} />
                          <Route path="/dice" element={<GamesPage />} />
                          <Route path="/marketplace" element={<MarketplacePage />} />
                          <Route path="/shop" element={<MarketplacePage />} />
                          <Route path="/music" element={<VoxifyPage />} />
                          <Route path="/voxify" element={<VoxifyPage />} />
                          <Route path="/dating" element={<KundaPage />} />
                          <Route path="/kunda" element={<KundaPage />} />
                          <Route path="/calc" element={<EasyCalcPage />} />
                          <Route path="/calculators" element={<EasyCalcPage />} />

                          {/* Core Platform Pages */}
                          <Route path="/projects" element={<ProjectsPage />} />
                          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
                          <Route path="/services" element={<ServicesPage />} />
                          <Route path="/about" element={<AboutPage />} />
                          <Route path="/blog" element={<BlogPage />} />
                          <Route path="/blog/:slug" element={<BlogDetailPage />} />
                          <Route path="/contact" element={<ContactPage />} />
                          <Route path="/privacy" element={<PrivacyPage />} />
                          <Route path="/cookies" element={<CookiesPage />} />
                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                      </main>
                      <Footer />
                      <BottomNav />
                      <GlobalPlayerLayer />
                    </div>
                  }
                />

              </Routes>
            </Router>
          </PlayerProvider>
        </PwaProvider>
      </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </HelmetProvider>
);
};

export default App;
