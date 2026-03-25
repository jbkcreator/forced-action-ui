import { useState } from 'react';
import { useLanding } from './LandingContext';
import { submitWaitlist } from '../../api/landing';

export default function WaitlistForm({ zip }) {
  const { selectedVertical, countyId } = useLanding();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(null);

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setMsg({ type: 'error', text: 'Please enter your name and email.' });
      return;
    }

    try {
      await submitWaitlist({ zipCode: zip, vertical: selectedVertical, countyId, name: name.trim(), email: email.trim() });
      setMsg({ type: 'success', text: `✓ You're on the waitlist for ZIP ${zip}. We'll email you when it opens.` });
      setName('');
      setEmail('');
    } catch {
      setMsg({ type: 'error', text: 'Could not join waitlist. Please try again.' });
    }
  }

  return (
    <section className="max-w-6xl mx-auto px-6 pb-6">
      <div className="glass-card rounded-2xl p-8 max-w-xl mx-auto">
        <h3 className="text-lg font-bold mb-1 text-center">Get Notified When This ZIP Opens</h3>
        <p className="text-slate-400 text-sm text-center mb-6">
          Join the waitlist — we'll email you the moment this territory becomes available.
        </p>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40 transition"
          />
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400/40 transition"
          />
          <button onClick={handleSubmit} className="btn-primary w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3.5 rounded-xl">
            Join Waitlist
          </button>
        </div>
        {msg && (
          <p className={`mt-4 text-sm text-center ${msg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {msg.text}
          </p>
        )}
      </div>
    </section>
  );
}
