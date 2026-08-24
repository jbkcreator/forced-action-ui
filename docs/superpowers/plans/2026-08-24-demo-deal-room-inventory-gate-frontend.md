# Demo Deal-Room Inventory Gate — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the backend's new inventory gate rejects `POST /api/demo/deal-room` with `422 insufficient_leads`, the closer-facing "Generate Deal Room" form must show that as a ZIP-specific inline error (like the existing 409 "already held" case) instead of falling through to the generic error banner — and fix a pre-existing bug in that fallback branch along the way.

**Architecture:** `DealRoomGenerator.jsx` already has a `catch` block that special-cases `401` and `409`. This plan adds one more `else if` for `422`, reusing the existing `zipError` state (no new state, no new component). While touching that `catch` block, it also fixes `setError(err.detail || ...)`: the backend returns dict-shaped error bodies (`{"detail": {"error": ..., "message": ...}}`) for every 4xx this endpoint can return (`vertical_mismatch`, `county_not_launched`, and now `insufficient_leads`), so `err.detail` is an object, not a string — rendering it directly in JSX shows `[object Object]` today. This is a one-line fix (`err.detail?.message`) in the same branch, not a separate change.

**Tech Stack:** React 19 function component, existing `src/api/dealRoom.js` wrapper over `src/api/client.js` — no new dependencies.

**Spec:** Backend companion plan: `Forced-action-/docs/superpowers/plans/2026-08-24-demo-deal-room-inventory-gate-backend.md`. That plan makes the backend return `HTTPException(status_code=422, detail={"error": "insufficient_leads", "message": "Only N qualified leads available for this ZIP/vertical combination"})` from `POST /api/demo/deal-room`.

## Global Constraints

- No new dependencies, no new component, no new state — reuse the existing `zipError` state that the 409 branch already uses.
- This repo has no test runner configured (`CLAUDE.md`: "No test runner is configured") — do not add one for this change. Verify manually per Task 1 Step 3, matching how the rest of this repo is verified.
- HTTP calls stay inside `src/api/*.js` per repo convention — no raw `fetch` in the component (already true here; not being changed).

---

## File Structure

- **Modify:** `src/components/demo/DealRoomGenerator.jsx` — extend the `catch` block in `handleSubmit`. No other file changes needed; `src/api/dealRoom.js`'s `createDemoDealRoom()` already passes the full error through unchanged.

---

### Task 1: Handle the 422 inventory-gate error and fix the `err.detail` object-render bug

**Files:**
- Modify: `src/components/demo/DealRoomGenerator.jsx:100-107`

**Interfaces:**
- Consumes: the error thrown by `createDemoDealRoom()` (`src/api/dealRoom.js:21`), which is `{ status: number, detail: string | { error: string, message: string } }` per `src/api/client.js:21` (`throw { status: res.status, ...error }` where `error` is the parsed JSON response body).

- [ ] **Step 1: Make the change**

Current code (`DealRoomGenerator.jsx:100-107`):

```jsx
    } catch (err) {
      if (err.status === 401) {
        onUnauthorized?.();
      } else if (err.status === 409) {
        setZipError('This ZIP is already held or locked.');
      } else {
        setError(err.detail || 'Something went wrong.');
      }
    } finally {
```

Replace with:

```jsx
    } catch (err) {
      if (err.status === 401) {
        onUnauthorized?.();
      } else if (err.status === 409) {
        setZipError('This ZIP is already held or locked.');
      } else if (err.status === 422) {
        setZipError(err.detail?.message || 'Not enough qualified leads available for this ZIP.');
      } else {
        setError(err.detail?.message || 'Something went wrong.');
      }
    } finally {
```

- [ ] **Step 2: Read the diff back**

Confirm the only changes are the new `else if (err.status === 422)` branch and `err.detail` → `err.detail?.message` in the final `else`. No other lines in the file should differ.

- [ ] **Step 3: Verify manually in the browser**

This repo has no test runner, so verification is manual (matches existing repo convention):

1. Start the frontend dev server: `npm run dev` (proxies `/api/*` to the backend on `:8000` per `vite.config.js`).
2. Start the backend with the Task 2 backend-plan change applied (or temporarily stub the endpoint) so `POST /api/demo/deal-room` can return a `422`.
3. Log in to the demo generator, fill the form with a ZIP known to have fewer than `MIN_EXCLUSIVE_LEADS` sellable leads, and submit.
4. Confirm: the ZIP field shows a red-bordered inline error with the message text (not `[object Object]`, not the generic banner), and the rest of the form (name/email/tier/etc.) is untouched — matching the existing 409 "already held" UX.
5. Submit again with a ZIP known to have enough leads and confirm the success state (copy-able links) still renders — regression check that the 201 path is unaffected.

- [ ] **Step 4: Commit**

```bash
git add src/components/demo/DealRoomGenerator.jsx
git commit -m "fix: show inventory-gate 422 as inline ZIP error, fix err.detail object render"
```
