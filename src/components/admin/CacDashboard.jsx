import { useState } from 'react';
import { fetchCacPayback } from '../../api/admin';

const AUTO_CHANNELS = new Set(['quora', 'affiliate']);

const CHANNEL_LABELS = {
  facebook: 'Facebook / Meta',
  google: 'Google',
  dbpr_email: 'DBPR Email (Instantly)',
  quora: 'Quora',
  affiliate: 'Affiliate',
  referral: 'Referral',
  cora_sms: 'Cora SMS',
  missed_call: 'Missed Call',
  landing_page: 'Landing Page (organic)',
  direct: 'Direct',
  unattributed: 'Unattributed',
};

function channelLabel(channel) {
  return CHANNEL_LABELS[channel] ?? channel;
}

const CARD = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#e2e8f0',
  borderRadius: '8px',
  padding: '7px 12px',
  fontSize: '13px',
  outline: 'none',
  width: '100%',
};

function fmtDollars(cents) {
  if (cents === null || cents === undefined) return '—';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CacCell({ cents }) {
  if (cents === null || cents === undefined) return <span className="text-slate-500">—</span>;
  const dollars = cents / 100;
  const color = dollars <= 100 ? 'text-emerald-400' : dollars <= 300 ? 'text-yellow-300' : 'text-red-300';
  return <span className={color}>{fmtDollars(cents)}</span>;
}

function PaybackCell({ months }) {
  if (months === null || months === undefined) return <span className="text-slate-500">—</span>;
  const color = months <= 3 ? 'text-emerald-400' : months <= 6 ? 'text-yellow-300' : 'text-red-300';
  return <span className={color}>{months.toFixed(1)} mo</span>;
}

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

export default function CacDashboard({ token }) {
  const [from, setFrom]       = useState(defaultFrom());
  const [to, setTo]           = useState(defaultTo());
  const [rows, setRows]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  function handleLoad() {
    setError('');
    setLoading(true);
    fetchCacPayback(token, { from, to })
      .then(data => setRows(Array.isArray(data) ? data : []))
      .catch(e => setError(e.detail || e.message || 'Failed to load CAC/payback data'))
      .finally(() => setLoading(false));
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-0.5">CAC / Payback by Channel</h2>
        <p className="text-xs text-slate-500">Revenue, churn, spend and CAC/payback per acquisition channel.</p>
      </div>

      <div className="rounded-xl p-5 space-y-4" style={CARD}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ ...INPUT_STYLE, colorScheme: 'dark' }} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ ...INPUT_STYLE, colorScheme: 'dark' }} />
          </div>
        </div>
        <button
          type="button"
          onClick={handleLoad}
          disabled={loading}
          className="px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15', border: '1px solid rgba(250,204,21,0.25)' }}
        >
          {loading ? 'Loading…' : 'Load Report'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {rows !== null && (
        <div className="rounded-xl overflow-hidden" style={CARD}>
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No channel activity in this window.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Channel', 'New Customers', 'Revenue', 'Churn', 'Spend', 'CAC', 'Payback (mo)'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.channel} style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <td className="px-4 py-3 text-slate-300">
                        {channelLabel(row.channel)}
                        {AUTO_CHANNELS.has(row.channel) && <span className="ml-1.5 text-yellow-400 text-[10px] align-middle">(auto)</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{row.new_customers}</td>
                      <td className="px-4 py-3 text-slate-200">{fmtDollars(row.revenue_cents)}</td>
                      <td className="px-4 py-3 text-slate-300">{fmtDollars(row.churn_cents)} <span className="text-slate-500 text-xs">({row.churned_count})</span></td>
                      <td className="px-4 py-3 text-slate-300">{fmtDollars(row.spend_cents)}</td>
                      <td className="px-4 py-3 font-semibold"><CacCell cents={row.cac_cents} /></td>
                      <td className="px-4 py-3 font-semibold"><PaybackCell months={row.payback_months} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
