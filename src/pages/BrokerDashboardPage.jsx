/**
 * Broker portal dashboard shell.
 * Layout mirrors AdminPage: sticky top header (brand + Sign out) + left sidebar + <Outlet>.
 */

import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BrokerProvider, useBrokerContext } from '../components/brokerDashboard/BrokerContext.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';

const NAV_ITEMS = [
  {
    to: 'lanes',
    label: 'My Lanes',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: 'commissions',
    label: 'My Commissions',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v-1m0 9v1" />
      </svg>
    ),
  },
];

function BrokerSidebar({ open = true }) {
  return (
    <aside
      className="shrink-0 flex flex-col h-full overflow-hidden"
      style={{
        width: open ? '208px' : '0',
        transition: 'width 0.2s ease',
        borderRight: open ? '1px solid rgba(255,255,255,0.07)' : 'none',
      }}
    >
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap"
            style={({ isActive }) => ({
              color: isActive ? '#facc15' : '#94a3b8',
              borderLeft: isActive ? '2px solid #facc15' : '2px solid transparent',
              background: isActive ? 'rgba(250,204,21,0.06)' : 'transparent',
              paddingLeft: '14px',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.style.borderLeft.includes('#facc15')) {
                e.currentTarget.style.color = '#cbd5e1';
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.style.borderLeft.includes('#facc15')) {
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            <span className="shrink-0">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function BrokerShell() {
  const { broker, logout, isLoading, error } = useBrokerContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)' }}>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)' }}
    >
      {/* Sticky header — matches AdminPage exactly */}
      <header
        className="sticky top-0 z-50 w-full shrink-0"
        style={{
          background: 'rgba(10,15,30,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-slate-900"
                style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
              >
                FA
              </div>
              <div>
                <p className="font-bold text-white leading-none text-sm">Forced Action</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Broker Portal{broker?.name ? ` · ${broker.name}` : ''}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Body: sidebar + section content */}
      <div className="flex flex-1 min-h-0">
        <BrokerSidebar open={sidebarOpen} />
        <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function BrokerDashboardPage() {
  return (
    <BrokerProvider>
      <BrokerShell />
    </BrokerProvider>
  );
}
