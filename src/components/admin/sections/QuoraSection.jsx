import { useState, useRef, useCallback } from 'react';
import { useAdminContext } from '../adminContext';
import usePolling from '../../../hooks/usePolling';
import { fetchQuoraQueue, fetchQuoraPosted } from '../../../api/quora';
import QuoraQueueList from '../quora/QuoraQueueList';
import QuoraAnswerPanel from '../quora/QuoraAnswerPanel';
import QuoraTopicsPanel from '../quora/QuoraTopicsPanel';
import QuoraBrowserStream from '../QuoraBrowserStream';

// ── Inline toast ──────────────────────────────────────────────────────────────
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

// ── Posted answers list ───────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function laneLabel(lane) {
  if (!lane) return 'General';
  return lane.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function PostedAnswersList({ items, loading, error }) {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        {[0, 1, 2].map(i => (
          <div key={i} className="animate-pulse mb-3 p-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="h-3.5 w-3/4 bg-white/5 rounded mb-2" />
            <div className="h-3 w-1/3 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <p className="text-slate-400 text-sm">No posted answers yet</p>
        <p className="text-slate-600 text-xs">Posts will appear here after a successful submission.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex flex-col gap-3">
        {items.map(item => (
          <div
            key={item.id}
            className="p-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-white leading-snug flex-1">{item.title}</p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                title="View answer on Quora"
                className="shrink-0 text-slate-500 hover:text-yellow-400 transition-colors mt-0.5"
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(250,204,21,0.12)', color: '#facc15' }}>
                {laneLabel(item.intent_lane)}
              </span>
              {item.matched_keyword && (
                <span className="text-[10px] text-slate-500">{item.matched_keyword}</span>
              )}
              <span className="text-[10px] text-slate-600 ml-auto">{fmtDate(item.published_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function QuoraSection() {
  const { token } = useAdminContext();
  const { toast, showToast } = useToast();
  const [tab, setTab] = useState('queue'); // 'queue' | 'posted' | 'topics' | 'auth'

  // ── Draft queue ───────────────────────────────────────────────────────────
  const queueFetcher = useCallback(
    (signal) => fetchQuoraQueue(token, 1, { signal }),
    [token]
  );
  const { data: queueData, error: queueErr, refetch } = usePolling(queueFetcher, 30000, [token]);

  const queueLoading = queueData === null && !queueErr;
  const [localItems, setLocalItems] = useState(null);
  const queueItems = localItems ?? queueData?.items ?? [];

  function handleRefresh() {
    setLocalItems(null);
    refetch?.();
  }

  // ── Posted answers ────────────────────────────────────────────────────────
  const postedFetcher = useCallback(
    (signal) => fetchQuoraPosted(token, 1, { signal }),
    [token]
  );
  const { data: postedData, error: postedErr } = usePolling(postedFetcher, 60000, [token]);
  const postedLoading = postedData === null && !postedErr;
  const postedItems = postedData?.items ?? [];

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selectedItem, setSelectedItem] = useState(null);

  function selectItem(item) {
    const current = (localItems ?? queueData?.items ?? []).find(i => i.id === item.id) || item;
    setSelectedItem(current);
  }

  function handlePosted(id) {
    setLocalItems(prev => (prev ?? queueData?.items ?? []).filter(i => i.id !== id));
    setSelectedItem(null);
    setTab('posted');
  }

  function handleDraftSaved(id, newMarkdown) {
    function applyUpdate(items) {
      return items.map(i => {
        if (i.id !== id) return i;
        return { ...i, answer_draft: { ...(i.answer_draft || {}), answer_markdown: newMarkdown } };
      });
    }
    setLocalItems(prev => applyUpdate(prev ?? queueData?.items ?? []));
    setSelectedItem(prev => {
      if (!prev || prev.id !== id) return prev;
      return { ...prev, answer_draft: { ...(prev.answer_draft || {}), answer_markdown: newMarkdown } };
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab bar */}
      <div className="shrink-0 flex items-center gap-1 px-5 pt-4 pb-0 border-b border-white/10">
        {[
          { key: 'queue',  label: 'Draft Queue',    count: queueItems.length },
          { key: 'posted', label: 'Posted Answers', count: postedItems.length },
          { key: 'topics', label: 'Topics',          count: 0 },
          { key: 'auth',   label: 'Auth Session',    count: 0 },
        ].map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="px-4 py-2 text-xs font-medium transition-all rounded-t-lg -mb-px"
            style={{
              color:       tab === t.key ? '#facc15' : '#94a3b8',
              borderBottom: tab === t.key ? '2px solid #facc15' : '2px solid transparent',
              background:  tab === t.key ? 'rgba(250,204,21,0.05)' : 'transparent',
            }}
          >
            {t.label}
            {t.count > 0 && t.key !== 'topics' && (
              <span className="ml-1.5 text-[10px] tabular-nums opacity-70">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'queue' && (
        <div className="flex flex-1 min-h-0">
          {/* Panel 1 — Queue list */}
          <div className="w-[320px] shrink-0 border-r border-white/10 overflow-hidden flex flex-col">
            <QuoraQueueList
              items={queueItems}
              loading={queueLoading}
              error={queueErr?.detail || queueErr?.message || (queueErr ? 'Failed to load queue' : null)}
              selectedId={selectedItem?.id}
              onSelect={selectItem}
              onRefresh={handleRefresh}
            />
          </div>

          {/* Panel 2 — Answer draft + post */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            <QuoraAnswerPanel
              item={selectedItem}
              token={token}
              onPosted={handlePosted}
              onDraftSaved={handleDraftSaved}
              showToast={showToast}
            />
          </div>
        </div>
      )}

      {tab === 'posted' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="shrink-0 px-6 py-3 border-b border-white/10 flex items-center justify-between">
            <p className="text-xs font-semibold text-white uppercase tracking-wide">Posted Answers</p>
            <p className="text-[10px] text-slate-500">{postedItems.length} answer{postedItems.length !== 1 ? 's' : ''}</p>
          </div>
          <PostedAnswersList
            items={postedItems}
            loading={postedLoading}
            error={postedErr?.detail || postedErr?.message || (postedErr ? 'Failed to load' : null)}
          />
        </div>
      )}

      {tab === 'topics' && (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="shrink-0 px-6 py-3 border-b border-white/10">
            <p className="text-xs font-semibold text-white uppercase tracking-wide">Topic Rotation Pool</p>
          </div>
          <QuoraTopicsPanel token={token} />
        </div>
      )}

      {tab === 'auth' && (
        <div className="flex-1 overflow-y-auto p-6">
          <QuoraBrowserStream token={token} />
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
