# Context Engineering — Gaps Checklist (jireh-core-client)

Audit date: 2026-04-08. Tracks all user journey, state management, and design gaps identified.

---

## Journey Documentation

- [x] **Patient onboarding journey** — phone OTP, personal details, PIN setup, ID verification, KYC flow, SmileID integration  
  → [`context/architecture/patient-onboarding-journey.md`](./architecture/patient-onboarding-journey.md)

- [x] **KYC verification** — SmileID biometric SDK, document verification, gating logic, adult filter  
  → [`context/architecture/kyc-verification.md`](./architecture/kyc-verification.md)

- [x] **Loan application journey** — 7-step flow, multi-source wallet allocation, localStorage persistence, discount codes  
  → [`context/architecture/loan-application-journey.md`](./architecture/loan-application-journey.md)

- [x] **Fast-track payment** — QR/paybill payment path, `useFastTrackStore` (Zustand persisted), step guard  
  → [`context/architecture/fast-track-payment.md`](./architecture/fast-track-payment.md)

- [x] **Care Fund journey** — balance display, reveal/hide toggle, gift flow, redemption  
  → [`context/architecture/care-fund-journey.md`](./architecture/care-fund-journey.md)

- [x] **Circle & network journeys** — create circle, invite (QR/text/voice), accept invite, joint liability acknowledgment  
  → [`context/architecture/circle-and-network-journeys.md`](./architecture/circle-and-network-journeys.md)

- [x] **Discovery & map** — Mapbox, Haversine distance, virtual scrolling, sessionStorage state, geolocation  
  → [`context/architecture/discovery-and-map.md`](./architecture/discovery-and-map.md)

- [x] **PWA install & push notifications** — FCM, permission states, `usePwaInstall`, `usePushNotifications`, `useNotificationFlow`  
  → [`context/architecture/pwa-and-push-notifications.md`](./architecture/pwa-and-push-notifications.md)

- [x] **Portal isolation** — patient vs org portal, tenant ID via localStorage, `useTenantAccessControl`, parallel stores  
  → [`context/architecture/portal-isolation.md`](./architecture/portal-isolation.md)

---

## State Management Updates

- [x] **State management (update)** — clarify that localStorage is the dominant persistence layer; Zustand is minimal; updated state map  
  → [`context/architecture/state-management.md`](./architecture/state-management.md) (updated)

---

## Meta Files

- [x] **Conflicts & ambiguities**  
  → [`context/CONFLICTS.md`](./CONFLICTS.md)

- [x] **Known issues**  
  → [`context/KNOWN-ISSUES.md`](./KNOWN-ISSUES.md)

---

## CLAUDE.md & Versioning

- [x] New architecture doc links added to `CLAUDE.md`
- [x] `context/architecture/.context-version` updated
