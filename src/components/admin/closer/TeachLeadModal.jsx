import { useState } from 'react';
import {
  CORRECTION_REASONS,
  WRONG_DISTRESS_REASON,
  signalLabel,
} from '../../../config/closerOptions';

const overlay = {
  background: 'rgba(2,6,23,0.7)',
};
const card = {
  background: 'rgba(15,23,42,0.98)',
  border: '1px solid rgba(255,255,255,0.1)',
};
const selectCls = [
  'w-full rounded-lg px-3 py-2 text-xs text-slate-200',
  'border border-white/10 outline-none focus:border-yellow-500/50',
].join(' ');

export default function TeachLeadModal({ lead, onClose, onSubmit, submitting }) {
  const [reason, setReason] = useState('');
  const [signalType, setSignalType] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  if (!lead) return null;

  const isWrongDistress = reason === WRONG_DISTRESS_REASON;
  const signals = lead.signals || [];
  const reasonMeta = CORRECTION_REASONS.find(r => r.value === reason);

  function handleSubmit(e) {
    e.preventDefault();
    if (!reason) {
      setErr('Pick a reason.');
      return;
    }
    if (isWrongDistress && !signalType) {
      setErr('Pick which signal is wrong.');
      return;
    }
    setErr('');
    const body = {
      subject_id: lead.property_id,
      correction_reason: reason,
    };
    if (isWrongDistress) body.signal_type = signalType;
    if (note.trim()) body.note = note.trim();
    if (lead.closer_call_id) body.closer_call_id = lead.closer_call_id;
    onSubmit(body);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Teach a correction"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={overlay}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl p-5 space-y-4" style={card}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white">Teach a correction</h3>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {lead.address || `Property #${lead.property_id}`}
              {lead.lead_tier && (
                <span className="ml-2 text-slate-500">
                  {lead.lead_tier} · {Math.round(lead.cds_score || 0)}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-500 hover:text-slate-300 shrink-0"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Reason */}
          <div>
            <label htmlFor="teach-reason" className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">
              What’s wrong with this lead?
            </label>
            <select
              id="teach-reason"
              value={reason}
              onChange={e => { setReason(e.target.value); setSignalType(''); setErr(''); }}
              disabled={submitting}
              className={selectCls}
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <option value="">Select a reason…</option>
              {CORRECTION_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {reasonMeta && (
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{reasonMeta.hint}</p>
            )}
          </div>

          {/* Signal type — only for wrong_distress */}
          {isWrongDistress && (
            <div>
              <label htmlFor="teach-signal" className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">
                Which signal is wrong?
              </label>
              {signals.length === 0 ? (
                <p className="text-[11px] text-amber-400/80">
                  This lead has no recorded signals to correct.
                </p>
              ) : (
                <select
                  id="teach-signal"
                  value={signalType}
                  onChange={e => { setSignalType(e.target.value); setErr(''); }}
                  disabled={submitting}
                  className={selectCls}
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <option value="">Select a signal…</option>
                  {signals.map(s => (
                    <option key={s} value={s}>{signalLabel(s)}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <label htmlFor="teach-note" className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wide">
              Note <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              id="teach-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              disabled={submitting}
              rows={2}
              placeholder="What did the subscriber say?"
              className="w-full rounded-lg px-3 py-2 text-xs text-slate-200 border border-white/10 outline-none focus:border-yellow-500/50 resize-none"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          </div>

          {err && <p className="text-[11px] text-red-400" role="alert">{err}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2 rounded-lg text-xs font-semibold text-slate-300 border border-white/10 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (isWrongDistress && signals.length === 0)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40"
              style={{ background: '#facc15', color: '#0f172a' }}
            >
              {submitting ? 'Applying…' : 'Apply correction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
