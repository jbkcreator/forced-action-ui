import { Link } from 'react-router-dom';
import { theme } from '../theme/ThemeProvider';
import TermsContent from '../components/shared/TermsContent';

const TERMS_VERSION = '2026.06';
const PRIVACY_VERSION = '2026.06';

export default function TermsPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: '#0a0f1e' }}>
      <nav className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-slate-900" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}>FA</div>
          <Link to="/" className="text-xl font-bold tracking-tight text-white">
            {theme.brand.name.split(' ')[0]} <span className="text-yellow-400">{theme.brand.name.split(' ').slice(1).join(' ')}</span>
          </Link>
        </div>
      </nav>

      <main id="main-content" className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-white">Terms & Conditions</h1>
        <p className="text-xs text-slate-400 mt-1 mb-8">
          Version {TERMS_VERSION} — Last updated June 2026
        </p>

        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <TermsContent termsVersion={TERMS_VERSION} privacyVersion={PRIVACY_VERSION} />
        </div>
      </main>
    </div>
  );
}
