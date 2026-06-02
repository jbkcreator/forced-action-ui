import { useState } from 'react';
import { wlDownloadLeadsCsv, wlDownloadBenchmarkPdf, wlDownloadDashboardPdf } from '../../api/whiteLabelClient.js';
import useApi from '../../hooks/useApi.js';
import { wlGetStats } from '../../api/whiteLabelClient.js';

export default function WLReportsSection() {
  const { data: stats } = useApi(wlGetStats, []);
  const [downloading, setDownloading] = useState({});

  async function download(key, fn, args) {
    setDownloading(d => ({ ...d, [key]: true }));
    try {
      await fn(args);
    } catch (err) {
      alert(err?.message || 'Download failed');
    } finally {
      setDownloading(d => ({ ...d, [key]: false }));
    }
  }

  const totalLeads = stats?.reduce((s, r) => s + (r.cnt || 0), 0) || 0;

  const REPORTS = [
    {
      key: 'leads_csv',
      icon: '📊',
      title: 'Lead Export (CSV)',
      desc: 'All Gold+ leads with address, score, tier, owner and phone. Branded with your company name.',
      action: () => download('leads_csv', wlDownloadLeadsCsv, {}),
    },
    {
      key: 'benchmark_pdf',
      icon: '📄',
      title: 'Contractor Benchmark (PDF)',
      desc: 'Branded benchmark report showing performance vs. county peers. Great for AP upsell.',
      action: () => download('benchmark_pdf', wlDownloadBenchmarkPdf),
    },
    {
      key: 'dashboard_pdf',
      icon: '📈',
      title: 'Operations Dashboard (PDF)',
      desc: 'Full 10-section daily dashboard with your logo and brand colors.',
      action: () => download('dashboard_pdf', wlDownloadDashboardPdf),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-fa-text-primary">Reports</h2>
        <p className="text-fa-text-muted text-sm">
          Download branded reports. All PDFs and exports use your company logo and colors.
        </p>
      </div>

      {/* Stats summary */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total leads', value: totalLeads.toLocaleString() },
            { label: 'Counties', value: [...new Set(stats.map(r => r.county_id))].length },
            { label: 'Gold+ tiers', value: [...new Set(stats.map(r => r.lead_tier))].length },
          ].map(stat => (
            <div key={stat.label} className="bg-fa-bg-card border border-fa-border-default rounded-lg p-4">
              <p className="text-2xl font-bold text-fa-primary">{stat.value}</p>
              <p className="text-fa-text-muted text-xs mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {REPORTS.map(report => (
          <div key={report.key} className="bg-fa-bg-card border border-fa-border-default rounded-lg p-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="text-2xl">{report.icon}</span>
              <div>
                <p className="font-bold text-fa-text-primary">{report.title}</p>
                <p className="text-fa-text-muted text-sm mt-0.5">{report.desc}</p>
              </div>
            </div>
            <button
              onClick={report.action}
              disabled={downloading[report.key]}
              className="flex-shrink-0 bg-fa-primary text-fa-bg-base font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            >
              {downloading[report.key] ? 'Generating…' : 'Download'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
