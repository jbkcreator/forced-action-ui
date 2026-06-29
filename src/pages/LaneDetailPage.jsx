/**
 * Admin lane detail page — /admin/brokers-lanes/:laneId
 * Read-only: stage timeline + full broker transition log.
 * Spec §4.2/§4.3, plan A-FE-1.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminContext } from '../components/admin/adminContext.js';
import { fetchAdminLane, fetchAdminLaneTransitions } from '../api/loanLane.js';
import { workStateLabel, workStateColors, LANE_OUTCOME_LABELS, LANE_OUTCOME_COLORS } from '../config/brokerStates.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';

function WorkStateBadge({ state }) {
  const { bg, text } = workStateColors(state);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {workStateLabel(state)}
    </span>
  );
}

function OutcomeBadge({ outcome }) {
  const colors = LANE_OUTCOME_COLORS[outcome] || { bg: 'bg-slate-800', text: 'text-slate-400' };
  const label = LANE_OUTCOME_LABELS[outcome] || outcome;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
      {label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function LaneDetailPage() {
  const { laneId } = useParams();
  const navigate = useNavigate();
  const { token } = useAdminContext();
  const [lane, setLane] = useState(null);
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (signal) => {
    if (!laneId || !token) return;
    setLoading(true);
    try {
      const [laneData, transData] = await Promise.all([
        fetchAdminLane(token, laneId, { signal }),
        fetchAdminLaneTransitions(token, laneId, { signal }),
      ]);
      setLane(laneData);
      setTransitions(transData.transitions || []);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setError(err?.message || 'Failed to load lane');
    } finally {
      setLoading(false);
    }
  }, [laneId, token]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-16"><LoadingSpinner /></div>
    );
  }

  if (error || !lane) {
    return (
      <div className="px-6 py-6">
        <p className="text-red-400 text-sm">{error || 'Lane not found'}</p>
        <button onClick={() => navigate('/admin/brokers-lanes')} className="text-xs text-fa-primary hover:underline mt-2">← Back</button>
      </div>
    );
  }

  const p = lane.prospect || {};

  return (
    <div className="px-6 py-6 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => navigate('/admin/brokers-lanes')}
        className="text-xs text-slate-400 hover:text-fa-primary mb-4 inline-flex items-center gap-1"
      >
        ← All lanes
      </button>

      {/* Prospect header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-fa-text-primary">{p.address || 'Unknown address'}</h2>
        <p className="text-sm text-fa-text-muted">
          {p.county ? <span className="text-fa-text-secondary font-medium">{p.county} County · </span> : null}
          {p.city}, {p.state} — {p.owner_name}
        </p>
      </div>

      {/* Lane status card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'County',      value: <span className="text-sm text-fa-text-primary">{p.county ? `${p.county} County` : <span className="italic text-fa-text-muted">Unknown</span>}</span> },
          { label: 'Outcome',     value: <OutcomeBadge outcome={lane.outcome} /> },
          { label: 'Work state',  value: <WorkStateBadge state={lane.current_work_state} /> },
          { label: 'Lane stage',  value: <span className="text-sm text-fa-text-primary">{lane.current_stage_display || lane.current_stage}</span> },
          { label: 'Broker',      value: <span className="text-sm text-fa-text-primary">{lane.assigned_broker_name || <span className="italic text-fa-text-muted">Unassigned</span>}</span> },
          { label: 'Lender',      value: <span className="text-sm text-fa-text-primary">{lane.lender_name || <span className="italic text-fa-text-muted">Not set</span>}</span> },
        ].map(({ label, value }) => (
          <div key={label} className="p-3 rounded-lg bg-fa-bg-card border border-fa-border-default">
            <p className="text-xs text-fa-text-muted mb-1">{label}</p>
            {value}
          </div>
        ))}
      </div>

      {/* Transition history */}
      <div>
        <h3 className="text-xs font-semibold text-fa-text-muted uppercase tracking-wider mb-3">Transition History (append-only)</h3>
        {transitions.length === 0 ? (
          <p className="text-sm text-fa-text-muted">No transitions recorded.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-fa-border-default">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-fa-border-default">
                  {['Date', 'New state', 'From', 'Reason', 'Actor'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-medium text-fa-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...transitions].reverse().map(t => (
                  <tr key={t.transition_id} className="border-b border-fa-border-default hover:bg-fa-bg-card/50 transition-colors">
                    <td className="px-4 py-2.5 text-xs text-fa-text-muted whitespace-nowrap">{formatDate(t.occurred_at)}</td>
                    <td className="px-4 py-2.5"><WorkStateBadge state={t.to_state} /></td>
                    <td className="px-4 py-2.5 text-xs text-fa-text-secondary">{t.from_state || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-fa-text-secondary">{t.reason_code?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 text-xs text-fa-text-muted">{t.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
