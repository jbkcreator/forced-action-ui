import { useState, useEffect } from 'react';
import {
  fetchCampaignDetail,
  fetchContacts,
  exportContacts,
  pauseCampaign,
  resumeCampaign,
  addMoreContacts,
} from '../../../api/emailCampaigns';

const PAGE_SIZE = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtRate(fraction) {
  if (fraction == null) return '—';
  return `${(fraction * 100).toFixed(1)}%`;
}

function fmtCount(val) {
  if (val == null) return '—';
  return Number(val).toLocaleString();
}

// ─── Analytics card ───────────────────────────────────────────────────────────

function AnalyticsCard({ label, value }) {
  return (
    <div
      className="rounded-xl p-4 min-w-[90px]"
      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <p className="text-xs font-medium mb-1" style={{ color: '#64748b' }}>{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

// ─── Engagement status badge ──────────────────────────────────────────────────

const ENGAGEMENT_COLORS = {
  active:         { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80' },
  completed:      { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  bounced:        { bg: 'rgba(248,113,113,0.15)', text: '#f87171' },
  unsubscribed:   { bg: 'rgba(251,146,60,0.15)',  text: '#fb923c' },
  interested:     { bg: 'rgba(34,211,238,0.15)',  text: '#22d3ee' },
  not_interested: { bg: 'rgba(148,163,184,0.12)', text: '#64748b' },
};

function EngagementBadge({ status }) {
  const c = ENGAGEMENT_COLORS[status] || { bg: 'rgba(255,255,255,0.08)', text: '#94a3b8' };
  const label = status ? status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '—';
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: c.bg, color: c.text }}>
      {label}
    </span>
  );
}

// ─── Table helpers ─────────────────────────────────────────────────────────────

const TH = { color: '#64748b', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' };
const TD = { padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', color: '#e2e8f0' };

function SkeletonRow() {
  return (
    <tr>
      {[...Array(7)].map((_, i) => (
        <td key={i} style={TD}>
          <div className="h-3.5 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', width: i === 0 ? '70%' : '50%' }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CampaignDetailView({ token, campaign: initialCampaign, onBack, onEditClick }) {
  // Full CampaignDetailOut from GET /email-campaigns/{id}
  const [detail, setDetail]               = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);

  // Contacts list
  const [contacts, setContacts]                   = useState([]);
  const [hasMore, setHasMore]                     = useState(false);
  const [contactsLoading, setContactsLoading]     = useState(true);

  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]               = useState(1);

  const [actionLoading, setActionLoading] = useState({});
  const [currentStatus, setCurrentStatus] = useState(initialCampaign.status);
  const [addedMsg, setAddedMsg]           = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch full campaign detail (analytics) once on mount
  useEffect(() => {
    const controller = new AbortController();
    fetchCampaignDetail(token, initialCampaign.id, { signal: controller.signal })
      .then(data => {
        setDetail(data);
        setCurrentStatus(data.status);
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => setDetailLoading(false));
    return () => controller.abort();
  }, [token, initialCampaign.id]);

  // Fetch contacts (re-runs on filter/page change)
  useEffect(() => {
    const controller = new AbortController();
    setContactsLoading(true);
    fetchContacts(
      token,
      initialCampaign.id,
      { search, engagement_status: statusFilter, page, page_size: PAGE_SIZE },
      { signal: controller.signal }
    )
      .then(data => {
        const rows = Array.isArray(data) ? data : [];
        setContacts(rows);
        setHasMore(rows.length === PAGE_SIZE);
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => setContactsLoading(false));
    return () => controller.abort();
  }, [token, initialCampaign.id, search, statusFilter, page]);

  async function handlePauseResume() {
    setActionLoading(p => ({ ...p, pr: true }));
    try {
      if (currentStatus === 'active') {
        await pauseCampaign(token, initialCampaign.id);
        setCurrentStatus('paused');
      } else {
        await resumeCampaign(token, initialCampaign.id);
        setCurrentStatus('active');
      }
    } catch (err) { console.error(err); }
    finally { setActionLoading(p => ({ ...p, pr: false })); }
  }

  async function handleAddContacts() {
    setActionLoading(p => ({ ...p, add: true }));
    setAddedMsg(null);
    try {
      const result = await addMoreContacts(token, initialCampaign.id);
      setAddedMsg(result?.added != null ? `Added ${result.added} contacts` : 'Done');
      // Refresh analytics so contact_count is up to date
      fetchCampaignDetail(token, initialCampaign.id)
        .then(data => { setDetail(data); setCurrentStatus(data.status); })
        .catch(console.error);
    } catch (err) { console.error(err); }
    finally { setActionLoading(p => ({ ...p, add: false })); }
  }

  async function handleExport() {
    setExportLoading(true);
    try {
      const blob = await exportContacts(token, initialCampaign.id, { engagement_status: statusFilter });
      if (blob) {
        const url = URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaign-${initialCampaign.id}-contacts.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) { console.error(err); }
    finally { setExportLoading(false); }
  }

  const STATUS_COLORS = {
    active:    { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80' },
    paused:    { bg: 'rgba(250,204,21,0.15)',  text: '#facc15' },
    completed: { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
    draft:     { bg: 'rgba(96,165,250,0.15)',  text: '#60a5fa' },
  };
  const sc      = STATUS_COLORS[currentStatus] || STATUS_COLORS.draft;
  const btnBase = 'text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity disabled:opacity-50';

  const instantlyUrl = initialCampaign.instantly_campaign_id
    ? `https://app.instantly.ai/app/campaigns/${initialCampaign.instantly_campaign_id}`
    : null;

  // Resolved detail (null while loading)
  const d = detail || {};

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <button
            onClick={onBack}
            className="text-xs mb-2 flex items-center gap-1 transition-colors"
            style={{ color: '#64748b' }}
            onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            ← Back to Campaigns
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">{initialCampaign.name}</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>
              {currentStatus}
            </span>
          </div>
          {(d.vertical || d.county_id) && (
            <p className="text-xs mt-1 capitalize" style={{ color: '#64748b' }}>
              {[d.vertical, d.county_id, d.start_date].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePauseResume}
            disabled={actionLoading.pr || currentStatus === 'completed'}
            className={btnBase}
            style={{ background: currentStatus === 'active' ? 'rgba(250,204,21,0.12)' : 'rgba(34,197,94,0.12)', color: currentStatus === 'active' ? '#facc15' : '#4ade80' }}
          >
            {actionLoading.pr ? '…' : currentStatus === 'active' ? 'Pause' : 'Resume'}
          </button>
          <button onClick={handleAddContacts} disabled={actionLoading.add} className={btnBase} style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
            {actionLoading.add ? '…' : 'Add More Contacts'}
          </button>
          <button
            onClick={() => onEditClick(detail || initialCampaign)}
            className={btnBase}
            style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}
          >
            Edit
          </button>
          {instantlyUrl && (
            <a href={instantlyUrl} target="_blank" rel="noreferrer" className={btnBase} style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}>
              Open in Instantly ↗
            </a>
          )}
        </div>
      </div>

      {/* Add contacts feedback */}
      {addedMsg && (
        <div className="mb-3 px-4 py-2 rounded-lg text-xs" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
          {addedMsg}
        </div>
      )}

      {/* Analytics — sourced from GET /email-campaigns/{id} (CampaignDetailOut) */}
      <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Analytics</p>
          <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b' }}>
            {detailLoading ? '…' : d.snapshot_date ? `Snapshot: ${d.snapshot_date}` : 'No snapshot yet — fresh/draft campaign'}
          </span>
        </div>

        {detailLoading ? (
          <div className="grid grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl p-4 h-[72px] animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : (
          <>
            {/* Primary metrics */}
            <div className="grid grid-cols-4 gap-3 mb-3">
              <AnalyticsCard label="Total Contacts" value={fmtCount(d.contact_count)} />
              <AnalyticsCard label="Open Rate"      value={fmtRate(d.open_rate)} />
              <AnalyticsCard label="Reply Rate"     value={fmtRate(d.reply_rate)} />
              <AnalyticsCard label="Interested"     value={fmtCount(d.interested)} />
            </div>
            {/* Raw counts */}
            <div className="grid grid-cols-6 gap-3">
              <AnalyticsCard label="Emails Sent"  value={fmtCount(d.emails_sent)} />
              <AnalyticsCard label="Opens"        value={fmtCount(d.opens)} />
              <AnalyticsCard label="Replies"      value={fmtCount(d.replies)} />
              <AnalyticsCard label="Clicks"       value={fmtCount(d.clicks)} />
              <AnalyticsCard label="Bounces"      value={fmtCount(d.bounces)} />
              <AnalyticsCard label="Unsubscribes" value={fmtCount(d.unsubscribes)} />
            </div>
          </>
        )}
      </div>

      {/* Contacts table */}
      <div>
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <input
            type="text"
            placeholder="Search by name, email or company…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="text-sm rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none flex-1 min-w-[200px]"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-xs rounded-lg px-3 py-2 text-white focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark', color: '#e2e8f0' }}
          >
            <option value=""               style={{ background: '#0f172a', color: '#e2e8f0' }}>All statuses</option>
            <option value="active"         style={{ background: '#0f172a', color: '#e2e8f0' }}>Active</option>
            <option value="completed"      style={{ background: '#0f172a', color: '#e2e8f0' }}>Completed</option>
            <option value="bounced"        style={{ background: '#0f172a', color: '#e2e8f0' }}>Bounced</option>
            <option value="unsubscribed"   style={{ background: '#0f172a', color: '#e2e8f0' }}>Unsubscribed</option>
            <option value="interested"     style={{ background: '#0f172a', color: '#e2e8f0' }}>Interested</option>
            <option value="not_interested" style={{ background: '#0f172a', color: '#e2e8f0' }}>Not Interested</option>
          </select>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="text-xs px-3 py-2 rounded-lg font-medium disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {exportLoading ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <table className="w-full">
            <thead style={{ background: 'rgba(15,23,42,0.9)' }}>
              <tr>
                {['Name', 'Company', 'Email', 'Status', 'Signed Up', 'Converted', 'Last Activity'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'rgba(10,15,30,0.7)' }}>
              {contactsLoading && [...Array(5)].map((_, i) => <SkeletonRow key={i} />)}

              {!contactsLoading && contacts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: '#64748b' }}>
                    No contacts found
                  </td>
                </tr>
              )}

              {!contactsLoading && contacts.map(c => (
                <tr key={c.campaign_contact_id} className="hover:bg-white/[0.02] transition-colors">
                  <td style={TD}><span className="font-medium text-white">{c.full_name || '—'}</span></td>
                  <td style={{ ...TD, color: '#94a3b8' }}>{c.company_name || '—'}</td>
                  <td style={{ ...TD, color: '#94a3b8', fontSize: '12px' }}>{c.email || '—'}</td>
                  <td style={TD}><EngagementBadge status={c.engagement_status} /></td>
                  <td style={TD}>
                    {c.is_signed_up ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
                        Yes
                      </span>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '12px' }}>—</span>
                    )}
                  </td>
                  <td style={{ ...TD, color: '#64748b', fontSize: '12px' }}>
                    {c.converted_at ? new Date(c.converted_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ ...TD, color: '#64748b', fontSize: '12px' }}>
                    {c.last_activity_at ? new Date(c.last_activity_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* "has more" pagination — API returns plain array with no total */}
        {(page > 1 || hasMore) && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-xs px-4 py-2 rounded-xl font-medium disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              ← Previous
            </button>
            <span className="text-xs" style={{ color: '#64748b' }}>Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="text-xs px-4 py-2 rounded-xl font-medium disabled:opacity-40"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
