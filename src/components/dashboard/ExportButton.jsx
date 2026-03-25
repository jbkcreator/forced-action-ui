import Icon from '../ui/Icon';

function escapeCsv(val) {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ExportButton({ leads, page }) {
  function handleExport() {
    if (!leads?.length) return;

    const headers = ['Address', 'City', 'State', 'ZIP', 'CDS Score', 'Lead Tier', 'Distress Types', 'Est. Job Value', 'Latest Incident'];
    const rows = leads.map((l) => [
      l.address,
      l.city,
      l.state,
      l.zip,
      Math.round(l.cds_score || 0),
      l.lead_tier || '',
      (l.distress_types || []).join('; '),
      l.est_job_value?.display || '',
      l.incidents?.[0] ? `${l.incidents[0].type} — ${l.incidents[0].date}` : '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      disabled={!leads?.length}
      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-400 hover:text-white hover:bg-white/[0.08] transition disabled:opacity-30"
      aria-label="Export leads to CSV"
    >
      <Icon name="download" size={16} />
      <span className="hidden sm:inline">Export</span>
    </button>
  );
}
