const VERTICAL_PITCH = {
  roofing_contractors: {
    open: 'Lead with roof damage signals — storm, permit pull, or insurance claim on the property.',
    points: [
      'Property has active roof distress signal — urgency is real',
      'Ask: "Are you currently working any storm or insurance restoration jobs in [county]?"',
      'Pitch the ZIP-level lead density, not just the score',
    ],
  },
  restoration_contractors: {
    open: 'Lead with fire/flood/storm damage data — the property likely has an active or recent incident.',
    points: [
      'Insurance claim or incident filing is the hook — they want the job before the adjuster closes it',
      'Ask: "How quickly can your crew mobilise after a fire or flood call?"',
      'Emphasise response-time advantage our lead timing gives them',
    ],
  },
  public_adjusters: {
    open: 'Lead with active insurance claims in their territory — these are their billable cases.',
    points: [
      'Our leads include FEMA IA filings + adjuster permits — earlier than any other source',
      'Ask: "Are you capacity-constrained, or are you actively looking for new claim volume?"',
      'Positioning: not a list service — a live claim radar',
    ],
  },
  wholesalers: {
    open: 'Lead with distressed-but-equity-rich properties — their buying criteria.',
    points: [
      'Combination of distress signals + equity data narrows to motivated sellers',
      'Ask: "Are you buying off-market, or do you need to see MLS comps first?"',
      'Pitch volume: Gold+ tier, both counties, daily refresh',
    ],
  },
  fix_and_flip: {
    open: 'Lead with equity + distress co-occurrence — their acquisition formula.',
    points: [
      'CDS score weights equity position + distress depth — both visible in the pack',
      'Ask: "What\'s your typical ARV range and hold period?"',
      'Pitch: lead pack includes permit history — helps ARV estimate before site visit',
    ],
  },
  attorneys: {
    open: 'Lead with probate, eviction, and foreclosure filings — cases that need legal representation.',
    points: [
      'Estate + probate flags are the primary hook for property attorneys',
      'Ask: "Are you doing probate, foreclosure defence, or both?"',
      'Positioning: case pipeline, not a marketing list',
    ],
  },
  hard_money_lenders: {
    open: 'Lead with financing intent score + equity position — their underwriting inputs.',
    points: [
      'Financing intent score (FIS) is baked into each lead — identifies bridge/renovation demand',
      'Ask: "What LTV thresholds are you currently writing to?"',
      'Pitch: lender-specific signals mean fewer cold deal applications, more pre-qualified inbound',
    ],
  },
};

const DEFAULT_PITCH = {
  open: 'Lead with the revenue signal score and the number of Lifecycle touches — shows intent.',
  points: [
    'They\'ve been active but haven\'t converted — urgency is already built in',
    'Ask what stopped them from upgrading after seeing the leads',
    'Position the tier upgrade as removing the barrier, not adding a cost',
  ],
};

const TIER_LABELS = {
  starter: 'Starter ($49/mo)',
  autopilot_pro: 'AutoPilot Pro ($197/mo)',
  annual_lock: 'Annual Lock ($397/yr)',
  dominator: 'Dominator ($497/mo)',
};

function fmtPrice(cents) {
  if (!cents) return '';
  return ' — $' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 }) + '/mo';
}

function fmtTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };
const dimText = { color: '#94a3b8' };

export default function CallBrief({ queueItem }) {
  if (!queueItem) return null;

  const pitch = VERTICAL_PITCH[queueItem.vertical] || DEFAULT_PITCH;
  const tierLabel = TIER_LABELS[queueItem.target_tier] || queueItem.target_tier;
  const firstName = (queueItem.subscriber_name || '').split(' ')[0] || 'them';
  const touches = queueItem.context_json?.last_messages || [];

  return (
    <div className="rounded-xl p-4 space-y-3" style={card}>
      <div className="flex items-center gap-2">
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#facc15" strokeWidth={2}>
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: '#facc15' }}>
          Call Brief
        </span>
      </div>

      {/* Opening */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Opening</p>
        <p className="text-xs leading-relaxed" style={{ color: '#e2e8f0' }}>
          "Hi {firstName}, this is [your name] — I'm following up on your{' '}
          <span className="text-yellow-400 font-medium">{tierLabel}{fmtPrice(queueItem.target_tier_price_cents)}</span> account.
          Got 90 seconds?"
        </p>
      </div>

      {/* Lead with */}
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Lead with</p>
        <p className="text-xs leading-relaxed" style={dimText}>{pitch.open}</p>
      </div>

      {/* Talking points */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Points</p>
        <ul className="space-y-1.5">
          {pitch.points.map((pt, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed" style={dimText}>
              <span className="shrink-0 mt-0.5" style={{ color: '#facc15' }}>›</span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Why Lifecycle flagged */}
      <div
        className="rounded-lg px-3 py-2 flex items-center gap-3 text-xs"
        style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.12)' }}
      >
        <div className="text-center">
          <div className="text-lg font-black" style={{ color: '#facc15' }}>{queueItem.revenue_signal_score}</div>
          <div className="text-[9px] uppercase" style={{ color: '#64748b' }}>RSS</div>
        </div>
        <div style={dimText}>
          {queueItem.interactions_count} Lifecycle touches, no conversion.
          Lifecycle flagged this lead as high-intent — they've engaged but not committed.
        </div>
      </div>

      {/* Last Lifecycle touches */}
      {touches.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Last Lifecycle Touches</p>
          <ul className="space-y-1">
            {touches.slice(0, 4).map((t, i) => (
              <li key={i} className="text-[11px] flex gap-2 items-start" style={dimText}>
                <span className="shrink-0 mt-0.5" style={{ color: '#475569' }}>·</span>
                <span>
                  <span className="text-slate-400">{t.graph_name || t.type || 'touch'}</span>
                  {t.sent_at && <span className="ml-1" style={{ color: '#475569' }}>{fmtTime(t.sent_at)}</span>}
                  {t.body && <span className="ml-1 italic" style={{ color: '#64748b' }}>— "{t.body.slice(0, 60)}{t.body.length > 60 ? '…' : ''}"</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
