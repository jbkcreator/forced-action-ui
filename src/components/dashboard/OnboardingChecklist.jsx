import { useState } from 'react';
import Icon from '../ui/Icon';

const STORAGE_KEY = 'fa_onboarding_dismissed';

const STEPS = [
  { icon: 'search', text: 'Browse your lead feed below' },
  { icon: 'chart-bar', text: 'Click a lead to see property details' },
  { icon: 'phone', text: 'Unlock contact info for hot leads' },
];

export default function OnboardingChecklist({ totalLeads }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });

  if (dismissed || (totalLeads && totalLeads > 10)) return null;

  function dismiss() {
    setDismissed(true);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  }

  return (
    <div className="glass-strong rounded-2xl p-6 mb-6 animate-in relative">
      <button
        onClick={dismiss}
        className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
        aria-label="Dismiss"
      >
        <Icon name="x-mark" size={18} />
      </button>
      <h3 className="font-bold text-base mb-4">Welcome! Here's how to get started</h3>
      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0">
              <span className="text-yellow-400 font-bold text-sm">{i + 1}</span>
            </div>
            <span className="text-sm text-slate-300">{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
