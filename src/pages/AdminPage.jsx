import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoginCard from '../components/admin/LoginCard';
import UploadCard from '../components/admin/UploadCard';
import CountyManagementDashboard from '../components/admin/CountyManagementDashboard';
import ColumnMappingsDashboard from '../components/admin/ColumnMappingsDashboard';
import SynthflowDashboard from '../components/admin/SynthflowDashboard';
import RefundsDashboard from '../components/admin/RefundsDashboard';
import ContactCoverageDashboard from '../components/admin/ContactCoverageDashboard';
import DlqDashboard from '../components/admin/DlqDashboard';
import SandboxDispatchPanel from '../components/admin/SandboxDispatchPanel';
import SandboxOutboxPanel from '../components/admin/SandboxOutboxPanel';
import SkuMarginDashboard from '../components/admin/SkuMarginDashboard';
import GateMetricsDashboard from '../components/admin/GateMetricsDashboard';
import StormPacksTable from '../components/admin/StormPacksTable';
import { fetchCounties } from '../api/admin';

const TOKEN_KEY = 'admin_token';

const NAV = [
  { id: 'counties',  label: 'Counties',        Component: CountyManagementDashboard, centered: true },
  { id: 'mappings',  label: 'Col Mappings',    Component: ColumnMappingsDashboard },
  { id: 'upload',    label: 'Data Upload',     Component: UploadCard, hideHeader: true, centered: true },
  { id: 'synthflow', label: 'Synthflow',       Component: SynthflowDashboard },
  { id: 'refunds',   label: 'Refunds',         Component: RefundsDashboard },
  { id: 'coverage',  label: 'Contact Coverage', Component: ContactCoverageDashboard },
  { id: 'sku',       label: 'SKU Margin',      Component: SkuMarginDashboard },
  { id: 'dlq',       label: 'DLQ',             Component: DlqDashboard },
  { id: 'dispatch',  label: 'Dispatch',        Component: SandboxDispatchPanel },
  { id: 'outbox',    label: 'Outbox',          Component: SandboxOutboxPanel },
  { id: 'gates',     label: 'Gate Monitoring', Component: GateMetricsDashboard },
  { id: 'storm',     label: 'Storm Packs',     Component: StormPacksTable },
];

function AuthenticatedShell({ token, onLogout }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = NAV.find(n => n.id === tabParam)?.id || 'counties';
  const [activeSection, setActiveSection] = useState(initialTab);

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
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)' }}>
      {/* ── Sticky top navbar ── */}
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: 'rgba(10,15,30,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm text-slate-900"
              style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
            >
              FA
            </div>
            <div>
              <p className="font-bold text-white leading-none text-sm">Forced Action</p>
              <p className="text-xs text-slate-500 mt-0.5">Admin</p>
            </div>
          </div>

          {/* Tab nav */}
          <nav
            aria-label="Admin sections"
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {NAV.map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() => setActiveSection(n.id)}
                aria-current={activeSection === n.id ? 'page' : undefined}
                className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: activeSection === n.id ? 'rgba(250,204,21,0.15)' : 'transparent',
                  color: activeSection === n.id ? '#facc15' : '#94a3b8',
                  boxShadow: activeSection === n.id ? 'inset 0 0 0 1px rgba(250,204,21,0.25)' : 'none',
                }}
              >
                {n.label}
              </button>
            ))}
          </nav>

          {/* Sign out */}
          <button
            onClick={onLogout}
            className="shrink-0 text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className={`w-full px-6 py-8 ${active.centered ? 'flex flex-col items-center' : 'max-w-screen-2xl mx-auto'}`}>
          <ActiveComponent token={token} onLogout={onLogout} hideHeader={active.hideHeader} />
        </div>
      </main>
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return undefined;
    const controller = new AbortController();
    fetchCounties(stored, false, { signal: controller.signal })
      .catch(err => {
        if (err.name === 'AbortError') return;
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      });
    return () => controller.abort();
  }, []);

  function handleLogin(t) {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  }
  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  if (token) return <AuthenticatedShell token={token} onLogout={handleLogout} />;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)' }}
    >
      <LoginCard onLogin={handleLogin} />
    </div>
  );
}
