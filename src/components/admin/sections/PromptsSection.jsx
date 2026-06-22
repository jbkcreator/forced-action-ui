import { useState, useEffect, useCallback } from 'react';
import { useAdminContext } from '../adminContext';
import { fetchPromptGraphs, fetchPromptFile, updatePromptFile } from '../../../api/prompts';

// ── Toast ─────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  function show(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }
  return { toast, show };
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

// ── Styles ────────────────────────────────────────────────────────────────────
const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
};

const dimText = { color: '#94a3b8' };

function fileTabStyle(active) {
  return {
    background: active ? 'rgba(250,204,21,0.12)' : 'transparent',
    color: active ? '#facc15' : '#94a3b8',
    border: active ? '1px solid rgba(250,204,21,0.2)' : '1px solid transparent',
  };
}

function graphRowStyle(active) {
  return {
    background: active ? 'rgba(250,204,21,0.06)' : 'transparent',
    borderLeft: active ? '2px solid #facc15' : '2px solid transparent',
    color: active ? '#f1f5f9' : '#94a3b8',
  };
}

// ── Graph list ────────────────────────────────────────────────────────────────
function GraphList({ graphs, selected, onSelect }) {
  if (!graphs.length) {
    return <p className="text-xs px-4 py-6" style={dimText}>No prompt graphs found.</p>;
  }
  return (
    <ul className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      {graphs.map(g => (
        <li key={g.graph}>
          <button
            type="button"
            onClick={() => onSelect(g)}
            className="w-full text-left px-4 py-3 text-sm font-medium transition-all"
            style={graphRowStyle(selected?.graph === g.graph)}
          >
            {g.graph}
            <span className="block text-xs mt-0.5" style={{ color: '#64748b' }}>
              {g.files.join(', ')}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ── Editor panel ──────────────────────────────────────────────────────────────
function EditorPanel({ token, graph }) {
  const [activeFile, setActiveFile] = useState(graph.files[0]);
  const [content, setContent] = useState('');
  const [original, setOriginal] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast, show } = useToast();

  const loadFile = useCallback(async (g, f) => {
    setLoading(true);
    try {
      const res = await fetchPromptFile(token, g, f);
      setContent(res.content);
      setOriginal(res.content);
    } catch (e) {
      show(e.message || 'Failed to load file', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, show]);

  useEffect(() => {
    setActiveFile(graph.files[0]);
    loadFile(graph.graph, graph.files[0]);
  }, [graph.graph]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTabChange(f) {
    setActiveFile(f);
    loadFile(graph.graph, f);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updatePromptFile(token, graph.graph, activeFile, content);
      setOriginal(content);
      show('Saved');
    } catch (e) {
      show(e.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  const isDirty = content !== original;

  return (
    <div className="flex flex-col h-full min-h-0">
      <Toast toast={toast} />

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <h2 className="text-sm font-semibold text-fa-text-primary">{graph.graph}</h2>
          <p className="text-xs mt-0.5" style={dimText}>
            Editing <code className="text-yellow-400">{activeFile}</code>
            {isDirty && <span className="ml-2 text-yellow-500">● unsaved</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
          style={{
            background: isDirty ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.04)',
            color: isDirty ? '#facc15' : '#64748b',
            border: isDirty ? '1px solid rgba(250,204,21,0.25)' : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* File tabs */}
      <div className="shrink-0 flex gap-1 px-6 py-2 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {graph.files.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => handleTabChange(f)}
            className="px-3 py-1.5 rounded-md text-xs font-mono font-medium whitespace-nowrap transition-all"
            style={fileTabStyle(activeFile === f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div className="flex-1 min-h-0 px-6 py-4">
        {loading ? (
          <div className="h-full animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
        ) : (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            spellCheck={false}
            className="w-full h-full resize-none rounded-xl p-4 text-xs font-mono leading-relaxed outline-none focus:ring-1 focus:ring-yellow-500/40"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e2e8f0',
              minHeight: '400px',
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── Root section ──────────────────────────────────────────────────────────────
export default function PromptsSection() {
  const { token } = useAdminContext();
  const [graphs, setGraphs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadingGraphs, setLoadingGraphs] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPromptGraphs(token)
      .then(res => {
        setGraphs(res.graphs || []);
        if (res.graphs?.length) setSelected(res.graphs[0]);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingGraphs(false));
  }, [token]);

  return (
    <div className="flex h-full min-h-0" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Left: graph list */}
      <div
        className="w-56 shrink-0 overflow-y-auto"
        style={{ borderRight: '1px solid rgba(255,255,255,0.07)', ...card }}
      >
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#64748b' }}>
            Cora Graphs
          </h3>
        </div>
        {loadingGraphs ? (
          <div className="p-4 space-y-2">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : error ? (
          <p className="text-xs text-red-400 px-4 py-6">{error}</p>
        ) : (
          <GraphList graphs={graphs} selected={selected} onSelect={setSelected} />
        )}
      </div>

      {/* Right: editor */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {selected ? (
          <EditorPanel token={token} graph={selected} key={selected.graph} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm" style={dimText}>Select a graph to edit its prompts</p>
          </div>
        )}
      </div>
    </div>
  );
}
