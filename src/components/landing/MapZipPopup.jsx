export default function MapZipPopup({ zip, onClose, onSelect }) {
  const isAvailable = zip.status === 'available';
  const isGrace = zip.status === 'grace';

  return (
    <div
      className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 z-[1000] glass-strong rounded-2xl p-5 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label={`ZIP ${zip.zip} details`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white font-bold text-lg font-mono">{zip.zip}</p>
          <p className={`text-xs font-semibold mt-0.5 ${
            isAvailable ? 'text-emerald-400' : isGrace ? 'text-amber-400' : 'text-red-400'
          }`}>
            {isAvailable ? '🟢 Available' : isGrace ? '🟡 Grace period' : '🔴 Locked'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xl leading-none"
          aria-label="Close popup"
        >
          ×
        </button>
      </div>

      <div className="space-y-1.5 text-xs text-slate-400 mb-4">
        {zip.lead_count != null && <p>{zip.lead_count} leads available</p>}
        {zip.active_viewers > 0 && <p className="text-amber-300">{zip.active_viewers} viewing now</p>}
        {isGrace && zip.grace_expires_at && (
          <p>Grace ends {new Date(zip.grace_expires_at).toLocaleDateString()}</p>
        )}
        {isGrace && zip.waitlist_count > 0 && (
          <p>{zip.waitlist_count} on waitlist</p>
        )}
      </div>

      {isAvailable ? (
        <button
          onClick={() => { onSelect?.(zip); onClose(); }}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm"
        >
          Lock this ZIP →
        </button>
      ) : (
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-sm font-semibold"
        >
          Join waitlist
        </button>
      )}
    </div>
  );
}
