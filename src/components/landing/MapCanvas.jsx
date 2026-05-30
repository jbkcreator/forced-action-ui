import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import useReducedMotion from '../../hooks/useReducedMotion';

const STATUS_COLOR = {
  available: '#10b981',
  locked:    '#ef4444',
  grace:     '#f59e0b',
};

// Geographic centers per county — fallback map center when no ZIP has coords
const COUNTY_CENTERS = {
  hillsborough: [27.9644, -82.4572],
  pinellas:     [27.8758, -82.7873],
};
const DEFAULT_CENTER = [27.9644, -82.4572];

export default function MapCanvas({ zips, highlightZip, onZipClick, countyId }) {
  const reducedMotion = useReducedMotion();

  const mappable = zips.filter((z) => z.lat != null && z.lon != null);
  if (!zips.length) return null;

  const anchor = COUNTY_CENTERS[countyId] || DEFAULT_CENTER;

  return (
    <MapContainer
      center={anchor}
      zoom={10}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
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
            <strong>{z.zip}</strong> {z.status === 'available' ? '🟢' : z.status === 'grace' ? '🟡' : '🔴'} {z.status}
            {z.active_viewers > 0 && <> · {z.active_viewers} viewing</>}
            {z.lead_count != null && <> · {z.lead_count} leads</>}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
