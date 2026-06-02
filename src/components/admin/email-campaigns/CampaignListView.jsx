import { useState, useEffect } from 'react';
import {
  fetchCampaigns,
  pauseCampaign,
  resumeCampaign,
} from '../../../api/emailCampaigns';

const STATUS_COLORS = {
  active:    { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80',  label: 'Active' },
  paused:    { bg: 'rgba(250,204,21,0.15)',  text: '#facc15',  label: 'Paused' },
  completed: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8',  label: 'Completed' },
  draft:     { bg: 'rgba(96,165,250,0.15)',  text: '#60a5fa',  label: 'Draft' },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', width: i === 0 ? '60%' : '40%' }} />
        </td>
      ))}
    </tr>
  );
}

const TH_STYLE = {
  color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em',
  textTransform: 'uppercase', padding: '10px 16px',
  borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left',
};
const TD_STYLE = {
  padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
  fontSize: '13px', color: '#e2e8f0',
};

function fmtRate(fraction) {
  if (fraction == null) return '—';
  return `${(fraction * 100).toFixed(1)}%`;
}

export default function CampaignListView({ token, onOpenDetail, onCreateClick, onEditClick }) {
  const [campaigns, setCampaigns]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [statusFilter, setStatusFilter]   = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchCampaigns(token, { status: statusFilter }, { signal: controller.signal })
      .then(data => { setCampaigns(Array.isArray(data) ? data : []); setError(null); })
      .catch(err => { if (err.name !== 'AbortError') setError(err.detail || 'Failed to load campaigns'); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [token, statusFilter]);

  async function handlePauseResume(campaign) {
    setActionLoading(p => ({ ...p, [campaign.id]: true }));
    try {
      if (campaign.status === 'active') {
        await pauseCampaign(token, campaign.id);
        setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: 'paused' } : c));
      } else {
        await resumeCampaign(token, campaign.id);
        setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: 'active' } : c));
      }
    } catch (err) { console.error('Action failed', err); }
    finally { setActionLoading(p => ({ ...p, [campaign.id]: false })); }
  }

  const btnBase = 'text-xs px-2.5 py-1 rounded-md font-medium transition-colors';

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-xs rounded-lg px-3 py-2 focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark', color: '#e2e8f0' }}
        >
          <option value=""          style={{ background: '#0f172a', color: '#e2e8f0' }}>All statuses</option>
          <option value="active"    style={{ background: '#0f172a', color: '#e2e8f0' }}>Active</option>
          <option value="paused"    style={{ background: '#0f172a', color: '#e2e8f0' }}>Paused</option>
          <option value="completed" style={{ background: '#0f172a', color: '#e2e8f0' }}>Completed</option>
          <option value="draft"     style={{ background: '#0f172a', color: '#e2e8f0' }}>Draft</option>
        </select>

        <button
          onClick={onCreateClick}
          className={`${btnBase} ml-auto px-3 py-1.5`}
          style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#0a0f1e' }}
        >
          + Create Campaign
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <table className="w-full">
          <thead style={{ background: 'rgba(15,23,42,0.9)' }}>
            <tr>
              {['Name', 'Status', 'Contacts', 'Open %', 'Reply %', 'Last Synced', 'Actions'].map(h => (
                <th key={h} style={TH_STYLE}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody style={{ background: 'rgba(10,15,30,0.7)' }}>
            {loading && [...Array(4)].map((_, i) => <SkeletonRow key={i} />)}

            {!loading && error && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: '#f87171' }}>
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center" style={{ color: '#64748b' }}>
                  <p className="text-sm">No campaigns found</p>
                  <button
                    onClick={onCreateClick}
                    className={`${btnBase} mt-3 px-3 py-1.5`}
                    style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15' }}
                  >
                    Create your first campaign
                  </button>
                </td>
              </tr>
            )}

            {!loading && !error && campaigns.map(c => (
              <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                <td style={TD_STYLE}>
                  <span className="font-medium text-white">{c.name}</span>
                </td>
                <td style={TD_STYLE}><StatusBadge status={c.status} /></td>
                <td style={TD_STYLE}>{(c.contact_count ?? 0).toLocaleString()}</td>
                <td style={TD_STYLE}>{fmtRate(c.open_rate)}</td>
                <td style={TD_STYLE}>{fmtRate(c.reply_rate)}</td>
                <td style={{ ...TD_STYLE, color: '#64748b', fontSize: '12px' }}>
                  {c.last_synced_at ? new Date(c.last_synced_at).toLocaleDateString() : '—'}
                </td>
                <td style={TD_STYLE}>
                  <div className="flex items-center gap-1.5">
                    {/* Fixed-width slot — only active/paused get the button; others get a spacer so View/Edit stay aligned */}
                    {(c.status === 'active' || c.status === 'paused') ? (
                      <button
                        onClick={() => handlePauseResume(c)}
                        disabled={actionLoading[c.id]}
                        className={`${btnBase} text-center`}
                        style={{
                          minWidth: '68px',
                          background: c.status === 'active' ? 'rgba(250,204,21,0.12)' : 'rgba(34,197,94,0.12)',
                          color: c.status === 'active' ? '#facc15' : '#4ade80',
                          opacity: actionLoading[c.id] ? 0.5 : 1,
                        }}
                      >
                        {actionLoading[c.id] ? '…' : c.status === 'active' ? 'Pause' : 'Resume'}
                      </button>
                    ) : (
                      <span style={{ minWidth: '68px', display: 'inline-block' }} />
                    )}
                    <button
                      onClick={() => onOpenDetail(c)}
                      className={btnBase}
                      style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEditClick(c)}
                      className={btnBase}
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
                    >
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
