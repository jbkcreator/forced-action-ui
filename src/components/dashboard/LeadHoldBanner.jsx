import { memo, useEffect, useState } from 'react';

function formatRemaining(ms) {
  if (ms == null || ms <= 0) return '0:00';
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
}

function LeadHoldBanner({ status }) {
  const expiresAt = status?.expires_at ? new Date(status.expires_at).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!status?.held) return null;

  const remaining = expiresAt ? expiresAt - now : null;
  if (remaining != null && remaining <= 0) return null;

  const selfHeld = !!status.held_by_self;
  const palette = selfHeld
    ? {
        bg: 'rgba(34,197,94,0.10)',
        border: 'rgba(34,197,94,0.35)',
        text: '#86efac',
        dot: '#22c55e',
      }
    : {
        bg: 'rgba(248,113,113,0.10)',
        border: 'rgba(248,113,113,0.35)',
        text: '#fca5a5',
        dot: '#ef4444',
      };

  const label = selfHeld ? 'Held for you' : 'Being worked';
  const sub = selfHeld
    ? 'Other contractors blocked while you decide.'
    : 'Another contractor is unlocking this lead.';

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-3 rounded-xl px-3 py-2 flex items-center justify-between gap-3 border"
      style={{ background: palette.bg, borderColor: palette.border }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          aria-hidden
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: palette.dot }}
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold" style={{ color: palette.text }}>{label}</p>
          <p className="text-[11px] text-slate-400 truncate">{sub}</p>
        </div>
      </div>
      {remaining != null && (
        <div
          className="text-[11px] font-mono tabular-nums font-semibold shrink-0"
          style={{ color: palette.text }}
          aria-label="time remaining on hold"
        >
          {formatRemaining(remaining)}
        </div>
      )}
    </div>
  );
}

export default memo(LeadHoldBanner);
