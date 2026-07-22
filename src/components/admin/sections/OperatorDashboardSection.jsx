import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminContext } from '../adminContext';
import { fetchOperatorDashboard } from '../../../api/admin';
import useApi from '../../../hooks/useApi';
import { Skeleton } from '../../ui/Skeleton';

const CARD = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#e2e8f0',
  borderRadius: '8px',
  padding: '7px 12px',
  fontSize: '13px',
  outline: 'none',
};

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDollars(cents) {
  if (cents == null) return '—';
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
}

function fmtPercent(rate) {
  if (rate == null) return '—';
  return `${(rate * 100).toFixed(0)}%`;
}

// T-B8-03 action queue lives at /admin/action-queue and filters by ?lane / ?category.
// These two KPI cards deep-link into the matching pre-filtered lane.
const QUEUE_LINKS = {
  cora_approvals_waiting: '/admin/action-queue?lane=approvals&category=legal',
  source_failures: '/admin/action-queue?lane=failures&category=source',
};

const ICON_PROPS = { width: 16, height: 16, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.8 };

const ICONS = {
  mrr: (
    <svg {...ICON_PROPS}><circle cx="12" cy="12" r="9" /><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v-1m0 9v1" /></svg>
  ),
  new_accounts: (
    <svg {...ICON_PROPS}><path d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 014-4h.5" /><circle cx="9" cy="7" r="4" /></svg>
  ),
  churn_risk: (
    <svg {...ICON_PROPS}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  leads_delivered: (
    <svg {...ICON_PROPS}><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v6l9 4 9-4V7" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  activation: (
    <svg {...ICON_PROPS}><path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  deals_submitted: (
    <svg {...ICON_PROPS}><path d="M7 3h7l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 12h6m-6 4h4" strokeLinecap="round" /></svg>
  ),
  lender_matches: (
    <svg {...ICON_PROPS}><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  loans_funded: (
    <svg {...ICON_PROPS}><circle cx="9" cy="9" r="5" /><circle cx="15" cy="15" r="5" /></svg>
  ),
  commissions_owed: (
    <svg {...ICON_PROPS}><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M8 9V6a4 4 0 018 0v3" strokeLinecap="round" /></svg>
  ),
  source_failures: (
    <svg {...ICON_PROPS}><path d="M12 3l9 16H3l9-16z" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 10v4m0 3h.01" strokeLinecap="round" /></svg>
  ),
  cora_approvals_waiting: (
    <svg {...ICON_PROPS}><rect x="5" y="8" width="14" height="11" rx="2" /><path d="M12 8V5m-3 8h.01M15 13h.01" strokeLinecap="round" /><circle cx="12" cy="4" r="1" /></svg>
  ),
};

// "Zero is good" severity — the only threshold that needs no product-defined
// target band: these three KPIs are unambiguously bad when > 0. Other KPIs
// (revenue, counts, rates) have no such unambiguous default and stay neutral
// until product defines real target bands.
function zeroIsGoodSeverity(kpi) {
  return kpi.value > 0 ? 'text-red-400' : 'text-emerald-400';
}

const NEUTRAL = 'text-yellow-300';

const KPI_META = [
  { slug: 'mrr', label: 'MRR', render: kpi => fmtDollars(kpi.value_cents), color: () => NEUTRAL, icon: ICONS.mrr, accent: '#a78bfa' },
  { slug: 'new_accounts', label: 'New Accounts', render: kpi => kpi.value, color: () => NEUTRAL, icon: ICONS.new_accounts, accent: '#60a5fa' },
  { slug: 'churn_risk', label: 'Churn Risk', render: kpi => kpi.value, color: zeroIsGoodSeverity, icon: ICONS.churn_risk, accent: '#fb923c' },
  { slug: 'leads_delivered', label: 'Leads Delivered', render: kpi => kpi.value, color: () => NEUTRAL, icon: ICONS.leads_delivered, accent: '#2dd4bf' },
  {
    slug: 'activation',
    label: 'Activation',
    render: kpi => fmtPercent(kpi.free_to_paid_rate),
    subtext: kpi => `avg ${kpi.avg_days_to_convert?.toFixed?.(1) ?? '—'}d to convert`,
    note: kpi => kpi.note,
    color: () => NEUTRAL,
    icon: ICONS.activation,
    accent: '#22d3ee',
  },
  { slug: 'deals_submitted', label: 'Deals Submitted', render: kpi => kpi.value, color: () => NEUTRAL, icon: ICONS.deals_submitted, accent: '#60a5fa' },
  { slug: 'lender_matches', label: 'Lender Matches', render: kpi => kpi.value, color: () => NEUTRAL, icon: ICONS.lender_matches, accent: '#a78bfa' },
  { slug: 'loans_funded', label: 'Loans Funded', render: kpi => kpi.value, color: () => NEUTRAL, icon: ICONS.loans_funded, accent: '#34d399' },
  { slug: 'commissions_owed', label: 'Commissions Owed', render: kpi => fmtDollars(kpi.value_cents), color: () => NEUTRAL, icon: ICONS.commissions_owed, accent: '#fb923c' },
  { slug: 'source_failures', label: 'Source Failures', render: kpi => kpi.value, color: zeroIsGoodSeverity, icon: ICONS.source_failures, accent: '#f87171' },
  {
    slug: 'cora_approvals_waiting',
    label: 'Cora Approvals Waiting',
    render: kpi => kpi.value,
    note: kpi => kpi.note,
    color: zeroIsGoodSeverity,
    icon: ICONS.cora_approvals_waiting,
    accent: '#a78bfa',
  },
];

function KpiTile({ meta, kpi }) {
  const linkTo = QUEUE_LINKS[meta.slug];
  const content = (
    <div className="rounded-xl p-4 h-full" style={{ ...CARD, opacity: kpi.available === false ? 0.5 : 1 }}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${meta.accent}22`, color: meta.accent }}
        >
          {meta.icon}
        </span>
        <span className="text-xs text-slate-500">{meta.label}</span>
      </div>
      {kpi.available === false ? (
        <div className="text-sm text-slate-500 mt-2">{kpi.reason}</div>
      ) : (
        <>
          <div className={`text-2xl font-bold ${meta.color(kpi)}`}>{meta.render(kpi)}</div>
          {meta.subtext && <div className="text-xs text-slate-500 mt-1">{meta.subtext(kpi)}</div>}
          {meta.note && kpi.note && <div className="text-[11px] text-slate-600 mt-1.5">{kpi.note}</div>}
          {linkTo && <div className="text-xs text-yellow-400/80 mt-2">View queue →</div>}
        </>
      )}
    </div>
  );
  return linkTo ? <Link to={linkTo} className="block hover:brightness-110 transition-all">{content}</Link> : content;
}

export default function OperatorDashboardSection() {
  const { token } = useAdminContext();
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());

  const fetcher = useCallback(
    signal => fetchOperatorDashboard(token, { from, to }, { signal }),
    [token, from, to],
  );
  const { data, loading, error } = useApi(fetcher, [fetcher]);

  return (
    <div className="px-6 py-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-0.5">At-a-Glance</h2>
          <p className="text-xs text-slate-500">The whole business on one screen — 11 KPIs from existing metrics services.</p>
        </div>
        <Link to="/admin/operator/retention" className="text-xs text-yellow-400/80 hover:text-yellow-300 whitespace-nowrap">
          Retention Cohorts →
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ ...INPUT_STYLE, colorScheme: 'dark' }} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ ...INPUT_STYLE, colorScheme: 'dark' }} />
        </div>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error.detail || error.message || 'Failed to load operator dashboard'}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {loading && Array.from({ length: 11 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-xl" />
        ))}
        {!loading && data && KPI_META.map(meta => (
          <KpiTile key={meta.slug} meta={meta} kpi={data.kpis[meta.slug]} />
        ))}
      </div>
    </div>
  );
}
