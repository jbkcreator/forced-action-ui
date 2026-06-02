import { useState, useEffect } from 'react';
import { fetchCampaignSummary } from '../../api/emailCampaigns';
import CampaignListView from './email-campaigns/CampaignListView';
import CampaignDetailView from './email-campaigns/CampaignDetailView';
import CreateEmailCampaignModal from './email-campaigns/CreateEmailCampaignModal';
import EditCampaignModal from './email-campaigns/EditCampaignModal';

// ─── Summary widget (F7) ─────────────────────────────────────────────────────

function SummaryCard({ label, value, sub }) {
  return (
    <div
      className="flex-1 rounded-xl p-4"
      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{sub}</p>}
    </div>
  );
}

function CampaignSummaryWidget({ token }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetchCampaignSummary(token, { signal: controller.signal })
      .then(setSummary)
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [token]);

  const s = summary || {};
  const openPct  = s.avg_open_rate_30d  != null ? (s.avg_open_rate_30d  * 100).toFixed(1) : null;
  const replyPct = s.avg_reply_rate_30d != null ? (s.avg_reply_rate_30d * 100).toFixed(1) : null;

  return (
    <div className="flex gap-3 mb-6">
      <SummaryCard
        label="Active Campaigns"
        value={loading ? '—' : (s.active_campaigns ?? 0)}
      />
      <SummaryCard
        label="Total Contractors"
        value={loading ? '—' : (s.total_contractors ?? 0).toLocaleString()}
      />
      <SummaryCard
        label="Open Rate (30d)"
        value={loading ? '—' : (openPct != null ? `${openPct}%` : '—')}
      />
      <SummaryCard
        label="Reply Rate (30d)"
        value={loading ? '—' : (replyPct != null ? `${replyPct}%` : '—')}
      />
    </div>
  );
}

// ─── Orchestrator ────────────────────────────────────────────────────────────

export default function EmailCampaignsDashboard({ token }) {
  const [view, setView]                   = useState('list');
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget]       = useState(null); // campaign id being edited
  const [listKey, setListKey]             = useState(0);

  function openDetail(campaign) {
    setActiveCampaign(campaign);
    setView('detail');
  }

  function backToList() {
    setActiveCampaign(null);
    setView('list');
  }

  function onCampaignCreated() {
    setShowCreateModal(false);
    setListKey(k => k + 1);
  }

  function onEditClick(campaign) {
    setEditTarget(campaign.id ?? campaign);
  }

  function onEditSaved() {
    setEditTarget(null);
    setListKey(k => k + 1);
    // If editing while in detail view, go back to list so user sees updated data
    if (view === 'detail') backToList();
  }

  return (
    <div>
      <CampaignSummaryWidget token={token} />

      {view === 'list' && (
        <CampaignListView
          key={listKey}
          token={token}
          onOpenDetail={openDetail}
          onCreateClick={() => setShowCreateModal(true)}
          onEditClick={onEditClick}
        />
      )}

      {view === 'detail' && activeCampaign && (
        <CampaignDetailView
          token={token}
          campaign={activeCampaign}
          onBack={backToList}
          onEditClick={onEditClick}
        />
      )}

      {showCreateModal && (
        <CreateEmailCampaignModal
          token={token}
          onClose={() => setShowCreateModal(false)}
          onCreated={onCampaignCreated}
        />
      )}

      {editTarget != null && (
        <EditCampaignModal
          token={token}
          campaignId={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={onEditSaved}
        />
      )}
    </div>
  );
}
