import Icon from '../ui/Icon';

export default function DisputeBanner({ disputedAt }) {
  const date = disputedAt
    ? new Date(disputedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <section className="mb-6 rounded-xl border border-red-400/30 bg-gradient-to-br from-red-500/5 to-orange-500/5 p-5">
      <div className="flex items-start gap-3">
        <Icon name="warning" size={18} className="text-red-400 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-white font-semibold text-base leading-snug">Account on hold</h3>
          <p className="text-slate-300 text-sm mt-1">
            A payment dispute was opened on your account. Purchases and wallet top-ups are paused.
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Contact{' '}
            <a href="mailto:support@forcedaction.io" className="text-fa-accent-gold hover:underline">
              support@forcedaction.io
            </a>{' '}
            to resolve.
            {date && <span className="ml-1 text-slate-500">· Since {date}</span>}
          </p>
        </div>
      </div>
    </section>
  );
}
