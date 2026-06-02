import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../api/client.js';

export default function WLVerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  // Guard against React StrictMode's double-invocation of effects in dev, which
  // would fire the verify request twice — the second call would hit an
  // already-consumed token and surface a false "failed" state.
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    apiRequest(`/api/wl/auth/verify-email/${token}`)
      .then(data => { setStatus('success'); setMessage(data.message); })
      .catch(err => { setStatus('error'); setMessage(err?.message || 'Verification failed or link expired.'); });
  }, [token]);

  return (
    <div className="min-h-screen bg-fa-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin w-8 h-8 border-2 border-fa-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-fa-text-muted">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-fa-text-primary mb-2">Email verified!</h1>
            <p className="text-fa-text-muted mb-6">{message}</p>
            <Link to="/wl/login" className="inline-block bg-fa-primary text-fa-bg-base font-bold px-6 py-2.5 rounded-lg hover:opacity-90">
              Go to login
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-fa-text-primary mb-2">Verification failed</h1>
            <p className="text-red-400 mb-6">{message}</p>
            <Link to="/wl/login" className="text-fa-primary hover:underline text-sm">← Back to login</Link>
          </>
        )}
      </div>
    </div>
  );
}
