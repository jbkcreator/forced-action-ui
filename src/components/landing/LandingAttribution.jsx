/**
 * fa017 — small "Welcome from X" badge shown when the visitor arrived via
 * a recognised channel (DBPR email / Cora SMS / missed call / referral).
 *
 * Reassures the visitor the link worked + gives QA a visible signal that
 * URL attribution propagated correctly. Renders null for direct /
 * landing_page visitors so the landing page looks the same as before.
 */
import { useLanding } from './LandingContext';

const SOURCE_LABELS = {
  dbpr_email:   'DBPR email',
  cora_sms:     'Cora SMS',
  missed_call:  'your missed call',
  referral:     'a referral',
};

export default function LandingAttribution() {
  const { attribution } = useLanding();
  const source = attribution?.signupSource;
  const label = SOURCE_LABELS[source];
  if (!label) return null;

  return (
    <div
      data-testid="landing-attribution"
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      Welcome from {label}
    </div>
  );
}
