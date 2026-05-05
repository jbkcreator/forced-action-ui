import { useEffect, useState } from 'react';
import { fetchUnlockRefunds, issueRefund } from '../../api/admin';

export default function RefundsDashboard({ token }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [refunding, setRefunding] = useState(null);
  const [reasonMap, setReasonMap] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    fetchUnlockRefunds(token, {}, { signal: controller.signal })
      .then(setRows)
      .catch(e => { if (e.name !== 'AbortError') setError(e.message || e.detail || 'Failed'); });
    return () => controller.abort();
  }, [token]);

  async function handleRefund(id) {
    const reason = (reasonMap[id] || '').trim();
    if (!reason) return;
    setRefunding(id);
    try {
      await issueRefund(token, id, reason);
      setRows(prev => prev.map(r => r.id === id
        ? { ...r, refunded_at: new Date().toISOString(), refund_reason: reason }
        : r
      ));
    } catch (e) {
      alert(`Refund failed: ${e.detail || e.message}`);
    } finally {
      setRefunding(null);
    }
  }

  if (error) return <p className="text-red-400 text-sm p-4">Failed to load: {error}</p>;
  if (!rows) return <p className="text-slate-500 text-sm p-4 animate-pulse">Loading unlock purchases…</p>;

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{rows.length} lead-unlock purchase{rows.length !== 1 ? 's' : ''}</p>
        <p className="text-xs text-slate-600">Refunds are full-amount. Log a reason before issuing.</p>
      </div>

      {rows.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-slate-500 text-sm">No lead-unlock purchases yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {rows.map(r => (
          <div
            key={r.id}
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(15,23,42,0.8)',
              border: `1px solid ${r.refunded_at ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{r.property_address || '—'}</p>
                <p className="text-slate-400 text-xs mt-0.5">{r.subscriber_email}</p>
                <p className="text-slate-600 text-xs mt-0.5">
                  {r.sent_at ? new Date(r.sent_at).toLocaleString() : '—'}
                  {r.stripe_payment_intent_id && (
                    <span className="ml-2 font-mono">{r.stripe_payment_intent_id}</span>
                  )}
                </p>
              </div>

              {r.refunded_at ? (
                <div className="text-right shrink-0">
                  <span className="inline-block text-xs text-red-400 bg-red-950/40 border border-red-800/30 px-2.5 py-1 rounded-full">
                    Refunded
                  </span>
                  <p className="text-xs text-slate-600 mt-1">{r.refund_reason}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    aria-label="Refund reason"
                    placeholder="Reason (required)"
                    value={reasonMap[r.id] || ''}
                    onChange={e => setReasonMap(prev => ({ ...prev, [r.id]: e.target.value }))}
                    className="rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-400/40 w-44"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <button
                    onClick={() => handleRefund(r.id)}
                    disabled={refunding === r.id || !(reasonMap[r.id] || '').trim() || !r.stripe_payment_intent_id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                    title={!r.stripe_payment_intent_id ? 'No payment intent ID — refund manually in Stripe' : ''}
                  >
                    {refunding === r.id ? 'Refunding…' : 'Refund $4'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
