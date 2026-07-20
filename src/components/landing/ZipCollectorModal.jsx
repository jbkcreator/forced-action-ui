import { useState, useEffect } from 'react';
import Modal, { ModalClose } from '../ui/Modal';
import { useLanding } from './LandingContext';
import { fetchZipAvailability } from '../../api/landing';

export default function ZipCollectorModal({ isOpen, onClose, tier, initialZip, onProceed, vertical, countyId, pricing }) {
  // Landing page: reads vertical/countyId/pricing from LandingContext. Callers
  // outside a LandingProvider (e.g. the dashboard's free-tier upgrade flow)
  // pass these as props instead — props win when supplied.
  const landing = useLanding();
  const selectedVertical = vertical ?? landing?.selectedVertical;
  const resolvedCountyId = countyId ?? landing?.countyId;
  const resolvedPricing = pricing ?? landing?.pricing;
  const limit = resolvedPricing?.[tier]?.zip_limit || 3;
  const [selected, setSelected] = useState(initialZip ? [initialZip] : []);
  const [allZips, setAllZips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Fetch all ZIP availability when modal opens or vertical changes
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchZipAvailability(selectedVertical, resolvedCountyId)
      .then((data) => {
        if (!cancelled) {
          setAllZips(data.zips || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load ZIP codes. Please try again.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [isOpen, selectedVertical, resolvedCountyId]);

  // Reset selection when modal opens with a new tier
  useEffect(() => {
    if (isOpen) {
      setSelected(initialZip ? [initialZip] : []);
      setSearch('');
    }
  }, [isOpen, initialZip]);

  function toggleZip(zipCode) {
    setSelected((prev) => {
      if (prev.includes(zipCode)) {
        return prev.filter((z) => z !== zipCode);
      }
      if (prev.length >= limit) return prev;
      return [...prev, zipCode];
    });
  }

  function handleClose() {
    setSelected([]);
    setSearch('');
    onClose();
  }

  const ready = selected.length === limit;
  const availableZips = allZips.filter((z) => z.status === 'available');
  const filtered = search
    ? allZips.filter((z) => z.zip_code.startsWith(search))
    : allZips;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div
        className="relative"
        style={{
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1.25rem',
          padding: '2rem',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        <ModalClose onClick={handleClose} />

        <h2 className="text-xl font-bold mb-1">Select Your {limit} ZIP Territories</h2>
        <p className="text-slate-400 text-sm mb-4">
          Your {tier.charAt(0).toUpperCase() + tier.slice(1)} plan includes {limit} exclusive ZIP
          territories. Tap to select.{' '}
          <span className="text-slate-500">
            {availableZips.length} available
          </span>
        </p>

        {/* Search filter */}
        <input
          type="text"
          maxLength={5}
          placeholder="Filter by ZIP..."
          value={search}
          onChange={(e) => setSearch(e.target.value.replace(/\D/g, ''))}
          className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40 text-sm mb-3"
        />

        {/* ZIP grid */}
        <div
          style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', minHeight: '200px', maxHeight: '340px' }}
          className="pr-1"
        >
          {loading && (
            <p className="text-slate-400 text-sm text-center py-8">Loading ZIP codes...</p>
          )}
          {error && (
            <p className="text-red-400 text-sm text-center py-8">{error}</p>
          )}
          {!loading && !error && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {filtered.map((z) => {
                const isSelected = selected.includes(z.zip_code);
                const isTaken = z.status === 'taken';
                const isGrace = z.status === 'grace';
                const isDisabled = isTaken || isGrace;
                const atLimit = selected.length >= limit && !isSelected;

                let borderColor = 'rgba(255,255,255,0.08)';
                let bg = 'rgba(255,255,255,0.03)';
                let cursor = 'pointer';
                let opacity = 1;

                if (isSelected) {
                  borderColor = '#fbbf24';
                  bg = 'rgba(251,191,36,0.12)';
                } else if (isTaken) {
                  borderColor = 'rgba(239,68,68,0.3)';
                  bg = 'rgba(239,68,68,0.06)';
                  cursor = 'not-allowed';
                  opacity = 0.5;
                } else if (isGrace) {
                  borderColor = 'rgba(251,191,36,0.2)';
                  bg = 'rgba(251,191,36,0.04)';
                  cursor = 'not-allowed';
                  opacity = 0.5;
                } else if (atLimit) {
                  opacity = 0.4;
                  cursor = 'not-allowed';
                }

                return (
                  <button
                    key={z.zip_code}
                    onClick={() => !isDisabled && !atLimit && toggleZip(z.zip_code)}
                    disabled={isDisabled || atLimit}
                    style={{
                      border: `1px solid ${borderColor}`,
                      background: bg,
                      borderRadius: '0.75rem',
                      padding: '10px 8px',
                      cursor,
                      opacity,
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#fbbf24' : isTaken ? '#ef4444' : '#ffffff' }}>
                      {z.zip_code}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {isTaken ? 'Taken' : isGrace ? 'Opening soon' : `${z.lead_count} leads`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected summary */}
        {selected.length > 0 && (
          <div className="mb-3">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {selected.map((z) => {
                const code = typeof z === 'object' ? (z.zip || z.zip_code) : z;
                return (
                  <span
                    key={code}
                    onClick={() => toggleZip(code)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(251,191,36,0.12)',
                      border: '1px solid rgba(251,191,36,0.3)',
                      borderRadius: '999px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#fbbf24',
                      cursor: 'pointer',
                    }}
                  >
                    {code}
                    <span style={{ color: '#94a3b8', fontSize: '10px' }}>x</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => ready && onProceed(selected)}
          disabled={!ready}
          className={`w-full font-bold py-3 rounded-xl transition ${
            ready
              ? 'bg-yellow-400 hover:bg-yellow-300 text-black cursor-pointer'
              : 'bg-white/10 text-slate-500 cursor-not-allowed'
          }`}
        >
          {ready
            ? 'Continue to Payment'
            : `Select ${limit - selected.length} more ZIP${limit - selected.length !== 1 ? 's' : ''} to continue`}
        </button>
      </div>
    </Modal>
  );
}
