import { theme } from '../../theme/ThemeProvider';
import MobileNav from '../landing/MobileNav';

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
              <span className="text-sm text-slate-400 hidden sm:block">{brand.location} · {brand.tagline}</span>
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
