/**
 * ProofMoment — the very first thing a brand-new subscriber sees.
 *
 * Renders exactly 3 real qualified leads: 1 fully revealed + 2 blurred.
 * The blurred pair carry "Unlock for $4" CTAs that open the Payment Sheet.
 *
 * This is the v9 monetization-wall anchor: the user sees real value
 * (the revealed lead) right next to value they cannot reach without paying
 * (the two blurred ones). Countdown + ROI framing live in the separate
 * MonetizationWall component; this one is pure lead presentation.
 *
 * Props:
 *   vertical     — the subscriber's vertical (roofing / remediation / ...)
 *   countyId     — their county
 *   onUnlock     — callback(lead) invoked when user taps an Unlock CTA
 */
import { useEffect, useState } from 'react';
import { fetchProofLeads } from '../../api/phase2b';
import Icon from '../ui/Icon';

function tierBadgeClass(t) {
  const k = (t || '').toLowerCase();
  if (k.includes('platinum') || k.includes('ultra')) return 'score-platinum';
  if (k.includes('gold')) return 'score-gold';
  return 'score-silver';
}

function tierCardClass(t) {
  const k = (t || '').toLowerCase();
  if (k.includes('platinum') || k.includes('ultra')) return 'sample-lead-platinum';
  if (k.includes('gold')) return 'sample-lead-gold';
  return 'sample-lead-silver';
}

function tierLabel(t) {
  if (!t) return 'Scored';
  return t.toString().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function LeadRevealed({ lead }) {
  return (
    <div className={`sample-lead-card ${tierCardClass(lead.lead_tier)}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">{lead.address}</p>
          <p className="text-slate-400 text-xs mt-0.5">
            {lead.city ? `${lead.city}, FL` : ''} {lead.zip}
          </p>
          {lead.distress_types?.length > 0 && (
            <p className="text-slate-500 text-xs mt-1">{lead.distress_types.join(' · ')}</p>
          )}
          {lead.owner_name && (
            <p className="text-emerald-300 text-xs mt-1 flex items-center gap-1">
              <Icon name="user" size={12} /> Owner: <span className="text-white">{lead.owner_name}</span>
            </p>
          )}
          {lead.phone && (
            <p className="text-emerald-300 text-xs mt-1 flex items-center gap-1">
              <Icon name="phone" size={12} /> <span className="font-mono text-white">{lead.phone}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`score-badge ${tierBadgeClass(lead.lead_tier)}`}>
            {tierLabel(lead.lead_tier)}
          </span>
          {lead.score != null && (
            <span className="text-xs text-slate-400">
              Score: <span className="text-white font-medium">{Math.round(lead.score)}</span>
            </span>
          )}
          <span className="text-xs text-emerald-400 font-semibold mt-1">FREE preview</span>
        </div>
      </div>
    </div>
  );
}

function LeadBlurred({ lead, onUnlock }) {
  const maskedAddress = lead.address
    ? lead.address.replace(/\d+\s+[A-Za-z]+/, '••• ••••••')
    : '••• •••••• St';
  return (
    <div className={`sample-lead-card ${tierCardClass(lead.lead_tier)} relative`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm blur-[3px] select-none">{maskedAddress}</p>
          <p className="text-slate-500 text-xs mt-0.5">
            {lead.city ? `${lead.city}, FL` : ''} {lead.zip}
          </p>
          {lead.distress_types?.length > 0 && (
            <p className="text-slate-500 text-xs mt-1">{lead.distress_types.join(' · ')}</p>
          )}
          <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
            <Icon name="lock" size={12} /> Owner + phone hidden
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`score-badge ${tierBadgeClass(lead.lead_tier)}`}>
            {tierLabel(lead.lead_tier)}
          </span>
          {lead.score != null && (
            <span className="text-xs text-slate-400">
              Score: <span className="text-white font-medium">{Math.round(lead.score)}</span>
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-slate-500">Unlock full address + owner + phone</span>
        <button
          onClick={() => onUnlock?.(lead)}
          className="cta-primary text-xs px-4 py-1.5"
          type="button"
        >
          Unlock $4
        </button>
      </div>
    </div>
  );
}


export default function ProofMoment({ vertical = 'roofing', countyId = 'hillsborough', onUnlock }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProofLeads({ vertical, countyId })
      .then(data => { if (!cancelled) setPayload(data); })
      .catch(err => { if (!cancelled) setError(err?.message || 'Could not load leads'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [vertical, countyId]);

  if (loading) {
    return (
      <section className="max-w-3xl mx-auto px-6 py-6">
        <p className="text-slate-400 text-sm text-center">Pulling your first leads…</p>
      </section>
    );
  }

  if (error || !payload || (!payload.revealed && (!payload.blurred || payload.blurred.length === 0))) {
    return (
      <section className="max-w-3xl mx-auto px-6 py-6">
        <p className="text-slate-400 text-sm text-center">
          No qualified leads in {countyId} for {vertical} yet — new data arrives nightly.
        </p>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-6 py-8">
      <h2 className="text-2xl font-bold text-center">Here's what Forced Action just found for you</h2>
      <p className="text-slate-400 text-sm text-center mt-1 mb-6">
        3 real scored properties in your area. One free preview. Two hidden.
      </p>

      <div className="space-y-3">
        {payload.revealed && <LeadRevealed lead={payload.revealed} />}
        {(payload.blurred || []).map((lead, i) => (
          <LeadBlurred key={i} lead={lead} onUnlock={onUnlock} />
        ))}
      </div>

      <p className="text-slate-500 text-xs text-center mt-6">
        Every paid unlock saves your card so the next one is one tap.
      </p>
    </section>
  );
}
