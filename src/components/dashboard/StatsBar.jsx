function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '';
}

export default function StatsBar({ subscriber }) {
  if (!subscriber) return null;

  const zips = (subscriber.locked_zips || []).join(', ');

  return (
    <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in" style={{ animationDelay: '0.1s' }}>
      <div className="stat-card glass rounded-xl px-5 py-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Plan</p>
        <p className="text-sm font-bold text-white">{capitalize(subscriber.tier)} Plan</p>
      </div>
      <div className="stat-card glass rounded-xl px-5 py-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Vertical</p>
        <p className="text-sm font-bold text-white">{capitalize(subscriber.vertical)}</p>
      </div>
      <div className="stat-card glass rounded-xl px-5 py-4">
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Territories</p>
        <p className="text-sm font-bold text-white">{zips ? `ZIPs: ${zips}` : 'No locked ZIPs'}</p>
      </div>
    </div>
  );
}
