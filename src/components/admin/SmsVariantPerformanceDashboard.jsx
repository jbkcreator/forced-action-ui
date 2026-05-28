import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSmsVariantPerformance } from '../../api/admin';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };
const inputCls = 'rounded-lg px-2 py-1 text-xs bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40';
const selectCls = `${inputCls} appearance-none`;

const GROUP_BY_OPTIONS = [
  { value: 'prompt_version',            label: 'Prompt Version' },
  { value: 'variant_id',                label: 'Variant ID' },
  { value: 'template_id',               label: 'Template ID' },
  { value: 'trade_vertical',            label: 'Trade Vertical' },
  { value: 'county_id',                 label: 'County' },
  { value: 'behavioral_segment',        label: 'Behavioral Segment' },
  { value: 'revenue_signal_score_band', label: 'Score Band' },
  { value: 'last_action_recency_band',  label: 'Recency Band' },
  { value: 'template_id,variant_id',    label: 'Template × Variant' },
  { value: 'trade_vertical,behavioral_segment', label: 'Vertical × Segment' },
];

function fmtPct(val) {
  if (val == null) return '—';
  return `${Number(val).toFixed(2)}%`;
}

function fmtNum(val, dp = 1) {
  if (val == null) return '—';
  return Number(val).toFixed(dp);
}

function RateBar({ pct, maxPct = 100, color = '#facc15' }) {
  const width = Math.min(100, (Number(pct) / maxPct) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="font-mono text-xs" style={{ color }}>{fmtPct(pct)}</span>
    </div>
  );
}

function groupLabel(row, groupBy) {
  if (groupBy === 'template_id,variant_id') {
    return `${row.template_id ?? '—'} / ${row.variant_id ?? '—'}`;
  }
  if (groupBy === 'trade_vertical,behavioral_segment') {
    return `${row.trade_vertical ?? '—'} / ${row.behavioral_segment ?? '—'}`;
  }
  return row[groupBy] ?? '—';
}

export default function SmsVariantPerformanceDashboard({ token }) {
  const [groupBy, setGroupBy] = useState('prompt_version');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const load = useCallback((gb, df, dt) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError('');
    fetchSmsVariantPerformance(
      token,
      { groupBy: gb, dateFrom: df || undefined, dateTo: dt || undefined },
      { signal: ctrl.signal },
    )
      .then(setData)
      .catch(e => {
        if (e.name !== 'AbortError') setError(e.detail || e.message || 'Failed to load');
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(groupBy, dateFrom, dateTo); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  function apply() { load(groupBy, dateFrom, dateTo); }

  const rows = data?.data ?? [];

  const maxReply      = rows.reduce((m, r) => Math.max(m, Number(r.reply_rate_pct) || 0), 0) || 1;
  const maxConversion = rows.reduce((m, r) => Math.max(m, Number(r.conversion_rate_pct) || 0), 0) || 1;

  const activeLabel = GROUP_BY_OPTIONS.find(o => o.value === groupBy)?.label ?? groupBy;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-xl p-4 space-y-3" style={card}>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className={`${selectCls} w-52`}>
            {GROUP_BY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={`${inputCls} w-36`} />
          <span className="text-slate-600 text-xs">–</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={`${inputCls} w-36`} />
          <button
            type="button"
            onClick={apply}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-900"
            style={{ background: '#facc15' }}
          >
            Load
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Summary */}
      {!loading && rows.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{rows.length} groups by <strong className="text-slate-300">{activeLabel}</strong></span>
          {dateFrom && <span>from {dateFrom}</span>}
          {dateTo && <span>to {dateTo}</span>}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wide">
              <th className="px-3 py-3">{activeLabel}</th>
              <th className="px-3 py-3">Sent</th>
              <th className="px-3 py-3">Delivered</th>
              <th className="px-3 py-3">Replied</th>
              <th className="px-3 py-3">Clicked</th>
              <th className="px-3 py-3">Conv (24h)</th>
              <th className="px-3 py-3">Reply Rate</th>
              <th className="px-3 py-3">Conv. Rate</th>
              <th className="px-3 py-3">Avg Score</th>
              <th className="px-3 py-3">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500 animate-pulse">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-500">No data. Send some messages first, or adjust the date range.</td></tr>
            )}
            {!loading && rows.map((r, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] text-slate-300">
                <td className="px-3 py-2.5 font-mono text-xs text-white font-medium">
                  {groupLabel(r, groupBy)}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">{(r.total_sent ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{(r.total_delivered ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{(r.total_replied ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{(r.total_clicked ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{(r.total_converted ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2.5">
                  <RateBar pct={r.reply_rate_pct} maxPct={maxReply} color="#60a5fa" />
                </td>
                <td className="px-3 py-2.5">
                  <RateBar pct={r.conversion_rate_pct} maxPct={maxConversion} color="#34d399" />
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-slate-400">
                  {fmtNum(r.avg_revenue_signal_score, 1)}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-emerald-400">
                  {r.total_revenue_attributed != null ? `$${Number(r.total_revenue_attributed).toFixed(2)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footnote */}
      {rows.length > 0 && (
        <p className="text-xs text-slate-600">
          Bars are relative within this result set. Reply rate = replied / total sent. Conversion rate = converted / total sent.
        </p>
      )}
    </div>
  );
}
