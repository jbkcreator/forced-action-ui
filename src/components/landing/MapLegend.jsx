export default function MapLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-slate-400" aria-label="Map legend">
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" aria-hidden="true" />
        🟢 Available
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-full bg-red-500" aria-hidden="true" />
        🔴 Locked
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-full bg-amber-500" aria-hidden="true" />
        🟡 Grace
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded-full bg-slate-500" aria-hidden="true" />
        ⚪ No active leads
      </span>
      <span className="hidden md:block text-slate-600 text-[11px]">Two-finger pan on mobile</span>
    </div>
  );
}
