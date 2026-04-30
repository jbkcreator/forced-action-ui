/**
 * SocialProofWall — Stage 5
 *
 * Public, anonymized feed of recent contractor wins powering the landing
 * page's social proof narrative. Reads /api/proof-wall (max 50 wins) and
 * renders a responsive grid of cards. PII suppression is enforced server-
 * side: each card shows bucket size + vertical + county + days_ago + the
 * win-graphic image only.
 *
 * Falls back to nothing (renders null) on empty state — the rest of the
 * landing page composes cleanly without this section.
 */
import useApi from '../../hooks/useApi';
import { fetchProofWall } from '../../api/stage5';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';


function relativeTime(daysAgo) {
  if (daysAgo == null) return '';
  if (daysAgo === 0) return 'today';
  if (daysAgo === 1) return 'yesterday';
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 14) return '1 week ago';
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
  if (daysAgo < 60) return '1 month ago';
  return `${Math.floor(daysAgo / 30)} months ago`;
}


function VerticalLabel({ vertical }) {
  const map = {
    roofing: 'Roofing',
    restoration: 'Restoration',
    public_adjusters: 'Public Adjusters',
    wholesalers: 'Wholesalers',
    fix_flip: 'Fix & Flip',
    attorneys: 'Attorneys',
  };
  return <>{map[vertical] || vertical}</>;
}


function CountyLabel({ countyId }) {
  if (!countyId) return null;
  const tidy = countyId
    .split('_')
    .map(s => s[0]?.toUpperCase() + s.slice(1))
    .join(' ');
  return <>{tidy}</>;
}


function ProofCard({ item }) {
  const graphicUrl = item.graphic_url ? `${API_BASE}${item.graphic_url}` : null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 overflow-hidden hover:border-yellow-400/40 transition-colors">
      {graphicUrl && (
        <img
          src={graphicUrl}
          alt={`${item.label} — ${item.vertical} — ${item.county_id}`}
          className="w-full aspect-[1200/630] object-cover bg-slate-800"
          loading="lazy"
        />
      )}
      <div className="p-3">
        <p className="text-sm font-bold text-yellow-300">{item.label}</p>
        <p className="text-xs text-slate-300 mt-0.5">
          <VerticalLabel vertical={item.vertical} />
          {item.county_id ? ' · ' : ''}
          <CountyLabel countyId={item.county_id} />
        </p>
        <p className="text-[11px] text-slate-500 mt-1">{relativeTime(item.days_ago)}</p>
      </div>
    </div>
  );
}


export default function SocialProofWall() {
  const { data, loading, error } = useApi(() => fetchProofWall({ limit: 24 }), []);

  if (loading || error) return null;
  const items = data?.items || [];
  if (items.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Recent contractor wins
        </h2>
        <p className="text-slate-400 text-sm mt-3 max-w-xl mx-auto">
          Real deals closed by Forced Action members. Identifying details
          stay private; only the bucket size, trade, and county appear here.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <ProofCard key={item.deal_outcome_id} item={item} />
        ))}
      </div>
    </section>
  );
}
