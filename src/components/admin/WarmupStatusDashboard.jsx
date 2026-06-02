import { useState, useEffect } from 'react';
import { fetchWarmupStatus } from '../../api/emailCampaigns';

const TH = { color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' };
const TD = { padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', color: '#e2e8f0' };

function WarmupBadge({ enabled }) {
  return enabled ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
      Enabled
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: 'rgba(148,163,184,0.15)', color: '#94a3b8' }}>
      Disabled
    </span>
  );
}

function HealthBar({ score, warning }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = warning ? '#fb923c' : pct >= 85 ? '#4ade80' : '#facc15';
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', maxWidth: '80px' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>{score}</span>
      {warning && (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fb923c" strokeWidth={2} title="Health below 70 — action recommended">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      )}
    </div>
  );
}

const POLL_INTERVAL = 30_000;

export default function WarmupStatusDashboard({ token }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  function load(silent = false) {
    if (!silent) setLoading(true);
    const controller = new AbortController();
    fetchWarmupStatus(token, { signal: controller.signal })
      .then(data => {
        setAccounts(Array.isArray(data) ? data : []);
        setError(null);
        setLastUpdated(new Date());
      })
      .catch(err => { if (err.name !== 'AbortError') setError(err.detail || 'Failed to load warmup status'); })
      .finally(() => setLoading(false));
    return controller;
  }

  useEffect(() => {
    const ctrl = load();
    const interval = setInterval(() => load(true), POLL_INTERVAL);
    return () => { ctrl.abort(); clearInterval(interval); };
  }, [token]);

  const warningCount = accounts.filter(a => a.health_warning).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-white">Inbox / Warmup Status</h2>
          {lastUpdated && (
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              Updated {lastUpdated.toLocaleTimeString()} · refreshes every 30s
            </p>
          )}
        </div>
        {warningCount > 0 && (
          <div
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.2)' }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {warningCount} account{warningCount > 1 ? 's' : ''} need attention
          </div>
        )}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <table className="w-full">
          <thead style={{ background: 'rgba(15,23,42,0.9)' }}>
            <tr>
              {['Email Account', 'Warmup', 'Health Score', 'Actions'].map(h => (
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: 'rgba(10,15,30,0.7)' }}>
            {loading && [...Array(4)].map((_, i) => (
              <tr key={i}>
                {[...Array(4)].map((__, j) => (
                  <td key={j} style={TD}>
                    <div className="h-3.5 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', width: j === 0 ? '70%' : '50%' }} />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && error && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: '#f87171' }}>{error}</td>
              </tr>
            )}

            {!loading && !error && accounts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm" style={{ color: '#64748b' }}>
                  No inbox accounts found
                </td>
              </tr>
            )}

            {!loading && !error && accounts.map((a, i) => (
              <tr key={a.email ?? i} className="hover:bg-white/[0.02] transition-colors">
                <td style={TD}><span className="font-medium text-white">{a.email}</span></td>
                <td style={TD}><WarmupBadge enabled={a.warmup_enabled} /></td>
                <td style={TD}><HealthBar score={a.health_score ?? 0} warning={a.health_warning} /></td>
                <td style={TD}>
                  {a.instantly_url ? (
                    <a
                      href={a.instantly_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs px-2.5 py-1 rounded-md font-medium"
                      style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Open in Instantly ↗
                    </a>
                  ) : (
                    <span style={{ color: '#64748b', fontSize: '12px' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
