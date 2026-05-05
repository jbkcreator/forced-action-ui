import { useEffect, useMemo, useState } from 'react';
import { fetchSkuMargin } from '../../api/admin';

const WINDOWS = ['7d', '30d', '90d'];
const SKU_LABEL = {
  report: 'Property Report ($7)',
  brief: 'Lead Brief ($12)',
  transfer: 'Skip-Trace Transfer ($65)',
  byol: 'BYOL Skip-Trace ($5)',
};

function fmtCents(cents) {
  if (cents === null || cents === undefined) return '—';
  return `$${(cents / 100).toFixed(0)}`;
}

function fmtPct(p) {
  if (p === null || p === undefined) return '—';
  return `${p.toFixed(1)}%`;
}

function MarginCell({ pct }) {
  if (pct === null || pct === undefined) return <span className="text-slate-500">—</span>;
  const color = pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-yellow-300' : 'text-red-300';
  return <span className={color}>{pct.toFixed(1)}%</span>;
}

function RateCell({ pct, threshold }) {
  if (pct === null || pct === undefined) return <span className="text-slate-500">—</span>;
  const color = pct >= threshold ? 'text-red-300' : pct >= threshold / 2 ? 'text-yellow-300' : 'text-slate-300';
  return <span className={color}>{pct.toFixed(1)}%</span>;
}

export default function SkuMarginDashboard({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [window, setWindow] = useState('30d');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchSkuMargin(token, { signal: controller.signal })
      .then(setData)
      .catch((e) => { if (e.name !== 'AbortError') setError(e.detail || e.message || 'Failed'); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [token]);

  const rows = useMemo(() => {
    if (!data?.windows?.[window]) return [];
    const w = data.windows[window];
    return Object.values(w);
  }, [data, window]);

  if (error) return <p className="text-red-400 text-sm p-4">Failed to load: {error}</p>;
  if (loading || !data) return <p className="text-slate-500 text-sm p-4 animate-pulse">Loading SKU margin…</p>;

  return (
    <div className="w-full max-w-5xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-sm text-slate-400">
          As of {new Date(data.as_of).toLocaleString()}
        </p>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWindow(w)}
              aria-pressed={window === w}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                background: window === w ? 'rgba(250,204,21,0.12)' : 'transparent',
                color: window === w ? '#facc15' : '#94a3b8',
              }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-white/5">
                <th className="text-left px-4 py-2.5">SKU</th>
                <th className="text-right px-3 py-2.5">Total</th>
                <th className="text-right px-3 py-2.5">Delivered</th>
                <th className="text-right px-3 py-2.5">Refunded</th>
                <th className="text-right px-3 py-2.5">Disputed</th>
                <th className="text-right px-3 py-2.5">Gross</th>
                <th className="text-right px-3 py-2.5">Cost</th>
                <th className="text-right px-3 py-2.5">Margin</th>
                <th className="text-right px-3 py-2.5">Refund %</th>
                <th className="text-right px-4 py-2.5">Dispute %</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500 text-xs">
                    No premium purchases in this window.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.label} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-2.5 text-white">{SKU_LABEL[r.label] || r.label}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{r.total_purchases}</td>
                  <td className="px-3 py-2.5 text-right text-emerald-400">{r.delivered}</td>
                  <td className="px-3 py-2.5 text-right text-yellow-300">{r.refunded}</td>
                  <td className="px-3 py-2.5 text-right text-red-300">{r.disputed}</td>
                  <td className="px-3 py-2.5 text-right text-slate-300">{fmtCents(r.gross_revenue_cents)}</td>
                  <td className="px-3 py-2.5 text-right text-slate-400">{fmtCents(r.cost_cents)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">
                    <MarginCell pct={r.margin_pct} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <RateCell pct={r.refund_rate_pct} threshold={5} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <RateCell pct={r.dispute_rate_pct} threshold={2} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Cost reflects EnrichmentUsageLog (BatchData skip-trace) joined by property_id within the window.
        Artifact SKUs (report / brief) show 0 cost today — add a generator before charging variable cost there.
        Margin colors: green ≥80%, yellow ≥50%, red below.
        Refund/dispute thresholds: yellow at half the alert level, red at the level.
      </p>
    </div>
  );
}
