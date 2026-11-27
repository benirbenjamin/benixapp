import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './client/context/ThemeContext';
import { AuthProvider, useAuth } from './client/context/AuthContext';
import { CurrencyProvider } from './client/context/CurrencyContext';
import { LanguageProvider } from './client/context/LanguageContext';
import { SidebarProvider } from './client/context/SidebarContext';
import { Navbar } from './client/components/layout/Navbar';
import { YouTubeSidebar } from './client/components/layout/YouTubeSidebar';
import { Footer } from './client/components/layout/Footer';
import { BottomNav } from './client/components/layout/BottomNav';
import { PlayerProvider, usePlayer } from './client/context/PlayerContext';
import { UploadProvider } from './client/context/UploadContext';
import { PwaProvider } from './client/context/PwaContext';
import { ActionNotificationProvider } from './client/context/ActionNotificationContext';
import { GlobalRadioPlayer } from './client/components/player/GlobalRadioPlayer';
import { FloatingPipTV } from './client/components/player/FloatingPipTV';
import { RadioAdModal } from './client/components/ads/RadioAdModal';
import { CoffeeProvider } from './client/context/CoffeeContext';
import { FloatingCoffeeButton } from './client/components/coffee/FloatingCoffeeButton';
import { BuyCoffeeModal } from './client/components/coffee/BuyCoffeeModal';
import { PwaInstallBanner } from './client/components/pwa/PwaInstallBanner';
import { getAuthToken } from './client/services/api';
import { RouteAnalyticsTracker } from './client/analytics/tracker';
import { ScrollToTop } from './client/components/common/ScrollToTop';

// Dynamic code-splitting helper for named and default exports
function lazyNamed(
  factory: () => Promise<any>,
  name: string
): React.LazyExoticComponent<React.ComponentType<any>> {
  return React.lazy(() =>
    factory().then((m) => ({
      default: m[name] || m.default
    }))
  ) as React.LazyExoticComponent<React.ComponentType<any>>;
}

// Fallback loader during dynamic chunk fetches
const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-[#0B0E14]">
    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
    <span className="text-xs font-semibold text-slate-400 mt-3 animate-pulse">Loading BenixSpace...</span>
  </div>
);

// Lazy Loaded Core Pages
const HomePage = lazyNamed(() => import('./client/pages/HomePage'), 'HomePage');
const ProjectsPage = lazyNamed(() => import('./client/pages/ProjectsPage'), 'ProjectsPage');
const ProjectDetailPage = lazyNamed(() => import('./client/pages/ProjectDetailPage'), 'ProjectDetailPage');
const ServicesPage = lazyNamed(() => import('./client/pages/ServicesPage'), 'ServicesPage');
const AboutPage = lazyNamed(() => import('./client/pages/AboutPage'), 'AboutPage');
const BlogPage = lazyNamed(() => import('./client/pages/BlogPage'), 'BlogPage');
const BlogDetailPage = lazyNamed(() => import('./client/pages/BlogDetailPage'), 'BlogDetailPage');
const ContactPage = lazyNamed(() => import('./client/pages/ContactPage'), 'ContactPage');
const PrivacyPage = lazyNamed(() => import('./client/pages/PrivacyPage'), 'PrivacyPage');
const CookiesPage = lazyNamed(() => import('./client/pages/CookiesPage'), 'CookiesPage');
const TermsPage = lazyNamed(() => import('./client/pages/TermsPage'), 'TermsPage');
const NotFoundPage = lazyNamed(() => import('./client/pages/NotFoundPage'), 'NotFoundPage');

// Lazy Loaded Super-App Dashboard & Modules
const DashboardPage = lazyNamed(() => import('./client/pages/DashboardPage'), 'DashboardPage');
const TvPage = lazyNamed(() => import('./client/pages/modules/TvPage'), 'TvPage');
const VideosPage = lazyNamed(() => import('./client/pages/modules/VideosPage'), 'VideosPage');
const PostsPage = lazyNamed(() => import('./client/pages/PostsPage'), 'PostsPage');
const RadioPage = lazyNamed(() => import('./client/pages/modules/RadioPage'), 'RadioPage');
const GamesPage = lazyNamed(() => import('./client/pages/modules/GamesPage'), 'GamesPage');
const CloudLandingPage = lazyNamed(() => import('./client/pages/modules/CloudLandingPage'), 'CloudLandingPage');
const CloudLoginPage = lazyNamed(() => import('./client/pages/cloud/CloudAuthPages'), 'CloudLoginPage');
const CloudRegisterPage = lazyNamed(() => import('./client/pages/cloud/CloudAuthPages'), 'CloudRegisterPage');
const CloudDashboardPage = lazyNamed(() => import('./client/pages/cloud/CloudDashboardPage'), 'CloudDashboardPage');
const CloudAdminPage = lazyNamed(() => import('./client/pages/cloud/CloudAdminPage'), 'CloudAdminPage');
const AppLiveViewPage = lazyNamed(() => import('./client/pages/cloud/AppLiveViewPage'), 'AppLiveViewPage');
const MessagesPage = lazyNamed(() => import('./client/pages/MessagesPage'), 'MessagesPage');
const CreatorStudioPage = lazyNamed(() => import('./client/pages/CreatorStudioPage'), 'CreatorStudioPage');
const AdvertisePage = lazyNamed(() => import('./client/pages/AdvertisePage'), 'AdvertisePage');
const BenixPayCheckoutPage = lazyNamed(() => import('./client/pages/pay/BenixPayCheckoutPage'), 'BenixPayCheckoutPage');
const BenixPayDocsPage = lazyNamed(() => import('./client/pages/docs/BenixPayDocsPage'), 'BenixPayDocsPage');

// Lazy Loaded Admin Pages
const AdminLoginPage = lazyNamed(() => import('./client/pages/admin/AdminLoginPage'), 'AdminLoginPage');
const AdminDashboardPage = lazyNamed(() => import('./client/pages/admin/AdminDashboardPage'), 'AdminDashboardPage');
const AdminProjectsPage = lazyNamed(() => import('./client/pages/admin/AdminProjectsPage'), 'AdminProjectsPage');
const AdminBlogPage = lazyNamed(() => import('./client/pages/admin/AdminBlogPage'), 'AdminBlogPage');
const AdminBlogEditPage = lazyNamed(() => import('./client/pages/admin/AdminBlogEditPage'), 'AdminBlogEditPage');
const AdminAnalyticsPage = lazyNamed(() => import('./client/pages/admin/AdminAnalyticsPage'), 'AdminAnalyticsPage');
const AdminSeoPage = lazyNamed(() => import('./client/pages/admin/AdminSeoPage'), 'AdminSeoPage');
const AdminSettingsPage = lazyNamed(() => import('./client/pages/admin/AdminSettingsPage'), 'AdminSettingsPage');
const AdminProfilePage = lazyNamed(() => import('./client/pages/admin/AdminProfilePage'), 'AdminProfilePage');
const AdminUsersPage = lazyNamed(() => import('./client/pages/admin/AdminUsersPage'), 'AdminUsersPage');

const ProtectedCustomerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const token = getAuthToken();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token && !user) {
    return <Navigate to="/cloud/login?redirect=%2Fcloud%2Fdashboard" replace />;
  }

  return <>{children}</>;
};

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const token = getAuthToken();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const role = user?.role;
  const adminToken = localStorage.getItem('benix_admin_token');

  // Non-admin customers redirected to customer dashboard
  if (user && role !== 'admin' && role !== 'superadmin') {
    return <Navigate to="/cloud/dashboard" replace />;
  }

  if (!adminToken && role !== 'admin' && role !== 'superadmin') {
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
      <PwaInstallBanner />
      <FloatingCoffeeButton />
      <BuyCoffeeModal />
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
            <CoffeeProvider>
              <CurrencyProvider>
                <PwaProvider>
                  <ActionNotificationProvider>
                  <PlayerProvider>
                    <UploadProvider>
                      <SidebarProvider>
                        <Router>
                          <ScrollToTop />
                          <RouteAnalyticsTracker />
                          <Suspense fallback={<PageLoader />}>
                            <Routes>
                              {/* Benix Cloud Standalone Console & Auth Routes */}
                              <Route path="/cloud/login" element={<CloudLoginPage />} />
                              <Route path="/cloud/register" element={<CloudRegisterPage />} />
                              <Route
                                path="/cloud/admin"
                                element={
                                  <ProtectedAdminRoute>
                                    <CloudAdminPage />
                                  </ProtectedAdminRoute>
                                }
                              />

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

                              {/* Standalone Hosted Gateway Checkout (Focused Fullscreen Flow) */}
                              <Route path="/pay/:txnId" element={<BenixPayCheckoutPage />} />

                              {/* Standalone Independent App Hosting Viewers (Zero Shell / No Navbar / Fullscreen) */}
                              <Route path="/l/:appName/*" element={<AppLiveViewPage />} />
                              <Route path="/l/:appName" element={<AppLiveViewPage />} />
                              <Route path="/apps/:appName/*" element={<AppLiveViewPage />} />
                              <Route path="/apps/:appName" element={<AppLiveViewPage />} />
                              <Route path="/live/:deploymentId/*" element={<AppLiveViewPage />} />
                              <Route path="/live/:deploymentId" element={<AppLiveViewPage />} />

                              {/* Public Super-App Routes (Wrapped with Unified Navbar, Footer, and BottomNav) */}
                              <Route
                                path="*"
                                element={
                                  <div className="flex flex-col min-h-screen pb-16 md:pb-0 bg-[#0B0E14]">
                                    <Navbar />
                                    <div className="flex-1 flex overflow-x-hidden">
                                      <YouTubeSidebar />
                                      <div className="flex-1 min-w-0 flex flex-col">
                                        <main className="flex-1">
                                          <Suspense fallback={<PageLoader />}>
                                            <Routes>
                                              <Route path="/" element={<HomePage />} />
                                              
                                              {/* Unified Dashboard */}
                                              <Route path="/dashboard" element={<DashboardPage />} />
                                              <Route path="/smm" element={<Navigate to="/dashboard#smm" replace />} />
                                              <Route path="/boost" element={<Navigate to="/dashboard#smm" replace />} />
                                              <Route path="/messages" element={<MessagesPage />} />
                                              <Route path="/chat" element={<Navigate to="/messages?user=user-superadmin-benir&name=benirabok&email=benirabok@gmail.com" replace />} />

                                              {/* Integrated Module Pages */}
                                              <Route path="/posts" element={<PostsPage />} />
                                              <Route path="/ad/:id" element={<PostsPage />} />
                                              <Route path="/shorts" element={<VideosPage initialTab="shorts" />} />
                                              <Route path="/videos" element={<VideosPage initialTab="videos" />} />
                                              <Route path="/videos/:id" element={<VideosPage initialTab="videos" />} />
                                              <Route path="/studio" element={<CreatorStudioPage />} />
                                              <Route path="/advertise" element={<AdvertisePage />} />
                                              <Route path="/ads/create" element={<AdvertisePage />} />
                                              <Route path="/tv" element={<TvPage />} />
                                              <Route path="/radio" element={<RadioPage />} />
                                              <Route path="/games" element={<GamesPage />} />
                                              <Route path="/dice" element={<GamesPage />} />
                                              <Route path="/cloud" element={<CloudLandingPage />} />
                                              <Route
                                                path="/cloud/dashboard"
                                                element={
                                                  <ProtectedCustomerRoute>
                                                    <CloudDashboardPage />
                                                  </ProtectedCustomerRoute>
                                                }
                                              />

                                              {/* Benix Pay Developer API Documentation */}
                                              <Route path="/docs/benixpay" element={<BenixPayDocsPage />} />
                                              <Route path="/pay/docs" element={<Navigate to="/docs/benixpay" replace />} />

                                              {/* Core Platform Pages */}
                                              <Route path="/projects" element={<ProjectsPage />} />
                                              <Route path="/projects/:slug" element={<ProjectDetailPage />} />
                                              <Route path="/services" element={<ServicesPage />} />
                                              <Route path="/about" element={<AboutPage />} />
                                              <Route path="/blog" element={<BlogPage />} />
                                              <Route path="/blog/:slug" element={<BlogDetailPage />} />
                                              <Route path="/contact" element={<ContactPage />} />
                                              <Route path="/terms" element={<TermsPage />} />
                                              <Route path="/privacy" element={<PrivacyPage />} />
                                              <Route path="/cookies" element={<CookiesPage />} />
                                              <Route path="*" element={<NotFoundPage />} />
                                            </Routes>
                                          </Suspense>
                                        </main>
                                        <Footer />
                                      </div>
                                    </div>
                                    <BottomNav />
                                    <GlobalPlayerLayer />
                                  </div>
                                }
                              />
                            </Routes>
                          </Suspense>
                        </Router>
                      </SidebarProvider>
                    </UploadProvider>
                  </PlayerProvider>
                </ActionNotificationProvider>
              </PwaProvider>
            </CurrencyProvider>
          </CoffeeProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
