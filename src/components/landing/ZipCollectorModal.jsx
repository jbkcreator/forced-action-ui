import { useState } from 'react';
import { TIER_ZIP_LIMITS } from '../../config/pricing';
import Modal, { ModalClose } from '../ui/Modal';
import { useLanding } from './LandingContext';
import { checkZip } from '../../api/landing';

export default function ZipCollectorModal({ isOpen, onClose, tier, initialZip, onProceed }) {
  const { selectedVertical, countyId } = useLanding();
  const limit = TIER_ZIP_LIMITS[tier] || 3;
  const [zips, setZips] = useState(initialZip ? [initialZip] : []);
  const [input, setInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState(null); // { message, type: 'success'|'error'|'warning' }

  async function addZip() {
    const z = input.trim();
    setFeedback(null);

    if (!/^\d{5}$/.test(z)) {
      setFeedback({ message: 'Enter a valid 5-digit ZIP code.', type: 'error' });
      return;
    }
    if (zips.includes(z)) {
      setFeedback({ message: `ZIP ${z} is already in your list.`, type: 'warning' });
      return;
    }
    if (zips.length >= limit) {
      setFeedback({ message: `You can only select ${limit} ZIP${limit !== 1 ? 's' : ''} for the ${tier} plan.`, type: 'error' });
      return;
    }

    setChecking(true);
    try {
      const data = await checkZip(z, selectedVertical, countyId);

      if (data.status === 'available') {
        setZips(prev => [...prev, z]);
        setInput('');
        setFeedback({ message: `✓ ZIP ${z} is available.`, type: 'success' });
      } else if (data.status === 'taken') {
        setFeedback({ message: `✗ ZIP ${z} is already locked by another subscriber. Please choose a different ZIP.`, type: 'error' });
      } else if (data.status === 'grace') {
        setFeedback({ message: `ZIP ${z} is opening soon (in grace period). Please choose a different ZIP.`, type: 'warning' });
      } else {
        setFeedback({ message: `ZIP ${z} is not in the Hillsborough County service area.`, type: 'error' });
      }
    } catch {
      setFeedback({ message: 'Could not check availability — please try again.', type: 'error' });
    } finally {
      setChecking(false);
    }
  }

  function removeZip(idx) {
    setZips(zips.filter((_, i) => i !== idx));
    setFeedback(null);
  }

  function handleClose() {
    setFeedback(null);
    onClose();
  }

  const ready = zips.length === limit;

  const feedbackColor = {
    success: 'text-green-400',
    error:   'text-red-400',
    warning: 'text-yellow-400',
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="relative" style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <ModalClose onClick={handleClose} />
        <h2 className="text-xl font-bold mb-1">Select Your {limit} ZIP Territories</h2>
        <p className="text-slate-400 text-sm mb-5">
          Your {tier.charAt(0).toUpperCase() + tier.slice(1)} plan includes {limit} exclusive ZIP territories. Add {limit} ZIPs to continue.
        </p>

        <div className="space-y-2 mb-4">
          {zips.length === 0 ? (
            <p className="text-slate-500 text-sm">No ZIPs added yet.</p>
          ) : (
            zips.map((z, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                <span className="text-sm font-medium">
                  <span style={{ color: '#4ade80', marginRight: '6px' }}>✓</span>ZIP {z}
                </span>
                <button onClick={() => removeZip(i)} className="text-slate-500 hover:text-red-400 text-xs transition">
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            maxLength={5}
            placeholder="Add ZIP code"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !checking && addZip()}
            className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40 text-sm"
          />
          <button
            onClick={addZip}
            disabled={checking}
            className="px-4 py-2.5 bg-white/[0.08] border border-white/[0.1] hover:bg-white/[0.14] rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? 'Checking…' : 'Add'}
          </button>
        </div>

        <p className={`text-xs mb-4 min-h-[1.25rem] ${feedback ? feedbackColor[feedback.type] : ''}`}>
          {feedback?.message || ''}
        </p>

        <button
          onClick={() => ready && onProceed(zips)}
          disabled={!ready}
          className={`w-full font-bold py-3 rounded-xl transition ${
            ready
              ? 'bg-yellow-400 hover:bg-yellow-300 text-black cursor-pointer'
              : 'bg-white/10 text-slate-500 cursor-not-allowed'
          }`}
        >
          {ready ? 'Continue to Payment' : `Add ${limit - zips.length} more ZIP${limit - zips.length !== 1 ? 's' : ''} to continue`}
        </button>
      </div>
    </Modal>
  );
}
