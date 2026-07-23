/**
 * ActivationTracker — T-B12-05 (Tier2 trust/proof layer + 5-min activation onboarding).
 *
 * Distinct from the generic OnboardingChecklist: this is a time-boxed 5-minute
 * activation sequence for brand-new free-tier signups. It reads the
 * `subscriber.activation` timestamps surfaced by GET /api/feed/{feed_uuid}
 * (signup_time / first_leads_shown_time / first_unlock_time) and renders:
 *
 *   1. A live "time since signup" clock while activation hasn't happened yet.
 *   2. Reuses TrustBar for surrounding trust signal (per ticket — do not
 *      rebuild proof UI, just wire the new activation dashboard state).
 *   3. A single "Unlock first contact" CTA that scrolls to + fires the same
 *      unlock flow as BlurredStackSection's per-lead CTA — first-contact-
 *      unlock is the activation event (locked decision).
 *
 * Stops rendering once first_unlock_time is set (activation complete) or the
 * subscriber is no longer on the free tier.
 */
import { useEffect, useState } from 'react';
import TrustBar from '../landing/TrustBar';
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
    const id = setInterval(() => setElapsed(elapsedSeconds(signupTime)), 1000);
    return () => clearInterval(id);
  }, [signupTime, unlocked]);

  if (subscriber?.tier !== 'free' || unlocked || !signupTime) return null;

  const withinWindow = elapsed <= ACTIVATION_WINDOW_SECONDS;
  const remaining = Math.max(0, ACTIVATION_WINDOW_SECONDS - elapsed);

  return (
    <div className="glass-strong rounded-2xl p-6 mb-6 animate-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <Icon name="bolt" size={18} className="text-yellow-400" />
            Get your first lead in 5 minutes
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {leadsShown
              ? `${leadCount || 'Your'} real scored lead${leadCount === 1 ? '' : 's'} for your ZIP are ready below — scores and distress signals visible now.`
              : 'Pulling real scored leads for your ZIP…'}
            {' '}Unlock one to see the owner + contact info.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span
            className={`font-mono text-lg font-bold ${withinWindow ? 'text-emerald-400' : 'text-slate-400'}`}
          >
            {withinWindow ? formatClock(remaining) : formatClock(elapsed)}
          </span>
          <p className="text-[11px] text-slate-500">
            {withinWindow ? 'left in your activation window' : 'since signup'}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <TrustBar />
      </div>

      {leadsShown && (
        <button
          type="button"
          onClick={onUnlockFirstLead}
          className="mt-2 w-full sm:w-auto cta-primary text-sm px-5 py-2.5"
        >
          Unlock first contact — $4
        </button>
      )}
    </div>
  );
}
