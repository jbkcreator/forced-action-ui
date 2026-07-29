/**
 * ActivationTracker — T-B12-05 (Tier2 trust/proof layer + 5-min activation onboarding).
 *
 * Distinct from the generic OnboardingChecklist: this is a time-boxed 5-minute
 * activation sequence for brand-new free-tier signups. It reads the
 * `subscriber.activation` timestamps surfaced by GET /api/feed/{feed_uuid}
 * (signup_time / first_leads_shown_time / first_unlock_time) and renders:
 *
 *   1. A live "time since signup" clock while activation hasn't happened yet.
 *   2. A single "Unlock first contact" CTA that scrolls to + fires the same
 *      unlock flow as BlurredStackSection's per-lead CTA — first-contact-
 *      unlock is the activation event (locked decision).
 *
 * Card styling matches its dashboard neighbor FreeTierUpgradeCard (glass +
 * thin accent border + p-5/my-4) rather than the landing-page TrustBar,
 * which is sized/spaced for a full-width hero section, not a compact card.
 *
 * Stops rendering once first_unlock_time is set (activation complete) or the
 * subscriber is no longer on the free tier.
 */
import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';

const ACTIVATION_WINDOW_SECONDS = 5 * 60;

function elapsedSeconds(isoTimestamp) {
  if (!isoTimestamp) return 0;
  const started = new Date(isoTimestamp).getTime();
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Math.floor((Date.now() - started) / 1000));
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ActivationTracker({ subscriber, leadCount, onUnlockFirstLead }) {
  const activation = subscriber?.activation;
  const signupTime = activation?.signup_time || subscriber?.created_at;
  const leadsShown = !!activation?.first_leads_shown_time;
  const unlocked = !!activation?.first_unlock_time;

  const [elapsed, setElapsed] = useState(() => elapsedSeconds(signupTime));

  useEffect(() => {
    if (unlocked || !signupTime) return undefined;
    setElapsed(elapsedSeconds(signupTime));
    const id = setInterval(() => {
      const next = elapsedSeconds(signupTime);
      setElapsed(next);
      // Stop ticking once past the activation window — nothing left to count down.
      if (next > ACTIVATION_WINDOW_SECONDS) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [signupTime, unlocked]);

  if (subscriber?.tier !== 'free' || unlocked || !signupTime) return null;

  const withinWindow = elapsed <= ACTIVATION_WINDOW_SECONDS;
  const remaining = Math.max(0, ACTIVATION_WINDOW_SECONDS - elapsed);

  return (
    <div className="glass rounded-2xl p-5 my-4 border border-fa-primary/20 animate-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-fa-text-primary flex items-center gap-2">
            <Icon name="bolt" size={18} className="text-fa-primary" />
            Get your first lead in 5 minutes
          </h3>
          <p className="text-sm text-fa-text-secondary mt-1">
            {leadsShown
              ? `${leadCount || 'Your'} real scored lead${leadCount === 1 ? '' : 's'} for your ZIP are ready below — scores and distress signals visible now.`
              : 'Pulling real scored leads for your ZIP…'}
            {' '}Unlock one to see the owner + contact info.
          </p>
        </div>
        {withinWindow ? (
          <div className="shrink-0 text-right">
            <span className="font-mono text-lg font-bold text-fa-status-available">
              {formatClock(remaining)}
            </span>
            <p className="text-[11px] text-fa-text-muted">left in your activation window</p>
          </div>
        ) : (
          <div className="shrink-0 text-right">
            <p className="text-xs font-semibold text-fa-status-taken">Window closed</p>
            <p className="text-[11px] text-fa-text-muted">unlock anytime below</p>
          </div>
        )}
      </div>

      {leadsShown && (
        <button
          type="button"
          onClick={onUnlockFirstLead}
          className="mt-4 w-full sm:w-auto bg-fa-primary hover:bg-fa-primary-hover text-fa-bg-base font-bold px-5 py-2.5 rounded-xl text-sm transition"
        >
          Unlock first contact — $4
        </button>
      )}
    </div>
  );
}
