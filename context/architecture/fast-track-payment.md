---
context_version: 1.0
last_updated_commit: 14d2d4e9
last_updated_date: 2026-04-08
covers: Fast Track payment flow — Zustand store with localStorage persistence, step sequence, differences from normal payment
---

# Fast Track Payment

## Overview

Fast Track is a point-of-sale payment method for patients who are physically at a Jireh-partnered healthcare facility. Instead of uploading an invoice image, the patient enters a **6-digit payment number** displayed on a screen at the facility's payment station. This number identifies the specific payment point (department + facility) to receive the payment.

Fast Track is faster than the standard invoice flow because it skips invoice upload, AI extraction, and manual review. The facility's billing system already has the invoice details on file.

**Key difference from standard payment**: No invoice photo, no AI extraction, no `patientReviewInvoice` localStorage key. All state is managed in a Zustand store with localStorage persistence.

---

## Route Namespace

```
/patients/fast-track/
```

All routes are wrapped in `FastTrackWrapper` → `FastTrackStepGuard` → individual route components.

**Files**:
```
src/Routes/Patient/Pages/FastTrack/
  FastTrackWrapper.tsx         — route definitions (5 active routes)
  FastTrackStepGuard.tsx       — step validation guard
  useFastTrackStore.ts         — Zustand store with persist middleware
  ResolveProvider.tsx          — Step 1: enter 6-digit payment number
  PaymentDetails.tsx           — Step 2: enter invoice number, amount, select patient
  FastTrackWalletSelection.tsx — Step 3: choose payment methods
  ConfirmPayment.tsx           — Step 4: review and confirm with PIN
  PaymentStatus.tsx            — Step 5: transaction result
  PaymentTypeSelection.tsx     — Unused/planned component (NOT in route tree). Routes users between the in-network Fast Track flow and the out-of-network `/patients/payment/request-payment/how-to-pay` flow. File exists but FastTrackWrapper.tsx does not register a route for it.
  api.ts                       — API call functions
  types.ts                     — TypeScript interfaces
```

---

## Step Sequence

```
/patients/fast-track/resolve-provider   ResolveProvider
       ↓  POST /fast-track/resolve-provider (6-digit number → facility + department + payment point)
/patients/fast-track/payment-details    PaymentDetails
       ↓  (enter invoice number, invoice amount, select patient)
/patients/fast-track/wallet-selection   FastTrackWalletSelection
       ↓  (choose MPESA / Jireh Loan / Care Fund / Discount)
/patients/fast-track/confirm            ConfirmPayment
       ↓  PIN entry via PatientPinPrompt → POST /fast-track/initiate
       ↓  ┌─ has paymentRedirectUrl → window.location.href = redirectUrl (Paystack)
          └─ no redirect → setPaymentSubmitted(true) → navigate to /status

/patients/fast-track/status             PaymentStatus
```

---

## `useFastTrackStore` — Store Shape

`src/Routes/Patient/Pages/FastTrack/useFastTrackStore.ts`

Uses Zustand `persist` middleware. Persists to `localStorage["fast-track-storage"]`.

```typescript
interface FastTrackState {
  // Step 1: provider resolution
  paymentNumber: string           // 6-digit payment number entered by user
  provider: FastTrackPaymentPoint | null  // resolved facility+department+point

  // Step 2: invoice details
  invoiceNumber: string
  invoiceAmount: string           // stored as string; parsed to float for math
  selectedPatientId: string
  patient: SelectedPatient | null // full patient object after selection

  // Discount
  discountAmount: string          // string form of discount
  discountCode: string

  // Step 3: wallet allocation
  allocations: Allocations        // same shape as loan flow (walletId → WalletAllocation)
  splits: PaymentSplit[]          // simplified splits array for the API

  // Step 4/5: transaction tracking
  transaction: FastTrackTransaction | null
  paymentSubmitted: boolean       // true after successful payment initiation

  // Actions
  setPaymentNumber, setProvider, setInvoiceNumber, setInvoiceAmount,
  setSelectedPatientId, setDiscountAmount, setDiscountCode,
  setAllocations, setSplits, setPatient, setTransaction,
  setPaymentSubmitted, reset
}
```

The `persist` configuration:
```typescript
persist(storeDefinition, {
  name: "fast-track-storage",
  partialize: (state) => ({
    transaction: state.transaction,
    paymentSubmitted: state.paymentSubmitted,
  }),
})
```

Only `transaction` and `paymentSubmitted` are persisted to `localStorage["fast-track-storage"]` via `partialize`. Input fields (`paymentNumber`, `provider`, `invoiceAmount`, `allocations`, etc.) are intentionally transient and reset on page reload.

---

## `FastTrackStepGuard` — Step Validation

`FastTrackStepGuard` wraps all routes and validates that the user has the required data before accessing each step. It reads directly from the store (no network calls):

```typescript
// Step validation matrix
"/resolve-provider"  → always accessible
"/payment-details"   → requires: hasProvider
"/wallet-selection"  → requires: hasProvider, hasInvoiceDetails, hasPatient
"/confirm"           → requires: hasProvider, hasInvoiceDetails, hasPatient, hasSplits
"/status"            → requires: hasTransaction OR paymentSubmitted
```

```typescript
// Computed requirements
hasProvider: provider !== null
hasInvoiceDetails: invoiceNumber.trim() !== "" && parseFloat(invoiceAmount) > 0
hasPatient: patient !== null
hasSplits: splits.length > 0
hasTransaction: transaction !== null
```

Special case: if `paymentSubmitted === true` and the user is not on `/status`, they are force-redirected to `/status`. This prevents re-submission after a successful payment.

---

## Step 1: Resolve Provider

`ResolveProvider.tsx`

- 6-digit numeric OTP-style input (`InputOTP`)
- On entry + submit: `resolveProvider(paymentNumber)` → GET `/fast-track/resolve-provider?paymentNumber=...`
- Displays resolved facility/department/payment station details
- On confirm: `setProvider(data)` → navigate to `/payment-details`

**Key behaviour**: If `paymentNumber` changes after a provider is resolved, the stored provider is cleared and the input resets.

---

## Step 2: Payment Details

`PaymentDetails.tsx`

- Collects invoice number, invoice amount, selects patient (self or dependent)
- Calls `setInvoiceNumber`, `setInvoiceAmount`, `setPatient` on the store
- If the user doesn't have the dependent in their network, they can add one: navigates to `/patients/network/add-connection` with `state: { from: "fast-track-payment-details" }`

---

## Step 3: Wallet Selection

`FastTrackWalletSelection.tsx`

Functionally similar to `PatientWalletSelection` in the loan flow. Key differences:
- Uses `useFastTrackStore` instead of `patientReviewInvoice` localStorage
- Sets `splits` (array) and `allocations` (map) on the store
- `splits` is used directly in the API payload; `allocations` drives the UI display

**Split modes** (`SplitMode` type):
```typescript
type SplitMode = "MPESA" | "LOAN" | "CAREFUND" | "DISCOUNT"
```

Note: uses `"CAREFUND"` (not `"CASHBACK"` as in the loan flow). The API endpoint is different (`/fast-track/initiate` vs `/payments/user/initiate-multi-payment`).

---

## Step 4: Confirm Payment

`ConfirmPayment.tsx`

- Reads all data from the store
- `PatientPinPrompt` drawer for PIN entry
- Builds `InitiateFastTrackPaymentDto`:

```typescript
interface InitiateFastTrackPaymentDto {
  paymentNumber: string         // from provider.paymentNumber
  amount: number                // invoiceAmount (gross)
  invoiceNumber: string
  patientId: string
  splits: PaymentSplit[]        // [{ mode, amount, repaymentPeriodDays? }]
  discountAmount?: number       // 0 if no discount
  repaymentPeriodDays?: number  // from LOAN split; defaults to 31 if not set
}
```

- POSTs to `/fast-track/initiate` via `PatientPinPrompt` form mechanism
- On success: if `paymentRedirectUrl` present → `window.location.href = redirectUrl` (Paystack). **Important**: `setPaymentSubmitted(true)` is NOT called before the redirect to avoid the StepGuard flashing the status page. `setTransaction(data)` is called to persist for when the user returns.
- On success without redirect: `setTransaction(data)` + `setPaymentSubmitted(true)` + navigate to `/status`

---

## Step 5: Payment Status

`PaymentStatus.tsx`

Displays the `FastTrackTransaction` from the store:

```typescript
interface FastTrackTransaction {
  id: string
  providerId: number
  patientId: string
  invoiceNumber: string
  paymentNumber: string
  totalBillAmount?: string
  grossAmount?: string
  providerName: string
  discountAmount: string
  netAmount: string
  paymentModeTags: SplitMode[]
  status: "HOLDING" | "SETTLED" | "DISBURSED" | "PENDING"
  createdAt: string
  provider: FastTrackProvider
  patient: FastTrackPatient
  paymentRedirectUrl?: string
  paymentSplitResults?: FastTrackSplitResult[]
  transactionId?: string
}
```

---

## Differences from Standard (Invoice Upload) Payment

| Aspect | Standard Flow | Fast Track |
|--------|--------------|------------|
| Entry method | Invoice photo upload | 6-digit payment number |
| Data extraction | AI-assisted, API extracts patient/facility/amount | Manual entry by patient |
| State storage | `localStorage["patientReviewInvoice"]` | `localStorage["fast-track-storage"]` (Zustand persist) |
| State mechanism | Plain localStorage reads/writes | Zustand store with persist middleware |
| Out-of-network handling | Manual review queue, polling, PENDING/APPROVED/REJECTED | N/A — only in-network facilities have payment points |
| API endpoint | `POST /payments/user/initiate-multi-payment` | `POST /fast-track/initiate` |
| Split modes | MPESA, CARD, CASHBACK, LOAN, DISCOUNT | MPESA, LOAN, CAREFUND, DISCOUNT |
| Step guard | `ProtectedLoanStep` + localStorage status check | `FastTrackStepGuard` + Zustand state check |
| Payment type selection | Arbitrary split via allocations drawer | Same drawer pattern |

---

## Persistence Strategy

The `useFastTrackStore` uses Zustand `persist` middleware with `partialize` — only **`transaction` and `paymentSubmitted`** are persisted to `localStorage["fast-track-storage"]`. Input fields (`paymentNumber`, `invoiceAmount`, `provider`, `allocations`, etc.) are intentionally transient and reset on page reload.

This means:
- After a successful payment, the transaction result survives browser close
- `FastTrackStepGuard` can read `paymentSubmitted` on initial render to redirect to `/status`
- Input fields do NOT survive reload — a user who closes mid-flow will need to start over
- `store.reset()` must be called explicitly to clear the persisted transaction (typically called on `PaymentStatus` page after the user navigates away)

**Warning**: If `paymentSubmitted: true` persists in the store and the user opens the app, they will always be redirected to `/status`. The status page must call `store.reset()` or `setPaymentSubmitted(false)` when the user finishes viewing results.

---

## Analytics Events

All `FAST_TRACK_PAYMENT` events are defined in `src/analytics/events.ts`. Full list:

| Event constant | When fired |
|---------------|-----------|
| `TYPE_SELECTION_VIEW` | On mount of `PaymentTypeSelection` (file exists but not in active route tree) |
| `RESOLVE_PROVIDER_VIEW` | On mount of `ResolveProvider` |
| `PAYMENT_POINT_VIEWED` | On successful provider resolution |
| `PAYMENT_DETAILS_VIEW` | On mount of `PaymentDetails` |
| `PAYMENT_INITIATED` | When payment initiation starts |
| `WALLET_SELECTION_VIEW` | On mount of `FastTrackWalletSelection` |
| `WALLET_ALLOCATE` | When a wallet allocation is selected |
| `CONFIRM_VIEW` | On mount of `ConfirmPayment` |
| `AUTHORIZATION_ATTEMPT` | Before submitting payment (in `handleBeforeSubmit`) |
| `PAYMENT_COMPLETED` | On successful payment response |
| `PAYMENT_FAILED` | On payment error |
| `PAYMENT_REFUNDED` | Defined in `events.ts` but not currently fired anywhere in the Fast Track flow (planned/unused) |
| `RESULT_VIEW` | On mount of `PaymentStatus` |
