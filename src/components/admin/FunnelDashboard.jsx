import { useEffect, useState } from 'react';
import { fetchFunnelCounts } from '../../api/admin';

const STAGES = [
  { key: 'visits', label: 'Visits' },
  { key: 'sample_views', label: 'Sample Views' },
  { key: 'checkout_started', label: 'Checkout Started' },
  { key: 'paid', label: 'Paid' },
  { key: 'rebilled', label: 'Rebilled' },
];

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function FunnelDashboard({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError('');
    fetchFunnelCounts(token, {}, { signal: ctrl.signal })
      .then(setData)
      .catch((e) => { if (e.name !== 'AbortError') setError(e.detail || e.message || 'Failed to load'); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [token]);

  return (
    <div className="w-full max-w-5xl space-y-2">
      <Section title="Funnel (last 30 days)">
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {loading && <p className="text-slate-500 text-sm animate-pulse">Loading…</p>}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {STAGES.map((stage) => (
              <div
                key={stage.key}
                className="rounded border border-slate-800 bg-slate-900/40 px-4 py-3"
              >
                <div className="text-2xl font-mono text-slate-100">{data[stage.key] ?? 0}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">{stage.label}</div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
