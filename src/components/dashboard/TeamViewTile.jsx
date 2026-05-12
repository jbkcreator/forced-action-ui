/**
 * TeamViewTile — Stage 5
 *
 * Shared ZIP density view for unlocked referral teams. Density only — no
 * lead PII crosses team boundaries (each contractor still only sees leads
 * they personally have rights to in the main feed).
 *
 * Renders nothing if the team isn't unlocked yet, so it can be dropped
 * into the dashboard layout unconditionally.
 */
import useApi from '../../hooks/useApi';
import { fetchTeamView } from '../../api/stage5';
import Icon from '../ui/Icon';


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


const BROKEN_REASON_COPY = {
  dispute: 'A payment dispute was opened on your account.',
  refund: 'A purchase on your account was refunded.',
  churn: 'Your subscription lapsed.',
};

function TeamBrokenBanner({ brokenAt, brokenReason }) {
  const copy = BROKEN_REASON_COPY[brokenReason] || 'Your team access has been paused.';
  const date = brokenAt ? new Date(brokenAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  return (
    <section className="mb-6 rounded-xl border border-red-400/30 bg-gradient-to-br from-red-500/5 to-orange-500/5 p-5">
      <div className="flex items-start gap-3">
        <Icon name="warning" size={18} className="text-red-400 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-white font-semibold text-base leading-snug">Team access paused</h3>
          <p className="text-slate-300 text-sm mt-1">{copy}</p>
          <p className="text-slate-400 text-xs mt-1">
            Resolve your account status to restore shared ZIP view.
            {date && <span className="ml-1 text-slate-500">· Paused {date}</span>}
          </p>
        </div>
      </div>
    </section>
  );
}


export default function TeamViewTile({ feedUuid }) {
  const { data, loading, error } = useApi(() => fetchTeamView(feedUuid), [feedUuid]);

  if (loading || error) return null;

  if (data?.status === 'broken') {
    return <TeamBrokenBanner brokenAt={data.broken_at} brokenReason={data.broken_reason} />;
  }

  if (!data?.unlocked) return null;

  const density = data.density || [];
  const totalLeads = density.reduce((acc, d) => acc + (d.leads || 0), 0);
  const max = Math.max(1, ...density.map(d => d.leads || 0));

  return (
    <section className="mb-6 rounded-xl border border-purple-400/30 bg-gradient-to-br from-purple-500/5 to-fuchsia-500/5 p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div>
          <h3 className="text-white font-semibold text-base flex items-center gap-2">
            <Icon name="check-circle" size={16} className="text-purple-300" />
            Team unlocked — Shared ZIP heat map
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Lead density across your trio's combined ZIPs · <VerticalLabel vertical={data.vertical} />
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-purple-300 leading-none">{totalLeads}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">total leads</p>
        </div>
      </div>

      {density.length === 0 ? (
        <p className="text-slate-400 text-xs">No qualified leads in your shared ZIPs yet — check back tomorrow.</p>
      ) : (
        <div className="space-y-2">
          {density.slice(0, 8).map(d => {
            const pct = ((d.leads || 0) / max) * 100;
            return (
              <div key={d.zip} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-300 w-14 shrink-0">{d.zip}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-fuchsia-400 rounded-full"
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-300 w-10 text-right tabular-nums">{d.leads}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
