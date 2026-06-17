import CallRecordCard from './CallRecordCard';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };

export default function PriorCallsHistory({ calls = [], loading, error }) {
  if (loading) return (
    <div className="rounded-xl p-4" style={card}>
      <p className="text-slate-500 text-xs animate-pulse">Loading call history…</p>
    </div>
  );

  if (error) return (
    <div className="rounded-xl p-3 text-xs text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
      {error}
    </div>
  );

  return (
    <div className="rounded-xl p-4 space-y-3" style={card}>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
        Call history ({calls.length})
      </p>
      {calls.length === 0 ? (
        <p className="text-slate-600 text-xs">No calls recorded yet.</p>
      ) : (
        <div className="space-y-2">
          {calls.map(call => (
            <CallRecordCard key={call.id} call={call} />
          ))}
        </div>
      )}
    </div>
  );
}
