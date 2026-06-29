/**
 * Admin Commission Ledger section — /admin/commissions
 * Full ledger (all brokers). Filter by status. CSV export. Dispute action.
 * Fee-flag aware: hides net_lines when omitted.
 * Spec §4.6, plan A-FE-2.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminContext } from '../adminContext.js';
import { fetchCommissions, disputeCommission, exportCommissionsCsv } from '../../../api/commissions.js';
import Modal from '../../ui/Modal.jsx';
import LoadingSpinner from '../../ui/LoadingSpinner.jsx';
import EmptyState from '../../ui/EmptyState.jsx';
import Pagination from '../../ui/Pagination.jsx';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function NetLinesCell({ netLines, party = 'broker' }) {
  if (netLines === null || netLines === undefined) {
    return <span className="text-xs text-slate-500 italic">Pending compliance clearance</span>;
  }
  const line = netLines.find(l => l.party === party);
  return <span className="text-sm text-fa-text-primary">{line ? formatCents(line.amount_cents) : '—'}</span>;
}

function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 4000);
  }
  useEffect(() => () => clearTimeout(timerRef.current), []);
  return { toast, showToast };
}

function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div
      role={isErr ? 'alert' : 'status'}
      className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl text-sm shadow-lg ${
        isErr ? 'text-red-400 bg-red-950/90 border border-red-800/60' : 'text-emerald-400 bg-emerald-950/90 border border-emerald-800/60'
      }`}
    >
      {toast.msg}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dispute confirm modal
// ---------------------------------------------------------------------------

function DisputeModal({ isOpen, onClose, onConfirm, loading, entry }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark as Disputed">
      <div className="space-y-4 mt-2">
        <p className="text-sm text-fa-text-secondary">
          This will set entry <strong className="text-fa-text-primary">{entry?.entry_id?.slice(0, 8)}…</strong> to <em>disputed</em>.
          The original entry is never altered — resolution posts a new offsetting entry (backend).
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Marking…' : 'Confirm dispute'}
          </button>
          <button onClick={onClose}
            className="px-4 text-fa-text-muted hover:text-fa-text-primary border border-fa-border-default rounded-lg text-sm">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;
const STATUS_FILTERS = ['all', 'posted', 'disputed', 'reconciled'];

export default function CommissionsSection() {
  const { token } = useAdminContext();
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [brokerFilter, setBrokerFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [disputeEntry, setDisputeEntry] = useState(null);
  const [disputeLoading, setDisputeLoading] = useState(false);
  const { toast, showToast } = useToast();

  const load = useCallback(async (signal) => {
    setLoading(true);
    try {
      // Pass admin token via localStorage presence — commissions.js auto-detects
      const data = await fetchCommissions({ signal });
      setCommissions(data.commissions || []);
    } catch (err) {
      if (err?.name !== 'AbortError') showToast('Failed to load commissions', 'error');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const brokerOptions = [...new Set(commissions.map(c => c.broker_name).filter(Boolean))].sort();
  const filtered = commissions
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => brokerFilter === 'all' || c.broker_name === brokerFilter)
    .filter(c => !dateFrom || c.posted_at >= dateFrom)
    .filter(c => !dateTo   || c.posted_at <= dateTo + 'T23:59:59Z');
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDispute(entryId) {
    setDisputeLoading(true);
    try {
      await disputeCommission(entryId);
      showToast('Entry marked as disputed');
      setDisputeEntry(null);
      load();
    } catch (err) {
      showToast(err?.detail || 'Failed to dispute entry', 'error');
    } finally {
      setDisputeLoading(false);
    }
  }

  // Determine if any entry has fee surfaces gated to show/hide net columns
  const anyFeeSurfacesVisible = filtered.some(c => c.net_lines != null);

  return (
    <div className="px-6 py-6">
      {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-fa-text-primary">Commission Ledger</h2>
            <p className="text-sm text-fa-text-muted mt-0.5">Append-only. Corrections post as new offsetting entries.</p>
          </div>
          <button
            onClick={() => exportCommissionsCsv(filtered)}
            disabled={filtered.length === 0}
            className="text-xs bg-fa-bg-card border border-fa-border-default text-fa-text-secondary hover:text-fa-text-primary px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>

        {/* Broker + date filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={brokerFilter}
            onChange={e => { setBrokerFilter(e.target.value); setPage(1); }}
            className="text-xs bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
          >
            <option value="all">All brokers</option>
            {brokerOptions.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-fa-text-muted">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className="text-xs bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-fa-text-muted">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
              className="text-xs bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
            />
          </div>
          {(brokerFilter !== 'all' || dateFrom || dateTo) && (
            <button
              onClick={() => { setBrokerFilter('all'); setDateFrom(''); setDateTo(''); setPage(1); }}
              className="text-xs text-fa-text-muted hover:text-fa-text-secondary underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 p-1 rounded-xl w-fit mb-5" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
              style={{
                background: statusFilter === f ? 'rgba(250,204,21,0.15)' : 'transparent',
                color: statusFilter === f ? '#facc15' : '#94a3b8',
                boxShadow: statusFilter === f ? 'inset 0 0 0 1px rgba(250,204,21,0.25)' : 'none',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No commission entries found" />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-fa-border-default mb-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-fa-border-default">
                    {[
                      'Date', 'Prospect', 'Broker', 'Gross',
                      anyFeeSurfacesVisible ? 'Net — Broker' : null,
                      anyFeeSurfacesVisible ? 'Net — Platform' : null,
                      'Split', 'Status', '',
                    ].filter(Boolean).map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-medium text-fa-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(c => (
                    <tr key={c.entry_id} className="border-b border-fa-border-default hover:bg-fa-bg-card/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-fa-text-muted whitespace-nowrap">{formatDate(c.posted_at)}</td>
                      <td className="px-4 py-3 text-sm text-fa-text-primary">{c.prospect_address || c.prospect_id}</td>
                      <td className="px-4 py-3 text-sm text-fa-text-secondary">{c.broker_name || c.broker_id}</td>
                      <td className="px-4 py-3 text-sm text-fa-text-primary">{formatCents(c.gross_amount_cents)}</td>
                      {anyFeeSurfacesVisible && (
                        <>
                          <td className="px-4 py-3"><NetLinesCell netLines={c.net_lines} party="broker" /></td>
                          <td className="px-4 py-3"><NetLinesCell netLines={c.net_lines} party="platform" /></td>
                        </>
                      )}
                      <td className="px-4 py-3 text-xs text-fa-text-muted">{c.split_config_id?.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        {c.status === 'posted' && (
                          <button
                            onClick={() => setDisputeEntry(c)}
                            className="text-xs text-red-400 hover:text-red-300 hover:underline"
                          >
                            Dispute
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        )}

      <DisputeModal
        isOpen={!!disputeEntry}
        onClose={() => setDisputeEntry(null)}
        onConfirm={() => handleDispute(disputeEntry?.entry_id)}
        loading={disputeLoading}
        entry={disputeEntry}
      />

      <Toast toast={toast} />
    </div>
  );
}
