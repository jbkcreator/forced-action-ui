/**
 * RevenueLeakPanel — S5 Revenue Leak Score Engine (admin view)
 *
 * Surfaces the nightly revenue_leak_log: Gold+ leads that scored but received
 * zero outbound outreach within 48h, valued in dollars per day and county.
 *
 * Reads GET /api/admin/revenue-leak?county_id=&limit= (admin JWT).
 * Row shape: { log_date, county_id, total_leads_leaked,
 *   estimated_dollar_value (string decimal), vertical_breakdown: {
 *     [vertical]: { count, dollars } } }
 */
import { useEffect, useMemo, useState } from 'react';
import { fetchRevenueLeak } from '../../api/admin';

const COUNTY_FILTERS = [
  { id: '', label: 'All counties' },
  { id: 'hillsborough', label: 'Hillsborough' },
  { id: 'pinellas', label: 'Pinellas' },
];

const VERTICAL_LABEL = {
  roofing: 'Roofing',
  restoration: 'Restoration',
  public_adjusters: 'Public Adjusters',
  wholesalers: 'Wholesalers',
  fix_flip: 'Fix & Flip',
  attorneys: 'Attorneys',
  unknown: 'Unknown',
};

function countyLabel(slug) {
  if (!slug) return '—';
  return slug.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

function fmtDollars(value) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (n == null || Number.isNaN(n)) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtNum(n) {
  if (n == null) return '—';
  return n.toLocaleString();
}

function topVertical(breakdown) {
  if (!breakdown || typeof breakdown !== 'object') return null;
  let best = null;
  for (const [vert, v] of Object.entries(breakdown)) {
    const dollars = Number(v?.dollars) || 0;
    const count = Number(v?.count) || 0;
    // Rank by dollars when the backend populates them; otherwise fall back to
    // lead count so the column stays meaningful even when per-vertical dollars
    // aren't filled in.
    const rank = dollars || count;
    if (!best || rank > best.rank) best = { vert, dollars, count, rank };
  }
  return best;
}

export default function RevenueLeakPanel({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countyId, setCountyId] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetchRevenueLeak(token, { countyId: countyId || undefined, limit: 30 }, { signal: controller.signal })
      .then((rows) => setData(Array.isArray(rows) ? rows : []))
      .catch((e) => { if (e.name !== 'AbortError') setError(e.detail || e.message || 'Failed'); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [token, countyId]);

  // Summary across the most recent log_date present in the result set.
  const summary = useMemo(() => {
    if (!data || data.length === 0) return null;
    const latestDate = data[0].log_date;
    const todays = data.filter((r) => r.log_date === latestDate);
    const leads = todays.reduce((acc, r) => acc + (r.total_leads_leaked || 0), 0);
    const dollars = todays.reduce((acc, r) => acc + parseFloat(r.estimated_dollar_value || 0), 0);
    return { latestDate, leads, dollars };
  }, [data]);

  if (error) return <p className="text-red-400 text-sm p-4">Failed to load: {error}</p>;
  if (loading || !data) return <p className="text-slate-500 text-sm p-4 animate-pulse">Loading revenue leak…</p>;

  return (
    <div className="w-full max-w-5xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Revenue Leak</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gold+ leads with zero outreach in 48h — estimated unrealized revenue.
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {COUNTY_FILTERS.map((c) => (
            <button
              key={c.id || 'all'}
              type="button"
              onClick={() => setCountyId(c.id)}
              aria-pressed={countyId === c.id}
              className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{
                background: countyId === c.id ? 'rgba(250,204,21,0.12)' : 'transparent',
                color: countyId === c.id ? '#facc15' : '#94a3b8',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl p-4" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs text-slate-500">Leaked leads · {summary.latestDate}</p>
            <p className="text-2xl font-extrabold text-yellow-300 mt-1 tabular-nums">{fmtNum(summary.leads)}</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              Estimated $ leaking · {summary.latestDate}
              <span className="relative inline-flex group">
                <span
                  tabIndex={0}
                  role="img"
                  aria-label="How this is estimated"
                  className="w-3.5 h-3.5 inline-flex items-center justify-center rounded-full border border-slate-500 text-slate-400 text-[9px] font-bold cursor-help leading-none focus:outline-none focus:ring-1 focus:ring-yellow-400"
                >
                  i
                </span>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-60 rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-[11px] leading-snug text-slate-300 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10 shadow-xl"
                >
                  Estimated using lead pack pricing: every 5 undelivered Gold+ leads = one $99 pack that wasn’t sold.
                </span>
              </span>
            </p>
            <p className="text-2xl font-extrabold text-red-300 mt-1 tabular-nums">{fmtDollars(summary.dollars)}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-white/5">
                <th className="text-left px-4 py-2.5">Date</th>
                <th className="text-left px-3 py-2.5">County</th>
                <th className="text-right px-3 py-2.5">Leaked leads</th>
                <th className="text-right px-3 py-2.5">Est. $ value</th>
                <th className="text-left px-4 py-2.5">Top vertical</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-xs">
                    No revenue leak logged for this filter.
                  </td>
                </tr>
              )}
              {data.map((r) => {
                const top = topVertical(r.vertical_breakdown);
                return (
                  <tr key={`${r.log_date}-${r.county_id}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-2.5 text-slate-300">{r.log_date}</td>
                    <td className="px-3 py-2.5 text-white">{countyLabel(r.county_id)}</td>
                    <td className="px-3 py-2.5 text-right text-yellow-300 tabular-nums">{fmtNum(r.total_leads_leaked)}</td>
                    <td className="px-3 py-2.5 text-right text-red-300 tabular-nums">{fmtDollars(r.estimated_dollar_value)}</td>
                    <td className="px-4 py-2.5 text-slate-300">
                      {top
                        ? <>{VERTICAL_LABEL[top.vert] || top.vert} <span className="text-slate-500">· {top.dollars > 0 ? fmtDollars(top.dollars) : `${fmtNum(top.count)} leads`}</span></>
                        : <span className="text-slate-500">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Summary cards reflect the most recent log date in the result set. Last 30 rows.
      </p>
    </div>
  );
}
