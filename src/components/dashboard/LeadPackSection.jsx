import { useState } from 'react';

export default function LeadPackSection({ onOpenModal }) {
  const [zipInput, setZipInput] = useState('');

  return (
    <div className="mt-12 border-t border-white/10 pt-10 animate-in">
      <div className="lead-pack-card p-5 sm:p-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">$99</span>
          <div>
            <p className="text-sm font-semibold text-white">Need leads outside your territory?</p>
            <p className="text-xs text-slate-400">5 exclusive leads · 72h exclusivity</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            maxLength={5}
            placeholder="ZIP code"
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onOpenModal(zipInput.trim())}
            className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/50 text-sm transition"
          />
          <button
            onClick={() => onOpenModal(zipInput.trim())}
            className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-lg shadow-yellow-400/20 whitespace-nowrap"
          >
            Get Leads
          </button>
        </div>
      </div>
    </div>
  );
}
