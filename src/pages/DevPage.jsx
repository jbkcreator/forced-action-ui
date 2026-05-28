import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoginCard from '../components/admin/LoginCard';
import SynthflowDashboard from '../components/admin/SynthflowDashboard';
import RefundsDashboard from '../components/admin/RefundsDashboard';
import ContactCoverageDashboard from '../components/admin/ContactCoverageDashboard';
import DlqDashboard from '../components/admin/DlqDashboard';
import SkuMarginDashboard from '../components/admin/SkuMarginDashboard';

const TOKEN_KEY = 'admin_token';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const NAV = [
  { id: 'synthflow', label: 'Synthflow',        Component: SynthflowDashboard },
  { id: 'refunds',   label: 'Refunds',          Component: RefundsDashboard },
  { id: 'coverage',  label: 'Contact Coverage', Component: ContactCoverageDashboard },
  { id: 'sku',       label: 'SKU Margin',       Component: SkuMarginDashboard },
  { id: 'dlq',       label: 'DLQ',              Component: DlqDashboard },
];

async function checkDevAccess(token) {
  const res = await fetch(`${API_BASE}/api/admin/dev/ping`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

function LockedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)' }}>
      <div className="rounded-2xl p-10 text-center max-w-sm"
        style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div className="text-3xl mb-4">🔒</div>
        <p className="text-white font-semibold text-base">Dev tools disabled</p>
        <p className="text-slate-500 text-sm mt-2">
          Set <code className="text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded text-xs">DEV_TOOLS_ENABLED=true</code> in
          your <code className="text-slate-400 text-xs">.env</code> and restart the API server.
        </p>
      </div>
    </div>
  );
}

function DevShell({ token, onLogout }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = NAV.find(n => n.id === tabParam)?.id || 'synthflow';
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
    <div className="w-full max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm text-slate-900"
            style={{ background: 'linear-gradient(135deg, #818cf8, #6366f1)' }}>
            DEV
          </div>
          <div>
            <p className="font-bold text-white leading-none">Forced Action</p>
            <p className="text-xs text-indigo-400 mt-0.5">Dev Tools</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <nav aria-label="Dev sections" className="flex gap-1 p-1 rounded-lg flex-wrap"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {NAV.map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() => setActiveSection(n.id)}
                aria-current={activeSection === n.id ? 'page' : undefined}
                className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                style={{
                  background: activeSection === n.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: activeSection === n.id ? '#818cf8' : '#94a3b8',
                }}
              >
                {n.label}
              </button>
            ))}
          </nav>
          <button onClick={onLogout}
            className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors">
            Sign out
          </button>
        </div>
      </div>

      <ActiveComponent token={token} onLogout={onLogout} />
    </div>
  );
}

export default function DevPage() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [devAllowed, setDevAllowed] = useState(null); // null=checking, true=ok, false=blocked

  useEffect(() => {
    if (!token) { setDevAllowed(null); return; }
    checkDevAccess(token).then(ok => {
      if (!ok) {
        // Try to distinguish 401 (bad token) from 403 (env disabled)
        fetch(`${API_BASE}/api/admin/dev/ping`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => {
          if (res.status === 401 || res.status === 403 && res.status !== 403) {
            localStorage.removeItem(TOKEN_KEY);
            setToken(null);
            setDevAllowed(null);
          } else {
            setDevAllowed(false);
          }
        });
      } else {
        setDevAllowed(true);
      }
    });
  }, [token]);

  function handleLogin(t) { setToken(t); }
  function handleLogout() { localStorage.removeItem(TOKEN_KEY); setToken(null); setDevAllowed(null); }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)' }}>
        <LoginCard onLogin={handleLogin} />
      </div>
    );
  }

  if (devAllowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)' }}>
        <p className="text-slate-500 text-sm animate-pulse">Checking access…</p>
      </div>
    );
  }

  if (devAllowed === false) return <LockedScreen />;

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)' }}>
      <DevShell token={token} onLogout={handleLogout} />
    </div>
  );
}
