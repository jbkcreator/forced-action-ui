import { useCallback, useState } from 'react';
import { dispatchSandboxEvent } from '../../api/admin';

const EVENT_TYPES = [
  'wall_session_abandoned',
  'competitor_acted_on_lead',
  'retention_summary_due',
  'abandonment_click_no_complete',
];

const DEFAULT_PAYLOAD = {
  wall_session_abandoned: { session_id: 'demo-session', subscriber_id: 1, zip: '33647' },
  competitor_acted_on_lead: { lead_id: 'demo-lead', zip: '33647', competitor_subscriber_id: 2 },
  retention_summary_due: { tier: 'wallet', cohort_window_days: 7 },
  abandonment_click_no_complete: { session_id: 'demo-session', subscriber_id: 1 },
};

function newUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function SandboxDispatchPanel({ token }) {
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [subscriberId, setSubscriberId] = useState('');
  const [payloadText, setPayloadText] = useState(() => JSON.stringify(DEFAULT_PAYLOAD[EVENT_TYPES[0]], null, 2));
  const [decisionId, setDecisionId] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const onEventTypeChange = useCallback((value) => {
    setEventType(value);
    setPayloadText(JSON.stringify(DEFAULT_PAYLOAD[value] || {}, null, 2));
  }, []);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    let payload;
    try {
      payload = payloadText.trim() ? JSON.parse(payloadText) : {};
    } catch (err) {
      setError(`Payload is not valid JSON: ${err.message}`);
      return;
    }

    const body = {
      event_type: eventType,
      subscriber_id: subscriberId ? Number(subscriberId) : undefined,
      payload,
      decision_id: decisionId || undefined,
      idempotency_key: idempotencyKey || newUuid(),
    };

    setSubmitting(true);
    try {
      const res = await dispatchSandboxEvent(token, body);
      setResult(res);
      setHistory(prev => [{ at: Date.now(), body, res }, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.detail || err.message || 'Dispatch failed');
    } finally {
      setSubmitting(false);
    }
  }, [token, eventType, subscriberId, payloadText, decisionId, idempotencyKey]);

  const replay = useCallback((entry) => {
    setEventType(entry.body.event_type);
    setSubscriberId(entry.body.subscriber_id ? String(entry.body.subscriber_id) : '');
    setPayloadText(JSON.stringify(entry.body.payload || {}, null, 2));
    setDecisionId(entry.body.decision_id || '');
    setIdempotencyKey(''); // generate fresh on resubmit
    setResult(null);
    setError('');
  }, []);

  return (
    <div className="w-full max-w-4xl">
      <p className="text-xs text-slate-500 mb-4">
        Fires a Cora event through the sandbox supervisor. Useful for narrative-style testing without waiting on real triggers.
      </p>

      <form onSubmit={onSubmit} className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="evt-type" className="block text-xs text-slate-500 mb-1">Event type</label>
            <select
              id="evt-type"
              value={eventType}
              onChange={e => onEventTypeChange(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="evt-sub" className="block text-xs text-slate-500 mb-1">Subscriber ID</label>
            <input
              id="evt-sub"
              type="number"
              value={subscriberId}
              onChange={e => setSubscriberId(e.target.value)}
              placeholder="(optional)"
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="evt-payload" className="block text-xs text-slate-500 mb-1">Payload (JSON)</label>
          <textarea
            id="evt-payload"
            value={payloadText}
            onChange={e => setPayloadText(e.target.value)}
            rows={8}
            spellCheck={false}
            className="w-full rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="evt-decision" className="block text-xs text-slate-500 mb-1">Decision ID</label>
            <input
              id="evt-decision"
              type="text"
              value={decisionId}
              onChange={e => setDecisionId(e.target.value)}
              placeholder="(optional)"
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <div>
            <label htmlFor="evt-idem" className="block text-xs text-slate-500 mb-1">Idempotency key</label>
            <input
              id="evt-idem"
              type="text"
              value={idempotencyKey}
              onChange={e => setIdempotencyKey(e.target.value)}
              placeholder="(auto-generated if blank)"
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {error && <p role="alert" className="text-red-300 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="ml-auto rounded-lg px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
          >
            {submitting ? 'Dispatching…' : 'Dispatch event'}
          </button>
        </div>
      </form>

      {result && (
        <section
          aria-live="polite"
          className="mt-5 rounded-2xl p-5"
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(16,185,129,0.25)' }}
        >
          <p className="text-xs uppercase tracking-wide text-emerald-400 mb-2">Supervisor outcome</p>
          <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap break-words bg-black/30 rounded-lg p-3 border border-white/5 max-h-80 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      )}

      {history.length > 0 && (
        <section className="mt-5">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Recent dispatches</p>
          <ul className="space-y-2">
            {history.map((h, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => replay(h)}
                  className="w-full text-left rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/5 border border-white/5"
                >
                  <span className="font-mono text-yellow-300">{h.body.event_type}</span>
                  {h.body.subscriber_id && <span className="text-slate-500"> · sub {h.body.subscriber_id}</span>}
                  <span className="text-slate-600 ml-2">{new Date(h.at).toLocaleTimeString()}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
