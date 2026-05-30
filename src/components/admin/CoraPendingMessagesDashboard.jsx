import { useCallback, useEffect, useRef, useState } from 'react';
import {
  approveCoraMessage,
  cancelCoraMessage,
  fetchCoraPendingMessages,
  fetchCoraReviewSwitch,
  setCoraReviewSwitch,
} from '../../api/admin';

const STATUS_COLORS = {
  pending_review: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  approved:       { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  cancelled:      { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.3)' },
};

const LIMIT_OPTIONS = [50, 100, 200, 500];

const btnYellow = 'px-3 py-1 rounded-lg text-xs font-semibold text-slate-900 disabled:opacity-40 transition-opacity';
const btnGhost  = 'px-3 py-1 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white transition-colors disabled:opacity-50';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function truncate(str, n) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export default function CoraPendingMessagesDashboard({ token }) {
  const [messages, setMessages]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [acting, setActing]       = useState(null); // id of message being actioned
  const [limit, setLimit]         = useState(100);
  const [reviewOn, setReviewOn]   = useState(null);  // null = unknown / loading
  const [switching, setSwitching] = useState(false);
  const successTimerRef           = useRef(null);

  const load = useCallback((signal) => {
    setLoading(true);
    setError('');
    return fetchCoraPendingMessages(token, { limit }, { signal })
      .then(d => setMessages(d.messages || []))
      .catch(e => { if (e.name !== 'AbortError') setError(e.message || e.detail || 'Failed to load messages'); })
      .finally(() => setLoading(false));
  }, [token, limit]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  // Load the human-review switch state once on mount.
  useEffect(() => {
    const ctrl = new AbortController();
    fetchCoraReviewSwitch(token, { signal: ctrl.signal })
      .then(d => setReviewOn(!!d.enabled))
      .catch(e => { if (e.name !== 'AbortError') setReviewOn(false); });
    return () => ctrl.abort();
  }, [token]);

  async function toggleReview() {
    if (switching || reviewOn === null) return;
    const next = !reviewOn;
    setSwitching(true);
    try {
      const d = await setCoraReviewSwitch(token, next);
      setReviewOn(!!d.enabled);
      showSuccess(
        d.enabled
          ? 'Human review ON — Cora messages will now be held for approval.'
          : 'Human review OFF — Cora messages will send immediately.'
      );
    } catch (e) {
      setError(e.message || e.detail || 'Failed to change review switch');
    } finally { setSwitching(false); }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMsg(''), 4000);
  }

  // Optimistic removal — message leaves the queue immediately after action.
  function removeRow(id) {
    setMessages(prev => (prev || []).filter(m => m.id !== id));
  }

  async function handleApprove(msg) {
    setActing(msg.id);
    try {
      await approveCoraMessage(token, msg.id);
      removeRow(msg.id);
      showSuccess(`Message #${msg.id} approved.`);
    } catch (e) {
      setError(e.message || e.detail || 'Approve failed');
    } finally { setActing(null); }
  }

  async function handleCancel(msg) {
    const reason = window.prompt('Cancel reason (optional):');
    if (reason === null) return; // user dismissed prompt
    setActing(msg.id);
    try {
      await cancelCoraMessage(token, msg.id, reason);
      removeRow(msg.id);
      showSuccess(`Message #${msg.id} cancelled.`);
    } catch (e) {
      setError(e.message || e.detail || 'Cancel failed');
    } finally { setActing(null); }
  }

  return (
    <div className="space-y-4">

      {/* ── Human-review switch ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-200">Human review</p>
          <p className="text-xs text-slate-500">
            {reviewOn === null
              ? 'Checking switch status…'
              : reviewOn
                ? 'ON — Cora’s outbound messages are held here for you to approve or cancel before they send.'
                : 'OFF — Cora’s messages send immediately. Turn on only when you want to intercept outgoing messages.'}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={reviewOn === true}
          aria-label="Toggle human review of Cora outbound messages"
          disabled={switching || reviewOn === null}
          onClick={toggleReview}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            reviewOn ? 'bg-emerald-500/80' : 'bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              reviewOn ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-slate-400">Show</span>
        <div className="flex gap-1">
          {LIMIT_OPTIONS.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setLimit(n)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                limit === n
                  ? 'border-sky-400/50 text-sky-300 bg-sky-500/10'
                  : 'border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {messages !== null && (
          <span className="text-xs text-slate-500">
            {messages.length} pending
          </span>
        )}

        <button
          type="button"
          onClick={() => load()}
          className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors ml-auto"
        >
          ↺ Refresh
        </button>
      </div>

      {/* ── Banners ──────────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-4 text-xs text-red-500 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg px-4 py-2">
          {successMsg}
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {loading && !messages && (
        <p className="text-slate-500 text-sm animate-pulse py-8 text-center">
          Loading pending messages…
        </p>
      )}

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {messages !== null && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 whitespace-nowrap">Subscriber</th>
                <th className="px-4 py-3 whitespace-nowrap">Phone</th>
                <th className="px-4 py-3 whitespace-nowrap">Body</th>
                <th className="px-4 py-3 whitespace-nowrap">Campaign</th>
                <th className="px-4 py-3 whitespace-nowrap">Variant</th>
                <th className="px-4 py-3 whitespace-nowrap">Review Reason</th>
                <th className="px-4 py-3 whitespace-nowrap">Scheduled</th>
                <th className="px-4 py-3 whitespace-nowrap">Created</th>
                <th className="px-4 py-3 whitespace-nowrap">Decision</th>
                <th className="px-4 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-slate-500 text-center">
                    Queue is clear — no pending messages.
                  </td>
                </tr>
              )}

              {messages.map(msg => {
                const isActing = acting === msg.id;
                const sc = STATUS_COLORS[msg.send_status] ?? STATUS_COLORS.pending_review;

                return (
                  <tr
                    key={msg.id}
                    className={`border-b border-white/5 text-slate-300 transition-opacity ${
                      isActing ? 'opacity-40' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Subscriber */}
                    <td className="px-4 py-3 text-xs">
                      <span title={msg.subscriber_email}>
                        {truncate(msg.subscriber_email, 28)}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-xs font-mono whitespace-nowrap">
                      {msg.phone || '—'}
                    </td>

                    {/* Body preview */}
                    <td className="px-4 py-3 text-xs max-w-[220px]">
                      <span title={msg.body ?? undefined} className="text-slate-300">
                        {truncate(msg.body, 80)}
                      </span>
                    </td>

                    {/* Campaign */}
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {msg.campaign || '—'}
                    </td>

                    {/* Variant */}
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {msg.variant_id || '—'}
                    </td>

                    {/* Review reason */}
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-[160px]">
                      <span title={msg.review_reason ?? undefined}>
                        {truncate(msg.review_reason, 40)}
                      </span>
                    </td>

                    {/* Scheduled */}
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {fmtDate(msg.scheduled_send_at)}
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {fmtDate(msg.created_at)}
                    </td>

                    {/* Decision ID */}
                    <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                      {msg.decision_id
                        ? <span title={msg.decision_id}>{msg.decision_id.slice(0, 8)}…</span>
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleApprove(msg)}
                          className={btnYellow}
                          style={{ background: '#facc15' }}
                        >
                          {isActing ? '…' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleCancel(msg)}
                          className={btnGhost}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
