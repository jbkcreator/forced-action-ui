import { useState, useEffect, useCallback } from 'react';
import {
  fetchDeliveredLeads,
  createTeachingCorrection,
  deleteTeachingCorrection,
} from '../../../api/closer';
import { signalLabel } from '../../../config/closerOptions';
import TeachLeadModal from './TeachLeadModal';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };
const dimText = { color: '#94a3b8' };

function tierColor(tier) {
  if (tier === 'Ultra Platinum') return '#a855f7';
  if (tier === 'Platinum') return '#fbbf24';
  if (tier === 'Gold') return '#f59e0b';
  if (tier === 'Silver') return '#94a3b8';
  return '#64748b';
}

function CorrectionTag({ correction, onUndo, undoing }) {
  const label = correction.signal_type
    ? `${correction.correction_reason}: ${signalLabel(correction.signal_type)}`
    : correction.correction_reason;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(250,204,21,0.1)', color: '#facc15', border: '1px solid rgba(250,204,21,0.25)' }}
    >
      Taught · {label}
      <button
        type="button"
        onClick={() => onUndo(correction)}
        disabled={undoing}
        aria-label="Undo correction"
        className="ml-0.5 hover:text-white disabled:opacity-40"
      >
        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </span>
  );
}

export default function DeliveredLeads({ token, subscriberId, showToast }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teachLead, setTeachLead] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [undoingId, setUndoingId] = useState(null);

  const load = useCallback(() => {
    if (!subscriberId) return;
    setLoading(true);
    setError('');
    fetchDeliveredLeads(token, subscriberId)
      .then(d => setLeads(d?.items || []))
      .catch(e => setError(e.detail || e.message || 'Failed to load delivered leads'))
      .finally(() => setLoading(false));
  }, [token, subscriberId]);

  useEffect(() => { load(); }, [load]);

  function handleSubmit(body) {
    setSubmitting(true);
    createTeachingCorrection(token, body)
      .then(() => {
        showToast?.('Correction applied — lead rescored.');
        setTeachLead(null);
        load();
      })
      .catch(e => {
        if (e.status === 409) {
          showToast?.('This correction is already active.', 'error');
          setTeachLead(null);
          load();
        } else {
          showToast?.(e.detail || e.message || 'Failed to apply correction', 'error');
        }
      })
      .finally(() => setSubmitting(false));
  }

  function handleUndo(correction) {
    setUndoingId(correction.id);
    deleteTeachingCorrection(token, correction.id)
      .then(() => {
        showToast?.('Correction undone — lead rescored.');
        load();
      })
      .catch(e => showToast?.(e.detail || e.message || 'Failed to undo', 'error'))
      .finally(() => setUndoingId(null));
  }

  if (!subscriberId) return null;

  return (
    <div className="rounded-xl p-4 space-y-3" style={card}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#facc15" strokeWidth={2}>
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: '#facc15' }}>
            Delivered Leads
          </span>
        </div>
        {!loading && leads.length > 0 && (
          <span className="text-[10px]" style={dimText}>{leads.length}</span>
        )}
      </div>

      {loading && <p className="text-xs" style={dimText}>Loading…</p>}
      {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
      {!loading && !error && leads.length === 0 && (
        <p className="text-xs" style={dimText}>No leads delivered to this subscriber yet.</p>
      )}

      {!loading && leads.length > 0 && (
        <ul className="space-y-2">
          {leads.map(lead => {
            const corrections = lead.active_corrections || [];
            return (
              <li
                key={lead.property_id}
                className="rounded-lg px-3 py-2 flex items-center justify-between gap-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-200 truncate">
                    {lead.address || `Property #${lead.property_id}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {lead.lead_tier && (
                      <span className="text-[10px] font-semibold" style={{ color: tierColor(lead.lead_tier) }}>
                        {lead.lead_tier} · {Math.round(lead.cds_score || 0)}
                      </span>
                    )}
                    {corrections.map(c => (
                      <CorrectionTag
                        key={c.id}
                        correction={c}
                        onUndo={handleUndo}
                        undoing={undoingId === c.id}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTeachLead(lead)}
                  className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'rgba(250,204,21,0.12)', color: '#facc15', border: '1px solid rgba(250,204,21,0.25)' }}
                >
                  Teach
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {teachLead && (
        <TeachLeadModal
          lead={teachLead}
          onClose={() => setTeachLead(null)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
}
