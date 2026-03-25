import { useState } from 'react';
import { TIER_ZIP_LIMITS } from '../../config/pricing';
import Modal, { ModalClose } from '../ui/Modal';

export default function ZipCollectorModal({ isOpen, onClose, tier, initialZip, onProceed }) {
  const limit = TIER_ZIP_LIMITS[tier] || 3;
  const [zips, setZips] = useState(initialZip ? [initialZip] : []);
  const [input, setInput] = useState('');

  function addZip() {
    const z = input.trim();
    if (!/^\d{5}$/.test(z)) { alert('Enter a valid 5-digit ZIP.'); return; }
    if (zips.includes(z)) { alert('ZIP already added.'); return; }
    if (zips.length >= limit) { alert(`You can only select ${limit} ZIPs for the ${tier} plan.`); return; }
    setZips([...zips, z]);
    setInput('');
  }

  function removeZip(idx) {
    setZips(zips.filter((_, i) => i !== idx));
  }

  const ready = zips.length === limit;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative" style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <ModalClose onClick={onClose} />
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
                <span className="text-sm font-medium">ZIP {z}</span>
                <button onClick={() => removeZip(i)} className="text-slate-500 hover:text-red-400 text-xs transition">Remove</button>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            maxLength={5}
            placeholder="Add ZIP code"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addZip()}
            className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40 text-sm"
          />
          <button onClick={addZip} className="px-4 py-2.5 bg-white/[0.08] border border-white/[0.1] hover:bg-white/[0.14] rounded-xl text-sm font-medium transition">
            Add
          </button>
        </div>
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
