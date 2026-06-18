const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };

function fmt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function RecentNotes({ notes = [] }) {
  if (notes.length === 0) return null;

  return (
    <div className="rounded-xl p-4 space-y-2" style={card}>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Recent notes</p>
      <div className="space-y-2">
        {notes.map(note => (
          <div key={note.id} className="flex gap-2">
            {note.pinned && (
              <svg className="shrink-0 mt-0.5 text-yellow-400" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.09 6.26L20 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l5.91-.91z" />
              </svg>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-300 leading-relaxed">{note.body}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{fmt(note.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
