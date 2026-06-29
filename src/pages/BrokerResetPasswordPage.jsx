import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { brokerResetPassword } from '../api/broker.js';

export default function BrokerResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await brokerResetPassword(token, password);
      navigate('/broker/login?reset=1');
    } catch (err) {
      setError(err?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-fa-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-fa-text-primary mb-2">Set new password</h1>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-fa-text-secondary mb-1">New password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fa-text-secondary mb-1">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fa-primary text-fa-bg-base font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Updating…' : 'Set password'}
          </button>
          <Link to="/broker/login" className="block text-center text-sm text-fa-text-muted hover:text-fa-text-primary">← Back to login</Link>
        </form>
      </div>
    </div>
  );
}
