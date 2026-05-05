import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDlq } from '../../api/admin';

const REASON_OPTIONS = [
  { value: '', label: 'All reasons' },
  { value: 'parser_failed', label: 'Parser failed' },
  { value: 'dispatch_failed', label: 'Dispatch failed' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'compliance_blocked', label: 'Compliance blocked' },
];

export default function DlqDashboard({ token }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [q, setQ] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  const load = useCallback(async (signal) => {
    setError('');
    try {
      const data = await fetchDlq(token, { reason, q }, { signal });
      const list = Array.isArray(data) ? data : (data?.items || []);
      setRows(list);
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError(e.detail || e.message || 'Failed to load DLQ');
      setRows([]);
    }
  }, [token, reason, q]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refreshTick]);

  // Auto-refresh every 60s
  useEffect(() => {
    const id = setInterval(() => setRefreshTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const count = rows?.length ?? 0;
  const summary = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    const byReason = rows.reduce((acc, r) => {
      const k = r.reason || 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    return byReason;
  }, [rows]);

  return (
    <div className="w-full max-w-4xl">
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label htmlFor="dlq-reason" className="block text-xs text-slate-500 mb-1">Reason</label>
          <select
            id="dlq-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {REASON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[220px]">
          <label htmlFor="dlq-q" className="block text-xs text-slate-500 mb-1">Search body</label>
          <input
            id="dlq-q"
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="substring of message body…"
            className="w-full rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>
        <button
          type="button"
          onClick={() => setRefreshTick(t => t + 1)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:border-slate-500"
        >
          Refresh
        </button>
      </div>

      {error && <p role="alert" className="text-red-400 text-sm mb-3">{error}</p>}

      {rows === null && <p className="text-slate-500 text-sm animate-pulse">Loading DLQ…</p>}

      {rows && (
        <>
          <div className="flex items-center justify-between mb-3" aria-live="polite">
            <p className="text-sm text-slate-400">
              {count} dead-letter{count === 1 ? '' : 's'}
            </p>
            {summary && (
              <div className="flex gap-2 flex-wrap">
                {Object.entries(summary).map(([k, v]) => (
                  <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                    {k} · {v}
                  </span>
                ))}
              </div>
            )}
          </div>

          {count === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-slate-500 text-sm">DLQ is empty — nothing to triage.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((r, i) => (
                <div
                  key={r.id ?? i}
                  className="rounded-2xl p-5"
                  style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium font-mono">{r.from_number || r.to_number || '—'}</p>
                      <p className="text-slate-600 text-xs mt-0.5">
                        {(r.received_at || r.created_at) ? new Date(r.received_at || r.created_at).toLocaleString() : '—'}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-950/40 text-red-300 border border-red-800/30">
                      {r.reason || 'unknown'}
                    </span>
                  </div>
                  <pre className="mt-2 text-xs text-slate-300 whitespace-pre-wrap break-words font-mono bg-black/30 rounded-lg p-3 border border-white/5">
                    {r.body || r.payload || '(empty)'}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
