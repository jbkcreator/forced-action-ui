import { useState, useRef, useCallback } from 'react';
import { useAdminContext } from '../adminContext';
import usePolling from '../../../hooks/usePolling';
import {
  fetchCloserQueue,
  fetchProspectDetail,
  fetchProspectCalls,
} from '../../../api/closer';
import CloserQueueList from '../closer/CloserQueueList';
import ProspectDetail from '../closer/ProspectDetail';
import ContactPanel from '../closer/ContactPanel';

// ── Inline toast ─────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 4000);
  }
  return { toast, showToast };
}

function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div
      role={isErr ? 'alert' : 'status'}
      className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl text-sm shadow-lg ${
        isErr
          ? 'text-red-400 bg-red-950/90 border border-red-800/60'
          : 'text-emerald-400 bg-emerald-950/90 border border-emerald-800/60'
      }`}
    >
      {toast.msg}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CloserSection() {
  const { token } = useAdminContext();
  const { toast, showToast } = useToast();

  // ── Queue (polled every 30s) ──────────────────────────────────────────────
  const fetcher = useCallback(
    (signal) => fetchCloserQueue(token, { signal }),
    [token]
  );
  const { data: queueData, error: queueErr, refetch } = usePolling(fetcher, 30000, [token]);

  // Derive directly from usePolling — no extra state layer
  const queueLoading = queueData === null && !queueErr;
  const [localItems, setLocalItems] = useState(null); // optimistic removals only
  const queueItems = localItems ?? queueData?.items ?? [];

  function handleRefresh() {
    setLocalItems(null);
    refetch?.();
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selectedItem, setSelectedItem] = useState(null);
  const [detail, setDetail] = useState(null);
  const [callItems, setCallItems] = useState([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [callsError, setCallsError] = useState('');

  function selectItem(item) {
    setSelectedItem(item);
    setDetail(null);
    setCallItems([]);
    setCallsError('');
    fetchProspectDetail(token, item.subscriber_id).then(setDetail).catch(() => {});
    setCallsLoading(true);
    fetchProspectCalls(token, item.subscriber_id)
      .then(d => setCallItems(d?.items || []))
      .catch(e => setCallsError(e.detail || e.message || 'Failed to load calls'))
      .finally(() => setCallsLoading(false));
  }

  function handleOutcomeSuccess(escalationId) {
    setLocalItems(prev => (prev ?? queueData?.items ?? []).filter(i => i.id !== escalationId));
    setSelectedItem(null);
    setDetail(null);
    setCallItems([]);
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Panel 1 — Queue list */}
      <div className="w-[280px] shrink-0 border-r border-white/10 overflow-hidden flex flex-col">
        <CloserQueueList
          items={queueItems}
          loading={queueLoading}
          error={queueErr?.detail || queueErr?.message || (queueErr ? 'Failed to load queue' : null)}
          selectedId={selectedItem?.id}
          onSelect={selectItem}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Panel 2 — Prospect detail */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <ProspectDetail
          queueItem={selectedItem}
          detail={detail}
          calls={callItems}
          callsLoading={callsLoading}
          callsError={callsError}
        />
      </div>

      {/* Panel 3 — Contact + Aircall */}
      <div className="w-[400px] shrink-0 border-l border-white/10 overflow-hidden flex flex-col">
        <ContactPanel
          token={token}
          queueItem={selectedItem}
          onOutcomeSuccess={handleOutcomeSuccess}
          showToast={showToast}
        />
      </div>

      <Toast toast={toast} />
    </div>
  );
}
