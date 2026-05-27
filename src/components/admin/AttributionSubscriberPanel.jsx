import { useCallback, useRef, useState } from 'react';
import { fetchAttributionSubscriber } from '../../api/admin';

function relativeTime(iso) {
  if (!iso) return '—';
  const delta = (Date.now() - new Date(iso).getTime()) / 1000;
  if (delta < 60) return 'just now';
  if (delta < 3600) return `${Math.round(delta / 60)}m ago`;
  if (delta < 86400) return `${Math.round(delta / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function scoreColor(score) {
  if (score >= 60) return { text: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' };
  if (score >= 30) return { text: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' };
  return { text: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' };
}

function bandColor(band) {
  if (band === 'very_high') return { text: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' };
  if (band === 'high')      return { text: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)' };
  if (band === 'medium')    return { text: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)' };
  return { text: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' };
}

function statusBadge(val) {
  if (val === 'complete')   return 'text-xs px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400';
  if (val === 'partial')    return 'text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400';
  return 'text-xs px-2 py-0.5 rounded-full bg-red-400/10 text-red-400';
}

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };

export default function AttributionSubscriberPanel({ token, onOpenTrace }) {
  const [inputId, setInputId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState(null);
  const [status, setStatus]   = useState('idle');
  const [errMsg, setErrMsg]   = useState('');
  const abortRef = useRef(null);

  const lookup = useCallback(() => {
    const id = inputId.trim();
    if (!id || !/^\d+$/.test(id)) return;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setData(null);
    setErrMsg('');
    setStatus('idle');
    fetchAttributionSubscriber(token, id, { signal: ctrl.signal })
      .then(d => { setData(d); setStatus('loaded'); })
      .catch(e => {
        if (e.name === 'AbortError') return;
        if (e.status === 404) setStatus('not_found');
        else { setStatus('error'); setErrMsg(e.detail || e.message || 'Request failed'); }
      })
      .finally(() => setLoading(false));
  }, [token, inputId]);

  const handleKey = (e) => { if (e.key === 'Enter') lookup(); };

  const sub  = data?.subscriber     ?? {};
  const sc   = scoreColor(sub.revenue_signal_score ?? 0);
  const bc   = bandColor(sub.revenue_signal_band);
  const attrEvents  = data?.attribution_events ?? [];
  const scoreEvents = data?.score_events       ?? [];

  return (
    <div className="space-y-4">
      {/* Lookup input */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Subscriber ID"
          className="w-40 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <button type="button" onClick={lookup} disabled={loading || !inputId.trim()}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-900 disabled:opacity-40 transition-opacity"
          style={{ background: '#facc15' }}>
          {loading ? 'Loading…' : 'Look up'}
        </button>
      </div>

      {status === 'idle' && !loading && (
        <p className="text-slate-500 text-sm py-4">Enter a subscriber ID to view attribution history.</p>
      )}
      {status === 'not_found' && (
        <div role="alert" className="text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">
          Subscriber not found.
        </div>
      )}
      {status === 'error' && (
        <div role="alert" className="text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">
          {errMsg}
        </div>
      )}

      {status === 'loaded' && data && (
        <div className="space-y-5">
          {/* Score cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-4 flex flex-col items-center gap-1" style={card}>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color: sc.text }}>{sub.revenue_signal_score ?? 0}</span>
                <span className="text-xs text-slate-500">/100</span>
              </div>
              <span className="text-xs text-slate-500 mt-1">Score</span>
            </div>
            <div className="rounded-xl p-4 flex flex-col items-center gap-1" style={card}>
              <span className="text-sm font-semibold px-2 py-0.5 rounded-full"
                style={{ color: bc.text, background: bc.bg, border: `1px solid ${bc.border}` }}>
                {(sub.revenue_signal_band || 'low').replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-500 mt-1">Band</span>
            </div>
            <div className="rounded-xl p-4 flex flex-col items-center gap-1" style={card}>
              <span className="text-xs text-slate-300">{relativeTime(sub.revenue_signal_updated_at)}</span>
              <span className="text-xs text-slate-500 mt-1">Last Updated</span>
            </div>
          </div>

          {/* Score reasons */}
          {Array.isArray(sub.revenue_signal_breakdown?.reasons) && sub.revenue_signal_breakdown.reasons.length > 0 && (
            <div className="rounded-xl p-4" style={card}>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Signal Reasons</p>
              <ul className="space-y-1">
                {sub.revenue_signal_breakdown.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-slate-400 flex gap-2">
                    <span className="text-slate-600">·</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Attribution events */}
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Attribution Events (last 20)</p>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wide">
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Source Table</th>
                    <th className="px-3 py-3">Source Event</th>
                    <th className="px-3 py-3">ZIP</th>
                    <th className="px-3 py-3">Trade</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Occurred</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {attrEvents.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-6 text-slate-500 text-center">No attribution events.</td></tr>
                  )}
                  {attrEvents.map(e => (
                    <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.03] text-slate-300">
                      <td className="px-3 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400">{e.conversion_type}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-mono text-slate-400">{e.source_table}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-slate-400 max-w-[160px] truncate">{e.source_event_id}</td>
                      <td className="px-3 py-2.5 text-xs font-mono">{e.zip_code ?? '—'}</td>
                      <td className="px-3 py-2.5 text-xs">{e.trade ?? '—'}</td>
                      <td className="px-3 py-2.5">
                        <span className={statusBadge(e.attribution_status)}>{e.attribution_status}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-400">{relativeTime(e.occurred_at)}</td>
                      <td className="px-3 py-2.5">
                        <button type="button" onClick={() => onOpenTrace(e.id)}
                          className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors">
                          Trace →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Score events */}
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Score Events (last 20)</p>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wide">
                    <th className="px-3 py-3">Action Type</th>
                    <th className="px-3 py-3">Old</th>
                    <th className="px-3 py-3">New</th>
                    <th className="px-3 py-3">Delta</th>
                    <th className="px-3 py-3">Band</th>
                    <th className="px-3 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreEvents.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-slate-500 text-center">No score events.</td></tr>
                  )}
                  {scoreEvents.map((h, i) => {
                    const delta = (h.new_score ?? 0) - (h.old_score ?? 0);
                    const deltaColor = delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-slate-500';
                    return (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] text-slate-300">
                        <td className="px-3 py-2.5 text-xs font-mono">{h.action_type ?? '—'}</td>
                        <td className="px-3 py-2.5">{h.old_score ?? '—'}</td>
                        <td className="px-3 py-2.5 font-medium text-white">{h.new_score ?? '—'}</td>
                        <td className={`px-3 py-2.5 font-mono ${deltaColor}`}>{delta > 0 ? `+${delta}` : delta}</td>
                        <td className="px-3 py-2.5 text-xs">{h.band ?? '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-400">{relativeTime(h.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
