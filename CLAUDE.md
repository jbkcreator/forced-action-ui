# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Build to dist/
npm run preview    # Preview production build
```

No test runner is configured.

## Environment Variables

Copy `.env.example` to `.env` and set:
- `VITE_API_BASE_URL` — Backend base URL (empty string in dev; Vite proxy handles `/api/*`)
- `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key

## Architecture

**Forced Action** is a distressed property intelligence platform for Hillsborough County, serving 6 buyer verticals (Roofing, Restoration, Public Adjusters, Wholesalers, Fix & Flip, Attorneys). The frontend is a React 19 SPA backed by a FastAPI server on port 8001.

### Routes

| Path | Page | Notes |
|------|------|-------|
| `/` | `LandingPage` | Public — founding counter, ZIP check, pricing, Stripe checkout |
| `/dashboard/:feedUuid` | `DashboardPage` | Auth via UUID in URL; lead feed with filters |
| `/success` | `SuccessPage` | Post-checkout; reads `?tier=&zips=` query params |
| `/email-previews` | `EmailPreviewsPage` | Dev tool for previewing transactional email templates |
| `*` | `NotFoundPage` | |

### Theme System

All visual tokens live in `src/config/theme.json` — the single source of truth for colors, gradients, fonts, and border radius. `src/theme/ThemeProvider.jsx` flattens this JSON to CSS custom properties on `:root` using the `--fa-*` namespace. `tailwind.config.js` maps Tailwind utilities to these CSS variables (e.g., `bg-fa-bg-base`, `text-fa-text-primary`, `border-fa-border-default`). To retheme, edit only `theme.json`.

### State Management

No state management library — uses React hooks exclusively:

- **URL params** (`useFeedFilters`) — Dashboard filter state (sort, min_score, incident_type, search, page) is stored in the URL, making filters bookmarkable
- **localStorage** (`useContacted`) — Tracks contacted property IDs under key `fa_contacted`
- **React Context** (`LandingContext`) — Shares selected `vertical` and `countyId` across landing page components
- **`useApi`** — Generic fetch hook returning `{ data, loading, error, refetch }`
- **`usePolling`** — Polls an API function at a configurable interval (default 30s)

### API Layer

All API calls go through `src/api/client.js` (`apiRequest`, `api.get`, `api.post`). The dev server proxies `/api/*` and `/webhooks/*` to `http://localhost:8001`. Domain-specific functions are in:
- `src/api/landing.js` — Founding summary, ZIP check, checkout, waitlist
- `src/api/dashboard.js` — Lead feed, stats, lead packs, hot lead unlock

### Stripe Integration

- **Landing checkout** (`useStripeCheckout`) — Embedded checkout via `stripe.initEmbeddedCheckout(client_secret)`; on completion redirects to `/success?tier=&zips=`
- **Lead pack purchases** (`useStripePayment`) — PaymentElement flow with steps: `choose → payment → success`

### Key Config Files

- `src/config/theme.json` — All visual tokens
- `src/config/constants.js` — Vertical labels/icons, distress tag colors, trust stats
- `src/config/pricing.js` — Tier pricing (Starter/Pro/Dominator), ZIP limits, feature lists
- `src/data/emailTemplates.js` — 9 transactional email templates (HTML strings); preview at `/email-previews`
