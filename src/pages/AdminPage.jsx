import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoginCard from '../components/admin/LoginCard';
import UploadCard from '../components/admin/UploadCard';
import SynthflowDashboard from '../components/admin/SynthflowDashboard';
import RefundsDashboard from '../components/admin/RefundsDashboard';
import ContactCoverageDashboard from '../components/admin/ContactCoverageDashboard';
import DlqDashboard from '../components/admin/DlqDashboard';
import SandboxDispatchPanel from '../components/admin/SandboxDispatchPanel';
import SandboxOutboxPanel from '../components/admin/SandboxOutboxPanel';
import SkuMarginDashboard from '../components/admin/SkuMarginDashboard';
import GateMetricsDashboard from '../components/admin/GateMetricsDashboard';
import { fetchSynthflowConfig } from '../api/admin';

const TOKEN_KEY = 'admin_token';

const NAV = [
  { id: 'upload',    label: 'Data Upload',     Component: UploadCard, hideHeader: true },
  { id: 'synthflow', label: 'Synthflow',       Component: SynthflowDashboard },
  { id: 'refunds',   label: 'Refunds',         Component: RefundsDashboard },
  { id: 'coverage',  label: 'Contact Coverage', Component: ContactCoverageDashboard },
  { id: 'sku',       label: 'SKU Margin',      Component: SkuMarginDashboard },
  { id: 'dlq',       label: 'DLQ',             Component: DlqDashboard },
  { id: 'dispatch',  label: 'Dispatch',        Component: SandboxDispatchPanel },
  { id: 'outbox',    label: 'Outbox',          Component: SandboxOutboxPanel },
  { id: 'gates',     label: 'Gate Monitoring', Component: GateMetricsDashboard },
];

function AuthenticatedShell({ token, onLogout }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = NAV.find(n => n.id === tabParam)?.id || 'upload';
  const [activeSection, setActiveSection] = useState(initialTab);

  // Keep URL in sync so deep links (?tab=dlq) work and admin can bookmark.
  useEffect(() => {
    if (searchParams.get('tab') !== activeSection) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', activeSection);
      setSearchParams(next, { replace: true });
    }
  }, [activeSection, searchParams, setSearchParams]);

  const active = NAV.find(n => n.id === activeSection) || NAV[0];
  const ActiveComponent = active.Component;

  return (
    <div className="w-full max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm text-slate-900" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}>FA</div>
          <div>
            <p className="font-bold text-white leading-none">Forced Action</p>
            <p className="text-xs text-slate-500 mt-0.5">Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <nav aria-label="Admin sections" className="flex gap-1 p-1 rounded-lg flex-wrap" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {NAV.map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() => setActiveSection(n.id)}
                aria-current={activeSection === n.id ? 'page' : undefined}
                className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                style={{
                  background: activeSection === n.id ? 'rgba(250,204,21,0.12)' : 'transparent',
                  color: activeSection === n.id ? '#facc15' : '#94a3b8',
                }}
              >
                {n.label}
              </button>
            ))}
          </nav>
          <button onClick={onLogout} className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors">
            Sign out
          </button>
        </div>
      </div>

      <ActiveComponent token={token} onLogout={onLogout} hideHeader={active.hideHeader} />
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  // Validate stored token on mount — clears it if expired or invalid.
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return undefined;
    const controller = new AbortController();
    fetchSynthflowConfig(stored, { signal: controller.signal })
      .catch(err => {
        if (err.name === 'AbortError') return;
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      });
    return () => controller.abort();
  }, []);

  function handleLogin(t) { setToken(t); }
  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)' }}
    >
      {token ? (
        <AuthenticatedShell token={token} onLogout={handleLogout} />
      ) : (
        <LoginCard onLogin={handleLogin} />
      )}
    </div>
  );
}
