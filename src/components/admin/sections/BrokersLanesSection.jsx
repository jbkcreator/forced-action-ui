/**
 * Admin "Brokers & Lanes" section.
 * Three lenses: Unassigned lanes, All lanes, By-broker view.
 * Also: create/invite broker, activate/deactivate broker.
 * Spec §4.2/§4.3, plan A-FE-1.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminContext } from '../adminContext.js';
import {
  fetchAllLanes,
  assignBroker,
  reassignBroker,
  listBrokers,
  fetchLanesByBroker,
  createBroker,
  setBrokerActive,
  listLenders,
  createLender,
  setLenderStatus,
  setLaneFeeConfig,
} from '../../../api/loanLane.js';
import { workStateLabel, workStateColors, LANE_OUTCOME_LABELS, LANE_OUTCOME_COLORS } from '../../../config/brokerStates.js';
import Modal from '../../ui/Modal.jsx';
import LoadingSpinner from '../../ui/LoadingSpinner.jsx';
import EmptyState from '../../ui/EmptyState.jsx';
import LaneFilterBar, { LanePagination } from '../../ui/LaneFilterBar.jsx';

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

const TABS = [
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'stale',      label: 'Stale'      },
  { id: 'all',        label: 'Assigned'   },
  { id: 'by-broker',  label: 'By Broker'  },
  { id: 'lenders',    label: 'Cleared Lenders' },
];

// ---------------------------------------------------------------------------
// Assign broker modal
// ---------------------------------------------------------------------------

function AssignBrokerModal({ isOpen, onClose, onAssign, loading, brokers }) {
  const [brokerId, setBrokerId] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!brokerId) return;
    onAssign(brokerId);
    setBrokerId('');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Broker">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="block text-sm font-medium text-fa-text-secondary mb-1">Select broker</label>
          <select
            value={brokerId}
            onChange={e => setBrokerId(e.target.value)}
            required
            autoFocus
            className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
          >
            <option value="">Select…</option>
            {brokers.filter(b => b.is_active).map(b => (
              <option key={b.broker_id} value={b.broker_id}>{b.name} ({b.email})</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!brokerId || loading}
            className="flex-1 bg-fa-primary text-fa-bg-base font-medium py-2.5 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Assigning…' : 'Assign'}
          </button>
          <button type="button" onClick={onClose} className="px-4 text-fa-text-muted hover:text-fa-text-primary border border-fa-border-default rounded-lg text-sm">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Create broker modal
// ---------------------------------------------------------------------------

function CreateBrokerModal({ isOpen, onClose, onCreated, token }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createBroker(token, { name, email });
      onCreated();
      onClose();
      setName(''); setEmail('');
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to create broker');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Broker">
      <p className="text-xs text-fa-text-muted mb-4">A set-password link will be emailed to the broker.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-fa-text-secondary mb-1">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
            className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-fa-text-secondary mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-fa-primary text-fa-bg-base font-medium py-2.5 rounded-lg disabled:opacity-50">
            {loading ? 'Inviting…' : 'Send invite'}
          </button>
          <button type="button" onClick={onClose}
            className="px-4 text-fa-text-muted hover:text-fa-text-primary border border-fa-border-default rounded-lg text-sm">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Lanes table (shared between Unassigned + All tabs)
// ---------------------------------------------------------------------------

function CountyBadge({ county }) {
  if (!county) return <span className="text-xs text-fa-text-muted">—</span>;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300">
      {county}
    </span>
  );
}

function FeeGateBadge({ on }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      on ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-800 text-slate-400'
    }`}>
      {on ? 'Fees ON' : 'Fees OFF'}
    </span>
  );
}

function LaneRow({ lane, brokers, onAssign, onReassign, onFeeConfig, assignLoading, assigningLaneId, navigate }) {
  const isUnassigned = !lane.assigned_broker_id;

  return (
    <tr className="border-b border-fa-border-default hover:bg-fa-bg-card/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/admin/brokers-lanes/${lane.lane_id}`)}
            className="text-sm text-fa-text-primary hover:text-fa-primary text-left"
          >
            {lane.property?.address || '—'}
          </button>
          {lane.is_stale && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300">STALE</span>
          )}
        </div>
        <p className="text-xs text-fa-text-muted">{lane.property?.city}, {lane.property?.state} — {lane.property?.owner_name}</p>
      </td>
      <td className="px-4 py-3"><CountyBadge county={lane.property?.county} /></td>
      <td className="px-4 py-3 text-xs text-fa-text-secondary">{lane.current_stage_display || lane.current_stage}</td>
      <td className="px-4 py-3"><WorkStateBadge state={lane.current_work_state} /></td>
      <td className="px-4 py-3"><OutcomeBadge outcome={lane.outcome} /></td>
      <td className="px-4 py-3 text-xs text-fa-text-secondary">{lane.lender_name || <span className="text-fa-text-muted">—</span>}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <FeeGateBadge on={lane.fee_config_flag} />
          <button
            onClick={() => onFeeConfig(lane)}
            className={`text-xs hover:underline ${
              lane.fee_config_flag ? 'text-slate-400 hover:text-slate-300' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            {lane.fee_config_flag ? 'Disable' : 'Enable…'}
          </button>
        </div>
      </td>
      <td className="px-4 py-3">
        {isUnassigned ? (
          <select
            defaultValue=""
            onChange={e => e.target.value && onAssign(lane.lane_id, e.target.value)}
            disabled={assignLoading && assigningLaneId === lane.lane_id}
            className="text-xs bg-fa-bg-card border border-fa-border-default rounded px-2 py-1 text-fa-text-primary focus:outline-none"
          >
            <option value="">Assign broker…</option>
            {brokers.filter(b => b.is_active).map(b => (
              <option key={b.broker_id} value={b.broker_id}>{b.name}</option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-fa-text-secondary">{lane.assigned_broker_name}</span>
            <button
              onClick={() => onReassign(lane.lane_id)}
              className="text-xs text-amber-400 hover:text-amber-300 hover:underline"
            >
              Re-assign
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function LanesTable({ lanes, brokers, onAssign, onReassign, onFeeConfig, assignLoading, assigningLaneId, loading }) {
  const navigate = useNavigate();

  if (loading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;
  if (lanes.length === 0) return <EmptyState message="No lanes found" />;

  return (
    <div className="overflow-x-auto overflow-y-auto rounded-xl border border-fa-border-default" style={{ maxHeight: 'calc(100vh - 320px)' }}>
      <table className="w-full text-left">
        <thead className="sticky top-0 z-10 bg-fa-bg-base">
          <tr className="border-b border-fa-border-default">
            {['Prospect', 'County', 'Stage', 'Work state', 'Outcome', 'Lender', 'Fees', 'Broker'].map(h => (
              <th key={h} className="px-4 py-3 text-xs font-medium text-fa-text-muted">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lanes.map(lane => (
            <LaneRow
              key={lane.lane_id}
              lane={lane}
              brokers={brokers}
              onAssign={onAssign}
              onReassign={onReassign}
              onFeeConfig={onFeeConfig}
              assignLoading={assignLoading}
              assigningLaneId={assigningLaneId}
              navigate={navigate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RESPA fee-gate modal (per-lane fee_config_flag)
// ---------------------------------------------------------------------------

const RESPA_UI_WARNING =
  'Referral fees on consumer-purpose mortgage business are prohibited by RESPA §8 ' +
  '(12 U.S.C. §2607) — per-violation fines and treble-damage civil liability. ' +
  'Switching this back off later does NOT undo fees already charged. Enable only ' +
  'for a deal counsel has confirmed in writing to be exempt (e.g. business-purpose) ' +
  'with cleared fee terms.';

function FeeConfigModal({ lane, onClose, onConfirm, loading }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const enabling = !!lane && !lane.fee_config_flag;

  useEffect(() => {
    setAcknowledged(false);
  }, [lane]);

  if (!lane) return null;

  return (
    <Modal isOpen onClose={onClose} title={enabling ? 'Enable fee surfaces — RESPA gate' : 'Disable fee surfaces'}>
      <p className="text-sm text-fa-text-secondary mb-3">
        {lane.property?.address} — {lane.property?.city}, {lane.property?.state}
      </p>
      {enabling ? (
        <>
          <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 mb-4">
            <p className="text-xs font-bold text-red-300 mb-1">RESPA §8 WARNING</p>
            <p className="text-xs text-red-200/90">{RESPA_UI_WARNING}</p>
          </div>
          <label className="flex items-start gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={e => setAcknowledged(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-xs text-fa-text-secondary">
              I confirm counsel has signed off in writing that this deal is RESPA-exempt and its fee terms are cleared.
            </span>
          </label>
        </>
      ) : (
        <p className="text-xs text-fa-text-muted mb-4">
          Commission dollar amounts for this lane will be hidden again. This does not undo fees already charged.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="text-sm px-4 py-2 rounded-lg border border-fa-border-default text-fa-text-secondary hover:bg-fa-bg-card"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(acknowledged)}
          disabled={loading || (enabling && !acknowledged)}
          className={`text-sm px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
            enabling ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-fa-bg-card border border-fa-border-default text-fa-text-primary hover:bg-fa-bg-base'
          }`}
        >
          {loading ? 'Saving…' : enabling ? 'Enable fees' : 'Disable fees'}
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Reassign broker modal (for already-assigned lanes)
// ---------------------------------------------------------------------------

function ReassignBrokerModal({ isOpen, onClose, onReassign, loading, brokers }) {
  const [brokerId, setBrokerId] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!brokerId) return;
    onReassign(brokerId);
    setBrokerId('');
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Re-assign Broker">
      <p className="text-xs text-fa-text-muted mb-4">Override the current broker assignment. The lane history is preserved.</p>
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="block text-sm font-medium text-fa-text-secondary mb-1">Select new broker</label>
          <select
            value={brokerId}
            onChange={e => setBrokerId(e.target.value)}
            required
            autoFocus
            className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
          >
            <option value="">Select…</option>
            {brokers.filter(b => b.is_active).map(b => (
              <option key={b.broker_id} value={b.broker_id}>{b.name} ({b.email})</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!brokerId || loading}
            className="flex-1 bg-amber-600 text-white font-medium py-2.5 rounded-lg disabled:opacity-50 hover:bg-amber-500"
          >
            {loading ? 'Reassigning…' : 'Confirm Re-assign'}
          </button>
          <button type="button" onClick={onClose} className="px-4 text-fa-text-muted hover:text-fa-text-primary border border-fa-border-default rounded-lg text-sm">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Lenders curation view (A4)
// ---------------------------------------------------------------------------

function LendersView({ token, showToast }) {
  const [lenders, setLenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadLenders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listLenders(token);
      setLenders(data.lenders || []);
    } catch {
      showToast('Failed to load lenders', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadLenders(); }, [loadLenders]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createLender(token, { name: newName.trim() });
      showToast('Lender created');
      setNewName('');
      setShowCreate(false);
      loadLenders();
    } catch (err) {
      showToast(err?.detail || 'Failed to create lender', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function toggleCleared(lender) {
    setTogglingId(lender.lender_id + '-cleared');
    try {
      await setLenderStatus(token, lender.lender_id, { is_cleared: !lender.is_cleared });
      showToast(`Lender ${!lender.is_cleared ? 'marked cleared' : 'uncleared'}`);
      loadLenders();
    } catch {
      showToast('Failed to update lender', 'error');
    } finally {
      setTogglingId(null);
    }
  }

  async function toggleActive(lender) {
    setTogglingId(lender.lender_id + '-active');
    try {
      await setLenderStatus(token, lender.lender_id, { is_active: !lender.is_active });
      showToast(`Lender ${!lender.is_active ? 'activated' : 'deactivated'}`);
      loadLenders();
    } catch {
      showToast('Failed to update lender', 'error');
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-fa-text-muted">Only <strong className="text-fa-text-secondary">cleared + active</strong> lenders are shown to brokers in the lender picker.</p>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="text-xs bg-fa-primary text-fa-bg-base font-medium px-3 py-2 rounded-lg hover:opacity-90"
        >
          + Add lender
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="flex gap-2 mb-4">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Lender name…"
            required
            autoFocus
            className="flex-1 bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary text-sm focus:outline-none focus:border-fa-primary"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="bg-fa-primary text-fa-bg-base font-medium px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
          <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2 text-fa-text-muted hover:text-fa-text-primary border border-fa-border-default rounded-lg text-sm">
            Cancel
          </button>
        </form>
      )}

      {lenders.length === 0 ? (
        <EmptyState message="No lenders configured" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-fa-border-default">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-fa-border-default">
                {['Name', 'Cleared', 'Active', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-fa-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lenders.map(l => (
                <tr key={l.lender_id} className="border-b border-fa-border-default hover:bg-fa-bg-card/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-fa-text-primary">{l.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      l.is_cleared ? 'bg-emerald-900/40 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {l.is_cleared ? 'Cleared' : 'Not cleared'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      l.is_active ? 'bg-blue-900/40 text-blue-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {l.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCleared(l)}
                        disabled={togglingId === l.lender_id + '-cleared'}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          l.is_cleared
                            ? 'border-slate-600 text-slate-400 hover:bg-slate-800'
                            : 'border-emerald-700 text-emerald-400 hover:bg-emerald-900/20'
                        } disabled:opacity-50`}
                      >
                        {l.is_cleared ? 'Unclear' : 'Set cleared'}
                      </button>
                      <button
                        onClick={() => toggleActive(l)}
                        disabled={togglingId === l.lender_id + '-active'}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          l.is_active
                            ? 'border-red-700 text-red-400 hover:bg-red-900/20'
                            : 'border-emerald-700 text-emerald-400 hover:bg-emerald-900/20'
                        } disabled:opacity-50`}
                      >
                        {l.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// By-broker view
// ---------------------------------------------------------------------------

function ByBrokerView({ token, brokers, brokersLoading, onToggleActive, togglingBrokerId, showCreateModal }) {
  const [expandedBrokerId, setExpandedBrokerId] = useState(null);
  const [brokerLanes, setBrokerLanes] = useState({});
  const [lanesLoading, setLanesLoading] = useState({});
  const navigate = useNavigate();

  function toggleBroker(brokerId) {
    if (expandedBrokerId === brokerId) { setExpandedBrokerId(null); return; }
    setExpandedBrokerId(brokerId);
    if (brokerLanes[brokerId]) return; // already loaded
    setLanesLoading(prev => ({ ...prev, [brokerId]: true }));
    fetchLanesByBroker(token, brokerId)
      .then(data => setBrokerLanes(prev => ({ ...prev, [brokerId]: data.lanes || [] })))
      .catch(() => setBrokerLanes(prev => ({ ...prev, [brokerId]: [] })))
      .finally(() => setLanesLoading(prev => ({ ...prev, [brokerId]: false })));
  }

  if (brokersLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={showCreateModal}
          className="text-xs bg-fa-primary text-fa-bg-base font-medium px-3 py-2 rounded-lg hover:opacity-90"
        >
          + Invite broker
        </button>
      </div>

      {brokers.map(broker => (
        <div key={broker.broker_id} className="rounded-xl border border-fa-border-default overflow-hidden">
          <button
            onClick={() => toggleBroker(broker.broker_id)}
            className="w-full flex items-center justify-between px-4 py-3 bg-fa-bg-card hover:bg-fa-bg-card/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium text-fa-text-primary text-left">{broker.name}</p>
                <p className="text-xs text-fa-text-muted">{broker.email}</p>
              </div>
              {!broker.is_active && (
                <span className="px-1.5 py-0.5 rounded text-xs bg-slate-800 text-slate-500">Inactive</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-fa-text-muted">{broker.open_lanes} open lane{broker.open_lanes !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); onToggleActive(broker.broker_id, !broker.is_active); }}
                  disabled={togglingBrokerId === broker.broker_id}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    broker.is_active
                      ? 'border-red-700 text-red-400 hover:bg-red-900/20'
                      : 'border-emerald-700 text-emerald-400 hover:bg-emerald-900/20'
                  } disabled:opacity-50`}
                >
                  {broker.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                  className={`text-fa-text-muted transition-transform ${expandedBrokerId === broker.broker_id ? 'rotate-180' : ''}`}
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </button>

          {expandedBrokerId === broker.broker_id && (
            <div className="border-t border-fa-border-default">
              {lanesLoading[broker.broker_id] ? (
                <div className="flex justify-center py-4"><LoadingSpinner /></div>
              ) : !brokerLanes[broker.broker_id]?.length ? (
                <p className="text-xs text-fa-text-muted px-4 py-3">No lanes assigned.</p>
              ) : (
                <table className="w-full text-left">
                  <tbody>
                    {brokerLanes[broker.broker_id].map(lane => (
                      <tr key={lane.lane_id} className="border-b border-fa-border-default hover:bg-fa-bg-card/30">
                        <td className="px-4 py-2">
                          <button
                            onClick={() => navigate(`/admin/brokers-lanes/${lane.lane_id}`)}
                            className="text-sm text-fa-text-primary hover:text-fa-primary"
                          >
                            {lane.property?.address || '—'}
                          </button>
                          <p className="text-xs text-fa-text-muted">{lane.property?.city}, {lane.property?.state}</p>
                        </td>
                        <td className="px-4 py-2"><CountyBadge county={lane.property?.county} /></td>
                        <td className="px-4 py-2 text-xs text-fa-text-muted">{lane.current_stage_display || lane.current_stage}</td>
                        <td className="px-4 py-2"><WorkStateBadge state={lane.current_work_state} /></td>
                        <td className="px-4 py-2"><OutcomeBadge outcome={lane.outcome} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

const DEFAULT_ADMIN_FILTERS = { sort_by: 'entered_at', sort_dir: 'desc', open_only: true, limit: 50 };

export default function BrokersLanesSection() {
  const { token } = useAdminContext();
  const [tab, setTab] = useState('unassigned');
  const [lanes, setLanes] = useState([]);
  const [lanesTotal, setLanesTotal] = useState(null);
  const [lanesLoading, setLanesLoading] = useState(true);
  const [laneFilters, setLaneFilters] = useState(DEFAULT_ADMIN_FILTERS);
  const [laneOffset, setLaneOffset] = useState(0);
  const [brokers, setBrokers] = useState([]);
  const [brokersLoading, setBrokersLoading] = useState(true);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assigningLaneId, setAssigningLaneId] = useState(null);
  const [togglingBrokerId, setTogglingBrokerId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reassignLaneId, setReassignLaneId] = useState(null);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [feeLane, setFeeLane] = useState(null);
  const [feeLoading, setFeeLoading] = useState(false);
  const { toast, showToast } = useToast();

  const loadLanes = useCallback(async (signal, filters = laneFilters, offset = laneOffset) => {
    setLanesLoading(true);
    try {
      // Map tab to server-side filter params
      const tabParams = {};
      if (tab === 'unassigned') tabParams.assigned = 'false';
      if (tab === 'stale')      tabParams.stale    = 'true';
      if (tab === 'all')        tabParams.assigned = 'true';

      const data = await fetchAllLanes(token, { ...filters, ...tabParams, offset }, { signal });
      setLanes(data.lanes || []);
      setLanesTotal(data.total ?? null);
    } catch (err) {
      if (err?.name !== 'AbortError') showToast('Failed to load lanes', 'error');
    } finally {
      setLanesLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tab]);

  const loadBrokers = useCallback(async (signal) => {
    setBrokersLoading(true);
    try {
      const data = await listBrokers(token, { signal });
      setBrokers(data.brokers || []);
    } catch (err) {
      if (err?.name !== 'AbortError') {}
    } finally {
      setBrokersLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    loadLanes(controller.signal, DEFAULT_ADMIN_FILTERS, 0);
    loadBrokers(controller.signal);
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadBrokers]);

  // Re-fetch when filters, offset, or tab change
  useEffect(() => {
    const controller = new AbortController();
    loadLanes(controller.signal, laneFilters, laneOffset);
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laneFilters, laneOffset, tab]);

  function handleTabChange(newTab) {
    setTab(newTab);
    setLaneOffset(0);
    // Clear filters that don't apply on the unassigned tab
    if (newTab === 'unassigned') {
      setLaneFilters(prev => ({ ...prev, stage: '', work_state: '', broker_id: '' }));
    }
  }

  function handleFilterChange(patch) {
    setLaneFilters(prev => ({ ...prev, ...patch }));
    setLaneOffset(0);
  }

  async function handleAssign(laneId, brokerId) {
    setAssignLoading(true);
    setAssigningLaneId(laneId);
    try {
      await assignBroker(token, laneId, brokerId);
      showToast('Broker assigned');
      loadLanes();
    } catch (err) {
      showToast(err?.detail || 'Failed to assign broker', 'error');
    } finally {
      setAssignLoading(false);
      setAssigningLaneId(null);
    }
  }

  async function handleToggleActive(brokerId, isActive) {
    setTogglingBrokerId(brokerId);
    try {
      await setBrokerActive(token, brokerId, isActive);
      showToast(isActive ? 'Broker activated' : 'Broker deactivated');
      loadBrokers();
    } catch (err) {
      showToast(err?.detail || 'Failed to update broker', 'error');
    } finally {
      setTogglingBrokerId(null);
    }
  }

  async function handleFeeConfig(acknowledged) {
    if (!feeLane) return;
    const enabled = !feeLane.fee_config_flag;
    setFeeLoading(true);
    try {
      await setLaneFeeConfig(token, feeLane.lane_id, { enabled, acknowledgeRespa: acknowledged });
      showToast(enabled ? 'Fee surfaces enabled for lane' : 'Fee surfaces disabled for lane');
      setFeeLane(null);
      loadLanes();
    } catch (err) {
      showToast(err?.detail || 'Failed to update fee gate', 'error');
    } finally {
      setFeeLoading(false);
    }
  }

  async function handleReassign(brokerId) {
    if (!reassignLaneId) return;
    setReassignLoading(true);
    try {
      await reassignBroker(token, reassignLaneId, brokerId);
      showToast('Broker re-assigned');
      setReassignLaneId(null);
      loadLanes();
    } catch (err) {
      showToast(err?.detail || 'Failed to re-assign broker', 'error');
    } finally {
      setReassignLoading(false);
    }
  }

  const brokerOptions = brokers.map(b => ({ value: b.broker_id, label: b.name }));

  return (
    <div className="px-6 py-6">
      <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-fa-text-primary">Brokers & Loan Lanes</h2>
            {lanesTotal != null && (
              <p className="text-sm text-fa-text-muted mt-0.5">
                {lanesTotal.toLocaleString()} lane{lanesTotal !== 1 ? 's' : ''} matching current filters
              </p>
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs bg-fa-primary text-fa-bg-base font-medium px-3 py-2 rounded-lg hover:opacity-90"
          >
            + Invite broker
          </button>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 p-1 rounded-xl w-fit mb-5" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === t.id ? 'rgba(250,204,21,0.15)' : 'transparent',
                color: tab === t.id ? '#facc15' : '#94a3b8',
                boxShadow: tab === t.id ? 'inset 0 0 0 1px rgba(250,204,21,0.25)' : 'none',
              }}
            >
              {t.label}
              {tab === t.id && lanesTotal != null && ['unassigned', 'stale', 'all'].includes(t.id) && (
                <span className="ml-1.5 bg-fa-primary/20 text-fa-primary text-xs px-1.5 py-0.5 rounded-full">{lanesTotal.toLocaleString()}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Filter bar — shown for lanes tabs */}
        {['unassigned', 'stale', 'all'].includes(tab) && (
          <LaneFilterBar
            filters={laneFilters}
            onChange={handleFilterChange}
            mode="admin"
            brokerOptions={brokerOptions}
            hiddenFilters={tab === 'unassigned' ? ['stage', 'work_state', 'broker_id'] : []}
          />
        )}

        {/* Tab content */}
        {tab === 'unassigned' && (
          <>
            <LanesTable
              lanes={lanes}
              brokers={brokers}
              onAssign={handleAssign}
              onReassign={setReassignLaneId}
              onFeeConfig={setFeeLane}
              assignLoading={assignLoading}
              assigningLaneId={assigningLaneId}
              loading={lanesLoading}
            />
            <LanePagination total={lanesTotal} limit={laneFilters.limit || 50} offset={laneOffset} onPageChange={setLaneOffset} />
          </>
        )}

        {tab === 'stale' && (
          <>
            <LanesTable
              lanes={lanes}
              brokers={brokers}
              onAssign={handleAssign}
              onReassign={setReassignLaneId}
              onFeeConfig={setFeeLane}
              assignLoading={assignLoading}
              assigningLaneId={assigningLaneId}
              loading={lanesLoading}
            />
            <LanePagination total={lanesTotal} limit={laneFilters.limit || 50} offset={laneOffset} onPageChange={setLaneOffset} />
          </>
        )}

        {tab === 'all' && (
          <>
            <LanesTable
              lanes={lanes}
              brokers={brokers}
              onAssign={handleAssign}
              onReassign={setReassignLaneId}
              onFeeConfig={setFeeLane}
              assignLoading={assignLoading}
              assigningLaneId={assigningLaneId}
              loading={lanesLoading}
            />
            <LanePagination total={lanesTotal} limit={laneFilters.limit || 50} offset={laneOffset} onPageChange={setLaneOffset} />
          </>
        )}

        {tab === 'by-broker' && (
          <ByBrokerView
            token={token}
            brokers={brokers}
            brokersLoading={brokersLoading}
            onToggleActive={handleToggleActive}
            togglingBrokerId={togglingBrokerId}
            showCreateModal={() => setShowCreateModal(true)}
          />
        )}

        {tab === 'lenders' && (
          <LendersView token={token} showToast={showToast} />
        )}

      <ReassignBrokerModal
        isOpen={!!reassignLaneId}
        onClose={() => setReassignLaneId(null)}
        onReassign={handleReassign}
        loading={reassignLoading}
        brokers={brokers}
      />

      <FeeConfigModal
        lane={feeLane}
        onClose={() => setFeeLane(null)}
        onConfirm={handleFeeConfig}
        loading={feeLoading}
      />

      <CreateBrokerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => { showToast('Broker invited — set-password email sent'); loadBrokers(); }}
        token={token}
      />

      </div>
      <Toast toast={toast} />
    </div>
  );
}
