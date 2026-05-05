import { memo } from 'react';
import useReducedMotion from '../../hooks/useReducedMotion';

function UrgencyBadge({ viewers }) {
  const reduced = useReducedMotion();
  const count = Number(viewers || 0);
  if (count < 2) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border"
      style={{
        background: 'rgba(239,68,68,0.10)',
        color: '#fca5a5',
        borderColor: 'rgba(239,68,68,0.30)',
      }}
      title={`${count} contractors viewing this ZIP right now`}
    >
      <span
        aria-hidden
        className={`w-1.5 h-1.5 rounded-full ${reduced ? '' : 'animate-pulse'}`}
        style={{ background: '#f87171' }}
      />
      {count} viewing
    </span>
  );
}

export default memo(UrgencyBadge);
