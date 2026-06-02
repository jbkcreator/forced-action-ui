/**
 * Supplier Intelligence dashboard (fa067).
 * Route: /supplier/:accessToken
 *
 * Supplier-facing view of their account status, latest report, section data,
 * and export options.
 *
 * Phase 1 Foundation: sections marked "Insufficient data" or "Phase 2" are
 * clearly shown with honest explanations — no fake analytics.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  fetchSupplierStatus,
  fetchSupplierLatestReport,
  getSupplierExportUrl,
} from '../api/supplierIntel.js';

const SECTION_LABELS = {
  market_activity:       'Market Activity',
  top_zips:              'Top ZIPs',
  signal_movement:       'Signal Movement',
  property_tier_dist:    'Property Tier Distribution',
  trade_coverage:        'Trade Coverage',
  closed_deal_benchmarks:'Closed-Deal Benchmarks',
  contractor_demand:     'Contractor Demand',
  recommendations:       'Recommendations',
};

function StatusBadge({ status }) {
  const colors = {
    ok:                'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    insufficient_data: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    phase2:            'bg-purple-500/15 text-purple-400 border-purple-500/30',
    error:             'bg-red-500/15 text-red-400 border-red-500/30',
  };
  const labels = { ok: 'Available', insufficient_data: 'Insufficient data', phase2: 'Phase 2', error: 'Error' };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[status] || colors.error}`}>
      {labels[status] || status}
    </span>
  );
}

function SectionCard({ sectionKey, data }) {
  const label = SECTION_LABELS[sectionKey] || sectionKey;
  const status = data?.status || 'ok';

  return (
    <div className="bg-fa-bg-card border border-fa-border-default rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-fa-text-primary text-sm">{label}</h3>
        <StatusBadge status={status} />
      </div>

      {status === 'ok' && (
        <div className="space-y-1.5 text-sm">
          {sectionKey === 'market_activity' && (
            <>
              <div className="flex justify-between"><span className="text-fa-text-muted">Leads (30d)</span><span className="font-semibold">{data.leads_last_30d ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-fa-text-muted">Leads (60d)</span><span className="font-semibold">{data.leads_last_60d ?? '—'}</span></div>
              {data.period_change_pct != null && (
                <div className="flex justify-between">
                  <span className="text-fa-text-muted">Period change</span>
                  <span className={`font-semibold ${data.period_change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {data.period_change_pct >= 0 ? '+' : ''}{data.period_change_pct}%
                  </span>
                </div>
              )}
              {data.signals && Object.entries(data.signals).map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-fa-text-muted capitalize">{k.replace('_', ' ')}</span>
                  <span>{v}</span>
                </div>
              ))}
            </>
          )}

          {sectionKey === 'top_zips' && data.top_zips?.length > 0 && (
            <table className="w-full text-xs">
              <thead><tr className="text-fa-text-muted"><th className="text-left pb-1">ZIP</th><th className="text-right pb-1">Leads</th><th className="text-right pb-1">Premium</th></tr></thead>
              <tbody>
                {data.top_zips.slice(0, 8).map(z => (
                  <tr key={z.zip}><td>{z.zip}</td><td className="text-right">{z.lead_count}</td><td className="text-right">{z.premium_count}</td></tr>
                ))}
              </tbody>
            </table>
          )}

          {sectionKey === 'property_tier_dist' && data.distribution && (
            <div className="space-y-1">
              {Object.entries(data.distribution).map(([tier, d]) => (
                <div key={tier} className="flex items-center gap-2 text-xs">
                  <span className="text-fa-text-muted w-24 shrink-0">{tier}</span>
                  <div className="flex-1 bg-fa-bg-base rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-fa-primary" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="w-12 text-right">{d.count} ({d.pct}%)</span>
                </div>
              ))}
            </div>
          )}

          {sectionKey === 'trade_coverage' && data.verticals?.length > 0 && (
            <div className="space-y-1 text-xs">
              {data.verticals.map(v => (
                <div key={v.vertical} className="flex justify-between">
                  <span className="text-fa-text-muted capitalize">{v.vertical.replace('_', ' ')}</span>
                  <span>{v.lead_count} leads</span>
                </div>
              ))}
            </div>
          )}

          {sectionKey === 'closed_deal_benchmarks' && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-fa-text-muted">Avg deal size</span><span>${(data.avg_deal_size_usd || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-fa-text-muted">Avg days to close</span><span>{Math.round(data.avg_days_to_close || 0)}d</span></div>
              <div className="flex justify-between"><span className="text-fa-text-muted">Close rate</span><span>{data.close_rate_pct}%</span></div>
            </div>
          )}

          {sectionKey === 'contractor_demand' && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-fa-text-muted">Active subscribers</span><span>{data.active_subscriber_count}</span></div>
              <div className="flex justify-between"><span className="text-fa-text-muted">Active buyers (30d)</span><span>{data.active_buyers_30d}</span></div>
              <div className="flex justify-between"><span className="text-fa-text-muted">Leads consumed (30d)</span><span>{data.leads_consumed_30d}</span></div>
            </div>
          )}

          {!['market_activity','top_zips','property_tier_dist','trade_coverage','closed_deal_benchmarks','contractor_demand'].includes(sectionKey) && (
            <p className="text-xs text-fa-text-muted">Data available.</p>
          )}
        </div>
      )}

      {status === 'insufficient_data' && (
        <div className="text-xs text-fa-text-muted space-y-1">
          <p className="text-yellow-400 font-medium">{data.current_count ?? 0} / {data.minimum_required ?? '?'} required data points</p>
          <p>{data.message}</p>
        </div>
      )}

      {status === 'phase2' && (
        <p className="text-xs text-purple-400">{data.message}</p>
      )}

      {status === 'error' && (
        <p className="text-xs text-red-400">Section generation failed. Check back later.</p>
      )}
    </div>
  );
}

export default function SupplierDashboard() {
  const { accessToken } = useParams();
  const [status, setStatus] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      fetchSupplierStatus(accessToken),
      fetchSupplierLatestReport(accessToken).catch(() => null),
    ])
      .then(([s, r]) => { setStatus(s); setReport(r); })
      .catch(e => setError(e?.message || e?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-fa-bg-base flex items-center justify-center">
        <p className="text-fa-text-muted text-sm">Loading Supplier Intelligence dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-fa-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-fa-text-muted text-xs mt-2">Check your access link or contact support.</p>
        </div>
      </div>
    );
  }

  const sections = report?.sections_json || {};

  return (
    <div className="min-h-screen bg-fa-bg-base">
      <header className="border-b border-fa-border-default px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-fa-text-muted mb-0.5">Supplier Intelligence</p>
          <h1 className="text-lg font-bold text-fa-text-primary">{status?.company_name}</h1>
        </div>
        <div className="text-right text-xs text-fa-text-muted">
          <p>Plan: <span className="text-fa-text-secondary font-semibold capitalize">{status?.plan_tier || 'foundation'}</span></p>
          <p>Status: <span className="text-fa-text-secondary">{status?.sub_status || status?.status}</span></p>
          {status?.trial_ends_at && <p>Trial ends: {status.trial_ends_at.slice(0, 10)}</p>}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Phase 1 banner */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-purple-400 mb-1">Supplier Intelligence — Foundation (Phase 1)</p>
          <p className="text-xs text-fa-text-muted">
            This is the Phase 1 foundation. Sections marked "Insufficient data" will activate when
            enough market activity and deal outcome data has been collected for your territory.
            AI-driven recommendations and advanced analytics are coming in Phase 2.
          </p>
        </div>

        {/* Coverage */}
        {(status?.counties?.length || status?.verticals?.length) && (
          <div className="bg-fa-bg-card border border-fa-border-default rounded-xl px-5 py-4">
            <h2 className="text-sm font-semibold text-fa-text-primary mb-2">Your Coverage</h2>
            <div className="flex gap-6 text-xs">
              {status.counties?.length > 0 && (
                <div><p className="text-fa-text-muted mb-1">Counties</p>
                  {status.counties.map(c => <span key={c} className="inline-block bg-fa-bg-base border border-fa-border-default px-2 py-0.5 rounded mr-1 mb-1">{c}</span>)}
                </div>
              )}
              {status.verticals?.length > 0 && (
                <div><p className="text-fa-text-muted mb-1">Verticals</p>
                  {status.verticals.map(v => <span key={v} className="inline-block bg-fa-bg-base border border-fa-border-default px-2 py-0.5 rounded mr-1 mb-1 capitalize">{v.replace('_', ' ')}</span>)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report period */}
        {report && (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-fa-text-primary">Latest Report</h2>
              <p className="text-xs text-fa-text-muted">
                {report.report_period_start} — {report.report_period_end}
                {report.county_id ? ` · ${report.county_id}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <a href={getSupplierExportUrl(accessToken, report.id, 'pdf')}
                 className="px-3 py-1.5 text-xs font-semibold bg-fa-primary text-fa-bg-base rounded hover:opacity-90">
                Download PDF
              </a>
              <a href={getSupplierExportUrl(accessToken, report.id, 'csv')}
                 className="px-3 py-1.5 text-xs font-semibold border border-fa-border-default text-fa-text-secondary rounded hover:text-fa-text-primary">
                Download CSV
              </a>
            </div>
          </div>
        )}

        {/* Section grid */}
        {Object.keys(sections).length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(sections).map(([key, data]) => (
              <SectionCard key={key} sectionKey={key} data={data} />
            ))}
          </div>
        ) : (
          <div className="bg-fa-bg-card border border-fa-border-default rounded-xl px-5 py-8 text-center">
            <p className="text-fa-text-muted text-sm">No reports generated yet.</p>
            <p className="text-fa-text-muted text-xs mt-1">Your administrator will generate your first report shortly.</p>
          </div>
        )}
      </main>
    </div>
  );
}
