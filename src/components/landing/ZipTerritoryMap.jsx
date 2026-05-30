import { useState } from 'react';
import { useLanding } from './LandingContext';
import useTerritoryMap from '../../hooks/useTerritoryMap';
import MapCanvas from './MapCanvas';
import MapLegend from './MapLegend';
import MapZipPopup from './MapZipPopup';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorState from '../ui/ErrorState';
import EmptyState from '../ui/EmptyState';

export default function ZipTerritoryMap({ onZipSelect, highlightZip }) {
  const { countyId, selectedVertical } = useLanding();
  const { zips, loading, error } = useTerritoryMap(countyId, selectedVertical);
  const [activeZip, setActiveZip] = useState(null);

  return (
    <section className="glass rounded-2xl p-4 my-6" aria-label="ZIP territory map">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-lg font-bold text-white">Your county at a glance</h3>
        <MapLegend />
      </div>

      {loading && <div className="h-[320px] md:h-[480px] flex items-center justify-center"><LoadingSpinner /></div>}
      {error && <ErrorState message="Map failed to load." />}

      {!loading && !error && zips.length === 0 && (
        <EmptyState message="No ZIPs available in this county yet." />
      )}

      {!loading && !error && zips.length > 0 && (
        <div className="relative h-[320px] md:h-[480px] rounded-xl overflow-hidden">
          <MapCanvas
            zips={zips}
            highlightZip={highlightZip}
            onZipClick={(zip) => setActiveZip(zip)}
            countyId={countyId}
          />
          {activeZip && (
            <MapZipPopup
              zip={activeZip}
              onClose={() => setActiveZip(null)}
              onSelect={onZipSelect}
            />
          )}
        </div>
      )}

      {/* Screen-reader fallback: text list of ZIPs */}
      <ul className="sr-only" aria-label="ZIP status list">
        {zips.map((z) => (
          <li key={z.zip}>
            {z.zip}: {z.status}{z.lead_count != null ? `, ${z.lead_count} leads` : ''}
            {z.active_viewers > 0 ? `, ${z.active_viewers} viewing` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}
