import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../../theme/ThemeProvider';
import MobileNav from '../landing/MobileNav';
import { useLanding } from '../landing/LandingContext';

const COUNTIES = [
  { id: 'hillsborough', label: 'Hillsborough' },
  { id: 'pinellas',     label: 'Pinellas' },
];

function CountySwitcher() {
  const { countyId, setCountyId } = useLanding();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = COUNTIES.find((c) => c.id === countyId) || COUNTIES[0];

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function select(county) {
    setOpen(false);
    if (county.id === countyId) return;
    setCountyId(county.id);
    navigate(`/landing/${county.id}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-colors"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
        {current.label}
        <svg className={`w-3 h-3 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-sm shadow-xl z-50 overflow-hidden">
          {COUNTIES.map((county) => (
            <button
              key={county.id}
              type="button"
              onClick={() => select(county)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors
                ${county.id === countyId
                  ? 'text-yellow-400 bg-yellow-400/5'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${county.id === countyId ? 'bg-yellow-400' : 'bg-slate-600'}`} />
              {county.label}
              {county.id === countyId && (
                <svg className="ml-auto w-3.5 h-3.5 text-yellow-400" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ variant = 'landing', children }) {
  const { brand } = theme;
  const isLanding = variant === 'landing';

  return (
    <nav className={`${isLanding ? 'border-b border-white/[0.06] backdrop-blur-sm bg-black/10 px-6 py-5' : 'glass-strong px-6 py-3.5'} sticky top-0 z-50 relative`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
            <span className="text-black font-black text-sm">{brand.shortName}</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            {brand.name.split(' ')[0]} <span className={isLanding ? 'gradient-text' : 'text-yellow-400'}>{brand.name.split(' ').slice(1).join(' ')}</span>
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          {isLanding ? (
            <>
              <CountySwitcher />
              <MobileNav />
            </>
          ) : (
            children
          )}
        </div>
      </div>
    </nav>
  );
}
