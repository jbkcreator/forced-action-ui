import { useCallback, useRef, useState } from 'react';
import { fetchRevenueSignal } from '../../api/admin';

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

const BREAKDOWN_LABELS = {
  spend_velocity:       { label: 'Spend Velocity',       weight: '25%' },
  engagement_recency:   { label: 'Engagement Recency',   weight: '25%' },
  wallet_lock_status:   { label: 'Wallet / Lock Status', weight: '20%' },
  lead_interaction_rate:{ label: 'Lead Interaction Rate',weight: '20%' },
  zip_competition:      { label: 'ZIP Competition',      weight: '10%' },
};

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };

export default function RevenueSignalPanel({ token }) {
  const [inputId, setInputId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loaded | not_found | error
  const [errMsg, setErrMsg] = useState('');
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

    fetchRevenueSignal(token, id, 20, { signal: ctrl.signal })
      .then(d => { setData(d); setStatus('loaded'); })
      .catch(e => {
        if (e.name === 'AbortError') return;
        if (e.status === 404) { setStatus('not_found'); }
        else { setStatus('error'); setErrMsg(e.message || e.detail || 'Request failed'); }
      })
      .finally(() => setLoading(false));
  }, [token, inputId]);

  const handleKey = (e) => { if (e.key === 'Enter') lookup(); };

  return (
    <div className="space-y-4">
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
        <button
          type="button"
          onClick={lookup}
          disabled={loading || !inputId.trim()}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-900 disabled:opacity-40 transition-opacity"
          style={{ background: '#facc15' }}
        >
          {loading ? 'Loading…' : 'Look up'}
        </button>
      </div>

      {status === 'idle' && !loading && (
        <p className="text-slate-500 text-sm py-4">Enter a subscriber ID to view their Revenue Signal Score.</p>
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

      {status === 'loaded' && data && <ScorePanel data={data} />}
    </div>
  );
}

function ScorePanel({ data }) {
  const sc = scoreColor(data.score ?? 0);
  const bc = bandColor(data.band);
  const breakdown = data.breakdown || {};

  return (
    <div className="space-y-4">
      {/* Top metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Score">
          <span className="text-2xl font-bold" style={{ color: sc.text }}>{data.score ?? 0}</span>
          <span className="text-xs text-slate-500">/100</span>
        </MetricCard>
        <MetricCard label="Band">
          <span
            className="text-sm font-semibold px-2 py-0.5 rounded-full"
            style={{ color: bc.text, background: bc.bg, border: `1px solid ${bc.border}` }}
          >
            {(data.band || 'low').replace('_', ' ')}
          </span>
        </MetricCard>
        <MetricCard label="Last Action">
          <span className="text-xs text-slate-300 text-center">{data.last_action || '—'}</span>
        </MetricCard>
        <MetricCard label="Updated">
          <span className="text-xs text-slate-300">{relativeTime(data.revenue_signal_updated_at)}</span>
        </MetricCard>
      </div>

      {/* Breakdown */}
      {Object.keys(breakdown).length > 0 && (
        <div className="rounded-xl p-4 space-y-2" style={card}>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">Score Breakdown</p>
          {Object.entries(BREAKDOWN_LABELS).map(([key, meta]) => {
            const val = breakdown[key];
            return (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{meta.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 w-8 text-right">{meta.weight}</span>
                  <span className="text-white font-mono w-12 text-right">
                    {val != null ? val : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reasons */}
      {data.reasons && data.reasons.length > 0 && (
        <div className="rounded-xl p-4" style={card}>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Signal Reasons</p>
          <ul className="space-y-1">
            {data.reasons.map((r, i) => (
              <li key={i} className="text-xs text-slate-400 flex gap-2">
                <span className="text-slate-600">·</span>{r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* History table */}
      <div>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Score History</p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Old</th>
                <th className="px-4 py-3">New</th>
                <th className="px-4 py-3">Delta</th>
                <th className="px-4 py-3">Band</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {(!data.history || data.history.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-slate-500 text-center">No signal history yet.</td>
                </tr>
              )}
              {(data.history || []).map((h, i) => {
                const delta = (h.new_score ?? 0) - (h.old_score ?? 0);
                const deltaColor = delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-slate-500';
                return (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/2 text-slate-300">
                    <td className="px-4 py-3 text-xs font-mono">{h.action_type || '—'}</td>
                    <td className="px-4 py-3">{h.old_score ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-white">{h.new_score ?? '—'}</td>
                    <td className={`px-4 py-3 font-mono ${deltaColor}`}>
                      {delta > 0 ? `+${delta}` : delta}
                    </td>
                    <td className="px-4 py-3 text-xs">{h.band || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{relativeTime(h.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, children }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col items-center gap-1"
      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-1">{children}</div>
      <span className="text-xs text-slate-500 mt-1">{label}</span>
    </div>
  );
}
