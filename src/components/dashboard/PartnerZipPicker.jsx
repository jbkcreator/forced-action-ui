import { useState } from 'react';
import useTerritoryMap from '../../hooks/useTerritoryMap';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorState from '../ui/ErrorState';

const STATUS_COLOR = {
  available: '#10b981',
  locked:    '#64748b',
  grace:     '#64748b',
};

export default function PartnerZipPicker({ countyId, vertical, selected, onToggle, max }) {
  const { zips, loading, error } = useTerritoryMap(countyId, vertical);
  const [mapError, setMapError] = useState(false);

  const availableZips = zips.filter((z) => z.status === 'available');

  if (loading) return <div className="h-48 flex items-center justify-center"><LoadingSpinner /></div>;
  if (error || mapError) return <ErrorState message="Could not load available ZIPs." />;

  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-slate-400 text-sm mb-4">
        Select up to {max} available ZIPs. Locked ZIPs are unavailable.
      </p>

      {/* Visual grid of ZIP chips */}
      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Available ZIPs">
        {zips.map((z) => {
          const isAvailable = z.status === 'available';
          const isSelected = selected.includes(z.zip);
          const atMax = selected.length >= max && !isSelected;

          return (
            <button
              key={z.zip}
              type="button"
              onClick={() => isAvailable && !atMax && onToggle(z.zip)}
              disabled={!isAvailable || (atMax && !isSelected)}
              aria-pressed={isSelected}
              aria-label={`ZIP ${z.zip} — ${z.status}${isSelected ? ', selected' : ''}`}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold border transition-all
                ${isSelected
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50'
                  : isAvailable && !atMax
                    ? 'bg-white/5 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 cursor-pointer'
                    : 'bg-white/[0.03] border-white/10 text-slate-600 cursor-not-allowed'
                }`}
            >
              {z.zip}
              {z.status !== 'available' && <span className="ml-1 text-[10px]">🔴</span>}
              {z.status === 'available' && isSelected && <span className="ml-1">✓</span>}
            </button>
          );
        })}
      </div>

      {selected.length >= max && (
        <p className="text-amber-400 text-xs" role="alert">Maximum {max} ZIPs selected.</p>
      )}

      {availableZips.length === 0 && (
        <p className="text-slate-400 text-sm">No ZIPs currently available in this county.</p>
      )}
    </div>
  );
}
