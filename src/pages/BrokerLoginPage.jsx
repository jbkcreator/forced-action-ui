import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import useBrokerAuth from '../hooks/useBrokerAuth.js';

export default function BrokerLoginPage() {
  const { login } = useBrokerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetSuccess = searchParams.get('reset') === '1';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/broker/lanes');
    } catch (err) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-fa-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm text-slate-900"
            style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
          >
            FA
          </div>
          <div>
            <p className="font-bold text-fa-text-primary leading-none text-sm">Forced Action</p>
            <p className="text-[10px] text-fa-text-muted mt-0.5">Broker Portal</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-fa-text-primary mb-1">Sign in</h1>
        <p className="text-fa-text-muted text-sm mb-8">Access your assigned lanes and commissions.</p>

        {resetSuccess && (
          <div className="mb-4 text-emerald-400 text-sm bg-emerald-900/20 border border-emerald-800 rounded-lg px-3 py-2">
            Password updated — please sign in with your new password.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fa-text-secondary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fa-text-secondary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fa-primary text-fa-bg-base font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 text-sm">
          <Link to="/broker/forgot-password" className="text-fa-primary hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
