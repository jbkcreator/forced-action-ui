import { memo } from 'react';
import { DISTRESS_TAG_COLORS } from '../../config/constants';

function formatTagLabel(s) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function BlurredCard({ lead, onUnlockLead, onUnlockHotLead }) {
  const isHotCta = lead.is_hot && !!onUnlockHotLead;
  const tier = lead.lead_tier || '';
  const tierColor =
    tier === 'Ultra Platinum' ? 'text-purple-400'
    : tier === 'Platinum' ? 'text-yellow-400'
    : tier === 'Gold' ? 'text-amber-400'
    : 'text-slate-400';
  const tierClass =
    tier === 'Ultra Platinum' ? 'tier-ultra-platinum'
    : tier === 'Platinum' ? 'tier-platinum'
    : tier === 'Gold' ? 'tier-gold'
    : 'tier-default';
  const score = Math.round(lead.score || 0);

  return (
    <div className={`lead-card glass ${tierClass} rounded-2xl p-5`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <p
            className="font-semibold text-white text-base truncate select-none"
            style={{ filter: 'blur(5px)', userSelect: 'none' }}
            aria-hidden="true"
          >
            {lead.address_masked || '••• ••••••••••'}
          </p>
          <p className="text-slate-400 text-sm mt-0.5">
            {lead.city || ''}{lead.city ? ', ' : ''}{lead.state || ''} {lead.zip || ''}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-center">
          <div className="rounded-full bg-white/5 px-3 py-2 text-center">
            <span className="block text-lg font-extrabold leading-none">{score}</span>
            <span className="block text-[9px] text-slate-400 font-medium leading-none mt-0.5">CDS</span>
          </div>
          <p className={`${tierColor} text-xs font-semibold mt-1.5`}>{tier}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {(lead.distress_types || []).map((d, i) => {
          const colors = DISTRESS_TAG_COLORS[d] || {};
          return (
            <span
              key={i}
              className="text-xs rounded-full px-2.5 py-1 font-medium"
              style={{
                background: colors.bg || 'rgba(255,255,255,0.06)',
                color: colors.text || '#cbd5e1',
                border: `1px solid ${colors.border || 'rgba(255,255,255,0.12)'}`,
              }}
            >
              {formatTagLabel(d)}
            </span>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          <span className="text-slate-300 font-medium">🔒 Owner + contact hidden.</span> Reveal phone, email, and address.
        </div>
        <button
          type="button"
          onClick={() => (isHotCta ? onUnlockHotLead : onUnlockLead)?.({
            property_id: lead.property_id,
            address: lead.address_masked,
            lead_tier: lead.lead_tier,
            zip: lead.zip,
          })}
          className="shrink-0 text-sm font-semibold px-4 py-2 rounded-lg bg-yellow-400 text-slate-900 hover:bg-yellow-300 transition"
        >
          {isHotCta ? 'Unlock $150' : 'Unlock $4'}
        </button>
      </div>
    </div>
  );
}

function BlurredStackSection({ blurred, onUnlockLead, onUnlockHotLead }) {
  if (!blurred || blurred.length === 0) return null;
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold tracking-tight">Available to Unlock</h2>
        <span className="text-slate-400 text-xs font-medium">
          {blurred.length} blurred lead{blurred.length !== 1 ? 's' : ''} · hot leads $150, rest $4
        </span>
      </div>
      <div className="space-y-3">
        {blurred.map((lead) => (
          <BlurredCard
            key={lead.property_id}
            lead={lead}
            onUnlockLead={onUnlockLead}
            onUnlockHotLead={onUnlockHotLead}
          />
        ))}
      </div>
    </div>
  );
}

export default memo(BlurredStackSection);
