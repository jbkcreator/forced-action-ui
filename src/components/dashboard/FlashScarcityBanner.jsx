export default function FlashScarcityBanner({ window: win, onLockClick }) {
  if (!win) return null;
  const minutesLeft = Math.round((win.expires_in_seconds || 0) / 60);

  return (
    <div className="mb-4 rounded-xl border-l-4 border-red-500 bg-red-500/10 p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <p className="text-white font-bold text-base">
          {win.zip_code} is heating up
        </p>
        <p className="text-slate-300 text-xs mt-1">
          Lock this ZIP before another contractor claims it.
          {minutesLeft > 0 && ` Window active for ~${minutesLeft}m.`}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onLockClick?.(win.zip_code)}
        className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-red-600/20 transition-all shrink-0"
      >
        Lock {win.zip_code} now
      </button>
    </div>
  );
}
