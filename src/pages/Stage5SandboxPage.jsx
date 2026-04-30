/**
 * Stage 5 Sandbox — manual end-to-end exerciser for every Stage 5 endpoint.
 *
 * Enter a feed UUID at the top, then click the buttons in each section to
 * fire the underlying API. Each section shows the raw JSON response (or
 * structured error) so you can verify the wiring without seeding data
 * through a real funnel.
 *
 * Route: /stage5-sandbox  (no auth — local dev / Stripe-test only)
 */
import { useEffect, useState } from 'react';
import {
  purchasePremium,
  upgradeTier,
  acceptAnnual,
  fetchProofWall,
  fetchTeamView,
  fetchLeaderboard,
  winGraphicUrl,
} from '../api/stage5';
import { captureDeal } from '../api/phase2b';
import PremiumCreditsModal from '../components/dashboard/PremiumCreditsModal';
import BundleOfferModal from '../components/dashboard/BundleOfferModal';
import AnnualOfferBanner from '../components/dashboard/AnnualOfferBanner';
import APProUpsellBanner from '../components/dashboard/APProUpsellBanner';
import TeamViewTile from '../components/dashboard/TeamViewTile';
import LeaderboardWidget from '../components/dashboard/LeaderboardWidget';


const STORAGE_KEY = 'fa_stage5_feed_uuid';
const PROP_STORAGE_KEY = 'fa_stage5_property_id';


function ResponseBox({ result, error }) {
  if (!result && !error) return null;
  return (
    <pre
      className={
        'mt-3 max-h-64 overflow-auto rounded-md p-3 text-[11px] font-mono leading-snug ' +
        (error
          ? 'bg-red-500/10 border border-red-400/30 text-red-200'
          : 'bg-emerald-500/10 border border-emerald-400/30 text-emerald-200')
      }
    >
      {error ? JSON.stringify(error, null, 2) : JSON.stringify(result, null, 2)}
    </pre>
  );
}


function Section({ title, hint, children }) {
  return (
    <section className="mb-6 rounded-xl border border-white/10 bg-slate-900/60 p-5">
      <h3 className="text-white font-semibold text-base">{title}</h3>
      {hint && <p className="text-slate-400 text-xs mt-1">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}


function Btn({ children, onClick, variant = 'default', disabled }) {
  const cls = {
    default: 'bg-white/5 border border-white/15 text-slate-200 hover:bg-white/10',
    primary: 'cta-primary',
    danger:  'bg-red-500/15 border border-red-400/40 text-red-200 hover:bg-red-500/25',
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-xs px-3 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${cls}`}
    >
      {children}
    </button>
  );
}


function useApiCall() {
  const [state, setState] = useState({ result: null, error: null, loading: false });
  const run = async (fn) => {
    setState({ result: null, error: null, loading: true });
    try {
      const result = await fn();
      setState({ result, error: null, loading: false });
    } catch (err) {
      setState({ result: null, error: err, loading: false });
    }
  };
  return [state, run];
}


export default function Stage5SandboxPage() {
  const [feedUuid, setFeedUuid] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [propertyId, setPropertyId] = useState(() => localStorage.getItem(PROP_STORAGE_KEY) || '');
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [bundleOpen, setBundleOpen] = useState(null);   // { type, variant }
  const [showAnnualBanner, setShowAnnualBanner] = useState(false);
  const [showApProBanner, setShowApProBanner] = useState(false);

  const [premiumCall, runPremium] = useApiCall();
  const [annualCall, runAnnual] = useApiCall();
  const [upgradeCall, runUpgrade] = useApiCall();
  const [dealCall, runDeal] = useApiCall();
  const [proofCall, runProof] = useApiCall();
  const [teamCall, runTeam] = useApiCall();
  const [boardCall, runBoard] = useApiCall();

  useEffect(() => {
    if (feedUuid) localStorage.setItem(STORAGE_KEY, feedUuid);
  }, [feedUuid]);

  useEffect(() => {
    if (propertyId) localStorage.setItem(PROP_STORAGE_KEY, propertyId);
  }, [propertyId]);

  const propIdInt = propertyId ? parseInt(propertyId, 10) || null : null;
  const need = !feedUuid;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight">Stage 5 Sandbox</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manual exerciser for every Stage 5 surface. Local dev only.
          </p>
        </header>

        {/* Identity inputs */}
        <Section
          title="1. Subscriber identity"
          hint="Paste a feed UUID from any active subscriber. Property ID is required for premium SKUs (report/brief/transfer) and deal capture."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-slate-400">Feed UUID</span>
              <input
                type="text"
                value={feedUuid}
                onChange={e => setFeedUuid(e.target.value.trim())}
                placeholder="abc123-..."
                className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:border-yellow-400/60 focus:outline-none font-mono text-xs"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400">Property ID</span>
              <input
                type="number"
                value={propertyId}
                onChange={e => setPropertyId(e.target.value)}
                placeholder="e.g. 12345"
                className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-white placeholder:text-slate-500 focus:border-yellow-400/60 focus:outline-none font-mono text-xs"
              />
            </label>
          </div>
          {need && (
            <p className="mt-3 text-amber-300 text-xs">Enter a feed UUID to enable the buttons below.</p>
          )}
        </Section>

        {/* 1. Premium credits */}
        <Section
          title="2. Premium Credits"
          hint="Modal: pick SKU + payment mode. Direct calls: hit each SKU on the credits path inline."
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <Btn variant="primary" onClick={() => setPremiumOpen(true)} disabled={need}>
              Open premium modal
            </Btn>
            <Btn
              onClick={() => runPremium(() => purchasePremium({
                feedUuid, sku: 'report', paymentMode: 'credits', propertyId: propIdInt,
              }))}
              disabled={need || !propIdInt}
            >
              report (3cr)
            </Btn>
            <Btn
              onClick={() => runPremium(() => purchasePremium({
                feedUuid, sku: 'brief', paymentMode: 'credits', propertyId: propIdInt,
              }))}
              disabled={need || !propIdInt}
            >
              brief (5cr)
            </Btn>
            <Btn
              onClick={() => runPremium(() => purchasePremium({
                feedUuid, sku: 'transfer', paymentMode: 'credits', propertyId: propIdInt,
              }))}
              disabled={need || !propIdInt}
            >
              transfer (26cr)
            </Btn>
            <Btn
              onClick={() => runPremium(() => purchasePremium({
                feedUuid, sku: 'byol', paymentMode: 'credits',
                targetAddress: '123 Sandbox St, Tampa FL 33601',
              }))}
              disabled={need}
            >
              byol (2cr)
            </Btn>
            <Btn
              onClick={() => runPremium(() => purchasePremium({
                feedUuid, sku: 'report', paymentMode: 'card', propertyId: propIdInt,
              }))}
              disabled={need || !propIdInt}
            >
              report — card path
            </Btn>
          </div>
          <ResponseBox result={premiumCall.result} error={premiumCall.error} />
        </Section>

        {/* 2. Annual + AP Pro */}
        <Section
          title="3. Annual + AutoPilot Pro"
          hint="Banner toggles render the actual dashboard component inline. Direct calls fire the endpoint without UI."
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <Btn variant="primary" onClick={() => setShowAnnualBanner(s => !s)} disabled={need}>
              {showAnnualBanner ? 'Hide' : 'Show'} annual banner
            </Btn>
            <Btn variant="primary" onClick={() => setShowApProBanner(s => !s)} disabled={need}>
              {showApProBanner ? 'Hide' : 'Show'} AP Pro banner
            </Btn>
            <Btn
              onClick={() => runAnnual(() => acceptAnnual({ feedUuid }))}
              disabled={need}
            >
              POST /api/annual/accept
            </Btn>
            <Btn
              onClick={() => runUpgrade(() => upgradeTier({ feedUuid, tier: 'autopilot_pro' }))}
              disabled={need}
            >
              POST /api/upgrade autopilot_pro
            </Btn>
            <Btn
              onClick={() => runUpgrade(() => upgradeTier({ feedUuid, tier: 'autopilot_lite' }))}
              disabled={need}
            >
              POST /api/upgrade autopilot_lite
            </Btn>
          </div>
          {showAnnualBanner && (
            <div className="mt-3">
              <AnnualOfferBanner feedUuid={feedUuid} onAccepted={() => setShowAnnualBanner(false)} onDismiss={() => setShowAnnualBanner(false)} />
            </div>
          )}
          {showApProBanner && (
            <div className="mt-3">
              <APProUpsellBanner feedUuid={feedUuid} onUpgraded={() => setShowApProBanner(false)} onDismiss={() => setShowApProBanner(false)} />
            </div>
          )}
          <ResponseBox result={annualCall.result || upgradeCall.result} error={annualCall.error || upgradeCall.error} />
        </Section>

        {/* 3. Bundles */}
        <Section
          title="4. Bundles"
          hint="Modal opens with the variant's pricing baked in. Variant 'b' is illustrative (frontend) — the backend is source of truth for the actual charge."
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <Btn variant="primary" onClick={() => setBundleOpen({ type: 'weekend', variant: 'a' })} disabled={need}>
              Weekend / A ($19)
            </Btn>
            <Btn onClick={() => setBundleOpen({ type: 'weekend', variant: 'b' })} disabled={need}>
              Weekend / B ($22)
            </Btn>
            <Btn variant="primary" onClick={() => setBundleOpen({ type: 'storm', variant: 'a' })} disabled={need}>
              Storm / A ($39)
            </Btn>
            <Btn onClick={() => setBundleOpen({ type: 'storm', variant: 'b' })} disabled={need}>
              Storm / B ($45)
            </Btn>
            <Btn variant="primary" onClick={() => setBundleOpen({ type: 'zip_booster', variant: 'a' })} disabled={need}>
              ZIP Booster / A ($29)
            </Btn>
            <Btn onClick={() => setBundleOpen({ type: 'zip_booster', variant: 'b' })} disabled={need}>
              ZIP Booster / B ($34)
            </Btn>
            <Btn variant="primary" onClick={() => setBundleOpen({ type: 'monthly_reload', variant: 'a' })} disabled={need}>
              Monthly Reload / A ($89)
            </Btn>
            <Btn onClick={() => setBundleOpen({ type: 'monthly_reload', variant: 'b' })} disabled={need}>
              Monthly Reload / B ($79)
            </Btn>
          </div>
        </Section>

        {/* 4. Deal capture */}
        <Section
          title="5. Deal Capture (incl. graphic + annual)"
          hint="Big buckets ($10K+) fire the annual offer inline on the response. Skip-bucket deals do NOT generate a graphic."
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <Btn
              onClick={() => runDeal(() => captureDeal({
                feedUuid, bucket: 'skip', propertyId: propIdInt,
              }))}
              disabled={need}
            >
              skip (no graphic, no annual)
            </Btn>
            <Btn
              onClick={() => runDeal(() => captureDeal({
                feedUuid, bucket: '5_10k', dealAmount: 7500, propertyId: propIdInt,
              }))}
              disabled={need || !propIdInt}
            >
              $5–10K (graphic, no annual)
            </Btn>
            <Btn
              variant="primary"
              onClick={() => runDeal(() => captureDeal({
                feedUuid, bucket: '10_25k', dealAmount: 15000, propertyId: propIdInt,
              }))}
              disabled={need || !propIdInt}
            >
              $10–25K (graphic + annual)
            </Btn>
            <Btn
              variant="primary"
              onClick={() => runDeal(() => captureDeal({
                feedUuid, bucket: '25k_plus', dealAmount: 42000, propertyId: propIdInt,
              }))}
              disabled={need || !propIdInt}
            >
              $25K+ (graphic + annual)
            </Btn>
          </div>
          {dealCall.result?.graphic_url && (
            <div className="mt-3 rounded-lg border border-white/10 p-3">
              <p className="text-xs text-slate-400 mb-2">Win graphic preview:</p>
              <img
                src={`${import.meta.env.VITE_API_BASE_URL || ''}${dealCall.result.graphic_url}`}
                alt="Win graphic"
                className="max-w-full rounded-md"
                style={{ maxHeight: 240 }}
              />
            </div>
          )}
          <ResponseBox result={dealCall.result} error={dealCall.error} />
        </Section>

        {/* 5. Public surfaces */}
        <Section title="6. Public surfaces" hint="No auth required.">
          <div className="flex flex-wrap gap-2 mb-3">
            <Btn variant="primary" onClick={() => runProof(() => fetchProofWall({ limit: 12 }))}>
              GET /api/proof-wall
            </Btn>
            <Btn variant="primary" onClick={() => runBoard(() => fetchLeaderboard({}))}>
              GET /api/leaderboard
            </Btn>
            <Btn onClick={() => runBoard(() => fetchLeaderboard({ countyId: 'hillsborough', vertical: 'roofing' }))}>
              Leaderboard — Hillsborough/Roofing
            </Btn>
          </div>
          <ResponseBox result={proofCall.result || boardCall.result} error={proofCall.error || boardCall.error} />
        </Section>

        {/* 6. Team view */}
        <Section title="7. Referral team" hint="Returns unlocked=false until 3 same-county/vertical referrals are confirmed for this subscriber.">
          <div className="flex flex-wrap gap-2 mb-3">
            <Btn variant="primary" onClick={() => runTeam(() => fetchTeamView(feedUuid))} disabled={need}>
              GET /api/feed/{`{uuid}`}/team-view
            </Btn>
          </div>
          {feedUuid && <TeamViewTile feedUuid={feedUuid} />}
          <ResponseBox result={teamCall.result} error={teamCall.error} />
        </Section>

        {/* 7. Leaderboard widget preview */}
        <Section title="8. Leaderboard widget preview" hint="Renders the actual dashboard component. Empty if no referrals exist this week.">
          <LeaderboardWidget countyId="hillsborough" vertical="roofing" />
        </Section>

        {/* Modals */}
        <PremiumCreditsModal
          isOpen={premiumOpen}
          feedUuid={feedUuid}
          propertyId={propIdInt}
          propertyAddress={propIdInt ? `Property #${propIdInt}` : null}
          walletBalance={50}
          onClose={() => setPremiumOpen(false)}
          onSuccess={(res) => { setPremiumOpen(false); }}
        />
        <BundleOfferModal
          isOpen={!!bundleOpen}
          feedUuid={feedUuid}
          bundleType={bundleOpen?.type}
          variant={bundleOpen?.variant}
          countyId="hillsborough"
          vertical="roofing"
          onClose={() => setBundleOpen(null)}
          onSuccess={() => setBundleOpen(null)}
        />
      </div>
    </div>
  );
}
