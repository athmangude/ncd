# Technical Specification: Supabase Backend & AI Demo Foundation

**Implementation architecture for replacing MSW/localStorage with Supabase, wiring server-side AI pipelines, and adding mock OTP auth — grounded in the existing ncd-prototype codebase.**

Version: 0.1
Date: 2026-09-02
Product spec: `specs/supabase-backend-ai-demo-spec.md`

---

## 1. Architecture Overview

### Current State

```
┌───────────────────────────────────────────────────┐
│ React App (Vite 6.2)                              │
│                                                   │
│  Hooks (useQuery) ──► axios ──► MSW handlers      │
│                                    │               │
│                           domain/careCompanion.ts  │
│                                    │               │
│                            localStorage (mock:*)   │
│                                                   │
│  AI pipeline (client-side) ──► Gemini API direct  │
└───────────────────────────────────────────────────┘
```

### Target State

```
┌───────────────────────────────────────────────────┐
│ React App (Vite 6.2)                              │
│                                                   │
│  Hooks (useQuery) ──► DataService abstraction     │
│                          │              │          │
│              VITE_USE_SUPABASE?         │          │
│              ┌───┘          └───┐       │          │
│              ▼                  ▼       │          │
│         MSW/localStorage   Supabase     │          │
│         (dev fallback)     Client       │          │
│                               │         │          │
│                    ┌──────────┘         │          │
│                    ▼                    │          │
│  ┌─────────────────────────────────┐    │          │
│  │ Supabase                        │    │          │
│  │ ┌─────────┐  ┌───────────────┐  │    │          │
│  │ │ Postgres │  │ Edge Functions │  │    │          │
│  │ │ (10 tbl) │  │ (5 functions) │──┼──► Gemini   │
│  │ └─────────┘  └───────────────┘  │              │
│  │ ┌─────────┐  ┌───────────────┐  │              │
│  │ │  Auth   │  │   Storage     │  │              │
│  │ │  (OTP)  │  │  (files/PDFs) │  │              │
│  │ └─────────┘  └───────────────┘  │              │
│  │ ┌─────────────────────────────┐ │              │
│  │ │ pg_cron (hourly insights)   │ │              │
│  │ └─────────────────────────────┘ │              │
│  └─────────────────────────────────┘              │
└───────────────────────────────────────────────────┘
```

### Feature Flag

`VITE_USE_SUPABASE` env var controls the data source. When unset or `"false"`, the app runs exactly as today — MSW intercepts all requests, localStorage persists data. When `"true"`, hooks call Supabase directly and AI calls go through Edge Functions.

---

## 2. New Dependencies

```json
{
  "@supabase/supabase-js": "^2.45.0",
  "jspdf": "^2.5.2",
  "jspdf-autotable": "^3.8.4"
}
```

- `@supabase/supabase-js` — Supabase client (auth, DB, storage, Edge Function invocation)
- `jspdf` + `jspdf-autotable` — client-side PDF generation for mock test results (~180KB gzipped combined, lazy-loaded only on Test Results Utility page)

Supabase Edge Functions are deployed separately (Deno runtime) and don't add to the client bundle.

---

## 3. File Structure (New/Modified)

```
src/
├── lib/
│   ├── supabase.ts                    # NEW — Supabase client singleton
│   ├── data-service.ts                # NEW — Abstraction layer (MSW vs Supabase)
│   ├── ai-pipeline.ts                 # MODIFIED — add Supabase Edge Function calls
│   └── ai-pipeline-rules.ts           # UNCHANGED
│
├── Routes/Patient/
│   ├── PatientWrapper.tsx             # MODIFIED — Supabase auth flow
│   ├── Pages/
│   │   ├── Auth/
│   │   │   ├── PhoneEntryPage.tsx     # NEW — phone number input
│   │   │   └── OtpVerifyPage.tsx      # NEW — OTP input with auto-fill
│   │   ├── Profile/
│   │   │   ├── PatientProfile.tsx     # MODIFIED — add Test Results Utility menu item
│   │   │   └── TestResultsUtility.tsx # NEW — mock test result generator
│   │   └── CareCompanion/
│   │       └── hooks/
│   │           ├── useIntakeProfile.ts      # MODIFIED — dual data source
│   │           ├── useRefillSchedule.ts     # MODIFIED — dual data source
│   │           ├── useEducationFeed.ts      # MODIFIED — dual data source
│   │           ├── useLessonProgress.ts     # MODIFIED — dual data source
│   │           ├── useNotifications.ts      # MODIFIED — dual data source
│   │           ├── useRecentPayments.ts     # MODIFIED — dual data source
│   │           ├── useCostSummary.ts        # MODIFIED — dual data source
│   │           ├── useCostBreakdown.ts      # MODIFIED — dual data source
│   │           ├── useMedicationCards.ts    # MODIFIED — dual data source
│   │           ├── useAssistantChat.ts      # MODIFIED — Edge Function call
│   │           └── useAiPipeline.ts         # MODIFIED — Edge Function triggers
│   │
│   └── stores/
│       └── patientAuthStore.ts        # MODIFIED — Supabase session management
│
├── mocks/                             # UNCHANGED — MSW layer stays for dev fallback
│
supabase/
├── migrations/
│   ├── 001_schema.sql                 # NEW — all 10 tables + indexes
│   ├── 002_rls_policies.sql           # NEW — RLS for all tables
│   ├── 003_education_seed.sql         # NEW — 119 education articles
│   └── 004_pg_cron.sql               # NEW — hourly insight cron job
├── functions/
│   ├── get-otp/index.ts              # NEW — demo OTP retrieval
│   ├── generate-invoice-line-items/index.ts  # NEW — AI invoice generation
│   ├── generate-ai-insights/index.ts         # NEW — AI insight pipeline
│   ├── generate-mock-test-results/index.ts   # NEW — mock lab result PDF
│   └── chat-assistant/index.ts               # NEW — AI chat (server-side)
├── config.toml                        # NEW — Supabase project config
└── seed.sql                           # NEW — demo account seed data
```

---

## 4. Supabase Client Setup

### `src/lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export const useSupabase = import.meta.env.VITE_USE_SUPABASE === "true"
```

### `src/types/supabase.ts`

Generated via `supabase gen types typescript` after migration. Provides full type safety for all table queries.

---

## 5. Data Service Abstraction

### `src/lib/data-service.ts`

A thin abstraction that each hook imports. Avoids duplicating the `if (useSupabase)` branch in every hook.

```typescript
import { supabase, useSupabase } from "@/lib/supabase"
import axios from "axios"

const baseUrl = import.meta.env.VITE_API_BASE_URL

export const dataService = {
  async query<T>(table: string, options?: {
    select?: string
    filter?: Record<string, unknown>
    order?: { column: string; ascending?: boolean }
    limit?: number
    single?: boolean
  }): Promise<T> {
    if (!useSupabase) {
      // MSW path — map table name to API endpoint
      const endpoint = TABLE_TO_ENDPOINT[table]
      const { data } = await axios.get(`${baseUrl}${endpoint}`)
      return data as T
    }

    let query = supabase.from(table).select(options?.select ?? "*")

    if (options?.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        query = query.eq(key, value)
      }
    }
    if (options?.order) {
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? false,
      })
    }
    if (options?.limit) query = query.limit(options.limit)

    const result = options?.single
      ? await query.single()
      : await query

    if (result.error) throw result.error
    return result.data as T
  },

  async insert<T>(table: string, data: Partial<T>): Promise<T> {
    if (!useSupabase) {
      const endpoint = TABLE_TO_ENDPOINT[table]
      const { data: result } = await axios.post(`${baseUrl}${endpoint}`, data)
      return result as T
    }

    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return result as T
  },

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    if (!useSupabase) {
      const endpoint = TABLE_TO_ENDPOINT[table]
      const { data: result } = await axios.patch(`${baseUrl}${endpoint}/${id}`, data)
      return result as T
    }

    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq("id", id)
      .select()
      .single()
    if (error) throw error
    return result as T
  },

  async invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
    if (!useSupabase) {
      // For MSW mode, fall back to existing client-side AI calls
      throw new Error(`Edge Function ${name} not available in MSW mode`)
    }

    const { data, error } = await supabase.functions.invoke(name, { body })
    if (error) throw error
    return data as T
  },
}

const TABLE_TO_ENDPOINT: Record<string, string> = {
  profiles: "/companion/profile",
  events: "/companion/events",
  refill_schedules: "/companion/refill-schedules",
  test_schedules: "/companion/test-schedules",
  medication_cards: "/companion/medication-cards",
  notifications: "/companion/notifications",
  payments: "/companion/payments",
  wallets: "/companion/wallet",
  chat_messages: "/companion/assistant/messages",
  education_content: "/companion/education",
  education_progress: "/companion/education/progress",
}
```

---

## 6. Authentication Flow

### Current Auth (MSW mock)

The existing mock auth system (`src/mocks/auth/`) simulates SuperTokens. The current flow:
1. `PatientWrapper.tsx` checks for `mock_session_exists` in localStorage
2. If no session → renders auth routes (`/patients/auth`, `/patients/auth/otp`)
3. After "login" → sets session flags, navigates to dashboard

### New Auth (Supabase + Mock OTP)

When `VITE_USE_SUPABASE=true`:

#### `PhoneEntryPage.tsx` (new)
- Phone number input with +254 prefix (Kenyan format)
- On submit: calls `supabase.auth.signInWithOtp({ phone })`
- Navigates to `/patients/auth/otp` with phone in route state

#### `OtpVerifyPage.tsx` (new)
- 6-digit OTP input fields
- On mount: calls `supabase.functions.invoke("get-otp", { body: { phone } })`
- Auto-populates all 6 digits from the response
- User taps "Verify" → calls `supabase.auth.verifyOtp({ phone, token, type: "sms" })`
- On success: checks if profile exists in `profiles` table
  - No profile → navigates to intake form
  - Has profile → navigates to companion home

#### `patientAuthStore.ts` (modified)
- Add `supabaseSession` state
- Add `initializeAuth()` that calls `supabase.auth.getSession()` on app load
- Add `onAuthStateChange` listener for session refresh/expiry
- `isAuthenticated` computed from either MSW flags or Supabase session based on feature flag

#### `PatientWrapper.tsx` (modified)
- When `useSupabase`: check `supabase.auth.getSession()` instead of localStorage flags
- Route to `PhoneEntryPage` and `OtpVerifyPage` instead of existing auth components
- Auth guard wraps all authenticated routes

---

## 7. Database Schema

### Migration `001_schema.sql`

10 tables, exact SQL in the product spec section 6.1. Key design decisions:

| Table | Primary Key | Notable Columns |
|-------|-------------|-----------------|
| `profiles` | `id` (FK → auth.users) | `conditions text[]`, `treatment jsonb`, `recurring_tests jsonb`, `cost_estimates jsonb` |
| `events` | `id` (uuid) | `type text`, `data jsonb` — discriminated union, same as `CareCompanionEvent` |
| `payments` | `id` (uuid) | `line_items jsonb` (starts empty, AI populates), `cashback_amount numeric` |
| `wallets` | `user_id` (FK → auth.users) | `cashback_balance numeric` — single row per user |
| `education_content` | `id` (uuid) | `slug text UNIQUE`, `sections jsonb`, `conditions text[]` — GIN index on conditions |
| `education_progress` | `id` (uuid) | `UNIQUE(user_id, content_id)` — one row per user per course |
| `refill_schedules` | `id` (uuid) | `medication_name`, `frequency_days`, `next_date`, `status` |
| `test_schedules` | `id` (uuid) | `test_name`, `frequency_months`, `next_date`, `status` |
| `notifications` | `id` (uuid) | `type`, `title`, `body`, `metadata jsonb`, `deep_link`, `read_at` |
| `chat_messages` | `id` (uuid) | `role` ('user'/'assistant'), `content text` |

### Migration `002_rls_policies.sql`

- All tables with `user_id`: `auth.uid() = user_id` for all operations
- `profiles`: `auth.uid() = id` (id IS the user_id)
- `education_content`: `SELECT` for all authenticated users (public read-only)
- `education_progress`: `auth.uid() = user_id`

### Migration `003_education_seed.sql`

Seed all 119 articles from `src/mocks/fixtures/education-cards.json` into `education_content` table. Script:

1. Read `education-cards.json`
2. Map each card to an INSERT: `slug`, `title`, `category`, `conditions`, `content_type`, `summary`, `body`, `sections`, `estimated_minutes`, `learning_objectives`, `image_theme`
3. Generate as SQL INSERT statements

Build-time script `scripts/generate-education-seed.ts` reads the fixture and outputs the SQL migration file.

### Migration `004_pg_cron.sql`

```sql
-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Schedule hourly insight generation
select cron.schedule(
  'generate-hourly-insights',
  '0 * * * *',
  $$
    select net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-ai-insights',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{"batch": true}'::jsonb
    );
  $$
);
```

---

## 8. Edge Functions

All Edge Functions run on Deno. They share a common pattern:

```typescript
// supabase/functions/_shared/supabase-admin.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

export function createAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )
}

export function createUserClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  )
}
```

### 8.1 `get-otp`

**Purpose**: Returns the OTP for a phone number so the client can auto-fill it.

```typescript
// supabase/functions/get-otp/index.ts
import { createAdminClient } from "../_shared/supabase-admin.ts"

Deno.serve(async (req) => {
  const { phone } = await req.json()
  const admin = createAdminClient()

  // Query the auth.mfa_factors or auth.one_time_tokens table
  // (Supabase stores OTPs in auth schema, accessible via service role)
  const { data, error } = await admin.rpc("get_otp_for_phone", { phone_number: phone })

  if (error || !data) {
    return new Response(JSON.stringify({ error: "OTP not found" }), { status: 404 })
  }

  return new Response(JSON.stringify({ otp: data }))
})
```

Requires a custom Postgres function (`get_otp_for_phone`) that reads from `auth.one_time_tokens` — this table is internal to Supabase Auth and accessible only via service role.

**Alternative approach**: If `auth.one_time_tokens` is not accessible, use a deterministic OTP strategy: hash the phone number + a secret to produce a predictable 6-digit code, and configure Supabase Auth to use a custom SMS hook that stores the OTP in a `demo_otps` table instead of sending SMS.

### 8.2 `generate-invoice-line-items`

**Trigger**: Client calls after payment creation.

**Input**: `{ paymentId: string }`

**Process**:
1. Get authenticated user from JWT
2. Fetch profile from `profiles` table
3. Fetch payment from `payments` table
4. Fetch refill schedules from `refill_schedules` table
5. Build Gemini prompt (same as current `INVOICE_POPULATE` logic in `ai-pipeline.ts` lines ~75-130)
6. Call Gemini `gemini-3.6-flash` with `responseMimeType: "application/json"`
7. Validate response: line items must sum to within 10% of payment amount
8. Update `payments.line_items` with generated items
9. Insert `PAYMENT` event into `events` table
10. Calculate cashback: `payment.amount * 0.05`
11. Update `wallets.cashback_balance` (increment)
12. Insert `CASHBACK_EARNED` event into `events` table
13. Insert cashback notification into `notifications` table
14. Call `generate-ai-insights` (internal function invocation)

**Gemini prompt**: Import from `ai-pipeline-rules.ts` constants. System prompt includes patient conditions, medications, test schedule, and refill state. Request prompt specifies the payment amount and facility type. Response schema: `{ lineItems: [{ name, category, quantity, unitPrice, total }] }`.

**Error handling**: If Gemini fails, leave `line_items` empty and insert a notification "Invoice details are being processed" — retry on next cron cycle.

### 8.3 `generate-ai-insights`

**Trigger modes**:
1. Called by `generate-invoice-line-items` after invoice population
2. Client calls on-demand (pull to refresh, open companion home)
3. `pg_cron` hourly batch (`{ batch: true }` in body)
4. Event-driven triggers from client (course completed, test uploaded)

**Input**: `{ userId?: string, batch?: boolean, trigger?: string, triggerData?: object }`

**Process**:

Single-user mode (`userId` provided):
1. Fetch profile, last 50 events, refill/test schedules, education progress
2. Build system prompt from `ai-pipeline-rules.ts` constants
3. Include trigger context if event-driven (e.g. "User just completed course 'Managing Blood Sugar with Diet'")
4. Call Gemini — response is array of actions (same schema as current `callLlmApi` output)
5. Validate actions with `validateActions()` (same logic as `ai-pipeline.ts`)
6. Deduplicate: for each action, check `notifications` table for similar insight in last 24h (match on `type` + `metadata.actionType` + key content fields)
7. For each new action: insert notification with deep link, metadata, and action type
8. `EDUCATION_RECOMMENDATION` actions: query `education_content` for matching courses by condition, include slug in notification deep link

Batch mode (`batch: true`):
1. Query all `profiles` where `completed_at IS NOT NULL`
2. For each user: check if any notification was created in the last hour — skip if yes
3. Process each user through the single-user pipeline
4. Rate limit: max 10 Gemini calls per minute (batch processes sequentially with delays)

**Event-driven triggers** (client passes `trigger` field):

| Trigger | `trigger` value | `triggerData` | Insight behavior |
|---------|----------------|---------------|------------------|
| Prescription detected | `"prescription"` | `{ medications: [...] }` | Dosage, interaction, refill timing insights |
| Lab test uploaded | `"test_upload"` | `{ testName, metrics }` | Trend analysis, next steps, comparison to prior results |
| Course completed | `"course_complete"` | `{ courseSlug, courseTitle }` | Follow-up course recommendation, key takeaway reinforcement |
| Refill overdue | `"refill_overdue"` | `{ medicationName, daysPastDue }` | Nudge with nearby pharmacy link |
| Test overdue | `"test_overdue"` | `{ testName, daysPastDue }` | Reminder with cost estimate |
| Cashback milestone | `"cashback_milestone"` | `{ balance, threshold }` | Suggestion to apply cashback to upcoming refill |

### 8.4 `generate-mock-test-results`

**Trigger**: User taps "Generate Results" on Test Results Utility page.

**Input**: `{ testName: string }`

**Process**:
1. Get authenticated user from JWT
2. Fetch profile (conditions, medications, treatment duration)
3. Fetch previous `TEST_RESULT` events for this test type
4. Build Gemini prompt:
   - Patient demographics: conditions, medications, treatment timeline
   - Prior results: values and dates (for trend continuation)
   - Request: generate clinically plausible metrics for `testName`
   - Constraints: values must be medically consistent with conditions and treatment adherence
5. Call Gemini — response schema:
   ```json
   {
     "metrics": [
       {
         "name": "HbA1c",
         "value": 7.2,
         "unit": "%",
         "referenceRange": "4.0 - 5.6",
         "status": "HIGH"
       }
     ],
     "labName": "Nairobi Hospital Laboratory",
     "date": "2026-09-02"
   }
   ```
6. Return `{ metrics, labName, date }` — **no PDF generation server-side**

**PDF generation is client-side** — see Section 11 (Test Results Utility Page).

### 8.5 `chat-assistant`

**Trigger**: User sends a message in the AI assistant.

**Input**: `{ message: string, conversationHistory: Array<{ role, content }> }`

**Process**:
1. Get authenticated user from JWT
2. Fetch profile (full — conditions, medications, test schedules, cost estimates, goals)
3. Fetch last 30 events for context grounding
4. Fetch last 20 chat messages from `chat_messages` table (in case `conversationHistory` from client is stale)
5. Build system prompt (same as current `callAssistantChat` in `ai-pipeline.ts` but with real profile data)
6. Call Gemini with system prompt + conversation history + user message
7. Save both user message and assistant reply to `chat_messages` table
8. Return `{ reply: string, suggestedQuestions?: string[] }`

---

## 9. Hook Migration Pattern

Each hook follows the same pattern. Example with `useRefillSchedule`:

### Before (MSW only)
```typescript
export function useRefillSchedule() {
  return useQuery({
    queryKey: ["refillSchedule"],
    queryFn: async () => {
      const { data } = await axios.get(`${baseUrl}/companion/refill-schedules`)
      return data as RefillScheduleItem[]
    },
  })
}
```

### After (dual data source)
```typescript
import { dataService } from "@/lib/data-service"

export function useRefillSchedule() {
  return useQuery({
    queryKey: ["refillSchedule"],
    queryFn: () => dataService.query<RefillScheduleItem[]>("refill_schedules", {
      order: { column: "next_date", ascending: true },
    }),
  })
}
```

The `dataService.query` handles the MSW vs Supabase branching internally. Query keys stay identical — cache invalidation, optimistic updates, and dependent queries all work unchanged.

### Hooks requiring migration

| Hook | Current data source | Supabase table | Notes |
|------|-------------------|----------------|-------|
| `useIntakeProfile` | `GET /companion/profile` | `profiles` | `.single()` — one row per user |
| `useRefillSchedule` | `GET /companion/refill-schedules` | `refill_schedules` | Filter by `user_id`, order by `next_date` |
| `useCostSummary` | `GET /companion/cost-summary` | Computed from `payments` | Aggregate query or client-side compute |
| `useCostBreakdown` | `GET /companion/cost-breakdown` | Computed from `payments` | Group by line item category |
| `useRecentPayments` | `GET /companion/events` (type=PAYMENT) | `payments` | Order by `created_at desc`, limit 10 |
| `useMedicationCards` | `GET /companion/medication-cards` | `medication_cards` | Join with taxonomy for enrichment |
| `useNotifications` | `GET /companion/notifications` | `notifications` | Filter by `user_id`, order by `sent_at desc` |
| `useEducationFeed` | `GET /companion/education` | `education_content` | Filter by conditions (GIN index) |
| `useLessonProgress` | `GET /companion/education/progress` | `education_progress` | Filter by `user_id` and `content_id` |
| `useAssistantChat` | Client-side Gemini call | Edge Function `chat-assistant` | Full migration — no client-side AI |
| `useAiPipeline` | Client-side Gemini call | Edge Function `generate-ai-insights` | Trigger via `supabase.functions.invoke()` |
| `useSuggestedPrompts` | Client-side Gemini call | Edge Function `chat-assistant` | Can be a sub-call of chat-assistant |

### Computed queries (no direct table mapping)

`useCostSummary` and `useCostBreakdown` currently read from pre-computed localStorage objects seeded by `seedFromIntakeMedications`. In Supabase mode, these compute from the `payments` table:

```typescript
// useCostSummary — Supabase path
const { data: payments } = await supabase
  .from("payments")
  .select("amount, cashback_amount, created_at")
  .gte("created_at", startOfYear)

const ytdSpend = payments.reduce((sum, p) => sum + p.amount, 0)
const cashbackEarned = payments.reduce((sum, p) => sum + p.cashback_amount, 0)
// ... etc
```

---

## 10. Payment Flow Changes

### Current (MSW)

1. `FastTrackWalletSelection.tsx` → calls `POST /api/fast-track/pay`
2. MSW handler in `fasttrack.ts` creates a `PaymentRecord` in localStorage
3. `PaymentStatus.tsx` shows success
4. `useAiPipeline` triggers client-side Gemini call → populates invoice line items in localStorage

### New (Supabase)

1. `FastTrackWalletSelection.tsx` → calls `dataService.insert("payments", { ... })`
2. Payment record created in Supabase `payments` table (line_items empty)
3. `PaymentStatus.tsx` shows success AND calls `supabase.functions.invoke("generate-invoice-line-items", { body: { paymentId } })`
4. Edge Function populates line items, calculates cashback, generates insights — all server-side
5. Client polls or uses Supabase Realtime subscription (future) to detect when line items are populated
6. Payment details page shows line items once available

### Cashback calculation

Handled entirely in `generate-invoice-line-items` Edge Function:

```typescript
const cashbackRate = 0.05
const cashbackAmount = payment.amount * cashbackRate

// Update wallet
await admin.from("wallets")
  .upsert({ user_id: userId, cashback_balance: currentBalance + cashbackAmount })

// Insert cashback event
await admin.from("events").insert({
  user_id: userId,
  type: "CASHBACK_EARNED",
  data: { amount: cashbackAmount, paymentId, currency: "KES" },
})

// Insert notification
await admin.from("notifications").insert({
  user_id: userId,
  type: "CASHBACK_EARNED",
  title: `KES ${cashbackAmount.toLocaleString()} cashback earned`,
  body: `You earned cashback on your payment at ${payment.facility_name}`,
  metadata: { amount: cashbackAmount, paymentId },
  deep_link: `/patients/companion/cost-tracker`,
})
```

---

## 11. Test Results Utility Page

### `TestResultsUtility.tsx`

**Route**: `/#/patients/profile/test-results-utility`
**Visibility**: Conditionally rendered in `PatientProfile.tsx` menu when `useSupabase` is true.

**Component structure**:
```
TestResultsUtility
├── PageHeader ("Test Results Utility")
├── TestList (from profile's recurring tests + any tests detected in payment line items)
│   └── TestCard (for each test)
│       ├── Test name, schedule status, last result date
│       ├── "Generate Results" button
│       └── ResultPreview (shown after generation)
│           ├── Metrics table (name, value, reference, status badge)
│           ├── "Download PDF" button
│           └── "Upload these results →" link
```

**State management**:
- `generatingTest: string | null` — which test is currently being generated
- `generatedResults: Map<string, { metrics, labName, date }>` — cached results per test

**Flow**:
1. Fetch profile to get `recurring_tests.selectedTests`
2. Also scan recent `PAYMENT` events for line items with `LAB_TEST` category → extract test names not in the schedule
3. Display all tests as cards with generate button
4. On "Generate Results": call `supabase.functions.invoke("generate-mock-test-results", { body: { testName } })`
5. Show result preview with metrics table (name, value, reference range, status badge with color coding)
6. "Download PDF": generate PDF client-side using `jsPDF` + `jspdf-autotable` (lazy-imported):
   ```typescript
   async function generatePdf(
     metrics: TestMetric[],
     labName: string,
     date: string,
     patientName: string,
     testName: string
   ) {
     const { default: jsPDF } = await import("jspdf")
     const { default: autoTable } = await import("jspdf-autotable")

     const doc = new jsPDF()

     // Header
     doc.setFontSize(16)
     doc.text(labName, 20, 20)
     doc.setFontSize(10)
     doc.text(`Date: ${date}`, 20, 28)
     doc.text(`Patient: ${patientName}`, 20, 34)
     doc.text(`Test: ${testName}`, 20, 40)

     // Results table
     autoTable(doc, {
       startY: 50,
       head: [["Metric", "Result", "Unit", "Reference Range", "Status"]],
       body: metrics.map((m) => [
         m.name,
         String(m.value),
         m.unit,
         m.referenceRange,
         m.status,
       ]),
       didParseCell: (data) => {
         // Color-code status column
         if (data.column.index === 4 && data.section === "body") {
           const status = data.cell.raw as string
           data.cell.styles.textColor =
             status === "NORMAL" ? [34, 139, 34]
             : status === "LOW" ? [204, 163, 0]
             : status === "HIGH" ? [255, 140, 0]
             : [220, 20, 60] // CRITICAL
         }
       },
     })

     doc.save(`${testName.replace(/\s+/g, "-").toLowerCase()}-results.pdf`)
   }
   ```
   Libraries are lazy-imported so they don't add to the main bundle — only loaded when the user taps "Download PDF".
7. "Upload these results →": navigate to `/patients/companion/test-results?test=${testName}`

**Profile menu integration** (`PatientProfile.tsx`):
```typescript
// Add to menuOptions array, conditionally
...(useSupabase ? [{
  title: "Test Results Utility",
  description: "Generate mock lab results for testing",
  icon: <FlaskConical className="h-5 w-5 text-muted-foreground" />,
  onClick: () => navigate("/patients/profile/test-results-utility"),
}] : []),
```

---

## 12. Education Content Migration

### Seed strategy

1. Build-time script `scripts/generate-education-seed.ts`:
   - Reads `src/mocks/fixtures/education-cards.json`
   - Maps each card to an SQL INSERT for `education_content`
   - Handles `sections` (lesson cards), `estimated_minutes`, `learning_objectives`
   - Outputs `supabase/migrations/003_education_seed.sql`

2. `useEducationFeed` in Supabase mode:
   - Queries `education_content` table, filters by user's conditions (array overlap)
   - Joins with `education_progress` to get completion status per user
   - Returns same shape as current hook

3. `useLessonProgress` in Supabase mode:
   - Reads/writes `education_progress` table instead of MSW endpoint
   - `markSectionComplete(contentId, sectionIndex)` → upserts progress row
   - `markCourseComplete(contentId)` → sets `completed = true`, `completed_at = now()`
   - On course completion: calls `supabase.functions.invoke("generate-ai-insights", { body: { trigger: "course_complete", triggerData: { courseSlug, courseTitle } } })`

---

## 13. AI Pipeline Migration

### Current pipeline (`useAiPipeline.ts`)

1. On companion home load: computes input hash, checks dedup, calls `callLlmApi()` (client-side Gemini)
2. Gemini returns actions → `applyInvoicePopulations()` patches localStorage payments
3. Remaining actions → creates notifications via MSW

### New pipeline (Supabase mode)

1. On companion home load: calls `supabase.functions.invoke("generate-ai-insights", { body: { trigger: "on_demand" } })`
2. Edge Function handles everything server-side (profile fetch, Gemini call, notification creation)
3. Client just invalidates `notifications` query key after the function returns
4. Invoice population is triggered by payment flow, not by the companion home pipeline

### Event-driven insight triggers (client-side calls)

```typescript
// After course completion (in useLessonProgress)
await supabase.functions.invoke("generate-ai-insights", {
  body: {
    trigger: "course_complete",
    triggerData: { courseSlug, courseTitle },
  },
})

// After test result upload (in test results page)
await supabase.functions.invoke("generate-ai-insights", {
  body: {
    trigger: "test_upload",
    triggerData: { testName, metrics },
  },
})
```

---

## 14. Environment & Deployment

### Environment variables

**Client-side** (`.env`):
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_USE_SUPABASE=true
VITE_API_BASE_URL=/api    # kept for MSW mode
```

**Supabase Edge Functions** (set via `supabase secrets set`):
```
GEMINI_API_KEY=AIzaSy...
```

### Supabase project setup

1. Create project on Supabase dashboard (free tier)
2. Run migrations: `supabase db push`
3. Deploy Edge Functions: `supabase functions deploy`
4. Set secrets: `supabase secrets set GEMINI_API_KEY=...`
5. Enable pg_cron extension in dashboard
6. Run education seed: included in migrations
7. Run demo seed: `supabase db push < supabase/seed.sql`

### Demo seed data (`supabase/seed.sql`)

Pre-populates a demo account for presentations:
- Auth user with phone `+254700000001`
- Completed profile: diabetes + hypertension, Metformin + Lisinopril, HbA1c every 3 months
- 6 months of payment history (12 payments, various facilities)
- AI-populated line items on all payments
- Refill and test schedules with realistic states
- 20+ notifications (mix of types)
- Cashback balance: KES 2,125
- Chat history: 5 messages showing AI assistant capability
- Education progress: 3 courses completed, 2 in progress

---

## 15. Build Phases

### Phase 1: Foundation (Supabase setup + data service)
- Supabase project creation
- Database migrations (schema, RLS, education seed)
- `src/lib/supabase.ts` client setup
- `src/lib/data-service.ts` abstraction layer
- `src/types/supabase.ts` generated types
- Environment variable configuration

### Phase 2: Authentication
- `PhoneEntryPage.tsx` + `OtpVerifyPage.tsx`
- `get-otp` Edge Function
- `patientAuthStore.ts` modification for Supabase sessions
- `PatientWrapper.tsx` auth guard updates
- Route registration in `PatientsHome.tsx`

### Phase 3: Data layer migration (hooks)
- Migrate all 12 hooks to dual data source pattern
- Computed queries for cost summary/breakdown
- Wallet balance query
- Verify all existing UI renders correctly with Supabase data

### Phase 4: Edge Functions (AI pipeline)
- `generate-invoice-line-items` function
- `generate-ai-insights` function (all trigger modes)
- `chat-assistant` function
- `pg_cron` setup for hourly batch
- Payment flow integration (`PaymentStatus.tsx` → Edge Function call)
- Event-driven insight triggers wired in client

### Phase 5: Test Results Utility + Education
- `generate-mock-test-results` Edge Function (with PDF generation)
- `TestResultsUtility.tsx` page
- Profile menu integration
- Education progress → insight trigger wiring
- Route registration

### Phase 6: Demo seed + polish
- Demo seed script
- End-to-end testing of full demo flow
- Error states and loading states for Edge Function calls
- Verify MSW fallback still works (`VITE_USE_SUPABASE=false`)
