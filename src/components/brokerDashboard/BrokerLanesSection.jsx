/**
 * Broker lane workspace — lean 3-panel layout (list / detail / action).
 * NO Aircall / dialer / call-recording. Broker calls externally and logs outcome here.
 * Spec §4.2/§4.3 + plan B-FE-2.
 * Features: pool/claim (D3), contact masking (D15), stale badge (D14), lender picker (D12).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchBrokerLanes,
  fetchPool,
  claimLane,
  fetchLane,
  fetchLaneTransitions,
  transitionLane,
  advanceLaneStage,
  fetchLaneStageConfig,
  fetchCommissionSplits,
  fetchClearedLenders,
  setLaneLender,
} from '../../api/broker.js';
import {
  workStateLabel,
  workStateColors,
  REASON_CODES,
  LANE_OUTCOME_LABELS,
  LANE_OUTCOME_COLORS,
} from '../../config/brokerStates.js';
import { useBrokerContext } from './BrokerContext.jsx';
import Modal from '../ui/Modal.jsx';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import LaneFilterBar, { LanePagination } from '../ui/LaneFilterBar.jsx';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

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
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
      {LANE_OUTCOME_LABELS[outcome] || outcome}
    </span>
  );
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
        isErr
          ? 'text-red-400 bg-red-950/90 border border-red-800/60'
          : 'text-emerald-400 bg-emerald-950/90 border border-emerald-800/60'
      }`}
    >
      {toast.msg}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Left panel — Pool tab (unclaimed prospects, D15 redacted)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Pool view — full-width card grid, no detail panel
// ---------------------------------------------------------------------------

function PoolView({ pool, poolTotal, poolLoading, poolFilters, onPoolFilterChange, poolOffset, onPoolPageChange, onClaimed, onRemoveFromPool, onRefreshPool, showToast }) {
  const [claimingId, setClaimingId] = useState(null);

  async function handleClaim(laneId) {
    setClaimingId(laneId);
    try {
      const claimedLane = await claimLane(laneId);
      showToast('Lane claimed — contact details now visible');
      onRemoveFromPool(laneId);
      onClaimed(claimedLane);
    } catch (err) {
      if (err?.status === 409) {
        showToast('Already claimed by another broker — refreshing pool…', 'error');
        onRefreshPool();
      } else {
        showToast(err?.detail || 'Failed to claim lane', 'error');
      }
    } finally {
      setClaimingId(null);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <LaneFilterBar filters={poolFilters} onChange={onPoolFilterChange} mode="pool" />
      {poolLoading ? (
        <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
      ) : pool.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState message="No unclaimed prospects match your filters" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0 p-4">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {pool.map(lane => {
              const p = lane.property || {};
              const scoreColor = lane.intent_score >= 80 ? 'bg-red-900/50 text-red-300' :
                lane.intent_score >= 65 ? 'bg-orange-900/50 text-orange-300' :
                'bg-slate-800 text-slate-400';
              return (
                <div key={lane.lane_id} className="rounded-xl border border-fa-border-default bg-fa-bg-card flex flex-col">
                  {/* Header: address + location + badges */}
                  <div className="px-4 pt-4 pb-3 border-b border-fa-border-default">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-fa-text-primary leading-snug">{p.address || '—'}</p>
                      <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded ${scoreColor}`}>
                        {lane.intent_score != null ? Math.round(lane.intent_score) : '—'}
                      </span>
                    </div>
                    <p className="text-xs text-fa-text-muted mb-2">{p.city}, {p.state} {p.zip}</p>
                    <div className="flex gap-1 flex-wrap">
                      {p.county && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-800 text-slate-300">{p.county}</span>
                      )}
                      {lane.intent_tier && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-fa-primary/10 text-fa-primary capitalize">{lane.intent_tier}</span>
                      )}
                    </div>
                  </div>
                  {/* Description — full, no clamp */}
                  <div className="px-4 py-3 flex-1">
                    {lane.lane_description ? (
                      <>
                        <p className="text-xs text-fa-text-secondary leading-relaxed">{lane.lane_description}</p>
                        {lane.description_outdated && (
                          <span className="inline-block mt-1.5 text-xs px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-400">Outdated</span>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-fa-text-muted italic">No description available.</p>
                    )}
                  </div>
                  {/* Footer: claim */}
                  <div className="px-4 pb-4 pt-2">
                    <p className="text-xs text-amber-500/80 italic mb-2">Contact revealed after claim</p>
                    <button
                      onClick={() => handleClaim(lane.lane_id)}
                      disabled={!!claimingId}
                      className="w-full text-xs bg-fa-primary text-fa-bg-base font-semibold py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {claimingId === lane.lane_id ? 'Claiming…' : 'Claim this lane'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <LanePagination total={poolTotal} limit={poolFilters?.limit || 50} offset={poolOffset} onPageChange={onPoolPageChange} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Left panel — My Lanes tab
// ---------------------------------------------------------------------------

function MyLanesPanel({ lanes, lanesTotal, selectedId, onSelect, loading, lanesFilters, onLanesFilterChange, lanesOffset, onLanesPageChange }) {
  const limit = lanesFilters?.limit || 50;

  return (
    <div className="flex flex-col w-72 shrink-0 border-r border-fa-border-default h-full min-h-0">
      <LaneFilterBar
        filters={lanesFilters}
        onChange={onLanesFilterChange}
        mode="broker"
        hiddenFilters={['date_range']}
      />
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : lanes.length === 0 ? (
          <EmptyState message="No lanes match your filters" />
        ) : (
          lanes.map(lane => (
            <button
              key={lane.lane_id}
              onClick={() => onSelect(lane.lane_id)}
              className={`w-full text-left px-4 py-3 border-b border-fa-border-default transition-colors ${
                selectedId === lane.lane_id
                  ? 'bg-fa-primary/5 border-l-2 border-l-fa-primary'
                  : 'hover:bg-fa-bg-card border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium text-fa-text-primary truncate flex-1">
                  {lane.property?.address || 'Unknown address'}
                </p>
                {lane.is_stale && (
                  <span className="shrink-0 text-xs font-bold px-1.5 py-0.5 rounded bg-orange-900/50 text-orange-300">
                    STALE
                  </span>
                )}
              </div>
              <p className="text-xs text-fa-text-muted truncate mt-0.5">
                {lane.property?.city}, {lane.property?.state} — {lane.property?.owner_name}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <WorkStateBadge state={lane.current_work_state} />
                <span className="text-xs text-fa-text-muted">{lane.current_stage_display || lane.current_stage}</span>
              </div>
            </button>
          ))
        )}
      </div>
      <LanePagination
        total={lanesTotal}
        limit={limit}
        offset={lanesOffset}
        onPageChange={onLanesPageChange}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Center panel — lane detail
// ---------------------------------------------------------------------------

function TransitionRow({ t }) {
  return (
    <tr className="border-b border-fa-border-default">
      <td className="py-2 pr-3 text-xs text-fa-text-muted whitespace-nowrap">{formatDate(t.occurred_at)}</td>
      <td className="py-2 pr-3"><WorkStateBadge state={t.to_state} /></td>
      <td className="py-2 pr-3 text-xs text-fa-text-secondary">{t.from_state || '—'}</td>
      <td className="py-2 pr-3 text-xs text-fa-text-secondary">{t.reason_code?.replace(/_/g, ' ')}</td>
      <td className="py-2 text-xs text-fa-text-muted truncate max-w-[120px]">{t.actor}</td>
    </tr>
  );
}

function LaneDetail({ lane, transitions, transitionsLoading, brokerId, brokerStates }) {
  if (!lane) {
    return (
      <div className="flex-1 flex items-center justify-center text-fa-text-muted text-sm">
        Select a lane to view details
      </div>
    );
  }

  const p = lane.property || {};
  // Contact visible only when this broker owns the lane (D15)
  const contactVisible = lane.assigned_broker_id && lane.assigned_broker_id === brokerId;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 min-w-0">
      {/* Stale warning banner */}
      {lane.is_stale && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-orange-900/30 border border-orange-700/50 flex items-center gap-2">
          <span className="text-orange-300 text-xs font-bold">STALE</span>
          <p className="text-xs text-orange-300/80">No activity for 30+ days. Update this lane or it may be reassigned.</p>
        </div>
      )}

      {/* Lender rejected banner */}
      {lane.current_work_state === 'lender_rejected' && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-900/30 border border-red-700/50">
          <p className="text-xs text-red-300 font-semibold mb-0.5">Lender declined</p>
          <p className="text-xs text-red-300/70">Select a new lender in the Actions panel and log <strong>Committed</strong> to retry, or close the lane.</p>
        </div>
      )}

      {/* Prospect identity */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-fa-text-primary mb-1">{p.address || '—'}</h3>
        <p className="text-sm text-fa-text-muted">
          {p.county ? <span className="text-fa-text-secondary font-medium">{p.county} County · </span> : null}
          {p.city}, {p.state} {p.zip}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-fa-text-muted mb-0.5">Owner</p>
            {contactVisible
              ? <p className="text-sm text-fa-text-primary">{p.owner_name || '—'}</p>
              : <p className="text-xs italic text-amber-500/80">Visible after claim</p>
            }
          </div>
          <div>
            <p className="text-xs text-fa-text-muted mb-0.5">Phone</p>
            {contactVisible
              ? <p className="text-sm text-fa-text-primary">{p.phone || '—'}</p>
              : <p className="text-xs italic text-amber-500/80">Visible after claim</p>
            }
          </div>
          <div>
            <p className="text-xs text-fa-text-muted mb-0.5">Email</p>
            {contactVisible
              ? <p className="text-sm text-fa-text-primary">{p.email || '—'}</p>
              : <p className="text-xs italic text-amber-500/80">Visible after claim</p>
            }
          </div>
          <div>
            <p className="text-xs text-fa-text-muted mb-0.5">Outcome</p>
            <OutcomeBadge outcome={lane.outcome} />
          </div>
        </div>
      </div>

      {/* Stage + work state + lender */}
      <div className="mb-6 p-3 rounded-lg bg-fa-bg-card border border-fa-border-default space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-fa-text-muted mb-1">Lane stage</p>
            <p className="text-sm font-medium text-fa-text-primary">{lane.current_stage_display || lane.current_stage}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-fa-text-muted mb-1">Work state</p>
            <WorkStateBadge state={lane.current_work_state} />
          </div>
        </div>
        <div>
          <p className="text-xs text-fa-text-muted mb-0.5">Funding lender</p>
          <p className="text-sm text-fa-text-primary">{lane.lender_name || <span className="italic text-fa-text-muted">Not set</span>}</p>
        </div>
      </div>

      {/* Transition history */}
      <div>
        <h4 className="text-xs font-semibold text-fa-text-muted uppercase tracking-wider mb-3">Transition History</h4>
        {transitionsLoading ? (
          <div className="flex justify-center py-4"><LoadingSpinner /></div>
        ) : transitions.length === 0 ? (
          <p className="text-xs text-fa-text-muted">No transitions recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-fa-border-default">
                  {['Date', 'New state', 'From', 'Reason', 'Actor'].map(h => (
                    <th key={h} className="pb-2 pr-3 text-xs text-fa-text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...transitions].reverse().map(t => (
                  <TransitionRow key={t.transition_id} t={t} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right panel — action panel (state machine + stage advance + lender picker)
// ---------------------------------------------------------------------------

function ClosedWonModal({ isOpen, onClose, onSubmit, loading, splits, splitsLoading }) {
  const [grossCents, setGrossCents] = useState('');
  const [splitId, setSplitId] = useState('');
  const [reasonCode, setReasonCode] = useState('funded');
  const [err, setErr] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const cents = Math.round(parseFloat(grossCents) * 100);
    if (!cents || cents <= 0) { setErr('Enter a valid dollar amount'); return; }
    if (!splitId) { setErr('Select a commission split'); return; }
    setErr('');
    onSubmit({ to_state: 'closed_won', reason_code: reasonCode, gross_amount_cents: cents, split_config_id: splitId });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Close Won — Record Commission">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="block text-sm font-medium text-fa-text-secondary mb-1">Gross amount ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={grossCents}
            onChange={e => setGrossCents(e.target.value)}
            required
            placeholder="e.g. 5000.00"
            className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-fa-text-secondary mb-1">Commission split</label>
          {splitsLoading ? <LoadingSpinner /> : (
            <select
              value={splitId}
              onChange={e => setSplitId(e.target.value)}
              required
              className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
            >
              <option value="">Select split…</option>
              {splits.map(s => (
                <option key={s.split_config_id} value={s.split_config_id}>
                  {s.name} ({s.parties.map(p => `${p.party} ${p.pct}%`).join(' / ')})
                </option>
              ))}
            </select>
          )}
        </div>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting…' : 'Confirm Close Won'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 text-fa-text-muted hover:text-fa-text-primary border border-fa-border-default rounded-lg text-sm">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

const LENDER_PICKER_STATES = new Set(['working', 'quoted', 'committed', 'lender_rejected', 'closed_won']);

const STAGE_WORK_STATE_GATE = {
  quoted:    ['quoted', 'lender_rejected', 'committed', 'closed_won'],
  committed: ['committed', 'closed_won'],
  funded:    ['closed_won'],
  dead:      ['closed_lost'],
};

function ActionPanel({ lane, stageConfig, stageConfigLoading, onTransition, onAdvanceStage, onLenderSet, transitionLoading, advanceLoading, showToast, brokerStates }) {
  const [selectedState, setSelectedState] = useState(null);
  const [reasonCode, setReasonCode] = useState('');
  const [showWonModal, setShowWonModal] = useState(false);
  const [splits, setSplits] = useState([]);
  const [splitsLoading, setSplitsLoading] = useState(false);
  const [selectedAdvanceStage, setSelectedAdvanceStage] = useState('');
  // Lender picker (D12)
  const [lenders, setLenders] = useState([]);
  const [lendersLoading, setLendersLoading] = useState(false);
  const [savingLender, setSavingLender] = useState(false);
  const [selectedLenderId, setSelectedLenderId] = useState(lane?.lender_id || '');

  const currentWorkState = lane?.current_work_state || 'unassigned';
  const nextStates = brokerStates?.allowed_transitions?.[currentWorkState] || [];
  const terminal = !nextStates.length;
  const showLenderPicker = LENDER_PICKER_STATES.has(currentWorkState);

  // Sync lender selection when lane changes
  useEffect(() => {
    setSelectedLenderId(lane?.lender_id || '');
  }, [lane?.lane_id, lane?.lender_id]);

  // Load lenders when relevant work state
  useEffect(() => {
    if (!showLenderPicker) return;
    setLendersLoading(true);
    fetchClearedLenders()
      .then(d => setLenders(d.lenders || []))
      .catch(() => setLenders([]))
      .finally(() => setLendersLoading(false));
  }, [showLenderPicker]);

  // Load splits when won modal opens
  useEffect(() => {
    if (!showWonModal) return;
    setSplitsLoading(true);
    fetchCommissionSplits()
      .then(d => setSplits(d.splits || []))
      .catch(() => setSplits([]))
      .finally(() => setSplitsLoading(false));
  }, [showWonModal]);

  async function handleLenderChange(lenderId) {
    setSelectedLenderId(lenderId);
    if (!lane || !lenderId) return;
    setSavingLender(true);
    try {
      await setLaneLender(lane.lane_id, lenderId);
      const found = lenders.find(l => l.lender_id === lenderId);
      onLenderSet(lenderId, found?.name || lenderId);
      showToast('Funding lender saved');
    } catch {
      showToast('Failed to save lender', 'error');
    } finally {
      setSavingLender(false);
    }
  }

  function handleTransitionClick(toState) {
    setSelectedState(toState);
    setReasonCode('');
  }

  function handleTransitionSubmit(e) {
    e.preventDefault();
    if (!reasonCode) return;
    onTransition({ to_state: selectedState, reason_code: reasonCode });
    setSelectedState(null);
    setReasonCode('');
  }

  function handleWonSubmit(body) {
    onTransition(body);
    setShowWonModal(false);
  }

  const currentStageKey = lane?.current_stage;
  const currentStageConfig = stageConfig.find(s => s.stage_key === currentStageKey);
  const allowedNextStageKeys = currentStageConfig?.allowed_next || [];
  const nextStageOptions = stageConfig.filter(s => allowedNextStageKeys.includes(s.stage_key));

  if (!lane) {
    return (
      <div className="w-64 shrink-0 border-l border-fa-border-default flex items-center justify-center text-fa-text-muted text-sm px-4 text-center">
        Select a lane to take action
      </div>
    );
  }

  return (
    <div className="w-64 shrink-0 border-l border-fa-border-default overflow-y-auto px-4 py-5">
      <h3 className="text-xs font-semibold text-fa-text-muted uppercase tracking-wider mb-4">Actions</h3>

      {/* Funding lender picker (D12) */}
      {showLenderPicker && (
        <div className="mb-6">
          <p className="text-xs text-fa-text-muted mb-2">Funding lender</p>
          {lendersLoading ? <LoadingSpinner /> : (
            <select
              value={selectedLenderId}
              onChange={e => handleLenderChange(e.target.value)}
              disabled={savingLender}
              className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary text-sm focus:outline-none focus:border-fa-primary disabled:opacity-60"
            >
              <option value="">Select funding lender…</option>
              {lenders.map(l => (
                <option key={l.lender_id} value={l.lender_id}>{l.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Stage advance control (D9) */}
      {nextStageOptions.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-fa-text-muted mb-2">Advance lane stage</p>
          {stageConfigLoading ? <LoadingSpinner /> : (
            <div className="space-y-1">
              {nextStageOptions.map(s => {
                const gateStates = STAGE_WORK_STATE_GATE[s.stage_key];
                const gated = gateStates && !gateStates.includes(currentWorkState);
                return (
                  <div key={s.stage_key}>
                    <button
                      onClick={() => { setSelectedAdvanceStage(s.stage_key); onAdvanceStage(s.stage_key); }}
                      disabled={advanceLoading || gated}
                      title={gated ? `Requires work state: ${gateStates.join(' or ')}` : undefined}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm border border-fa-border-default text-fa-text-secondary hover:bg-fa-bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {advanceLoading && selectedAdvanceStage === s.stage_key ? 'Advancing…' : `Advance to ${s.display_name}`}
                    </button>
                    {gated && (
                      <p className="text-xs text-amber-500/70 mt-0.5 px-1">
                        Log <span className="font-medium">{gateStates[0]}</span> work state first
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Work-state transitions */}
      <div className="mb-6">
        <p className="text-xs text-fa-text-muted mb-2">Log work state</p>
        {terminal ? (
          <p className="text-xs text-fa-text-muted italic">No further transitions available.</p>
        ) : (
          <div className="space-y-2">
            {nextStates.map(toState => (
              <button
                key={toState}
                onClick={() => handleTransitionClick(toState)}
                disabled={transitionLoading}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                  toState === 'closed_won'
                    ? 'border-emerald-600 text-emerald-300 hover:bg-emerald-900/30'
                    : toState === 'closed_lost'
                    ? 'border-red-700 text-red-400 hover:bg-red-900/20'
                    : 'border-fa-border-default text-fa-text-secondary hover:bg-fa-bg-card'
                }`}
              >
                → {workStateLabel(toState)}
              </button>
            ))}
          </div>
        )}

        {selectedState && (
          <form onSubmit={handleTransitionSubmit} className="mt-3 space-y-2">
            <p className="text-xs text-fa-text-muted">Reason for <strong className="text-fa-text-secondary">{workStateLabel(selectedState)}</strong></p>
            <select
              value={reasonCode}
              onChange={e => setReasonCode(e.target.value)}
              required
              autoFocus
              className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary text-sm focus:outline-none focus:border-fa-primary"
            >
              <option value="">Select reason…</option>
              {REASON_CODES.filter(r => (brokerStates?.reason_codes_by_state?.[selectedState] || []).includes(r.value)).map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!reasonCode || transitionLoading}
                className="flex-1 bg-fa-primary text-fa-bg-base font-medium py-1.5 rounded-lg text-sm disabled:opacity-50"
              >
                {transitionLoading ? 'Saving…' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedState(null)}
                className="px-3 py-1.5 text-fa-text-muted hover:text-fa-text-primary border border-fa-border-default rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <ClosedWonModal
        isOpen={showWonModal}
        onClose={() => setShowWonModal(false)}
        onSubmit={handleWonSubmit}
        loading={transitionLoading}
        splits={splits}
        splitsLoading={splitsLoading}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

const DEFAULT_POOL_FILTERS = { sort_by: 'intent_score', sort_dir: 'desc', limit: 50 };
const DEFAULT_LANES_FILTERS = { sort_by: 'last_activity', sort_dir: 'desc', limit: 50 };

export default function BrokerLanesSection() {
  const { broker, brokerStates } = useBrokerContext();

  // My Lanes
  const [lanes, setLanes] = useState([]);
  const [lanesTotal, setLanesTotal] = useState(null);
  const [lanesLoading, setLanesLoading] = useState(true);
  const [lanesFilters, setLanesFilters] = useState(DEFAULT_LANES_FILTERS);
  const [lanesOffset, setLanesOffset] = useState(0);

  // Pool
  const [pool, setPool] = useState([]);
  const [poolTotal, setPoolTotal] = useState(null);
  const [poolLoading, setPoolLoading] = useState(true);
  const [poolFilters, setPoolFilters] = useState(DEFAULT_POOL_FILTERS);
  const [poolOffset, setPoolOffset] = useState(0);

  // Lane detail
  const [selectedLaneId, setSelectedLaneId] = useState(null);
  const [selectedLane, setSelectedLane] = useState(null);
  const [laneLoading, setLaneLoading] = useState(false);
  const [transitions, setTransitions] = useState([]);
  const [transitionsLoading, setTransitionsLoading] = useState(false);
  const [stageConfig, setStageConfig] = useState([]);
  const [stageConfigLoading, setStageConfigLoading] = useState(false);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const { toast, showToast } = useToast();

  const loadLanes = useCallback(async (signal, filters = lanesFilters, offset = lanesOffset) => {
    setLanesLoading(true);
    try {
      const data = await fetchBrokerLanes({ ...filters, offset }, { signal });
      setLanes(data.lanes || []);
      setLanesTotal(data.total ?? null);
    } catch (err) {
      if (err?.name === 'AbortError') return;
    } finally {
      setLanesLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPool = useCallback(async (signal, filters = poolFilters, offset = poolOffset) => {
    setPoolLoading(true);
    try {
      const data = await fetchPool({ ...filters, offset }, { signal });
      setPool(data.lanes || []);
      setPoolTotal(data.total ?? null);
    } catch (err) {
      if (err?.name !== 'AbortError') showToast('Failed to load pool', 'error');
    } finally {
      setPoolLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load whenever filters or offset change (also fires on mount for initial load)
  useEffect(() => {
    const controller = new AbortController();
    loadLanes(controller.signal, lanesFilters, lanesOffset);
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanesFilters, lanesOffset]);

  useEffect(() => {
    const controller = new AbortController();
    loadPool(controller.signal, poolFilters, poolOffset);
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolFilters, poolOffset]);

  function handleLanesFilterChange(patch) {
    setLanesFilters(prev => ({ ...prev, ...patch }));
    setLanesOffset(0);
  }

  function handlePoolFilterChange(patch) {
    setPoolFilters(prev => ({ ...prev, ...patch }));
    setPoolOffset(0);
  }

  useEffect(() => {
    if (!selectedLaneId) { setSelectedLane(null); setTransitions([]); setStageConfig([]); return; }

    const controller = new AbortController();

    setLaneLoading(true);
    fetchLane(selectedLaneId, { signal: controller.signal })
      .then(lane => {
        setSelectedLane(lane);
        setStageConfigLoading(true);
        return fetchLaneStageConfig(lane.lane_type, { signal: controller.signal });
      })
      .then(data => setStageConfig(data.stages || []))
      .catch(err => { if (err?.name !== 'AbortError') showToast('Failed to load lane detail', 'error'); })
      .finally(() => { setLaneLoading(false); setStageConfigLoading(false); });

    setTransitionsLoading(true);
    fetchLaneTransitions(selectedLaneId, { signal: controller.signal })
      .then(data => setTransitions(data.transitions || []))
      .catch(() => {})
      .finally(() => setTransitionsLoading(false));

    return () => controller.abort();
  }, [selectedLaneId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Active tab: 'pool' | 'my-lanes'
  const [activeTab, setActiveTab] = useState('pool');

  function handleTabChange(newTab) {
    setActiveTab(newTab);
    // Auto-select first lane when switching to My Lanes
    if (newTab === 'my-lanes' && !selectedLaneId && lanes.length > 0) {
      setSelectedLaneId(lanes[0].lane_id);
    }
  }

  // Auto-select first lane when My Lanes data loads while tab is active
  useEffect(() => {
    if (activeTab === 'my-lanes' && !selectedLaneId && lanes.length > 0) {
      setSelectedLaneId(lanes[0].lane_id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanes]);

  // Called when pool claim succeeds — add the claimed lane to My Lanes, select it, switch tab
  function handleClaimed(claimedLane) {
    setLanes(prev => [claimedLane, ...prev.filter(l => l.lane_id !== claimedLane.lane_id)]);
    setSelectedLaneId(claimedLane.lane_id);
    setActiveTab('my-lanes');
  }

  function handleRemoveFromPool(laneId) {
    setPool(prev => prev.filter(l => l.lane_id !== laneId));
  }

  async function handleTransition(body) {
    if (!selectedLaneId) return;
    setTransitionLoading(true);
    try {
      await transitionLane(selectedLaneId, body);
      showToast(`Transitioned to ${workStateLabel(body.to_state)}`);
      const [laneData, transData] = await Promise.all([
        fetchLane(selectedLaneId),
        fetchLaneTransitions(selectedLaneId),
      ]);
      setSelectedLane(laneData);
      setTransitions(transData.transitions || []);
      loadLanes();
    } catch (err) {
      const msg = err?.status === 409 || err?.status === 422
        ? (err.detail || 'Transition not allowed')
        : 'Failed to transition';
      showToast(msg, 'error');
    } finally {
      setTransitionLoading(false);
    }
  }

  async function handleAdvanceStage(toStage) {
    if (!selectedLaneId) return;
    setAdvanceLoading(true);
    try {
      await advanceLaneStage(selectedLaneId, toStage);
      showToast('Lane stage advanced');
      const laneData = await fetchLane(selectedLaneId);
      setSelectedLane(laneData);
      loadLanes();
    } catch (err) {
      const msg = err?.status === 409 || err?.status === 422
        ? (err.detail || 'Stage advance not allowed')
        : 'Failed to advance stage';
      showToast(msg, 'error');
    } finally {
      setAdvanceLoading(false);
    }
  }

  function handleLenderSet(lenderId, lenderName) {
    setSelectedLane(prev => prev ? { ...prev, lender_id: lenderId, lender_name: lenderName } : prev);
    setLanes(prev => prev.map(l => l.lane_id === selectedLaneId ? { ...l, lender_id: lenderId, lender_name: lenderName } : l));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top tab bar */}
      <div className="px-4 pt-3 pb-0 shrink-0 border-b border-fa-border-default">
        <div className="flex gap-1 p-1 rounded-xl w-fit mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {[
            { id: 'pool',     label: `Pool${poolTotal != null ? ` (${poolTotal.toLocaleString()})` : ''}` },
            { id: 'my-lanes', label: `My Lanes${lanesTotal != null ? ` (${lanesTotal.toLocaleString()})` : ''}` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === t.id ? 'rgba(250,204,21,0.15)' : 'transparent',
                color: activeTab === t.id ? '#facc15' : '#94a3b8',
                boxShadow: activeTab === t.id ? 'inset 0 0 0 1px rgba(250,204,21,0.25)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0">
        {activeTab === 'pool' ? (
          <PoolView
            pool={pool}
            poolTotal={poolTotal}
            poolLoading={poolLoading}
            poolFilters={poolFilters}
            onPoolFilterChange={handlePoolFilterChange}
            poolOffset={poolOffset}
            onPoolPageChange={setPoolOffset}
            onClaimed={handleClaimed}
            onRemoveFromPool={handleRemoveFromPool}
            onRefreshPool={() => loadPool(undefined, poolFilters, poolOffset)}
            showToast={showToast}
          />
        ) : (
          <div className="flex h-full">
            <MyLanesPanel
              lanes={lanes}
              lanesTotal={lanesTotal}
              selectedId={selectedLaneId}
              onSelect={setSelectedLaneId}
              loading={lanesLoading}
              lanesFilters={lanesFilters}
              onLanesFilterChange={handleLanesFilterChange}
              lanesOffset={lanesOffset}
              onLanesPageChange={setLanesOffset}
            />
            {laneLoading ? (
              <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
            ) : (
              <LaneDetail
                lane={selectedLane}
                transitions={transitions}
                transitionsLoading={transitionsLoading}
                brokerId={broker?.broker_id}
                brokerStates={brokerStates}
              />
            )}
            <ActionPanel
              lane={selectedLane}
              stageConfig={stageConfig}
              stageConfigLoading={stageConfigLoading}
              onTransition={handleTransition}
              onAdvanceStage={handleAdvanceStage}
              onLenderSet={handleLenderSet}
              transitionLoading={transitionLoading}
              advanceLoading={advanceLoading}
              showToast={showToast}
              brokerStates={brokerStates}
            />
          </div>
        )}
      </div>

      <Toast toast={toast} />
    </div>
  );
}
