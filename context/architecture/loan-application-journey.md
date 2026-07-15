---
context_version: 1.0
last_updated_commit: 14d2d4e9
last_updated_date: 2026-04-08
covers: Patient loan/payment application flow — step sequence, localStorage keys, wallet allocation shape, OTP confirmation, discount codes
---

# Loan Application Journey

## Overview

The "loan application" is the primary payment flow for patients requesting healthcare financing. Despite the name, it covers all payment types — M-Pesa, card, Jireh Medical Loan (micro-credit), Care Fund cashback, and hybrid splits. The user photographs an invoice, Jireh extracts data via AI, the user selects how to pay, and submits via PIN.

There are two distinct paths depending on whether the provider is an in-network (KMPDC-verified) facility:

- **In-network (APPROVED)**: Full automated flow with wallet selection and payment splits
- **Out-of-network / manual review**: Flow ends at `verification-pending` where an ops team member manually reviews and approves the request

---

## Route Namespace

All steps live under:
```
/patients/payment/request-payment/
```

Defined in `PatientLoanRequestWrapper.tsx`:
```
src/Routes/Patient/Pages/Loans/RequestLoan/PatientLoanRequestWrapper.tsx
```

---

## Step Sequence

```
[Entry points]
  /patients            → /how-to-pay (via useNextLoanApplicationStep)
  /patients/care-fund  → /how-to-pay

[Step 1]  /how-to-pay              PatientHowToPay
[Step 2]  /upload-invoice          PatientUploadInvoice
[Step 3]  /review-invoice          PatientReviewInvoice
    |
    ├─ In-network (status=APPROVED) → /wallet-selection
    └─ Out-of-network               → /verification-pending
                                        (polls every 5s until APPROVED/REJECTED)
                                      When APPROVED, returns to /wallet-selection

[Step 4]  /wallet-selection        PatientWalletSelection     (ProtectedLoanStep)
[Step 5]  /payment-confirmation    PatientPaymentConfirmation (ProtectedLoanStep)
    |
    ├─ Has paymentRedirectUrl → window.location.assign(redirectUrl)  [Paystack]
    └─ No redirect            → /patients/payment-status?paymentId=...

[Side steps]
  /select-patient    PatientSelectPatient
  /treatment-details PatientTreatmentDetails
  /set-bill-amount   PatientSetBillAmount
  /invoice-guide     PatientInvoiceGuide
  /loan-terms        PatientLoanTerms  (legacy / ORG flow)
  /verification-pending PatientVerificationPending
```

`useNextLoanApplicationStep` (`src/Routes/Patient/hooks/useNextLoanApplicationStep.ts`) maps each route to its successor using a static `Map<string, string>`. It reads `location.pathname` and returns the next URL.

---

## ProtectedLoanStep Guard

`ProtectedLoanStep.tsx` wraps `/wallet-selection`, `/payment-confirmation`, and `/loan-terms`. On render it reads `localStorage["patientReviewInvoice"]` and `localStorage["manualPaymentRequestId"]`:

```
No data + has manualRequestId  → redirect to /verification-pending
No data at all                 → redirect to /upload-invoice
data.status === "PENDING"      → redirect to /verification-pending
data.status === "REJECTED"     → redirect to /verification-pending
data.status === "APPROVED"     → render children
otherwise                      → redirect to /review-invoice
```

---

## Key localStorage Keys

| Key | Type | Written by | Read by | Purpose |
|-----|------|-----------|---------|---------|
| `patientReviewInvoice` | Object (see shape below) | `PatientUploadInvoice` (AI extraction response), `PatientReviewInvoice` (selectedPaymentInfo), `PatientWalletSelection` (allocations, discountCode) | All protected steps | Single source of truth for the entire in-progress payment |
| `manualPaymentRequestId` | `string` (UUID) | `PatientReviewInvoice` on POST success | `ProtectedLoanStep`, `PatientPaymentConfirmation`, `PatientVerificationPending` | Tracks the manual review request ID when out-of-network |
| `paymentId` | `string` | `PatientPaymentConfirmation` on success | Payment status page | Reference to submitted payment |
| `paymentResponse` | Object | `PatientPaymentConfirmation` on success | Payment status page | Full payment response for display |

The `patientReviewInvoiceStorageKey` constant (`"patientReviewInvoice"`) is exported from `PatientUploadInvoice.tsx` and imported by every subsequent step.

### `patientReviewInvoice` Object Shape

This object is built incrementally as the user moves through steps:

```typescript
interface PatientReviewInvoiceStorage {
  // Populated by AI extraction (POST /patients/upload-medical-invoice response)
  patient?: {
    id: string
    firstName: string
    lastName: string
    status: string
  }
  dependent?: {
    id: string
    firstName: string
    lastName: string
    type: string
  }
  kmpdcFacility?: {
    id: string
    name: string
    facility: {
      id: number
      facilityVerificationStatus: "APPROVED" | "PENDING" | string
    }
  }
  facilityName?: string
  billAmount?: number
  invoiceFile?: {
    id: string
    careProviderName: string
  }
  paymentInfo?: {
    "payment-type"?: "MPTILL" | "MPAYBILL"
    "till-number"?: string
    "business-number"?: string
    "account-number"?: string
  }

  // Populated by PatientReviewInvoice
  selectedPaymentInfo?: {
    source: "invoice_payment_info"
    type: "MPTILL" | "MPAYBILL"
    tillNumber?: string
    businessNumber?: string
    accountNumber?: string
  }

  // Populated by PatientWalletSelection
  allocations?: Allocations    // see types.ts
  discountCode?: string
  appliedDiscount?: DiscountCodeResponse
  creditLimit?: { remainingAmount: string; ... }

  // Populated by PatientVerificationPending (polling response merged)
  status?: "PENDING" | "APPROVED" | "REJECTED"

  // Optional: out-of-network facility
  oonFacility?: any
}
```

---

## Data Flow Between Steps

### Upload Invoice → Review Invoice

`PatientUploadInvoice` POSTs to `/patients/upload-medical-invoice` (multipart). On success, if the response contains extracted data (`patient`, `kmpdcFacility`, etc.), it calls:
```typescript
setToLocalStorage("patientReviewInvoice", extractedDataResponse)
```
Then navigates to the next step passing `fileIds` in React Router state.

### Review Invoice → Wallet Selection / Verification Pending

`PatientReviewInvoice` reads `patientReviewInvoice` from localStorage. On "Choose how to pay" click, it POSTs to `/payments/manual-review-request`. On success:
- Writes `manualPaymentRequestId` to localStorage
- If the facility is in-network (APPROVED), navigates to `/wallet-selection`
- Otherwise navigates to `/verification-pending`

### Verification Pending → Wallet Selection

`PatientVerificationPending` polls `/payments/manual-review-request/:id` every 5 seconds. When status becomes `"APPROVED"`, it merges the response into `patientReviewInvoice` in localStorage. The status update in localStorage is what allows `ProtectedLoanStep` to pass the user through to `/wallet-selection`.

### Wallet Selection → Payment Confirmation

`PatientWalletSelection` builds an `Allocations` map (walletId → `WalletAllocation`) and persists it into `patientReviewInvoice.allocations` in localStorage. On proceeding, it passes the full allocation set in React Router state:

```typescript
navigate(next, {
  state: {
    allocations,
    walletAllocations,   // array form for payment API
    totalBillAmount,
    originalBillAmount,
    repaymentPeriodDays,
    discountCode,
    discountAmount,
    careProvider,
    patient,
    fileId,
    paymentInfo,
    ...
  }
})
```

### Payment Confirmation — Fallback Chain

`PatientPaymentConfirmation` applies this data resolution:
1. Uses `location.state` if complete (`careProvider + patient + fileId + totalBillAmount + walletAllocations` all present)
2. Otherwise falls back to `localStorage["patientReviewInvoice"]` to reconstruct missing fields

This prevents data loss when the user refreshes between steps.

---

## Wallet Allocation Object Shape

```typescript
// types.ts
export type WalletType = "CARD" | "MPESA" | "CASHBACK" | "LOAN" | "DISCOUNT" | "DISCOUNTS"

export type WalletAllocation = {
  amount: number
  repaymentPeriodDays?: number   // only for LOAN type
  type?: WalletType
  phoneNumber?: string           // only for MPESA type
  walletId: string               // UUID from user.wallets[].id
  discountCode?: string          // only for DISCOUNT type
}

export type Allocations = Record<string, WalletAllocation>  // keyed by walletId
```

The wallet selection page enforces mutual exclusivity: **MPESA and CARD cannot both be allocated**. Selecting one automatically removes the other.

Loan eligibility gate:
```typescript
// isLoanOptionDisabled
const isPlusAccount = user.type === "PLUS" || user.hasActiveMembership
const isCircleEligibleForLoan =
  patientCircle.filledAccountableSlots >= 2 &&
  patientCircle.status !== "INACTIVE" &&
  patientCircle.isFrozen !== true
return !isPlusAccount || !isCircleEligibleForLoan
```

---

## Discount Code Application

1. User enters a code in `PatientWalletSelection`
2. POST to `/discount-codes/validate` with `{ code, orderAmount, userId, kmpdcFacilityId? }`
3. Response: `{ isValid: boolean, discountAmount: string, message?: string }`
4. If valid, a synthetic "DISCOUNT" allocation is created:
   ```typescript
   allocations[discountWallet.id] = {
     amount: Math.round(parseFloat(discountAmount)),
     type: "DISCOUNT",
     discountCode: code.toUpperCase().trim(),
     walletId: discountWallet.id,
   }
   ```
5. On payment success in `PatientPaymentConfirmation`, calls POST `/discount-codes/apply` silently (does not block the payment flow if this call fails)

Discount code state is re-validated if the bill amount changes (debounced 500ms).

---

## OTP / PIN Confirmation

Payment does NOT use OTP; it uses a **Jireh PIN** entered in `PatientPinPrompt`.

`PatientPinPrompt` (shared component) renders a drawer with a PIN input. On submit, it calls `beforeSubmit()` (provided by the page) to build the final payment payload, then POSTs to `/payments/user/initiate-multi-payment` with the PIN attached.

The `PaymentRequest` payload structure:
```typescript
type PaymentRequest = {
  totalBillAmount: number          // originalBillAmount (before discount)
  medicalInvoiceFileId: string
  paymentSplits: PaymentSplitRequest[]
  kmpdcFacilityId: string
  patientName: string
  repaymentPeriodDays?: number     // from LOAN allocation
  manualPaymentRequestId?: string  // if out-of-network
}

type PaymentSplitRequest = {
  walletId: string
  paymentAmount: number
  type?: "MPESA" | "CARD" | "LOAN" | "CASHBACK" | "DISCOUNT"
  discountCode?: string
}
```

On success, if `paymentRedirectUrl` is present in the response, the app does `window.location.assign(redirectUrl)` (Paystack redirect for card payments). Otherwise navigates to `/patients/payment-status?paymentId=...`.

---

## `usePersistentForm` and Legacy Steps

`PatientLoanTerms`, `PatientSelectPatient`, `PatientTreatmentDetails`, and `PatientSetBillAmount` use `usePersistentForm` (from `src/hooks/usePersistentForm.tsx`). This hook wraps React Hook Form and automatically persists form values to `localStorage` on every change using `watch()`. The storage keys are:

| Component | Storage Key |
|-----------|------------|
| `PatientLoanTerms` | `patientLoanTerms` |
| `PatientSelectPatient` | `patientSelectPatient` |
| `PatientTreatmentDetails` | `patientTreatmentDetails` |
| `PatientSetBillAmount` | `patientSetBillAmount` |

`clearPeristentForm([...keys])` (note spelling: "peristentForm") is a utility that bulk-removes these localStorage entries. It's called on successful loan submission in `PatientLoanTerms`.

---

## `usePatientLoanStore`

`src/Routes/Patient/stores/patientLoanStore.tsx` is a minimal Zustand store with a single `{ loan, setLoan }` shape. It does **not** use the `persist` middleware. As of the current codebase, it is not the primary mechanism for loan flow state — that role is played by `patientReviewInvoice` in localStorage.

---

## Cashback Banner

`CashbackBanner` appears in `PatientReviewInvoice` when the facility is in-network (`facilityVerificationStatus === "APPROVED"`). The displayed cashback is a 5% estimate: `billAmount * 0.05`. This is a UI estimate only — actual cashback is computed server-side.

---

## Gotchas and Warnings

1. **Status field in localStorage drives the guard**: `ProtectedLoanStep` reads `localStorage["patientReviewInvoice"].status`. If the status field is not present (old data shape), the guard redirects to `/review-invoice`, not `/wallet-selection`. After verification polling sets status to `"APPROVED"`, the guard lets the user through.

2. **Discount wallet type inconsistency**: The API returns wallet type as `"DISCOUNTS"` (plural) but the app handles both `"DISCOUNT"` and `"DISCOUNTS"` when looking for the discount wallet.

3. **manualPaymentRequestId persists across sessions**: This key is not cleared by `patientReviewInvoice` removal. The `signOut` action in `patientAuthStore.tsx` explicitly removes it along with `patientReviewInvoice`.

4. **MPESA/CARD are mutually exclusive**: The wallet selection page enforces this with a toast notification and automatic removal of the other allocation.

5. **repaymentPeriodDays defaults to 31**: In `ConfirmPayment.tsx` (Fast Track), a missing `repaymentPeriodDays` defaults to 31 days. In the regular flow, it must be explicitly set in the loan allocation.
