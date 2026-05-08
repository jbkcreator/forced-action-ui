import { Link, useParams } from 'react-router-dom';

export default function DashboardHeroBanner({ total, zips, partnerEligible }) {
  const zipText = zips?.length ? zips.join(', ') : '—';
  const { feedUuid } = useParams();

  return (
    <div className="glass rounded-xl px-5 py-3.5 mb-6 flex items-center justify-between flex-wrap gap-2 animate-in" style={{ animationDelay: '0.12s' }}>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-black gradient-text">{total ?? 0}</span>
        <span className="text-sm text-slate-300 font-medium">Exclusive Leads</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
        <span>ZIP {zipText}</span>
        <span className="w-1 h-1 bg-white/20 rounded-full" />
        <span>Updated Today</span>
        {partnerEligible && feedUuid && (
          <>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <Link
              to={`/dashboard/${feedUuid}/partner`}
              className="text-amber-400 hover:text-amber-300 font-semibold"
            >
              Upgrade to Partner →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
