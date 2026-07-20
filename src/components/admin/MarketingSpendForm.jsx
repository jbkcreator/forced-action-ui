import { useState, useEffect, useCallback } from 'react';
import { createMarketingSpend, fetchMarketingSpend } from '../../api/admin';

const CHANNELS = [
  { value: 'meta', label: 'Meta' },
  { value: 'google', label: 'Google' },
  { value: 'dbpr_email', label: 'DBPR Email (Instantly)' },
];
const CHANNEL_LABELS = Object.fromEntries(CHANNELS.map(c => [c.value, c.label]));

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

function fmtDollars(val) {
  if (val === null || val === undefined) return '—';
  return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const EMPTY_FORM = { channel: '', campaignKey: '', periodStart: '', periodEnd: '', amount: '', notes: '' };

export default function MarketingSpendForm({ token }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })); }

  const loadRows = useCallback(() => {
    setLoadingRows(true);
    fetchMarketingSpend(token)
      .then(data => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoadingRows(false));
  }, [token]);

  useEffect(() => { loadRows(); }, [loadRows]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.channel) { setError('Channel is required.'); return; }
    const amount = parseFloat(form.amount);
    if (!(amount > 0)) { setError('Amount must be greater than 0.'); return; }
    if (!form.periodStart || !form.periodEnd) { setError('Period start and end are required.'); return; }
    if (form.periodEnd < form.periodStart) { setError('Period end must be on or after period start.'); return; }

    setSubmitting(true);
    try {
      await createMarketingSpend(token, {
        channel: form.channel,
        campaign_key: form.campaignKey.trim() || undefined,
        period_start: form.periodStart,
        period_end: form.periodEnd,
        amount,
        notes: form.notes.trim() || undefined,
      });
      setSuccess('Spend saved.');
      setForm(EMPTY_FORM);
      loadRows();
    } catch (err) {
      setError(err.detail || err.message || 'Failed to save spend.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-0.5">Marketing Spend</h2>
        <p className="text-xs text-slate-500">Manually enter Meta/Google/email spend per period. Quora and affiliate cost are auto-sourced.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl p-5 space-y-4" style={CARD}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Channel</label>
            <select value={form.channel} onChange={e => set('channel', e.target.value)} style={{ ...INPUT_STYLE, colorScheme: 'dark' }}>
              <option value="">— Select channel —</option>
              {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Campaign Key (optional)</label>
            <input type="text" placeholder="e.g. spring_2026" value={form.campaignKey} onChange={e => set('campaignKey', e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Amount ($)</label>
            <input type="number" min="0.01" step="0.01" placeholder="500.00" value={form.amount} onChange={e => set('amount', e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Period Start</label>
            <input type="date" value={form.periodStart} onChange={e => set('periodStart', e.target.value)} style={{ ...INPUT_STYLE, colorScheme: 'dark' }} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Period End</label>
            <input type="date" value={form.periodEnd} onChange={e => set('periodEnd', e.target.value)} style={{ ...INPUT_STYLE, colorScheme: 'dark' }} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Notes (optional)</label>
            <input type="text" value={form.notes} onChange={e => set('notes', e.target.value)} style={INPUT_STYLE} />
          </div>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl px-4 py-3 text-sm text-emerald-300" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15', border: '1px solid rgba(250,204,21,0.25)' }}
        >
          {submitting ? 'Saving…' : 'Save Spend'}
        </button>
      </form>

      <div className="rounded-xl overflow-hidden" style={CARD}>
        {loadingRows ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No spend entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Channel', 'Campaign', 'Period', 'Amount', 'Notes'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id} style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <td className="px-4 py-3 text-slate-300">{CHANNEL_LABELS[row.channel] ?? row.channel}</td>
                    <td className="px-4 py-3 text-slate-300">{row.campaign_key ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{row.period_start} → {row.period_end}</td>
                    <td className="px-4 py-3 text-slate-200">{fmtDollars(row.amount)}</td>
                    <td className="px-4 py-3 text-slate-400">{row.notes ?? '—'}</td>
                  </tr>
                ))}
                <tr>
                  <td className="px-4 py-3 text-slate-300">quora</td>
                  <td className="px-4 py-3 text-slate-500" colSpan={3}>auto-sourced from quora_topics.cumulative_spend</td>
                  <td className="px-4 py-3 text-yellow-400 text-xs">(auto)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-300">affiliate</td>
                  <td className="px-4 py-3 text-slate-500" colSpan={3}>auto-sourced from affiliate_payout_ledger</td>
                  <td className="px-4 py-3 text-yellow-400 text-xs">(auto)</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
