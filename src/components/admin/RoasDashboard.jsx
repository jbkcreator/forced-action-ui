import { useState } from 'react';
import { fetchRoas } from '../../api/admin';

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

function RoasCell({ value }) {
  if (value === null || value === undefined) return <span className="text-slate-500">—</span>;
  const n = Number(value);
  const color = n >= 3 ? 'text-emerald-400' : n >= 1 ? 'text-yellow-300' : 'text-red-300';
  return <span className={color}>{n.toFixed(2)}x</span>;
}

export default function RoasDashboard({ token }) {
  const [campaignId, setCampaignId]   = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [adSpend, setAdSpend]         = useState('');
  const [rows, setRows]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  function handleLoad() {
    setError('');
    setLoading(true);
    fetchRoas(token, { campaignId: campaignId.trim(), utmCampaign: utmCampaign.trim(), adSpend: adSpend.trim() })
      .then(data => setRows(Array.isArray(data) ? data : (data?.rows ?? [])))
      .catch(e => setError(e.detail || e.message || 'Failed to load ROAS data'))
      .finally(() => setLoading(false));
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-white mb-0.5">ROAS / Campaign Performance</h2>
        <p className="text-xs text-slate-500">Campaign-level return on ad spend from Meta CAPI purchase events.</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl p-5 space-y-4" style={CARD}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Campaign ID</label>
            <input
              type="text"
              placeholder="e.g. 120208…"
              value={campaignId}
              onChange={e => setCampaignId(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">UTM Campaign</label>
            <input
              type="text"
              placeholder="e.g. spring_2026"
              value={utmCampaign}
              onChange={e => setUtmCampaign(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Ad Spend Override ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 500.00"
              value={adSpend}
              onChange={e => setAdSpend(e.target.value)}
              style={INPUT_STYLE}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleLoad}
          disabled={loading}
          className="px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15', border: '1px solid rgba(250,204,21,0.25)' }}
        >
          {loading ? 'Loading…' : 'Load ROAS'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {/* Table */}
      {rows !== null && (
        <div className="rounded-xl overflow-hidden" style={CARD}>
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No campaigns found for the given filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Campaign ID', 'UTM Campaign', 'Total Revenue', 'Ad Spend', 'ROAS', 'Purchases'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={row.campaign_id ?? i}
                      style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                    >
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{row.campaign_id ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{row.utm_campaign ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-200">{fmtDollars(row.total_revenue)}</td>
                      <td className="px-4 py-3 text-slate-300">{fmtDollars(row.ad_spend)}</td>
                      <td className="px-4 py-3 font-semibold"><RoasCell value={row.roas} /></td>
                      <td className="px-4 py-3 text-slate-300">{row.purchase_count ?? '—'}</td>
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
