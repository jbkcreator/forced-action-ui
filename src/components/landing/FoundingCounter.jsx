import { useEffect, useMemo, useState } from 'react';
import { useLanding } from './LandingContext';
import { VERTICAL_LABELS, FOUNDING_SPOT_CAP } from '../../config/constants';
import usePolling from '../../hooks/usePolling';
import { fetchFoundingSummary } from '../../api/landing';

// Clock-skew-safe countdown: on every 30s poll we capture the offset between
// the server's clock (server_now) and this browser's clock, then tick locally
// off `Date.now() + offset` rather than trusting the browser clock outright.
// The offset lives in state (not a ref) so correcting it re-renders
// immediately — a ref would silently show stale, skewed time until the next
// 1s tick happened to fire.
function useCountdown(deadlineIso, serverNowIso) {
  const [offsetMs, setOffsetMs] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (serverNowIso) {
      setOffsetMs(new Date(serverNowIso).getTime() - Date.now());
    }
  }, [serverNowIso]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    if (!deadlineIso) return null;
    const deadline = new Date(deadlineIso).getTime();
    const remainingMs = deadline - (now + offsetMs);
    if (remainingMs <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
    const totalSeconds = Math.floor(remainingMs / 1000);
    return {
      expired: false,
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  }, [now, offsetMs, deadlineIso]);
}

function CountdownTimer({ deadlineIso, serverNowIso, deadlinePassed }) {
  const countdown = useCountdown(deadlineIso, serverNowIso);
  if (!deadlineIso || !countdown) return null;
  if (deadlinePassed || countdown.expired) {
    return (
      <span className="text-slate-500 text-xs mt-1 uppercase tracking-wide">
        Founding window closed
      </span>
    );
  }
  const { days, hours, minutes, seconds } = countdown;
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1.5 mt-1 font-mono text-sm text-amber-300 tabular-nums">
      {days > 0 && <span>{days}d</span>}
      <span>{pad(hours)}h</span>
      <span>{pad(minutes)}m</span>
      <span>{pad(seconds)}s</span>
      <span className="text-slate-500 font-sans ml-1">left at founding rate</span>
    </div>
  );
}

export default function FoundingCounter() {
  const { selectedVertical, countyId } = useLanding();

  const { data } = usePolling(
    () => fetchFoundingSummary(selectedVertical, countyId),
    30000,
    [selectedVertical, countyId],
  );

  const remaining = data?.total_remaining ?? '—';
  const total = data?.total_cap ?? FOUNDING_SPOT_CAP;
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
      <CountdownTimer
        deadlineIso={data?.founding_price_deadline_at}
        serverNowIso={data?.server_now}
        deadlinePassed={data?.deadline_passed}
      />
      <span className="text-slate-500 text-xs mt-1">
        Founding rate locked forever — price increases when spots fill
      </span>
    </div>
  );
}
