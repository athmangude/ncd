---
context_version: 1.1
last_updated_commit: 1bd28205
last_updated_date: 2026-07-15
covers: Patient / Org / Guarantor portal isolation — route namespaces, SuperTokens tenants, wrong-portal prevention, shared vs portal-specific components — NOTE: describes target jireh-core-client architecture; this repo implements Patient only
---

# Portal Isolation

## Scope note

This doc describes the target `jireh-core-client` multi-portal design. **This repo (`ux-prototype`) implements the Patient portal only** — there is no `src/Routes/Organizations/` directory, no Org routes, no live SuperTokens Multitenancy backend (the recipe is mocked). See [`routing.md`](./routing.md)'s scope note for the concrete inventory of what does/doesn't exist here. The isolation *mechanisms* described below (tenant guard hook, route subtree separation, store isolation) are still an accurate description of the pattern the code follows even with only one portal live — they're just not currently protecting a second, real portal.

## Overview

The app currently serves two distinct user types from a single codebase, with a third planned:

| Portal | Route prefix | User type | Auth method | Status |
|--------|-------------|-----------|-------------|--------|
| Patient | `/patients/*` | Patients and caregivers | SuperTokens Passwordless (SMS OTP) | Live |
| Organization | `/organizations/*` | Healthcare provider staff | SuperTokens Email/Password + OAuth | Live |
| Guarantor | `/guarantors/*` | Financial co-signatories for loans | SuperTokens Email/Password | **Route not yet implemented** |

The Guarantor tenant (`"guarantors"`) is recognized by `Home.tsx` and `InvalidTenantPage.tsx` — if a user with this tenant ID logs in, `Home.tsx` navigates to `/guarantors/` — but no route exists for this prefix in `RouterWrapper.tsx`. The catch-all `*` redirects them to `/`. This is a planned portal, not a live one.

Each live portal has its own:
- Route subtree
- Zustand store (`patientAuthStore`, `orgUserStore`)
- API base paths
- SuperTokens tenant

---

## Route Architecture

Top-level routing is handled in `RouterWrapper.tsx` (creates `BrowserRouter` via `createBrowserRouter`):

```
/                   → Home (session check → tenant-based redirect)
/circles/join       → JoinCircleRedirect
/circles/join/qr    → JoinCircleRedirect
/verify-email       → VerifyEmailPage
/patients/*         → Patient portal (PatientWrapper)
/organizations/*    → Org portal (OrgWrapper)
/unauthorized       → UnauthorizedPage
/invalid-tenant     → InvalidTenantPage
*                   → Navigate to /

NOTE: /guarantors/* does NOT exist in RouterWrapper — it is planned but not yet implemented.
      Patient auth routes live under the /patients/* subtree (defined in PatientWrapper),
      not as their own top-level route entry in RouterWrapper.
      Org auth routes live under the /organizations/* subtree (defined in OrgWrapper),
      not as their own top-level route entry in RouterWrapper.
```

### Patient Portal Routes (`PatientsHome.tsx`)

All patient routes are behind `SessionAuth` (SuperTokens session check). The `PatientsHome` component uses `useOnboardingChecklist` on mount to:
1. Fetch user details from `/patients/login-details`
2. Set the user in `patientAuthStore`
3. Determine `onboardingRedirectLink` and bounce the user if incomplete

```
/patients                → dashboard redirect
/patients/home           → PatientDashboard
/patients/auth/*         → auth pages (outside SessionAuth)
/patients/network/*      → PatientNetworkWrapper
/patients/care-fund/*    → PatientCareFundRoutes
/patients/fast-track/*   → FastTrackWrapper
/patients/payment/*      → PaymentWrapper + PaymentRequestWrapper
/patients/loans/*        → LoanWrapper
/patients/kyc-setup-intro, /patients/id-verification, etc. → KYC pages
```

---

## SuperTokens Multi-Tenancy

The app uses SuperTokens `Multitenancy` recipe. The tenant is determined at authentication time via:

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

| Portal | localStorage["tenantId"] value | Notes |
|--------|-------------------------------|-------|
| Patient | `null` or absent | Defaults to `"patients"` |
| Organization | `"organizations"` | Current org route code paths set this value before `/organizations/*` auth flows |
| Guarantor | `"guarantors"` | Recognized by Home.tsx but no route exists yet — navigates to `/guarantors/` which falls through to catch-all |

**How tenant switching works**: Before navigating to the org auth page, the app sets `localStorage["tenantId"]` to the org's tenant value. This ensures the subsequent SuperTokens session is associated with the correct tenant.

If a patient navigates to `/organizations/*`, they will be checked for an org session. Since they have a patient session, they are redirected to the login page. The sessions are tenant-scoped and do not cross.

If the wrong tenant is detected, the API returns HTTP 403, and `useOnboardingChecklist` catches it:
```typescript
if (error.response?.status === 403) {
  navigate("/invalid-tenant")
  return null
}
```

---

## Authentication Recipes by Portal

All recipes are registered in `App.tsx` at startup:

```typescript
SuperTokens.init({
  usesDynamicLoginMethods: true,
  recipeList: [
    Session.init({ tokenTransferMethod: ... }),
    Passwordless.init({ contactMethod: "PHONE" }),  // Patient OTP
    ThirdParty.init(),                               // OAuth (org)
    EmailPassword.init({ ... }),                     // Org + Guarantor login
    EmailVerification.init({ mode: "REQUIRED", disableDefaultUI: true }),
    Multitenancy.init({ ... }),
  ],
})
```

`usesDynamicLoginMethods: true` means SuperTokens fetches the login methods for the current tenant dynamically. This allows different tenants (patient, org, guarantor) to use different login methods without separate app builds.

---

## Session Token Transfer

In production: cookies (browser-managed, same domain).
In local development with a remote API: header-based tokens.

```typescript
const isHeaderTokenTransferDev =
  import.meta.env.DEV &&
  import.meta.env.VITE_SESSION_TOKEN_TRANSFER_METHOD === "header"

Session.init({ tokenTransferMethod: isHeaderTokenTransferDev ? "header" : "cookie" })
```

When `isHeaderTokenTransferDev` is true, Axios interceptors are added via `Session.addAxiosInterceptors(axios)` so session tokens are injected into every request.

---

## Zustand Store Isolation

Each portal has its own Zustand store:

| Store | File | Portal |
|-------|------|--------|
| `usePatientAuthStore` | `src/Routes/Patient/stores/patientAuthStore.tsx` | Patient |
| `useOrgUserStore` | `src/Routes/Organizations/stores/orgUserStore.tsx` | Organization |

These stores are not shared. A patient's `user` object from `patientAuthStore` is never read by org components, and vice versa.

`signOut()` in each store calls `Session.signOut()` (which ends the SuperTokens session) and clears portal-specific localStorage/sessionStorage keys.

**Patient signOut cleanup**:
```typescript
// patientAuthStore.tsx signOut()
const patientLocalStorageKeys = [
  "approved_patient_phone_number",
  "patientReviewInvoice",
  "manualPaymentRequestId",
  "paymentId",
  "paymentResponse",
  "patientSelectPatient",
  "patientTreatmentDetails",
  "kyc_circle_members",
]
// Also clears sessionStorage["discovery_tab_state"] and IndexedDB["JirehHealthDB"]
```

---

## Shared vs Portal-Specific Components

### Shared (Portal-agnostic)

```
src/components/            — all shared UI primitives
  Button, Input, Checkbox, Drawer, etc.
  form/FormGroupInput, FormGroupSelect, etc.
  auth/                    — SuperTokens auth wrappers
  SmileIDWrapper           — KYC document capture
  PatientPinPrompt         — PIN entry drawer (used in both Fast Track and loan flow)
  CashbackBanner           — Care Fund earnings banner
  RouteMetadata            — sets document title per page

src/hooks/                 — shared hooks
  useToast, usePersistentForm, usePersistentBalance, useWebOTP, etc.

src/utilities/             — pure functions
  localStorage, currencyUtilities, dateUtilities, validators, etc.

src/analytics/             — analytics/events definitions
src/lib/                   — cn() utility, shadcn setup
```

### Patient-Specific

```
src/Routes/Patient/
  Pages/           — all patient page components
  stores/          — patientAuthStore, patientLoanStore
  hooks/           — useNextOnboardingStep, useNextKYCStep, useNextLoanApplicationStep, etc.
  components/      — PatientWrapper, PatientAuthWrapper, PatientPageWrapper, etc.
  utilities/       — loanTermUtilities, etc.
  constants/       — loanTermConstants, userTypes
  enums/           — PatientIdVerificationStatus, etc.
  models/          — patient-specific type definitions
```

### Organization-Specific

```
src/Routes/Organizations/
  Pages/           — org admin pages (loans, settings, members, onboarding)
  stores/          — orgUserStore
  hooks/           — org-specific hooks
  components/      — org-specific UI
  Auth/            — org login/signup pages
```

---

## Wrong-Portal Access Prevention

1. **Route-level**: Each portal is behind a separate React Router subtree with `SessionAuth`. A user with no session is redirected to login.

2. **Tenant-level**: The API validates that the session's tenant matches the expected portal. A 403 response routes the user to `/invalid-tenant`.

3. **Login page isolation**: Patient auth is at `/patients/auth/*`, org auth at `/org/auth/*`. They use different SuperTokens recipes (Passwordless vs EmailPassword). A patient attempting to log in via the org portal would fail tenant validation.

4. **Store isolation**: Even if a user somehow lands on a cross-portal page, the stores are separate. The patient `user` object would not be accessible in an org component.

---

## Environment-Based Routing

There is no runtime feature-flagging for portal routes. All three portals are always present in the build. The correct portal is reached by navigating to the correct URL prefix.

The Agentation dev tool (available in non-production builds) is loaded lazily:
```typescript
const LazyAgentation =
  import.meta.env.MODE !== "production"
    ? React.lazy(() => import("agentation").then(m => ({ default: m.Agentation })))
    : () => null
```

---

## Gotchas

1. **tenantId must be set before auth**: For org users, `localStorage["tenantId"]` must be set to the correct tenant value before initiating the SuperTokens auth flow. If it's not set, the auth call will use the `"patients"` tenant and the org session will fail.

2. **Portal isolation via URL, not hostname**: All portals share the same deployment domain. Isolation is URL-prefix-based, not subdomain-based. This means a patient could theoretically navigate to `/organizations/*` URLs, but they'd be redirected to org login because they have no org session.

3. **`usesDynamicLoginMethods: true` requires a network call**: SuperTokens fetches the tenant's login methods on startup. In offline scenarios, if this call fails, the auth UI may not render correctly.

4. **Shared `src/components/` must not contain portal-specific logic**: Never add conditional `if (isPatient)` branches to shared components. If a component needs portal-specific behavior, create a portal-specific wrapper in `src/Routes/[Portal]/components/`.

5. **`PatientPinPrompt` is shared but patient-specific in logic**: This component is in `src/Routes/Patient/components/` — it's used by Fast Track and the loan flow. It's not truly shared across portals. If the org portal ever needs PIN confirmation, a new component or abstraction should be created.
