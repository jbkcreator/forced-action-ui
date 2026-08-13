import { useState } from 'react';
import DealRoomGenerator from '../components/demo/DealRoomGenerator';

const STORAGE_KEY = 'fa_demo_passcode';

function PasscodeGate({ onUnlock }) {
  const [value, setValue] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const pass = value.trim();
    if (pass) onUnlock(pass);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-fa-bg-base px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl p-6 bg-white/[0.04] border border-white/[0.08]"
      >
        <h1 className="text-lg font-bold text-white mb-1">Deal Room Demo</h1>
        <p className="text-sm text-slate-500 mb-5">Enter the demo passcode to continue.</p>
        <input
          type="password"
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
          placeholder="Passcode"
          className="w-full text-sm text-slate-200 rounded-lg px-3 py-2.5 outline-none bg-white/5 border border-white/10 mb-4"
        />
        <button
          type="submit"
          className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}

export default function DemoDealRoomPage() {
  const [passcode, setPasscode] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '');

  function unlock(pass) {
    sessionStorage.setItem(STORAGE_KEY, pass);
    setPasscode(pass);
  }

  function lock() {
    sessionStorage.removeItem(STORAGE_KEY);
    setPasscode('');
  }

  if (!passcode) return <PasscodeGate onUnlock={unlock} />;

  return (
    <div className="min-h-screen bg-fa-bg-base">
      <DealRoomGenerator passcode={passcode} onUnauthorized={lock} />
    </div>
  );
}
