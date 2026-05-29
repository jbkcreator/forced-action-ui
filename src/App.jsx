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
const CoraSection      = lazy(() => import('./components/admin/sections/CoraSection'));
const SubscribersSection = lazy(() => import('./components/admin/sections/SubscribersSection'));
const SubscriberDetailPage = lazy(() => import('./pages/SubscriberDetailPage'));

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
          </Route>
          <Route path="/dev" element={withBoundary(<DevPage />)} />
          <Route path="/stage5-sandbox" element={withBoundary(<Stage5SandboxPage />)} />
          <Route path="/landing/:countyId" element={withBoundary(<CountyLanding />)} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}
