import { DISTRESS_TAG_COLORS } from '../../config/constants';

const SCORE_FILTERS = [
  { label: 'All', value: '' },
  { label: '70+', value: '70' },
  { label: '80+', value: '80' },
  { label: '90+', value: '90' },
];

const SIGNAL_TYPES = Object.keys(DISTRESS_TAG_COLORS);

function formatLabel(s) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function FilterBar({ minScore, incidentType, onFilterChange }) {
  return (
    <div className="space-y-3">
      {/* Score filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500 font-medium mr-1">Min Score:</span>
        {SCORE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange('min_score', f.value)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
              minScore === f.value
                ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/30'
                : 'bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Signal type filter */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
        <span className="text-xs text-slate-500 font-medium mr-1 shrink-0">Signal:</span>
        <button
          onClick={() => onFilterChange('incident_type', '')}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition shrink-0 ${
            !incidentType
              ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/30'
              : 'bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08]'
          }`}
        >
          All
        </button>
        {SIGNAL_TYPES.map((type) => {
          const colors = DISTRESS_TAG_COLORS[type];
          const active = incidentType === type;
          return (
            <button
              key={type}
              onClick={() => onFilterChange('incident_type', active ? '' : type)}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition shrink-0"
              style={active ? {
                background: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`,
              } : {
                background: 'rgba(255,255,255,0.04)',
                color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {formatLabel(type)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
