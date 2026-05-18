import { getBundleMeta } from '../../config/bundles';
import LeadCard from './LeadCard';

function groupByBundle(leads) {
  const groups = {};
  for (const lead of leads) {
    const key = `${lead.bundle_type}:${lead.bundle_id}`;
    if (!groups[key]) {
      groups[key] = {
        bundleType: lead.bundle_type,
        bundleId: lead.bundle_id,
        expiresAt: lead.expires_at,
        hoursRemaining: lead.hours_remaining,
        leads: [],
      };
    }
    groups[key].leads.push(lead);
  }
  return Object.values(groups);
}

function ExpiryBadge({ hoursRemaining }) {
  if (hoursRemaining == null) return null;
  const label = hoursRemaining < 1
    ? `${Math.round(hoursRemaining * 60)}m left`
    : `${Math.floor(hoursRemaining)}h left`;
  const urgent = hoursRemaining < 6;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
      urgent
        ? 'border-red-400/50 text-red-300 bg-red-500/10'
        : 'border-slate-500/50 text-slate-400 bg-slate-800/60'
    }`}>
      {label}
    </span>
  );
}

export default function BundleLeadSection({
  bundleLeads,
  sectionRef,
  isContacted,
  onToggleContacted,
  feedUuid,
}) {
  if (!bundleLeads || bundleLeads.length === 0) return null;

  const groups = groupByBundle(bundleLeads);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="bundle-leads-heading"
      className="mt-8"
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2 id="bundle-leads-heading" className="text-xl font-extrabold tracking-tight text-white">
          Your Bundle Leads
        </h2>
        <span className="text-slate-400 text-sm">
          {bundleLeads.length} lead{bundleLeads.length !== 1 ? 's' : ''} · fully unlocked
        </span>
      </div>

      {groups.map((group) => {
        const meta = getBundleMeta(group.bundleType) || {
          leadIcon: '📦',
          label: group.bundleType,
          leadAccent: 'border-white/10',
        };
        return (
          <div
            key={`${group.bundleType}:${group.bundleId}`}
            className={`mb-8 rounded-xl border p-5 ${meta.leadAccent}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl select-none" aria-hidden>{meta.leadIcon}</span>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-base">{meta.label}</h3>
                <p className="text-slate-400 text-xs">
                  {group.leads.length} lead{group.leads.length !== 1 ? 's' : ''} · exclusively yours
                </p>
              </div>
              <ExpiryBadge hoursRemaining={group.hoursRemaining} />
            </div>

            <div className="space-y-3">
              {group.leads.map((lead, i) => (
                <LeadCard
                  key={lead.property_id}
                  lead={lead}
                  index={i}
                  contacted={isContacted ? isContacted(lead.property_id) : false}
                  onToggleContacted={onToggleContacted}
                  feedUuid={feedUuid}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
