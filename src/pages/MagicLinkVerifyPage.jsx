/**
 * Magic-link verification page (fa061 passwordless).
 * Route: /auth/verify?token=...
 * Exchanges the one-time token for a session, then auto-continues to the
 * dashboard after a short delay, with a manual "Continue to feed" button
 * as an immediate fallback.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import useSubscriberAuth from '../hooks/useSubscriberAuth.js';

const AUTO_REDIRECT_MS = 1500;

export default function MagicLinkVerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { verifyMagicLink } = useSubscriberAuth();

  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');
  const [feedUuid, setFeedUuid] = useState(null);
  // Guard against React StrictMode's double-invocation of effects in dev,
  // which would fire the verify request twice — the token is single-use, so
  // the second call would hit an already-consumed token and surface a false
  // "failed" state.
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!token) {
      setStatus('error');
      setMessage('This link is missing a token. Request a new magic link.');
      return;
    }

    verifyMagicLink(token)
      .then(data => {
        setStatus('success');
        setFeedUuid(data.feed_uuid);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err?.detail || err?.message || 'This link is invalid, expired, or already used.');
      });
  }, [token, verifyMagicLink]);

  useEffect(() => {
    if (status !== 'success' || !feedUuid) return;
    const timer = setTimeout(() => {
      navigate(`/dashboard/${feedUuid}`);
    }, AUTO_REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [status, feedUuid, navigate]);

  return (
    <div className="min-h-screen bg-fa-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {status === 'verifying' && (<>
          <div className="animate-spin w-8 h-8 border-2 border-fa-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-fa-text-muted">Signing you in…</p>
        </>)}
        {status === 'success' && (<>
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-fa-text-primary mb-2">You're signed in!</h1>
          <p className="text-fa-text-muted mb-6">Redirecting you to your feed…</p>
          <button
            type="button"
            onClick={() => navigate(`/dashboard/${feedUuid}`)}
            className="inline-block bg-fa-primary text-fa-bg-base font-bold px-6 py-2.5 rounded-lg hover:opacity-90"
          >
            Continue to feed
          </button>
        </>)}
        {status === 'error' && (<>
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-fa-text-primary mb-2">Link didn't work</h1>
          <p className="text-red-400 mb-6">{message}</p>
          <Link to="/login" className="text-fa-primary hover:underline text-sm">← Back to login</Link>
        </>)}
      </div>
    </div>
  );
}
