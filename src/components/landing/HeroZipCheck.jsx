import { useState } from 'react';
import { useLanding } from './LandingContext';
import { fetchHeroScoredDeal } from '../../api/landing';
import BlurredStackSection from '../dashboard/BlurredStackSection';
import CountyScarcityBar from '../dashboard/CountyScarcityBar';
import WaitlistForm from './WaitlistForm';

/**
 * T-B12-01 — Tier1 live-data hero.
 *
 * Manual-entry-first ZIP box (no IP-geo — see .wayfinder/tickets/T-B12-01.md).
 * On submit, queries GET /api/hero/scored-deal for a real scored lead in that
 * ZIP and renders it via the existing blurred-card component. Three states:
 *   - zip_match: a real scored deal in the visitor's own ZIP
 *   - nearest:   no deal in-ZIP, nearest real scored deal shown, honestly labeled
 *   - empty:     nothing statewide — waitlist capture instead
 */
export default function HeroZipCheck({ onUnlock }) {
  const { selectedVertical } = useLanding();
  const [zip, setZip] = useState('');
  const [checkedZip, setCheckedZip] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | error | result
  const [result, setResult] = useState(null);
  const [zipFullyLocked, setZipFullyLocked] = useState(false);

  async function handleCheck() {
    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setState('error');
      setResult({ message: 'Please enter a valid 5-digit ZIP code.' });
      return;
    }

    setState('loading');
    setCheckedZip(trimmed);
    setZipFullyLocked(false);

    try {
      const data = await fetchHeroScoredDeal(trimmed, selectedVertical);
      setResult(data);
      setState('result');
    } catch {
      setState('error');
      setResult({ message: 'Could not check that ZIP right now. Please try again.' });
    }
  }

  const handleUnlockClick = (lead) => {
    if (onUnlock) onUnlock(lead);
    else document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-xl mx-auto mt-6 animate-fade-in-up delay-300">
      <div className="glass-card rounded-2xl p-2">
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={5}
            placeholder="Enter your ZIP to see deals in your area"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
            onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
            className="flex-1 bg-transparent border-0 rounded-xl px-5 py-4 text-white text-base placeholder-slate-500 focus:outline-none transition"
          />
          <button
            type="button"
            onClick={handleCheck}
            disabled={state === 'loading'}
            className="btn-primary bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-4 rounded-xl text-sm disabled:opacity-60"
          >
            {state === 'loading' ? 'Checking...' : 'See My Deals'}
          </button>
        </div>
      </div>

      {state === 'error' && (
        <p className="text-red-400 text-sm text-center mt-3">{result?.message}</p>
      )}

      {state === 'result' && (result?.status === 'zip_match' || result?.status === 'nearest') && result.deal && (
        <div className="mt-5 text-left">
          <p
            className={`text-xs font-semibold text-center mb-3 ${
              result.status === 'zip_match' ? 'text-emerald-400' : 'text-yellow-400'
            }`}
          >
            {result.status === 'zip_match'
              ? `Real scored deal in ZIP ${checkedZip}`
              : `No live deals in ZIP ${checkedZip} yet — ${result.nearest_label}`}
          </p>
          <CountyScarcityBar
            zip={checkedZip}
            vertical={selectedVertical}
            onLockClick={handleUnlockClick}
            onZeroOpen={() => setZipFullyLocked(true)}
          />
          {zipFullyLocked && (
            <div className="mt-3">
              <p className="text-slate-400 text-xs mb-2">
                {checkedZip} is fully claimed — join the waitlist to be first if it opens.
              </p>
              <WaitlistForm zip={checkedZip} waitlistType="hero_zip_locked" vertical={selectedVertical} />
            </div>
          )}
          <BlurredStackSection
            blurred={[result.deal]}
            onUnlockLead={handleUnlockClick}
            onUnlockHotLead={handleUnlockClick}
          />
        </div>
      )}

      {state === 'result' && result?.status === 'empty' && (
        <div className="mt-5">
          <p className="text-slate-400 text-sm text-center mb-4">{result.message}</p>
          <WaitlistForm zip={checkedZip} waitlistType="hero_empty_zip" vertical={selectedVertical} />
        </div>
      )}
    </div>
  );
}
