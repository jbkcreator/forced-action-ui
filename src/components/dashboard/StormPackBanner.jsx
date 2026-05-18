export default function StormPackBanner({ stormLeadCount, hoursRemaining, onViewLeads }) {
  if (!stormLeadCount) return null;

  const hoursLabel = hoursRemaining != null
    ? hoursRemaining < 1
      ? `${Math.round(hoursRemaining * 60)}m remaining`
      : `${Math.floor(hoursRemaining)}h remaining`
    : null;

  return (
    <div
      className="mb-6 rounded-xl border border-sky-400/40 bg-sky-500/10 px-5 py-4 flex items-center justify-between gap-4"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl select-none" aria-hidden>⛈️</span>
        <div>
          <p className="text-sky-200 font-semibold text-sm">
            Storm Bundle Active - {stormLeadCount} storm-affected lead{stormLeadCount !== 1 ? 's' : ''} unlocked
          </p>
          {hoursLabel && (
            <p className="text-sky-400/80 text-xs mt-0.5">{hoursLabel}</p>
          )}
        </div>
      </div>
      {onViewLeads && (
        <button
          type="button"
          onClick={onViewLeads}
          className="shrink-0 text-xs font-semibold text-sky-300 hover:text-white border border-sky-400/40 hover:border-sky-400 rounded-lg px-3 py-1.5 transition-colors"
        >
          View leads ↓
        </button>
      )}
    </div>
  );
}
