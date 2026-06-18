import { useState } from 'react';
import { OBJECTION_TYPES, PITCH_VARIANTS, RATING_SCALE, RATING_LABELS } from '../../../config/closerOptions';

const selectCls = [
  'w-full rounded-lg px-3 py-2 text-xs text-slate-200',
  'bg-transparent border border-white/10 outline-none',
  'focus:border-yellow-500/50',
].join(' ');

export default function FeedbackForm({ onSubmit, submitting, disabled }) {
  const [objectionType, setObjectionType] = useState('');
  const [pitchVariant, setPitchVariant] = useState('');
  const [rating, setRating] = useState(0);
  const [err, setErr] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!objectionType || !pitchVariant || !rating) {
      setErr('Please fill in all three fields.');
      return;
    }
    setErr('');
    onSubmit({ objection_type: objectionType, pitch_variant: pitchVariant, lead_quality_rating: rating });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Call feedback</p>

      {/* Objection type */}
      <div>
        <label className="block text-[10px] text-slate-500 mb-1">Primary objection</label>
        <select
          value={objectionType}
          onChange={e => setObjectionType(e.target.value)}
          disabled={disabled}
          className={selectCls}
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <option value="">Select objection…</option>
          {OBJECTION_TYPES.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Pitch variant */}
      <div>
        <label className="block text-[10px] text-slate-500 mb-1">Pitch used</label>
        <select
          value={pitchVariant}
          onChange={e => setPitchVariant(e.target.value)}
          disabled={disabled}
          className={selectCls}
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <option value="">Select pitch…</option>
          {PITCH_VARIANTS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Rating — segmented buttons 1–5 */}
      <div>
        <label className="block text-[10px] text-slate-500 mb-1">Lead quality</label>
        <div className="flex gap-1.5">
          {RATING_SCALE.map(n => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => setRating(n)}
              title={RATING_LABELS[n]}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: rating === n ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.04)',
                color: rating === n ? '#facc15' : '#64748b',
                border: `1px solid ${rating === n ? 'rgba(250,204,21,0.4)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {n}
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-[9px] text-slate-600 mt-0.5 text-center">{RATING_LABELS[rating]}</p>
        )}
      </div>

      {err && <p className="text-[10px] text-red-400">{err}</p>}

      <button
        type="submit"
        disabled={disabled || submitting}
        className="w-full py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40"
        style={{ background: '#facc15', color: '#0f172a' }}
      >
        {submitting ? 'Saving…' : 'Save feedback'}
      </button>

      {disabled && (
        <p className="text-[10px] text-slate-600 text-center">Available after a call ends</p>
      )}
    </form>
  );
}
