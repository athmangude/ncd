---
context_version: 1.1
last_updated_commit: 1bd28205
last_updated_date: 2026-07-15
covers: KYC document verification — ID number check, SmileID selfie+document capture, circle requirements, membership payment gate, content-header layout
---

# KYC Verification

## Overview

KYC (Know Your Customer) in Jireh is a 4-step process that unlocks Jireh Medical Loan access and full platform features. It runs after basic account creation (OTP + personal details + PIN). A patient cannot borrow money until KYC is complete.

The flow is managed by `useNextKYCStep` (`src/Routes/Patient/hooks/useNextKYCStep.ts`) which holds the step configuration and completion predicates.

Every KYC screen (`PatientIdVerification`, `PatientDocumentVerification`, `PatientKYCSetupIntro`, `PatientKYCAddCircleMembers`, `PatientPayMembership`) renders through `PatientPageWrapper` with `variant="content"` — see [`component-system.md`](./component-system.md) and [`patient-onboarding-journey.md`](./patient-onboarding-journey.md) for the shared layout mechanics; this doc focuses on the KYC step logic itself, which is unchanged.

---

## KYC Entry Points

- Dashboard CTA → `/patients/kyc-setup-intro`
- Payment flow gate: `getKYCRedirectUrl(user)` returns `/patients/kyc-setup-intro` if any step is incomplete. Called in `PatientWalletSelection` when the user tries to add a Jireh Medical Loan allocation.
- Direct navigation after onboarding success

---

## Step Configuration

```typescript
// src/Routes/Patient/hooks/useNextKYCStep.ts
const KYC_STEP_CONFIG = [
  {
    id: "01",
    label: "National ID number",
    route: "/patients/id-verification",
    checkCompletion: (u) => u?.idVerificationStatus === PatientIdVerificationStatus.VERIFIED
  },
  {
    id: "02",
    label: "Identity Verification",
    route: "/patients/document-verification",
    checkCompletion: (u) => u?.documentVerificationStatus === PatientDocumentVerificationStatus.PASSED
  },
  {
    id: "03",
    label: "Add 2 people to your Circle",
    route: "/patients/kyc-add-circle-members",
    checkCompletion: (u) => {
      const allMembers = [...(u?.network || []), ...(u?.invites || [])]
      const adults = allMembers.filter(m => m.relationship !== "CHILD")
      return adults.length >= 2
    }
  },
  {
    id: "04",
    label: "Pay KES 499",
    description: "One-time-fee",
    route: "/patients/pay-membership",
    checkCompletion: (u) => !!u?.hasActiveMembership
  }
]
```

The hook skips already-completed steps dynamically, so if a user completes step 1 and returns later, they land directly on step 2.

---

## Step 1: National ID Number

**Component**: `PatientIdVerification`
**File**: `src/Routes/Patient/Pages/Onboarding/PatientIdVerification.tsx`

- Collects Kenyan national ID number (text, max 25 chars)
- POST `/patients/verify-id-number` with `{ idNumber: string }`
- Success: `user.idVerificationStatus` becomes `"VERIFIED"` (server updates)
- HTTP 423: User flagged → redirect to `/patients/id-verification-failure` (hard stop)
- Other errors: toast, stays on page

**Analytics events**: `EVENTS.KYC.ID_VERIFICATION_VIEW`, `EVENTS.KYC.ID_VERIFICATION_SUBMIT` (with masked ID), `EVENTS.KYC.ID_VERIFICATION_SUCCESS`, `EVENTS.KYC.ID_VERIFICATION_ERROR`

---

## Step 2: Identity Verification (Document + Selfie)

**Component**: `PatientDocumentVerification`
**File**: `src/Routes/Patient/Pages/Onboarding/PatientDocumentVerification.tsx`

Uses the **SmileID** widget via `SmileIDWrapper` (`src/components/SmileIDWrapper`).

### Document Types Required

SmileID captures two images:
| `image_type_id` | Description |
|----------------|-------------|
| `2` | Selfie (front-facing camera) |
| `3` | National ID card — front photo |

No back-of-ID or other documents are required in this flow.

### Upload Flow

1. SmileID widget renders in-browser camera capture
2. On success, `handleSmileIDSuccess(detail)` extracts `detail.images`
3. Both images are converted from base64 to `Blob` using `dataURLtoBlob()`
4. Posted to `/patients/verify-id-photo-selfie-match` as multipart form data:
   ```
   FormData:
     idDocument: Blob  (field name: "idDocument", filename: "id-photo.jpg")
     selfie: Blob      (field name: "selfie", filename: "selfie.jpg")
   ```
5. `setIsProcessing(true)` shows a loading spinner during API call

### Verification Outcomes

```
API success  → navigate to next KYC step
API failure  → setVerificationFailed(true) → show "Verification Pending" banner
```

The failure state does **not** offer a retry button. The message reads: _"Automatic verification failed. Please wait for our admin verification. An SMS will be sent to you when that is completed."_ The user can navigate back to `/patients` while waiting.

The `documentVerificationStatus` field on the user object tracks this:
- `"PASSED"` = automated or manual verification succeeded
- `"PENDING"` = waiting for admin review
- Other values = not verified

**Analytics events**: `EVENTS.KYC.DOCUMENT_VERIFICATION_VIEW`, `EVENTS.KYC.DOCUMENT_VERIFICATION_SUBMIT`

---

## Step 3: Add 2 Circle Members

**Component**: `PatientKYCAddCircleMembers`
**File**: `src/Routes/Patient/Pages/Onboarding/PatientKYCAddCircleMembers.tsx`

- Checks existing network via `useOfflinePatientData({ endpoint: "/patient-network/network" })`
- If `network + invites` already contains ≥ 2 adult members (non-CHILD), user can skip
- Otherwise, user adds members via an inline form (same `AddCircleMemberInput` component as the general network flow)
- Members are temporarily stored in `localStorage["kyc_circle_members"]`
- On submit: sequential `for` loop of POST `/patient-network/send-invite` for each member
- On all successful: localStorage cleared, navigate to next step

### localStorage Key

```typescript
const KYC_CIRCLE_MEMBERS_STORAGE_KEY = "kyc_circle_members"
// Type: AddCircleMemberInput[]
// Cleared after: successful batch invite submission
```

### What "Adult" Means for KYC

The step-3 completion check filters `relationship !== "CHILD"`. This means children added to the network do not count toward the KYC circle requirement. At least 2 non-CHILD adults must be present.

---

## Step 4: Membership Payment (KES 499)

**Component**: `PatientPayMembership`
**File**: `src/Routes/Patient/Pages/Onboarding/PatientPayMembership.tsx`

- POST `/patients/submit-plan-details` with `{ plan: "JIREH_PLUS" }`
- If response has `authorizationUrl`: redirect to Paystack (`window.location.assign`)
- On Paystack return + payment success: `user.hasActiveMembership` becomes `true`
- The plan `"JIREH_PLUS"` corresponds to the full Jireh Plus membership

**Analytics events**: `EVENTS.KYC.MEMBERSHIP_VIEW`

---

## What Gates Behind KYC Completion

| Feature | Gate |
|---------|------|
| Jireh Medical Loan (wallet selection) | `user.type === "PLUS" || user.hasActiveMembership` AND circle has ≥ 2 accountable slots filled AND circle is not frozen |
| Full credit limit access | `hasActiveMembership` |
| MPESA, Card, Care Fund payments | No KYC gate — available with basic account |
| Care Fund earnings | Available to all users |

The loan gate is checked in `PatientWalletSelection.tsx`:
```typescript
const isLoanOptionDisabled = useMemo(() => {
  const isPlusAccount = user?.type === "PLUS" || user?.hasActiveMembership
  if (!isPlusAccount) return true
  const patientCircle = user?.patientCircle
  return !(
    patientCircle &&
    (patientCircle.filledAccountableSlots ?? 0) >= 2 &&
    patientCircle.status !== "INACTIVE" &&
    patientCircle.isFrozen !== true
  )
}, [...])
```

---

## PatientIdVerificationStatus Enum

```typescript
// src/Routes/Patient/enums/PatientIdVerificationStatus.ts
export enum PatientIdVerificationStatus {
  VERIFIED = "VERIFIED",
  // (other values exist on the server; only VERIFIED matters for completion check)
}

export enum PatientDocumentVerificationStatus {
  PASSED = "PASSED",
  // (other values exist; only PASSED marks step 2 complete)
}
```

---

## Gotchas

1. **Step 2 failure is a UI failure only**: The API still accepts the submission — failure means the automated match did not pass. An admin can manually approve the user on the backend, which updates `documentVerificationStatus` to `"PASSED"`, allowing the user to continue.

2. **Circle members at KYC vs general network**: The KYC flow uses `PatientKYCAddCircleMembers` with a batch localStorage approach. The general network page (`PatientMyNetwork`) uses the live API. Both eventually call the same `/patient-network/send-invite` endpoint, but the KYC flow batches them locally first.

3. **Re-entry into KYC**: If a user navigates directly to `/patients/id-verification` after already completing it, `useNextKYCStep` detects completion and skips to the next incomplete step. This makes KYC re-entry safe.

4. **Network data needed for step 3 completion check**: The KYC circle step fetches `/patient-network/network` using `useOfflinePatientData` to check if the user already has 2+ members. This fetch is made on every render of `PatientKYCAddCircleMembers` and `PatientPayMembership` (so the stepper shows the correct completion state).

5. **`getKYCRedirectUrl` is the payment gate**: Any page that allows loan access must call this before rendering the loan option. Currently used in `PatientWalletSelection`. If KYC is required, user is redirected to intro — the `returnUrl` can be passed in location state to bring them back.
