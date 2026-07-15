---
context_version: 1.0
last_updated_commit: 422cdfe3
last_updated_date: 2026-04-08
covers: Zustand stores, React Query setup, when to use each, store patterns
---

# State Management

## Two-Layer Model

This app uses a deliberate two-layer state model:

| Layer | Tool | Responsibility |
|-------|------|----------------|
| **Server state** | TanStack React Query 5 | Remote data fetching, caching, background refetch, mutations |
| **Client state** | Zustand 5 | Local UI state that outlives a single component (auth identity, signup flow) |

Do not use Zustand for data that comes from the API. Use React Query for everything that has a server source.

---

## React Query

### QueryClient Configuration (`src/App.tsx`)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,   // Refetch when tab regains focus
      refetchOnMount: true,          // Refetch when component mounts
      retry: false,                  // Do NOT retry failed requests by default
    },
  },
})
```

The `retry: false` default is intentional — Jireh's API returns meaningful error states (loan eligibility, KYC status) that should surface immediately, not be silently retried.

`QueryClientProvider` wraps the entire app in `App.tsx`.

### Query Patterns

**Basic query:**
```typescript
const { data, isLoading, isError } = useQuery({
  queryKey: ["patientLoginDetails"],
  queryFn: () => axios.get(`${BASE_URL}/patients/login-details`).then(r => r.data),
  staleTime: 5 * 60 * 1000,   // 5 minutes
  gcTime: 10 * 60 * 1000,     // 10 minutes (formerly cacheTime)
})
```

**Dependent query (sequential):**
```typescript
const { data: loanStats, isSuccess } = useQuery({
  queryKey: ["loanStats"],
  queryFn: fetchLoanStats,
})

const { data: alerts } = useQuery({
  queryKey: ["dashboardAlert"],
  queryFn: fetchDashboardAlert,
  enabled: isSuccess,   // Only runs after loanStats succeeds
})
```

**Mutation with cache invalidation:**
```typescript
const mutation = useMutation({
  mutationFn: (data) => axios.post(`${BASE_URL}/endpoint`, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["affectedData"] })
  },
})
```

### Query Key Conventions

Use descriptive string arrays. Keep keys stable — changing a key creates a new cache entry.

```typescript
["patientLoginDetails"]          // User-scoped, no params
["loanStats"]                    // Entity with no ID
["provider", providerId]         // Entity with ID
["paymentHistory", page, limit]  // Paginated
```

---

## Zustand Stores

### Store Locations

| Store | File | Scope | Persisted? |
|-------|------|-------|-----------|
| `usePatientAuthStore` | `src/Routes/Patient/stores/patientAuthStore.tsx` | Patient auth identity and sign-up flow state | No |
| `usePatientLoanStore` | `src/Routes/Patient/stores/patientLoanStore.tsx` | Minimal loan shape — largely superseded by `patientReviewInvoice` localStorage | No |
| `useOrgUserStore` | `src/Routes/Organizations/stores/orgUserStore.tsx` | Org user identity | No |
| `useFastTrackStore` | `src/Routes/Patient/Pages/FastTrack/useFastTrackStore.ts` | Fast Track payment flow state (mixed transient + persisted fields) | Partially — `localStorage["fast-track-storage"]` persists only `transaction` and `paymentSubmitted` via `partialize`; input fields (paymentNumber, invoiceAmount, etc.) are intentionally transient |

### Store Pattern

```typescript
import { create } from "zustand"

interface MyState {
  value: string | null
  setValue: (v: string) => void
  reset: () => void
}

export const useMyStore = create<MyState>((set) => ({
  value: null,
  setValue: (v) => set({ value: v }),
  reset: () => set({ value: null }),
}))
```

### `usePatientAuthStore` — Key Shape

```typescript
{
  user: any | null                    // Full user object after login
  signUpDetails: SignUpDetails | null // Collected during multi-step signup
  setSignUpDetails(details)           // Accumulates signup step data
  setUserId(userId, amplitudeToken, loginTime) // Set after OTP success
  setUser(user)                       // Set after login details fetch
  signOut()                           // Full logout + state cleanup
}
```

`signOut()` is the most complex action — it calls `Session.signOut()` AND clears localStorage, sessionStorage, and IndexedDB. See [`authentication.md`](./authentication.md) for the full flow.

### `useOrgUserStore` — Key Shape

```typescript
{
  user: OrgUser | null
  setUser(user)
  signOut()   // Calls Session.signOut(), resets store
}
```

---

## When to Use What

| Situation | Use |
|-----------|-----|
| Data from an API endpoint | React Query (`useQuery`) |
| Create / update / delete on server | React Query (`useMutation`) |
| Multi-step form state that spans pages | Zustand |
| Auth identity (who is logged in) | Zustand (`patientAuthStore` / `orgUserStore`) |
| Ephemeral UI state (open/closed, tab index) | Local `useState` |
| Form field values | React Hook Form (not Zustand) |
| Offline-persisted patient data | `useOfflinePatientData` hook (IndexedDB via custom hook) |

Do not store API response data in Zustand. React Query's cache is the single source of truth for server data.

---

## localStorage Dominance in Multi-Step Flows

In practice, localStorage is the dominant persistence mechanism for multi-step user journeys. This is in addition to Zustand and React Query.

### Why localStorage

Multi-step payment and onboarding flows span multiple pages. React Router state is lost on page refresh. Zustand (without `persist` middleware) is lost on tab close. localStorage survives both, making it the reliable fallback for in-progress data.

### Key localStorage Keys

| Key | Written by | Shape | Purpose |
|-----|-----------|-------|---------|
| `patientReviewInvoice` | `PatientUploadInvoice`, `PatientReviewInvoice`, `PatientWalletSelection`, `PatientVerificationPending` | Object with patient, facility, billAmount, allocations, status | Single source of truth for the in-progress payment/loan request |
| `manualPaymentRequestId` | `PatientReviewInvoice` on POST success | `string` (UUID) | Tracks out-of-network payment review request |
| `paymentId` | `PatientPaymentConfirmation` on success | `string` | Reference to submitted payment |
| `paymentResponse` | `PatientPaymentConfirmation` on success | Object | Full payment response for status display |
| `patientSelectPatient` | `usePersistentForm("patientSelectPatient")` | React Hook Form values | Persists patient selection form across refreshes |
| `patientTreatmentDetails` | `usePersistentForm("patientTreatmentDetails")` | React Hook Form values | Persists treatment details form |
| `patientSetBillAmount` | `usePersistentForm("patientSetBillAmount")` | React Hook Form values | Persists bill amount form |
| `patientLoanTerms` | `usePersistentForm("patientLoanTerms")` | React Hook Form values | Persists loan terms form |
| `fast-track-storage` | Zustand `persist` middleware (useFastTrackStore) | Partial — `transaction` and `paymentSubmitted` only | Survives page reload; input fields (paymentNumber, provider, invoiceAmount, etc.) are transient |
| `patient-network-pending-invite` | `InviteMethodDrawer`, `InviteTextPage` | PendingInviteData | Partially-built invite during text/voice invite flow |
| `kyc_circle_members` | `PatientKYCAddCircleMembers` | `AddCircleMemberInput[]` | Batch staging for KYC circle member submissions |
| `approved_patient_phone_number` | `PatientSignUp` | `{ phoneNumber, countryCode }` | Pre-fill phone on return to signup |
| `add-new-connection` | `usePersistentForm("add-new-connection")` | React Hook Form values | Persists add-connection form |
| `tenantId` | Portal selection / Org login setup | `string` | Determines SuperTokens tenant |
| `pwaInstallSkipped` | PWA install prompt | `"true"` | Skips PWA install flow |
| `pwaInstalled` | PWA install callback | `"true"` | Records PWA installation |
| `inviteId` | Deep link handler | `string` | Circle invite to accept after signup |
| `referrerId` | Share link handler | `string` | Referral ID to process after signup |

**sessionStorage** (not localStorage):
| Key | Written by | Purpose |
|-----|-----------|---------|
| `discovery_tab_state` | `useDiscovery` hook | Map view state, search, filters, user location across tab navigations |

### `usePersistentForm`

`src/hooks/usePersistentForm.tsx` wraps React Hook Form and auto-saves form values to localStorage on every change via `watch()`. This is the mechanism behind all the `patient*StorageKey` values above.

```typescript
export function usePersistentForm<T extends FieldValues>(
  storageKey: string,
  options?: UseFormProps<T>
): UseFormReturn<T> & { clearPersistentState: () => void }
```

Two ways to clear persisted form state:

1. **Per-form**: Call `clearPersistentState()` returned by `usePersistentForm` on the individual form instance.
2. **Bulk utility**: Call `clearPeristentForm([key1, key2, ...])` (exported from `usePersistentForm.tsx`) to remove multiple localStorage keys at once. Note: the function name has a typo — it is `clearPeristentForm` (one 's'), not `clearPersistentForm`.

### Zustand `persist` Middleware

`useFastTrackStore` is the only Zustand store using `persist` middleware. It uses `partialize` to persist only two fields (`transaction` and `paymentSubmitted`); all other fields are intentionally transient:

```typescript
persist(storeDefinition, {
  name: "fast-track-storage",
  partialize: (state) => ({
    transaction: state.transaction,
    paymentSubmitted: state.paymentSubmitted,
  }),
})
```

`patientAuthStore` and `patientLoanStore` do **not** use persist middleware. Their state is in-memory only and lost on page reload.

### Fallback Chain in Loan Flow

`PatientPaymentConfirmation` applies this resolution order:

```
1. location.state (React Router — lost on refresh)
       ↓ if missing
2. localStorage["patientReviewInvoice"] (survives refresh)
       ↓ if missing
3. Shows DetailsNotSet error state
```

This pattern ensures the confirmation page is resilient to page refreshes mid-flow.

### Cleanup on Sign Out

`patientAuthStore.signOut()` explicitly removes the known localStorage keys:
```
patientReviewInvoice, manualPaymentRequestId, paymentId, paymentResponse,
patientSelectPatient, patientTreatmentDetails, kyc_circle_members,
approved_patient_phone_number
```
And clears `sessionStorage["discovery_tab_state"]` and IndexedDB `JirehHealthDB`.

**Not cleaned up on signOut** (potential leaks on shared devices):
- `patient-network-pending-invite`
- `add-new-connection`
- `fast-track-storage`
