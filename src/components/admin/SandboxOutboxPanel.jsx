import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { fetchSandboxOutbox } from '../../api/admin';

const CHANNEL_OPTIONS = [
  { value: '', label: 'All channels' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'voice', label: 'Voice' },
];

function compliancePill(row) {
  if (row.compliance_allowed === false) {
    return { label: 'Blocked', cls: 'bg-yellow-950/40 text-yellow-300 border-yellow-800/30' };
  }
  if (row.would_have_delivered === false) {
    return { label: 'Failed', cls: 'bg-red-950/40 text-red-300 border-red-800/30' };
  }
  return { label: 'Delivered', cls: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/30' };
}

export default function SandboxOutboxPanel({ token }) {
  const [filters, setFilters] = useState({ subscriber_id: '', campaign: '', decision_id: '', channel: '', limit: '100' });
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const setFilter = useCallback((k, v) => setFilters(prev => ({ ...prev, [k]: v })), []);

  useEffect(() => {
    const controller = new AbortController();
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v !== '') params[k] = v; });
    fetchSandboxOutbox(token, params, { signal: controller.signal })
      .then(data => setRows(Array.isArray(data) ? data : (data?.items || [])))
      .catch(e => { if (e.name !== 'AbortError') setError(e.detail || e.message || 'Failed'); });
    return () => controller.abort();
  }, [token, filters, refreshTick]);

  const stats = useMemo(() => {
    if (!rows) return null;
    return {
      total: rows.length,
      delivered: rows.filter(r => r.compliance_allowed !== false && r.would_have_delivered !== false).length,
      blocked: rows.filter(r => r.compliance_allowed === false).length,
      failed: rows.filter(r => r.compliance_allowed !== false && r.would_have_delivered === false).length,
    };
  }, [rows]);

  return (
    <div className="w-full max-w-5xl">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <input aria-label="Subscriber ID" type="text" value={filters.subscriber_id} onChange={e => setFilter('subscriber_id', e.target.value)} placeholder="Subscriber ID"
          className="rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        <input aria-label="Campaign" type="text" value={filters.campaign} onChange={e => setFilter('campaign', e.target.value)} placeholder="Campaign"
          className="rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        <input aria-label="Decision ID" type="text" value={filters.decision_id} onChange={e => setFilter('decision_id', e.target.value)} placeholder="Decision ID"
          className="rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
        <select aria-label="Channel" value={filters.channel} onChange={e => setFilter('channel', e.target.value)}
          className="rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {CHANNEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <input aria-label="Limit" type="number" value={filters.limit} onChange={e => setFilter('limit', e.target.value)} placeholder="Limit (max 500)" min={1} max={500}
          className="rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
      </div>

      <div className="flex items-center justify-between mb-3">
        {stats && (
          <div className="flex gap-2 flex-wrap text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">total · {stats.total}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-800/30">delivered · {stats.delivered}</span>
            <span className="px-2 py-0.5 rounded-full bg-yellow-950/40 text-yellow-300 border border-yellow-800/30">blocked · {stats.blocked}</span>
            <span className="px-2 py-0.5 rounded-full bg-red-950/40 text-red-300 border border-red-800/30">failed · {stats.failed}</span>
          </div>
        )}
        <button type="button" onClick={() => setRefreshTick(t => t + 1)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:border-slate-500">
          Refresh
        </button>
      </div>

      {error && <p role="alert" className="text-red-400 text-sm mb-3">{error}</p>}
      {rows === null && <p className="text-slate-500 text-sm animate-pulse">Loading outbox…</p>}

      {rows && rows.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-slate-500 text-sm">No captured outbound matches these filters.</p>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-white/5">
                  <th className="text-left px-4 py-2.5">When</th>
                  <th className="text-left px-3 py-2.5">Channel</th>
                  <th className="text-left px-3 py-2.5">To</th>
                  <th className="text-left px-3 py-2.5">Campaign · Variant</th>
                  <th className="text-left px-3 py-2.5">Sub / Decision</th>
                  <th className="text-left px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const pill = compliancePill(r);
                  const key = r.id ?? i;
                  const isOpen = expanded === key;
                  return (
                    <Fragment key={key}>
                      <tr
                        onClick={() => setExpanded(isOpen ? null : key)}
                        className="cursor-pointer hover:bg-white/[0.02]"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                          {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-300">{r.channel || 'sms'}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-300 font-mono">{r.to_number || '—'}</td>
                        <td className="px-3 py-2.5 text-xs">
                          <span className="text-slate-300">{r.campaign || '—'}</span>
                          {r.variant_id && <span className="text-slate-500"> · {r.variant_id}</span>}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-500">
                          {r.subscriber_id ? `sub ${r.subscriber_id}` : '—'}
                          {r.decision_id && <div className="font-mono text-[10px] text-slate-600 truncate max-w-[160px]">{r.decision_id}</div>}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${pill.cls}`}>{pill.label}</span>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td colSpan={6} className="px-4 py-3 bg-black/20">
                            <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words font-mono">
                              {r.body || '(empty body)'}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
