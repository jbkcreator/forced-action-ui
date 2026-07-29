/**
 * DealCapture — one-tap deal outcome reporting for subscribers (Block 13).
 *
 * Three outcome states on the delivered-lead card:
 *   - closed  → the deal closed. Optional amount + days-to-close.
 *   - dead    → the lead went nowhere. A reason is REQUIRED. Reasons split into
 *               lead-fault (feeds lead scoring) and buyer-side (score-protected).
 *   - pending → still working it. Recorded, but fires no win/loss learning.
 *
 * Authenticates by feed_uuid — works from an SMS-link click without a login.
 *
 * On submit, POSTs to /api/deal-capture, which writes the DealOutcome row and
 * (for closed) returns the share-ready win graphic. Recalculation (scoring /
 * loss autopsy) is fanned out asynchronously server-side.
 *
 * Props:
 *   feedUuid      — subscriber's feed UUID
 *   propertyId    — optional, which lead produced the deal
 *   onCaptured    — callback(result) once the outcome is recorded
 *   onDismiss     — callback() when user closes without reporting
 */
import { useState } from 'react';
import { captureDeal } from '../../api/phase2b';
import { OUTCOME_STATES, REVENUE_BUCKETS, DEAD_REASONS } from '../../config/dealOutcomeOptions';
import Icon from '../ui/Icon';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';


const OUTCOMES = [
  { key: 'closed',  label: 'Closed',  detail: 'Won the deal',     icon: 'check-circle' },
  { key: 'dead',    label: 'Dead',    detail: 'Went nowhere',     icon: 'x' },
  { key: 'pending', label: 'Pending', detail: 'Still working it',  icon: 'clock' },
];

// Mirrors backend src/services/outcome_reasons.py. Lead-fault reasons feed the
// lead score; buyer-side reasons are score-protected (logged, not scored).
const DEAD_REASONS = [
  { key: 'bad_contact_info',     label: 'Bad contact info',       group: 'The lead' },
  { key: 'already_sold_listed',  label: 'Already sold / listed',  group: 'The lead' },
  { key: 'owner_not_distressed', label: 'Owner not distressed',   group: 'The lead' },
  { key: 'wrong_owner',          label: 'Wrong owner',            group: 'The lead' },
  { key: 'no_conversation',      label: "Couldn't reach them",    group: 'On my side' },
  { key: 'declined',             label: 'They declined',          group: 'On my side' },
  { key: 'too_busy',             label: 'Too busy right now',     group: 'On my side' },
  { key: 'budget',               label: "Budget / couldn't fund", group: 'On my side' },
];

const REASON_GROUPS = ['The lead', 'On my side'];


export default function DealCapture({
  feedUuid,
  propertyId = null,
  onCaptured,
  onDismiss,
}) {
  const [outcome, setOutcome] = useState(null);
  const [deadReason, setDeadReason] = useState(null);
  const [amount, setAmount] = useState('');
  const [daysToClose, setDaysToClose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);

  if (!feedUuid) return null;

  // dead requires a reason before submit is allowed.
  const canSubmit =
    outcome !== null &&
    !submitting &&
    !done &&
    (outcome !== 'dead' || deadReason !== null);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await captureDeal({
        feedUuid,
        outcomeState: outcome,
        deadReason: outcome === 'dead' ? deadReason : null,
        dealAmount: outcome === 'closed' && amount ? parseFloat(amount) : null,
        daysToClose:
          outcome === 'closed' && daysToClose ? parseInt(daysToClose, 10) : null,
        propertyId,
      });
      setResult(res);
      setDone(true);
      onCaptured?.(res);
    } catch (err) {
      setError(err?.message || 'Could not record outcome. Try again?');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyShare = async () => {
    if (!result?.graphic_url) return;
    const fullUrl = `${API_BASE || window.location.origin}${result.graphic_url}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* Fallback: user can long-press the image */
    }
  };

  const handleNativeShare = async () => {
    if (!result?.graphic_url) return;
    const fullUrl = `${API_BASE || window.location.origin}${result.graphic_url}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Closed a deal with Forced Action',
          text: 'Just closed another one.',
          url: fullUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopyShare();
    }
  };

  if (done) {
    const graphicUrl = result?.graphic_url
      ? `${API_BASE}${result.graphic_url}`
      : null;
    const headline =
      outcome === 'closed'
        ? 'Deal logged — nice work.'
        : outcome === 'pending'
          ? "Marked pending — we'll keep it open."
          : 'Logged — thanks for the signal.';
    return (
      <section className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-center">
        <Icon name="check-circle" size={32} className="mx-auto text-emerald-400" />
        <h3 className="text-white font-semibold mt-2">{headline}</h3>
        <p className="text-slate-300 text-sm mt-1">
          We use every outcome to tune the leads we surface next.
        </p>

        {graphicUrl && (
          <div className="mt-4">
            <p className="text-slate-300 text-xs mb-2">Your share-ready win card:</p>
            <a href={graphicUrl} target="_blank" rel="noreferrer" className="block">
              <img
                src={graphicUrl}
                alt="Your deal-win share card"
                className="rounded-lg border border-white/10 mx-auto max-w-full"
                style={{ maxHeight: 280 }}
              />
            </a>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleNativeShare}
                className="cta-primary text-xs px-4 py-2"
              >
                Share win
              </button>
              <button
                type="button"
                onClick={handleCopyShare}
                className="text-xs px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10"
              >
                {shareCopied ? 'Copied ✓' : 'Copy link'}
              </button>
            </div>
          </div>
        )}

        {result?.annual_offered && (
          <div className="mt-5 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3 text-left">
            <p className="text-yellow-200 text-xs font-semibold">
              You just earned the annual lock offer.
            </p>
            <p className="text-slate-300 text-xs mt-1">
              Lock 12 months at $1,970/yr — 2 months free. Check your email
              for the one-tap link, or visit your dashboard with{' '}
              <code className="text-yellow-200">?annual=accept</code>.
            </p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      className="relative rounded-xl border border-white/10 bg-slate-900/70 p-5"
      aria-labelledby="deal-capture-heading"
    >
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-3 text-slate-400 hover:text-white"
          type="button"
        >
          <Icon name="x" size={14} />
        </button>
      )}

      <h3 id="deal-capture-heading" className="text-white font-semibold text-base">
        What happened with this lead?
      </h3>
      <p className="text-slate-400 text-xs mt-1">
        One tap — we use this to tune the leads we surface next.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {OUTCOMES.map(o => (
          <button
            key={o.key}
            type="button"
            onClick={() => {
              setOutcome(o.key);
              if (o.key !== 'dead') setDeadReason(null);
            }}
            className={
              'rounded-lg px-3 py-3 text-center border transition-colors ' +
              (outcome === o.key
                ? 'bg-yellow-400/20 border-yellow-400/60 text-white'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10')
            }
            aria-pressed={outcome === o.key}
          >
            <Icon name={o.icon} size={18} className="mx-auto" />
            <div className="font-semibold text-sm mt-1">{o.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{o.detail}</div>
          </button>
        ))}
      </div>

      {outcome === 'closed' && (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs text-slate-400">Deal amount (optional)</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              placeholder="e.g. 18500"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:border-yellow-400/60 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-400">Days to close (optional)</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              placeholder="e.g. 18"
              value={daysToClose}
              onChange={e => setDaysToClose(e.target.value)}
              className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:border-yellow-400/60 focus:outline-none"
            />
          </label>
        </div>
      )}

      {outcome === 'dead' && (
        <fieldset className="mt-4">
          <legend className="text-xs text-slate-400">
            Why? <span className="text-red-400">(required)</span>
          </legend>
          <div className="mt-2 space-y-3">
            {REASON_GROUPS.map(group => (
              <div key={group}>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">{group}</p>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {DEAD_REASONS.filter(r => r.group === group).map(r => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setDeadReason(r.key)}
                      className={
                        'rounded-lg px-3 py-2 text-left text-sm border transition-colors ' +
                        (deadReason === r.key
                          ? 'bg-yellow-400/20 border-yellow-400/60 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10')
                      }
                      aria-pressed={deadReason === r.key}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      )}

      {outcome === 'pending' && (
        <p className="mt-4 text-slate-400 text-xs">
          We'll leave this lead open and won't score it until you close or kill it.
        </p>
      )}

      {error && <p className="mt-3 text-red-400 text-xs">{error}</p>}

      <div className="mt-4 flex items-center justify-end gap-3">
        {onDismiss && (
          <button
            onClick={onDismiss}
            type="button"
            className="text-slate-400 hover:text-white text-sm"
          >
            Not now
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          type="button"
          className="cta-primary text-sm px-5 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving…' : 'Submit'}
        </button>
      </div>
    </section>
  );
}
