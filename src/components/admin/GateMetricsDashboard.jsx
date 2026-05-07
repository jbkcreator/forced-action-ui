import { useEffect, useState } from 'react';
import { fetchDecisionAudit, fetchGateMetrics, fetchKillSwitchStatus } from '../../api/admin';

const COLOR_STYLE = {
  green:   { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
  yellow:  { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  red:     { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', border: 'rgba(239,68,68,0.3)' },
  unknown: { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
};

function ColorBadge({ color }) {
  const s = COLOR_STYLE[color] || COLOR_STYLE.unknown;
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {color || 'unknown'}
    </span>
  );
}

function PassRateCell({ pct }) {
  if (pct === null || pct === undefined) return <span className="text-slate-500">—</span>;
  const color = pct >= 90 ? 'text-emerald-400' : pct >= 70 ? 'text-yellow-300' : 'text-red-300';
  return <span className={`font-mono ${color}`}>{pct.toFixed(1)}%</span>;
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function AuditLookup({ token }) {
  const [id, setId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function lookup(e) {
    e.preventDefault();
    if (!id.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    fetchDecisionAudit(token, id.trim())
      .then(setResult)
      .catch((err) => setError(err.detail || err.message || 'Not found'))
      .finally(() => setLoading(false));
  }

  return (
    <div>
      <form onSubmit={lookup} className="flex gap-2 mb-3">
        <input
          value={id}
          onChange={e => setId(e.target.value)}
          placeholder="Decision ID (UUID)"
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-1.5 rounded text-sm font-medium bg-yellow-500 text-slate-900 hover:bg-yellow-400 disabled:opacity-50"
        >
          {loading ? '…' : 'Look up'}
        </button>
      </form>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {result && (
        <pre className="text-xs bg-slate-900 border border-slate-700 rounded p-3 overflow-x-auto text-slate-300 max-h-64">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function GateMetricsDashboard({ token }) {
  const [days, setDays] = useState(1);
  const [metrics, setMetrics] = useState(null);
  const [ksStatus, setKsStatus] = useState(null);
  const [loadingM, setLoadingM] = useState(false);
  const [loadingK, setLoadingK] = useState(false);
  const [errorM, setErrorM] = useState('');
  const [errorK, setErrorK] = useState('');

  useEffect(() => {
    const ctrl = new AbortController();
    setLoadingM(true);
    setErrorM('');
    fetchGateMetrics(token, { days }, { signal: ctrl.signal })
      .then(setMetrics)
      .catch((e) => { if (e.name !== 'AbortError') setErrorM(e.detail || e.message || 'Failed'); })
      .finally(() => setLoadingM(false));
    return () => ctrl.abort();
  }, [token, days]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoadingK(true);
    setErrorK('');
    fetchKillSwitchStatus(token, { signal: ctrl.signal })
      .then(setKsStatus)
      .catch((e) => { if (e.name !== 'AbortError') setErrorK(e.detail || e.message || 'Failed'); })
      .finally(() => setLoadingK(false));
    return () => ctrl.abort();
  }, [token]);

  return (
    <div className="w-full max-w-5xl space-y-2">
      {/* Kill-switch status */}
      <Section title="Kill-Switch Status">
        {errorK && <p className="text-red-400 text-sm">{errorK}</p>}
        {loadingK && <p className="text-slate-500 text-sm animate-pulse">Loading…</p>}
        {ksStatus && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                  <th className="pb-2 pr-4 font-medium">Feature</th>
                  <th className="pb-2 pr-4 font-medium">Color</th>
                  <th className="pb-2 pr-4 font-medium">Observed</th>
                  <th className="pb-2 pr-4 font-medium">Yellow ≥</th>
                  <th className="pb-2 font-medium">Red &lt;</th>
                </tr>
              </thead>
              <tbody>
                {ksStatus.features.map((f) => (
                  <tr key={f.feature} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-2 pr-4 text-slate-300 font-mono text-xs">{f.feature}</td>
                    <td className="py-2 pr-4"><ColorBadge color={f.color} /></td>
                    <td className="py-2 pr-4 font-mono text-slate-300">
                      {f.observed_value !== null && f.observed_value !== undefined
                        ? `${f.observed_value}%`
                        : <span className="text-slate-600 italic">no data</span>}
                    </td>
                    <td className="py-2 pr-4 text-slate-500 font-mono text-xs">
                      {Array.isArray(f.threshold_yellow)
                        ? `${f.threshold_yellow[0]}–${f.threshold_yellow[1]}`
                        : f.threshold_yellow ?? '—'}
                    </td>
                    <td className="py-2 text-slate-500 font-mono text-xs">{f.threshold_red ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Gate pass/fail rates */}
      <Section title="Gate Pass / Fail Rates">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-slate-500">Window:</span>
          {[1, 7, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className="px-3 py-1 rounded text-xs font-medium transition-colors"
              style={{
                background: days === d ? 'rgba(250,204,21,0.12)' : 'rgba(255,255,255,0.04)',
                color: days === d ? '#facc15' : '#94a3b8',
                border: `1px solid ${days === d ? 'rgba(250,204,21,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {d}d
            </button>
          ))}
          {loadingM && <span className="text-xs text-slate-600 animate-pulse">Refreshing…</span>}
        </div>
        {errorM && <p className="text-red-400 text-sm">{errorM}</p>}
        {metrics?.graphs && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                  <th className="pb-2 pr-4 font-medium">Graph</th>
                  <th className="pb-2 pr-4 font-medium">Total</th>
                  <th className="pb-2 pr-4 font-medium">Pass %</th>
                  <th className="pb-2 pr-4 font-medium">Abort %</th>
                  <th className="pb-2 font-medium">Fail %</th>
                </tr>
              </thead>
              <tbody>
                {metrics.graphs.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-slate-600 text-xs italic">No decisions in window</td></tr>
                )}
                {metrics.graphs.map((g) => (
                  <tr key={g.graph_name} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-2 pr-4 text-slate-300 font-mono text-xs">{g.graph_name}</td>
                    <td className="py-2 pr-4 text-slate-400 font-mono">{g.total}</td>
                    <td className="py-2 pr-4"><PassRateCell pct={g.pass_rate_pct} /></td>
                    <td className="py-2 pr-4 font-mono text-slate-400">{g.abort_rate_pct?.toFixed(1)}%</td>
                    <td className="py-2 font-mono text-slate-400">{g.fail_rate_pct?.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Top block reasons */}
      {metrics?.top_block_reasons?.length > 0 && (
        <Section title="Top Block Reasons (7d)">
          <div className="space-y-1">
            {metrics.top_block_reasons.slice(0, 10).map((r) => (
              <div key={r.reason} className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
                <span className="text-xs text-slate-300 font-mono">{r.reason}</span>
                <span className="text-xs text-slate-500 font-mono">{r.count}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Decision audit */}
      <Section title="Decision Audit">
        <AuditLookup token={token} />
      </Section>
    </div>
  );
}
