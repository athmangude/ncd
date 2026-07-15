---
context_version: 1.1
last_updated_commit: 1bd28205
last_updated_date: 2026-07-15
covers: Patient signup and post-signup onboarding — SuperTokens OTP, personal details, PIN, ID verification steps, KYC gate, content-header layout, fresh-signup-vs-established-user gate split
---

# Patient Onboarding Journey

## Overview

Onboarding has two distinct phases:

1. **Basic account creation** (OTP → personal details → PIN): Takes ~2 minutes. Unlocks dashboard access.
2. **KYC / membership activation** (ID number → document verification → circle members → membership payment): Required before a patient can apply for a loan. Takes 5–10 minutes.

The system uses `useOnboardingChecklist` and `useNextOnboardingStep` to route the user through incomplete steps without hardcoding navigation in each page.

**Layout**: nearly every onboarding/KYC screen (`PatientPersonalDetails`, `PatientSetPin`, `PatientIdVerification`, `PatientDocumentVerification`, `PatientKYCSetupIntro`, `PatientKYCAddCircleMembers`, `PatientPayMembership`, `CareProfileSetupIndicator` and the rest of the Care Profile sub-flow, etc.) renders via `PatientPageWrapper` with `variant="content"` — a slim borderless app bar plus a content-level `PageHeader` (icon/title/description/stepper) as the first child of the scrolling body. Terminal/success screens with no back action (`PatientOnboardingSuccess`, `CareProfileSuccess`, `PatientMembershipSuccess`, `PatientAccountLocked`) additionally pass `logoHeader` to swap the bar for the canonical `LogoHeader` instead of a back/help bar. See [`component-system.md`](./component-system.md) for the wrapper's full API.

---

## Auth Provider

SuperTokens `Passwordless` recipe with `contactMethod: "PHONE"`. The tenant ID defaults to `"patients"` and is read by the `Multitenancy.getTenantId()` override from `localStorage["tenantId"]`:

```typescript
// App.tsx
Multitenancy.init({
  override: {
    functions: (oI) => ({
      ...oI,
      getTenantId: () => {
        const tid = localStorage.getItem("tenantId")
        return tid === null ? "patients" : JSON.parse(tid)
      },
    }),
  },
})
```

Org portal users set `tenantId` to a different value before initiating auth. If `tenantId` is absent, the patient portal is assumed.

---

## Phase 1: Basic Account Creation

### Step Sequence

```
/patients/auth/sign-up   PatientSignUp
       ↓  (SuperTokens createCode → OTP SMS sent)
/patients/auth/otp       PatientOTP → VerifyOTPForm
       ↓  (SuperTokens consumeCode)
       ↓  [check inviteId in localStorage → /patients/network/accept-invite]
       ↓  [check referrerId in localStorage → /patients/network/accept-share-link]
       ↓  (none of the above)
/patients/personal-details   PatientPersonalDetails
       ↓  (POST /patients/verify-phone-name-match)
/patients/set-pin             PatientSetPin
       ↓  (POST /patients/set-pin)
/patients/onboarding-success  PatientOnboardingSuccess
       ↓
/patients  (dashboard — limited until KYC complete)
```

### `useNextOnboardingStep` Hook

`src/Routes/Patient/hooks/useNextOnboardingStep.ts`

Defines `ONBOARDING_STEP_CONFIG` — a sequential list of steps with completion predicates:

```typescript
const ONBOARDING_STEP_CONFIG: OnboardingStep[] = [
  {
    id: "otp",
    route: "/patients/auth/otp",
    checkCompletion: (user) => !!user
  },
  {
    id: "personal-details",
    route: "/patients/personal-details",
    checkCompletion: (user) => !!(user?.firstName && user?.lastName)
  },
  {
    id: "set-pin",
    route: "/patients/set-pin",
    checkCompletion: (user) => !!user?.hasSetPin
  },
  {
    id: "id-verification",
    route: "/patients/id-verification-onboarding",
    checkCompletion: (user) => user?.idVerificationStatus === "VERIFIED"
  }
]
```

When called from the OTP page, it first checks `localStorage["inviteId"]` and `localStorage["referrerId"]` to redirect to social flows before proceeding linearly.

### `useOnboardingChecklist` Hook

`src/Routes/Patient/hooks/useOnboardingChecklist.tsx`

Fetches `GET /patients/login-details` on mount. Sets `user` in `patientAuthStore` via `setUser()`. Also sets `user.onboardingRedirectLink`:

- Missing `firstName` or `lastName` → `/patients/personal-details`
- Missing `hasSetPin` → `/patients/set-pin`
- Otherwise → `""` (complete)

`PatientsHome.tsx` runs this query on every authenticated render and uses the redirect link to bounce incomplete users to the right step.

### Fresh-Signup Gap vs. Established-User Gap (`PatientDashboard.tsx`)

`PatientDashboard`'s `Dashboard` inner component splits `onboardingRedirectLink` handling into two cases, not one:

```typescript
// The first two onboarding steps (name, PIN) are the fresh-signup gap right
// after OTP verification — there's no account to show a checklist against
// yet, so send the user straight into the step instead of an intro screen.
const isFreshSignupGap =
  onboardingRedirectLink === "/patients/personal-details" ||
  onboardingRedirectLink === "/patients/set-pin"

if (onboardingRedirectLink && isFreshSignupGap) {
  return <Navigate to={onboardingRedirectLink} replace state={location.state} />
}

if (onboardingRedirectLink) {
  return (
    <IncompleteSignUp
      onboardingRedirectLink={onboardingRedirectLink}
      user={user}
      fromPayMedicalBill={fromPayMedicalBill}
      showBack
    />
  )
}
```

- **Fresh-signup gap** (`personal-details` or `set-pin` missing): a straight `<Navigate>` into the step — there's no existing account to show a checklist against, so an intro/checklist screen would be a pointless extra tap right after OTP.
- **Established-user gap** (anything else incomplete — ID verification, membership, etc.): renders `IncompleteSignUp` (`src/Routes/Patient/components/IncompleteSignUp.tsx`), an `Item`/`ItemGroup`-based checklist (see `component-system.md`'s Item primitive) showing all 4 steps with check/pending state, `showBack` so the user can retreat — this is the "something was skipped" case, not a first-time-through case.

`IncompleteSignUp`'s own `showBack` doc comment makes the asymmetry explicit: `PatientDashboard` never passes `showBack` when it renders `IncompleteSignUp` from the dashboard route directly for the fresh-signup case (it doesn't need to, since that case is now redirected away before `IncompleteSignUp` renders at all) — `showBack` is only true when a real navigable screen (e.g. `CompleteProfilePage`) is the caller.

### Personal Details

`PatientPersonalDetails` POSTs to `/patients/verify-phone-name-match` with `{ matchFields: { first_name, last_name, other_name: "", id_number: "" } }`. HTTP 423 response means the phone number was flagged — redirects to `/patients/id-verification-failure`.

### PIN Setup

`PatientSetPin` is a two-step OTP-style input (enter PIN → confirm PIN). POSTs to `/patients/set-pin`. On success, invalidates the `patientLoginDetails` React Query key to refetch user state.

A user can also change their PIN from the dashboard — `PatientChangePin` uses the same endpoint pattern.

---

## Phase 2: KYC / Membership Activation

### KYC Step Sequence

```
/patients/kyc-setup-intro              PatientKYCSetupIntro
       ↓
/patients/id-verification              PatientIdVerification
       ↓  (POST /patients/verify-id-number)
/patients/document-verification        PatientDocumentVerification
       ↓  (SmileID widget → POST /patients/verify-id-photo-selfie-match)
/patients/kyc-add-circle-members       PatientKYCAddCircleMembers
       ↓  (add 2+ adults to circle via /patient-network/send-invite)
/patients/pay-membership               PatientPayMembership
       ↓  (POST /patients/submit-plan-details with plan: "JIREH_PLUS")
       ↓  → Paystack redirect if payment required
[return] /patients/membership-success  PatientMembershipSuccess
```

### `useNextKYCStep` Hook

`src/Routes/Patient/hooks/useNextKYCStep.ts`

Defines `KYC_STEP_CONFIG`:

```typescript
const KYC_STEP_CONFIG: KYCStep[] = [
  {
    id: "01",
    label: "National ID number",
    route: "/patients/id-verification",
    checkCompletion: (u) => u?.idVerificationStatus === "VERIFIED"
  },
  {
    id: "02",
    label: "Identity Verification",
    route: "/patients/document-verification",
    checkCompletion: (u) => u?.documentVerificationStatus === "PASSED"
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
    route: "/patients/pay-membership",
    checkCompletion: (u) => !!u?.hasActiveMembership
  }
]
```

Helper exported for use in payment flows:
```typescript
export function getKYCRedirectUrl(user: any): string | null {
  if (requiresKYCVerification(user)) return "/patients/kyc-setup-intro"
  return null
}
```

This is called in `PatientWalletSelection` — if a user attempts to use a Jireh Medical Loan without completing KYC, they are redirected to `KYC_START_URL`.

### Identity Verification

`PatientIdVerification` — enters national ID number, POSTs to `/patients/verify-id-number`. 423 response → `/patients/id-verification-failure`.

`PatientDocumentVerification` — uses the **SmileID** widget (`SmileIDWrapper`). The widget captures:
- image_type_id 2: selfie
- image_type_id 3: ID card front photo

Both are converted from base64 to `Blob` and sent as multipart to `/patients/verify-id-photo-selfie-match`. On automatic verification failure, the page shows a "Verification Pending" message instructing the user to wait for manual admin review (SMS notification). The user can return to the home dashboard while waiting.

### Circle Members During KYC

`PatientKYCAddCircleMembers` collects member data in a list stored in `localStorage["kyc_circle_members"]`. Members are submitted in batch (`for` loop of sequential POSTs to `/patient-network/send-invite`). localStorage is cleared after successful submission.

### Membership Payment

`PatientPayMembership` POSTs to `/patients/submit-plan-details` with `plan: "JIREH_PLUS"`. If the response contains `authorizationUrl`, the user is redirected to Paystack for payment. On return, the KYC checklist completion is re-evaluated.

---

## localStorage Keys Used in Onboarding

| Key | Written by | Purpose |
|-----|-----------|---------|
| `approved_patient_phone_number` | `PatientSignUp` on OTP dispatch | Pre-fill phone number if user returns to signup page |
| `inviteId` | External invite link handler | Redirect after OTP to accept circle invite |
| `referrerId` | Share link handler | Redirect after OTP to accept referral |
| `kyc_circle_members` | `PatientKYCAddCircleMembers` | Persist circle member inputs across refresh |
| `tenantId` | Portal selection | Determines which SuperTokens tenant to use |

---

## `patientAuthStore` During Onboarding

```typescript
// patientAuthStore.tsx
{
  user: null,                    // null until first login-details fetch
  signUpDetails: SignUpDetails,  // accumulated during multi-step signup
  setSignUpDetails(details),     // called after OTP entry
  setUserId(userId, amplitudeToken, loginTime),  // called after OTP success
  setUser(user),                 // called by useOnboardingChecklist on every fetch
  signOut()                      // Session.signOut() + clears localStorage + sessionStorage + IndexedDB
}
```

The `user.onboardingRedirectLink` field (set by `useOnboardingChecklist`) is how `PatientsHome` knows where to bounce incomplete users. It is **not** a store field — it is mixed into the `user` object.

---

## Post-Onboarding: Care Profile Setup

After the basic onboarding steps, patients can optionally complete a "Care Profile":

```
/patients/care-profile-setup   CareProfileSetupIndicator
  → /patients/select-insurance  PatientSelectInsurance
  → /patients/favorite-providers PatientFavoriteCareProviders
  → /patients/healthcare-focus  PatientHealthcareFocus
  → /patients/ncd-status        PatientNCDStatus
  → /patients/care-profile-success CareProfileSuccess
```

This is a separate opt-in flow, not gated on basic account activation.

---

## Gotchas

1. **Tenant ID defaults to `"patients"`**: If `localStorage["tenantId"]` is missing, SuperTokens uses the `"patients"` tenant. Org portal users must set this before authentication or they'll be authenticated to the wrong tenant.

2. **inviteId check is order-sensitive**: `useNextOnboardingStep` checks `inviteId` before `referrerId`. If both are present, invite takes priority.

3. **423 from personal-details**: The API validates name vs. phone number against a registry. A 423 means the combination was flagged — the user is hard-bounced to a failure page, not given a retry.

4. **SmileID auto-fail path**: When SmileID returns an error or the selfie/ID match fails, the page shows a "manual review" message. There is no retry within the same session — the user must return and re-attempt later, or wait for admin review.

5. **`hasActiveMembership` gate**: This is checked throughout the app (loan eligibility, wallet selection). A user who has completed ID verification but not paid membership cannot access loans.
