import { OUTCOME_OPTIONS } from '../../../config/closerOptions';

export default function OutcomeBar({ onSave, saving, disabled }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Close escalation</p>
      <div className="grid grid-cols-2 gap-1.5">
        {OUTCOME_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled || saving}
            onClick={() => onSave(opt.value)}
            className="py-2 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: opt.color,
              border: `1px solid ${opt.color}30`,
            }}
            onMouseEnter={e => { if (!disabled && !saving) e.currentTarget.style.background = `${opt.color}15`; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {disabled && (
        <p className="text-[10px] text-slate-600 text-center">Select a prospect first</p>
      )}
    </div>
  );
}
