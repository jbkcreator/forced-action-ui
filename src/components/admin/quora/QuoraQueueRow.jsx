function fmtRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function priorityColor(score) {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#facc15';
  return '#f87171';
}

const LANE_COLORS = {
  buy_signal:  { bg: 'rgba(74,222,128,0.12)', fg: '#4ade80' },
  lender:      { bg: 'rgba(167,139,250,0.12)', fg: '#a78bfa' },
  sell_signal: { bg: 'rgba(96,165,250,0.12)',  fg: '#60a5fa' },
  education:   { bg: 'rgba(148,163,184,0.12)', fg: '#94a3b8' },
};

function laneStyle(lane) {
  return LANE_COLORS[lane] || { bg: 'rgba(250,204,21,0.12)', fg: '#facc15' };
}

function laneLabel(lane) {
  if (!lane) return 'General';
  return lane.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function QuoraQueueRow({ item, selected, onClick }) {
  const { bg, fg } = laneStyle(item.intent_lane);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 border-b border-white/5 transition-colors"
      style={{
        background: selected ? 'rgba(250,204,21,0.06)' : 'transparent',
        borderLeft: selected ? '2px solid #facc15' : '2px solid transparent',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-white leading-snug line-clamp-2">{item.title}</p>
        <span
          className="shrink-0 text-[11px] font-bold tabular-nums mt-0.5"
          style={{ color: priorityColor(item.priority_score) }}
        >
          {item.priority_score}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: bg, color: fg }}
        >
          {laneLabel(item.intent_lane)}
        </span>
        {item.risk_level && (
          <span className="text-[10px] text-slate-500">
            {item.risk_level} risk
          </span>
        )}
        {item.post_attempts > 0 && (
          <span className="text-[10px] text-orange-400">
            {item.post_attempts} attempt{item.post_attempts !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <p className="text-[10px] text-slate-600 mt-1">{fmtRelative(item.classified_at)}</p>
    </button>
  );
}
