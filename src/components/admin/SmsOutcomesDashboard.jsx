import { useCallback, useEffect, useRef, useState } from 'react';
import Modal, { ModalClose } from '../ui/Modal';
import { fetchMessageOutcomeDetail, fetchMessageOutcomes } from '../../api/admin';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };
const inputCls = 'rounded-lg px-2 py-1 text-xs bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40';
const selectCls = `${inputCls} appearance-none`;

const EMPTY_FILTERS = {
  trade_vertical: '', county_id: '', behavioral_segment: '', revenue_signal_score_band: '',
  last_action_recency_band: '', prompt_version: '', conversion_type: '',
  template_id: '', variant_id: '', channel: '', message_type: '', subscriber_id: '',
  date_from: '', date_to: '',
};

const BAND_COLORS = {
  platinum: { bg: 'rgba(168,85,247,0.12)',  color: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  gold:     { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  silver:   { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: 'rgba(148,163,184,0.25)' },
  bronze:   { bg: 'rgba(180,120,60,0.12)',  color: '#d4924a', border: 'rgba(180,120,60,0.25)' },
};

const CONV_COLORS = {
  unlock:  { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.25)' },
  wallet:  { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  lock:    { bg: 'rgba(168,85,247,0.12)',  color: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  annual:  { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  none:    { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.25)' },
};

function Badge({ val, map }) {
  if (!val) return <span className="text-slate-600 text-xs">—</span>;
  const s = (map || {})[val] || { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.25)' };
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {val}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function JsonBlock({ value }) {
  if (value == null) return <span className="text-slate-600 text-xs italic">null</span>;
  return (
    <pre className="text-xs text-slate-300 bg-black/30 rounded-lg p-3 overflow-auto max-h-64 whitespace-pre-wrap break-all">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function Field({ label, value, children, mono }) {
  return (
    <div>
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      {children || <p className={`text-slate-200 text-xs ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</p>}
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function OutcomeDetailModal({ messageId, token, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!messageId) return;
    setLoading(true);
    setError('');
    fetchMessageOutcomeDetail(token, messageId)
      .then(setDetail)
      .catch(e => setError(e.detail || e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [token, messageId]);

  return (
    <Modal isOpen title="Message Outcome Detail" onClose={onClose}>
      <div className="relative rounded-2xl p-6 w-full max-w-2xl space-y-5 max-h-[85vh] overflow-y-auto" style={card}>
        <ModalClose onClick={onClose} />
        <h2 className="text-sm font-semibold text-white pr-8">Message Outcome #{messageId}</h2>

        {loading && <p className="text-slate-500 text-sm animate-pulse">Loading…</p>}
        {error && <div className="text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">{error}</div>}

        {detail && (
          <div className="space-y-4">
            {/* Core fields */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Field label="ID" value={detail.id} mono />
              <Field label="Subscriber ID" value={detail.subscriber_id} mono />
              <Field label="Message Type" value={detail.message_type} />
              <Field label="Channel" value={detail.channel} />
              <Field label="Template ID" value={detail.template_id} mono />
              <Field label="Variant ID" value={detail.variant_id} mono />
              <Field label="Conversion Type"><Badge val={detail.conversion_type} map={CONV_COLORS} /></Field>
              <Field label="Revenue Attributed" value={detail.revenue_attributed != null ? `$${Number(detail.revenue_attributed).toFixed(2)}` : null} />
            </div>

            {/* Timing */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-slate-500 uppercase tracking-wide text-xs mb-2">Timing</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Field label="Sent At" value={fmtDate(detail.sent_at)} />
                <Field label="Delivered At" value={fmtDate(detail.delivered_at)} />
                <Field label="Replied At" value={fmtDate(detail.replied_at)} />
                <Field label="Clicked At" value={fmtDate(detail.clicked_at)} />
              </div>
              <div className="flex gap-4 mt-2 text-xs">
                <span className={detail.conversion_within_4h ? 'text-emerald-400' : 'text-slate-600'}>
                  {detail.conversion_within_4h ? '✓' : '○'} 4h
                </span>
                <span className={detail.conversion_within_24h ? 'text-emerald-400' : 'text-slate-600'}>
                  {detail.conversion_within_24h ? '✓' : '○'} 24h
                </span>
                <span className={detail.conversion_within_48h ? 'text-emerald-400' : 'text-slate-600'}>
                  {detail.conversion_within_48h ? '✓' : '○'} 48h
                </span>
              </div>
            </div>

            {/* Personalization */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-slate-500 uppercase tracking-wide text-xs mb-2">Personalization</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Field label="Trade Vertical" value={detail.trade_vertical} />
                <Field label="County" value={detail.county_id} />
                <Field label="Behavioral Segment" value={detail.behavioral_segment} />
                <Field label="Revenue Score" value={detail.revenue_signal_score} mono />
                <Field label="Score Band"><Badge val={detail.revenue_signal_score_band} map={BAND_COLORS} /></Field>
                <Field label="Recency Band" value={detail.last_action_recency_band} />
                <Field label="Prompt Version" value={detail.prompt_version} mono />
              </div>
            </div>

            {/* Context snapshot */}
            <div>
              <p className="text-slate-500 uppercase tracking-wide text-xs mb-2">Context Snapshot</p>
              <JsonBlock value={detail.context_snapshot} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function SmsOutcomesDashboard({ token }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailId, setDetailId] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback((pg, pp, f) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError('');
    fetchMessageOutcomes(token, { ...f, page: pg, per_page: pp }, { signal: ctrl.signal })
      .then(setData)
      .catch(e => { if (e.name !== 'AbortError') setError(e.detail || e.message || 'Failed to load'); })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(1, perPage, {}); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = () => { setPage(1); setApplied(filters); load(1, perPage, filters); };
  const clearFilters = () => { setFilters(EMPTY_FILTERS); setApplied({}); setPage(1); load(1, perPage, {}); };
  const changePage = next => { setPage(next); load(next, perPage, applied); };
  const changePerPage = pp => { setPerPage(pp); setPage(1); load(1, pp, applied); };
  const setF = key => e => setFilters(f => ({ ...f, [key]: e.target.value }));

  const rows  = data?.data  ?? [];
  const total = data?.total ?? 0;
  const from  = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to    = Math.min(page * perPage, total);
  const totalPages = Math.ceil(total / perPage) || 1;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="rounded-xl p-4 space-y-3" style={card}>
        <div className="flex flex-wrap gap-2">
          <input value={filters.subscriber_id} onChange={setF('subscriber_id')} placeholder="Subscriber ID" className={`${inputCls} w-28`} />
          <input value={filters.template_id} onChange={setF('template_id')} placeholder="Template ID" className={`${inputCls} w-28`} />
          <input value={filters.variant_id} onChange={setF('variant_id')} placeholder="Variant ID" className={`${inputCls} w-24`} />

          <select value={filters.message_type} onChange={setF('message_type')} className={`${selectCls} w-28`}>
            <option value="">All Types</option>
            <option value="sms">sms</option>
            <option value="email">email</option>
            <option value="voice">voice</option>
          </select>

          <select value={filters.conversion_type} onChange={setF('conversion_type')} className={`${selectCls} w-32`}>
            <option value="">All Conv.</option>
            <option value="unlock">unlock</option>
            <option value="wallet">wallet</option>
            <option value="lock">lock</option>
            <option value="annual">annual</option>
            <option value="none">none</option>
          </select>

          <select value={filters.trade_vertical} onChange={setF('trade_vertical')} className={`${selectCls} w-36`}>
            <option value="">All Verticals</option>
            <option value="roofing">roofing</option>
            <option value="restoration">restoration</option>
            <option value="public_adjuster">public_adjuster</option>
            <option value="wholesaler">wholesaler</option>
            <option value="fix_flip">fix_flip</option>
            <option value="attorney">attorney</option>
          </select>

          <input value={filters.county_id} onChange={setF('county_id')} placeholder="County" className={`${inputCls} w-28`} />

          <select value={filters.behavioral_segment} onChange={setF('behavioral_segment')} className={`${selectCls} w-36`}>
            <option value="">All Segments</option>
            <option value="high_intent">high_intent</option>
            <option value="re_engagement">re_engagement</option>
            <option value="retention">retention</option>
            <option value="new_subscriber">new_subscriber</option>
          </select>

          <select value={filters.revenue_signal_score_band} onChange={setF('revenue_signal_score_band')} className={`${selectCls} w-28`}>
            <option value="">All Bands</option>
            <option value="platinum">platinum</option>
            <option value="gold">gold</option>
            <option value="silver">silver</option>
            <option value="bronze">bronze</option>
          </select>

          <select value={filters.last_action_recency_band} onChange={setF('last_action_recency_band')} className={`${selectCls} w-28`}>
            <option value="">All Recency</option>
            <option value="recent">recent</option>
            <option value="moderate">moderate</option>
            <option value="stale">stale</option>
          </select>

          <input value={filters.prompt_version} onChange={setF('prompt_version')} placeholder="Prompt ver." className={`${inputCls} w-24`} />

          <input type="date" value={filters.date_from} onChange={setF('date_from')} className={`${inputCls} w-36`} />
          <span className="text-slate-600 text-xs self-center">–</span>
          <input type="date" value={filters.date_to} onChange={setF('date_to')} className={`${inputCls} w-36`} />
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
        <div role="alert" className="text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Count + per-page */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{total === 0 ? 'No results' : `Showing ${from}–${to} of ${total.toLocaleString()} outcomes`}</span>
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
              <th className="px-3 py-3">Sub ID</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Template</th>
              <th className="px-3 py-3">Variant</th>
              <th className="px-3 py-3">Channel</th>
              <th className="px-3 py-3">Conv. Type</th>
              <th className="px-3 py-3">24h</th>
              <th className="px-3 py-3">Revenue</th>
              <th className="px-3 py-3">Vertical</th>
              <th className="px-3 py-3">County</th>
              <th className="px-3 py-3">Segment</th>
              <th className="px-3 py-3">Score</th>
              <th className="px-3 py-3">Band</th>
              <th className="px-3 py-3">Recency</th>
              <th className="px-3 py-3">Prompt</th>
              <th className="px-3 py-3">Sent At</th>
              <th className="px-3 py-3">Replied</th>
              <th className="px-3 py-3">Ctx</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={19} className="px-4 py-8 text-center text-slate-500 animate-pulse">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={19} className="px-4 py-8 text-center text-slate-500">No message outcomes found.</td></tr>
            )}
            {!loading && rows.map(r => (
              <tr
                key={r.id}
                className="border-b border-white/5 hover:bg-white/[0.03] text-slate-300 cursor-pointer"
                onClick={() => setDetailId(r.id)}
              >
                <td className="px-3 py-2.5 font-mono text-xs text-slate-400">{r.id}</td>
                <td className="px-3 py-2.5 text-xs font-mono">{r.subscriber_id ?? '—'}</td>
                <td className="px-3 py-2.5 text-xs">{r.message_type ?? '—'}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{r.template_id ?? '—'}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{r.variant_id ?? '—'}</td>
                <td className="px-3 py-2.5 text-xs">{r.channel ?? '—'}</td>
                <td className="px-3 py-2.5"><Badge val={r.conversion_type} map={CONV_COLORS} /></td>
                <td className="px-3 py-2.5 text-xs">
                  {r.conversion_within_24h
                    ? <span className="text-emerald-400">✓</span>
                    : <span className="text-slate-600">—</span>}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">
                  {r.revenue_attributed != null ? `$${Number(r.revenue_attributed).toFixed(2)}` : '—'}
                </td>
                <td className="px-3 py-2.5 text-xs">{r.trade_vertical ?? '—'}</td>
                <td className="px-3 py-2.5 text-xs">{r.county_id ?? '—'}</td>
                <td className="px-3 py-2.5 text-xs">{r.behavioral_segment ?? '—'}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{r.revenue_signal_score ?? '—'}</td>
                <td className="px-3 py-2.5"><Badge val={r.revenue_signal_score_band} map={BAND_COLORS} /></td>
                <td className="px-3 py-2.5 text-xs">{r.last_action_recency_band ?? '—'}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{r.prompt_version ?? '—'}</td>
                <td className="px-3 py-2.5 text-xs text-slate-400">{r.sent_at ? new Date(r.sent_at).toLocaleString() : '—'}</td>
                <td className="px-3 py-2.5 text-xs">
                  {r.replied_at
                    ? <span className="text-emerald-400">✓</span>
                    : <span className="text-slate-600">—</span>}
                </td>
                <td className="px-3 py-2.5 text-xs">
                  {r.has_context_snapshot
                    ? <span className="text-xs px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400">JSON</span>
                    : <span className="text-slate-600">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => changePage(page - 1)}
            className="px-3 py-1 rounded-lg text-xs font-medium text-slate-300 disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >← Prev</button>
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => changePage(page + 1)}
            className="px-3 py-1 rounded-lg text-xs font-medium text-slate-300 disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >Next →</button>
        </div>
      )}

      {/* Detail modal */}
      {detailId && (
        <OutcomeDetailModal
          messageId={detailId}
          token={token}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
