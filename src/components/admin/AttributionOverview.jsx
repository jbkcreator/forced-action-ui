import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAttributionStats } from '../../api/admin';

const DIMS = [
  { id: 'conversion_type', label: 'Type' },
  { id: 'trade',           label: 'Trade' },
  { id: 'zip_code',        label: 'ZIP' },
  { id: 'wallet_tier',     label: 'Wallet Tier' },
  { id: 'lock_status',     label: 'Lock Status' },
  { id: 'autopilot_tier',  label: 'AutoPilot' },
  { id: 'bundle_type',     label: 'Bundle Type' },
  { id: 'deal_size_bucket',label: 'Deal Size' },
];

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };

function fmtRevenue(val) {
  if (val == null) return '—';
  const n = Number(val);
  if (Number.isNaN(n)) return '—';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AttributionOverview({ token }) {
  const [groupBy, setGroupBy]   = useState('conversion_type');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const abortRef = useRef(null);

  const load = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError('');
    fetchAttributionStats(token, { groupBy, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }, { signal: ctrl.signal })
      .then(d => setData(d))
      .catch(e => { if (e.name !== 'AbortError') setError(e.detail || e.message || 'Failed to load stats'); })
      .finally(() => setLoading(false));
  }, [token, groupBy, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const rows = data?.data ?? [];
  const totalConversions = rows.reduce((s, r) => s + Number(r.count ?? 0), 0);
  const totalRevenue     = rows.reduce((s, r) => s + Number(r.revenue_sum ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {DIMS.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => setGroupBy(d.id)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
              style={groupBy === d.id
                ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }
                : { background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="rounded-lg px-2 py-1 text-xs bg-white/5 border border-white/10 text-slate-300 focus:outline-none focus:ring-1 focus:ring-yellow-400/40" />
          <span className="text-slate-600 text-xs">–</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="rounded-lg px-2 py-1 text-xs bg-white/5 border border-white/10 text-slate-300 focus:outline-none focus:ring-1 focus:ring-yellow-400/40" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Conversions', value: totalConversions.toLocaleString(), color: 'yellow' },
          { label: 'Total Revenue',     value: fmtRevenue(totalRevenue),           color: 'emerald' },
          { label: `${DIMS.find(d => d.id === groupBy)?.label ?? 'Dim'} Groups`, value: rows.length.toLocaleString(), color: 'slate' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4" style={card}>
            <div className={`text-2xl font-bold text-${color}-300`}>{loading ? '…' : value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wide">
              <th className="px-4 py-3">Dimension Value</th>
              <th className="px-4 py-3 text-right">Conversions</th>
              <th className="px-4 py-3 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500 text-sm">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500 text-sm">No data.</td></tr>
            )}
            {!loading && rows.map((r, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] text-slate-300">
                <td className="px-4 py-3 font-mono text-xs">{r.group_value ?? <span className="text-slate-600">—</span>}</td>
                <td className="px-4 py-3 text-right tabular-nums">{Number(r.count).toLocaleString()}</td>
                <td className="px-4 py-3 text-right tabular-nums text-emerald-400">{fmtRevenue(r.revenue_sum)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
