/**
 * Broker "My Commissions" section.
 * Broker-scoped read of the commission ledger.
 * Fee-flag aware: when net_lines is omitted (fee_config_flag OFF — pre-RESPA), shows a placeholder.
 * Spec §4.6 + plan B-FE-3.
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchCommissions } from '../../api/commissions.js';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';
import EmptyState from '../ui/EmptyState.jsx';

function formatCents(cents) {
  if (cents == null) return '—';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_STYLES = {
  posted:      'bg-emerald-900/40 text-emerald-300',
  disputed:    'bg-red-900/40 text-red-400',
  reconciled:  'bg-blue-900/40 text-blue-300',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status] || 'bg-slate-800 text-slate-400'}`}>
      {status}
    </span>
  );
}

function NetLinesCell({ netLines }) {
  if (netLines === null || netLines === undefined) {
    return (
      <span className="text-xs text-slate-500 italic">Pending compliance clearance</span>
    );
  }
  const broker = netLines.find(l => l.party === 'broker');
  return (
    <span className="text-sm text-fa-text-primary">
      {broker ? formatCents(broker.amount_cents) : '—'}
    </span>
  );
}

export default function BrokerCommissionsSection() {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countyFilter, setCountyFilter] = useState('all');

  const load = useCallback(async (signal) => {
    setLoading(true);
    try {
      const data = await fetchCommissions({ signal });
      setCommissions(data.commissions || []);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setError(err?.message || 'Failed to load commissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-6 text-red-400 text-sm">{error}</div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-4xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-fa-text-primary mb-1">My Commissions</h2>
            <p className="text-sm text-fa-text-muted">Append-only record of your earnings. Contact admin to dispute an entry.</p>
          </div>
          {/* County filter */}
          {commissions.length > 0 && (
            <select
              value={countyFilter}
              onChange={e => setCountyFilter(e.target.value)}
              className="text-xs bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
            >
              <option value="all">All counties</option>
              {[...new Set(commissions.map(c => c.prospect_county).filter(Boolean))].sort().map(c => (
                <option key={c} value={c}>{c} County</option>
              ))}
            </select>
          )}
        </div>

        {(() => {
          const filtered = commissions.filter(c => countyFilter === 'all' || c.prospect_county === countyFilter);
          return filtered.length === 0 ? (
          <EmptyState message={commissions.length === 0 ? 'No commission entries yet' : `No entries in ${countyFilter} County`} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-fa-border-default">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-fa-border-default">
                  {['Date', 'Prospect', 'Gross', 'Your Cut', 'Split', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-medium text-fa-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.entry_id} className="border-b border-fa-border-default hover:bg-fa-bg-card/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-fa-text-muted whitespace-nowrap">{formatDate(c.posted_at)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-fa-text-primary">{c.prospect_address || c.prospect_id}</p>
                      {c.prospect_county && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-800 text-slate-300 mt-0.5">{c.prospect_county}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-fa-text-primary">{formatCents(c.gross_amount_cents)}</td>
                    <td className="px-4 py-3"><NetLinesCell netLines={c.net_lines} /></td>
                    <td className="px-4 py-3 text-xs text-fa-text-muted">{c.split_config_id?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        })()}
      </div>
    </div>
  );
}
