import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLifecycleTimeline } from '../../api/admin';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };
const inputCls = 'rounded-lg px-2 py-1 text-xs bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40';
const selectCls = `${inputCls} appearance-none`;

const GRAPH_COLORS = {
  retention:               { bg: 'rgba(99,102,241,0.12)',  color: '#a5b4fc', border: 'rgba(99,102,241,0.25)' },
  nws_urgency:             { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  accelerated_wallet_push: { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  wallet_to_lock_close:    { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.25)' },
  ap_lite_close:           { bg: 'rgba(168,85,247,0.12)',  color: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  fomo:                    { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  abandonment:             { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
};

const STATUS_COLORS = {
  completed:  { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.25)' },
  aborted:    { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.25)' },
  escalated:  { bg: 'rgba(168,85,247,0.12)',  color: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  failed:     { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.25)' },
};

const AUTONOMY_COLORS = {
  autonomous:           { bg: 'rgba(16,185,129,0.10)', color: '#6ee7b7', border: 'rgba(16,185,129,0.2)' },
  approval_required:    { bg: 'rgba(251,191,36,0.10)', color: '#fde68a', border: 'rgba(251,191,36,0.2)' },
  approved:             { bg: 'rgba(16,185,129,0.10)', color: '#34d399', border: 'rgba(16,185,129,0.2)' },
  rejected:             { bg: 'rgba(239,68,68,0.10)',  color: '#fca5a5', border: 'rgba(239,68,68,0.2)' },
  overridden:           { bg: 'rgba(249,115,22,0.10)', color: '#fdba74', border: 'rgba(249,115,22,0.2)' },
  recommendation_only:  { bg: 'rgba(100,116,139,0.10)',color: '#94a3b8', border: 'rgba(100,116,139,0.2)' },
};

const SMS_OUTCOME_COLORS = {
  sent:       { color: '#34d399' },
  suppressed: { color: '#fb923c' },
  dry_run:    { color: '#94a3b8' },
  failed:     { color: '#f87171' },
};

function Badge({ val, map }) {
  if (!val) return <span className="text-slate-600 text-xs">—</span>;
  const s = (map || {})[val] || { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.25)' };
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {val}
    </span>
  );
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDateHeader(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function calendarDay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function SmsSendRow({ sms }) {
  const col = SMS_OUTCOME_COLORS[sms.outcome] || { color: '#94a3b8' };
  return (
    <div className="flex items-start gap-2 text-xs py-1 border-t border-white/5">
      <span className="shrink-0 font-mono" style={{ color: col.color }}>{sms.outcome}</span>
      <span className="text-slate-500 shrink-0">{sms.message_type}</span>
      <span className="text-slate-400 flex-1 truncate">{sms.body_preview || '—'}</span>
      {sms.vendor_message_id && (
        <span className="text-slate-600 font-mono truncate max-w-[120px]">{sms.vendor_message_id}</span>
      )}
    </div>
  );
}

function LifecycleTouchRow({ touch }) {
  const [expanded, setExpanded] = useState(false);

  const headline =
    touch.summary?.headline ||
    touch.sms_sends[0]?.body_preview ||
    touch.event_type ||
    touch.graph_name;

  return (
    <article className="rounded-xl mb-2" style={card}>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/3 rounded-xl transition-colors"
      >
        {/* time */}
        <span className="text-slate-500 text-xs font-mono shrink-0 w-12">
          {fmtTime(touch.started_at)}
        </span>

        {/* graph badge */}
        <Badge val={touch.graph_name} map={GRAPH_COLORS} />

        {/* event_type */}
        {touch.event_type && (
          <span className="text-slate-400 text-xs shrink-0 hidden sm:inline">{touch.event_type}</span>
        )}

        {/* headline */}
        <span className="text-slate-300 text-xs flex-1 truncate">{headline}</span>

        {/* status + autonomy */}
        <Badge val={touch.terminal_status} map={STATUS_COLORS} />
        {touch.autonomy_class && (
          <Badge val={touch.autonomy_class} map={AUTONOMY_COLORS} />
        )}

        {/* SMS count */}
        {touch.sms_sends.length > 0 && (
          <span className="text-slate-500 text-xs shrink-0">
            {touch.sms_sends.length} SMS
          </span>
        )}

        {/* expand chevron */}
        <svg
          className="shrink-0 transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          width="12" height="12" viewBox="0 0 12 12" fill="none"
        >
          <path d="M2 4l4 4 4-4" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-4">
          {/* Meta */}
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
            {[
              ['Decision ID', touch.decision_id],
              ['Started', touch.started_at ? new Date(touch.started_at).toLocaleString() : '—'],
              ['Completed', touch.completed_at ? new Date(touch.completed_at).toLocaleString() : '—'],
              ['Variant', touch.variant_id],
              ['Tokens', touch.tokens_used?.toLocaleString()],
              ['Cost', touch.cost_usd != null ? `$${touch.cost_usd.toFixed(6)}` : null],
            ].map(([label, val]) => (
              <div key={label}>
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-slate-200 font-mono break-all">{val ?? '—'}</dd>
              </div>
            ))}
          </dl>

          {/* Override info */}
          {touch.override && (
            <div className="rounded-lg px-3 py-2 text-xs"
              style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <p className="text-orange-300 font-semibold mb-1">
                {touch.override.overridden_at ? 'Overridden' : 'Approved'}
              </p>
              {Object.entries(touch.override).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-slate-500 w-32 shrink-0">{k}</span>
                  <span className="text-slate-300">{v ? new Date(v).toLocaleString ? String(v) : v : '—'}</span>
                </div>
              ))}
            </div>
          )}

          {/* Summary JSONB */}
          {touch.summary && (
            <div>
              <p className="text-slate-500 text-xs mb-1">Summary</p>
              <pre className="text-xs text-slate-300 bg-black/30 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap break-all">
                {JSON.stringify(touch.summary, null, 2)}
              </pre>
            </div>
          )}

          {/* SMS sends */}
          {touch.sms_sends.length > 0 && (
            <div>
              <p className="text-slate-500 text-xs mb-1">SMS Sends</p>
              <div className="rounded-lg px-3 py-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
                {touch.sms_sends.map(s => <SmsSendRow key={s.id} sms={s} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function DayGroup({ dayKey, label, items }) {
  return (
    <section>
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">
        {label}
      </h2>
      {items.map(touch => <LifecycleTouchRow key={touch.decision_id} touch={touch} />)}
    </section>
  );
}

function Shimmer() {
  return (
    <div className="rounded-xl mb-2 px-4 py-3 animate-pulse" style={card}>
      <div className="flex items-center gap-3">
        <div className="h-3 w-10 bg-white/5 rounded" />
        <div className="h-5 w-20 bg-white/5 rounded-full" />
        <div className="h-3 flex-1 bg-white/5 rounded" />
        <div className="h-5 w-16 bg-white/5 rounded-full" />
      </div>
    </div>
  );
}

const GRAPH_OPTIONS = ['', 'retention', 'nws_urgency', 'accelerated_wallet_push', 'wallet_to_lock_close', 'ap_lite_close', 'fomo', 'abandonment'];
const STATUS_OPTIONS = ['', 'completed', 'aborted', 'escalated', 'failed'];

export default function LifecycleTimelineDashboard({ token }) {
  const [subscriberId, setSubscriberId] = useState('');
  const [activeId, setActiveId] = useState('');
  const [graphName, setGraphName] = useState('');
  const [status, setStatus] = useState('');
  const [since, setSince] = useState('');

  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const load = useCallback(async (id, opts = {}, append = false) => {
    if (!id) return;
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    try {
      const data = await fetchLifecycleTimeline(token, id, {
        graphName: opts.graphName || undefined,
        status: opts.status || undefined,
        since: opts.since || undefined,
        cursor: opts.cursor || undefined,
        limit: 50,
      });
      setItems(prev => append ? [...prev, ...data.items] : data.items);
      setNextCursor(data.next_cursor);
    } catch (e) {
      setError(e.detail || e.message || 'Failed to load timeline');
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, [token]);

  function handleSearch(e) {
    e.preventDefault();
    const id = subscriberId.trim();
    if (!id) return;
    setActiveId(id);
    setItems([]);
    setNextCursor(null);
    load(id, { graphName, status, since });
  }

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!sentinelRef.current || !nextCursor || loadingMore) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && nextCursor && !loadingMore) {
        load(activeId, { graphName, status, since, cursor: nextCursor }, true);
      }
    }, { rootMargin: '200px' });

    observer.observe(sentinelRef.current);
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, activeId, graphName, status, since, load]);

  // Group items by calendar day
  const groups = [];
  let currentDay = null;
  let currentGroup = null;
  for (const item of items) {
    const day = calendarDay(item.started_at);
    if (day !== currentDay) {
      currentDay = day;
      currentGroup = { day, label: fmtDateHeader(item.started_at), items: [] };
      groups.push(currentGroup);
    }
    currentGroup.items.push(item);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl p-4" style={card}>
        <h2 className="text-sm font-semibold text-white mb-3">Lifecycle Touch Timeline</h2>

        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Subscriber ID</label>
            <input
              className={inputCls}
              placeholder="e.g. 1042"
              value={subscriberId}
              onChange={e => setSubscriberId(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Graph</label>
            <select className={selectCls} value={graphName} onChange={e => setGraphName(e.target.value)}>
              {GRAPH_OPTIONS.map(g => <option key={g} value={g}>{g || 'All'}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Status</label>
            <select className={selectCls} value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All'}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Since</label>
            <input
              type="date"
              className={inputCls}
              value={since}
              onChange={e => setSince(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15', border: '1px solid rgba(250,204,21,0.25)' }}
          >
            Load
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-xs text-red-400"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {loading && (
        <div>{[...Array(5)].map((_, i) => <Shimmer key={i} />)}</div>
      )}

      {!loading && groups.length === 0 && activeId && (
        <p className="text-slate-500 text-sm text-center py-8">
          No Lifecycle touches for subscriber #{activeId}.
        </p>
      )}

      {!loading && groups.length === 0 && !activeId && (
        <p className="text-slate-600 text-sm text-center py-8">
          Enter a subscriber ID to view their Lifecycle touch history.
        </p>
      )}

      {groups.map(g => (
        <DayGroup key={g.day} dayKey={g.day} label={g.label} items={g.items} />
      ))}

      {loadingMore && <Shimmer />}

      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
}
