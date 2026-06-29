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
  allowedNextStates,
  workStateLabel,
  workStateColors,
  isTerminalState,
  REASON_CODES,
  LANE_OUTCOME_LABELS,
  LANE_OUTCOME_COLORS,
} from '../../config/brokerStates.js';
import { useBrokerContext } from './BrokerContext.jsx';
import Modal from '../ui/Modal.jsx';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';
import EmptyState from '../ui/EmptyState.jsx';

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

function PoolPanel({ pool, poolLoading, onClaimed, onRemoveFromPool, onRefreshPool, showToast, countyFilter }) {
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

  if (poolLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  const visiblePool = countyFilter === 'all' ? pool : pool.filter(l => l.prospect?.county === countyFilter);

  if (visiblePool.length === 0) return <EmptyState message={countyFilter === 'all' ? 'No unclaimed prospects available' : `No prospects in ${countyFilter} County`} />;

  return (
    <div className="flex-1 overflow-y-auto">
      {visiblePool.map(lane => {
        const p = lane.prospect || {};
        return (
          <div key={lane.lane_id} className="px-4 py-3 border-b border-fa-border-default">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-fa-text-primary truncate">{p.address}</p>
                <p className="text-xs text-fa-text-muted">{p.city}, {p.state}</p>
              </div>
              {/* Distress score badge */}
              <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded ${
                lane.distress_score >= 80 ? 'bg-red-900/50 text-red-300' :
                lane.distress_score >= 65 ? 'bg-orange-900/50 text-orange-300' :
                'bg-slate-800 text-slate-400'
              }`}>
                {lane.distress_score ?? '—'}
              </span>
            </div>
            {/* County */}
            {p.county && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-slate-800 text-slate-300 mb-1.5">
                {p.county}
              </span>
            )}
            {/* 2-line analysis summary */}
            {lane.analysis_summary && (
              <p className="text-xs text-fa-text-muted leading-relaxed mb-2 line-clamp-2">{lane.analysis_summary}</p>
            )}
            {/* Contact masked notice (D15) */}
            <p className="text-xs text-amber-500/80 italic mb-2">Contact revealed after claim</p>
            <button
              onClick={() => handleClaim(lane.lane_id)}
              disabled={!!claimingId}
              className="w-full text-xs bg-fa-primary text-fa-bg-base font-semibold py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {claimingId === lane.lane_id ? 'Claiming…' : 'Claim this lane'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Left panel — My Lanes tab
// ---------------------------------------------------------------------------

function MyLanesPanel({ lanes, selectedId, onSelect, loading, countyFilter }) {
  const [filter, setFilter] = useState('all');

  const filtered = lanes.filter(l => {
    if (filter === 'open')   return l.outcome === 'open';
    if (filter === 'closed') return l.outcome !== 'open';
    return true;
  }).filter(l => countyFilter === 'all' || l.prospect?.county === countyFilter);

  return (
    <>
      {/* Filter pills */}
      <div className="px-4 py-2 border-b border-fa-border-default flex gap-1">
        {['all', 'open', 'closed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-fa-primary/10 text-fa-primary'
                : 'text-fa-text-muted hover:text-fa-text-secondary'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No lanes found" />
        ) : (
          filtered.map(lane => (
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
                  {lane.prospect?.address || 'Unknown address'}
                </p>
                {/* Stale badge (D14) */}
                {lane.is_stale && (
                  <span className="shrink-0 text-xs font-bold px-1.5 py-0.5 rounded bg-orange-900/50 text-orange-300">
                    STALE
                  </span>
                )}
              </div>
              <p className="text-xs text-fa-text-muted truncate mt-0.5">
                {lane.prospect?.city}, {lane.prospect?.state} — {lane.prospect?.owner_name}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <WorkStateBadge state={lane.current_work_state} />
                <span className="text-xs text-fa-text-muted">{lane.current_stage_display || lane.current_stage}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Left panel — outer shell with Pool / My Lanes tabs
// ---------------------------------------------------------------------------

function LeftPanel({ lanes, lanesLoading, selectedId, onSelect, onClaimed, showToast,
  pool, poolLoading, onRemoveFromPool, onRefreshPool }) {
  const [activeTab, setActiveTab] = useState('pool');
  const [countyFilter, setCountyFilter] = useState('all');

  // Derive county options from both datasets combined
  const countyOptions = [...new Set([
    ...lanes.map(l => l.prospect?.county),
    ...pool.map(l => l.prospect?.county),
  ].filter(Boolean))].sort();

  function handleClaimed(claimedLane) {
    onClaimed(claimedLane);
    setActiveTab('my-lanes');
  }

  return (
    <div className="flex flex-col h-full border-r border-fa-border-default w-72 shrink-0">
      {/* Tab header */}
      <div className="px-4 pt-4 pb-0 border-b border-fa-border-default">
        <div className="flex gap-1 p-1 rounded-xl w-fit mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {[
            { id: 'pool', label: 'Available Pool' },
            { id: 'my-lanes', label: 'My Lanes' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
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

        {/* County filter — shown when options exist */}
        {countyOptions.length > 0 && (
          <div className="pb-3">
            <select
              value={countyFilter}
              onChange={e => setCountyFilter(e.target.value)}
              className="w-full text-xs bg-fa-bg-base border border-fa-border-default rounded-lg px-2.5 py-1.5 text-fa-text-primary focus:outline-none focus:border-fa-primary"
            >
              <option value="all">All counties</option>
              {countyOptions.map(c => (
                <option key={c} value={c}>{c} County</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab content */}
      <div className="flex flex-col flex-1 min-h-0">
        {activeTab === 'pool' ? (
          <PoolPanel
            pool={pool}
            poolLoading={poolLoading}
            onClaimed={handleClaimed}
            onRemoveFromPool={onRemoveFromPool}
            onRefreshPool={onRefreshPool}
            showToast={showToast}
            countyFilter={countyFilter}
          />
        ) : (
          <MyLanesPanel
            lanes={lanes}
            selectedId={selectedId}
            onSelect={onSelect}
            loading={lanesLoading}
            countyFilter={countyFilter}
          />
        )}
      </div>
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

function LaneDetail({ lane, transitions, transitionsLoading, brokerId }) {
  if (!lane) {
    return (
      <div className="flex-1 flex items-center justify-center text-fa-text-muted text-sm">
        Select a lane to view details
      </div>
    );
  }

  const p = lane.prospect || {};
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
        <div>
          <label className="block text-sm font-medium text-fa-text-secondary mb-1">Reason</label>
          <select
            value={reasonCode}
            onChange={e => setReasonCode(e.target.value)}
            className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
          >
            {REASON_CODES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
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

const LENDER_PICKER_STATES = new Set(['working', 'quoted', 'committed', 'closed_won']);

function ActionPanel({ lane, stageConfig, stageConfigLoading, onTransition, onAdvanceStage, onLenderSet, transitionLoading, advanceLoading, showToast }) {
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
  const nextStates = allowedNextStates(currentWorkState);
  const terminal = isTerminalState(currentWorkState);
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
    if (toState === 'closed_won') {
      setShowWonModal(true);
    } else {
      setSelectedState(toState);
      setReasonCode('');
    }
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
              {nextStageOptions.map(s => (
                <button
                  key={s.stage_key}
                  onClick={() => { setSelectedAdvanceStage(s.stage_key); onAdvanceStage(s.stage_key); }}
                  disabled={advanceLoading}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm border border-fa-border-default text-fa-text-secondary hover:bg-fa-bg-card transition-colors disabled:opacity-50"
                >
                  {advanceLoading && selectedAdvanceStage === s.stage_key ? 'Advancing…' : `Advance to ${s.display_name}`}
                </button>
              ))}
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
              {REASON_CODES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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

export default function BrokerLanesSection() {
  const { broker } = useBrokerContext();
  const [lanes, setLanes] = useState([]);
  const [lanesLoading, setLanesLoading] = useState(true);
  const [pool, setPool] = useState([]);
  const [poolLoading, setPoolLoading] = useState(true);
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

  const loadLanes = useCallback(async (signal) => {
    try {
      const data = await fetchBrokerLanes({ signal });
      setLanes(data.lanes || []);
    } catch (err) {
      if (err?.name === 'AbortError') return;
    } finally {
      setLanesLoading(false);
    }
  }, []);

  const loadPool = useCallback(async (signal) => {
    setPoolLoading(true);
    try {
      const data = await fetchPool({ signal });
      setPool(data.lanes || []);
    } catch (err) {
      if (err?.name !== 'AbortError') showToast('Failed to load pool', 'error');
    } finally {
      setPoolLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const controller = new AbortController();
    loadLanes(controller.signal);
    loadPool(controller.signal);
    const interval = setInterval(() => loadLanes(controller.signal), 30000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [loadLanes, loadPool]);

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

  // Called when pool claim succeeds — add the claimed lane to My Lanes + select it
  function handleClaimed(claimedLane) {
    setLanes(prev => [claimedLane, ...prev.filter(l => l.lane_id !== claimedLane.lane_id)]);
    setSelectedLaneId(claimedLane.lane_id);
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
    <div className="flex h-full" style={{ minHeight: 'calc(100vh - 0px)' }}>
      <LeftPanel
        lanes={lanes}
        lanesLoading={lanesLoading}
        pool={pool}
        poolLoading={poolLoading}
        onRemoveFromPool={handleRemoveFromPool}
        onRefreshPool={() => loadPool()}
        selectedId={selectedLaneId}
        onSelect={setSelectedLaneId}
        onClaimed={handleClaimed}
        showToast={showToast}
      />

      {laneLoading ? (
        <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
      ) : (
        <LaneDetail
          lane={selectedLane}
          transitions={transitions}
          transitionsLoading={transitionsLoading}
          brokerId={broker?.brokerId || broker?.id}
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
      />

      <Toast toast={toast} />
    </div>
  );
}
