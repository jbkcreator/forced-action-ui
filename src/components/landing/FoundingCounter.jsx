import { useLanding } from './LandingContext';
import { VERTICAL_LABELS } from '../../config/constants';
import usePolling from '../../hooks/usePolling';
import { fetchFoundingSummary } from '../../api/landing';

export default function FoundingCounter() {
  const { selectedVertical, countyId } = useLanding();

  const { data } = usePolling(
    () => fetchFoundingSummary(selectedVertical, countyId),
    30000,
    [selectedVertical, countyId],
  );

  const remaining = data?.total_remaining ?? '—';
  const total = data?.total_cap ?? 30;
  const isAvailable = data?.founding_available !== false;
  const taken = typeof remaining === 'number' ? total - remaining : 0;
  const pct = total > 0 ? (taken / total) * 100 : 0;

  return (
    <div className="inline-flex flex-col items-center gap-2 glass-card rounded-3xl px-10 py-7 mb-16 animate-fade-in-up delay-500">
      <span className="text-slate-400 text-xs uppercase tracking-[0.2em] font-semibold">
        {VERTICAL_LABELS[selectedVertical]} — Founding Spots
      </span>
      <div className="flex items-baseline gap-2 justify-center">
        <span className={`text-6xl sm:text-7xl font-black ${isAvailable ? 'text-yellow-400 founding-glow' : 'text-slate-400'}`}>
          {remaining}
        </span>
        <span className="text-2xl text-slate-500 font-medium">of {total} remaining</span>
      </div>
      <div className="w-full h-2 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-slate-500 text-xs mt-1">
        Founding rate locked forever — price increases when spots fill
      </span>
    </div>
  );
}
