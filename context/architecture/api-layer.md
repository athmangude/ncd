---
context_version: 1.1
last_updated_commit: 1bd28205
last_updated_date: 2026-07-15
covers: Axios setup, React Query patterns, API file conventions, environment config, offline support — NOTE: all requests are served by MSW mock handlers in this repo, not a real API
---

# API Layer

## Scope note: MSW serves every request, there is no real backend

This repo boots MSW (`src/main.tsx`'s `startMockServiceWorker()`) before rendering the app, so every Axios call below is intercepted and answered by a handler in `src/mocks/handlers/` against local fixtures + `localStorage`/IndexedDB — there is no live API. The React Query patterns, file conventions, and hook shapes described below are accurate (this repo follows the same conventions the production app does), but "the request" always terminates in a mock handler, not a network call to a real service. See [`testing-strategy.md`](./testing-strategy.md) for how MSW is also used in tests. The SuperTokens Axios-interceptor/header-token content below describes the target production auth flow — see [`authentication.md`](./authentication.md)'s scope note.

## Stack

| Tool | Role |
|------|------|
| **Axios 1.8** | HTTP client for all API requests |
| **TanStack React Query 5** | Caching, background refetch, loading/error state |
| **SuperTokens interceptors** | Auto-attaches session tokens (header mode in dev) |

---

## Environment Configuration

All API URLs come from Vite environment variables — never hardcode a URL.

```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || ""
const SUPERTOKENS_API_DOMAIN = import.meta.env.VITE_SUPERTOKENS_API_DOMAIN
```

In production/staging, cookies handle auth automatically. In local dev with `VITE_SESSION_TOKEN_TRANSFER_METHOD=header`, SuperTokens axios interceptors attach the `Authorization` header (configured in `App.tsx`).

---

## API File Convention

Each feature's API functions live in a co-located `api.ts` file alongside the page component:

```
src/Routes/Patient/Pages/FastTrack/
├── FastTrackPage.tsx
├── api.ts            ← API functions for this feature
└── hooks/
    └── useFastTrack.ts  ← React Query hooks consuming api.ts
```

API functions are plain async functions (not hooks) that return typed responses:

```typescript
// src/Routes/Patient/Pages/FastTrack/api.ts
export async function resolveProvider(paymentNumber: string): Promise<FastTrackPaymentPoint> {
  const response = await axios.get<FastTrackPaymentPoint>(
    `${BASE_URL}/fast-track/resolve-provider/${paymentNumber}`
  )
  return response.data
}
```

---

## React Query Hook Patterns

### Basic Query

```typescript
export function useResolveProvider(paymentNumber: string) {
  return useQuery({
    queryKey: ["resolveProvider", paymentNumber],
    queryFn: () => resolveProvider(paymentNumber),
    staleTime: 5 * 60 * 1000,
    enabled: !!paymentNumber,
  })
}
```

### Dependent / Sequential Queries

When query B depends on the result of query A:

```typescript
const { data: loanStats, isSuccess: statsLoaded } = useQuery({
  queryKey: ["loanStats"],
  queryFn: fetchLoanStats,
})

const { data: alerts } = useQuery({
  queryKey: ["dashboardAlert"],
  queryFn: fetchDashboardAlert,
  enabled: statsLoaded,   // Only fires after loanStats resolves
})
```

### Mutation with Optimistic Cache Invalidation

```typescript
const mutation = useMutation({
  mutationFn: ({ file, passcode }: UploadPayload) => {
    const formData = new FormData()
    formData.append("financialStatementFile", file)
    return axios.post(`${BASE_URL}/underwriting/upload-mpesa-statement`, formData, {
      onUploadProgress: (e) => setProgress((e.loaded / e.total!) * 100),
    })
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["financialStatements"] })
  },
})
```

### Query Client Defaults

```typescript
// Configured in App.tsx
{
  refetchOnWindowFocus: true,   // Refetch when user returns to tab
  refetchOnMount: true,          // Refetch on component mount
  retry: false,                  // Never auto-retry — errors should surface
}
```

Override per-query when needed (e.g., `retry: 1` for specific endpoints).

---

## Patient Login Details Hook (`src/hooks/usePatientLoginDetails.ts`)

This is the primary hook for loading a patient's full profile. It is used across multiple pages. Key characteristics:
- Fetches `/patients/login-details`
- `staleTime`: 5 minutes, `gcTime`: 10 minutes
- Listens to `online`/`offline` browser events and enables/disables accordingly
- Falls back to offline cached data if available (via `useOfflinePatientData`)

**Important:** Do not duplicate this hook. If you need patient data, use `usePatientLoginDetails`.

---

## Offline Support

`useOfflinePatientData` (`src/hooks/useOfflinePatientData.ts`) stores patient data in IndexedDB (`JirehHealthDB`). This is used as a fallback when the network is unavailable.

```typescript
// Pattern
const { data: onlineData } = usePatientLoginDetails()
const { offlineData } = useOfflinePatientData()

const data = navigator.onLine ? onlineData : offlineData
```

The `useOffline` hook (`src/hooks/useOffline.ts`) provides a boolean `isOffline` flag derived from `navigator.onLine` + event listeners.

---

## Error Handling

Axios errors surface through React Query's `isError` / `error` states. Do not add global Axios error interceptors for application logic — handle errors at the component level or in `onError` mutation callbacks.

Sentry captures unhandled errors automatically via the Sentry SDK initialised in `src/utilities/sentry.tsx`.
