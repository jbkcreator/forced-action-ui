import { Routes, Route } from 'react-router-dom';
import ThemeProvider from './theme/ThemeProvider';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import SuccessPage from './pages/SuccessPage';
import EmailPreviewsPage from './pages/EmailPreviewsPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminPage from './pages/AdminPage';
import SkipLink from './components/ui/SkipLink';

export default function App() {
  return (
    <ThemeProvider>
      <SkipLink />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/dashboard/:feedUuid" element={<DashboardPage />} />
        <Route path="/email-previews" element={<EmailPreviewsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
}
