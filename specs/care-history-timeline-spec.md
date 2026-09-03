# Product Specification: Care History

**A clinical-event-first timeline that reconstructs a patient's care journey from facility visits, treatments, diagnostics, and AI insights — with payments as supporting detail, not the organising principle.**

Version: 0.1
Date: 2026-09-02

---

## 1. Problem

The "Purchase History" page (`/#/patients/companion/medication-timeline`) is currently empty. It was previously populated by seed data structured around individual medication purchases — each card showed a medication name, dosage, pharmacy, and price. The page was a payment ledger dressed as a health feature.

This framing is wrong for two reasons:

1. **Patients don't think in transactions.** A person living with diabetes doesn't recall "I bought Metformin 500mg x 60 at KES 450 from Nairobi Hospital Pharmacy on March 4th." They recall "I went to Nairobi Hospital in March, saw the doctor, got my blood work done, and picked up my prescriptions." The unit of memory is the *visit*, not the *line item*.

2. **A payment-first timeline hides the clinical picture.** When a patient uploads a test result, receives an AI insight about a drug interaction, or gets flagged for a missed refill — none of that appears in a purchase log. The events that matter most for health outcomes (adherence gaps, test trends, care escalations) are invisible.

The result: a page that neither helps patients understand their care journey nor gives Jireh the clinical-event surface it needs for its AI companion to add value.

---

## 2. Solution

Replace the purchase-history ledger with a **Care History** timeline organised around clinical events at healthcare facilities. Each entry represents something that happened in the patient's care — a consultation, a lab test, a prescription pickup, a test result upload, an AI-generated insight. Payments appear as metadata on these events (how much it cost, where the money came from) rather than as the events themselves.

The timeline groups by facility visit when events cluster on the same date and location, and shows standalone entries for events that happen outside a visit (e.g. an AI insight generated at home, a test result uploaded days after the lab draw).

---

## 3. Users

### 3.1 Primary: Patient / Anchor Caregiver
- Reviews their care history to prepare for doctor visits ("When was my last HbA1c?")
- Tracks whether they're keeping up with their care plan across medications and tests
- Wants a clear picture of what happened at each facility visit — what was done, what it cost
- Uses the timeline to spot patterns: are visits getting more frequent? Are costs rising?

### 3.2 Secondary: AI Health Assistant (system)
- References care history when generating insights ("Your last HbA1c was 3 months ago and showed 7.2% — it may be time to retest")
- Uses the timeline as evidence for adherence scoring and nudges

---

## 4. User Experience

### 4.1 Page Header

**Title**: "Care History" (rename from "Purchase History")

**Summary card** at the top:
- Date range (earliest to most recent event)
- Total facility visits (unique date + facility combinations)
- Facilities visited (unique facility count)
- Quick stat: "Last visit: [date] at [facility]"

### 4.2 Filter Chips

Horizontally scrollable filter chips below the summary:
- **All** (default)
- **Visits** — facility visit clusters
- **Medications** — prescription pickups and refill events
- **Lab Tests** — lab orders, test result uploads, and test schedule events
- **Insights** — AI-generated insights and drug interaction warnings

A second row of chips filters by facility when the user has visited more than one.

### 4.3 Timeline Structure

Events are displayed in reverse chronological order, grouped by month (same as current page). Within each month, events are further clustered into **visit groups** when they share the same date and facility.

#### Visit Group Card

When multiple events happen at the same facility on the same date, they collapse into a single visit card:

```
┌──────────────────────────────────────────┐
│ 🏥  Nairobi Hospital                     │
│ 4 Mar 2026 · 3 services                 │
│                                          │
│ ┌─ Consultation ─────────── KES 1,500 ─┐│
│ │  Dr visit — diabetes follow-up        ││
│ └───────────────────────────────────────┘│
│ ┌─ Lab Test ─────────────── KES 2,800 ─┐│
│ │  HbA1c Test                           ││
│ │  📊 Result: 7.2% (uploaded 8 Mar)     ││
│ └───────────────────────────────────────┘│
│ ┌─ Prescription ─────────── KES 4,200 ─┐│
│ │  Metformin 500mg x 60                 ││
│ │  Glibenclamide 5mg x 30              ││
│ └───────────────────────────────────────┘│
│                                          │
│ Total: KES 8,500 · Jireh Wallet + Loan  │
└──────────────────────────────────────────┘
```

**Facility header**: facility icon (based on type: hospital, pharmacy, lab, clinic), facility name, date, service count.

**Service rows** within the visit:
- **Consultation**: description or "Doctor visit — [condition] follow-up"
- **Lab Test**: test name; if a `TestResultEvent` exists for this test within 14 days, show the result inline with a status badge (Normal/Low/High/Critical)
- **Prescription**: list of medications picked up, with quantities
- **Supply**: any medical supplies purchased

**Footer**: total cost for the visit, funding source breakdown (Jireh Wallet, Loan, M-Pesa, Cash).

#### Standalone Event Cards

Events that don't belong to a facility visit get their own cards:

**AI Insight card**:
```
┌──────────────────────────────────────────┐
│ ✨  AI Insight · 10 Mar 2026             │
│ Drug Interaction Warning                 │
│                                          │
│ Metformin and Glibenclamide taken        │
│ together may increase hypoglycemia risk. │
│ Talk to your doctor about monitoring.    │
│                                          │
│ [View details →]                         │
└──────────────────────────────────────────┘
```

**Test Result Upload card** (when uploaded outside a visit context):
```
┌──────────────────────────────────────────┐
│ 🧪  Test Result · 8 Mar 2026            │
│ HbA1c Test                               │
│                                          │
│ Result: 7.2%  [HIGH badge]               │
│ Reference: 4.0 – 5.6%                   │
│                                          │
│ 💡 "Your HbA1c has improved from 7.8%   │
│ last quarter. Your medication changes    │
│ appear to be working."                   │
│                                          │
│ [View full results →]                    │
└──────────────────────────────────────────┘
```

**Refill Schedule Change card** (user changed their schedule):
```
┌──────────────────────────────────────────┐
│ 💊  Schedule Updated · 6 Mar 2026       │
│ Metformin refill changed from every      │
│ 30 days → every 60 days                  │
│ Reason: Doctor recommended               │
└──────────────────────────────────────────┘
```

**Adherence Gap warning** (computed client-side from schedule vs purchase dates):
```
┌──────────────────────────────────────────┐
│ ⚠️  Missed Refill · 15 Mar 2026         │
│ Metformin is 12 days overdue for refill  │
│                                          │
│ [Find nearby pharmacies →]               │
└──────────────────────────────────────────┘
```

#### Future Scheduled Events

Upcoming refills and tests from the patient's schedule appear at the top of the timeline as muted entries, visually distinct from past events. These give the patient a forward view of their care plan.

**Upcoming refill**:
```
┌──────────────────────────────────────────┐
│ 💊  Upcoming · 18 Sep 2026        ░░░░░ │
│ Metformin refill due                     │
│ Est. KES 450 · Every 30 days            │
└──────────────────────────────────────────┘
```

**Upcoming test**:
```
┌──────────────────────────────────────────┐
│ 🧪  Upcoming · 4 Oct 2026         ░░░░░ │
│ HbA1c Test due                           │
│ Est. KES 2,800 · Every 3 months         │
└──────────────────────────────────────────┘
```

Future entries use muted text/borders (`text-muted-foreground`, `border-dashed`) and a subtle "Upcoming" label instead of the event type. They are not filterable — they always appear when visible events exist. Tapping navigates to the refill/test schedule page.

### 4.4 Event Sources

The timeline draws from these existing data sources:

| Event Type | Source | Maps To |
|---|---|---|
| `PAYMENT` | Events log | Visit group: consultation, prescription, lab, supply line items |
| `TEST_RESULT` | Events log | Standalone card or attached to a lab visit |
| `LLM_ACTION` (AI insights) | Events log | Standalone insight card |
| `DRUG_INTERACTION_DETECTED` | Events log | Standalone warning card |
| `REFILL_SCHEDULE_CHANGE` | Events log | Standalone schedule-update card |
| `TEST_SCHEDULE_CHANGE` | Events log | Standalone schedule-update card |
| `REFILL_SCHEDULE_REMOVE` | Events log | Standalone schedule-update card |
| `TEST_SCHEDULE_REMOVE` | Events log | Standalone schedule-update card |
| `CASHBACK_EARNED` | Events log | Metadata on parent payment's visit card |
| `LOAN_DISBURSED` | Events log | Metadata on payment funding source |

### 4.5 Linking Test Results to Lab Visits

When a `TESTResultEvent` has a `timestamp` within 14 days after a `PaymentEvent` that includes a `LAB_TEST` line item with a matching test name, the result is attached inline to that lab visit row rather than shown as a standalone card. This connects the "I got the test done" event with the "here are the results" event.

### 4.6 Empty State

When no events exist:
```
Your care history will appear here as you
visit facilities, purchase medications,
and upload test results through Jireh.
```

Icon: `HeartPulse` (matches companion tab).

### 4.7 Pagination

Same "Load more" pattern as the current page — fetch 20 events per page, chronologically, with cursor-based pagination on the events log endpoint.

### 4.8 Quick Action Rename

Rename the quick action button on CareCompanionHome from "Purchase History" to "Care History".

---

## 5. Scope

### In scope
- Redesign `MedicationTimelinePage` as care-event-first timeline
- Rename to "Care History" everywhere (page title, quick action, route can stay as-is)
- Group co-located events into visit cards
- Show AI insights, test results, schedule changes as standalone cards
- Attach test results to lab visits when temporally close
- Compute adherence gaps client-side from schedule dates vs purchase history
- Show upcoming scheduled refills/tests as muted future entries at the top
- Payment amounts as metadata on clinical events, not as primary entries
- Filter by event type and by facility
- Summary header with visit-based stats
- New `TimelineEvent` union type replacing `TimelineEntry`
- New MSW handler that queries the events log and assembles the timeline

### Out of scope
- Changing the route path (`/medication-timeline` stays for now)
- Adding new event types to the events log — this spec consumes existing events
- Provider-side view of patient timeline
- Export or sharing of care history
- Offline caching of timeline data

### Deferred to backlog
- **Timeline search**: free-text search across event descriptions, medication names, facility names
- **Timeline date range picker**: filter to a specific date range instead of scrolling
- **Visit detail page**: tapping a visit group opens a full-screen detail view with receipt-style breakdown
- **Care plan sharing**: exporting or sharing the timeline with a doctor or caregiver

---

## 6. Data & Integration

### Data source

All data comes from the existing events log (`GET /companion/events`). No new API endpoints are needed — the timeline page fetches events, classifies them, and assembles the view client-side.

### Event classification

Each `CareCompanionEvent` maps to a timeline card type:

```typescript
type TimelineCardType =
  | "VISIT_GROUP"         // cluster of PAYMENT line items at same facility+date
  | "TEST_RESULT"         // TestResultEvent
  | "AI_INSIGHT"          // LlmActionEvent (non-INVOICE_POPULATE)
  | "DRUG_INTERACTION"    // DrugInteractionDetectedEvent
  | "SCHEDULE_CHANGE"     // Refill/Test Schedule Change/Remove events
  | "ADHERENCE_GAP"       // Computed client-side: schedule date vs actual purchase gap
  | "UPCOMING"            // Future scheduled refill or test from schedule data
```

### Visit grouping logic

```
group_key = date(event.timestamp) + "|" + event.facilityName
```

`PAYMENT` events sharing a group key are merged into a single `VISIT_GROUP` card. Their line items are categorised into consultation, prescription, lab, and supply sections.

`CASHBACK_EARNED` events are matched to their parent `PAYMENT` via `paymentEventId` and displayed as a footer note on the visit card.

### New types

```typescript
interface CareHistoryEntry {
  id: string
  type: TimelineCardType
  date: string                    // YYYY-MM-DD
  facilityName: string | null     // null for non-visit events
  facilityType: string | null
  title: string                   // human-readable card title
  sourceEvents: CareCompanionEvent[]  // underlying events
  totalCost: number | null        // KES, null for non-payment events
  fundingSources: string[]        // e.g. ["Jireh Wallet", "Loan"]
}
```

This replaces the current `TimelineEntry` type for this page. The existing `TimelineEntry` type and `useMedicationTimeline` hook can be deprecated once this ships.

### Hook

New `useCareHistory` hook replaces `useMedicationTimeline`:
- Fetches from `GET /companion/events` with pagination
- Classifies and groups events client-side
- Returns `CareHistoryEntry[]` grouped by month
- Supports filtering by `TimelineCardType` and by facility name

---

## 7. Success Criteria

- A patient who completed intake and has seeded payment events sees a populated timeline grouped by facility visits, not individual medication purchases
- Each visit card shows all services rendered (consultation, labs, prescriptions) as distinct rows within the card
- Test results uploaded via the test results page appear inline on the matching lab visit when within 14 days
- AI insights (drug interactions, adherence nudges) appear as standalone timeline cards with links to detail views
- Schedule changes (frequency updates, removals) appear as compact timeline entries
- The "All" filter shows every event type; category filters correctly isolate visits, medications, tests, and insights
- The facility filter correctly narrows to events at a specific location
- The summary card shows visit count and facility count, not medication count and pharmacy count
- Empty state renders when no events exist
- Page loads in under 2 seconds on a throttled 3G connection (existing events log endpoint, client-side grouping)

---

## 9. Open Questions

### Resolved

- **Adherence gaps: computed client-side.** The timeline compares expected refill dates from the schedule against actual purchase dates in payment events. Does not depend on the AI pipeline having run.

- **Future scheduled events: in scope.** Next upcoming refills and tests from the refill/test schedule appear as muted future entries at the top of the timeline, giving patients a view of what’s coming.

- **No data migration needed.** Payment events are already seeded into the events log during `seedFromIntakeMedications`. The events log already contains all event types this page needs (`PAYMENT`, `TEST_RESULT`, `LLM_ACTION`, schedule changes, etc.). This is not a new data source — it is a different presentation of existing events. The only thing being retired is the `TimelineEntry`-based view, which was a separate payment-only data structure. The new page reads directly from the events log (`GET /companion/events`).
