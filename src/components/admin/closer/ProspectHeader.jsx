import { VERTICAL_LABELS } from '../../../config/constants';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };

function fmtPrice(cents) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 });
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

export default function ProspectHeader({ queueItem, detail }) {
  const vertical = VERTICAL_LABELS[queueItem.vertical] || queueItem.vertical;
  const tier = TIER_LABELS[queueItem.target_tier] || queueItem.target_tier;
  const tags = detail?.tags || [];
  const openDeals = detail?.open_deals_count ?? 0;

  return (
    <div className="rounded-xl p-4 space-y-3" style={card}>
      {/* Name + RSS */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-white leading-tight truncate">{queueItem.subscriber_name}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(250,204,21,0.12)', color: '#facc15' }}
            >
              {vertical}
            </span>
            <span className="text-[10px] text-slate-500">{tier} · {fmtPrice(queueItem.target_tier_price_cents)}/mo</span>
          </div>
        </div>
        <div className="text-center shrink-0">
          <div className="text-2xl font-black tabular-nums" style={{ color: rssColor(queueItem.revenue_signal_score) }}>
            {queueItem.revenue_signal_score}
          </div>
          <div className="text-[9px] text-slate-500 uppercase tracking-wide">RSS</div>
        </div>
      </div>

      {/* Contact info */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <a
          href={`tel:${queueItem.subscriber_phone}`}
          className="flex items-center gap-1.5 text-slate-300 hover:text-yellow-300 transition-colors"
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {queueItem.subscriber_phone}
        </a>
        <a
          href={`mailto:${queueItem.subscriber_email}`}
          className="flex items-center gap-1.5 text-slate-300 hover:text-yellow-300 transition-colors truncate"
        >
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="truncate">{queueItem.subscriber_email}</span>
        </a>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500 border-t border-white/5 pt-2">
        <span>{queueItem.interactions_count} Lifecycle interactions</span>
        {openDeals > 0 && <span>{openDeals} open deal{openDeals !== 1 ? 's' : ''}</span>}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
