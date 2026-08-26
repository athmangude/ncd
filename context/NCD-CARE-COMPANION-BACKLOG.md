# NCD Care Companion — Implementation Backlog

Items identified during the spec-to-code workflow (wf_58c69db1-6b7, Aug 25 2026) that were flagged by the product manager validation but not included in the 72-task implementation plan.

---

## Notifications (7 items)

The spec defines 7 notification types (Section 7) with push templates, deep-links, and scheduling logic. None have mock simulation, handler stubs, or deep-link navigation tests in the prototype.

- [ ] **NOTIF-001: REFILL_REMINDER** — Mock push notification simulation + deep-link to `/patients/care-companion/refill-schedule`. Template: "Time to refill {medicationName}". Trigger: daily cron, 6 days before expected refill date. Weekly cadence per medication.
- [ ] **NOTIF-002: REFILL_OVERDUE** — Mock overdue escalation notification + deep-link to refill schedule. Trigger: status transitions to OVERDUE. Weekly thereafter.
- [ ] **NOTIF-003: REFILL_LOAN_OFFER** — Mock notification linking overdue refill to medication loan pre-approval + deep-link to `/patients/care-companion/medication-loan`. Trigger: overdue refill + pre-approval eligible.
- [ ] **NOTIF-004: EDUCATION_WEEKLY** — Mock weekly education push notification + deep-link to `/patients/care-companion/education`. Template: "{cardTitle} — Your weekly health tip is ready." Trigger: Mondays 10 AM EAT.
- [ ] **NOTIF-005: MEDICATION_CARD_AVAILABLE** — Mock post-payment notification when medication cards are ready for purchased drugs. Primary path is the in-app overlay, but push notification is the fallback for users who dismiss the success screen.
- [ ] **NOTIF-006: PREDICTIVE_CREDIT_OFFER** — Mock monthly predictive credit notification + deep-link to `/patients/care-companion/medication-loan`. Template: "We've pre-approved KES {amount} for your {monthName} medication at {pharmacyName}." Trigger: 25th of each month.
- [ ] **NOTIF-007: LAB_REMINDER** — Mock lab test reminder based on guideline intervals (e.g., 90 days for HbA1c) + deep-link to care companion home.

### Implementation notes
- Create `src/mocks/handlers/notifications.ts` with MSW handlers that return notification payloads
- Create `src/mocks/fixtures/notifications.json` with sample notification data for each type
- Add a notification simulation panel (dev-only) or in-app notification feed to test deep-link routing
- Deep-link navigation tests: verify each notification's `clickAction` routes to the correct page

---

## Integrations (2 items)

- [ ] **INTEG-004: Gamification XP integration** — 3 new XP events from spec Section 8:
  - `MEDICATION_REFILL_ON_TIME` (+15 XP)
  - `EDUCATION_CARD_VIEWED` (+5 XP)
  - `MEDICATION_TIMELINE_SHARED` (+10 XP)
  - Needs: mock XP award API responses, XP feedback toast/animation after qualifying actions, XP type definitions
- [ ] **INTEG-005: Provider portal structured medication selector** — Typeahead against MedicationTaxonomyEntry in provider invoice submission. Produces `parseMethod: STRUCTURED_INPUT` with `confidence: 1.00`. Arguably out of scope for the patient app prototype but referenced in the spec.

---

## Cross-cutting concerns (3 items)

- [ ] **ERRH-001: Per-section error boundaries on CareCompanionHome** — Spec F-11 requires each section (refill schedule, cost tracker, emergency card, education feed) to have an independent error boundary with section-specific fallback UI ("Unable to load [section name]") and a retry button. Emergency card section must never show a generic error; falls back to cached content or static fallback.

- [ ] **A11Y-001: Accessibility requirements** — Spec F-8 defines per-component requirements not enumerated in task descriptions:
  - EmergencyCardPage: 18px body text, 24px headings, WCAG AA contrast (4.5:1 body, 3:1 large), `role="alert"` on critical symptoms, high-contrast scheme independent of app theme, critical actions above the fold
  - AiAssistantPage: `aria-live="polite"` on message list, focus to input after assistant responds, `role="log"` on message list, keyboard-accessible send
  - MedicationCardOverlay: Radix Dialog/Drawer with focus trap, `aria-label="Close medication information"` on close button
  - InteractionWarning: `role="alert"` with `aria-live="assertive"` for SEVERE/CONTRAINDICATED
  - All lists: `role="list"` and `role="listitem"` semantics
  - All pages: keyboard navigation, focus visible indicators

- [ ] **OFFLINE-001: Emergency card 5-layer offline strategy** — Spec F-1 defines a specific 5-layer strategy only partially referenced in implementation tasks:
  1. React Query persistence via `@tanstack/query-persist-client-core` with IndexedDB adapter
  2. Eager prefetch of emergency cards for patient's inferred conditions (all locales) on first login
  3. Service worker precaching of emergency card page JS bundle + runtime cache (network-first with indefinite cache fallback)
  4. Static HTML fallback embedded in PWA bundle for HYPERTENSION, DIABETES, GENERAL conditions (last resort)
  5. "Last cached at" timestamp displayed in UI

---

## Priority guidance

| Priority | Items | Rationale |
|----------|-------|-----------|
| P1 | ERRH-001, A11Y-001, OFFLINE-001 | Cross-cutting quality concerns that affect user safety (emergency card offline, accessibility) and reliability (error boundaries). Should be addressed during or immediately after the current implementation run. |
| P2 | NOTIF-001 through NOTIF-007 | Notification mocks complete the user journey simulation. Important for realistic prototype testing but not blocking core page functionality. |
| P3 | INTEG-004 | XP feedback is a nice-to-have for prototype fidelity. |
| P4 | INTEG-005 | Provider portal scope — likely out of scope for the patient prototype. |
