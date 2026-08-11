import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import useReducedMotion from '../../hooks/useReducedMotion';

const STATUS_COLOR = {
  available:       '#10b981',
  locked:          '#ef4444',
  grace:           '#f59e0b',
  no_active_leads: '#64748b',
};

// Fallback when the server hasn't returned map_config yet (shouldn't normally happen,
// but avoids a white map if the API is slow or a new county has no config entry).
const FALLBACK_CONFIG = {
  center:       [27.9644, -82.4572],
  default_zoom: 10,
  min_zoom:     9,
  bounds:       null,
};

/**
 * Imperatively resets the map viewport whenever mapConfig changes.
 * MapContainer's center/zoom are init-only; this child uses useMap() to
 * handle county switches without unmounting the whole Leaflet instance.
 */
function BoundsController({ mapConfig }) {
  const map = useMap();
  useEffect(() => {
    if (!mapConfig) return;
    if (mapConfig.bounds) {
      map.fitBounds(mapConfig.bounds, { padding: [20, 20], animate: false });
      map.setMaxBounds(mapConfig.bounds);
    } else {
      map.setView(mapConfig.center, mapConfig.default_zoom ?? 10, { animate: false });
    }
    if (mapConfig.min_zoom != null) {
      map.setMinZoom(mapConfig.min_zoom);
    }
  }, [map, mapConfig]);
  return null;
}

export default function MapCanvas({ zips, highlightZip, onZipClick, mapConfig }) {
  const reducedMotion = useReducedMotion();

  const mappable = zips.filter((z) => z.lat != null && z.lon != null);
  if (!zips.length) return null;

  const cfg = mapConfig ?? FALLBACK_CONFIG;
  const center = cfg.center ?? FALLBACK_CONFIG.center;
  const zoom   = cfg.default_zoom ?? 10;
  const minZoom = cfg.min_zoom ?? 9;
  const bounds = cfg.bounds ?? null;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={minZoom}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <BoundsController mapConfig={cfg} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mappable.map((z) => (
        <CircleMarker
          key={z.zip}
          center={[z.lat, z.lon]}
          radius={z.zip === highlightZip ? 14 : 9}
          pathOptions={{
            color: STATUS_COLOR[z.status] || '#64748b',
            fillColor: STATUS_COLOR[z.status] || '#64748b',
            fillOpacity: z.active_viewers > 0 ? 0.85 : 0.55,
            weight: z.zip === highlightZip ? 4 : (z.active_viewers > 0 ? 3 : 1.5),
          }}
          eventHandlers={{ click: () => onZipClick(z) }}
          className={!reducedMotion && z.active_viewers > 0 ? 'animate-pulse' : ''}
        >
          <Tooltip direction="top" opacity={1}>
            <strong>{z.zip}</strong>{' '}
            {z.status === 'available' ? '🟢' : z.status === 'grace' ? '🟡' : z.status === 'no_active_leads' ? '⚪' : '🔴'}{' '}
            {z.status === 'no_active_leads' ? 'no active leads' : z.status}
            {z.active_viewers > 0 && <> · {z.active_viewers} viewing</>}
            {z.lead_count != null && <> · {z.lead_count} leads</>}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
