import { useState } from 'react';
import { useLanding } from './LandingContext';
import { VERTICAL_LABELS } from '../../config/constants';
import { checkZip as apiCheckZip } from '../../api/landing';
import SampleLeads from './SampleLeads';
import WaitlistForm from './WaitlistForm';

export default function ZipChecker({ onZipChecked, countyId: externalCountyId, onZipTaken }) {
  const { selectedVertical, countyId: contextCountyId } = useLanding();
  const countyId = externalCountyId || contextCountyId;
  const [zip, setZip] = useState('');
  const [result, setResult] = useState(null);
  const [checkedZip, setCheckedZip] = useState('');

  async function handleCheck() {
    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setResult({ status: 'invalid_input', message: 'Please enter a valid 5-digit ZIP code.' });
      return;
    }

    setResult({ status: 'loading', message: 'Checking...' });

    try {
      const data = await apiCheckZip(trimmed, selectedVertical, countyId);
      const label = VERTICAL_LABELS[selectedVertical];
      setCheckedZip(trimmed);
      if (onZipChecked) onZipChecked(trimmed);

      if (data.status === 'invalid') {
        setResult({ status: 'invalid', message: `✗ ZIP ${trimmed} is not in our Hillsborough County service area.` });
      } else if (data.status === 'available') {
        setResult({ status: 'available', message: `✓ ZIP ${trimmed} is available for ${label} — lock it in when you subscribe.` });
      } else if (data.status === 'grace') {
        setResult({ status: 'grace', message: `⏳ ZIP ${trimmed} is opening soon for ${label} — subscribe now to claim it.` });
      } else if (data.status === 'taken') {
        setResult({ status: 'taken', message: `✗ ZIP ${trimmed} is taken for ${label} by another subscriber.`, zip: trimmed });
        if (onZipTaken) onZipTaken(trimmed);
      } else {
        setResult({ status: 'error', message: 'Unknown status' });
      }
    } catch {
      setResult({ status: 'error', message: 'Error checking ZIP. Please try again.' });
    }
  }

  const statusClass = result?.status === 'available' ? 'zip-available' :
                      result?.status === 'grace' ? 'zip-grace' :
                      result?.status === 'taken' ? 'zip-taken' :
                      'border-white/20 bg-white/5';

  return (
    <>
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/70 mb-3 block">Territory Check</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Check Your ZIP Territory</h2>
            <p className="text-slate-400 text-base">
              See if your target ZIP is still available for{' '}
              <span className="text-yellow-400 font-semibold">{VERTICAL_LABELS[selectedVertical]}</span>
            </p>
          </div>
          <div className="glass-card rounded-2xl p-2 max-w-xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={5}
                placeholder="Enter ZIP code..."
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                className="flex-1 bg-transparent border-0 rounded-xl px-5 py-4 text-white text-lg placeholder-slate-600 focus:outline-none transition"
              />
              <button
                onClick={handleCheck}
                className="btn-primary bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-8 py-4 rounded-xl text-base"
              >
                Check Availability
              </button>
            </div>
          </div>
          {result && (
            <div className={`mt-5 rounded-xl border px-5 py-4 text-sm font-medium max-w-xl mx-auto ${statusClass}`}>
              {result.message}
            </div>
          )}
        </div>
      </section>

      {(result?.status === 'available' || result?.status === 'grace') && (
        <SampleLeads zip={checkedZip} />
      )}

      {result?.status === 'taken' && (
        <WaitlistForm zip={checkedZip} countyId={countyId} />
      )}
    </>
  );
}