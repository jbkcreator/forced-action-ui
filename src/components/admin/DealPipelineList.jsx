import { useCallback, useEffect, useState } from 'react';
import { fetchSubscriberDeals, updateDealStage } from '../../api/admin';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };
const inputCls = 'rounded-lg px-2 py-1 text-xs bg-white/5 border border-white/10 text-slate-200 focus:outline-none focus:ring-1 focus:ring-yellow-400/40';

const STAGES = ['lead', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

const STAGE_COLOR = {
  lead:        '#94a3b8',
  contacted:   '#a5b4fc',
  qualified:   '#fbbf24',
  proposal:    '#fb923c',
  negotiation: '#f87171',
  closed_won:  '#34d399',
  closed_lost: '#64748b',
};

export default function DealPipelineList({ token, subscriberId }) {
  const [items, setItems] = useState([]);
  const [includeClosed, setIncludeClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchSubscriberDeals(token, subscriberId, includeClosed)
      .then(d => setItems(d.items || []))
      .catch(e => setErr(e.detail || e.message))
      .finally(() => setLoading(false));
  }, [token, subscriberId, includeClosed]);

  useEffect(() => { if (subscriberId) load(); }, [load, subscriberId]);

  async function setStage(dealId, stage) {
    setSavingId(dealId);
    try {
      await updateDealStage(token, dealId, stage);
      await load();
    } catch (e) {
      setErr(e.detail || e.message);
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <p className="text-slate-500 text-sm">Loading…</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400 flex items-center gap-2">
          <input type="checkbox" checked={includeClosed}
            onChange={e => setIncludeClosed(e.target.checked)} />
          Include closed
        </label>
        {err && <span className="text-xs text-red-400">{err}</span>}
      </div>
      <div className="rounded-xl overflow-hidden" style={card}>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wide">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Lead Source</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-slate-500 text-center">No deals.</td></tr>
            )}
            {items.map(d => (
              <tr key={d.id} className="border-b border-white/5 text-slate-300">
                <td className="px-4 py-3 text-xs font-mono text-slate-500">{d.id}</td>
                <td className="px-4 py-3">
                  <select
                    className={inputCls}
                    value={d.pipeline_stage || 'lead'}
                    disabled={savingId === d.id}
                    onChange={e => setStage(d.id, e.target.value)}
                    style={{ color: STAGE_COLOR[d.pipeline_stage || 'lead'] }}
                  >
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs">{d.deal_size_bucket || '—'}</td>
                <td className="px-4 py-3 text-xs">
                  {d.deal_amount != null ? `$${d.deal_amount.toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3 text-xs">{d.lead_source || '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {d.deal_date || (d.created_at ? d.created_at.slice(0, 10) : '—')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
