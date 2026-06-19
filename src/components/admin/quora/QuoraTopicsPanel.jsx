import { useState, useEffect, useRef } from 'react';
import {
  fetchQuoraTopics,
  createQuoraTopic,
  deleteQuoraTopic,
  updateQuoraSettings,
} from '../../../api/quora';

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function topicStatus(lastRunAt, cooldownDays) {
  if (!lastRunAt) return { label: 'Never run', available: true };
  const next = new Date(lastRunAt);
  next.setDate(next.getDate() + cooldownDays);
  if (next > new Date()) {
    return { label: `Cooldown · runs ${fmtDate(next)}`, available: false };
  }
  return { label: 'Available', available: true };
}

export default function QuoraTopicsPanel({ token }) {
  const [data, setData]           = useState(null);   // { items, cooldown_days, active_count, max_cooldown }
  const [loading, setLoading]     = useState(true);
  const [fetchErr, setFetchErr]   = useState(null);
  const [newKeyword, setNewKeyword] = useState('');
  const [adding, setAdding]       = useState(false);
  const [addErr, setAddErr]       = useState(null);
  const [cooldownInput, setCooldownInput] = useState(1);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState(null);   // { text, ok }
  const inputRef = useRef(null);

  async function load() {
    setLoading(true);
    setFetchErr(null);
    try {
      const result = await fetchQuoraTopics(token);
      setData(result);
      setCooldownInput(result.cooldown_days);
    } catch (e) {
      setFetchErr(e.detail || e.message || 'Failed to load topics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function handleAdd(e) {
    e.preventDefault();
    const kw = newKeyword.trim();
    if (!kw) return;
    setAdding(true);
    setAddErr(null);
    try {
      await createQuoraTopic(token, kw);
      setNewKeyword('');
      await load();
      inputRef.current?.focus();
    } catch (e) {
      setAddErr(e.detail || e.message || 'Failed to add topic');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteQuoraTopic(token, id);
      await load();
    } catch (e) {
      // ignore — topic may already be inactive
    }
  }

  async function handleSaveCooldown() {
    setSaving(true);
    setSaveMsg(null);
    try {
      await updateQuoraSettings(token, Number(cooldownInput));
      await load();
      setSaveMsg({ text: 'Saved', ok: true });
    } catch (e) {
      setSaveMsg({ text: e.detail || e.message || 'Save failed', ok: false });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        {[0, 1, 2].map(i => (
          <div key={i} className="animate-pulse mb-3 h-12 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)' }} />
        ))}
      </div>
    );
  }

  if (fetchErr) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-red-400 text-sm">{fetchErr}</p>
      </div>
    );
  }

  const activeItems   = (data?.items || []).filter(t => t.is_active);
  const cooldownDays  = data?.cooldown_days ?? 1;
  const maxCooldown   = data?.max_cooldown  ?? 0;
  const cooldownChanged = Number(cooldownInput) !== cooldownDays;
  const cooldownInvalid = Number(cooldownInput) > maxCooldown;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Add topic */}
      <div className="shrink-0 px-6 py-4 border-b border-white/10">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            ref={inputRef}
            value={newKeyword}
            onChange={e => { setNewKeyword(e.target.value); setAddErr(null); }}
            placeholder="Add keyword, e.g. foreclosures florida…"
            disabled={adding}
            className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border:     '1px solid rgba(255,255,255,0.1)',
              color:      '#f1f5f9',
            }}
          />
          <button
            type="submit"
            disabled={adding || !newKeyword.trim()}
            className="px-4 py-2 text-xs font-semibold rounded-lg transition-opacity disabled:opacity-40"
            style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15' }}
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </form>
        {addErr && <p className="mt-1.5 text-xs text-red-400">{addErr}</p>}
      </div>

      {/* Topics list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <p className="text-slate-400 text-sm">No topics yet</p>
            <p className="text-slate-600 text-xs">Add keywords above to start the rotation pool.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {activeItems.map(topic => {
              const status = topicStatus(topic.last_run_at, cooldownDays);
              return (
                <div
                  key={topic.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border:     '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Status dot */}
                  <span
                    className="shrink-0 w-1.5 h-1.5 rounded-full"
                    style={{ background: status.available ? '#4ade80' : '#f59e0b' }}
                  />

                  {/* Keyword */}
                  <span className="flex-1 text-sm text-white truncate">{topic.keyword}</span>

                  {/* Status label */}
                  <span
                    className="shrink-0 text-[10px]"
                    style={{ color: status.available ? '#4ade80' : '#f59e0b' }}
                  >
                    {status.label}
                  </span>

                  {/* Last run */}
                  {topic.last_run_at && (
                    <span className="shrink-0 text-[10px] text-slate-600 hidden sm:block">
                      Last: {fmtDate(topic.last_run_at)}
                    </span>
                  )}

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(topic.id)}
                    title="Remove topic"
                    className="shrink-0 text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cooldown control */}
      <div
        className="shrink-0 px-6 py-4 border-t border-white/10"
        style={{ background: 'rgba(0,0,0,0.2)' }}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-white mb-0.5">Cooldown days</p>
            <p className="text-[10px] text-slate-500">
              {activeItems.length} active topic{activeItems.length !== 1 ? 's' : ''} · max {maxCooldown} day{maxCooldown !== 1 ? 's' : ''}
            </p>
          </div>

          <input
            type="number"
            min={0}
            max={maxCooldown}
            value={cooldownInput}
            onChange={e => { setCooldownInput(e.target.value); setSaveMsg(null); }}
            className="w-16 text-center text-sm px-2 py-1.5 rounded-lg outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border:     `1px solid ${cooldownInvalid ? '#f87171' : 'rgba(255,255,255,0.1)'}`,
              color:      '#f1f5f9',
            }}
          />

          <button
            type="button"
            onClick={handleSaveCooldown}
            disabled={saving || !cooldownChanged || cooldownInvalid}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-opacity disabled:opacity-40"
            style={{ background: 'rgba(250,204,21,0.15)', color: '#facc15' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {cooldownInvalid && (
          <p className="mt-1.5 text-xs text-red-400">
            Max {maxCooldown} days with {activeItems.length} active topic{activeItems.length !== 1 ? 's' : ''}
          </p>
        )}
        {saveMsg && (
          <p className={`mt-1.5 text-xs ${saveMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
            {saveMsg.text}
          </p>
        )}
      </div>
    </div>
  );
}
