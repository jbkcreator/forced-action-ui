/**
 * LeaderboardWidget — Stage 5
 *
 * Weekly top referrers in the subscriber's county + vertical. Reads
 * /api/leaderboard with the subscriber's cohort filters; renders nothing
 * if there are no confirmed referrals this week (clean empty state).
 *
 * Identity is anonymized server-side to first name + last initial.
 */
import useApi from '../../hooks/useApi';
import { fetchLeaderboard } from '../../api/stage5';


const BADGE_LABEL = {
  contributor: 'Contributor',
  rising_star: 'Rising star',
  team_unlocker: 'Team unlocker',
};


function BadgePill({ badge }) {
  if (!badge) return null;
  const cls = badge === 'team_unlocker'
    ? 'bg-purple-400/15 border-purple-400/40 text-purple-200'
    : badge === 'rising_star'
      ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-200'
      : 'bg-emerald-400/10 border-emerald-400/30 text-emerald-200';
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cls}`}>
      {BADGE_LABEL[badge] || badge}
    </span>
  );
}


export default function LeaderboardWidget({ countyId, vertical }) {
  const { data, loading, error } = useApi(
    () => fetchLeaderboard({ countyId, vertical }),
    [countyId, vertical],
  );

  if (loading || error) return null;
  const board = (data?.leaderboards || [])[0];
  if (!board || board.leaderboard.length === 0) return null;

  return (
    <section className="mb-6 rounded-xl border border-white/10 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold text-base">Top referrers — last 7 days</h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Refer 3 in your county + trade to unlock the shared ZIP heat map.
          </p>
        </div>
        {data?.as_of && (
          <span className="text-[11px] text-slate-500">As of {data.as_of}</span>
        )}
      </div>
      <ol className="space-y-1.5">
        {board.leaderboard.map(row => (
          <li
            key={row.subscriber_id}
            className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={
                'shrink-0 w-7 text-center font-bold text-sm tabular-nums ' +
                (row.rank === 1 ? 'text-yellow-300' : row.rank === 2 ? 'text-slate-200' : 'text-slate-400')
              }>
                {row.rank}
              </span>
              <span className="text-sm text-white truncate">{row.handle}</span>
              <BadgePill badge={row.badge} />
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-white tabular-nums">{row.refs_this_week}</p>
              <p className="text-[10px] text-slate-500 tabular-nums">{row.refs_total} all-time</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
