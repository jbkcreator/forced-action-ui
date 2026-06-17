import { VERTICAL_LABELS } from '../../../config/constants';

function fmtPrice(cents) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 });
}

function fmtRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function rssColor(score) {
  if (score >= 80) return '#4ade80';
  if (score >= 60) return '#facc15';
  return '#f87171';
}

const TIER_LABELS = {
  starter: 'Starter',
  autopilot_pro: 'Autopilot Pro',
  annual_lock: 'Annual Lock',
  dominator: 'Dominator',
};

export default function QueueRow({ item, selected, onClick }) {
  const vertical = VERTICAL_LABELS[item.vertical] || item.vertical;
  const tier = TIER_LABELS[item.target_tier] || item.target_tier;

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
      {/* Name + RSS */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-white leading-snug truncate">{item.subscriber_name}</p>
        <span
          className="shrink-0 text-[11px] font-bold tabular-nums"
          style={{ color: rssColor(item.revenue_signal_score) }}
        >
          {item.revenue_signal_score}
        </span>
      </div>

      {/* Vertical + tier */}
      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: 'rgba(250,204,21,0.12)', color: '#facc15' }}
        >
          {vertical}
        </span>
        <span className="text-[10px] text-slate-500">{tier} · {fmtPrice(item.target_tier_price_cents)}/mo</span>
      </div>

      {/* Routed time */}
      <p className="text-[10px] text-slate-600 mt-1">{fmtRelative(item.routed_at)}</p>
    </button>
  );
}
