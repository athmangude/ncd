# Product Specification: Supabase Backend & AI Demo Foundation

**Replace the localStorage mock layer with a real Supabase backend — persistent user accounts, real payment processing with cashback, and AI-powered invoice generation from patient profiles — to create a demonstrable AI healthcare companion.**

Version: 0.2
Date: 2026-09-02

---

## 1. Problem

The NCD Care Companion prototype runs entirely on MSW + localStorage. Every piece of data — user accounts, intake profiles, payment history, AI insights — lives in the browser and disappears when storage is cleared. This makes it impossible to:

1. **Demo to stakeholders.** A demo that requires "fill out the intake form first" before anything works, and loses everything on refresh if localStorage is cleared, does not inspire confidence. Real user accounts with persistent data are table stakes for a credible demo.

2. **Show the AI value proposition.** The AI pipeline (Gemini) currently runs against seeded mock data. The compelling demo is: a real patient logs in, makes a real payment at a facility, and within seconds the AI generates realistic invoice line items from their health profile, then triggers insights ("You're due for a refill", "This lab test costs 40% less at Lancet"). That loop — payment → AI invoice → AI insights — needs real data flowing through it.

3. **Test with real users.** Field testing with CHPs and patients in Nairobi requires accounts that persist across sessions, devices, and app updates. A localStorage prototype cannot survive a phone restart.

The prototype UI is feature-complete. What's missing is the persistence and AI integration layer that makes it real.

---

## 2. Solution

Add a Supabase backend to the existing React frontend:

- **Supabase Auth** for user accounts (phone number + OTP, with mock auto-fill for demo)
- **Supabase Database** (Postgres) for all persistent data — profiles, events, payments, schedules, notifications
- **Supabase Storage** for file uploads (test result images, invoice photos)
- **Supabase Edge Functions** for server-side AI calls (Gemini) — invoice generation and insight pipeline
- **Real payment flow** using the existing Fast Track UI, with cashback calculated and credited on every payment

The MSW mock layer stays in place for local development (`npm run dev` without Supabase). A feature flag (`VITE_USE_SUPABASE=true`) switches between mock and real backends. The API interface (hooks, query keys) stays identical — only the data source changes.

---

## 3. Users

### 3.1 Primary: Demo Audience (Investors, Partners, MoH)
- Sees a real app with real accounts and persistent data
- Watches the AI loop live: payment → invoice generation → insights
- Needs to be impressed in under 5 minutes

### 3.2 Secondary: Field Test Participants (Patients, CHPs)
- Logs in with their phone number
- Fills out the intake form once, data persists forever
- Makes payments and sees their care history grow over time

### 3.3 Tertiary: Developer (building on the foundation)
- Can develop locally with MSW mocks (no Supabase needed)
- Can point at Supabase with one env var change
- AI functions are modular and testable independently

---

## 4. User Experience

### 4.1 Authentication — Mock OTP Flow

The login flow looks and feels like real phone auth, but uses a mock OTP mechanism that auto-fills for frictionless demo and development use.

#### First Visit — Sign Up
1. User opens the app, sees a welcome screen with "Get Started" button
2. Taps "Get Started" → phone number input (Kenyan format, +254 prefix)
3. Enters phone number → submits
4. Lands on OTP screen → the app immediately fetches the OTP from the backend and auto-populates all 6 digits into the input fields
5. User just taps "Verify" → account created in Supabase Auth
6. Redirected to intake form (same as current flow)
7. Completes intake → profile saved to Supabase `profiles` table
8. Lands on Care Companion home with their personalized data

#### Return Visit — Sign In
1. User opens the app → phone number input
2. Enters phone → submits → OTP screen auto-fills → taps Verify → authenticated
3. Profile loaded from Supabase → lands on Care Companion home with all their historical data intact

#### How Mock OTP Works

The OTP is deterministic and retrievable — no real SMS is sent:

1. Client calls `supabase.auth.signInWithOtp({ phone })` — Supabase generates an OTP and stores it
2. A Supabase Edge Function (`get-otp`) returns the OTP for the given phone number (this endpoint exists only in the demo/dev environment and would be removed in production)
3. The OTP screen calls this endpoint on mount, receives the 6-digit code, and populates the input fields automatically
4. User sees the digits appear and just taps "Verify"

This gives the visual experience of a real auth flow (phone entry → OTP screen → verification) without requiring SMS delivery or manual code entry. In production, the `get-otp` endpoint is removed and real SMS delivery is enabled.

#### Session Persistence
- Auth session persists via Supabase's refresh token (stored in secure cookie/localStorage)
- User stays logged in across app restarts until they explicitly sign out
- Session expires after 30 days of inactivity

### 4.2 Payment Flow (Jireh Pay)

The existing Fast Track payment flow is preserved. The change is what happens after payment:

#### Payment → AI Invoice → Insights Pipeline

```
Patient pays at facility
        │
        ▼
┌─────────────────────────────┐
│ Payment recorded in DB      │
│ (facility, amount, date)    │
│ Line items: empty           │
└──────────────┬──────────────┘
               │ triggers Edge Function
               ▼
┌─────────────────────────────┐
│ AI Invoice Generation       │
│                             │
│ Inputs:                     │
│ - Patient profile (meds,    │
│   conditions, test schedule)│
│ - Payment amount + facility │
│ - Refill schedule state     │
│                             │
│ Output:                     │
│ - Invoice line items        │
│   (medications, labs,       │
│    consultations, supplies) │
│ - Items sum ≈ payment total │
└──────────────┬──────────────┘
               │ writes line items to DB
               │ triggers next step
               ▼
┌─────────────────────────────┐
│ AI Insight Pipeline         │
│                             │
│ Inputs:                     │
│ - Profile + all events      │
│ - New invoice line items    │
│ - Refill/test schedules     │
│                             │
│ Output:                     │
│ - Notifications:            │
│   "Refill due in 3 days"    │
│   "HbA1c test overdue"      │
│   "Cost saving: try Lancet" │
│   "Drug interaction warning"│
└──────────────┬──────────────┘
               │ writes notifications to DB
               │ push notification to device
               ▼
┌─────────────────────────────┐
│ Patient sees:               │
│ - Payment with line items   │
│ - Cashback earned (5%)      │
│ - AI notifications          │
│ - Updated care history      │
└─────────────────────────────┘
```

#### Cashback Mechanism
- Every payment earns 5% cashback
- Cashback credited immediately after payment confirmation
- Cashback balance visible on the Jireh Wallet card
- Cashback can be used toward future payments (reduces out-of-pocket)
- `CASHBACK_EARNED` event written to events log with payment reference

### 4.3 Intake Form → Profile Persistence

Current flow preserved, but data goes to Supabase instead of localStorage:

1. User completes intake (conditions, medications, tests, costs, challenges, goals, role)
2. Profile saved to `profiles` table with `completed_at` timestamp
3. Refill schedules generated and saved to `refill_schedules` table
4. Test schedules generated and saved to `test_schedules` table
5. Medication cards seeded to `medication_cards` table (based on selected medications)
6. Cost estimates saved as part of profile

Profile data is the foundation for all AI calls — the AI uses conditions, medications, test schedules, and cost patterns to generate realistic invoices and relevant insights.

### 4.4 AI Demo Flow (The 5-Minute Demo)

This is the sequence a presenter walks through:

1. **"Meet Grace"** — Open app, enter phone number, OTP auto-fills, tap Verify. Account with pre-seeded intake profile loads (diabetes + hypertension, on Metformin + Lisinopril, HbA1c every 3 months)
2. **"Grace visits Nairobi Hospital"** — Tap Jireh Pay, enter the demo payment point number, confirm KES 8,500 payment
3. **"Watch the AI work"** — Within 5-10 seconds:
   - Payment appears with AI-generated line items (consultation KES 1,500, HbA1c KES 2,800, Metformin x60 KES 450, Lisinopril x30 KES 600, ...)
   - Cashback notification: "KES 425 cashback earned"
   - AI insight: "Your HbA1c test is due — results from this visit will appear when uploaded"
   - AI insight: "Your Metformin supply should last 58 more days based on this purchase"
4. **"Her care history builds"** — Navigate to Care History, show the visit grouped by facility with line items, linked test results, and AI annotations
5. **"The AI learns"** — Show the AI Assistant, ask "When should I refill my Metformin?" — answer draws from the real payment + schedule data

### 4.5 Test Results Utility (Mock Result Generator)

A utility page under Profile that lets users generate realistic mock lab results, download them as PDF, and then upload them through the normal test results flow — closing the loop for the AI demo without requiring real lab visits.

#### Where It Lives
- Profile → "Test Results Utility" (new menu item, visible only when `VITE_USE_SUPABASE=true`)
- Route: `/#/patients/profile/test-results-utility`

#### Flow
1. User navigates to Profile → "Test Results Utility"
2. Page shows a list of the user's scheduled tests from their profile (e.g. HbA1c, Lipid Panel, FBS, CBC) — each with its schedule status and a "Generate Results" button
3. User taps "Generate Results" on a test (e.g. HbA1c)
4. Loading state while the `generate-mock-test-results` Edge Function calls Gemini
5. Results appear in a preview card showing:
   - Test name, date, patient name
   - Individual metrics with values, reference ranges, and status badges (Normal/High/Low/Critical)
   - Values are clinically plausible based on the patient's profile — a diabetic on Metformin who's been adherent will show improving HbA1c over time
6. User taps "Download PDF" → browser downloads a formatted lab report PDF
7. User navigates to the Test Results page (link provided: "Upload these results →")
8. Uploads the PDF through the normal test results upload flow
9. AI processes the uploaded PDF → generates insights ("Your HbA1c improved from 7.8% to 7.2% — your medication changes appear to be working")

This creates a complete demo cycle: payment (generates invoice with lab line item) → generate mock results → download PDF → upload for AI processing → receive insights.

### 4.6 What Changes in the UI

Minimal UI changes — the backend swap is transparent:

| Surface | Change |
|---------|--------|
| Login/signup | New phone auth flow with auto-filling OTP (replaces mock login) |
| Intake form | Saves to Supabase instead of localStorage |
| Payment flow | Same Fast Track UI, but payment event goes to Supabase + triggers Edge Function |
| All data views | Same hooks, same query keys — `queryFn` switches between MSW and Supabase fetch |
| AI pipeline | Moves from client-side Gemini call to Edge Function (no API key in browser) |
| Notifications | Real push notifications via FCM (already in the stack) |

---

## 5. Scope

### In scope
- Supabase project setup (database, auth, storage, edge functions)
- Database schema for all care companion entities (profiles, events, schedules, cards, notifications, payments)
- Supabase Auth with mock OTP auto-fill (no real SMS)
- Phone number login/signup flow with OTP screen in the UI
- `get-otp` Edge Function for demo/dev OTP retrieval
- Data layer abstraction — hooks work with both MSW and Supabase
- Migrate all `readCollection`/`writeCollection`/`readObject`/`writeObject` patterns to Supabase queries
- AI Invoice Generation Edge Function (Gemini)
- AI Insight Pipeline Edge Function (Gemini)
- Real cashback calculation and crediting on payments
- Payment event → AI pipeline trigger chain
- FCM push notifications for AI-generated insights
- File upload for test results (Supabase Storage)
- Scheduled hourly AI insight generation via `pg_cron` for all active users
- Education content seeded to Supabase from local fixture (119 articles/courses) and served from DB
- Education progress tracking per user (lesson completion, resume position)
- `EDUCATION_RECOMMENDATION` insight type — AI can recommend courses based on patient context
- Event-driven insight triggers: prescription detected, lab test submitted, course completed, refill/test overdue, cashback milestone
- Test Results Utility page — generate mock lab results via AI, download as PDF, upload for AI processing
- `generate-mock-test-results` Edge Function (Gemini generates clinically plausible results, outputs PDF)
- Demo seed data (pre-populated account for demos)
- Environment-based switching (`VITE_USE_SUPABASE`)

### Out of scope
- Real SMS OTP delivery (Firebase Phone Auth, Africa's Talking) — deferred until production
- Circles (requires SMS invites — deferred until SMS provider is set up)
- Medication loans (complex underwriting logic — keep as mock)
- Provider portal / admin tools
- M-Pesa integration (payments are simulated via Fast Track mock for now)
- Offline/PWA sync with Supabase
- Rate limiting or abuse prevention on Edge Functions
- Multi-tenant / organization accounts

### Deferred to backlog
- Real SMS OTP via Firebase Phone Auth (free 10K/month) or Africa's Talking
- Real M-Pesa payment integration (Daraja API)
- Circle invites via Africa's Talking SMS
- Supabase Realtime subscriptions for live UI updates
- Row-level security policies beyond basic user isolation
- Medication loan processing with real credit scoring

---

## 6. Data & Integration

### 6.1 Supabase Database Schema

```sql
-- Users are managed by Supabase Auth (auth.users)
-- Phone number is the primary identifier

-- Patient profile (intake form data)
create table profiles (
  id uuid primary key references auth.users(id),
  phone text not null,
  first_name text,
  conditions text[] default '{}',
  treatment jsonb default '{}',
  recurring_tests jsonb default '{}',
  cost_estimates jsonb default '{}',
  challenges jsonb default '{}',
  coping jsonb default '{}',
  goals text[] default '{}',
  user_role text,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Care companion events (all types in one table, discriminated by type)
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  type text not null,
  data jsonb not null,
  created_at timestamptz default now()
);
create index idx_events_user_type on events(user_id, type);
create index idx_events_user_created on events(user_id, created_at desc);

-- Refill schedules
create table refill_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  medication_name text not null,
  frequency_days integer not null,
  next_date date not null,
  status text default 'UPCOMING',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Test schedules
create table test_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  test_name text not null,
  frequency_months integer not null,
  next_date date not null,
  status text default 'UPCOMING',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Medication cards (educational content per medication)
create table medication_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  medication_id text not null,
  slug text not null,
  content jsonb not null,
  created_at timestamptz default now()
);

-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  type text not null,
  title text not null,
  body text,
  metadata jsonb default '{}',
  deep_link text,
  read_at timestamptz,
  sent_at timestamptz default now()
);

-- Payments (Jireh Pay transactions)
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  facility_name text not null,
  facility_type text,
  amount numeric not null,
  currency text default 'KES',
  line_items jsonb default '[]',
  funding_sources jsonb default '[]',
  cashback_amount numeric default 0,
  status text default 'COMPLETED',
  created_at timestamptz default now()
);

-- Wallet (cashback balance)
create table wallets (
  user_id uuid primary key references auth.users(id),
  cashback_balance numeric default 0,
  updated_at timestamptz default now()
);

-- Chat history (AI assistant)
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  role text not null, -- 'user' or 'assistant'
  content text not null,
  created_at timestamptz default now()
);

-- Education content (seeded from local fixture data)
create table education_content (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null, -- e.g. 'NUTRITION', 'MEDICATION', 'EXERCISE', 'MENTAL_HEALTH', 'LIFESTYLE'
  conditions text[] default '{}', -- which conditions this content is relevant to
  content_type text not null, -- e.g. 'ARTICLE', 'GUIDE', 'TIP', 'COURSE'
  summary text,
  body text not null,
  sections jsonb default '[]', -- lesson card sections for swipeable courses
  estimated_minutes integer default 5,
  learning_objectives text[] default '{}',
  image_theme text, -- gradient theme key for card headers
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_education_conditions on education_content using gin(conditions);

-- Education progress (per-user lesson completion tracking)
create table education_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  content_id uuid not null references education_content(id),
  current_section integer default 0,
  completed boolean default false,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique(user_id, content_id)
);
```

### 6.2 Row-Level Security (Basic)

Every table with `user_id` gets a simple RLS policy:
```sql
alter table profiles enable row level security;
create policy "Users see own data" on profiles
  for all using (auth.uid() = id);
```

Same pattern for events, schedules, notifications, payments, wallet, chat_messages, education_progress. Users can only read and write their own data.

Education content is public (read-only for all authenticated users):
```sql
alter table education_content enable row level security;
create policy "Authenticated users can read education content" on education_content
  for select using (auth.role() = 'authenticated');
```

### 6.3 Edge Functions

#### `get-otp` (Demo/Dev Only)
- **Purpose**: Returns the OTP for a given phone number so the client can auto-fill it
- **Input**: phone number
- **Process**: Queries Supabase Auth's internal OTP store for the most recent code sent to that phone
- **Output**: `{ otp: "123456" }`
- **Security**: This endpoint exists only in demo/dev environments. In production, it is removed and real SMS delivery is enabled via Supabase Auth's built-in phone provider or Firebase Phone Auth

#### `generate-invoice-line-items`
- **Trigger**: Called after a payment is created (via database webhook or client call)
- **Input**: payment ID, user ID
- **Process**:
  1. Fetch patient profile (conditions, medications, test schedule)
  2. Fetch refill schedule state (what's due, what's overdue)
  3. Call Gemini with profile context + payment amount + facility type
  4. Gemini returns realistic line items that sum to ≈ payment amount
  5. Write line items to `payments.line_items`
  6. Write `PAYMENT` event to `events` table with line items
  7. Call `generate-ai-insights` function
- **Gemini prompt**: Same as current `INVOICE_POPULATE` prompt in `ai-pipeline.ts`, but server-side

#### `generate-ai-insights`
- **Triggers**:
  1. Called after invoice population (payment → invoice → insights chain)
  2. On-demand from the app (user pulls to refresh, opens companion home)
  3. **Scheduled hourly cron** via Supabase `pg_cron` — iterates all users with a completed profile and generates insights where relevant
  4. **Event-driven** — triggered by specific user actions that warrant a contextual insight:
     - **Prescription detected**: AI-generated invoice line items include a medication → insight about dosage, interactions, or refill timing
     - **Lab test submitted**: User uploads test results → insight about what the results mean, trends vs previous results, next steps
     - **Education course completed**: User finishes a course → insight recommending a follow-up course or reinforcing a key takeaway ("Now that you've learned about managing blood sugar with diet, here's how to track your progress...")
     - **Refill overdue**: Schedule shows a missed refill window → nudge to refill with nearby pharmacy link
     - **Test overdue**: Scheduled test date passed without a corresponding result upload → reminder with cost estimate
     - **Cashback milestone**: Accumulated cashback crosses a threshold → suggestion to apply it to an upcoming refill
- **Input**: user ID (single-user mode) or no input (batch mode for cron)
- **Process**:
  1. Fetch profile + last 50 events + refill/test schedules + education progress
  2. Call Gemini with the same system prompt as current `callLlmApi`
  3. Gemini can return any action type including `EDUCATION_RECOMMENDATION` — recommending a specific course from the `education_content` table based on the patient's conditions, recent events, or knowledge gaps (e.g. "You were recently diagnosed with hypertension — take the course on managing blood pressure with diet")
  4. For each action returned: create notification, update schedules if needed
  5. Deduplicate — skip insights that are substantially similar to one generated in the last 24 hours for the same user
  6. Send FCM push notification for high-priority insights
- **Output**: notifications written to DB
- **Batch mode (cron)**: Queries all users with `completed_at IS NOT NULL`, processes each sequentially (or in small batches to respect Gemini rate limits). Skips users who already received an insight in the last hour

#### `generate-mock-test-results`
- **Trigger**: User taps "Generate mock results" on the Test Results Utility page
- **Input**: user ID, test name (e.g. "HbA1c", "Lipid Panel", "CBC")
- **Process**:
  1. Fetch patient profile (conditions, medications, age, treatment history)
  2. Fetch previous test results for this test type from events
  3. Call Gemini to generate clinically plausible test result metrics — values are informed by the patient's conditions, medications, and trends from prior results (e.g. a diabetic on Metformin for 6 months might show HbA1c trending from 8.1% → 7.4%)
  4. Generate a PDF using the results — formatted as a lab report with patient name, date, test name, individual metrics with values, reference ranges, and status flags (Normal/Low/High/Critical)
  5. Store the PDF in Supabase Storage and return a download URL
- **Output**: `{ downloadUrl: "https://xxx.supabase.co/storage/v1/...", metrics: [...] }`

#### `chat-assistant`
- **Trigger**: User sends a message in the AI assistant
- **Input**: user ID, message, conversation history, user profile (conditions, medications, test schedules, cost estimates)
- **Process**: Same as current `callAssistantChat` but server-side — fetches the full user profile and recent events to ground the conversation in the patient's real health data (no API key in browser)
- **Output**: assistant reply

### 6.4 Data Layer Abstraction

Each React Query hook gets a Supabase implementation alongside the existing MSW one:

```typescript
// hooks/useIntakeProfile.ts (simplified)
import { supabase } from "@/lib/supabase"

export function useIntakeProfile() {
  const useSupabase = import.meta.env.VITE_USE_SUPABASE === "true"

  return useQuery({
    queryKey: [intakeProfileQueryKey],
    queryFn: useSupabase
      ? async () => {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .single()
          return data
        }
      : async () => {
          const { data } = await axios.get(`${baseUrl}/companion/profile`)
          return data
        },
  })
}
```

This pattern applies to every hook. The query key stays the same, so cache invalidation, optimistic updates, and dependent queries all work unchanged.

### 6.5 Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_USE_SUPABASE=true

# Gemini (moves to Edge Function env, not in client)
# GEMINI_API_KEY=... (set in Supabase Edge Function secrets)
```

---

## 7. Success Criteria

- A new user can enter a Kenyan phone number (+254...), land on the OTP screen, see the OTP auto-populate, tap Verify, and have an account created
- The same user can sign in on a different device and see their data
- Intake form data persists in Supabase and survives app restarts, cache clears, and device changes
- A payment made via Fast Track creates a record in Supabase with an empty `line_items` field
- Within 10 seconds of payment, the AI Invoice Edge Function populates `line_items` with realistic entries based on the patient's profile
- Line items sum to approximately the payment amount (within 10%)
- Within 15 seconds of payment, AI insights are generated and appear as notifications
- Cashback of 5% is credited to the wallet on every payment
- The Care History page shows real events from Supabase, not seeded mock data
- The AI Assistant answers questions using real profile and event data from Supabase
- `VITE_USE_SUPABASE=false` (or unset) falls back to MSW mocks — local dev works without Supabase
- The Gemini API key is never exposed to the browser — all AI calls go through Edge Functions
- Completing an education course triggers an `EDUCATION_RECOMMENDATION` insight suggesting a follow-up course
- A payment with AI-generated invoice line items containing a prescription triggers medication-specific insights
- Uploading test results triggers insights about trends and next steps
- The Test Results Utility page generates clinically plausible mock results as a downloadable PDF, informed by the patient's profile and prior results
- The uploaded PDF is processed by AI and generates relevant insights
- Demo account can be pre-seeded with 6 months of realistic data for presentations
- All tables have RLS policies — users cannot access other users' data

---

## 9. Open Questions

- **Q: Should we use Supabase Database Webhooks or client-side triggers for the AI pipeline?** Database webhooks (pg_notify → Edge Function) are more reliable but add infrastructure complexity. Client-side triggers (after payment confirmation, call the Edge Function) are simpler but depend on the client staying online. For a demo, client-side triggers are sufficient; for production, webhooks are better.

- **Q: Should the demo seed script run as a Supabase migration or a standalone script?** A migration keeps it versioned with the schema. A standalone script (e.g. `npm run seed:demo`) is more flexible for creating different demo personas. Leaning toward standalone script.
