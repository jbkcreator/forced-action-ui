/**
 * IcpChannelCard — compact card for a single ICP channel in the admin grid.
 *
 * Two independent action buttons:
 *
 *   Activate        — enabled only when all gates are green. Disabled (with
 *                     tooltip) if any gate is blocked/red/N/A.
 *
 *   Force Activate  — enabled for any authenticated admin (canForceActivate=true)
 *                     regardless of gate state; disabled with tooltip when the
 *                     caller sets canForceActivate=false (future role gating).
 *                     Not shown for the default contractor ICP or retired channels.
 *                     On click → opens inline reason modal; reason is required.
 *
 * props:
 *   channel           — channel data object from /api/admin/icp-channels
 *   onActivate(key, { force, reason }) — called on activate / force activate
 *   onPause(key)      — called on pause
 *   onKill(key, reason) — called on kill
 *   loading           — disables all action buttons while a request is in flight
 *   canForceActivate  — whether this admin may force activate (default: true)
 */

import { useState } from 'react';
import IcpGateHealthGrid from './IcpGateHealthGrid.jsx';

const STATUS_PILL = {
  live:       'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  gated:      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  approved:   'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  configured: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  retired:    'bg-red-500/20 text-red-400 border border-red-500/30',
  draft:      'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  not_seeded: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
};

export default function IcpChannelCard({
  channel,
  onActivate,
  onPause,
  onKill,
  loading,
  canForceActivate = true,   // set false to disable Force Activate (future role gating)
}) {
  const [gatesExpanded, setGatesExpanded]   = useState(false);
  const [forceModalOpen, setForceModalOpen] = useState(false);
  const [forceReason, setForceReason]       = useState('');
  const [killReason, setKillReason]         = useState('');
  const [showKill, setShowKill]             = useState(false);

  const isDefault  = channel.is_default;
  const isLive     = channel.status === 'live';
  const isRetired  = channel.status === 'retired';

  // Normal activate: available only when not already live, not default, not retired
  const canActivate      = !isDefault && !isLive && !isRetired;
  // Normal activate fires only when all gates are green
  const normalGatesPassed = !channel.gate_required || !channel.gate_blocked;
  // Force activate: only shown when gates are required AND actually blocking.
  // When all gates are green, normal Activate works — no Force button needed.
  const canShowForce = canActivate && channel.gate_required && channel.gate_blocked;

  const canPause = !isDefault && isLive;
  const canKill  = !isDefault && !isRetired;

  const gateCount  = Object.keys(channel.gates || {}).length;
  const greenCount = Object.values(channel.gates || {}).filter(g => g.color === 'green').length;
  const allGreen   = gateCount > 0 && greenCount === gateCount;

  function handleForceSubmit() {
    if (!forceReason.trim()) return;
    onActivate(channel.key, { force: true, reason: forceReason.trim() });
    setForceModalOpen(false);
    setForceReason('');
  }

  function handleForceCancel() {
    setForceModalOpen(false);
    setForceReason('');
  }

  return (
    <div
      className="bg-fa-bg-card border border-fa-border-default rounded-xl p-5 space-y-4"
      data-testid={`icp-card-${channel.key}`}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-fa-text-primary text-base">{channel.display_name}</h3>
          <p className="text-xs text-fa-text-muted mt-0.5">{channel.key}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_PILL[channel.status] || STATUS_PILL.configured}`}>
          {channel.status === 'not_seeded' ? 'Not seeded' : (channel.status || 'unknown')}
          {isDefault && ' (default)'}
        </span>
      </div>

      {/* ── Target audience ─────────────────────────────────────────────── */}
      {channel.target_audience && (
        <p className="text-sm text-fa-text-muted">{channel.target_audience}</p>
      )}

      {/* ── Gate summary ─────────────────────────────────────────────────── */}
      {channel.gate_required && (
        <div>
          <button
            type="button"
            onClick={() => setGatesExpanded(e => !e)}
            className="flex items-center gap-2 text-sm font-medium text-fa-text-secondary hover:text-fa-text-primary transition-colors"
          >
            <span>
              {allGreen
                ? '🟢 All gates green'
                : channel.gate_blocked
                  ? `🔴 ${channel.blocking_reasons?.length || 0} gate(s) blocking`
                  : `${greenCount}/${gateCount} gates green`}
            </span>
            <span className="text-fa-text-muted text-xs">{gatesExpanded ? '▲' : '▼'}</span>
          </button>
          {gatesExpanded && (
            <div className="mt-3">
              <IcpGateHealthGrid gates={channel.gates} />
            </div>
          )}
        </div>
      )}

      {!channel.gate_required && (
        <p className="text-xs text-emerald-400">Gate-exempt (default contractor ICP)</p>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      {!isDefault && !isRetired && !forceModalOpen && !showKill && (
        <div className="flex flex-wrap gap-2 pt-1">

          {/* Normal Activate — disabled when gates blocked */}
          {canActivate && (
            <button
              type="button"
              data-testid="btn-activate"
              disabled={loading || !normalGatesPassed}
              title={!normalGatesPassed ? 'Not all gates are green — use Force Activate to override' : undefined}
              onClick={() => onActivate(channel.key, {})}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-fa-primary text-fa-bg-base hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              Activate
            </button>
          )}

          {/* Force Activate — independent of gate state; requires canForceActivate */}
          {canShowForce && (
            <button
              type="button"
              data-testid="btn-force-activate"
              disabled={loading || !canForceActivate}
              title={
                !canForceActivate
                  ? 'Force activation requires elevated permissions'
                  : 'Bypass gate checks — requires a written reason'
              }
              onClick={() => setForceModalOpen(true)}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              Force Activate…
            </button>
          )}

          {/* Pause */}
          {canPause && (
            <button
              type="button"
              disabled={loading}
              onClick={() => onPause(channel.key)}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 disabled:opacity-40"
            >
              Pause
            </button>
          )}

          {/* Kill */}
          {canKill && (
            <button
              type="button"
              onClick={() => setShowKill(true)}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
            >
              Kill…
            </button>
          )}
        </div>
      )}

      {/* ── Force Activate modal (inline) ────────────────────────────────── */}
      {forceModalOpen && (
        <div
          className="w-full space-y-3 pt-1"
          data-testid="force-modal"
          role="dialog"
          aria-label="Force activation confirmation"
        >
          <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <span className="text-orange-400 mt-0.5">⚠</span>
            <div>
              <p className="text-sm font-semibold text-orange-400">Force Activate — bypasses all gate checks</p>
              <p className="text-xs text-fa-text-muted mt-0.5">
                This will activate <strong className="text-fa-text-secondary">{channel.display_name}</strong> even though
                {channel.blocking_reasons?.length
                  ? ` ${channel.blocking_reasons.length} gate(s) are not met`
                  : ' some gates are not green'}.
                Provide a reason — it will be recorded in the audit log.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-fa-text-secondary mb-1">
              Reason for force activation <span className="text-red-400">*</span>
            </label>
            <textarea
              data-testid="force-reason-input"
              value={forceReason}
              onChange={e => setForceReason(e.target.value)}
              placeholder="e.g. Early launch approved by ops review — contractor MRR target extended to Q4"
              rows={3}
              autoFocus
              className="w-full bg-fa-bg-base border border-fa-border-default rounded-lg px-3 py-2 text-sm text-fa-text-primary focus:outline-none focus:border-orange-400"
            />
            {forceReason.trim().length > 0 && forceReason.trim().length < 10 && (
              <p className="text-xs text-red-400 mt-1">Reason must be at least 10 characters.</p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              data-testid="btn-confirm-force"
              disabled={loading || forceReason.trim().length < 10}
              onClick={handleForceSubmit}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Activating…' : 'Confirm force activate'}
            </button>
            <button
              type="button"
              data-testid="btn-cancel-force"
              onClick={handleForceCancel}
              className="px-3 py-1.5 text-sm text-fa-text-muted hover:text-fa-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Kill modal (inline) ───────────────────────────────────────────── */}
      {showKill && !forceModalOpen && (
        <div className="w-full space-y-2 pt-1">
          <p className="text-xs text-red-400 font-medium">Kill channel — this is terminal and cannot be undone.</p>
          <input
            value={killReason}
            onChange={e => setKillReason(e.target.value)}
            placeholder="Kill reason (optional)"
            className="w-full bg-fa-bg-base border border-fa-border-default rounded-lg px-3 py-2 text-sm text-fa-text-primary focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => { onKill(channel.key, killReason); setShowKill(false); }}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-40"
            >
              Confirm kill
            </button>
            <button type="button" onClick={() => setShowKill(false)} className="px-3 py-1.5 text-sm text-fa-text-muted">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isRetired && (
        <p className="text-xs text-red-400">Retired — terminal state.</p>
      )}
    </div>
  );
}
