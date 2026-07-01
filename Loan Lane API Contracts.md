# Loan Lane / Broker State Machine — API Contracts

All endpoints assume `Authorization: Bearer <token>` header.  
Broker endpoints → broker JWT. Admin endpoints → admin JWT.  
All mocked in frontend behind `USE_MOCK = true` flags (see `src/api/broker.js`, `src/api/loanLane.js`).

---

## Broker Auth

### POST /api/broker/login
Email + password login.
```
Request:  { email, password }
Response: { access_token, refresh_token, broker: { id, brokerId, name, email, role } }
```

### POST /api/broker/refresh
Rotate access token.
```
Request:  { refresh_token }
Response: { access_token }
```

### POST /api/broker/forgot-password
Send password reset email.
```
Request:  { email }
Response: { message }
```

### POST /api/broker/reset-password
Set new password via emailed token.
```
Request:  { token, new_password }
Response: { message }
```

### GET /api/broker/me
Get current broker profile.
```
Response: { id, brokerId, name, email, role }
```

---

## Broker Portal — Lanes

### GET /api/broker/lanes
My Lanes (assigned to this broker).
```
Response: { lanes: LaneObject[], total }
```

### GET /api/lanes/:laneId
Single lane detail — full contact visible (broker-scoped).
```
Response: LaneObject (with phone, email, owner_name populated)
Errors:   403 not this broker's lane | 404 not found
```

### GET /api/lanes/:laneId/transitions
Full transition history for a lane.
```
Response: { transitions: [{ transition_id, from_state, to_state, broker_id, actor, reason_code, occurred_at }] }
```

### POST /api/broker/lanes/:laneId/transition
Log a work-state transition.
```
Request:  { to_state, reason_code }
          + { gross_amount_cents, split_config_id } when to_state = "closed_won"
Response: { transition_id, from_state, to_state, reason_code, occurred_at }
Errors:   409 transition not allowed | 422 missing closed_won fields
```

### POST /api/lanes/:laneId/advance
Advance lane to next stage.
```
Request:  { to_stage }
Response: { lane_id, current_stage }
Errors:   409 advance not permitted from current stage
```

### GET /api/lane-stage-config
Stage config used to build the advance control dropdown.
```
Query:    ?lane_type=distressed-payoff
Response: { stages: [{ stage_key, display_name, order_index, allowed_next: string[], sms_allowed }] }
```

---

## Broker Portal — Pool & Claim  ★ NEW

### GET /api/lanes/pool
Unclaimed prospect pool. Contact fields are redacted server-side (D15).
```
Response: {
  lanes: [{
    lane_id, lane_type,
    assigned_broker_id: null,
    distress_score,
    analysis_summary,
    prospect: {
      address, city, state, county,
      owner_name: "masked",
      phone: null,
      email: null
    }
  }],
  total
}
```

### POST /api/broker/lanes/:laneId/claim  ★ NEW
Atomic self-claim. Contact is revealed in the response on success.
```
Response: LaneObject (full contact now visible, assigned_broker_id set to caller)
Errors:   409 already claimed by another broker
```

---

## Broker Portal — Funding Lender  ★ NEW

### GET /api/broker/lenders  ★ NEW
Cleared + active lenders only (used to populate the lender picker dropdown).
```
Response: { lenders: [{ lender_id, name }] }
```

### PATCH /api/lanes/:laneId/lender  ★ NEW
Set funding lender on a lane. Fires on dropdown change (no save button).
```
Request:  { lender_id }
Response: { lane_id, lender_id }
Errors:   404 lender not found or not cleared
```

---

## Admin — Lane Management

### GET /api/lanes
All lanes — admin scoped. Must include `is_stale`, `lender_id`, `lender_name` fields.
```
Response: { lanes: LaneObject[], total }
```

### GET /api/lanes/:laneId
Single lane detail — admin view.
```
Response: LaneObject
```

### GET /api/lanes/:laneId/transitions
Full transition log — admin view.
```
Response: { transitions: TransitionObject[] }
```

### POST /api/admin/lanes/:laneId/assign-broker
Initial assignment — unassigned lanes only.
```
Request:  { broker_id }
Response: { lane_id, assigned_broker_id }
Errors:   409 lane already assigned
```

### POST /api/admin/lanes/:laneId/reassign-broker  ★ NEW
Override existing broker. Works on assigned and stale lanes.
```
Request:  { broker_id }
Response: { lane_id, assigned_broker_id }
Errors:   404 broker not found
```

---

## Admin — Broker Management

### GET /api/admin/brokers
List all brokers.
```
Response: { brokers: [{ broker_id, name, email, is_active, open_lanes, assigned_lanes }], total }
```

### GET /api/admin/brokers/:brokerId/lanes
All lanes assigned to one broker.
```
Response: { lanes: LaneObject[], total }
```

### POST /api/admin/brokers
Invite broker — sends set-password email.
```
Request:  { name, email }
Response: { broker_id, name, email, is_active, reset_token }
Errors:   409 email already registered
```

### PATCH /api/admin/brokers/:brokerId
Activate or deactivate a broker.
```
Request:  { is_active: bool }
Response: { broker_id, is_active }
```

---

## Admin — Lender Curation  ★ ALL NEW

### GET /api/admin/lenders  ★ NEW
All lenders — admin curation view.
```
Response: { lenders: [{ lender_id, name, is_cleared, is_active }], total }
```

### POST /api/admin/lenders  ★ NEW
Create a new lender. Starts uncleared.
```
Request:  { name }
Response: { lender_id, name, is_cleared: false, is_active: true }
```

### PATCH /api/admin/lenders/:lenderId  ★ NEW
Toggle cleared or active status.
```
Request:  { is_cleared?: bool, is_active?: bool }
Response: { lender_id, is_cleared, is_active }
Errors:   404 lender not found
```

---

## Commission Ledger

### GET /api/commissions
Broker gets own entries only; admin gets all (RBAC on backend).
```
Response: {
  commissions: [{
    entry_id, lane_id, prospect_id,
    broker_id, broker_name,
    prospect_address,
    prospect_county,           ← needed for county filter in UI
    gross_amount_cents,
    split_config_id,
    net_lines: [{ party: "broker"|"platform", amount_cents }] | null,
    status: "posted"|"disputed"|"reconciled",
    posted_at,
    fee_config_flag: bool       ← when true, net_lines is null (gated)
  }],
  total
}
```

### POST /api/commissions/:entryId/dispute
Flag an entry as disputed.
```
Response: { entry_id, status: "disputed" }
Errors:   409 already disputed
```

---

## Shared: LaneObject Shape

All lane list and detail responses must return this shape.

```
{
  lane_id, lane_type,
  current_stage, current_stage_display,
  current_work_state,
  outcome: "open"|"funded"|"dead"|"recycled",
  assigned_broker_id: string | null,
  assigned_broker_name: string | null,
  entered_at,                  ← ISO string, used to compute is_stale
  is_stale: bool,              ← true when idle > 30 days (D14)
  lender_id: string | null,    ← D12
  lender_name: string | null,  ← D12
  fee_config_flag: bool,
  prospect: {
    prospect_id, address, city, state, county, zip,
    owner_name: string,
    phone: string | null,      ← null in pool view (D15)
    email: string | null       ← null in pool view (D15)
  }
}
```

## Work State Machine

```
unassigned  →  (claim flow or admin assign only — broker cannot manually transition)
assigned    →  working | closed_lost
working     →  quoted | closed_lost
quoted      →  committed | closed_lost
committed   →  closed_won | closed_lost
closed_won  →  (terminal)
closed_lost →  (terminal)
```

## Reason Codes (required on every transition)

```
no_contact | not_interested | price | qualified | docs_received | funded | lost_other
```
