import { useState } from 'react';
import AttributionEventsTable from './AttributionEventsTable';
import AttributionOverview from './AttributionOverview';
import AttributionSubscriberPanel from './AttributionSubscriberPanel';
import AttributionTrace from './AttributionTrace';

const SUBTABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'events',      label: 'Conversion Events' },
  { id: 'subscriber',  label: 'Subscriber Drill-Down' },
  { id: 'trace',       label: 'Trace Details' },
];

export default function AttributionDashboard({ token }) {
  const [activeTab, setActiveTab]       = useState('overview');
  const [traceEventId, setTraceEventId] = useState(null);

  const handleOpenTrace = (eventId) => {
    setTraceEventId(eventId);
    setActiveTab('trace');
  };

  return (
    <div className="space-y-5">
      {/* Inner sub-tab nav */}
      <div
        className="flex items-center gap-1 rounded-xl p-1 w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {SUBTABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={activeTab === t.id
              ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }
              : { color: '#64748b' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Active sub-tab content */}
      {activeTab === 'overview'    && <AttributionOverview token={token} />}
      {activeTab === 'events'      && <AttributionEventsTable token={token} onOpenTrace={handleOpenTrace} />}
      {activeTab === 'subscriber'  && <AttributionSubscriberPanel token={token} onOpenTrace={handleOpenTrace} />}
      {activeTab === 'trace'       && (
        <AttributionTrace
          token={token}
          initialEventId={traceEventId}
          key={traceEventId}
        />
      )}
    </div>
  );
}
