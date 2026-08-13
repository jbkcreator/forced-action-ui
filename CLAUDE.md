# CLAUDE.md

Guidance for Claude Code working in this repo.

## Project Overview

**Forced Action UI** — React 19 SPA frontend for the Forced Action distressed property intelligence platform (Hillsborough County, FL). Serves 6 buyer verticals (Roofing, Restoration, Public Adjusters, Wholesalers, Fix & Flip, Attorneys). Backed by FastAPI server on port 8000 (separate `Forced-action-` repo). Bundled with Vite, styled with Tailwind via theme-token CSS variables.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server at http://localhost:5173
npm run build      # Build to dist/
npm run preview    # Preview production build
```

No test runner is configured. No linter/formatter is configured.

## Environment Variables

Copy `.env.example` to `.env` and set:
- `VITE_API_BASE_URL` — Backend base URL (empty string in dev; Vite proxy handles `/api/*` and `/webhooks/*` → `http://localhost:8000`)
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `VITE_META_PIXEL_ID` — Meta Pixel ID for client-side retargeting (`src/utils/metaPixel.js`); unset = pixel no-ops. Matches the `META_PIXEL_ID` already used by the backend's server-side CAPI integration.

## Architecture

### Routes (`src/App.jsx`)

| Path | Page | Notes |
|------|------|-------|
| `/` | `LandingPage` | Public — founding counter, ZIP check, pricing, Stripe checkout |
| `/login` | `SubscriberLoginPage` | Email magic-link (default) or password login (fa061) |
| `/dashboard/:feedUuid/login` | `SubscriberLoginPage` | UUID-mode login — password only (fa061) |
| `/forgot-password` | `SubscriberForgotPasswordPage` | Emailed reset link (fa061) |
| `/reset-password/:token` | `SubscriberResetPasswordPage` | Set new password via token (fa061) |
| `/auth/verify` | `MagicLinkVerifyPage` | Exchanges emailed `?token=` for a session (fa061 passwordless) |
| `/dashboard/:feedUuid` | `DashboardPage` | Token-gated (fa061); redirects to login if no valid JWT |
| `/dashboard/:feedUuid/demo` | `DemoModePage` | Live Demo Mode (3g+3h+3i) — closer-only full-screen demo; auto-redirect on `is_demo` login |
| `/success` | `SuccessPage` | Post-checkout; reads `?tier=&zips=` query params |
| `/bankruptcy-alerts/success` | `BankruptcyAlertSuccessPage` | Post-checkout for Bankruptcy Filing Alerts ($297/mo); reads `?session_id=` (Stripe `{CHECKOUT_SESSION_ID}`, dynamic per session) |
| `/email-previews` | `EmailPreviewsPage` | Dev tool — preview transactional email templates |
| `/admin` | `AdminPage` | Admin upload / ops surface; sub-sections via `?tab=` |
| `/admin/subscribers` | SubscribersSection | Queue + All tabs (fa045 — operator CRM). Hot Subscriber Queue = at-risk (RSS≥60 ∧ cool>7d). |
| `/admin/subscribers/:id` | SubscriberDetailPage | 4 tabs: Revenue Signal, Conversation, Deals, Notes & Tags |
| `/admin/lifecycle?tab=timeline&subscriber=<id>` | LifecycleSection → LifecycleTimelineDashboard | Per-subscriber Lifecycle touch timeline |
| `/admin/closer` | CloserSection | Closer Cockpit — full-height 3-panel workspace; Aircall V2 SDK; Lifecycle-escalated prospect queue |
| `/admin/quora` | QuoraSection | Quora Answers — review drafted answers, edit, post via Playwright (S6) |
| `*` | `NotFoundPage` | |

`SkipLink` (`src/components/ui/SkipLink.jsx`) renders above routes for a11y.

### Theme System

All visual tokens in `src/config/theme.json` — single source of truth for colors, gradients, fonts, border radius. `src/theme/ThemeProvider.jsx` flattens JSON to CSS custom properties on `:root` under `--fa-*` namespace. `tailwind.config.js` maps Tailwind utilities to those vars (e.g. `bg-fa-bg-base`, `text-fa-text-primary`, `border-fa-border-default`). **To retheme, edit only `theme.json`.**

### State Management

No state library. React hooks only:

- **URL params** (`useFeedFilters`) — Dashboard filter state (sort, min_score, incident_type, search, page) lives in URL → bookmarkable.
- **localStorage** (`useContacted`) — Contacted property IDs under key `fa_contacted`.
- **React Context** (`LandingContext`) — Selected `vertical` and `countyId` shared across landing components.
- **`useApi`** — Generic fetch hook → `{ data, loading, error, refetch }`.
- **`usePolling`** — Polls an API fn at configurable interval (default 30s).

### API Layer (`src/api/`)

All requests go through `src/api/client.js` (`apiRequest`, `api.get`, `api.post`). Dev server proxies `/api/*` and `/webhooks/*` → `http://localhost:8001`. Domain modules:
- `landing.js` — Founding summary, ZIP check, checkout, waitlist.
- `dashboard.js` — Lead feed, stats, lead packs, hot lead unlock.
- `phase2b.js` — Phase 2B (Lifecycle agent) endpoints.
- `admin.js` — Admin endpoints incl. `fetchLifecycleTimeline(token, subscriberId, opts)` → per-subscriber Lifecycle touch timeline.
- `closer.js` — Closer Cockpit endpoints: queue, prospect detail/conversation/calls, dial-time correlation, feedback, recording, escalation outcome. `USE_MOCK=true` flag at top for local dev (delete mock block before push).
- `quora.js` — Quora Answers (S6): `fetchQuoraQueue`, `updateQuoraDraft`, `postQuoraAnswer`. Uses same `adminFetch` JWT pattern as `closer.js`.
- `chat.js` — Concierge Chat (M5a): `createSession`, `sendMessage`, `streamTurn` (EventSource), `linkSession`, `escalateSession`.
- `subscriber.js` — Subscriber feed auth (fa061 + magic-link): `subscriberLogin`, `subscriberRequestMagicLink`, `subscriberVerifyMagicLink`, `subscriberForgotPassword`, `subscriberResetPassword`, `subHeaders`, `withSubRefresh`, `decodeSubToken`. Token stored in `localStorage.sub_access_token`.
- `demo.js` — Live Demo Mode (3g+3h+3i): `fetchZipReveal`, `prepareCall`, `revealLead`. Auth via `feed_uuid` param.

### Stripe Integration

- **Landing checkout** (`useStripeCheckout`) — Embedded checkout via `stripe.initEmbeddedCheckout(client_secret)`; on completion → `/success?tier=&zips=`.
- **Lead pack purchases** (`useStripePayment`) — PaymentElement flow, steps `choose → payment → success`.

### Component Layout (`src/components/`)
- `common/` — shared cross-page primitives
- `concierge/` — Concierge Chat widget: `ConciergeChat`, `ChatBubble`, `ChatDrawer`, `ChatFullScreen`, `ChatBody`, `MessageBubble`. Mounted on `LandingPage` (pre_signup mode) and `DashboardPage` (post_signup mode). Hook: `useConciergeChat` in `src/hooks/`.
- `dashboard/` — lead feed, filters, lead cards
- `landing/` — hero, pricing, ZIP check, founding counter
- `layout/` — page chrome (header/footer/nav)
- `ui/` — design-system primitives (`SkipLink`, buttons, inputs)

### Key Config Files (`src/config/`)
- `theme.json` — visual tokens (only place to edit theme).
- `constants.js` — vertical labels/icons, distress tag colors, trust stats.
- `pricing.js` — Tier pricing (Starter/Pro/Dominator), ZIP limits, feature lists.
- `closerOptions.js` — Closer Cockpit feedback enums: OBJECTION_TYPES, PITCH_VARIANTS, RATING_SCALE, OUTCOME_OPTIONS. Must stay in sync with `config/closer.py` on backend.
- `src/data/emailTemplates.js` — 9 transactional email templates (HTML strings); preview at `/email-previews`.

## Tooling Rules (strict)

- **Build**: Vite 6. No CRA, no webpack configs.
- **Framework**: React 19 + react-dom. Use function components + hooks; no class components.
- **Routing**: react-router-dom v7. Define routes only in `src/App.jsx`.
- **Styling**: Tailwind CSS 3 via `--fa-*` CSS vars. Do not hard-code hex colors in JSX/CSS — reference Tailwind tokens or `var(--fa-*)`.
- **Theme edits**: change `src/config/theme.json` only. Never edit generated CSS vars by hand.
- **Stripe**: `@stripe/stripe-js` + `@stripe/react-stripe-js`. Use `useStripeCheckout` for landing flow, `useStripePayment` for lead packs — do not call `loadStripe` ad-hoc in components.
- **HTTP**: Always go through `src/api/client.js`. No raw `fetch`/`axios` in components.
- **State**: hooks only. Do not introduce Redux, Zustand, MobX, or React Query without an explicit decision recorded here.
- **File ext**: components `.jsx`, plain modules `.js`. ESM only (`"type": "module"`).
- **Dev port**: 5173 (Vite). API proxy target: 8000.
- **Aliases**: none configured — use relative imports.
- **Tests**: none configured. If adding, use Vitest (matches Vite) and update this file.

## Important Notes

- Backend lives in sibling repo `Forced-action-` (FastAPI on :8000). Frontend assumes that contract.
- Dashboard auth is the UUID in the URL — treat the feed UUID as a secret.
- `/email-previews` and `/admin` routes are not gated client-side; backend must enforce.
- No `.env` is committed; copy `.env.example` for local dev.

## Self-Maintenance

Update this file automatically after any major architectural change. Triggers:

1. New route added/removed in `src/App.jsx` → update **Routes** table.
2. Dependency added/removed in `package.json` that changes a **Tooling Rule** (state lib, router, styling system, test runner) → update **Tooling Rules**.
3. New top-level dir under `src/` (e.g. new `src/store/`) → add to architecture section.
4. New file in `src/api/` → add to **API Layer**.
5. New hook in `src/hooks/` that owns shared state or a cross-cutting concern → add to **State Management**.
6. Vite/Tailwind/PostCSS config change affecting dev port, proxy, output dir, or token namespace → update **Commands** + **Theme System**.
7. New env var consumed via `import.meta.env.VITE_*` → add to **Environment Variables**.

When updating: keep file <200 lines, prefer specifics over generics, delete stale rules in the same edit.
