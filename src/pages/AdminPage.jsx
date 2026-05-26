import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import LoginCard from '../components/admin/LoginCard';
import AdminSidebar from '../components/admin/AdminSidebar';
import { AdminContext } from '../components/admin/adminContext';
import { fetchCounties } from '../api/admin';

const TOKEN_KEY = 'admin_token';

function AuthenticatedShell({ token, onLogout }) {
  return (
    <AdminContext.Provider value={{ token, onLogout }}>
      <div
        className="min-h-screen flex flex-col"
        style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)' }}
      >
        {/* Sticky header — logo + sign out only */}
        <header
          className="sticky top-0 z-50 w-full shrink-0"
          style={{
            background: 'rgba(10,15,30,0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-slate-900"
                style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
              >
                FA
              </div>
              <div>
                <p className="font-bold text-white leading-none text-sm">Forced Action</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Admin</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Body: sidebar + section content */}
        <div className="flex flex-1 min-h-0">
          <AdminSidebar />
          <main className="flex-1 min-w-0 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return undefined;
    const controller = new AbortController();
    fetchCounties(stored, false, { signal: controller.signal })
      .catch(err => {
        if (err.name === 'AbortError') return;
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      });
    return () => controller.abort();
  }, []);

  function handleLogin(t) {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  }
  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  if (token) return <AuthenticatedShell token={token} onLogout={handleLogout} />;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #0a0f1e 100%)' }}
    >
      <LoginCard onLogin={handleLogin} />
    </div>
  );
}
