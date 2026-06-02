/**
 * White-label dashboard shell.
 * Checks auth on mount → redirects to /wl/login if not authenticated.
 * Sidebar nav + <Outlet> for section pages.
 */

import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { WLProvider, useWLContext } from '../components/whiteLabelDashboard/WLContext.jsx';

const NAV_ITEMS = [
  { to: 'leads',    label: 'Leads',       icon: '🏠' },
  { to: 'reports',  label: 'Reports',     icon: '📄' },
  { to: 'api-keys', label: 'API Keys',    icon: '🔑' },
  { to: 'team',     label: 'Team',        icon: '👥' },
  { to: 'billing',  label: 'Billing',     icon: '💳' },
  { to: 'settings', label: 'Settings',    icon: '⚙️' },
];

function WLSidebar() {
  const { client, branding, logout, isLoading } = useWLContext();

  return (
    <aside className="w-56 flex-shrink-0 bg-fa-bg-card border-r border-fa-border-default flex flex-col h-screen sticky top-0">
      {/* Logo / brand */}
      <div className="p-5 border-b border-fa-border-default">
        {branding?.logo_url
          ? <img src={branding.logo_url} alt={branding.company_name} className="h-8 object-contain" />
          : <div className="text-fa-primary font-bold text-lg">{isLoading ? '…' : (branding?.company_name || 'Dashboard')}</div>
        }
        <p className="text-xs text-fa-text-muted mt-1 capitalize">{client?.plan_tier || ''} plan</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-fa-primary/10 text-fa-primary font-medium'
                  : 'text-fa-text-secondary hover:bg-fa-bg-base hover:text-fa-text-primary'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-fa-border-default">
        <button onClick={logout} className="w-full text-left text-xs text-fa-text-muted hover:text-fa-text-secondary px-3 py-2 rounded hover:bg-fa-bg-base transition-colors">
          Sign out
        </button>
      </div>
    </aside>
  );
}

/**
 * Persistent banner shown on every dashboard section while the account has no
 * paid plan. Non-blocking (leads/reports still browsable) but impossible to
 * miss — this is the entry point into the Stripe checkout flow.
 */
function WLNoPlanBanner() {
  const { client } = useWLContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide once a real (paid) plan exists, or while the client is still loading.
  if (!client || client.plan_tier) return null;
  // Don't show it on the Billing page itself (the plans are right there).
  if (location.pathname.endsWith('/billing')) return null;

  const intended = client.intended_plan_tier;
  return (
    <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-fa-primary/40 bg-fa-primary/10 px-4 py-3">
      <div className="text-sm">
        <span className="font-semibold text-fa-text-primary">No active plan yet.</span>{' '}
        <span className="text-fa-text-secondary">
          {intended
            ? <>Start your 14-day <span className="capitalize">{intended}</span> trial to unlock everything.</>
            : 'Choose a plan to start your 14-day trial.'}
        </span>
      </div>
      <button
        onClick={() => navigate('/wl/dashboard/billing')}
        className="flex-shrink-0 bg-fa-primary text-fa-bg-base font-bold px-4 py-1.5 rounded-lg text-sm hover:opacity-90 whitespace-nowrap"
      >
        Start trial →
      </button>
    </div>
  );
}

function WLDashboardShell() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('wl_access_token');
    if (!token) { navigate('/wl/login', { replace: true }); return; }
    // Check expiry
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('wl_access_token');
        navigate('/wl/login', { replace: true });
      }
    } catch { navigate('/wl/login', { replace: true }); }
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-fa-bg-base">
      <WLSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <WLNoPlanBanner />
        <Outlet />
      </main>
    </div>
  );
}

export default function WLDashboardPage() {
  return (
    <WLProvider>
      <WLDashboardShell />
    </WLProvider>
  );
}
