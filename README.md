# Forced Action — Frontend

React + Vite + Tailwind CSS frontend for the Forced Action distressed property intelligence platform. Served as a SPA by the FastAPI backend.

## Stack

- **React 19** + **React Router v7**
- **Vite 6** (build tool + dev server)
- **Tailwind CSS v3** (utility styling)
- **Stripe.js** (embedded checkout + payment element)

## Project Structure

```
src/
├── api/              # API client functions (dashboard.js, landing.js)
├── components/
│   ├── dashboard/    # Lead feed components (LeadCard, FilterBar, StatsBar, etc.)
│   ├── landing/      # Landing page sections (HeroBanner, PricingSection, FAQ, etc.)
│   ├── layout/       # Navbar, shared layout
│   └── ui/           # Reusable primitives (Modal, Icon, Pagination, Skeleton, etc.)
├── config/
│   ├── constants.js  # DISTRESS_TAG_COLORS, VERTICAL_ICONS, pricing constants
│   ├── pricing.js    # Tier pricing table
│   └── theme.json    # ← Single source of truth for all visual tokens
├── data/
│   └── emailTemplates.js  # All 9 transactional email templates (preview at /email-previews)
├── hooks/            # useApi, useFeedFilters, useContacted, useStripeCheckout, useStripePayment
├── pages/            # LandingPage, DashboardPage, SuccessPage, EmailPreviewsPage, NotFoundPage
├── styles/           # index.css, animations.css
├── theme/            # ThemeProvider.jsx (injects CSS custom properties from theme.json)
└── utils/            # format.js (date formatting)
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
cd forced-action-ui
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

For production use `pk_live_...` for the Stripe key.

### Dev Server

```bash
npm run dev
# Runs at http://localhost:5173
# Proxies /api/* to the FastAPI backend at localhost:8000
```

### Production Build

```bash
npm run build
# Output: dist/
# FastAPI serves dist/ automatically — no separate deploy step needed
```

The FastAPI backend (`src/api/main.py`) mounts `dist/assets/` and serves `dist/index.html` for all SPA routes. Just run the build and restart the backend.

## Theming

All visual tokens (colors, gradients, fonts, brand info) live in **`src/config/theme.json`**. Edit that file only — no component changes needed to retheme.

```json
{
  "brand": {
    "name": "Forced Action",
    "supportEmail": "support@forcedaction.io"
  },
  "colors": {
    "primary": "#fbbf24",
    ...
  }
}
```

`ThemeProvider.jsx` flattens the tokens to CSS custom properties on `:root`. Tailwind extends its palette with `var(--fa-*)` variables via `tailwind.config.js`.

## Routes

| Path | Page | Notes |
|------|------|-------|
| `/` | Landing page | Founding counter, ZIP check, pricing |
| `/success` | Success page | Post-checkout confirmation. Reads `?tier=&zips=` from URL |
| `/dashboard/:feedUuid` | Dashboard | Lead feed. Auth via UUID in URL |
| `/email-previews` | Email preview tool | Development only |

## Key Components

### Dashboard
- **LeadCard** — Expandable lead with color-coded distress tags, CDS score tooltip, contacted tracking
- **FilterBar** — Min score pills + incident type filter (writes to URL params via `useFeedFilters`)
- **SearchBar** — Debounced address/city/ZIP search
- **LeadPackSection** — $99 lead pack purchase for ZIPs outside territory

### Landing
- **FoundingCounter** — Live founding spot countdown (polls `/api/founding-spots` every 60s)
- **StickyHeaderCTA** — Appears when user scrolls past pricing (IntersectionObserver)
- **FAQ** — Pure CSS accordion (no library)

### Hooks
- **`useFeedFilters`** — URL-backed filter state (`sort`, `min_score`, `incident_type`, `search`, `page`)
- **`useContacted`** — localStorage-backed contacted property IDs
- **`useStripeCheckout`** — Stripe embedded checkout lifecycle
- **`useStripePayment`** — Stripe PaymentElement lifecycle (lead pack payments)

## Email Previews

All transactional email templates can be previewed at `/email-previews` in dev. Templates are in `src/data/emailTemplates.js` and cover: welcome, founding welcome, payment receipt, payment failed, cancellation scheduled, cancellation executed, lead pack delivery, ZIP territory available, and price escalation notices.

## Build Output

```
dist/index.html          ~0.5 KB
dist/assets/index.css    ~36 KB  (7.8 KB gzipped)
dist/assets/index.js     ~365 KB (104 KB gzipped)
```
