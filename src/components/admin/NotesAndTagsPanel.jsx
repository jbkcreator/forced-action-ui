import { useCallback, useEffect, useState } from 'react';
import {
  addSubscriberTag,
  createSubscriberNote,
  deleteSubscriberNote,
  fetchSubscriberNotes,
  fetchSubscriberTags,
  fetchTagSuggestions,
  removeSubscriberTag,
  updateSubscriberNote,
} from '../../api/admin';

const card = { background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)' };
const inputCls = 'rounded-lg px-2 py-1 text-xs bg-white/5 border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-400/40';

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

function TagsBlock({ token, subscriberId }) {
  const [tags, setTags] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [input, setInput] = useState('');
  const [err, setErr] = useState('');

  const reload = useCallback(() => {
    fetchSubscriberTags(token, subscriberId)
      .then(d => setTags(d.items || []))
      .catch(e => setErr(e.detail || e.message));
  }, [token, subscriberId]);

  useEffect(() => {
    if (!subscriberId) return;
    reload();
    fetchTagSuggestions(token).then(d => setSuggestions(d.items || [])).catch(() => {});
  }, [reload, subscriberId, token]);

  async function addTag(tag) {
    const t = (tag || input).trim();
    if (!t) return;
    try {
      await addSubscriberTag(token, subscriberId, t);
      setInput('');
      reload();
    } catch (e) { setErr(e.detail || e.message); }
  }

  async function removeTag(tag) {
    try {
      await removeSubscriberTag(token, subscriberId, tag);
      reload();
    } catch (e) { setErr(e.detail || e.message); }
  }

  const existing = new Set(tags.map(t => t.tag));
  const unused = suggestions.filter(s => !existing.has(s.tag));

  return (
    <div className="rounded-xl p-4 space-y-3" style={card}>
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Tags</p>
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 && <span className="text-xs text-slate-500">No tags.</span>}
        {tags.map(t => (
          <span key={t.id} className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"
            style={{
              background: t.tag === 'do_not_text' ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
              color: t.tag === 'do_not_text' ? '#f87171' : '#a5b4fc',
            }}>
            {t.tag}
            <button type="button" onClick={() => removeTag(t.tag)}
              className="text-slate-500 hover:text-red-400 ml-1" aria-label={`Remove ${t.tag}`}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <input className={inputCls} placeholder="Add tag…" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTag(); }} />
        <button type="button" onClick={() => addTag()}
          className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-900"
          style={{ background: '#facc15' }}>Add</button>
      </div>
      {unused.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide self-center">suggestions:</span>
          {unused.map(s => (
            <button key={s.tag} type="button" onClick={() => addTag(s.tag)}
              className="text-[11px] px-2 py-0.5 rounded-full text-slate-400 hover:text-yellow-300"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              title={s.effect || ''}>
              + {s.label}
            </button>
          ))}
        </div>
      )}
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}

function NotesBlock({ token, subscriberId }) {
  const [notes, setNotes] = useState([]);
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState('');
  const [err, setErr] = useState('');

  const reload = useCallback(() => {
    fetchSubscriberNotes(token, subscriberId)
      .then(d => setNotes(d.items || []))
      .catch(e => setErr(e.detail || e.message));
  }, [token, subscriberId]);

  useEffect(() => { if (subscriberId) reload(); }, [reload, subscriberId]);

  async function submit() {
    if (!body.trim()) return;
    try {
      await createSubscriberNote(token, subscriberId, body.trim(), pinned);
      setBody(''); setPinned(false);
      reload();
    } catch (e) { setErr(e.detail || e.message); }
  }

  async function saveEdit(id) {
    try {
      await updateSubscriberNote(token, id, { body: editBody });
      setEditingId(null); setEditBody('');
      reload();
    } catch (e) { setErr(e.detail || e.message); }
  }

  async function togglePin(n) {
    try {
      await updateSubscriberNote(token, n.id, { pinned: !n.pinned });
      reload();
    } catch (e) { setErr(e.detail || e.message); }
  }

  async function del(id) {
    if (!confirm('Delete this note?')) return;
    try {
      await deleteSubscriberNote(token, id);
      reload();
    } catch (e) { setErr(e.detail || e.message); }
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={card}>
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Notes</p>
      <div className="space-y-2">
        <textarea className={inputCls + ' w-full min-h-[60px]'} placeholder="Add a note…"
          value={body} onChange={e => setBody(e.target.value)} />
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 flex items-center gap-1">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} />
            Pin
          </label>
          <button type="button" onClick={submit}
            className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-900"
            style={{ background: '#facc15' }}>Save Note</button>
        </div>
      </div>
      <div className="space-y-2">
        {notes.length === 0 && <p className="text-xs text-slate-500">No notes yet.</p>}
        {notes.map(n => (
          <div key={n.id} className="rounded-lg p-3 space-y-2"
            style={{ background: n.pinned ? 'rgba(250,204,21,0.06)' : 'rgba(255,255,255,0.03)',
                     border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] text-slate-500 flex gap-2">
                <span>{n.author_email}</span>
                <span>·</span>
                <span>{fmt(n.created_at)}</span>
                {n.pinned && <span className="text-yellow-400">📌 PINNED</span>}
              </div>
              <div className="flex gap-1 text-[10px]">
                <button onClick={() => togglePin(n)} className="text-slate-400 hover:text-yellow-300">
                  {n.pinned ? 'Unpin' : 'Pin'}
                </button>
                <span className="text-slate-700">|</span>
                <button onClick={() => { setEditingId(n.id); setEditBody(n.body); }}
                  className="text-slate-400 hover:text-yellow-300">Edit</button>
                <span className="text-slate-700">|</span>
                <button onClick={() => del(n.id)} className="text-slate-400 hover:text-red-400">Delete</button>
              </div>
            </div>
            {editingId === n.id ? (
              <div className="space-y-2">
                <textarea className={inputCls + ' w-full min-h-[60px]'} value={editBody}
                  onChange={e => setEditBody(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(n.id)}
                    className="px-2 py-0.5 rounded text-xs text-slate-900"
                    style={{ background: '#facc15' }}>Save</button>
                  <button onClick={() => { setEditingId(null); setEditBody(''); }}
                    className="px-2 py-0.5 rounded text-xs text-slate-400">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-200 whitespace-pre-wrap">{n.body}</div>
            )}
          </div>
        ))}
      </div>
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}

export default function NotesAndTagsPanel({ token, subscriberId }) {
  return (
    <div className="space-y-4">
      <TagsBlock token={token} subscriberId={subscriberId} />
      <NotesBlock token={token} subscriberId={subscriberId} />
    </div>
  );
}
