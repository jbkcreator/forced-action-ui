/**
 * Subscriber feed — forgot password page (fa061).
 * Mirror of WLForgotPasswordPage using subscriber API.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { subscriberForgotPassword } from '../api/subscriber.js';

export default function SubscriberForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await subscriberForgotPassword(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-fa-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <p className="text-2xl font-extrabold text-fa-text-primary mb-1">
          Forced <span className="text-fa-primary">Action</span>
        </p>
        <h1 className="text-lg font-semibold text-fa-text-secondary mb-6">Reset your password</h1>

        {sent ? (
          <div>
            <p className="text-fa-text-muted mb-6">
              If <strong className="text-fa-text-primary">{email}</strong> is registered,
              a reset link has been sent. Check your inbox.
            </p>
            <Link to="/login" className="text-fa-primary hover:underline text-sm">
              ← Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fa-text-secondary mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full bg-fa-bg-card border border-fa-border-default rounded-lg px-3 py-2 text-fa-text-primary focus:outline-none focus:border-fa-primary"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-fa-primary text-fa-bg-base font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <Link to="/login" className="block text-center text-sm text-fa-text-muted hover:text-fa-text-primary">
              ← Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
