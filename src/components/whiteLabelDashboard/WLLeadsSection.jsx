import { useState } from 'react';
import useApi from '../../hooks/useApi.js';
import { wlGetLeads } from '../../api/whiteLabelClient.js';
import Pagination from '../ui/Pagination.jsx';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';

const TIER_COLORS = {
  'Ultra Platinum': 'text-purple-400',
  'Platinum': 'text-blue-400',
  'Gold': 'text-yellow-400',
};

// Score thresholds map to the lead tiers (config/scoring.py):
// Gold 57+, Platinum 83+, Ultra Platinum 95+.
const SCORE_OPTIONS = [
  { value: 57, label: 'All Gold+ (57+)' },
  { value: 83, label: 'Platinum+ (83+)' },
  { value: 95, label: 'Ultra Platinum (95+)' },
];

export default function WLLeadsSection() {
  const [page, setPage] = useState(1);
  const [minScore, setMinScore] = useState(57);
  const [countyId, setCountyId] = useState('');

  // Reset to page 1 whenever a filter changes so we never land on an empty page.
  const handleScore = (v) => { setMinScore(v); setPage(1); };
  const handleCounty = (v) => { setCountyId(v); setPage(1); };

  const { data, loading, error } = useApi(
    () => wlGetLeads({ page, limit: 25, min_score: minScore, ...(countyId && { county_id: countyId }) }),
    [page, minScore, countyId],
  );

  const leads = data?.leads || [];
  const total = data?.total || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-fa-text-primary">Leads</h2>
          <p className="text-fa-text-muted text-sm">{total.toLocaleString()} leads match your filters</p>
        </div>
        <div className="flex gap-3">
          <select value={minScore} onChange={e => handleScore(+e.target.value)}
            className="bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-1.5 text-sm text-fa-text-primary">
            {SCORE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input placeholder="Filter county…" value={countyId} onChange={e => handleCounty(e.target.value)}
            className="bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-1.5 text-sm text-fa-text-primary w-36" />
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && leads.length === 0 && (
        <div className="text-center py-16 text-fa-text-muted">No leads found. Adjust your filters or county scope in Settings.</div>
      )}

      {leads.length > 0 && (
        <>
          <div className="bg-fa-bg-card border border-fa-border-default rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-fa-border-default bg-fa-bg-base">
                  <th className="px-4 py-3 text-left text-fa-text-muted font-medium">Address</th>
                  <th className="px-4 py-3 text-left text-fa-text-muted font-medium">County</th>
                  <th className="px-4 py-3 text-right text-fa-text-muted font-medium">Score</th>
                  <th className="px-4 py-3 text-left text-fa-text-muted font-medium">Tier</th>
                  <th className="px-4 py-3 text-left text-fa-text-muted font-medium">Owner</th>
                  <th className="px-4 py-3 text-left text-fa-text-muted font-medium">Phone</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b border-fa-border-default hover:bg-fa-bg-base/50 transition-colors">
                    <td className="px-4 py-2.5 text-fa-text-primary font-medium">{lead.address}</td>
                    <td className="px-4 py-2.5 text-fa-text-secondary capitalize">{lead.county_id}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-fa-text-primary">{lead.score}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-bold ${TIER_COLORS[lead.tier] || 'text-fa-text-muted'}`}>{lead.tier}</span>
                    </td>
                    <td className="px-4 py-2.5 text-fa-text-secondary">{lead.owner_name || '—'}</td>
                    <td className="px-4 py-2.5 text-fa-text-secondary font-mono text-xs">{lead.phone_1 || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Pagination page={page} totalPages={Math.ceil(total / 25)} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
