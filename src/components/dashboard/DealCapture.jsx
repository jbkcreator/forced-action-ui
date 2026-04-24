/**
 * DealCapture — one-tap deal outcome reporting for subscribers.
 *
 * Four buckets (<$10K / $10-25K / $25K+ / Skip). Optional dollar amount +
 * days-to-close. Authenticates by feed_uuid — works from an SMS-link click
 * without requiring a login.
 *
 * On submit, POSTs to /api/deal-capture and triggers:
 *   - deal_outcomes row insert
 *   - revenue signal score re-compute
 *   - annual push trigger re-evaluation ($10K+ deals fire the charter offer)
 *   - learning card deal-pattern feed
 *
 * Props:
 *   feedUuid      — subscriber's feed UUID
 *   propertyId    — optional, which lead produced the deal
 *   onCaptured    — callback(result) once the deal is recorded
 *   onDismiss     — callback() when user closes without reporting
 */
import { useState } from 'react';
import { captureDeal } from '../../api/phase2b';
import Icon from '../ui/Icon';


const BUCKETS = [
  { key: '5_10k',    label: '< $10K',    detail: 'Under $10,000' },
  { key: '10_25k',   label: '$10 – 25K', detail: '$10K to $25K' },
  { key: '25k_plus', label: '$25K+',     detail: 'Over $25,000' },
  { key: 'skip',     label: 'Skip',      detail: 'Prefer not to say' },
];


export default function DealCapture({
  feedUuid,
  propertyId = null,
  onCaptured,
  onDismiss,
}) {
  const [selected, setSelected] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [amount, setAmount] = useState('');
  const [daysToClose, setDaysToClose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  if (!feedUuid) return null;

  const canSubmit = selected !== null && !submitting && !done;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await captureDeal({
        feedUuid,
        bucket: selected,
        dealAmount: amount ? parseFloat(amount) : null,
        daysToClose: daysToClose ? parseInt(daysToClose, 10) : null,
        propertyId,
      });
      setDone(true);
      onCaptured?.(result);
    } catch (err) {
      setError(err?.message || 'Could not record deal. Try again?');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-center">
        <Icon name="check-circle" size={32} className="mx-auto text-emerald-400" />
        <h3 className="text-white font-semibold mt-2">Deal logged — thanks.</h3>
        <p className="text-slate-300 text-sm mt-1">
          We're tracking your wins so we can show you better leads.
        </p>
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
        Did this lead close into a deal?
      </h3>
      <p className="text-slate-400 text-xs mt-1">
        One tap — we use this to tune the leads we surface next.
      </p>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {BUCKETS.map(b => (
          <button
            key={b.key}
            type="button"
            onClick={() => {
              setSelected(b.key);
              setShowDetails(b.key !== 'skip');
            }}
            className={
              'rounded-lg px-3 py-3 text-left border transition-colors ' +
              (selected === b.key
                ? 'bg-yellow-400/20 border-yellow-400/60 text-white'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10')
            }
            aria-pressed={selected === b.key}
          >
            <div className="font-semibold text-sm">{b.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{b.detail}</div>
          </button>
        ))}
      </div>

      {showDetails && (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs text-slate-400">Exact amount (optional)</span>
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

      {error && (
        <p className="mt-3 text-red-400 text-xs">{error}</p>
      )}

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
