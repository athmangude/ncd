---
context_version: 1.1
last_updated_commit: 1bd28205
last_updated_date: 2026-07-15
covers: SuperTokens setup, multi-tenancy, session token strategy, route protection, tenant access control — NOTE: describes the target jireh-core-client architecture; this repo (ux-prototype) mocks the recipe, see scope note below
---

# Authentication

## Scope note: this repo mocks SuperTokens, it doesn't initialize it

This repo's actual `src/App.tsx` is 13 lines — `QueryClientProvider` + `Toaster` + `RouterWrapper`. There is **no `SuperTokens.init()` call, no recipe list, no Axios interceptor setup, and no env-var-driven cookie/header toggle** anywhere in this codebase. What follows describes the target production (`jireh-core-client`) auth architecture this prototype is designed against — useful context for understanding *why* the code shape looks the way it does (e.g. why `useTenantAccessControl` reads an access-token payload), but do not treat any code snippet below as runnable in this repo without checking source first.

What *is* real here: `supertokens-web-js`'s client-side call surface (`Session.doesSessionExist()`, `Session.getAccessTokenPayloadSecurely()`, `Session.signOut()`) is used throughout, but the underlying recipe is a mock (`src/mocks/auth/recipe-session-react.tsx`, wired in via MSW) — there is no real SuperTokens core, no multi-tenant backend, and only the `"patients"` tenant is ever exercised. `useTenantAccessControl` (`src/hooks/useTenantAccessControl.ts`) and the Patient sign-out flow below are accurate as described. See [`routing.md`](./routing.md)'s scope note for the fuller picture (no Organizations/Guarantor portal, hash router, MSW-only backend).

## Overview

Authentication is handled entirely by **SuperTokens** (`supertokens-auth-react` + `supertokens-web-js`). All auth logic is initialised once at module level in `src/App.tsx` before the React component tree is rendered.

---

## SuperTokens Recipe Configuration (`src/App.tsx`)

Six recipes are active:

| Recipe | Purpose |
|--------|---------|
| `Session` | Session lifecycle, token storage, refresh |
| `Passwordless` | Phone-based OTP login (contact method: PHONE) |
| `ThirdParty` | OAuth / social login |
| `EmailPassword` | Email + password login for org users; signup form includes `firstName`, `lastName`, `title`, `inviteId`, `guarantorInviteId` |
| `EmailVerification` | Email verification, mode: REQUIRED, default UI disabled (custom UI used) |
| `Multitenancy` | Tenant ID resolution — reads `tenantId` from localStorage, defaults to `"patients"` |

```typescript
// src/App.tsx — Multitenancy override (the critical piece)
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

---

## Session Token Strategy: Cookie vs Header

**The problem:** In local development, the frontend runs on `localhost` but the API runs on a remote domain (`api.jireh-dev.pro`). Browsers block third-party cookies across different domains, so cookie-based session tokens fail.

**The solution:** An env-var controlled toggle.

```
# .env.development
VITE_SESSION_TOKEN_TRANSFER_METHOD=header   # local dev only
# production / staging — omit or set to "cookie"
```

```typescript
// src/App.tsx
const isHeaderTokenTransferDev =
  import.meta.env.DEV &&
  import.meta.env.VITE_SESSION_TOKEN_TRANSFER_METHOD === "header"

Session.init({
  tokenTransferMethod: isHeaderTokenTransferDev ? "header" : "cookie",
})
```

**Guard:** `import.meta.env.DEV` prevents header mode from ever activating in a production build.

**Axios interceptors (header mode only):** When using header-based tokens, SuperTokens needs to attach the `Authorization` header to every Axios request. This is set up once at module level with an `axiosInterceptorsAdded` guard to prevent duplicate interceptors on Vite HMR re-evaluation:

```typescript
let axiosInterceptorsAdded = false
if (isHeaderTokenTransferDev && !axiosInterceptorsAdded) {
  Session.addAxiosInterceptors(axios)
  axiosInterceptorsAdded = true
}
```

---

## Multi-Tenancy: How Portal Isolation Works

Each portal sets the `tenantId` in localStorage on route entry, and then validates the active JWT against it.

### `useTenantAccessControl` hook (`src/hooks/useTenantAccessControl.ts`)

Called from each portal wrapper with the expected tenant ID:

```typescript
// PatientWrapper.tsx
useTenantAccessControl({ setTenantIdValue: "patients" })

// OrgHomeWrapper.tsx
useTenantAccessControl({ setTenantIdValue: "organizations" })
```

Flow:
1. Writes the expected tenant ID to `localStorage("tenantId")`
2. Checks if a SuperTokens session exists
3. Reads `accessTokenPayload.tId` from the JWT
4. If `tId !== setTenantIdValue` → navigates to `/invalid-tenant`

This prevents a patient user from accessing the org portal even if they happen to navigate there directly.

---

## Route Protection

Protected routes use SuperTokens' `<SessionAuth requireAuth={true}>` wrapper:

```typescript
// OrgHomeWrapper.tsx
<SessionAuth requireAuth={true}>
  <OrgHome />
</SessionAuth>
```

If no session exists, SuperTokens redirects to the configured login page automatically.

### `ProtectedResource` component (`src/components/ProtectedResource.tsx`)

Used for role-based access control within authenticated routes — wraps a section with a role check and renders an unauthorised state if the user lacks the required role.

---

## Patient Sign-Out Flow

The patient `signOut` action in `patientAuthStore` (`src/Routes/Patient/stores/patientAuthStore.tsx`) does more than just call `Session.signOut()`. It also cleans up all client-side state to prevent data leakage between sessions:

1. `Session.signOut()` — invalidates the SuperTokens session
2. Removes specific `localStorage` keys (auth flow state, loan flow state, KYC data)
3. Removes `sessionStorage("discovery_tab_state")`
4. Deletes the IndexedDB database `"JirehHealthDB"` (offline cache)
5. Resets Zustand store to `{ user: null, signUpDetails: null }`

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_SUPERTOKENS_APP_NAME` | App name in SuperTokens dashboard |
| `VITE_SUPERTOKENS_API_DOMAIN` | API domain for SuperTokens auth endpoints |
| `VITE_SUPERTOKENS_WEBSITE_DOMAIN` | Frontend domain |
| `VITE_SUPERTOKENS_API_BASE_PATH` | Base path for SuperTokens API (e.g., `/auth`) |
| `VITE_SUPERTOKENS_WEBSITE_BASE_PATH` | Base path for SuperTokens UI pages |
| `VITE_SESSION_TOKEN_TRANSFER_METHOD` | `"header"` (local dev) or `"cookie"` (production) |
