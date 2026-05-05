import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
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
const Stage5SandboxPage = lazy(() => import('./pages/Stage5SandboxPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProofWallPage = lazy(() => import('./pages/ProofWallPage'));

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
          <Route path="/wins" element={withBoundary(<ProofWallPage />)} />
          <Route path="/email-previews" element={withBoundary(<EmailPreviewsPage />)} />
          <Route path="/admin" element={withBoundary(<AdminPage />)} />
          <Route path="/stage5-sandbox" element={withBoundary(<Stage5SandboxPage />)} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}
