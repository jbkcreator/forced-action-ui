import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAttributionConversions } from '../../api/admin';

const CONVERSION_TYPES = [
  'paid_unlock','saved_card','wallet_activation','wallet_topup','bundle_purchase',
  'territory_lock_purchase','autopilot_lite_upgrade','autopilot_pro_upgrade',
  'annual_upgrade','data_only_save','deal_win_reported','failed_payment_recovered',
];

const EMPTY_FILTERS = {
  conversion_type: '', zip_code: '', trade: '', wallet_tier: '', lock_status: '',
  autopilot_tier: '', bundle_type: '', deal_size_bucket: '', attribution_status: '',
  subscriber_id: '', date_from: '', date_to: '',
};

const inputCls = 'rounded-lg px-2 py-1 text-xs bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40';
const selectCls = `${inputCls} appearance-none`;

function statusBadge(val) {
  if (val === 'complete')   return 'text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400';
  if (val === 'partial')    return 'text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400';
  return 'text-xs px-2 py-0.5 rounded-full bg-red-400/10 text-red-400';
}

function confBadge(val) {
  if (val === 'high')   return 'text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400';
  if (val === 'medium') return 'text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400';
  return 'text-xs px-2 py-0.5 rounded-full bg-red-400/10 text-red-400';
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export default function AttributionEventsTable({ token, onOpenTrace }) {
  const [filters, setFilters]     = useState(EMPTY_FILTERS);
  const [applied, setApplied]     = useState({});
  const [page, setPage]           = useState(1);
  const [perPage, setPerPage]     = useState(50);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const abortRef = useRef(null);

  const load = useCallback((pg, pp, f) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError('');
    fetchAttributionConversions(token, { ...f, page: pg, per_page: pp }, { signal: ctrl.signal })
      .then(d => setData(d))
      .catch(e => { if (e.name !== 'AbortError') setError(e.detail || e.message || 'Failed to load'); })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(1, perPage, {}); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = () => {
    setPage(1);
    setApplied(filters);
    load(1, perPage, filters);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setApplied({});
    setPage(1);
    load(1, perPage, {});
  };

  const changePage = (next) => {
    setPage(next);
    load(next, perPage, applied);
  };

  const changePerPage = (pp) => {
    setPerPage(pp);
    setPage(1);
    load(1, pp, applied);
  };

  const set = (key) => (e) => setFilters(f => ({ ...f, [key]: e.target.value }));

  const rows  = data?.data    ?? [];
  const total = data?.total   ?? 0;
  const from  = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to    = Math.min(page * perPage, total);
  const totalPages = Math.ceil(total / perPage) || 1;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex flex-wrap gap-2">
          <input value={filters.subscriber_id} onChange={set('subscriber_id')} placeholder="Subscriber ID" className={`${inputCls} w-32`} />
          <input value={filters.zip_code} onChange={set('zip_code')} placeholder="ZIP" className={`${inputCls} w-24`} />

          <select value={filters.conversion_type} onChange={set('conversion_type')} className={`${selectCls} w-48`}>
            <option value="">All Types</option>
            {CONVERSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select value={filters.attribution_status} onChange={set('attribution_status')} className={`${selectCls} w-36`}>
            <option value="">All Statuses</option>
            <option value="complete">complete</option>
            <option value="partial">partial</option>
            <option value="unresolved">unresolved</option>
          </select>

          <select value={filters.lock_status} onChange={set('lock_status')} className={`${selectCls} w-32`}>
            <option value="">Lock: All</option>
            <option value="locked">locked</option>
            <option value="unlocked">unlocked</option>
            <option value="unknown">unknown</option>
            <option value="not_applicable">n/a</option>
          </select>

          <select value={filters.autopilot_tier} onChange={set('autopilot_tier')} className={`${selectCls} w-40`}>
            <option value="">AutoPilot: All</option>
            <option value="autopilot_lite">autopilot_lite</option>
            <option value="autopilot_pro">autopilot_pro</option>
            <option value="not_applicable">not_applicable</option>
          </select>

          <input type="date" value={filters.date_from} onChange={set('date_from')} className={`${inputCls} w-36`} />
          <span className="text-slate-600 text-xs self-center">–</span>
          <input type="date" value={filters.date_to} onChange={set('date_to')} className={`${inputCls} w-36`} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={applyFilters}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-900"
            style={{ background: '#facc15' }}>
            Apply Filters
          </button>
          <button type="button" onClick={clearFilters}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Count + per-page */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{total === 0 ? 'No results' : `Showing ${from}–${to} of ${total.toLocaleString()} events`}</span>
        <div className="flex items-center gap-2">
          <span>Per page:</span>
          {[25, 50, 100].map(n => (
            <button key={n} type="button" onClick={() => changePerPage(n)}
              className="px-2 py-0.5 rounded text-xs"
              style={perPage === n
                ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }
                : { color: '#64748b' }}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wide">
              <th className="px-3 py-3">ID</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Sub</th>
              <th className="px-3 py-3">ZIP</th>
              <th className="px-3 py-3">Trade</th>
              <th className="px-3 py-3">Wallet</th>
              <th className="px-3 py-3">Lock</th>
              <th className="px-3 py-3">AutoPilot</th>
              <th className="px-3 py-3">Bundle</th>
              <th className="px-3 py-3">Deal</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Conf</th>
              <th className="px-3 py-3">Occurred</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={14} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={14} className="px-4 py-8 text-center text-slate-500">No events. Apply filters or wait for conversions.</td></tr>
            )}
            {!loading && rows.map(r => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03] text-slate-300">
                <td className="px-3 py-2.5 font-mono text-xs text-slate-400">{r.id}</td>
                <td className="px-3 py-2.5">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400">
                    {r.conversion_type}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs">{r.subscriber_id}</td>
                <td className="px-3 py-2.5 text-xs font-mono">{r.zip_code ?? '—'}</td>
                <td className="px-3 py-2.5 text-xs">{r.trade ?? '—'}</td>
                <td className="px-3 py-2.5 text-xs">{r.wallet_tier ?? '—'}</td>
                <td className="px-3 py-2.5 text-xs">{r.lock_status ?? '—'}</td>
                <td className="px-3 py-2.5 text-xs">{r.autopilot_tier ?? '—'}</td>
                <td className="px-3 py-2.5 text-xs">{r.bundle_type ?? '—'}</td>
                <td className="px-3 py-2.5 text-xs">{r.deal_size_bucket ?? '—'}</td>
                <td className="px-3 py-2.5">
                  <span className={statusBadge(r.attribution_status)}>{r.attribution_status ?? '—'}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={confBadge(r.attribution_confidence)}>{r.attribution_confidence ?? '—'}</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-400">{fmtDate(r.occurred_at)}</td>
                <td className="px-3 py-2.5">
                  <button type="button" onClick={() => onOpenTrace(r.id)}
                    className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
                    Trace →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
          <button type="button" onClick={() => changePage(page - 1)} disabled={page <= 1}
            className="px-3 py-1 rounded-lg disabled:opacity-30 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            ← Prev
          </button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" onClick={() => changePage(page + 1)} disabled={page >= totalPages}
            className="px-3 py-1 rounded-lg disabled:opacity-30 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
