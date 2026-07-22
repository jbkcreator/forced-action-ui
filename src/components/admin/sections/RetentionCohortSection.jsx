import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminContext } from '../adminContext';
import { fetchRetentionCohorts } from '../../../api/admin';
import useApi from '../../../hooks/useApi';
import { Skeleton } from '../../ui/Skeleton';

const CARD = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };
const SELECT_STYLE = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#e2e8f0',
  borderRadius: '8px',
  padding: '7px 12px',
  fontSize: '13px',
  outline: 'none',
};

// Mirrors the CHECK constraint on subscribers.tier (models.py:1347).
const TIERS = [
  'free', 'starter', 'pro', 'dominator', 'data_only',
  'autopilot_lite', 'autopilot_pro', 'partner', 'annual_lock', 'founder',
];

// Values _CHANNEL_KEY_SQL (revenue_metrics.py) can resolve to — normalized
// utm_source buckets, the quora special-case, plus the signup_source
// allow-list (models.py:1263) as fallback values.
const CHANNELS = [
  'meta', 'dbpr_email', 'quora', 'direct', 'landing_page',
  'cora_sms', 'missed_call', 'referral', 'admin', 'affiliate', 'unattributed',
];

function fmtPercent(rate) {
  if (rate == null) return '—';
  return `${(rate * 100).toFixed(0)}%`;
}

function cellColor(rate) {
  if (rate == null) return 'text-slate-600';
  if (rate >= 0.8) return 'text-emerald-400';
  if (rate >= 0.5) return 'text-yellow-300';
  return 'text-red-400';
}

function CohortRow({ cohort }) {
  return (
    <tr>
      <td className="py-2 pr-4 text-xs text-slate-400 whitespace-nowrap">{cohort.cohort_month}</td>
      <td className="py-2 pr-4 text-xs text-slate-500 whitespace-nowrap">{cohort.size}</td>
      {cohort.cells.map(cell => (
        <td key={cell.m} className="py-2 px-2 text-center">
          {cohort.suppressed ? (
            <span className="text-xs text-slate-600" title={`n=${cohort.size} — suppressed (min ${5})`}>—</span>
          ) : cell.rate == null ? (
            <span className="text-xs text-slate-700">·</span>
          ) : (
            <span className={`text-xs font-semibold ${cellColor(cell.rate)}`}>{fmtPercent(cell.rate)}</span>
          )}
        </td>
      ))}
    </tr>
  );
}

export default function RetentionCohortSection() {
  const { token } = useAdminContext();
  const [channel, setChannel] = useState('');
  const [tier, setTier] = useState('');
  const [zip, setZip] = useState('');
  const [zipInput, setZipInput] = useState('');

  const fetcher = useCallback(
    signal => fetchRetentionCohorts(token, { channel: channel || undefined, tier: tier || undefined, zip: zip || undefined }, { signal }),
    [token, channel, tier, zip],
  );
  const { data, loading, error } = useApi(fetcher, [fetcher]);

  const months = data?.months ?? 12;

  return (
    <div className="px-6 py-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-0.5">Retention Cohorts</h2>
          <p className="text-xs text-slate-500">
            Paid logo retention by signup month — % of each cohort still paying at each month of age.
          </p>
        </div>
        <Link to="/admin/operator" className="text-xs text-yellow-400/80 hover:text-yellow-300 whitespace-nowrap">
          ← At-a-Glance
        </Link>
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Channel</label>
          <select value={channel} onChange={e => setChannel(e.target.value)} style={SELECT_STYLE}>
            <option value="">All channels</option>
            {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Tier</label>
          <select value={tier} onChange={e => setTier(e.target.value)} style={SELECT_STYLE}>
            <option value="">All tiers</option>
            {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">ZIP</label>
          <form
            onSubmit={e => { e.preventDefault(); setZip(zipInput.trim()); }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Any ZIP"
              value={zipInput}
              onChange={e => setZipInput(e.target.value)}
              style={{ ...SELECT_STYLE, width: '110px' }}
            />
            <button type="submit" className="text-xs px-3 py-1.5 rounded-lg" style={{ ...CARD, color: '#facc15' }}>
              Apply
            </button>
          </form>
        </div>
        {(channel || tier || zip) && (
          <button
            onClick={() => { setChannel(''); setTier(''); setZip(''); setZipInput(''); }}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {zip && (
        <p className="text-[11px] text-slate-600">
          Note: ZIP membership is many-to-many (a subscriber can hold multiple ZIPs) — this
          cohort's denominator is not mutually exclusive with other ZIP filters.
        </p>
      )}

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-300" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error.detail || error.message || 'Failed to load retention cohorts'}
        </div>
      )}

      <div className="rounded-xl p-4 overflow-x-auto" style={CARD}>
        {loading && <Skeleton className="h-64 rounded-xl" />}
        {!loading && data && data.cohorts.length === 0 && (
          <div className="text-sm text-slate-500 py-8 text-center">No cohorts match these filters.</div>
        )}
        {!loading && data && data.cohorts.length > 0 && (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="py-2 pr-4 text-left text-xs text-slate-500 font-medium">Cohort</th>
                <th className="py-2 pr-4 text-left text-xs text-slate-500 font-medium">Size</th>
                {Array.from({ length: months }).map((_, m) => (
                  <th key={m} className="py-2 px-2 text-center text-xs text-slate-500 font-medium">M{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.cohorts.map(cohort => (
                <CohortRow key={cohort.cohort_month} cohort={cohort} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[11px] text-slate-600">
        Paid subscribers only (free/trial abandonment out of scope). Cohorts with fewer than 5
        subscribers are suppressed (shown as "—"). "·" means the cohort hasn't aged into that month yet.
      </p>
    </div>
  );
}
