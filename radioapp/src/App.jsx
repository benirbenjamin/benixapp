import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StationProvider } from './context/StationContext';
import { DomainProvider, useDomain } from './context/DomainContext';

// Public Pages
import { StationDirectoryPage } from './pages/public/StationDirectoryPage';
import { StationHomePage } from './pages/public/StationHomePage';
import { StationSchedulePage } from './pages/public/StationSchedulePage';
import { StationNewsPage } from './pages/public/StationNewsPage';
import { StationNewsDetailPage } from './pages/public/StationNewsDetailPage';
import { StationVideosPage } from './pages/public/StationVideosPage';
import { StationContactPage } from './pages/public/StationContactPage';
import { UserSignupPage } from './pages/public/UserSignupPage';
import { RequestStationPage } from './pages/public/RequestStationPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AppearancePage } from './pages/admin/AppearancePage';
import { StreamsPage } from './pages/admin/StreamsPage';
import { ProgramsPage } from './pages/admin/ProgramsPage';
import { NewsManagerPage } from './pages/admin/NewsManagerPage';
import { NewsEditPage } from './pages/admin/NewsEditPage';
import { VideosManagerPage } from './pages/admin/VideosManagerPage';
import { SectionsManagerPage } from './pages/admin/SectionsManagerPage';
import { StationSettingsPage } from './pages/admin/StationSettingsPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { ProfilePage } from './pages/admin/ProfilePage';

// Super Admin Pages
import { StationsManagerPage } from './pages/admin/superadmin/StationsManagerPage';
import { AdminsManagerPage } from './pages/admin/superadmin/AdminsManagerPage';
import { PlatformStatsPage } from './pages/admin/superadmin/PlatformStatsPage';
import { AuditLogsPage } from './pages/admin/superadmin/AuditLogsPage';
import { AdminRequestsPage } from './pages/admin/superadmin/AdminRequestsPage';

// Protected Route Component
function ProtectedRoute({ children, superAdminOnly = false }) {
  const { user, loading, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans text-sm">
        Verifying authorization...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (superAdminOnly && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function AppRoutes() {
  const { isCustomDomain, domainStationBundle, loadingDomain } = useDomain();

  if (loadingDomain) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">Resolving broadcast network...</p>
      </div>
    );
  }

  // If visitor is accessing via a custom domain (e.g. kigaliwave.com or ?domain=kigaliwave.com)
  if (isCustomDomain && domainStationBundle) {
    return (
      <StationProvider initialBundle={domainStationBundle} isCustomDomain={true}>
        <Routes>
          {/* Custom domain serves station directly at root / */}
          <Route path="/" element={<StationHomePage />} />
          <Route path="/schedule" element={<StationSchedulePage />} />
          <Route path="/news" element={<StationNewsPage />} />
          <Route path="/news/:articleSlug" element={<StationNewsDetailPage />} />
          <Route path="/videos" element={<StationVideosPage />} />
          <Route path="/contact" element={<StationContactPage />} />

          {/* Admin access on custom domain */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="appearance" element={<AppearancePage />} />
            <Route path="streams" element={<StreamsPage />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="news" element={<NewsManagerPage />} />
            <Route path="news/new" element={<NewsEditPage />} />
            <Route path="news/edit/:articleId" element={<NewsEditPage />} />
            <Route path="videos" element={<VideosManagerPage />} />
            <Route path="sections" element={<SectionsManagerPage />} />
            <Route path="settings" element={<StationSettingsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback to custom domain root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StationProvider>
    );
  }

  // Standard platform directory routes
  return (
    <Routes>
        
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<StationDirectoryPage />} />
        <Route path="/signup" element={<UserSignupPage />} />
        <Route path="/request-station" element={<RequestStationPage />} />

        {/* Public Station Dynamic Routes */}
        <Route
          path="/station/:slug"
          element={
            <StationProvider>
              <StationHomePage />
            </StationProvider>
          }
        />
        <Route
          path="/station/:slug/schedule"
          element={
            <StationProvider>
              <StationSchedulePage />
            </StationProvider>
          }
        />
        <Route
          path="/station/:slug/news"
          element={
            <StationProvider>
              <StationNewsPage />
            </StationProvider>
          }
        />
        <Route
          path="/station/:slug/news/:articleSlug"
          element={
            <StationProvider>
              <StationNewsDetailPage />
            </StationProvider>
          }
        />
        <Route
          path="/station/:slug/videos"
          element={
            <StationProvider>
              <StationVideosPage />
            </StationProvider>
          }
        />
        <Route
          path="/station/:slug/contact"
          element={
            <StationProvider>
              <StationContactPage />
            </StationProvider>
          }
        />

        {/* AUTH & ADMIN PORTAL */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="appearance" element={<AppearancePage />} />
          <Route path="streams" element={<StreamsPage />} />
          <Route path="programs" element={<ProgramsPage />} />
          <Route path="news" element={<NewsManagerPage />} />
          <Route path="news/new" element={<NewsEditPage />} />
          <Route path="news/edit/:articleId" element={<NewsEditPage />} />
          <Route path="videos" element={<VideosManagerPage />} />
          <Route path="sections" element={<SectionsManagerPage />} />
          <Route path="settings" element={<StationSettingsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* Super Admin specific routes */}
          <Route
            path="superadmin/requests"
            element={
              <ProtectedRoute superAdminOnly>
                <AdminRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="superadmin/stations"
            element={
              <ProtectedRoute superAdminOnly>
                <StationsManagerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="superadmin/admins"
            element={
              <ProtectedRoute superAdminOnly>
                <AdminsManagerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="superadmin/stats"
            element={
              <ProtectedRoute superAdminOnly>
                <PlatformStatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="superadmin/audit-logs"
            element={
              <ProtectedRoute superAdminOnly>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
  );
}

export function App() {
  return (
    <DomainProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </DomainProvider>
  );
}

export default App;
