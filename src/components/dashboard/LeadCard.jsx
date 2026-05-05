import { memo, useState, useCallback } from 'react';
import { DISTRESS_TAG_COLORS } from '../../config/constants';
import { formatRelativeDate } from '../../utils/format';
import Icon from '../ui/Icon';
import UrgencyBadge from './UrgencyBadge';

function esc(s) {
  return String(s || '');
}

function formatTagLabel(s) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function LeadCard({ lead, index, onUnlockHotLead, contacted, onToggleContacted, onOpenPremium, urgencyViewers }) {
  const [expanded, setExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const tier = lead.lead_tier || '';
  const tierColor = tier === 'Ultra Platinum' ? 'text-purple-400' :
                    tier === 'Platinum' ? 'text-yellow-400' :
                    tier === 'Gold' ? 'text-amber-400' : 'text-slate-400';
  const tierClass = tier === 'Ultra Platinum' ? 'tier-ultra-platinum' :
                    tier === 'Platinum' ? 'tier-platinum' :
                    tier === 'Gold' ? 'tier-gold' : 'tier-default';
  const score = Math.round(lead.cds_score || 0);
  const scorePct = Math.min(score, 100);
  const ringColor = tier === 'Ultra Platinum' ? '#a855f7' :
                    tier === 'Platinum' ? '#fbbf24' :
                    tier === 'Gold' ? '#f59e0b' : '#64748b';
  const delay = Math.min(index * 0.05, 0.5);

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    onToggleContacted?.(lead.property_id);
  }, [lead.property_id, onToggleContacted]);

  const handlePremium = useCallback((e) => {
    e.stopPropagation();
    onOpenPremium?.(lead);
  }, [lead, onOpenPremium]);

  return (
    <div
      className={`lead-card glass ${tierClass} rounded-2xl p-5 animate-in cursor-pointer ${contacted ? 'border-l-green-500' : ''}`}
      style={{ animationDelay: `${delay}s` }}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white text-base truncate">{esc(lead.address)}</p>
            {contacted && <Icon name="check" size={14} className="text-green-400 shrink-0" />}
            <UrgencyBadge viewers={urgencyViewers} />
          </div>
          <p className="text-slate-400 text-sm mt-0.5">{esc(lead.city)}, {esc(lead.state)} {esc(lead.zip)}</p>
        </div>
        <div className="shrink-0 flex flex-col items-center relative">
          <div
            className="cds-badge bg-white/5"
            style={{ '--ring-color': ringColor, '--score-pct': scorePct }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => { e.stopPropagation(); setShowTooltip((v) => !v); }}
          >
            <span className="text-lg font-extrabold leading-none">{score}</span>
            <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">CDS</span>
          </div>
          <p className={`${tierColor} text-xs font-semibold mt-1.5`}>{esc(tier)}</p>

          {/* CDS Tooltip */}
          {showTooltip && lead.distress_types?.length > 0 && (
            <div className="absolute top-full right-0 mt-2 z-10 glass-strong rounded-lg p-3 min-w-[180px] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs font-semibold text-white mb-2">Score Signals</p>
              <div className="space-y-1">
                {lead.distress_types.map((d, i) => {
                  const colors = DISTRESS_TAG_COLORS[d];
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors?.text || '#94a3b8' }} />
                      <span className="text-xs text-slate-300">{formatTagLabel(d)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Color-coded distress tags */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {(lead.distress_types || []).map((d, i) => {
          const colors = DISTRESS_TAG_COLORS[d] || {};
          return (
            <span
              key={i}
              className="text-xs rounded-full px-2.5 py-1 font-medium"
              style={{
                background: colors.bg || 'rgba(255,255,255,0.06)',
                color: colors.text || '#cbd5e1',
                border: `1px solid ${colors.border || 'rgba(255,255,255,0.12)'}`,
              }}
            >
              {formatTagLabel(d)}
            </span>
          );
        })}
        {lead.est_job_value && lead.est_job_value.display !== 'N/A' && (
          <span
            className="text-xs rounded-full px-2.5 py-1 font-semibold"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            Est. {esc(lead.est_job_value.display)}
          </span>
        )}
      </div>

      {/* Latest incident with relative date */}
      {lead.incidents?.length > 0 && (
        <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
          <Icon name="clock" size={12} className="text-slate-500 shrink-0" />
          Latest: {esc(lead.incidents[0].type)} — {formatRelativeDate(lead.incidents[0].date)}
        </p>
      )}

      {/* Expandable detail */}
      <div
        className="grid transition-all duration-200"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {lead.property_type && <div><span className="text-slate-500">Type:</span> <span className="text-slate-300">{lead.property_type}</span></div>}
            {lead.year_built && <div><span className="text-slate-500">Built:</span> <span className="text-slate-300">{lead.year_built}</span></div>}
            {lead.sq_ft && <div><span className="text-slate-500">Sqft:</span> <span className="text-slate-300">{lead.sq_ft.toLocaleString()}</span></div>}
            {lead.lat && <div><span className="text-slate-500">Lat:</span> <span className="text-slate-300">{lead.lat}</span></div>}
            {lead.lon && <div><span className="text-slate-500">Lon:</span> <span className="text-slate-300">{lead.lon}</span></div>}
          </div>
          {lead.unlocked && (lead.phone || lead.email) && (
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">📞 {lead.phone}</span>
                  <PhoneQualityBadge quality={lead.phone_quality} />
                </div>
              )}
              {lead.email && (
                <span className="text-slate-300 text-xs">✉️ {lead.email}</span>
              )}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <button
              onClick={handleToggle}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                contacted
                  ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {contacted ? 'Contacted' : 'Mark Contacted'}
            </button>
            {onOpenPremium && (
              <button
                onClick={handlePremium}
                className="text-xs px-3 py-1.5 rounded-lg font-medium bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 hover:bg-yellow-400/20 transition"
                title="Property report, brief, or skip-trace transfer"
              >
                Premium →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hot lead unlock — hidden until skip tracing is wired up */}
    </div>
  );
}

function areEqual(prev, next) {
  return (
    prev.lead === next.lead &&
    prev.index === next.index &&
    prev.contacted === next.contacted &&
    prev.urgencyViewers === next.urgencyViewers &&
    prev.onToggleContacted === next.onToggleContacted &&
    prev.onOpenPremium === next.onOpenPremium &&
    prev.onUnlockHotLead === next.onUnlockHotLead
  );
}

export default memo(LeadCard, areEqual);

/**
 * Tiny chip rendering skip-trace metadata for a phone number.
 * Returns null silently when no metadata is present (graceful degrade).
 */
function PhoneQualityBadge({ quality }) {
  if (!quality) return null;

  const type = (quality.type || '').toLowerCase();
  const score = quality.score || 0;
  const reachable = !!quality.reachable;

  const typeLabel = {
    mobile:   'Mobile',
    landline: 'Landline',
    voip:     'VoIP',
  }[type] || 'Phone';

  const verified = reachable || score >= 80;

  const styles = verified
    ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/30'
    : score >= 50
      ? 'text-yellow-300 bg-yellow-500/10 border border-yellow-500/30'
      : 'text-slate-400 bg-white/5 border border-white/10';

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${styles}`}
      title={[
        `Type: ${typeLabel}`,
        quality.carrier ? `Carrier: ${quality.carrier}` : null,
        `Score: ${score}/100`,
        verified ? 'Verified reachable' : 'Not yet verified',
        quality.source ? `Source: ${quality.source}` : null,
      ].filter(Boolean).join('\n')}
    >
      {typeLabel}
      {verified && <span aria-hidden>✓</span>}
    </span>
  );
}
