/**
 * Subscriber feed login page (fa061).
 *
 * Dual mode:
 *   /dashboard/:feedUuid/login  — uuid-mode: UUID comes from the route param,
 *                                 subscriber only needs to enter their password.
 *   /login                      — email-mode: subscriber enters email + password.
 *
 * On success navigates to /dashboard/:feedUuid.
 * Shows "forgot password" link pointing at /forgot-password.
 */

import { useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import useSubscriberAuth from '../hooks/useSubscriberAuth.js';

export default function SubscriberLoginPage() {
  const { feedUuid } = useParams();          // present only on /dashboard/:feedUuid/login
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useSubscriberAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const isUuidMode = Boolean(feedUuid);
  const resetSuccess = searchParams.get('reset') === '1';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login({ email: isUuidMode ? undefined : email, feedUuid, password });
      navigate(`/dashboard/${data.feed_uuid}`);
    } catch (err) {
      setError('Invalid credentials. Check your password or use Forgot password below.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-fa-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <p className="text-2xl font-extrabold text-fa-text-primary mb-1">
          Forced <span className="text-fa-primary">Action</span>
        </p>
        <h1 className="text-lg font-semibold text-fa-text-secondary mb-6">
          {isUuidMode ? 'Enter your feed password' : 'Sign in to your feed'}
        </h1>

        {resetSuccess && (
          <p className="mb-4 text-emerald-400 text-sm bg-emerald-900/20 border border-emerald-800 rounded px-3 py-2">
            Password updated — you can now sign in with your new password.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isUuidMode && (
            <div>
              <label className="block text-sm font-medium text-fa-text-secondary mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-fa-text-secondary mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              autoFocus={isUuidMode}
              className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fa-primary text-fa-bg-base font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-fa-primary text-sm hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
