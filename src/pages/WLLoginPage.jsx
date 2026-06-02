import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useWhiteLabelAuth from '../hooks/useWhiteLabelAuth.js';

export default function WLLoginPage() {
  const { login } = useWhiteLabelAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/wl/dashboard/leads');
    } catch (err) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-fa-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-fa-text-primary mb-2">Sign in to your account</h1>
        <p className="text-fa-text-muted text-sm mb-8">
          Forced Action White-label Platform
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fa-text-secondary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
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

        <div className="mt-4 flex justify-between text-sm">
          <Link to="/wl/forgot-password" className="text-fa-primary hover:underline">
            Forgot password?
          </Link>
          <Link to="/wl/signup" className="text-fa-text-muted hover:text-fa-text-primary">
            Create account →
          </Link>
        </div>
      </div>
    </div>
  );
}
