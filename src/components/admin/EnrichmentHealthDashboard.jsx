import { useEffect, useState } from 'react';
import { fetchEnrichmentHealth } from '../../api/admin';

function HealthBadge({ degraded, skipped }) {
  const { label, bg, text, border } = degraded
    ? { label: 'degraded', bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.3)' }
    : skipped
      ? { label: 'no data', bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' }
      : { label: 'healthy', bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.3)' };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide"
      style={{ background: bg, color: text, border: `1px solid ${border}` }}
    >
      {label}
    </span>
  );
}

function pct(v) {
  return v === null || v === undefined ? '—' : `${(v * 100).toFixed(1)}%`;
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function EnrichmentHealthDashboard({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError('');
    fetchEnrichmentHealth(token, { signal: ctrl.signal })
      .then(setData)
      .catch((e) => { if (e.name !== 'AbortError') setError(e.detail || e.message || 'Failed to load'); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [token]);

  return (
    <div className="w-full max-w-5xl space-y-2">
      <Section title="Provider Health">
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {loading && <p className="text-slate-500 text-sm animate-pulse">Loading…</p>}
        {data?.providers && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                  <th className="pb-2 pr-4 font-medium">Provider</th>
                  <th className="pb-2 pr-4 font-medium">Hit rate (48h)</th>
                  <th className="pb-2 pr-4 font-medium">Floor</th>
                  <th className="pb-2 pr-4 font-medium">Sample</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.providers.map((p) => (
                  <tr key={p.provider} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-2 pr-4 text-slate-300 font-mono text-xs">{p.provider}</td>
                    <td className="py-2 pr-4 font-mono text-slate-300">{pct(p.hit_rate)}</td>
                    <td className="py-2 pr-4 font-mono text-slate-500 text-xs">{pct(p.floor)}</td>
                    <td className="py-2 pr-4 font-mono text-slate-400">{p.sample_size}</td>
                    <td className="py-2"><HealthBadge degraded={p.degraded} skipped={p.skipped} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Recent Anomalies">
        {data?.recent_anomalies?.length === 0 && (
          <p className="text-slate-600 text-xs italic">No anomalies recorded.</p>
        )}
        {data?.recent_anomalies?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                  <th className="pb-2 pr-4 font-medium">Provider</th>
                  <th className="pb-2 pr-4 font-medium">Detected</th>
                  <th className="pb-2 pr-4 font-medium">Observed</th>
                  <th className="pb-2 pr-4 font-medium">Floor</th>
                  <th className="pb-2 font-medium">Records affected</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_anomalies.map((a, i) => (
                  <tr key={`${a.provider}-${a.detected_at}-${i}`} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-2 pr-4 text-slate-300 font-mono text-xs">{a.provider}</td>
                    <td className="py-2 pr-4 text-slate-400 font-mono text-xs">{a.detected_at}</td>
                    <td className="py-2 pr-4 font-mono text-red-300">{pct(a.observed_hit_rate)}</td>
                    <td className="py-2 pr-4 font-mono text-slate-500 text-xs">{pct(a.floor_hit_rate)}</td>
                    <td className="py-2 font-mono text-slate-400">{a.records_affected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
