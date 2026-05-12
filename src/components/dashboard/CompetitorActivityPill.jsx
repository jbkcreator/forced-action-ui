import { memo } from 'react';
import useReducedMotion from '../../hooks/useReducedMotion';

function CompetitorActivityPill({ viewers, zip }) {
  const reduced = useReducedMotion();
  const count = Number(viewers || 0);
  if (count < 2) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border"
      style={{
        background: 'rgba(245,158,11,0.10)',
        color: '#fcd34d',
        borderColor: 'rgba(245,158,11,0.30)',
      }}
      title={`${count} contractors are looking at leads in ${zip || 'this ZIP'} right now`}
    >
      <span
        aria-hidden
        className={`w-1.5 h-1.5 rounded-full ${reduced ? '' : 'animate-pulse'}`}
        style={{ background: '#f59e0b' }}
      />
      {count} others looking
    </span>
  );
}

export default memo(CompetitorActivityPill);
