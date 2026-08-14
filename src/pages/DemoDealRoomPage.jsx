import { useState } from 'react';
import DealRoomGenerator from '../components/demo/DealRoomGenerator';
import { demoLogin } from '../api/dealRoom';

const STORAGE_KEY = 'fa_demo_token';

function LoginGate({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { access_token } = await demoLogin(email.trim(), password);
      onLogin(access_token);
    } catch (err) {
      setError(err?.status === 401 ? 'Invalid email or password.' : (err?.detail || 'Login failed.'));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full text-sm text-slate-200 rounded-lg px-3 py-2.5 outline-none bg-white/5 border border-white/10 mb-3';

  return (
    <div className="min-h-screen flex items-center justify-center bg-fa-bg-base px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl p-6 bg-white/[0.04] border border-white/[0.08]"
      >
        <h1 className="text-lg font-bold text-white mb-1">Deal Room Demo</h1>
        <p className="text-sm text-slate-500 mb-5">Sign in to continue.</p>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoFocus
          required
          placeholder="Email"
          className={inputClass}
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="Password"
          className={inputClass}
        />
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default function DemoDealRoomPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '');

  function login(tok) {
    sessionStorage.setItem(STORAGE_KEY, tok);
    setToken(tok);
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken('');
  }

  if (!token) return <LoginGate onLogin={login} />;

  return (
    <div className="min-h-screen bg-fa-bg-base">
      <DealRoomGenerator token={token} onUnauthorized={logout} />
    </div>
  );
}
