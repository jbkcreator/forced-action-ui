import { useCallback, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useApi from '../hooks/useApi';
import { fetchFeed } from '../api/dashboard';
import { acceptAnnual, upgradeTier, openBillingPortal } from '../api/account';
import Navbar from '../components/layout/Navbar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import Icon from '../components/ui/Icon';

const TIER_LABEL = {
  free: 'Free',
  starter_founding: 'Starter (Founding)',
  starter_regular: 'Starter',
  pro_founding: 'Pro (Founding)',
  pro_regular: 'Pro',
  dominator_founding: 'Dominator (Founding)',
  dominator_regular: 'Dominator',
  wallet_starter: 'Wallet Starter',
  wallet_growth: 'Wallet Growth',
  wallet_power: 'Wallet Power',
  data_only: 'Data-Only',
  autopilot_lite: 'AutoPilot Lite',
  autopilot_pro: 'AutoPilot Pro',
  partner: 'Partner',
  annual_lock: 'Annual Lock',
};

const SMS_COMMANDS = [
  ['BALANCE', 'Reply with your remaining wallet credits.'],
  ['LOCK', 'Lock your current ZIP territory ($197/mo).'],
  ['BOOST', 'Activate the ZIP Booster bundle ($29).'],
  ['AUTO ON', 'Enable Auto Mode (skip-trace + first text + 24h voicemail follow-up).'],
  ['AUTO OFF', 'Disable Auto Mode.'],
  ['PAUSE', 'Pause your subscription for 60 days.'],
  ['TOPUP', 'Get a one-tap wallet top-up link.'],
  ['REPORT', 'Send the latest lead summary to your phone.'],
  ['YEARLY', 'Accept the pending annual offer.'],
  ['SAVE CARD', 'Get a payment-sheet link to save a card on file.'],
];

function Tile({ title, subtitle, children, action }) {
  return (
    <section
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(15,23,42,0.8)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="text-white font-semibold text-base">{title}</h2>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between py-2 border-t border-white/[0.06] first:border-t-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm font-medium ${accent || 'text-slate-200'}`}>{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { feedUuid } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi(
    (signal) => fetchFeed(feedUuid, { page: 1, pageSize: 1, signal }),
    [feedUuid],
  );

  const subscriber = data?.subscriber || {};
  const tierLabel = TIER_LABEL[subscriber.tier] || subscriber.tier || '—';

  const [annualState, setAnnualState] = useState({ submitting: false, error: null, done: false });
  const [proState, setProState] = useState({ submitting: false, error: null, done: false });
  const [portalState, setPortalState] = useState({ submitting: false, error: null });
  const [confirmAnnual, setConfirmAnnual] = useState(false);
  const [confirmPro, setConfirmPro] = useState(false);

  const onAnnual = useCallback(async () => {
    if (annualState.submitting) return;
    setConfirmAnnual(false);
    setAnnualState({ submitting: true, error: null, done: false });
    try {
      await acceptAnnual({ feedUuid });
      setAnnualState({ submitting: false, error: null, done: true });
      refetch();
    } catch (err) {
      setAnnualState({ submitting: false, error: err?.detail || err?.message || 'Could not switch.', done: false });
    }
  }, [feedUuid, annualState.submitting, refetch]);

  const onPro = useCallback(async () => {
    if (proState.submitting) return;
    setConfirmPro(false);
    setProState({ submitting: true, error: null, done: false });
    try {
      await upgradeTier({ feedUuid, tier: 'autopilot_pro' });
      setProState({ submitting: false, error: null, done: true });
      refetch();
    } catch (err) {
      setProState({ submitting: false, error: err?.detail || err?.message || 'Upgrade failed.', done: false });
    }
  }, [feedUuid, proState.submitting, refetch]);

  const onPortal = useCallback(async () => {
    if (portalState.submitting) return;
    setPortalState({ submitting: true, error: null });
    try {
      const { url } = await openBillingPortal(feedUuid);
      window.location.href = url;
    } catch (err) {
      setPortalState({ submitting: false, error: err?.detail || err?.message || 'Unable to open billing portal.' });
    }
  }, [feedUuid, portalState.submitting]);

  const isAnnual = subscriber.tier === 'annual_lock';
  const isPro = subscriber.tier === 'autopilot_pro';

  return (
    <div className="gradient-bg-dashboard min-h-screen text-white">
      <div className="relative z-[1]">
        <Navbar variant="dashboard">
          <Link
            to={`/dashboard/${feedUuid}`}
            className="text-sm text-slate-400 hover:text-white transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            ← Back to leads
          </Link>
        </Navbar>

        <main id="main-content" className="max-w-4xl mx-auto px-6 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
            <p className="text-slate-400 text-sm mt-2">Manage your subscription, billing, and SMS commands.</p>
          </header>

          {loading && <LoadingSpinner />}
          {error && <ErrorState />}

          {!loading && !error && subscriber.id && (
            <div className="space-y-5">
              <Tile
                title="Subscription"
                subtitle="Your current plan and one-tap upgrades."
                action={
                  subscriber.founding_member && (
                    <span className="text-xs font-semibold bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 px-3 py-1 rounded-full">
                      Founding member
                    </span>
                  )
                }
              >
                <StatRow label="Plan" value={tierLabel} accent="text-yellow-300" />
                <StatRow label="Status" value={(subscriber.status || 'active').toUpperCase()} />

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Annual lock — confirm before committing */}
                  {!confirmAnnual ? (
                    <button
                      type="button"
                      onClick={() => !isAnnual && !annualState.done && !annualState.submitting && setConfirmAnnual(true)}
                      disabled={isAnnual || annualState.submitting || annualState.done}
                      aria-live="polite"
                      className="rounded-xl px-4 py-3 text-sm font-bold text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
                    >
                      {isAnnual ? 'On annual lock' : annualState.done ? 'Switched ✓' : annualState.submitting ? 'Switching…' : 'Switch to annual — save 2 months'}
                    </button>
                  ) : (
                    <div className="rounded-xl p-3 border border-yellow-400/30 bg-yellow-400/5 space-y-2">
                      <p className="text-xs text-yellow-300 font-medium">This charges your saved card at the annual rate and cannot be undone from the app. Continue?</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={onAnnual} className="flex-1 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}>Yes, switch</button>
                        <button type="button" onClick={() => setConfirmAnnual(false)} className="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10">Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* AutoPilot Pro — confirm before committing */}
                  {!confirmPro ? (
                    <button
                      type="button"
                      onClick={() => !isPro && !isAnnual && !proState.done && !proState.submitting && setConfirmPro(true)}
                      disabled={isPro || isAnnual || proState.submitting || proState.done}
                      aria-live="polite"
                      className="rounded-xl px-4 py-3 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: 'linear-gradient(135deg, #a855f7, #d946ef)' }}
                    >
                      {isPro ? 'On AutoPilot Pro' : proState.done ? 'Upgraded ✓' : proState.submitting ? 'Upgrading…' : 'Upgrade to AutoPilot Pro'}
                    </button>
                  ) : (
                    <div className="rounded-xl p-3 border border-purple-400/30 bg-purple-400/5 space-y-2">
                      <p className="text-xs text-purple-300 font-medium">Upgrades to AutoPilot Pro ($497/mo) via your saved card immediately. Continue?</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={onPro} className="flex-1 rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #a855f7, #d946ef)' }}>Yes, upgrade</button>
                        <button type="button" onClick={() => setConfirmPro(false)} className="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 bg-white/5 border border-white/10">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
                {annualState.error && <p className="text-red-300 text-xs mt-3">{annualState.error}</p>}
                {proState.error && <p className="text-red-300 text-xs mt-3">{proState.error}</p>}
              </Tile>

              <Tile title="Billing" subtitle="Stripe billing portal — update card, view invoices, or cancel.">
                <StatRow
                  label="Card on file"
                  value={subscriber.has_saved_card ? 'Yes' : 'None saved'}
                  accent={subscriber.has_saved_card ? 'text-emerald-300' : 'text-slate-400'}
                />
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={onPortal}
                    disabled={portalState.submitting}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }}
                  >
                    {portalState.submitting ? 'Opening…' : 'Manage in Stripe portal →'}
                  </button>
                  {portalState.error && <p className="text-red-300 text-xs mt-2">{portalState.error}</p>}
                </div>
              </Tile>

              {subscriber.wallet_balance != null && (
                <Tile title="Wallet Credits" subtitle="Credits for skip-trace and premium lead SKUs.">
                  <StatRow
                    label="Balance"
                    value={`${subscriber.wallet_balance} credits`}
                    accent="text-emerald-300"
                  />
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/${feedUuid}?wallet=topup`)}
                      className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
                    >
                      Top up wallet →
                    </button>
                  </div>
                </Tile>
              )}

              <Tile
                title="Auto Mode"
                subtitle="Cora handles skip-trace + first SMS + 24h voicemail on every new lead."
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                      subscriber.auto_mode_enabled
                        ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    <Icon name={subscriber.auto_mode_enabled ? 'check' : 'circle'} size={12} />
                    {subscriber.auto_mode_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-4">
                  Toggle by texting <code className="px-1.5 py-0.5 rounded bg-white/5 text-slate-200">AUTO ON</code> or{' '}
                  <code className="px-1.5 py-0.5 rounded bg-white/5 text-slate-200">AUTO OFF</code> to your Forced Action number.
                </p>
              </Tile>

              <Tile
                title="SMS commands"
                subtitle="Text any of these to your Forced Action number for one-tap actions."
              >
                <ul className="divide-y divide-white/[0.06]">
                  {SMS_COMMANDS.map(([cmd, desc]) => (
                    <li key={cmd} className="py-2.5 flex items-start gap-4">
                      <code className="px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-300 text-xs font-bold whitespace-nowrap shrink-0">
                        {cmd}
                      </code>
                      <span className="text-xs text-slate-400 leading-relaxed">{desc}</span>
                    </li>
                  ))}
                </ul>
              </Tile>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
