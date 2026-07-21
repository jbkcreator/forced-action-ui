# T-B8-02 — At-a-Glance Page with 11 KPIs (Frontend)

**Block:** 8 (Operator Dashboard) · **Build order position:** 7
**Status:** Implemented and wired to live backend (T-B8-01, branch
`feat/t-b8-01-operator-dashboard-aggregation`, commit `cdbb153`). Mock removed
from `src/api/admin.js` — `fetchOperatorDashboard()` calls the real endpoint.
**Sibling:** T-B8-03 (action queue) deep-links from 2 of these KPI cards — still
not built, links stay commented out (see Q1).

## Backend integration notes (verified against actual T-B8-01 code, not just the plan doc)

- Response shape matched the mocked contract **exactly** — same 11 keys, same
  field names (`value`, `value_cents`, `free_to_paid_rate`,
  `avg_days_to_convert`, `note`, `available`, `reason`). No frontend shape
  changes were needed, only removing the mock.
- `from`/`to` query params: backend parses via `datetime.fromisoformat`, which
  accepts the plain `YYYY-MM-DD` string the native date input already sends —
  no formatting change needed on the frontend.
- `free_to_paid_rate` is a 0–1 fraction (confirmed in `revenue_metrics.py:95`)
  — matches the frontend's `fmtPercent` (`rate*100` + `%`). `avg_days_to_convert`
  can be `null` when no conversions occurred in the window — frontend already
  handles this (`?? '—'`).
- **New info not in the original plan:** `_kpi_source_failures` and
  `_kpi_cora_approvals_waiting` in `operator_dashboard.py` are explicitly
  commented `BOOTSTRAP COUNT — not canonical`. The backend author intends to
  swap both for a call into T-B8-03's action-queue count helper once that
  ships, "so the KPI tile and the queue never drift apart" — confirming the
  drift risk flagged earlier in this doc's Q&A with the B8-03 dev. No frontend
  action needed; noting it here so it isn't lost.
- Auth: router requires `get_current_admin` (Bearer JWT) — already satisfied
  by `adminFetch`'s existing header, no change.

## Goal

One admin page rendering all 11 Block 8 KPIs as scalar tiles on a single
screen. No math in the frontend — reads one aggregation endpoint. No charts,
no drill-downs. The operator's daily overview.

11 KPIs: MRR · New accounts · Churn risk · Leads delivered · Activation ·
Deals submitted · Lender matches · Loans funded · Commissions owed ·
Source failures · Cora approvals waiting.

## Locked decisions (confirmed with product owner)

| Decision | Choice |
|---|---|
| Date range | From/to picker (native `<input type="date">`), default last 30 days |
| Refresh | Load-on-mount via `useApi`, refetch on date change. No polling. |
| Not-yet-built KPIs (deals/lender/loans/commissions) | Dimmed tile + backend `reason` string. All 11 slots always render. |
| Charting | None. 11 scalars need no chart library. |
| Trend / sparklines / delta-vs-prior-period | **Out of scope, permanently.** T-B8-01's endpoint returns one point-in-time snapshot per KPI, no historical series. Not requested by the DoD. Not tracked as a follow-up. |
| Severity coloring | **Added.** `churn_risk`, `source_failures`, `cora_approvals_waiting` render red when `value > 0`, emerald when `0` — the only threshold with no product-defined target band (0 is unambiguously good for these three). Every other KPI stays neutral (no invented thresholds without product input). |
| Shared tile component | `KpiTile` kept **local/inline** in the section file. No speculative shared abstraction. |

## API contract (from T-B8-01 plan)

**One endpoint:** `GET /api/admin/operator-dashboard/summary?from=&to=`

Returns `{from, to, kpis: {<slug>: {available, ...}}}`. The `available` flag
is the entire integration contract — the tile branches on it, so the 4
placeholder KPIs go live with **zero frontend change** when Block 5/7 ship.

| KPI slug | available at ship? | Tile renders |
|---|---|---|
| `mrr` | ✅ | `value_cents` → `$X` |
| `new_accounts` | ✅ | `value` (int) |
| `churn_risk` | ✅ | `value` (int) |
| `leads_delivered` | ✅ | `value` (int) |
| `activation` | ✅ proxy | `free_to_paid_rate` %, `avg_days_to_convert` + proxy note |
| `source_failures` | ✅ | `value` (int) — **card links to action queue (T-B8-03)** |
| `cora_approvals_waiting` | ✅ | `value` (int) + note — **card links to action queue (T-B8-03)** |
| `deals_submitted` | ❌ | dimmed + `reason` |
| `lender_matches` | ❌ | dimmed + `reason` |
| `loans_funded` | ❌ | dimmed + `reason` |
| `commissions_owed` | ❌ | dimmed + `reason` |

**No separate query for the 2 linked KPIs** — their counts come from this
summary endpoint, not from T-B8-03's queue. (Coordination note: T-B8-03's
queue row-filters must match T-B8-01's KPI predicates or card count ≠ queue
length. That alignment is owned by the 01/03 devs, not this task.)

## Current state — what exists to reuse

| Need | Reuse | Location |
|---|---|---|
| Add admin section | nested `<Route>` (lazy) + `<Outlet/>` | `src/App.jsx:120-143` |
| Sidebar entry | `SECTIONS` array | `src/components/admin/AdminSidebar.jsx:3` |
| Tile grid pattern | `grid grid-cols-3 gap-3` over `{label,value,color}` cards | `src/components/admin/sections/AttributionOverview.jsx:79-91` |
| Admin authed fetch | `adminFetch(token, path)`, token `localStorage['admin_token']` | `src/api/admin.js:9` |
| Auto-fetch-on-mount | `useApi(fetcher, deps)` → `{data,loading,error,refetch}` | `src/hooks/useApi.js:4` |
| Date inputs + defaults | native inputs, `defaultFrom()/defaultTo()` (last 7d — bump to 30) | `src/components/admin/sections/CacDashboard.jsx:54-62,91-95` |
| Loading/error/empty primitives | `LoadingSpinner`, `ErrorState`, `EmptyState`, `Skeleton` | `src/components/ui/` |
| Severity/token conventions | `--fa-*` Tailwind tokens only, no hex | `src/config/theme.json`, `tailwind.config.js` |

**Confirmed absent:** no reusable StatCard, no charting lib, no date-picker
component, no consolidated queue page (that's T-B8-03).

## Implementation plan

### File 1 — `src/api/admin.js` (edit)

Add one function + a mock block (mirror the `USE_MOCK` convention already in
`src/api/closer.js`):

```js
// TODO(T-B8-01): flip USE_MOCK=false when /operator-dashboard/summary ships
const USE_MOCK_OPERATOR_DASHBOARD = true;

export function fetchOperatorDashboard(token, { from, to } = {}) {
  if (USE_MOCK_OPERATOR_DASHBOARD) return Promise.resolve(MOCK_OPERATOR_DASHBOARD);
  const qs = new URLSearchParams({ from, to });
  return adminFetch(token, `/api/admin/operator-dashboard/summary?${qs}`);
}
```

`MOCK_OPERATOR_DASHBOARD` = the exact sample payload from the T-B8-01 plan
(7 available + 4 `available:false` with reason strings). **Single wire-up
point** — no other file changes to go live.

### File 2 — `src/components/admin/sections/OperatorDashboardSection.jsx` (NEW)

The whole page. Structure:

- **State:** `from`/`to` (seed `defaultFrom()` = today−30d, `defaultTo()` =
  today), two native `<input type="date">` with `colorScheme:'dark'`.
- **Fetch:** `useApi(signal => fetchOperatorDashboard(token, {from,to}), [from,to])`.
  Auto-loads on mount, refetches when the range changes.
- **`KPI_META`** — ordered array of the 11 slugs → `{label, format, linkTo?}`.
  Drives render order (spec order) and per-KPI formatting (`$`, `%`, int).
  `source_failures` + `cora_approvals_waiting` carry `linkTo` → queue route
  (see open question Q1).
- **Local `KpiTile({ label, kpi, linkTo })`:**
  - `kpi.available === false` → dimmed card (`opacity-50`), shows `kpi.reason`.
  - available → big number via the slug's formatter + optional sub-line
    (activation's rate/days, notes).
  - `linkTo` present → wrap in `<Link>` with a hover affordance + tiny
    "View queue →" caption.
  - Severity/emphasis via `--fa-*` tokens only.
- **Grid:** `grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3` — all 11
  fit one screen.
- **States:** `loading` → 11 `<Skeleton>` tiles; `error` → `<ErrorState>` /
  red banner (admin convention); no empty state (endpoint always returns 11
  keys).

### File 3 — `src/App.jsx` (edit)

`const OperatorDashboardSection = lazy(() => import('./components/admin/sections/OperatorDashboardSection'))`
+ `<Route path="operator" element={<OperatorDashboardSection />} />` inside the
`/admin` block.

### File 4 — `src/components/admin/AdminSidebar.jsx` (edit)

Add `{ id:'operator', label:'At-a-Glance', path:'operator', icon:<…> }` as the
**first** SECTIONS entry (it's the overview).

## Out of scope (explicit)

- Action queue UI (T-B8-03) — this page only *links to* it.
- Cohort retention viewport (T-B8-04).
- Win-story approval admin view — no DB status column exists; not counted in
  `cora_approvals_waiting`; not linked from any card here.
- Extracting a shared `StatCard`/`SeverityDot` primitive — only if T-B8-03
  commits to consuming it (see Q3).

## Test / verification

No test runner configured in this repo (CLAUDE.md). Manual verification:
1. With `USE_MOCK=true`: `/admin/operator` renders all 11 tiles; 4 dimmed
   with reason text; date inputs default to a 30-day window; changing a date
   triggers a refetch (mock returns same payload — verify no crash).
2. Loading state shows 11 skeletons; forced fetch rejection shows error banner.
3. `source_failures` + `cora_approvals_waiting` tiles are clickable and route
   to the queue path (once Q1 resolved).
4. Sidebar shows "At-a-Glance" first; NavLink active state correct.

---

## OPEN QUESTIONS — resolve before implementation

**Q1 — Action-queue route path + filter param (blocks the 2 linked cards).**
T-B8-03 is greenfield; its route doesn't exist yet. I need from the B8-03 dev:
(a) the queue route path — proposed `/admin/queue`; (b) how source-failures
are filtered in-queue — proposed `/admin/queue?filter=source_failures`.
**Until confirmed, both cards render non-clickable (no `linkTo`)** and I wire
the links in a one-line follow-up. Not a blocker for the other 9 tiles.

**Q2 — Icon for the sidebar entry.** Other SECTIONS use inline SVG/icon
components. Any preferred icon for "At-a-Glance" (e.g. grid/dashboard glyph),
or pick the closest existing one? Default: reuse an existing dashboard-style
icon already imported in `AdminSidebar.jsx`.

**Q3 — Shared tile primitive: build or not?** Plan keeps `KpiTile` local
(ponytail: one consumer). If T-B8-03 will actually reuse a card, I'll extract
one small `StatCard` (+ optional `SeverityDot`) into `src/components/ui/`
instead, and we both import it. **Default if no answer: keep local, 03 copies
the markup.** Confirm only if 03 commits to importing it.

**Q4 — Activation tile display.** Backend returns `free_to_paid_rate` +
`avg_days_to_convert` + a "proxy metric" note (not a single number). Show as:
primary = rate `%`, sub-line = `avg Nd to convert`, with a small info marker
for the proxy caveat? **Default: yes, that layout.** Flag if you want it as a
single headline number instead.

**Q5 — MRR unit.** Backend returns `value_cents`. Render as `$8,120`
(dollars, no cents) — confirm, or show cents / a `/mo` suffix? **Default:
`$` whole-dollars, no suffix.**
