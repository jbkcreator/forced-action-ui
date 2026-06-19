import QuoraQueueRow from './QuoraQueueRow';

function Shimmer() {
  return (
    <div className="animate-pulse px-4 py-3 border-b border-white/5">
      <div className="h-3.5 w-5/6 bg-white/5 rounded mb-2" />
      <div className="h-3 w-1/3 bg-white/5 rounded" />
    </div>
  );
}

export default function QuoraQueueList({ items, loading, error, selectedId, onSelect, onRefresh }) {
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div>
          <p className="text-xs font-semibold text-white uppercase tracking-wide">Answer Queue</p>
          {!loading && !error && (
            <p className="text-[10px] text-slate-500 mt-0.5">
              {items.length} draft{items.length !== 1 ? 's' : ''} ready
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh queue"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && [0, 1, 2, 3].map(i => <Shimmer key={i} />)}

        {!loading && error && (
          <div className="px-4 py-6 text-center">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-slate-400 text-sm">No drafts in queue</p>
            <p className="text-slate-600 text-xs mt-1">Run the orchestrator to generate answers.</p>
          </div>
        )}

        {!loading && !error && items.map(item => (
          <QuoraQueueRow
            key={item.id}
            item={item}
            selected={selectedId === item.id}
            onClick={() => onSelect(item)}
          />
        ))}
      </div>
    </div>
  );
}
