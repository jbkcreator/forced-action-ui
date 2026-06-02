import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ThemeProvider from './theme/ThemeProvider';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import SuccessPage from './pages/SuccessPage';
import NotFoundPage from './pages/NotFoundPage';
import SkipLink from './components/ui/SkipLink';
import ErrorBoundary from './components/ui/ErrorBoundary';
import RouteSkeleton from './components/ui/RouteSkeleton';

// White-label auth pages — eager (see note at WL routes below)
import WLLoginPage from './pages/WLLoginPage';
import WLSignupPage from './pages/WLSignupPage';
import WLForgotPasswordPage from './pages/WLForgotPasswordPage';
import WLResetPasswordPage from './pages/WLResetPasswordPage';
import WLVerifyEmailPage from './pages/WLVerifyEmailPage';

// Subscriber feed auth pages — eager (fa061; same reasoning as WL auth)
import SubscriberLoginPage from './pages/SubscriberLoginPage';
import SubscriberForgotPasswordPage from './pages/SubscriberForgotPasswordPage';
import SubscriberResetPasswordPage from './pages/SubscriberResetPasswordPage';

const EmailPreviewsPage = lazy(() => import('./pages/EmailPreviewsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DevPage = lazy(() => import('./pages/DevPage'));
const Stage5SandboxPage = lazy(() => import('./pages/Stage5SandboxPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProofWallPage = lazy(() => import('./pages/ProofWallPage'));
const PartnerUpgradePage = lazy(() => import('./pages/PartnerUpgradePage'));
const CountyLanding = lazy(() => import('./pages/CountyLanding'));

// Admin section pages
const DataSection      = lazy(() => import('./components/admin/sections/DataSection'));
const RevenueSection   = lazy(() => import('./components/admin/sections/RevenueSection'));
const MessagingSection = lazy(() => import('./components/admin/sections/MessagingSection'));
const OpsSection       = lazy(() => import('./components/admin/sections/OpsSection'));
const CoraSection        = lazy(() => import('./components/admin/sections/CoraSection'));
const SubscribersSection = lazy(() => import('./components/admin/sections/SubscribersSection'));
const IcpChannelSection    = lazy(() => import('./components/admin/sections/IcpChannelSection'));
const SupplierIntelSection = lazy(() => import('./components/admin/sections/SupplierIntelSection'));
const EmailCampaignsSection = lazy(() => import('./components/admin/sections/EmailCampaignsSection'));
const SubscriberDetailPage = lazy(() => import('./pages/SubscriberDetailPage'));
const SupplierDashboard    = lazy(() => import('./pages/SupplierDashboard'));

// White-label tier pages (Stage 12 / fa056)
// Auth pages are eager (not lazy): they're tiny and navigate between each other
// constantly (login ↔ signup ↔ forgot), so lazy-loading each one adds a
// per-click chunk fetch that makes navigation feel broken. The heavier
// dashboard stays lazy since it's behind auth.
const WLDashboardPage     = lazy(() => import('./pages/WLDashboardPage'));
// WL dashboard sections
const WLLeadsSection    = lazy(() => import('./components/whiteLabelDashboard/WLLeadsSection'));
const WLReportsSection  = lazy(() => import('./components/whiteLabelDashboard/WLReportsSection'));
const WLApiKeysSection  = lazy(() => import('./components/whiteLabelDashboard/WLApiKeysSection'));
const WLTeamSection     = lazy(() => import('./components/whiteLabelDashboard/WLTeamSection'));
const WLBillingSection  = lazy(() => import('./components/whiteLabelDashboard/WLBillingSection'));
const WLSettingsSection = lazy(() => import('./components/whiteLabelDashboard/WLSettingsSection'));

function withBoundary(element) {
  return <ErrorBoundary>{element}</ErrorBoundary>;
}

export default function App() {
  return (
    <ThemeProvider>
      <SkipLink />
      <Suspense fallback={<RouteSkeleton />}>
        <Routes>
          <Route path="/" element={withBoundary(<LandingPage />)} />
          <Route path="/success" element={withBoundary(<SuccessPage />)} />
          {/* Subscriber feed auth (fa061) — public */}
          <Route path="/login"                         element={withBoundary(<SubscriberLoginPage />)} />
          <Route path="/forgot-password"               element={withBoundary(<SubscriberForgotPasswordPage />)} />
          <Route path="/reset-password/:token"         element={withBoundary(<SubscriberResetPasswordPage />)} />
          {/* UUID-mode login: user clicks /dashboard/:uuid link, needs to enter password */}
          <Route path="/dashboard/:feedUuid/login"     element={withBoundary(<SubscriberLoginPage />)} />

          <Route path="/dashboard/:feedUuid" element={withBoundary(<DashboardPage />)} />
          <Route path="/dashboard/:feedUuid/settings" element={withBoundary(<SettingsPage />)} />
          <Route path="/dashboard/:feedUuid/partner" element={withBoundary(<PartnerUpgradePage />)} />
          <Route path="/wins" element={withBoundary(<ProofWallPage />)} />
          <Route path="/email-previews" element={withBoundary(<EmailPreviewsPage />)} />
          <Route path="/admin" element={withBoundary(<AdminPage />)}>
            <Route index element={<Navigate to="data" replace />} />
            <Route path="data"      element={withBoundary(<DataSection />)} />
            <Route path="revenue"   element={withBoundary(<RevenueSection />)} />
            <Route path="messaging" element={withBoundary(<MessagingSection />)} />
            <Route path="ops"       element={withBoundary(<OpsSection />)} />
            <Route path="cora"      element={withBoundary(<CoraSection />)} />
            <Route path="subscribers"       element={withBoundary(<SubscribersSection />)} />
            <Route path="subscribers/:id"   element={withBoundary(<SubscriberDetailPage />)} />
            <Route path="icp"               element={withBoundary(<IcpChannelSection />)} />
            <Route path="supplier-intel"    element={withBoundary(<SupplierIntelSection />)} />
            <Route path="email-campaigns"   element={withBoundary(<EmailCampaignsSection />)} />
          </Route>
          {/* Supplier Intelligence dashboard (access_token auth) */}
          <Route path="/supplier/:accessToken" element={withBoundary(<SupplierDashboard />)} />
          <Route path="/dev" element={withBoundary(<DevPage />)} />
          <Route path="/stage5-sandbox" element={withBoundary(<Stage5SandboxPage />)} />
          {/* /landing?county_id=hillsborough or /landing/hillsborough */}
          <Route path="/landing" element={withBoundary(<LandingPage />)} />
          <Route path="/landing/:countyId" element={withBoundary(<CountyLanding />)} />

          {/* White-label auth (public) */}
          <Route path="/wl/login"            element={withBoundary(<WLLoginPage />)} />
          <Route path="/wl/signup"           element={withBoundary(<WLSignupPage />)} />
          <Route path="/wl/forgot-password"  element={withBoundary(<WLForgotPasswordPage />)} />
          <Route path="/wl/reset-password/:token" element={withBoundary(<WLResetPasswordPage />)} />
          <Route path="/wl/verify-email/:token"   element={withBoundary(<WLVerifyEmailPage />)} />

          {/* White-label dashboard (auth-gated inside WLDashboardPage) */}
          <Route path="/wl/dashboard" element={withBoundary(<WLDashboardPage />)}>
            <Route index element={<Navigate to="leads" replace />} />
            <Route path="leads"    element={withBoundary(<WLLeadsSection />)} />
            <Route path="reports"  element={withBoundary(<WLReportsSection />)} />
            <Route path="api-keys" element={withBoundary(<WLApiKeysSection />)} />
            <Route path="team"     element={withBoundary(<WLTeamSection />)} />
            <Route path="billing"  element={withBoundary(<WLBillingSection />)} />
            <Route path="settings" element={withBoundary(<WLSettingsSection />)} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}
