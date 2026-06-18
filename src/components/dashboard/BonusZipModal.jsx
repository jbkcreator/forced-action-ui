/**
 * BonusZipModal — S5 Referral / Ambassador Loop
 *
 * Lets a subscriber redeem an earned bonus ZIP slot (granted at referral
 * milestones). Calls POST /api/referral/claim-bonus-zip/{feed_uuid}.
 *
 * Backend responses:
 *   200 → { ok, zip_code, bonus_zip_slots_remaining }
 *   409 → no bonus slots available
 *   400 → ZIP validation failed / already owned / out of county
 *
 * Renders inside the shared <Modal> primitive (same pattern as PauseModal).
 */
import { useState } from 'react';
import Modal from '../ui/Modal';
import { claimBonusZip } from '../../api/dashboard';

const ZIP_RE = /^\d{5}$/;

// The backend may return `detail` as a plain string OR a nested object
// ({ error, message }). Always resolve to a renderable string — rendering the
// raw object as a React child throws "Objects are not valid as a React child".
function errorText(e, fallback) {
  const d = e?.detail;
  if (typeof d === 'string') return d;
  if (d && typeof d === 'object') return d.message || d.error || fallback;
  if (typeof e?.message === 'string') return e.message;
  return fallback;
}

export default function BonusZipModal({ isOpen, onClose, feedUuid, slotsAvailable, onClaimed }) {
  const [zip, setZip] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null); // { zip_code, bonus_zip_slots_remaining }

  const valid = ZIP_RE.test(zip.trim());

  const reset = () => {
    setZip('');
    setError(null);
    setDone(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onConfirm = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await claimBonusZip(feedUuid, zip.trim());
      setDone(res);
      onClaimed?.(res);
    } catch (e) {
      if (e?.status === 409) {
        setError(errorText(e, 'No bonus slots available.'));
      } else if (e?.status === 400) {
        setError(errorText(e, 'That ZIP can’t be claimed — it may be owned, out of county, or invalid.'));
      } else {
        setError(errorText(e, 'Could not claim ZIP. Please try again.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="glass-strong rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {done ? (
          <>
            <h2 className="text-xl font-bold mb-3 text-white">ZIP {done.zip_code} claimed ✓</h2>
            <p className="text-slate-300 text-sm mb-5">
              You’ve locked a bonus ZIP slot.{' '}
              {done.bonus_zip_slots_remaining > 0
                ? `${done.bonus_zip_slots_remaining} bonus slot${done.bonus_zip_slots_remaining === 1 ? '' : 's'} remaining.`
                : 'No bonus slots remaining.'}
            </p>
            <button
              onClick={handleClose}
              type="button"
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold transition-colors"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-1 text-white">Claim a bonus ZIP</h2>
            <p className="text-slate-400 text-sm mb-5">
              {slotsAvailable} bonus slot{slotsAvailable === 1 ? '' : 's'} available. Enter a
              5-digit ZIP in your county to lock it.
            </p>

            <label htmlFor="bonus-zip" className="block text-xs font-semibold text-slate-300 mb-1.5">
              ZIP code
            </label>
            <input
              id="bonus-zip"
              type="text"
              inputMode="numeric"
              maxLength={5}
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(); }}
              placeholder="33612"
              className="w-full rounded-xl bg-slate-950/60 border border-white/10 px-4 py-3 text-white text-sm font-mono tracking-wide focus:outline-none focus:border-yellow-400/50"
              autoFocus
            />

            {error && <p className="text-red-400 text-sm mt-3" role="alert">{error}</p>}

            <div className="flex flex-col gap-3 mt-5">
              <button
                onClick={onConfirm}
                disabled={!valid || submitting}
                type="button"
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Claiming…' : 'Claim ZIP'}
              </button>
              <button
                onClick={handleClose}
                disabled={submitting}
                type="button"
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
