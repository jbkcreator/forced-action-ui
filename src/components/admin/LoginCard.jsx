import { useState } from 'react';
import { adminLogin } from '../../api/admin';

const TOKEN_KEY = 'admin_token';

export default function LoginCard({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = await adminLogin(username, password);
      localStorage.setItem(TOKEN_KEY, token);
      onLogin(token);
    } catch (err) {
      setError(err.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-2.5 mb-8">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm text-slate-900"
          style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
        >
          FA
        </div>
        <div>
          <p className="font-bold text-white leading-none">Forced Action</p>
          <p className="text-xs text-slate-500 mt-0.5">Admin</p>
        </div>
      </div>

      <div
        className="rounded-2xl p-7"
        style={{
          background: 'rgba(15,23,42,0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        <h1 className="text-lg font-semibold text-white mb-1">Sign in</h1>
        <p className="text-slate-400 text-sm mb-6">Admin access only</p>

        {error && (
          <div role="alert" className="mb-4 text-sm text-red-400 bg-red-950/60 border border-red-800/60 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-username" className="block text-xs text-slate-400 mb-1.5">Username</label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              placeholder="admin"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-xs text-slate-400 mb-1.5">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-slate-900 transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
