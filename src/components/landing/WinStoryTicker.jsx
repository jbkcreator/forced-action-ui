/**
 * WinStoryTicker — S5 Win-Story / Proof Auto-Publisher feed.
 *
 * Live, auto-generated proof statements written by the backend whenever a lead
 * pack is delivered (and, once S1 ships, when a loan funds — no FE change). PII
 * is suppressed server-side: proof_text is display-ready, county is a slug.
 *
 * Distinct from <SocialProofWall>, which renders DealOutcome wins with images.
 * This component is purely additive and renders null on empty/error, so it can
 * be dropped into any page unconditionally.
 *
 * Reads GET /api/proof/win-stories (public, no auth) and polls every 60s.
 */
import usePolling from '../../hooks/usePolling';
import { fetchWinStories } from '../../api/stage5';

function countyLabel(slug) {
  if (!slug) return null;
  return slug.split('_').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function WinStoryTicker({ limit = 12, countyId, heading = 'Live activity', subheading = 'Real-time lead pack claims across the network.' }) {
  const { data, error } = usePolling(
    (signal) => fetchWinStories({ limit, countyId, signal }),
    60000,
    [limit, countyId],
  );

  if (error) return null;
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return null;

  return (
    <section className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          {heading}
        </h2>
        {subheading && <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">{subheading}</p>}
      </div>

      <ul className="space-y-2.5">
        {items.map((item) => {
          const county = countyLabel(item.county_id);
          return (
            <li
              key={item.id}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 flex items-center gap-3 hover:border-emerald-400/30 transition-colors"
            >
              <span className="text-emerald-400 shrink-0" aria-hidden="true">●</span>
              <p className="flex-1 min-w-0 text-sm text-slate-200">{item.proof_text}</p>
              {county && (
                <span className="shrink-0 text-[11px] font-semibold bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded-full">
                  {county}
                </span>
              )}
              <span className="shrink-0 text-[11px] text-slate-500 w-20 text-right">{relativeTime(item.created_at)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
