# Architectural Conflicts & Ambiguities — jireh-core-client

---

## 1. `patientLoanStore` Is Effectively Unused

**Status: Dead code — loan state managed elsewhere**

`src/Routes/Patient/stores/patientLoanStore.tsx` defines a Zustand store with a single `loan` field and `setLoan` action. In practice, loan application state is managed via:
- `localStorage` key `patientReviewInvoice` (persists across page reloads)
- React Router `location.state` (passes data between steps)
- React Hook Form (`usePersistentForm`)
- `useFastTrackStore` (Zustand with persistence — separate store for fast-track flow)

`patientLoanStore` is not meaningfully populated during the loan application journey. Any feature that reads from it will get stale or null data.

**Resolution:** Either populate `patientLoanStore` as a proper loan flow store (replacing the localStorage approach) or remove it to reduce confusion.

---

## 2. Guarantor Portal Is Referenced but Not Implemented

**Status: Incomplete — routes defined, no content**

The workspace-level CLAUDE.md and authentication docs reference a Guarantors portal (SuperTokens tenant: `guarantors`). Route structure and tenant IDs reference it, but there are no Guarantor-specific pages, stores, or flows implemented in the codebase.

`localStorage.tenantId` can be set to `"guarantors"` but the portal experience does not exist.

**Resolution:** Document the intended guarantor flows before building. The guarantor's primary role is co-signing loans — the UI likely needs loan co-signing screens and notification flows.

---

## 3. Multi-Source State for the Loan Flow Creates Ambiguous Truth

**Status: Design risk — not a bug, but fragile**

The loan application journey (7 steps) stores canonical state in at least three places simultaneously:
- `localStorage["patientReviewInvoice"]` — bill amount, allocations, discount code
- `location.state` (React Router) — data passed between adjacent steps
- React Hook Form (`usePersistentForm`) — individual form field values

When the user navigates non-linearly (back button, direct URL access) or restores a session, the reconciliation logic reads from both `location.state` and `localStorage` with a fallback chain. If they disagree, `location.state` wins for some fields and `localStorage` for others.

**Resolution:** Document the canonical priority order per field (see `loan-application-journey.md`). Long-term, consolidate into a single Zustand store with persistence middleware — the fast-track flow (`useFastTrackStore`) is the right pattern to replicate.

---

## 4. Service Worker Offline Writes Are Not Synced

**Status: By design, but the limitation is undocumented**

The offline-first pattern (`useOfflinePatientData`, `sw.ts`) caches read operations in IndexedDB. However, write operations (payment submission, loan application) are **not queued for later sync** when offline. If a user attempts to submit a payment while offline, it will fail with no background retry.

This is a common PWA trade-off but has not been documented anywhere in the context docs.

**Resolution:** Add a note to `pwa-and-offline.md` and `loan-application-journey.md` that the payment submission step requires online connectivity.
