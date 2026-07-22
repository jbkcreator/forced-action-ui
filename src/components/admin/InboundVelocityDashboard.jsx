import { useEffect, useState } from 'react';
import { fetchInboundVelocity } from '../../api/admin';

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3">
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-2xl font-mono text-slate-100">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-600">{hint}</div>}
    </div>
  );
}

function fmtSeconds(v) {
  if (v === null || v === undefined) return '—';
  return `${Number(v).toFixed(0)}s`;
}

function fmtPct(v) {
  if (v === null || v === undefined) return '—';
  return `${(Number(v) * 100).toFixed(1)}%`;
}

export default function InboundVelocityDashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError('');
    fetchInboundVelocity(token, { signal: ctrl.signal })
      .then(setStats)
      .catch((e) => { if (e.name !== 'AbortError') setError(e.detail || e.message || 'Failed'); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [token]);

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Inbound Velocity
        </h3>
        <p className="text-xs text-slate-600">
          Hot inbound calls (all counties) and time-to-callback. Report-only.
        </p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {loading && <p className="text-slate-500 text-sm animate-pulse">Loading…</p>}

      {stats && stats.total > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Hot inbounds" value={stats.total} />
            <StatCard label="Called" value={stats.called} hint={`${fmtPct(stats.hot_callback_rate)} rate`} />
            <StatCard label="p50 → callback" value={fmtSeconds(stats.p50_seconds)} />
            <StatCard label="p95 → callback" value={fmtSeconds(stats.p95_seconds)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Consent blocked" value={stats.consent_blocked} />
            <StatCard label="DNC blocked" value={stats.dnc_blocked} />
            <StatCard label="Failed" value={stats.failed} />
          </div>
        </>
      )}

      {stats && stats.total === 0 && (
        <p className="text-slate-600 text-sm italic">No hot inbound calls recorded yet.</p>
      )}
    </div>
  );
}
