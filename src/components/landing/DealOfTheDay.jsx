/**
 * DealOfTheDay — T-B12-07.
 *
 * Daily exclusive-unlock surface: today's top-CDS lead, with a live countdown
 * to the 24h window close. Scarcity framing only — this is standard price,
 * NOT a discount (locked decision, see .wayfinder/tickets/T-B12-07.md).
 * Reuses the masked-address convention from ProofMoment.
 */
import { useEffect, useState } from 'react';
import { fetchDealOfTheDay } from '../../api/landing';
import Icon from '../ui/Icon';

function tierBadgeClass(t) {
  const k = (t || '').toLowerCase();
  if (k.includes('platinum') || k.includes('ultra')) return 'score-platinum';
  if (k.includes('gold')) return 'score-gold';
  return 'score-silver';
}

function maskAddress(address) {
  return address
    ? address.replace(/\d+\s+[A-Za-z]+/, '••• ••••••')
    : '••• •••••• St';
}

function formatCountdown(msRemaining) {
  if (msRemaining <= 0) return '0:00:00';
  const totalSeconds = Math.floor(msRemaining / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function DealOfTheDay({ onUnlock }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDealOfTheDay()
      .then((data) => { if (!cancelled) setPayload(data); })
      .catch(() => { if (!cancelled) setPayload({ status: 'empty', deal: null }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (payload?.status !== 'live') return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [payload?.status]);

  if (loading) {
    return (
      <section className="max-w-2xl mx-auto px-6 py-6">
        <p className="text-slate-400 text-sm text-center">Loading today's exclusive deal…</p>
      </section>
    );
  }

  if (!payload || payload.status !== 'live' || !payload.deal) {
    return null;
  }

  const { deal } = payload;
  const windowEndMs = new Date(payload.window_end).getTime();
  const remainingMs = windowEndMs - now;
  const maskedAddress = maskAddress(deal.address_masked || deal.address);

  return (
    <section className="max-w-2xl mx-auto px-6 py-8">
      <div className="glass-strong rounded-2xl p-6 border border-fa-primary/30">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Icon name="bolt" size={18} className="text-fa-primary" />
            Deal of the Day
          </h3>
          <div className="text-right shrink-0">
            <span className="font-mono text-lg font-bold text-fa-primary">
              {formatCountdown(remainingMs)}
            </span>
            <p className="text-[11px] text-fa-text-muted">exclusive window closes</p>
          </div>
        </div>

        <div className="sample-lead-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-fa-text-primary text-sm blur-[3px] select-none">{maskedAddress}</p>
              <p className="text-fa-text-muted text-xs mt-0.5">
                {deal.city ? `${deal.city}, ${deal.state || 'FL'}` : ''} {deal.zip}
              </p>
              {deal.distress_types?.length > 0 && (
                <p className="text-fa-text-muted text-xs mt-1">{deal.distress_types.join(' · ')}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={`score-badge ${tierBadgeClass(deal.lead_tier)}`}>
                {deal.lead_tier}
              </span>
              {deal.score != null && (
                <span className="text-xs text-fa-text-secondary">
                  Score: <span className="text-fa-text-primary font-medium">{Math.round(deal.score)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-fa-border-default text-center">
          <p className="text-xs text-fa-text-secondary mb-4">
            One exclusive lead, one 24-hour window — first come, first served, at
            standard price.
          </p>
          <button
            type="button"
            onClick={() => onUnlock?.(deal)}
            className="bg-fa-primary hover:bg-fa-primary-hover text-fa-bg-base font-bold px-8 py-3 rounded-xl text-sm transition"
          >
            Unlock now
          </button>
        </div>
      </div>
    </section>
  );
}
