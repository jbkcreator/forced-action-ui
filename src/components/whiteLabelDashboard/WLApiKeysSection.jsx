import { useState } from 'react';
import useApi from '../../hooks/useApi.js';
import { wlGetApiKeys, wlCreateApiKey, wlRevokeApiKey } from '../../api/whiteLabelClient.js';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';
import Modal from '../ui/Modal.jsx';

export default function WLApiKeysSection() {
  const { data: keys, loading, error, refetch } = useApi(wlGetApiKeys, []);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [generatedKey, setGeneratedKey] = useState(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    if (!newKeyLabel.trim()) return;
    setCreating(true);
    try {
      const res = await wlCreateApiKey(newKeyLabel.trim());
      setGeneratedKey(res.key);
      setNewKeyLabel('');
      refetch();
    } catch (err) {
      alert(err?.message || 'Failed to create key');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(keyId) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      await wlRevokeApiKey(keyId);
      refetch();
    } catch (err) {
      alert(err?.message || 'Failed to revoke key');
    }
  }

  function copyKey() {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-fa-text-primary">API Keys</h2>
          <p className="text-fa-text-muted text-sm">Use X-API-Key header to authenticate programmatic requests.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="bg-fa-primary text-fa-bg-base font-bold px-4 py-2 rounded-lg text-sm hover:opacity-90">
          + Generate Key
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Generated key modal */}
      {generatedKey && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-6">
          <p className="text-green-400 font-bold text-sm mb-2">✓ New API key generated — save it now, you won't see it again:</p>
          <div className="flex gap-2 items-center">
            <code className="flex-1 bg-fa-bg-base rounded px-3 py-2 text-xs font-mono text-fa-text-primary break-all">
              {generatedKey}
            </code>
            <button onClick={copyKey} className="bg-fa-bg-card border border-fa-border-default text-fa-text-secondary px-3 py-2 rounded text-xs hover:bg-fa-bg-base">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <button onClick={() => setGeneratedKey(null)} className="text-xs text-fa-text-muted mt-2 hover:text-fa-text-secondary">
            I've saved it, dismiss
          </button>
        </div>
      )}

      {/* Keys table */}
      <div className="bg-fa-bg-card border border-fa-border-default rounded-lg overflow-hidden">
        {(!keys || keys.length === 0) ? (
          <div className="py-12 text-center text-fa-text-muted">No API keys. Generate one to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fa-border-default bg-fa-bg-base">
                <th className="px-4 py-3 text-left text-fa-text-muted font-medium">Label</th>
                <th className="px-4 py-3 text-left text-fa-text-muted font-medium">Key prefix</th>
                <th className="px-4 py-3 text-right text-fa-text-muted font-medium">Today</th>
                <th className="px-4 py-3 text-right text-fa-text-muted font-medium">Total</th>
                <th className="px-4 py-3 text-left text-fa-text-muted font-medium">Last used</th>
                <th className="px-4 py-3 text-left text-fa-text-muted font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className="border-b border-fa-border-default hover:bg-fa-bg-base/40">
                  <td className="px-4 py-2.5 text-fa-text-primary font-medium">{k.label}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-fa-text-muted">{k.key_prefix}…</td>
                  <td className="px-4 py-2.5 text-right text-fa-text-secondary">{k.requests_today.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-fa-text-secondary">{k.total_requests.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-fa-text-muted text-xs">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-2.5">
                    {k.is_active
                      ? <span className="text-green-400 text-xs font-bold">Active</span>
                      : <span className="text-fa-text-muted text-xs">Revoked</span>
                    }
                  </td>
                  <td className="px-4 py-2.5">
                    {k.is_active && (
                      <button onClick={() => handleRevoke(k.id)} className="text-red-400 text-xs hover:underline">Revoke</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create key modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <div className="p-6 w-80">
            <h3 className="text-lg font-bold text-fa-text-primary mb-4">Generate API Key</h3>
            <label className="block text-sm font-medium text-fa-text-secondary mb-1">Label</label>
            <input value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} placeholder="e.g. Production"
              className="w-full bg-fa-bg-base border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary mb-4 focus:outline-none focus:border-fa-primary" />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 border border-fa-border-default text-fa-text-secondary py-2 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={async () => { await handleCreate(); setShowCreate(false); }} disabled={creating || !newKeyLabel.trim()}
                className="flex-1 bg-fa-primary text-fa-bg-base font-bold py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
                {creating ? 'Creating…' : 'Generate'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
