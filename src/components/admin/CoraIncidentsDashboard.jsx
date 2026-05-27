import { useCallback, useEffect, useRef, useState } from 'react';
import Modal, { ModalClose } from '../ui/Modal';
import {
  acknowledgeCoraIncident, fetchCoraIncidentDetail,
  fetchCoraIncidents, resolveCoraIncident,
} from '../../api/admin';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };
const inputCls = 'rounded-lg px-2 py-1 text-xs bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40';
const selectCls = `${inputCls} appearance-none`;
const textareaCls = `${inputCls} resize-none w-full`;

const LIMIT = 50;

const EMPTY_FILTERS = {
  severity: '', metric_name: '', feature_name: '', action_taken: '',
  open_only: false, date_from: '', date_to: '',
};

const ACTION_COLORS = {
  no_op:           { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.25)' },
  fallback_enabled:{ bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  auto_paused:     { bg: 'rgba(249,115,22,0.12)',  color: '#fb923c', border: 'rgba(249,115,22,0.25)' },
  human_escalated: { bg: 'rgba(168,85,247,0.12)',  color: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  feature_killed:  { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  resolved:        { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.25)' },
};

const SEV_COLORS = {
  yellow: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  red:    { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.25)' },
};

function Badge({ val, map }) {
  const s = (map || {})[val] || { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.25)' };
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {val ?? '—'}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function fmtNum(val, dp = 2) {
  if (val == null) return '—';
  return Number(val).toFixed(dp);
}

function JsonBlock({ value }) {
  if (value == null) return <span className="text-slate-600 text-xs">null</span>;
  return (
    <pre className="text-xs text-slate-300 bg-black/30 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap break-all">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function IncidentDetailModal({ incidentId, token, onClose, onAcknowledge, onResolve }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!incidentId) return;
    setLoading(true);
    setError('');
    fetchCoraIncidentDetail(token, incidentId)
      .then(setDetail)
      .catch(e => setError(e.detail || e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [token, incidentId]);

  const isResolved = !!detail?.breach_resolved;

  return (
    <Modal isOpen title="Incident Detail" onClose={onClose}>
      <div className="relative rounded-2xl p-6 w-full max-w-2xl space-y-5 max-h-[85vh] overflow-y-auto" style={card}>
        <ModalClose onClick={onClose} />
        <h2 className="text-sm font-semibold text-white pr-8">Incident Detail</h2>

        {loading && <p className="text-slate-500 text-sm animate-pulse">Loading…</p>}
        {error && <div className="text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">{error}</div>}

        {detail && (
          <div className="space-y-4">
            {/* Identity */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Field label="ID" value={detail.id} mono />
              <Field label="Severity"><Badge val={detail.severity} map={SEV_COLORS} /></Field>
              <Field label="Metric" value={detail.metric_name} mono />
              <Field label="Feature" value={detail.feature_name} />
              <Field label="County" value={detail.county_id} />
              <Field label="Action"><Badge val={detail.action_taken} map={ACTION_COLORS} /></Field>
            </div>

            {/* Values */}
            <div className="rounded-xl p-3 space-y-2 text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-slate-500 uppercase tracking-wide text-xs mb-2">Signal Values</p>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Observed" value={fmtNum(detail.observed_value, 4)} mono />
                <Field label="Threshold" value={fmtNum(detail.threshold_value, 4)} mono />
                <Field label="Baseline" value={fmtNum(detail.baseline_value, 4)} mono />
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl p-3 space-y-2 text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-slate-500 uppercase tracking-wide text-xs mb-2">Timeline</p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Breach Started" value={fmtDate(detail.breach_started)} />
                <Field label="Breach Resolved" value={fmtDate(detail.breach_resolved)} />
                <Field label="Duration (hours)" value={detail.duration_hours ?? '—'} />
                <Field label="Decision ID" value={detail.decision_id} mono />
                <Field label="Created" value={fmtDate(detail.created_at)} />
                <Field label="Updated" value={fmtDate(detail.updated_at)} />
              </div>
            </div>

            {/* Action Details JSON */}
            <div>
              <p className="text-slate-500 uppercase tracking-wide text-xs mb-2">Action Details</p>
              <JsonBlock value={detail.action_details} />
            </div>

            {/* Buttons */}
            {!isResolved && (
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onAcknowledge(detail)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-900"
                  style={{ background: '#facc15' }}
                >
                  Acknowledge
                </button>
                <button
                  type="button"
                  onClick={() => onResolve(detail)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-300"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Resolve
                </button>
              </div>
            )}
            {isResolved && (
              <p className="text-xs text-emerald-400 font-medium">✓ This incident has been resolved</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Field({ label, value, children, mono }) {
  return (
    <div>
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      {children || (
        <p className={`text-slate-200 text-xs ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</p>
      )}
    </div>
  );
}

// ── Acknowledge Modal ─────────────────────────────────────────────────────────

function AcknowledgeModal({ incident, onClose, onDone }) {
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setActing(true);
    setError('');
    try {
      await onDone(incident.id, note);
    } catch (e) {
      setError(e.detail || e.message || 'Failed');
      setActing(false);
    }
  }

  return (
    <Modal isOpen title="Acknowledge Incident" onClose={onClose}>
      <div className="relative rounded-2xl p-6 w-full max-w-md space-y-4" style={card}>
        <ModalClose onClick={onClose} />
        <h2 className="text-sm font-semibold text-white pr-8">Acknowledge Incident #{incident.id}</h2>
        <p className="text-slate-400 text-xs">
          Acknowledging will escalate this incident to <strong className="text-purple-400">human_escalated</strong> if not already actioned.
        </p>
        <div>
          <label className="text-slate-400 text-xs block mb-1">Note <span className="text-slate-600">(optional)</span></label>
          <textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note about what you're investigating…"
            className={textareaCls}
          />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={acting}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-900 disabled:opacity-50"
            style={{ background: '#facc15' }}
          >
            {acting ? 'Acknowledging…' : 'Acknowledge'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Resolve Modal ─────────────────────────────────────────────────────────────

function ResolveModal({ incident, onClose, onDone }) {
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setActing(true);
    setError('');
    try {
      await onDone(incident.id, note);
    } catch (e) {
      if (e.status === 409) {
        setError('This incident is already resolved.');
        setActing(false);
      } else {
        setError(e.detail || e.message || 'Failed');
        setActing(false);
      }
    }
  }

  return (
    <Modal isOpen title="Resolve Incident" onClose={onClose}>
      <div className="relative rounded-2xl p-6 w-full max-w-md space-y-4" style={card}>
        <ModalClose onClick={onClose} />
        <h2 className="text-sm font-semibold text-white pr-8">Resolve Incident #{incident.id}</h2>
        <p className="text-slate-400 text-xs">
          This will mark the incident as <strong className="text-emerald-400">resolved</strong> and calculate the total breach duration.
        </p>
        <div>
          <label className="text-slate-400 text-xs block mb-1">Resolution notes <span className="text-slate-600">(optional)</span></label>
          <textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Describe what fixed the issue…"
            className={textareaCls}
          />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={acting}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: 'rgba(16,185,129,0.8)', border: '1px solid rgba(16,185,129,0.4)' }}
          >
            {acting ? 'Resolving…' : 'Confirm Resolve'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function CoraIncidentsDashboard({ token }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState({});
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [detailId, setDetailId] = useState(null);
  const [ackTarget, setAckTarget] = useState(null);
  const [resolveTarget, setResolveTarget] = useState(null);
  const abortRef = useRef(null);
  const successTimerRef = useRef(null);

  const load = useCallback((off, f) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError('');
    fetchCoraIncidents(token, { ...f, limit: LIMIT, offset: off }, { signal: ctrl.signal })
      .then(setData)
      .catch(e => { if (e.name !== 'AbortError') setError(e.detail || e.message || 'Failed to load'); })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(0, {}); }, [load]);

  function showSuccess(msg) {
    setSuccessMsg(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMsg(''), 4000);
  }

  const applyFilters = () => { setOffset(0); setApplied(filters); load(0, filters); };
  const clearFilters = () => { setFilters(EMPTY_FILTERS); setApplied({}); setOffset(0); load(0, {}); };
  const setF = key => e => setFilters(f => ({ ...f, [key]: e.target.value }));
  const setCheck = key => e => setFilters(f => ({ ...f, [key]: e.target.checked }));

  const rows  = data?.data  ?? [];
  const total = data?.total ?? 0;
  const from  = total === 0 ? 0 : offset + 1;
  const to    = Math.min(offset + LIMIT, total);
  const hasPrev = offset > 0;
  const hasNext = offset + LIMIT < total;

  async function handleAcknowledge(incidentId, note) {
    await acknowledgeCoraIncident(token, incidentId, { notes: note || undefined, acknowledged_by: 'admin' });
    showSuccess(`Incident #${incidentId} acknowledged.`);
    setAckTarget(null);
    setDetailId(null);
    load(offset, applied);
  }

  async function handleResolve(incidentId, note) {
    await resolveCoraIncident(token, incidentId, { resolution_notes: note || undefined, resolved_by: 'admin' });
    showSuccess(`Incident #${incidentId} resolved.`);
    setResolveTarget(null);
    setDetailId(null);
    load(offset, applied);
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="rounded-xl p-4 space-y-3" style={card}>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={filters.severity} onChange={setF('severity')} className={`${selectCls} w-32`}>
            <option value="">All Severity</option>
            <option value="yellow">yellow</option>
            <option value="red">red</option>
          </select>
          <input value={filters.metric_name} onChange={setF('metric_name')} placeholder="Metric name" className={`${inputCls} w-36`} />
          <input value={filters.feature_name} onChange={setF('feature_name')} placeholder="Feature name" className={`${inputCls} w-36`} />
          <select value={filters.action_taken} onChange={setF('action_taken')} className={`${selectCls} w-40`}>
            <option value="">All Actions</option>
            <option value="no_op">no_op</option>
            <option value="fallback_enabled">fallback_enabled</option>
            <option value="auto_paused">auto_paused</option>
            <option value="human_escalated">human_escalated</option>
            <option value="feature_killed">feature_killed</option>
            <option value="resolved">resolved</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
            <input type="checkbox" checked={filters.open_only} onChange={setCheck('open_only')} className="accent-yellow-400" />
            Open only
          </label>
          <input type="date" value={filters.date_from} onChange={setF('date_from')} className={`${inputCls} w-36`} />
          <span className="text-slate-600 text-xs">–</span>
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

      {/* Success toast */}
      {successMsg && (
        <div className="text-sm text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-lg px-4 py-3">
          {successMsg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div role="alert" className="text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Count */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{total === 0 ? 'No incidents found' : `Showing ${from}–${to} of ${total.toLocaleString()} incidents`}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead>
            <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wide">
              <th className="px-3 py-3">ID</th>
              <th className="px-3 py-3">Metric</th>
              <th className="px-3 py-3">Feature</th>
              <th className="px-3 py-3">County</th>
              <th className="px-3 py-3">Sev</th>
              <th className="px-3 py-3">Observed</th>
              <th className="px-3 py-3">Threshold</th>
              <th className="px-3 py-3">Baseline</th>
              <th className="px-3 py-3">Breach Started</th>
              <th className="px-3 py-3">Resolved</th>
              <th className="px-3 py-3">Hrs</th>
              <th className="px-3 py-3">Action</th>
              <th className="px-3 py-3">Updated</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={14} className="px-4 py-8 text-center text-slate-500 animate-pulse">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={14} className="px-4 py-8 text-center text-slate-500">No Cora incidents found.</td></tr>
            )}
            {!loading && rows.map(r => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03] text-slate-300 cursor-pointer" onClick={() => setDetailId(r.id)}>
                <td className="px-3 py-2.5 font-mono text-xs text-slate-400">{r.id}</td>
                <td className="px-3 py-2.5 text-xs font-mono">{r.metric_name}</td>
                <td className="px-3 py-2.5 text-xs">{r.feature_name ?? '—'}</td>
                <td className="px-3 py-2.5 text-xs">{r.county_id ?? '—'}</td>
                <td className="px-3 py-2.5"><Badge val={r.severity} map={SEV_COLORS} /></td>
                <td className="px-3 py-2.5 font-mono text-xs">{fmtNum(r.observed_value, 4)}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{fmtNum(r.threshold_value, 4)}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{fmtNum(r.baseline_value, 4)}</td>
                <td className="px-3 py-2.5 text-xs text-slate-400">{fmtDate(r.breach_started)}</td>
                <td className="px-3 py-2.5 text-xs">
                  {r.breach_resolved
                    ? <span className="text-emerald-400 text-xs">✓ {fmtDate(r.breach_resolved)}</span>
                    : <span className="text-yellow-400 text-xs font-medium">Open</span>}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">{r.duration_hours ?? '—'}</td>
                <td className="px-3 py-2.5"><Badge val={r.action_taken} map={ACTION_COLORS} /></td>
                <td className="px-3 py-2.5 text-xs text-slate-400">{fmtDate(r.updated_at)}</td>
                <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                  {!r.breach_resolved && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setAckTarget(r)}
                        className="px-2 py-0.5 rounded text-xs font-medium text-slate-900"
                        style={{ background: '#facc15' }}
                      >Ack</button>
                      <button
                        type="button"
                        onClick={() => setResolveTarget(r)}
                        className="px-2 py-0.5 rounded text-xs font-medium text-slate-300"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >Resolve</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={!hasPrev || loading}
            onClick={() => { const off = offset - LIMIT; setOffset(off); load(off, applied); }}
            className="px-3 py-1 rounded-lg text-xs font-medium text-slate-300 disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >← Prev</button>
          <span className="text-xs text-slate-500">{from}–{to} of {total.toLocaleString()}</span>
          <button
            type="button"
            disabled={!hasNext || loading}
            onClick={() => { const off = offset + LIMIT; setOffset(off); load(off, applied); }}
            className="px-3 py-1 rounded-lg text-xs font-medium text-slate-300 disabled:opacity-30"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >Next →</button>
        </div>
      )}

      {/* Detail modal */}
      {detailId && (
        <IncidentDetailModal
          incidentId={detailId}
          token={token}
          onClose={() => setDetailId(null)}
          onAcknowledge={incident => { setDetailId(null); setAckTarget(incident); }}
          onResolve={incident => { setDetailId(null); setResolveTarget(incident); }}
        />
      )}

      {/* Acknowledge modal */}
      {ackTarget && (
        <AcknowledgeModal
          incident={ackTarget}
          onClose={() => setAckTarget(null)}
          onDone={handleAcknowledge}
        />
      )}

      {/* Resolve modal */}
      {resolveTarget && (
        <ResolveModal
          incident={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onDone={handleResolve}
        />
      )}
    </div>
  );
}
