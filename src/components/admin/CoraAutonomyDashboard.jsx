import { useCallback, useEffect, useState } from 'react';
import { fetchCoraAutonomy } from '../../api/admin';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };

function pctColor(pct, invert = false) {
  if (pct == null) return 'text-slate-500';
  if (!invert) return pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-yellow-300' : 'text-red-400';
  return pct > 20 ? 'text-red-400' : pct > 10 ? 'text-yellow-300' : 'text-emerald-400';
}

function fmt(val, suffix = '') {
  if (val == null || val === undefined) return '—';
  return `${val}${suffix}`;
}

function fmtPct(val) {
  if (val == null) return '—';
  return `${Number(val).toFixed(1)}%`;
}

function fmtLatency(sec, note) {
  if (sec == null) return { display: 'N/A', title: note || 'No lifecycle data yet' };
  return { display: `${(sec / 3600).toFixed(1)}h`, title: null };
}

function MetricCard({ label, children, sublabel }) {
  return (
    <div className="rounded-xl p-4 flex flex-col items-center gap-1 text-center" style={card}>
      <div>{children}</div>
      <span className="text-xs text-slate-500 mt-1">{label}</span>
      {sublabel && <span className="text-xs text-slate-600">{sublabel}</span>}
    </div>
  );
}

export default function CoraAutonomyDashboard({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback((signal) => {
    setLoading(true);
    setError('');
    return fetchCoraAutonomy(token, 8, { signal })
      .then(setData)
      .catch(e => { if (e.name !== 'AbortError') setError(e.message || e.detail || 'Failed to load'); })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  if (loading && !data) {
    return <p className="text-slate-500 text-sm animate-pulse py-6 text-center">Loading autonomy scorecard…</p>;
  }
  if (error) {
    return <div role="alert" className="text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">{error}</div>;
  }

  const latest = data?.latest;
  const history = data?.history || [];
  const m = latest?.metrics || {};

  if (!latest) {
    return (
      <div className="rounded-2xl p-8 text-center" style={card}>
        <p className="text-slate-400 text-sm">No autonomy data yet.</p>
        <p className="text-slate-600 text-xs mt-1">Scorecard runs every Monday at 08:45 UTC via <code>cora_autonomy_report</code>.</p>
      </div>
    );
  }

  const latency = fmtLatency(m.approval_latency_seconds, m.approval_latency_note);
  const netNew = m.net_new_playbooks ?? 0;
  const netNewColor = netNew > 0 ? 'text-emerald-400' : netNew < 0 ? 'text-red-400' : 'text-slate-500';

  return (
    <div className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <MetricCard label="Autonomous">
          <span className={`text-2xl font-bold ${pctColor(m.autonomous_pct)}`}>{fmtPct(m.autonomous_pct)}</span>
        </MetricCard>
        <MetricCard label="Overridden">
          <span className={`text-2xl font-bold ${pctColor(m.overridden_pct, true)}`}>{fmtPct(m.overridden_pct)}</span>
        </MetricCard>
        <MetricCard label="Adoptions">
          <span className="text-2xl font-bold text-white">{fmt(m.recommended_adoptions)}</span>
        </MetricCard>
        <MetricCard label="Approval→Auto Latency" sublabel={latency.title || undefined}>
          <span className={`text-2xl font-bold ${latency.display === 'N/A' ? 'text-slate-500' : 'text-white'}`}>
            {latency.display}
          </span>
        </MetricCard>
        <MetricCard label="Net New Playbooks">
          <span className={`text-2xl font-bold ${netNewColor}`}>
            {netNew > 0 ? `+${netNew}` : netNew}
          </span>
        </MetricCard>
      </div>

      {/* Summary text */}
      {latest.summary_text && (
        <p className="text-slate-400 text-xs italic px-1">{latest.summary_text}</p>
      )}

      {/* History table */}
      <div>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Weekly History</p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Week</th>
                <th className="px-4 py-3">Autonomous %</th>
                <th className="px-4 py-3">Overridden %</th>
                <th className="px-4 py-3">Adoptions</th>
                <th className="px-4 py-3">Net New</th>
                <th className="px-4 py-3">Latency</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-slate-500 text-center">No history.</td></tr>
              )}
              {history.map((row, i) => {
                const rm = row.metrics || {};
                const lat = fmtLatency(rm.approval_latency_seconds, rm.approval_latency_note);
                const nn = rm.net_new_playbooks ?? 0;
                return (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/2 text-slate-300">
                    <td className="px-4 py-3 text-xs text-slate-400">{row.card_date || '—'}</td>
                    <td className={`px-4 py-3 font-mono ${pctColor(rm.autonomous_pct)}`}>{fmtPct(rm.autonomous_pct)}</td>
                    <td className={`px-4 py-3 font-mono ${pctColor(rm.overridden_pct, true)}`}>{fmtPct(rm.overridden_pct)}</td>
                    <td className="px-4 py-3">{fmt(rm.recommended_adoptions)}</td>
                    <td className={`px-4 py-3 font-mono ${nn > 0 ? 'text-emerald-400' : nn < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {nn > 0 ? `+${nn}` : nn}
                    </td>
                    <td className="px-4 py-3 text-xs" title={lat.title || undefined}>{lat.display}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
