# Full Supabase Migration Plan — Remove All Fixture/MSW Data

## Goal

Eliminate all MSW handlers, fixture JSON imports, and `useSupabase` feature flag branching. Every data path runs through Supabase. The `src/mocks/` directory becomes dead code that can be deleted. No client-side UI/component structure changes — Supabase tables store data in the exact shape components consume, or hooks map with thin snake_case→camelCase converters. Component files that call `axios` directly get their fetch calls replaced with `supabase.from()` queries — no UI or component structure changes.

**Exception:** FacilitatorPanel's seed/reset functions move from synchronous mock calls to async Supabase RPCs, which requires adopting React Query hooks or `useEffect`/`useState` patterns. This is a data-layer structural change, not a UI change.

## Current State

### Already on Supabase (no work needed)
- `profiles` — intake form data (conditions, treatment, goals, etc.)
- `events` — care companion events (payments, refills, test results, AI insights)
- `refill_schedules`, `test_schedules` — medication/test scheduling
- `medication_cards` — educational cards per medication
- `notifications` — push notification records
- `payments` — transaction history (recently enriched with `payment_splits`, `cashback_details`, `user_info`)
- `wallets` — cashback balance
- `chat_messages` — AI assistant conversation history
- `education_content`, `education_progress` — health education articles + completion tracking
- `facilities`, `facility_services`, `service_categories` — discovery reference data
- `discount_codes` — promotional codes
- `facility_reviews` — user reviews of facilities
- `recent_searches`, `preferred_providers` — per-user discovery state

**RLS:** All existing tables already have RLS policies applied via `002_rls_policies.sql`. No backfill needed.

### Still on MSW/fixtures (this migration)

Three categories of files need migration:

| Category | Count | Description |
|----------|-------|-------------|
| **Hooks with `useSupabase` branching** | 28 files | Have both Supabase and axios paths — strip the axios branch |
| **Components with direct `axios` calls** | ~79 files | Call `axios.get/post` against MSW endpoints directly (no `useSupabase` flag). Replace with `supabase.from()` or `supabase.rpc()` calls |
| **Production imports from `@/mocks/`** | 14 files | Import types, domain functions, or fixtures from mock modules. Relocate imports before deleting mocks |

### Full File Inventory

#### A. Hooks with `useSupabase` branching (28 files)

| Area | Files |
|------|-------|
| **Care Companion hooks (20)** | `useIntakeProfile`, `useCareCompanionHome`, `useCareHistory`, `useClinicalVisits`, `useCostBreakdown`, `useCostSummary`, `useEducationFeed`, `useEmergencyCard`, `useEmergencyTransportCredit`, `useInteractionCheck`, `useLessonProgress`, `useMedicationCards`, `useMedicationList`, `useMedicationLoanPreApproval`, `useNotifications`, `useRecentPayments`, `useRefillSchedule`, `useSuggestedPrompts`, `useAiPipeline`, `useAssistantChat` |
| **Auth/routing (8)** | `patientAuthStore.tsx`, `PatientWrapper.tsx`, `PatientsHome.tsx`, `PatientDashboard.tsx`, `PatientProfile.tsx`, `useOnboardingChecklist.tsx`, `CareCompanionIntake.tsx`, `data-service.ts` |

**Note:** `usePatientLoginDetails.ts` is in Section A but needs a **full rewrite** (not just flag stripping) — see Section 3.2. `useMedicationTimeline` and `useCareCompanionProfile` do NOT have `useSupabase` flags despite previous classification — they are pure axios files listed in Section B.

#### B. Components with direct axios calls (~79 files)

| Area | Files |
|------|-------|
| **Loans (14)** | `PatientAllLoans`, `PatientViewLoanDetails`, `PatientInvoiceDetails`, `LoanCreationSuccess`, `PatientLoanTerms`, `PatientManualRequestStatus`, `PatientPaymentConfirmation`, `PatientReviewInvoice`, `PatientSelectPatient`, `PatientSetBillAmount`, `PatientTreatmentDetails`, `PatientUploadInvoice`, `PatientVerificationPending`, `PatientWalletSelection` |
| **Network (10)** | `AddCircleMemberPage`, `CheckProfilePhotoPage`, `InviteRequestCard`, `useCancelInvite`, `useMemberActivity`, `useRemoveConnection`, `PatientAcceptInvite`, `PatientAcceptShareLink`, `PatientAddConnection`, `PreviewInvitePage` |
| **Onboarding (17)** | `PatientAddWhatsAppNumber`, `PatientDocumentVerification`, `PatientFinancialStatements`, `PatientFinancialStatementsWithCreditUpdate`, `PatientGuarantorInformation`, `PatientIdSelfie`, `PatientIdVerification`, `PatientIdVerificationOnboarding`, `PatientMembershipSuccess`, `PatientOrgOnboardingSuccess`, `PatientPayMembership`, `PatientPersonalDetails`, `PatientReferralCode`, `PatientResolveType`, `PatientReviewMembershipDetails`, `PatientSetPin`, `PatientSignUp` |
| **Payment (6)** | `PatientPaymentBreakdown`, `PatientPaymentHistory`, `PatientPaymentPortal`, `PatientPaymentStatus`, `PatientTransactionResult`, `PaymentRequestsSection` |
| **Fast Track (3)** | `api.ts`, `PaymentDetails.tsx`, (handler calls via api.ts) |
| **Care Fund (2)** | `CareFundTransactions`, `PatientGiftRecipient` |
| **Care Companion (7)** | `CareCompanionHome`, `AddMedicationDrawer`, `RefillSchedulePage`, `useIntakeForm`, `AvailablePromosSection`, `useMedicationTimeline`, `useCareCompanionProfile` |
| **Profile/Dashboard (4)** | `PatientProfile`, `PatientDashboard`, `PatientChangePin`, `PatientHelpAndSupport` |
| **Hooks (4)** | `usePatientLoginDetails` (rewrite — see 3.2), `usePaymentHistory`, `useDownloadReceipt`, `useNextCareProfileStep` |
| **Notifications (1)** | `PatientNotificationsPage` |
| **Shared components (2)** | `SearchField`, `StatementUploadForm` |
| **Misc (9)** | `CallToActions`, `PatientPinPrompt`, `WaitlistDialog`, `PatientScanQRIntro`, `PatientTermsAndConditions`, `PatientValidateReferral`, `InstallAppPage`, `PatientSubscriptionsTransactionResult`, `VerifyEmailPage` |

**Note:** Some files appear in both Section A and B (e.g., `PatientProfile`) — they need both flag stripping and direct axios replacement. `PatientDashboard` appears in Section A (flag stripping) and Section B only because its direct axios calls are inside the `useSupabase` branch — once the flag is stripped, the Supabase path (which already uses `supabase.from()`) is the only path. No separate Section B work needed for it.

#### C. Production imports from `@/mocks/` (14 files)

| File | Imports from | Action |
|------|-------------|--------|
| `FacilitatorPanel.tsx` | 12 imports from 8 mock modules (~30 functions + seed/reset functions) | Full data-layer rewrite — all mock domain calls → Supabase queries + new RPCs for seed/reset |
| `patientAuthStore.tsx` | `clearAllParticipantState` from `domain/reset` | Move to `src/lib/auth-utils.ts` as no-op |
| `EducationFeedPage.tsx` | `LessonProgress` type from `domain/careCompanion` | Move type to `src/types/education.ts` |
| `useLessonProgress.ts` | `LessonProgress` type from `domain/careCompanion` | Move type to `src/types/education.ts` |
| `CareCompanionHome.tsx` | `getMedicationPriceKES` from fixtures | Replace with Supabase query on `medication_taxonomy` |
| `AddMedicationDrawer.tsx` | `medication-taxonomy.json`, `getMedicationPriceKES` | Replace with Supabase query |
| `ConditionTypeahead.tsx` | `medication-taxonomy.json` | Replace with Supabase query |
| `CostEstimationStep.tsx` | `getMedicationPriceKES`, `recurring-tests.json` | Replace with Supabase queries |
| `RecurringTestsStep.tsx` | `recurring-tests.json` | Replace with Supabase query |
| `TreatmentStep.tsx` | `medication-taxonomy.json` | Replace with Supabase query |
| `RefillSchedulePage.tsx` | `getMedicationPriceKES` | Replace with Supabase query |
| `useMyMedicationStock.ts` | `getProfileAwarePharmacyStock` from `domain/careCompanion` | Replace with Supabase query on `pharmacy_stock` |
| `useStockSearch.ts` | `searchPharmacyStockByName` from `domain/careCompanion` | Replace with Supabase query |
| `FacilityMedicationStock.tsx` | `getFacilityMedicationStock` from `domain/careCompanion` | Replace with Supabase query |

---

## Phase 1: New Supabase Tables + Seed Data

### Migration `013_full_migration_schema.sql`

#### 1.1 `network_members` — circle members (3 seed records)

```
network_members (
  id text primary key,
  user_id uuid not null references auth.users(id),
  first_name text not null,
  last_name text not null,
  phone_number text,
  profile_photo text,
  relationship text not null,
  type text not null,           -- ACCOUNTABLE | AUXILIARY | CHILD
  status text default 'ACTIVE',
  nickname text,
  joined_at timestamptz,
  has_defaulted_loan boolean default false
)
```

#### 1.2 `network_invites` — pending circle invites (1 seed record)

```
network_invites (
  id text primary key,
  user_id uuid not null references auth.users(id),
  first_name text not null,
  last_name text not null,
  phone_number text,
  status text default 'PENDING',
  profile_photo text,
  invite_link text,
  nickname text,
  relationship text,
  created_at timestamptz default now()
)
```

#### 1.3 `circle_activity` — circle events (3 seed records)

```
circle_activity (
  id text primary key,
  user_id uuid not null references auth.users(id),
  event_type text not null,
  occurred_at timestamptz not null,
  acknowledged_at timestamptz,
  member jsonb not null,        -- { id, firstName, lastName, avatarUrl }
  still_qualifies_for_borrowing boolean default true,
  invite_id text
)
```

**Note:** `member` JSONB denormalizes `network_members` data. Acceptable for prototype — a production system would use a foreign key to `network_members.id` instead.

#### 1.4 `care_fund_transactions` — cashback/transfer history (5 seed records)

```
care_fund_transactions (
  id text primary key,
  user_id uuid not null references auth.users(id),
  transaction_amount numeric not null,
  currency jsonb not null,      -- { code, symbol, name }
  type text not null,           -- EARNED | TRANSFER | SPENT
  status text default 'COMPLETED',
  sender jsonb,                 -- { accountOwner: { id, firstName, lastName } }
  receiver jsonb,
  receiver_phone_number text,
  description text,
  loan jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz
)
```

**Indexes:**
- `create index idx_care_fund_transactions_user on care_fund_transactions(user_id, created_at desc);`

**Network table indexes** (defined with their schemas above):
- `create index idx_network_members_user on network_members(user_id);`
- `create index idx_network_invites_user on network_invites(user_id);`
- `create index idx_circle_activity_user on circle_activity(user_id, occurred_at desc);`

#### 1.5 `loans` — loan records (2 seed records)

```
loans (
  id text primary key,
  user_id uuid not null references auth.users(id),
  amount numeric not null,
  total_bill_amount numeric not null,
  outstanding_amount numeric default 0,
  total_paid numeric default 0,
  care_fund_discount_amount numeric default 0,
  accumulated_interest_amount numeric default 0,
  late_fees numeric default 0,
  status text default 'DISBURSED',
  loan_type text default 'MEMBERSHIP',
  currency jsonb not null,
  created_at timestamptz default now(),
  loan_due_date timestamptz,
  first_payment_due timestamptz,
  patient_name text,
  patient_medical_info_request jsonb,
  transactions jsonb default '[]'
)
```

**Index:** `create index idx_loans_user on loans(user_id, status);`

**Note:** `transactions` as JSONB array prevents individual transaction queries. Acceptable for prototype. Loan repayment history from `payment-history.json` is embedded within `loans.transactions` JSONB.

#### 1.6 `manual_requests` — manual payment review requests (2 seed records)

```
manual_requests (
  id text primary key,
  user_id uuid not null references auth.users(id),
  care_provider_name text not null,
  bill_amount text not null,
  payment_info jsonb,
  reason text,
  status text default 'PENDING',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  patient jsonb,
  dependent jsonb,
  kmpdc_facility jsonb,
  invoice_file jsonb
)
```

#### 1.7 `patient_details` — login details / profile summary (1 seed record)

```
patient_details (
  user_id uuid primary key references auth.users(id),
  data jsonb not null,          -- the full login-details shape, stored as-is
  updated_at timestamptz default now()
)
```

**Rationale:** The login details object has 30+ fields with deep nesting (wallets array, creditLimit, patientCircle, loans, careFundAccount). Normalizing adds complexity with no querying benefit — this data is always fetched as one blob.

**Concurrency:** Read-modify-write on this JSONB blob risks lost updates. Mitigation: use `updated_at` as an optimistic lock — read the row, include `updated_at` in the update's `WHERE` clause, retry on mismatch.

**Stale data warning:** `patient_details.data` contains wallet balances, credit limits, and loan summaries that are also stored in `wallets`, `loans`, and `care_fund_transactions`. Mutations via RPCs update the normalized tables but NOT this JSONB blob. See Section 3.2 for the `usePatientLoginDetails` composition strategy.

**Seed data:** Must include `id-verification-details` fields (gender, dateOfBirth, photo) merged into the JSONB blob, as the onboarding ID verification step reads from `patient_details.data`.

#### 1.8 `country_codes` — reference data (14 seed records)

```
country_codes (
  country_code text primary key,
  name text not null,
  calling_code text not null
)
```

#### 1.9 `guarantor_invites` — onboarding data (1 seed record)

```
guarantor_invites (
  user_id uuid primary key references auth.users(id),
  data jsonb not null           -- full shape: { patientCountryCode, countryOptions, localGuarantorInvites, internationalGuarantorInvites }
)
```

#### 1.10 `medication_taxonomy` — medication database (reference, ~350 records)

```
medication_taxonomy (
  id text primary key,          -- e.g. "metformin-500mg"
  name text not null,
  generic_name text,
  category text not null,
  sub_category text,
  dosage_form text,
  strength text,
  unit text,
  condition_tags text[] default '{}',
  common_brands text[] default '{}',
  price_kes numeric,            -- from medication-prices.ts
  requires_prescription boolean default false,
  is_controlled boolean default false,
  storage text,
  side_effects text[] default '{}',
  interactions text[] default '{}',
  notes text
)
```

**Seed approach:** ~350 records — use Node.js script (`node supabase/scripts/seed-medication-taxonomy.js`) to merge `medication-taxonomy.json` + `medication-prices.ts` and batch-insert.

**Index:** `create extension if not exists pg_trgm; create index idx_medication_taxonomy_name on medication_taxonomy using gin(name gin_trgm_ops);`

#### 1.11 `recurring_tests` — test catalog (reference, ~20 records)

```
recurring_tests (
  id text primary key,
  name text not null,
  category text not null,
  description text,
  frequency_months integer,
  estimated_cost_kes numeric,
  condition_tags text[] default '{}'
)
```

#### 1.12 `pharmacy_stock` — pre-generated stock data (~1000 records)

```
pharmacy_stock (
  id text primary key,
  facility_id integer not null references facilities(id),
  medication_name text not null,
  status text not null,         -- IN_STOCK | LOW_STOCK | OUT_OF_STOCK
  price_kes numeric,
  last_verified_at timestamptz default now()
)
```

**Index:** `create index idx_pharmacy_stock_facility on pharmacy_stock(facility_id);`
`create index idx_pharmacy_stock_medication on pharmacy_stock using gin(medication_name gin_trgm_ops);`

**Seed approach:** Node.js script (`node supabase/scripts/seed-pharmacy-stock.js`) runs the existing domain generation function once and batch-inserts. Must include `price_kes` per row (derived from `medication_taxonomy.price_kes` with small variance).

#### 1.13 `fast_track_providers` — payment point data (1 seed record)

```
fast_track_providers (
  id integer primary key,
  name text not null,
  payment_number text not null,
  payment_code text not null,
  sms_phone_numbers text[] default '{}',
  is_active boolean default true,
  facility jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

#### 1.14 `link_social_options` — social linking options (small, ~5 records)

```
link_social_options (
  provider text primary key,
  label text not null
)
```

**Note:** Schema matches the fixture shape `{ provider, label }`. The MSW handler returns `{ options: [...] }`.

### `updated_at` Triggers

Apply the existing `update_updated_at()` trigger to all new tables that have `updated_at`:

```sql
create trigger care_fund_transactions_updated_at before update on care_fund_transactions
  for each row execute function update_updated_at();
create trigger manual_requests_updated_at before update on manual_requests
  for each row execute function update_updated_at();
create trigger patient_details_updated_at before update on patient_details
  for each row execute function update_updated_at();
create trigger fast_track_providers_updated_at before update on fast_track_providers
  for each row execute function update_updated_at();
```

**Critical for `patient_details`:** The `updated_at` column is the optimistic locking mechanism — without the trigger, the lock never advances automatically.

### RLS Policies

All new tables:
- **Reference data** (medication_taxonomy, recurring_tests, country_codes, pharmacy_stock, fast_track_providers, link_social_options): authenticated read
- **User-scoped data** (network_members, network_invites, circle_activity, care_fund_transactions, loans, manual_requests, patient_details, guarantor_invites): user can read/write own rows only

---

## Phase 2: Seed Data Migration

### Migration `014_full_migration_seed.sql` (small datasets only)

| Table | Source | Records | Notes |
|-------|--------|---------|-------|
| `network_members` | `patient-network.json` | 3 | |
| `network_invites` | `patient-network.json` | 1 | |
| `circle_activity` | `circle-activity.json` | 3 | |
| `care_fund_transactions` | `care-fund-transactions.json` | 5 | |
| `loans` | `loans.json` | 2 | |
| `manual_requests` | `manual-requests.json` | 2 | |
| `patient_details` | `patient-login-details.json` + `id-verification-details.json` | 1 | Merge id-verification fields into JSONB blob |
| `country_codes` | `country-codes.json` | 14 | |
| `guarantor_invites` | `guarantor-invites.json` | 1 | |
| `fast_track_providers` | `fast-track-provider.json` | 1 | |
| `recurring_tests` | `recurring-tests.json` | ~20 | |
| `link_social_options` | `link-social-options.json` | ~5 | |

### Enriched Payments Seed

The existing `payments` table needs additional seed rows from `payment-history.json` with rich fields: `patient_medical_info_request`, `disbursement_transaction`, and fully populated `payment_splits`/`cashback_details`/`user_info`. Without this, the dashboard payment history shows only the few seed payments from migration 001. Add columns if needed:

```sql
alter table payments
  add column if not exists patient_medical_info_request jsonb,
  add column if not exists disbursement_transaction jsonb,
  add column if not exists description text;
```

**`description` column:** Used by `rpc_initiate_repayment` to store display text ("Loan repayment of X KES") and by the transaction result page. Components derive `isLoanRepayment` from `facility_type = 'REPAYMENT'` rather than a separate boolean — this convention must be documented in the mapper where `PatientTransactionResult` reads payment records.

### Node.js Seed Scripts (large datasets)

| Script | Source | Records |
|--------|--------|---------|
| `supabase/scripts/seed-medication-taxonomy.js` | `medication-taxonomy.json` + `medication-prices.ts` | ~350 |
| `supabase/scripts/seed-pharmacy-stock.js` | Domain generation function output | ~1000 |

All user-scoped rows use demo user UUID `6b4d8e63-16c9-4aa6-ae9c-73820311007a`.

---

## Phase 2.5: Postgres RPC Functions for Multi-Table Mutations

All RPCs use `auth.uid()` internally instead of accepting `p_user_id` as a parameter, preventing callers from operating on other users' data.

### `rpc_apply_for_loan`

**Credit limit enforcement:** Before creating the loan, read `patient_details.data->'creditLimit'->'remainingAmount'` and reject if the requested amount exceeds it. After disbursement, update `remainingAmount` downward.

```sql
create or replace function rpc_apply_for_loan(
  p_amount numeric,
  p_facility_name text,
  p_facility_type text,
  p_currency text default 'KES'
) returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
  v_loan_id text;
  v_payment_id text;
  v_details jsonb;
  v_remaining numeric;
  v_user_info jsonb;
begin
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;

  -- Lock patient_details row + credit limit check
  select data into v_details from patient_details where user_id = v_user_id for update;
  v_remaining := coalesce((v_details->'creditLimit'->>'remainingAmount')::numeric, 0);
  if p_amount > v_remaining then
    raise exception 'Amount exceeds credit limit (remaining: %)', v_remaining;
  end if;

  v_loan_id := 'loan-' || gen_random_uuid()::text;
  v_payment_id := gen_random_uuid()::text;
  v_user_info := jsonb_build_object(
    'firstName', coalesce(v_details->>'firstName', 'Demo'),
    'lastName', coalesce(v_details->>'lastName', 'User')
  );

  insert into loans (id, user_id, amount, total_bill_amount, outstanding_amount, currency, status, created_at)
  values (v_loan_id, v_user_id, p_amount, p_amount, p_amount, jsonb_build_object('code', p_currency), 'DISBURSED', now());

  insert into payments (id, user_id, amount, currency, status, facility_name, facility_type,
    funding_sources, payment_splits, cashback_details, user_info, created_at)
  values (v_payment_id, v_user_id, p_amount, p_currency, 'COMPLETED', p_facility_name, p_facility_type,
    jsonb_build_array(jsonb_build_object('source', 'LOAN', 'amount', p_amount)),
    jsonb_build_array(jsonb_build_object(
      'id', 'split-1', 'createdAt', now(), 'paymentSplitAmount', p_amount,
      'wallet', jsonb_build_object('type', 'LOAN'), 'loan', jsonb_build_object('id', v_loan_id)
    )),
    '[]'::jsonb,
    v_user_info,
    now());

  -- Update credit limit remaining (stored as string to match TS types)
  update patient_details set data = jsonb_set(
    data, '{creditLimit,remainingAmount}',
    to_jsonb((v_remaining - p_amount)::text)
  ) where user_id = v_user_id;

  return jsonb_build_object('loanId', v_loan_id, 'paymentId', v_payment_id);
end;
$$ language plpgsql security definer;
```

**Payment record creation is intentional:** `rpc_apply_for_loan` creates both a `loans` row AND a `payments` row. The payment record is what makes the loan disbursement appear in the user's payment history on the dashboard. Without it, the loan would exist but would not show up in `GET /patients/payment-history`.

### `rpc_initiate_repayment`

**Return shape:** Must include `isChargeTransaction`, `authorizationUrl`, `reference` — the component destructures these to route to the transaction result screen.

**Status value:** Uses `'PAID'` (not `'FULLY_PAID'`) to match frontend checks.

**Cashback:** Earns 5% cashback on repayment amount, matching MSW behavior.

**Credit limit lifecycle:** On FULL repayment only (status → PAID): increases `totalCreditLimitAmount` by 25% (`x * 1.25`), then restores `remainingAmount` accounting for the growth delta. Does NOT grow on partial repayments. Partial repayments still restore `remainingAmount` by the repayment amount (capped at current total).

**Paid-loan guard:** Rejects repayment on loans with status `'PAID'` — prevents free cashback/credit inflation exploits.

**Overpayment cap:** Caps `p_amount` at `outstanding_amount` — prevents value leakage where excess payment evaporates.

**Input validation:** Rejects non-positive amounts.

**Transaction JSONB:** Must include `date` and `description` fields — `PatientViewLoanDetails` reads `transaction.date` for timeline grouping and `t.description` as timeline item title.

**User info:** Must read `patient_details.data` for `user_info` on the payment INSERT — without this, the payment detail page shows no patient name.

**Care Fund ledger:** Must insert an EARNED row into `care_fund_transactions` for the cashback.

**Row locking:** Uses `SELECT ... FOR UPDATE` on `patient_details` to prevent concurrent RPCs from corrupting credit limit.

```sql
create or replace function rpc_initiate_repayment(
  p_loan_id text,
  p_amount numeric
) returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
  v_loan loans%rowtype;
  v_new_outstanding numeric;
  v_txn jsonb;
  v_reference text;
  v_cashback numeric;
  v_details jsonb;
  v_user_info jsonb;
  v_current_total numeric;
  v_new_total numeric;
  v_new_remaining numeric;
  v_growth_delta numeric;
begin
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;

  select * into v_loan from loans where id = p_loan_id and user_id = v_user_id;
  if not found then raise exception 'Loan not found'; end if;
  if v_loan.status = 'PAID' then raise exception 'Loan is already fully paid'; end if;

  -- Cap repayment at outstanding amount
  p_amount := least(p_amount, v_loan.outstanding_amount);

  -- Lock patient_details row to prevent concurrent credit limit corruption
  select data into v_details from patient_details where user_id = v_user_id for update;
  v_user_info := jsonb_build_object(
    'firstName', coalesce(v_details->>'firstName', 'Demo'),
    'lastName', coalesce(v_details->>'lastName', 'User')
  );

  v_reference := gen_random_uuid()::text;
  v_new_outstanding := greatest(v_loan.outstanding_amount - p_amount, 0);
  v_cashback := round(p_amount * 0.05, 2);

  v_txn := jsonb_build_object(
    'id', 'txn-' || gen_random_uuid()::text,
    'amount', p_amount,
    'type', 'REPAYMENT',
    'description', 'Loan repayment',
    'date', now(),
    'createdAt', now()
  );

  update loans set
    outstanding_amount = v_new_outstanding,
    total_paid = total_paid + p_amount,
    transactions = transactions || v_txn,
    status = case when v_new_outstanding = 0 then 'PAID' else status end
  where id = p_loan_id and user_id = v_user_id;

  -- Credit limit update
  v_current_total := coalesce((v_details->'creditLimit'->>'totalCreditLimitAmount')::numeric, 0);

  if v_new_outstanding = 0 then
    -- FULL repayment: grow totalCreditLimitAmount by 25% (x * 1.25)
    v_new_total := round(v_current_total * 1.25, 2);
    v_growth_delta := v_new_total - v_current_total;
    -- Remaining gets repayment amount + growth delta, capped at new total
    v_new_remaining := least(
      coalesce((v_details->'creditLimit'->>'remainingAmount')::numeric, 0) + p_amount + v_growth_delta,
      v_new_total
    );
  else
    -- PARTIAL repayment: no growth, just restore remaining by repayment amount
    v_new_total := v_current_total;
    v_new_remaining := least(
      coalesce((v_details->'creditLimit'->>'remainingAmount')::numeric, 0) + p_amount,
      v_new_total
    );
  end if;

  update patient_details set data = jsonb_set(
    jsonb_set(data, '{creditLimit,totalCreditLimitAmount}', to_jsonb(v_new_total::text)),
    '{creditLimit,remainingAmount}', to_jsonb(v_new_remaining::text)
  ) where user_id = v_user_id;

  -- Earn cashback on repayment
  update wallets set cashback_balance = cashback_balance + v_cashback where user_id = v_user_id;

  -- Record cashback in care fund ledger
  insert into care_fund_transactions (id, user_id, transaction_amount, currency, type, status, description, created_at)
  values ('cft-' || gen_random_uuid()::text, v_user_id, v_cashback,
    '{"code": "KES", "symbol": "KES", "name": "Kenyan Shilling"}'::jsonb,
    'EARNED', 'COMPLETED', 'Cashback from loan repayment', now());

  -- Insert transaction result record with user_info
  -- facility_type = 'REPAYMENT' lets the component derive isLoanRepayment
  -- description column stores display text for transaction result page
  insert into payments (id, user_id, amount, currency, status, facility_name, facility_type,
    funding_sources, payment_splits, cashback_details, cashback_amount, user_info, description, created_at)
  values (v_reference, v_user_id, p_amount, 'KES', 'COMPLETED', 'Loan Repayment', 'REPAYMENT',
    jsonb_build_array(jsonb_build_object('source', 'MPESA', 'amount', p_amount)),
    jsonb_build_array(jsonb_build_object(
      'id', 'split-1', 'createdAt', now(), 'paymentSplitAmount', p_amount,
      'wallet', jsonb_build_object('type', 'MPESA'), 'loan', null
    )),
    jsonb_build_array(jsonb_build_object('source', 'Loan repayment reward', 'amount', v_cashback)),
    v_cashback,
    v_user_info,
    'Loan repayment of ' || p_amount || ' KES',
    now());

  return jsonb_build_object(
    'isChargeTransaction', true,
    'authorizationUrl', '',
    'reference', v_reference,
    'success', true,
    'newOutstanding', v_new_outstanding
  );
end;
$$ language plpgsql security definer;
```

### `rpc_initiate_multi_payment`

**Return shape:** Must include `message`, `paymentId`, `totalBillAmount`, `status`, `paymentSplitResults` — the component reads `response.paymentSplitResults.find(...)`.

**Cashback calculation:** 5% on MPESA portion only, not total amount.

**LOAN splits:** Creates a loan record for each LOAN-type funding source and embeds the loan reference in payment splits.

**Payment detail columns:** Populates `payment_splits`, `cashback_details`, `user_info` on insert.

**Stale credit limit fix:** When multiple LOAN sources appear in `p_funding_sources`, the loop must track a running `v_remaining` total rather than re-reading `v_details` (which doesn't reflect in-loop updates). Each LOAN deduction updates the running total.

**`totalBillAmount` type:** Returned as string (`p_amount::text`) — the `PaymentResponse` TypeScript type expects `string`, matching MSW behavior.

**Care Fund ledger:** Inserts an EARNED row into `care_fund_transactions` for cashback, and SPENT rows for CASHBACK wallet deductions — keeping the Care Fund transaction history in sync.

```sql
create or replace function rpc_initiate_multi_payment(
  p_amount numeric,
  p_facility_name text,
  p_facility_type text,
  p_funding_sources jsonb,
  p_line_items jsonb default '[]',
  p_currency text default 'KES'
) returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
  v_payment_id text;
  v_cashback numeric;
  v_source jsonb;
  v_wallet_amount numeric := 0;
  v_mpesa_amount numeric := 0;
  v_cashback_spent numeric := 0;
  v_loan_id text;
  v_splits jsonb := '[]'::jsonb;
  v_split_idx integer := 1;
  v_details jsonb;
  v_user_info jsonb;
  v_remaining numeric;
begin
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;

  v_payment_id := gen_random_uuid()::text;

  -- Lock patient_details row + read user details for user_info and credit limit
  select data into v_details from patient_details where user_id = v_user_id for update;
  v_user_info := jsonb_build_object(
    'firstName', coalesce(v_details->>'firstName', 'Demo'),
    'lastName', coalesce(v_details->>'lastName', 'User')
  );
  -- Initialize running credit limit from patient_details (used across loop iterations)
  v_remaining := coalesce((v_details->'creditLimit'->>'remainingAmount')::numeric, 0);

  for v_source in select * from jsonb_array_elements(p_funding_sources)
  loop
    if v_source->>'source' in ('WALLET', 'CARE_SAVER') then
      v_wallet_amount := v_wallet_amount + (v_source->>'amount')::numeric;
      v_splits := v_splits || jsonb_build_array(jsonb_build_object(
        'id', 'split-' || v_split_idx, 'createdAt', now(),
        'paymentSplitAmount', (v_source->>'amount')::numeric,
        'wallet', jsonb_build_object('type', v_source->>'source'), 'loan', null
      ));
    elsif v_source->>'source' = 'CASHBACK' then
      v_wallet_amount := v_wallet_amount + (v_source->>'amount')::numeric;
      v_cashback_spent := v_cashback_spent + (v_source->>'amount')::numeric;
      v_splits := v_splits || jsonb_build_array(jsonb_build_object(
        'id', 'split-' || v_split_idx, 'createdAt', now(),
        'paymentSplitAmount', (v_source->>'amount')::numeric,
        'wallet', jsonb_build_object('type', 'CASHBACK'), 'loan', null
      ));
    elsif v_source->>'source' = 'MPESA' then
      v_mpesa_amount := v_mpesa_amount + (v_source->>'amount')::numeric;
      v_splits := v_splits || jsonb_build_array(jsonb_build_object(
        'id', 'split-' || v_split_idx, 'createdAt', now(),
        'paymentSplitAmount', (v_source->>'amount')::numeric,
        'wallet', jsonb_build_object('type', 'MPESA'), 'loan', null
      ));
    elsif v_source->>'source' = 'LOAN' then
      -- Credit limit check against running total (not stale v_details)
      if (v_source->>'amount')::numeric > v_remaining then
        raise exception 'Loan amount exceeds credit limit (remaining: %)', v_remaining;
      end if;

      v_loan_id := 'loan-' || gen_random_uuid()::text;
      insert into loans (id, user_id, amount, total_bill_amount, outstanding_amount, currency, status, created_at)
      values (v_loan_id, v_user_id, (v_source->>'amount')::numeric, (v_source->>'amount')::numeric,
        (v_source->>'amount')::numeric, jsonb_build_object('code', p_currency), 'DISBURSED', now());

      -- Deduct from running credit limit total
      v_remaining := v_remaining - (v_source->>'amount')::numeric;

      v_splits := v_splits || jsonb_build_array(jsonb_build_object(
        'id', 'split-' || v_split_idx, 'createdAt', now(),
        'paymentSplitAmount', (v_source->>'amount')::numeric,
        'wallet', jsonb_build_object('type', 'LOAN'),
        'loan', jsonb_build_object('id', v_loan_id)
      ));
    end if;
    v_split_idx := v_split_idx + 1;
  end loop;

  -- Persist final credit limit after all LOAN deductions (stored as string to match TS types)
  update patient_details set data = jsonb_set(
    data, '{creditLimit,remainingAmount}', to_jsonb(v_remaining::text)
  ) where user_id = v_user_id;

  -- Cashback on MPESA portion only
  v_cashback := round(v_mpesa_amount * 0.05, 2);

  if v_wallet_amount > 0 then
    update wallets set cashback_balance = cashback_balance - v_wallet_amount
    where user_id = v_user_id and cashback_balance >= v_wallet_amount;
    if not found then raise exception 'Insufficient wallet balance'; end if;
  end if;

  insert into payments (id, user_id, amount, currency, status, facility_name, facility_type,
    funding_sources, line_items, cashback_amount, payment_splits, cashback_details, user_info, created_at)
  values (v_payment_id, v_user_id, p_amount, p_currency, 'COMPLETED', p_facility_name, p_facility_type,
    p_funding_sources, p_line_items, v_cashback, v_splits,
    case when v_cashback > 0 then jsonb_build_array(jsonb_build_object('source', 'Jireh cashback', 'amount', v_cashback))
    else '[]'::jsonb end,
    v_user_info,
    now());

  -- Earn cashback + record in care fund ledger
  if v_cashback > 0 then
    update wallets set cashback_balance = cashback_balance + v_cashback where user_id = v_user_id;
    insert into care_fund_transactions (id, user_id, transaction_amount, currency, type, status, description, created_at)
    values ('cft-' || gen_random_uuid()::text, v_user_id, v_cashback,
      '{"code": "KES", "symbol": "KES", "name": "Kenyan Shilling"}'::jsonb,
      'EARNED', 'COMPLETED', 'Cashback from payment at ' || p_facility_name, now());
  end if;

  -- Record cashback spent in care fund ledger
  if v_cashback_spent > 0 then
    insert into care_fund_transactions (id, user_id, transaction_amount, currency, type, status, description, created_at)
    values ('cft-' || gen_random_uuid()::text, v_user_id, v_cashback_spent,
      '{"code": "KES", "symbol": "KES", "name": "Kenyan Shilling"}'::jsonb,
      'SPENT', 'COMPLETED', 'Cashback used for payment at ' || p_facility_name, now());
  end if;

  return jsonb_build_object(
    'message', 'Payment successful',
    'paymentId', v_payment_id,
    'totalBillAmount', p_amount::text,
    'status', 'COMPLETED',
    'paymentSplitResults', v_splits,
    'cashback', v_cashback
  );
end;
$$ language plpgsql security definer;
```

**Prototype-acceptable deviations:**
- `wallets.cashback_balance` serves as a single pool for WALLET/CARE_SAVER/CASHBACK. The distinct balances shown in the UI come from `patient_details.data.wallets` array which is composed at read time (see Section 3.2). A production system would have separate balance columns.
- Cashback "network status" (whether the cashback network is active/paused) is not modeled — the prototype always treats the network as active. The UI reads `careFundAccount.status` from the composed `usePatientLoginDetails` response; hardcode as `'ACTIVE'` in the composition.
- The single `cashback_balance` column means that when a WALLET-type or CARE_SAVER-type source is used for payment, it deducts from the same balance as CASHBACK. This is a simplification — acceptable for prototype demonstrations.

### `rpc_care_fund_transfer`
```sql
create or replace function rpc_care_fund_transfer(
  p_amount numeric,
  p_receiver_phone text,
  p_description text default null
) returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
  v_txn_id text;
begin
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;

  v_txn_id := 'cft-' || gen_random_uuid()::text;

  update wallets set cashback_balance = cashback_balance - p_amount
  where user_id = v_user_id and cashback_balance >= p_amount;
  if not found then raise exception 'Insufficient balance'; end if;

  insert into care_fund_transactions (id, user_id, transaction_amount, currency, type, status, receiver_phone_number, description, created_at)
  values (v_txn_id, v_user_id, p_amount, '{"code": "KES", "symbol": "KES", "name": "Kenyan Shilling"}'::jsonb,
    'TRANSFER', 'COMPLETED', p_receiver_phone, p_description, now());

  return jsonb_build_object('transactionId', v_txn_id, 'success', true);
end;
$$ language plpgsql security definer;
```

### `rpc_fast_track_initiate`

**Payment splits:** Must be built in the loop from `p_funding_sources`, not left as an empty array.

**LOAN amount:** Uses the LOAN source's amount (not `p_amount` which is the total) — a multi-source payment might split between MPESA and LOAN.

**Credit limit check:** LOAN sources must check `remainingAmount` before disbursing, same as `rpc_initiate_multi_payment`.

**Cashback:** Earns 5% on MPESA portion, records in `care_fund_transactions`.

**Wallet/cashback deduction:** CASHBACK, WALLET, and CARE_SAVER sources must deduct from `wallets.cashback_balance` and record SPENT rows in `care_fund_transactions` — matching `rpc_initiate_multi_payment` behavior.

**Input validation:** Rejects non-positive amounts.

**Row locking:** Uses `SELECT ... FOR UPDATE` on `patient_details`.

```sql
create or replace function rpc_fast_track_initiate(
  p_amount numeric,
  p_provider_id integer,
  p_funding_sources jsonb
) returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
  v_payment_id text;
  v_loan_id text;
  v_provider fast_track_providers%rowtype;
  v_source jsonb;
  v_splits jsonb := '[]'::jsonb;
  v_split_idx integer := 1;
  v_details jsonb;
  v_user_info jsonb;
  v_remaining numeric;
  v_loan_amount numeric;
  v_mpesa_amount numeric := 0;
  v_wallet_amount numeric := 0;
  v_cashback_spent numeric := 0;
  v_cashback numeric;
begin
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;

  v_payment_id := gen_random_uuid()::text;

  select * into v_provider from fast_track_providers where id = p_provider_id;
  if not found then raise exception 'Provider not found'; end if;

  -- Lock patient_details row
  select data into v_details from patient_details where user_id = v_user_id for update;
  v_user_info := jsonb_build_object(
    'firstName', coalesce(v_details->>'firstName', 'Demo'),
    'lastName', coalesce(v_details->>'lastName', 'User')
  );
  v_remaining := coalesce((v_details->'creditLimit'->>'remainingAmount')::numeric, 0);

  for v_source in select * from jsonb_array_elements(p_funding_sources)
  loop
    if v_source->>'source' = 'LOAN' then
      v_loan_amount := (v_source->>'amount')::numeric;

      -- Credit limit check
      if v_loan_amount > v_remaining then
        raise exception 'Loan amount exceeds credit limit (remaining: %)', v_remaining;
      end if;

      v_loan_id := 'loan-' || gen_random_uuid()::text;
      insert into loans (id, user_id, amount, total_bill_amount, outstanding_amount, currency, status, created_at)
      values (v_loan_id, v_user_id, v_loan_amount, v_loan_amount,
        v_loan_amount, '{"code": "KES"}'::jsonb, 'DISBURSED', now());

      v_remaining := v_remaining - v_loan_amount;

      v_splits := v_splits || jsonb_build_array(jsonb_build_object(
        'id', 'split-' || v_split_idx, 'createdAt', now(),
        'paymentSplitAmount', v_loan_amount,
        'wallet', jsonb_build_object('type', 'LOAN'),
        'loan', jsonb_build_object('id', v_loan_id)
      ));
    elsif v_source->>'source' = 'MPESA' then
      v_mpesa_amount := v_mpesa_amount + (v_source->>'amount')::numeric;
      v_splits := v_splits || jsonb_build_array(jsonb_build_object(
        'id', 'split-' || v_split_idx, 'createdAt', now(),
        'paymentSplitAmount', (v_source->>'amount')::numeric,
        'wallet', jsonb_build_object('type', 'MPESA'), 'loan', null
      ));
    elsif v_source->>'source' = 'CASHBACK' then
      v_wallet_amount := v_wallet_amount + (v_source->>'amount')::numeric;
      v_cashback_spent := v_cashback_spent + (v_source->>'amount')::numeric;
      v_splits := v_splits || jsonb_build_array(jsonb_build_object(
        'id', 'split-' || v_split_idx, 'createdAt', now(),
        'paymentSplitAmount', (v_source->>'amount')::numeric,
        'wallet', jsonb_build_object('type', 'CASHBACK'), 'loan', null
      ));
    elsif v_source->>'source' in ('WALLET', 'CARE_SAVER') then
      v_wallet_amount := v_wallet_amount + (v_source->>'amount')::numeric;
      v_splits := v_splits || jsonb_build_array(jsonb_build_object(
        'id', 'split-' || v_split_idx, 'createdAt', now(),
        'paymentSplitAmount', (v_source->>'amount')::numeric,
        'wallet', jsonb_build_object('type', v_source->>'source'), 'loan', null
      ));
    end if;
    v_split_idx := v_split_idx + 1;
  end loop;

  -- Persist credit limit (stored as string to match TS types)
  update patient_details set data = jsonb_set(
    data, '{creditLimit,remainingAmount}', to_jsonb(v_remaining::text)
  ) where user_id = v_user_id;

  -- Deduct wallet balance
  if v_wallet_amount > 0 then
    update wallets set cashback_balance = cashback_balance - v_wallet_amount
    where user_id = v_user_id and cashback_balance >= v_wallet_amount;
    if not found then raise exception 'Insufficient wallet balance'; end if;
  end if;

  -- Cashback on MPESA portion
  v_cashback := round(v_mpesa_amount * 0.05, 2);

  insert into payments (id, user_id, amount, currency, status, facility_name, facility_type,
    funding_sources, payment_splits, cashback_details, cashback_amount, user_info, created_at)
  values (v_payment_id, v_user_id, p_amount, 'KES', 'COMPLETED',
    v_provider.name, 'HOSPITAL', p_funding_sources, v_splits,
    case when v_cashback > 0 then jsonb_build_array(jsonb_build_object('source', 'Jireh cashback', 'amount', v_cashback))
    else '[]'::jsonb end,
    v_cashback, v_user_info, now());

  -- Earn cashback + record in care fund ledger
  if v_cashback > 0 then
    update wallets set cashback_balance = cashback_balance + v_cashback where user_id = v_user_id;
    insert into care_fund_transactions (id, user_id, transaction_amount, currency, type, status, description, created_at)
    values ('cft-' || gen_random_uuid()::text, v_user_id, v_cashback,
      '{"code": "KES", "symbol": "KES", "name": "Kenyan Shilling"}'::jsonb,
      'EARNED', 'COMPLETED', 'Cashback from Fast Track payment', now());
  end if;

  -- Record cashback spent in care fund ledger
  if v_cashback_spent > 0 then
    insert into care_fund_transactions (id, user_id, transaction_amount, currency, type, status, description, created_at)
    values ('cft-' || gen_random_uuid()::text, v_user_id, v_cashback_spent,
      '{"code": "KES", "symbol": "KES", "name": "Kenyan Shilling"}'::jsonb,
      'SPENT', 'COMPLETED', 'Cashback used for Fast Track payment', now());
  end if;

  return jsonb_build_object('paymentId', v_payment_id, 'loanId', coalesce(v_loan_id, ''), 'reference', v_payment_id);
end;
$$ language plpgsql security definer;
```

### `rpc_seed_demo_account` (FacilitatorPanel)

Deletes all user-scoped rows for the demo user and re-inserts full seed data. Called by FacilitatorPanel's "Reset Demo" button.

**Must reset ALL user-scoped tables** — including `wallets`, `notifications`, `events`, `profiles`, and `patient_details`. Missing any of these leaves stale state that leaks into the next demo scenario.

```sql
create or replace function rpc_seed_demo_account() returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
begin
  -- Delete all user-scoped data (every user-scoped table)
  delete from network_members where user_id = v_user_id;
  delete from network_invites where user_id = v_user_id;
  delete from circle_activity where user_id = v_user_id;
  delete from care_fund_transactions where user_id = v_user_id;
  delete from loans where user_id = v_user_id;
  delete from manual_requests where user_id = v_user_id;
  delete from payments where user_id = v_user_id;
  delete from guarantor_invites where user_id = v_user_id;
  delete from notifications where user_id = v_user_id;
  delete from events where user_id = v_user_id;
  delete from recent_searches where user_id = v_user_id;
  delete from preferred_providers where user_id = v_user_id;
  delete from chat_messages where user_id = v_user_id;
  delete from education_progress where user_id = v_user_id;
  delete from refill_schedules where user_id = v_user_id;
  delete from test_schedules where user_id = v_user_id;
  delete from medication_cards where user_id = v_user_id;
  delete from facility_reviews where user_id = v_user_id;

  -- Reset wallets to seed state
  update wallets set cashback_balance = 500 where user_id = v_user_id;

  -- Reset profiles to seed state
  update profiles set data = '{}' where user_id = v_user_id;

  -- Reset patient_details to full demo state (delete + re-insert avoids duplicate key)
  delete from patient_details where user_id = v_user_id;

  -- Re-insert full seed patient_details and all other user-scoped tables
  -- Implementation: the seed INSERT statements from 014_full_migration_seed.sql MUST be
  -- inlined here verbatim. This is the only way to make the RPC self-contained.
  -- Required tables: patient_details, network_members, network_invites, circle_activity,
  -- care_fund_transactions, loans, manual_requests, payments, guarantor_invites.
  -- The patient_details.data JSONB must include the full wallets[] array, creditLimit,
  -- patientCircle, hasActiveMembership, and all fields consumed by components.

  return jsonb_build_object('success', true, 'message', 'Demo account reset');
end;
$$ language plpgsql security definer;
```

### `rpc_reset_to_onboarding` (FacilitatorPanel)

Same reset scope as `rpc_seed_demo_account` but inserts minimal data (onboarding-only state).

```sql
create or replace function rpc_reset_to_onboarding() returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
begin
  -- Delete all user-scoped data (every user-scoped table)
  delete from network_members where user_id = v_user_id;
  delete from network_invites where user_id = v_user_id;
  delete from circle_activity where user_id = v_user_id;
  delete from care_fund_transactions where user_id = v_user_id;
  delete from loans where user_id = v_user_id;
  delete from manual_requests where user_id = v_user_id;
  delete from payments where user_id = v_user_id;
  delete from guarantor_invites where user_id = v_user_id;
  delete from notifications where user_id = v_user_id;
  delete from events where user_id = v_user_id;
  delete from recent_searches where user_id = v_user_id;
  delete from preferred_providers where user_id = v_user_id;
  delete from chat_messages where user_id = v_user_id;
  delete from education_progress where user_id = v_user_id;
  delete from refill_schedules where user_id = v_user_id;
  delete from test_schedules where user_id = v_user_id;
  delete from medication_cards where user_id = v_user_id;
  delete from facility_reviews where user_id = v_user_id;

  -- Reset wallets to zero
  update wallets set cashback_balance = 0 where user_id = v_user_id;

  -- Reset profiles to empty
  update profiles set data = '{}' where user_id = v_user_id;

  -- Reset patient_details to onboarding-only state
  delete from patient_details where user_id = v_user_id;
  insert into patient_details (user_id, data) values (v_user_id, jsonb_build_object(
    'firstName', 'Wanjiru', 'lastName', 'Kamau',
    'hasSetPin', false, 'isVerified', false,
    'membershipStatus', 'NONE', 'type', 'PUBLIC',
    'isBasicMember', true, 'canPayMedicalBill', false
  ));

  return jsonb_build_object('success', true, 'message', 'Reset to onboarding');
end;
$$ language plpgsql security definer;
```

### `rpc_seed_at_stage` (FacilitatorPanel)

Sets a specific onboarding stage for testing. First calls `rpc_reset_to_onboarding()` to get a clean slate, then layers on stage-specific data.

**Defined stages:**

| Stage | `patient_details.data` fields set | Supporting tables |
|-------|----------------------------------|-------------------|
| `id_verified` | `hasSetPin: true, isVerified: true, documentVerificationStatus: 'VERIFIED'` | — |
| `circle_built` | Above + `patientCircle: { members: [...] }` | `network_members` (3 rows), `network_invites` (1 row) |
| `membership_active` | Above + `hasActiveMembership: true, type: 'PLUS', membershipStatus: 'ACTIVE', isBasicMember: false, canPayMedicalBill: true, creditLimit: { totalCreditLimitAmount: '50000', remainingAmount: '50000' }, wallets: [...]` | — |
| `post_first_payment` | Above (full demo state minus older history) | `payments` (1 row), `loans` (1 row) |

```sql
create or replace function rpc_seed_at_stage(p_stage text) returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
begin
  -- Start from clean onboarding state
  perform rpc_reset_to_onboarding();

  if p_stage = 'id_verified' then
    update patient_details set data = data || jsonb_build_object(
      'hasSetPin', true, 'isVerified', true,
      'documentVerificationStatus', 'VERIFIED'
    ) where user_id = v_user_id;

  elsif p_stage = 'circle_built' then
    update patient_details set data = data || jsonb_build_object(
      'hasSetPin', true, 'isVerified', true,
      'documentVerificationStatus', 'VERIFIED'
    ) where user_id = v_user_id;
    -- Insert circle members from seed data
    -- Implementation: inline network_members + network_invites INSERT statements

  elsif p_stage = 'membership_active' then
    update patient_details set data = data || jsonb_build_object(
      'hasSetPin', true, 'isVerified', true,
      'documentVerificationStatus', 'VERIFIED',
      'hasActiveMembership', true, 'type', 'PLUS',
      'membershipStatus', 'ACTIVE', 'isBasicMember', false,
      'canPayMedicalBill', true,
      'creditLimit', jsonb_build_object(
        'totalCreditLimitAmount', '50000', 'remainingAmount', '50000'
      )
    ) where user_id = v_user_id;
    -- Insert circle members + seed wallets
    -- Implementation: inline network + wallet seed statements
    update wallets set cashback_balance = 500 where user_id = v_user_id;

  elsif p_stage = 'post_first_payment' then
    -- Full membership_active state + one payment + one loan
    -- Implementation: inline all membership_active statements + payment/loan INSERTs

  else
    raise exception 'Unknown stage: %. Valid stages: id_verified, circle_built, membership_active, post_first_payment', p_stage;
  end if;

  return jsonb_build_object('success', true, 'stage', p_stage);
end;
$$ language plpgsql security definer;
```

### `rpc_activate_membership` (Onboarding)

Called by `POST /patients/submit-plan-details`. Sets membership fields, funds credit limit, and unlocks payment capability.

**Must set:** `hasActiveMembership`, `type: 'PLUS'`, `membershipStatus: 'ACTIVE'`, `isBasicMember: false`, `canPayMedicalBill: true`, and seed `creditLimit` with initial `totalCreditLimitAmount` and `remainingAmount`. Without funding the credit limit, `remainingAmount` stays 0 and the user can never borrow.

**Note on initial credit limit:** The 50,000 KES initial credit limit is a demo/prototype value. The production spec defines dynamic credit limit calculation based on underwriting criteria. 50K is used here to demonstrate the full credit lifecycle (borrow → repay → grow) with meaningful numbers.

```sql
create or replace function rpc_activate_membership() returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
  v_initial_credit_limit numeric := 50000;
begin
  update patient_details set data = data
    || jsonb_build_object(
      'hasActiveMembership', true,
      'type', 'PLUS',
      'membershipStatus', 'ACTIVE',
      'isBasicMember', false,
      'canPayMedicalBill', true,
      'creditLimit', jsonb_build_object(
        'totalCreditLimitAmount', v_initial_credit_limit::text,
        'remainingAmount', v_initial_credit_limit::text
      )
    )
  where user_id = v_user_id;

  return jsonb_build_object('success', true, 'membershipStatus', 'ACTIVE');
end;
$$ language plpgsql security definer;
```

---

## Phase 3: Hook & Component Migration

### Pre-migration: Relocate Production Imports from `src/mocks/`

Before deleting mocks, relocate these to prevent build breakage:

| Import | Current location | New location |
|--------|-----------------|-------------|
| `clearAllParticipantState` | `src/mocks/domain/reset.ts` → `patientAuthStore.tsx` | `src/lib/auth-utils.ts` — Supabase version: no-op |
| `LessonProgress` type | `src/mocks/domain/careCompanion.ts` → `EducationFeedPage.tsx`, `useLessonProgress.ts` | `src/types/education.ts` |
| `getProfileAwarePharmacyStock` etc. | `src/mocks/domain/careCompanion.ts` → 3 pharmacy stock hooks | Replaced by Supabase queries on `pharmacy_stock` table |
| FacilitatorPanel's 12 mock imports | 8 mock modules | Full data-layer rewrite — all mock domain calls → Supabase queries + seed/reset RPCs |

### 3.1 Care Companion Hooks (20 files) — strip `useSupabase` flag

Remove `if (useSupabase)` branching, keep Supabase path, remove `axios` and `useSupabase` imports.

| Hook | Change needed |
|------|---------------|
| `useIntakeProfile` | Strip flag only |
| `useCareCompanionHome` | Strip flag only |
| `useCareHistory` | Strip flag only |
| `useClinicalVisits` | Strip flag only |
| `useCostBreakdown` | Strip flag only |
| `useCostSummary` | Strip flag only |
| `useEducationFeed` | Strip flag only |
| `useEmergencyCard` | Strip flag only |
| `useEmergencyTransportCredit` | Strip flag only |
| `useInteractionCheck` | Strip flag only |
| `useLessonProgress` | Strip flag, update `LessonProgress` import to `src/types/education.ts` |
| `useMedicationCards` | Strip flag only |
| `useMedicationList` | Strip flag only |
| `useMedicationLoanPreApproval` | Strip flag only |
| `useNotifications` | Strip flag only |
| `useRecentPayments` | Strip flag only |
| `useRefillSchedule` | Strip flag only |
| `useSuggestedPrompts` | Strip flag only |
| `useAiPipeline` | Strip flag only |
| `useAssistantChat` | Strip flag only |

### 3.1b Care Companion — axios-only hooks (2 files, full rewrite)

These hooks do NOT have `useSupabase` branching — they are pure axios and need full rewrites:

| Hook | Migration |
|------|-----------|
| `useMedicationTimeline` | Replace `axios.get("/companion/medication-timeline")` with Supabase query on `events` table filtered by medication-related event types |
| `useCareCompanionProfile` | Replace 3 axios calls (`GET/POST/PATCH /companion/profile`) with `supabase.from("profiles")` queries — select, upsert, update |

### 3.1c Care Companion — axios-only hook (1 file)

| Hook | Migration |
|------|-----------|
| `useIntakeForm` | Replace `PATCH /companion/profile` (skip) and `POST /companion/intake` (submit) with `supabase.from("profiles").update(...)` and `supabase.from("profiles").upsert(...)` |

### 3.1d Onboarding/Profile — axios-only hook (1 file)

| Hook | Migration |
|------|-----------|
| `useNextCareProfileStep` | Replace dynamic `axios.post` with logic that reads step state from `patient_details.data` and determines next step client-side. **Note:** This hook is used by onboarding/profile flows, not Care Companion — it was previously misclassified under the Care Companion section title. |

### 3.2 Auth/Routing (8 files) — strip `useSupabase` flag

| File | Migration |
|------|-----------|
| `patientAuthStore.tsx` | Strip flag, Supabase auth only, move `clearAllParticipantState` import |
| `usePatientLoginDetails.ts` | **Full rewrite** (not just flag strip) — see below |
| `PatientWrapper.tsx` | Remove MSW init |
| `PatientsHome.tsx` | Strip flag |
| `PatientDashboard.tsx` | Strip flag, query new tables |
| `PatientProfile.tsx` | Strip flag |
| `useOnboardingChecklist.tsx` | Strip flag + **must use same composition strategy as `usePatientLoginDetails`** — its Supabase branch reads `patient_details.data` for onboarding state fields (`hasSetPin`, `isVerified`, `documentVerificationStatus`, `hasActiveMembership`, `hasAcceptedLatestTermsAndConditions`, `hasBeenReferred`, `hasVerifiedCrbScore`). If it reads these from the JSONB blob directly, values set by RPCs on normalized tables will be stale. Either consolidate by having it call `usePatientLoginDetails()` (which already composes live data), or ensure its Supabase branch reads the same composed data source. |
| `CareCompanionIntake.tsx` | Strip flag |

**`usePatientLoginDetails` rewrite strategy:**

The current Supabase branch queries `profiles` + `wallets` and returns hardcoded values. The new implementation must compose live data from multiple sources to prevent stale balances:

```
1. Read patient_details.data as the base (static profile fields: name, phone, membershipStatus, etc.)
2. Overlay live wallet balance from wallets table (cashback_balance)
3. Overlay live loan stats from loans table (outstanding amounts, active loan count)
4. Overlay live care fund balance from wallets.cashback_balance
5. Overlay live credit limit from patient_details.data.creditLimit (updated by RPCs)
6. Reconstruct the wallets[] array with live remainingBalance values:
   - CASHBACK wallet: remainingBalance = wallets.cashback_balance
   - WALLET wallet: remainingBalance = wallets.cashback_balance (shares same pool in prototype)
   - CARE_SAVER wallet: remainingBalance = wallets.cashback_balance (shares same pool in prototype)
   - LOAN wallet: remainingBalance = patient_details.data.creditLimit.remainingAmount
   - Other wallets: use values from patient_details.data.wallets as-is
   
   **Prototype note:** CASHBACK, WALLET, and CARE_SAVER all map to `wallets.cashback_balance` as a single pool. The distinct wallet types exist in the UI for demonstration — a production implementation would have separate balance columns.
7. Return the composed object matching the existing LoginDetails shape
```

**Wallet array reconstruction is critical:** The dashboard and payment flows read `loginDetails.wallets[].remainingBalance` to show available balances. Without overlaying live values from `wallets` and `patient_details.data.creditLimit`, these balances stay stale after mutations (payments, repayments, transfers).

**TypeScript fields note:** The `PatientLoginDetails` interface must include all fields that components across the app consume. Beyond the obvious profile fields, the following are required:

| Field | Type | Set by | Read by |
|-------|------|--------|---------|
| `isBasicMember` | `boolean` | `rpc_activate_membership` | Payment/loan eligibility checks |
| `canPayMedicalBill` | `boolean` | `rpc_activate_membership` | Payment flow guards |
| `creditLimit` | `{ totalCreditLimitAmount: string, remainingAmount: string }` | `rpc_activate_membership`, `rpc_initiate_repayment` | Loan application, wallet selection |
| `wallets` | `Wallet[]` | Seed data / composed at read time | Dashboard balances, wallet selection |
| `patientCircle` | `{ members: [...] }` | Network RPCs / seed data | Circle display, membership checks |
| `hasActiveMembership` | `boolean` | `rpc_activate_membership` | Routing guards, feature gates |
| `hasAcceptedLatestTermsAndConditions` | `boolean` | Onboarding POST | Onboarding checklist |
| `documentVerificationStatus` | `string` | Onboarding POST | Onboarding checklist, KYC flow |
| `hasBeenReferred` | `boolean` | Referral POST | Onboarding checklist |
| `hasVerifiedCrbScore` | `boolean` | Underwriting POST | Onboarding checklist |

This ensures that after any RPC mutation (payment, repayment, transfer), the dashboard immediately reflects updated balances on the next query refetch.

### 3.3 `data-service.ts` — strip `useSupabase` flag

4 `useSupabase` occurrences. Remove branching, Supabase path only:

| Function | New behavior |
|----------|-------------|
| `dataService.query(table, filters)` | Supabase only |
| `dataService.get(table, id)` | Supabase only |
| `dataService.update(table, id, data)` | Supabase only — add snake_case transform |
| `dataService.insert(table, data)` | Supabase only — add snake_case transform |

### 3.4 Direct Fixture Imports (8 component files)

| Component | Replace with |
|-----------|-------------|
| `CareCompanionHome.tsx` | Supabase query on `medication_taxonomy.price_kes` |
| `AddMedicationDrawer.tsx` | Supabase query on `medication_taxonomy` |
| `ConditionTypeahead.tsx` | Supabase query with `ilike` search |
| `CostEstimationStep.tsx` | Supabase queries on `medication_taxonomy` + `recurring_tests` |
| `RecurringTestsStep.tsx` | Supabase query on `recurring_tests` |
| `TreatmentStep.tsx` | Supabase query on `medication_taxonomy` |
| `RefillSchedulePage.tsx` | Supabase query on `medication_taxonomy.price_kes` |
| `FacilitatorPanel.tsx` | Supabase queries on `loans`, `manual_requests`, `network_members`, `wallets`, `patient_details`, `care_fund_transactions` + seed/reset RPCs (`rpc_seed_demo_account`, `rpc_reset_to_onboarding`, `rpc_seed_at_stage`) |

### 3.5 Network/Circle Components (~10 files)

Replace `axios` calls with Supabase queries. **All endpoints enumerated:**

| Endpoint | Supabase replacement | Used by |
|----------|---------------------|---------|
| `GET /patient-network/network` | `supabase.from("network_members").select("*")` + `supabase.from("network_invites").select("*")` — compose response with `receivedInvites: []` and compute `slots` from member/invite counts | PatientAddConnection, PatientDashboard |
| `POST /patient-network/auto-accept-invites` | `supabase.from("network_invites").update({ status: 'ACCEPTED' })` | PatientAcceptInvite |
| `GET /patient-network/circle-activity` | `supabase.from("circle_activity").select("*")` | useMemberActivity |
| `POST /patient-network/circle-activity/:eventId/acknowledge` | `supabase.from("circle_activity").update({ acknowledged_at: new Date().toISOString() }).eq("id", eventId)` | useAcknowledgeActivity |
| `POST /patient-network/invite/:inviteId/acknowledge-rejection` | `supabase.from("circle_activity").update({ acknowledged_at: new Date().toISOString() }).eq("invite_id", inviteId).eq("event_type", "INVITE_REJECTED")` | useAcknowledgeRejection |
| `POST /patient-network/send-invite` | `supabase.from("network_invites").insert(...)` | AddCircleMemberPage |
| `POST /patient-network/remove-invite` | `supabase.from("network_invites").delete(...)` | useCancelInvite |
| `POST /patient-network/remove-connection` | `supabase.from("network_members").delete(...)` | useRemoveConnection |
| `POST /patient-network/invites/send-reminder` | Return success (prototype) | InviteRequestCard |
| `POST /patient-network/invites/send-reminders` | Return success (prototype) | |
| `GET /patient-network/connections` | `supabase.from("network_members").select("*")` | |
| `GET /patient-network/invite/:inviteId` | `supabase.from("network_invites").select("*").eq("id", inviteId)` | PreviewInvitePage |
| `POST /patient-network/accept-invite` | `supabase.from("network_invites").update({ status: 'ACCEPTED' })` + `supabase.from("network_members").insert(...)` | PatientAcceptInvite |
| `POST /circles/invites/voice` | Return invite object (prototype) | AddCircleMemberPage |
| `POST /circles/invites/validate` | Return success (prototype) | |
| `POST /circles/invites/qr/generate` | Return QR code URL (prototype) | PatientScanQRIntro |
| `POST /circles/invites/qr/accept` | Return success (prototype) | |
| `POST /circles/invites/:id/reject` | Return success (prototype) | |

**Network response shape:** The `GET /patient-network/network` response must include `receivedInvites` (empty array for prototype) and `slots` (computed from member/invite counts: `{ total: 5, filled: members.length, pending: invites.length, available: 5 - members.length - invites.length }`). Components like `PatientKYCAddCircleMembers` and `PatientPayMembership` use `slots` to determine if more members can be added.

### 3.6 Loan Components (~14 files)

Replace `axios` calls with Supabase queries/RPCs. **All endpoints enumerated:**

| Endpoint | Supabase replacement |
|----------|---------------------|
| `GET /loans/patient/me/stats` | Aggregate from `loans` table |
| `GET /loans/patient/me/:id` | `supabase.from("loans").select("*").eq("id", id).single()` |
| `POST /loans/patient/apply-for-loan` | `supabase.rpc("rpc_apply_for_loan", ...)` |
| `POST /loans/patient/me/initiate-repayment` | `supabase.rpc("rpc_initiate_repayment", ...)` |
| `POST /payments/user/initiate-multi-payment` | `supabase.rpc("rpc_initiate_multi_payment", ...)` — **Note:** The RPC returns `paymentSplitResults` as a JSONB array of `{ id, createdAt, paymentSplitAmount, wallet: { type }, loan: { id } | null }`. The `PaymentSplitResult` type in `PatientPaymentConfirmation.tsx` may need updating to match this shape (specifically the `wallet` and `loan` nested objects). Verify and update the TypeScript type if needed during implementation. |
| `GET /patients/payment-history` | Query `payments` + `loans` tables |
| `GET /payments/user/payment-details` | `supabase.from("payments").select("*").eq("id", paymentId).single()` (already migrated in `PatientViewPaymentDetails.tsx`) |
| `GET /patients/payments/manual-requests` | `supabase.from("manual_requests").select("*")` |
| `DELETE /patients/payments/manual-requests/:id` | `supabase.from("manual_requests").delete().eq("id", id)` |
| `POST /payments/manual-review-request` | `supabase.from("manual_requests").insert(...)` |
| `GET /payments/manual-review-request/:id` | `supabase.from("manual_requests").select("*").eq("id", id).single()` |
| `POST /patients/upload-medical-invoice` | Return success + mock URL (prototype) |
| `GET /patients/request-medical-info-form-data` | Read from `patient_details.data` |
| `POST /patients/payments/initiate-payment` | `supabase.rpc("rpc_initiate_multi_payment", ...)` |
| `GET /patients/payments/payment-methods` | Return static list (prototype) |
| `GET /transactions/:transactionId/receipt` | Return success (prototype) |
| `GET /patients/payments/transaction-result/:reference` | `supabase.from("payments").select("*").eq("id", reference).single()` |
| `POST /patients/payments/manual-requests/:id/cancel` | `supabase.from("manual_requests").update({ status: 'CANCELLED' }).eq("id", id)` |

### 3.7 Onboarding Components (~17 files)

| Endpoint | Supabase replacement |
|----------|---------------------|
| `GET /patients/login-details` | `supabase.from("patient_details").select("data").single()` |
| `GET /country-codes` | `supabase.from("country_codes").select("*")` |
| `GET /patients/guarantor-invites` | `supabase.from("guarantor_invites").select("data").single()` |
| `POST /patients/verify-phone-name-match` | Return success (prototype) |
| `POST /patients/set-pin` | Use `jsonb_set` on single path (`data, '{pin}', ...`) — no optimistic lock needed since `jsonb_set` on a single key is atomic and does not risk lost updates. Same applies to `change-pin`. |
| `GET /patients/id-verification-details` | Return from `patient_details.data` (merged during seed) |
| `POST /patients/employment-details` | Return success (prototype) |
| `POST /underwriting/validate-crb-score` | Return success (prototype) |
| `POST /patients/accept-terms-and-conditions` | Return success (prototype) |
| `POST /patients/accept-medical-consent-form` | Return success (prototype) |
| `POST /patients/` (create patient) | Return success (prototype) |
| `POST /patients/update-whatsapp-number` | Return success (prototype) |
| `POST /patients/guarantor-invite` | `supabase.from("guarantor_invites").update(...)` |
| `POST /patients/rescind-guarantor-invitation` | `supabase.from("guarantor_invites").update(...)` |
| `GET /patients/link-social-options` | `supabase.from("link_social_options").select("*")` |
| `GET /patients/social-linking-details` | Return from `patient_details.data` |
| `POST /patients/link-social`, `/link-social-account` | Return success (prototype) |
| `POST /patients/submit-insurance-providers` | Return success (prototype) |
| `POST /patients/submit-favorite-care-providers` | Return success (prototype) |
| `POST /patients/submit-focus-areas` | Return success (prototype) |
| `POST /patients/ncd-status` | Return success (prototype) |
| `POST /patients/submit-plan-details` | `supabase.rpc("rpc_activate_membership")` — activates PLUS membership, sets `hasActiveMembership`, funds credit limit |

### 3.8 Care Fund Components (2 files)

| Endpoint | Supabase replacement |
|----------|---------------------|
| `GET /care-fund/transactions` | `supabase.from("care_fund_transactions").select("*")` |
| `POST /care-fund/transfer` | `supabase.rpc("rpc_care_fund_transfer", ...)` |
| `POST /patient-network/transfer-care-funds` | Same RPC |

### 3.9 Fast Track Components (3 files)

| Endpoint | Supabase replacement |
|----------|---------------------|
| `GET /fast-track/resolve-provider/:paymentNumber` | `supabase.from("fast_track_providers").select("*").eq("payment_number", num).single()` |
| `GET /fast-track/verify-invoice` | Return success (prototype) |
| `POST /fast-track/initiate` | `supabase.rpc("rpc_fast_track_initiate", ...)` |

### 3.10 Notification Endpoints (1 component file + hooks)

**Component:** `PatientNotificationsPage.tsx` — has 2 direct axios calls that need replacement.

| Endpoint | Supabase replacement | Used by |
|----------|---------------------|---------|
| `GET /notifications` | `supabase.from("notifications").select("*")` | PatientNotificationsPage, useNotifications |
| `PUT /notifications/read-all` | `supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null)` | PatientNotificationsPage |
| `POST /notifications/push/send` | Return success (prototype) | |
| `GET /facilities/:facilityId/review-eligibility` | Already migrated — `useReviewEligibility` has Supabase path | |
| `GET /discount-codes/eligible` | `supabase.from("discount_codes").select("*").eq("is_active", true)` | |

### 3.11 Misc/Stub Endpoints

| Endpoint | Approach |
|----------|----------|
| `GET /alerts/dashboard` | Return `null` |
| `POST /alerts/INSTALL_APP/dismiss`, `/resolve` | Return success |
| `POST /patients/verify-id`, `verify-id-number`, `verify-id-photo-selfie-match` | Return success (prototype) |
| `GET /discount-codes/:id` | `supabase.from("discount_codes").select("*").eq("id", id).single()` |
| `POST /discount-codes/validate`, `/apply` | Query + update `discount_codes` |
| `POST /patients/change-pin` | Use `jsonb_set` on single path — atomic, no optimistic lock needed (same as set-pin) |
| `GET /patients/credit-limit` | Read from `patient_details.data` |
| `GET /patients/resolve-type` | Return static (prototype) |
| `POST /patients/join-waitlist` | Return success (prototype) |
| `POST /patients/request-callback` | Return success (prototype) |
| `GET /organizations/patients/get-org-details` | Return static (prototype) |
| `GET /underwriting/financial-statements` | Return static (prototype) |
| `POST /underwriting/upload-mpesa-statement` | Return success (prototype) |
| `POST /patients/link-referral` | Return success (prototype) |
| `POST /patients/skip-referral` | Return success (prototype) |
| `POST /patients/upload-profile-photo` | Return success (prototype) |
| `GET /users/tenant-id` | Return static (prototype) |
| `GET /patient-network/referrer-details/:id` | Return static (prototype) |

### 3.12 Pharmacy Stock (3 hooks)

| Hook | New behavior |
|------|-------------|
| `useMyMedicationStock` | `supabase.from("pharmacy_stock").select("*, facility:facilities(id, name, latitude, longitude, location_name)").in("medication_name", userMedications)` |
| `useStockSearch` | `supabase.from("pharmacy_stock").select("*, facility:facilities(...)").ilike("medication_name", "%search%")` |
| `FacilityMedicationStock` | `supabase.from("pharmacy_stock").select("*").eq("facility_id", facilityId)` |

### 3.13 Derived Fixture Files (no tables needed)

These 11 fixtures are computed from existing tables by hooks at query time. No new tables needed — deleting the fixtures won't break anything as long as hooks' Supabase paths are the only paths.

### 3.14 Per-table snake_case → camelCase mappers

Each table that needs mapping gets an explicit mapper function:

| Table | Key mappings |
|-------|-------------|
| `network_members` | `first_name→firstName, last_name→lastName, phone_number→phoneNumber, profile_photo→profilePhoto, has_defaulted_loan→hasDefaultedLoan, joined_at→joinedAt` |
| `network_invites` | `first_name→firstName, last_name→lastName, phone_number→phoneNumber, profile_photo→profilePhoto, invite_link→inviteLink, created_at→createdAt` |
| `circle_activity` | `event_type→eventType, occurred_at→occurredAt, acknowledged_at→acknowledgedAt, still_qualifies_for_borrowing→stillQualifiesForBorrowing, invite_id→inviteId` |
| `care_fund_transactions` | `transaction_amount→transactionAmount, receiver_phone_number→receiverPhoneNumber, created_at→createdAt, updated_at→updatedAt, expires_at→expiresAt` |
| `loans` | `total_bill_amount→totalBillAmount, outstanding_amount→outstandingAmount, total_paid→totalPaid, care_fund_discount_amount→careFundDiscountAmount, accumulated_interest_amount→accumulatedInterestAmount, late_fees→lateFees, loan_type→loanType, loan_due_date→loanDueDate, first_payment_due→firstPaymentDue, patient_name→patientName, patient_medical_info_request→patientMedicalInfoRequest, created_at→createdAt` |
| `manual_requests` | `care_provider_name→careProviderName, bill_amount→billAmount, payment_info→paymentInfo, invoice_file→invoiceFile, kmpdc_facility→kmpdcFacility, created_at→createdAt, updated_at→updatedAt` |
| `country_codes` | `country_code→countryCode, calling_code→callingCode` |
| `fast_track_providers` | `payment_number→paymentNumber, payment_code→paymentCode, sms_phone_numbers→smsPhoneNumbers, is_active→isActive, created_at→createdAt, updated_at→updatedAt` |
| `medication_taxonomy` | `generic_name→genericName, sub_category→subCategory, dosage_form→dosageForm, condition_tags→conditionTags, common_brands→commonBrands, price_kes→priceKes, requires_prescription→requiresPrescription, is_controlled→isControlled, side_effects→sideEffects` |
| `recurring_tests` | `frequency_months→frequencyMonths, estimated_cost_kes→estimatedCostKes, condition_tags→conditionTags` |
| `pharmacy_stock` | `facility_id→facilityId, medication_name→medicationName, price_kes→priceKes, last_verified_at→lastVerifiedAt` |
| `link_social_options` | No mapping needed — columns are `provider` and `label` (already camelCase-compatible) |

### 3.15 JSONB Type Strategy

JSONB columns (`patient_details.data`, `guarantor_invites.data`, `loans.transactions`, `care_fund_transactions.currency`, `circle_activity.member`) return as `Json` from Supabase generated types. Strategy:

1. Define TypeScript interfaces for each JSONB shape in `src/types/` (e.g., `LoginDetails`, `GuarantorInviteData`, `CircleMember`)
2. Use `as unknown as LoginDetails` casts at the mapper boundary — one cast per table, not scattered through components
3. The mapper functions in Section 3.14 are the single location for these casts

---

## Phase 4: Remove MSW Infrastructure

### Step 1: Verify no production code imports from mocks
```bash
grep -r "from.*['\"]@/mocks" src/ --include="*.ts" --include="*.tsx" | grep -v "\.test\." | grep -v "__tests__"
# Must return zero results before proceeding
```

### Step 2: Delete in order
1. Remove `PatientWrapper.tsx` MSW initialization
2. Remove `src/mocks/handlers/` directory
3. Remove `src/mocks/domain/` directory
4. Remove `src/mocks/fixtures/` directory
5. Remove `src/mocks/db.ts`
6. Remove `useSupabase` export from `src/lib/supabase.ts`
7. Remove `VITE_USE_SUPABASE` from `.env` files
8. Remove MSW packages from `package.json`
9. Clean up `src/mocks/index.ts` and `src/mocks/browser.ts`

### Step 3: Fix test files
Test files importing from `src/mocks/` need mock replacements. Follow-up task.

---

## Implementation Order

1. **Relocate production imports from `src/mocks/`** — types, utilities
2. **Migration SQL** (013 schema + RLS + indexes + triggers) — create 14 new tables
3. **RPC functions** — create 9 Postgres functions (5 payment + 3 FacilitatorPanel + 1 membership)
4. **Seed migration** (014) — small datasets inline + enriched payments
5. **Apply migrations** — `npx supabase db push`
6. **Run large seed scripts** — medication taxonomy + pharmacy stock
7. **Medication taxonomy + pricing** — create `useMedicationTaxonomy` hook, replace 7 fixture imports
8. **Pharmacy stock** — rewrite 3 hooks
9. **Network/Circles** — rewrite ~10 components (including acknowledge endpoints + slots)
10. **Care Fund** — rewrite 2 components
11. **Loans** — rewrite ~14 components
12. **Patient details + profile** — rewrite `usePatientLoginDetails` with composition strategy
13. **Onboarding** — rewrite ~17 components (including membership activation)
14. **Fast Track** — rewrite 3 components
15. **Notifications** — rewrite `PatientNotificationsPage` + add mark-all-read Supabase path
16. **Misc stubs** — add inline returns for ~19 stub endpoints
17. **Payment components** — rewrite ~6 components
18. **Care Companion axios hooks** — rewrite `useMedicationTimeline`, `useCareCompanionProfile`, `useIntakeForm`, `useNextCareProfileStep`
19. **FacilitatorPanel** — full data-layer rewrite (12 mock imports → Supabase queries + seed/reset RPCs)
20. **Strip all `useSupabase` flags** — 20 CC hooks + 8 auth/routing (includes `data-service.ts`, already counted in step 3.3)
21. **Verification gate** — grep for mock imports, type check
22. **Remove MSW infrastructure** — safe deletion order
23. **Type check + build** — `npx tsc --noEmit && npm run build`
24. **Functional testing** — navigate every major flow

---

## Risk Areas

1. **FacilitatorPanel (1169 lines, 12 mock imports + seed/reset)** — largest single-file rewrite. Sync mock calls → async Supabase queries + RPCs. Structural data-layer change required.
2. **Medication taxonomy (~350 records)** — seeded via Node.js script. ✅
3. **Pharmacy stock (~1000 records)** — pre-generated, batch-inserted with `price_kes`. ✅
4. **Payment flow mutations** — all use Postgres RPCs with `auth.uid()`, credit limit checks, correct return shapes, MPESA-only cashback, LOAN split creation. ✅
5. **PatientWrapper MSW init** — all endpoints migrated before removal. ✅
6. **Production imports from mocks** — relocated before deletion. ✅
7. **`patient_details` JSONB concurrency** — mitigated with optimistic locking + trigger. ✅
8. **`patient_details` as stale cache** — JSONB blob contains wallet balances, credit limits, and loan summaries that RPCs update in normalized tables but not in the blob. `usePatientLoginDetails` must compose live values from `wallets`, `loans`, `care_fund_transactions` at read time, and reconstruct the `wallets[]` array with live `remainingBalance` overlays. ✅
9. **Credit limit lifecycle** — Full cycle: `rpc_activate_membership` seeds `totalCreditLimitAmount` = 50000 and `remainingAmount` = 50000 → `rpc_apply_for_loan` / `rpc_initiate_multi_payment` / `rpc_fast_track_initiate` decrease `remainingAmount` by loan amount → `rpc_initiate_repayment` restores `remainingAmount` by repayment amount (capped at total) AND increases `totalCreditLimitAmount` by 25% of its current value. All RPCs use `patient_details.data.creditLimit` JSONB path. ✅
10. **Care Fund ledger completeness** — All cashback-earning RPCs (`rpc_initiate_repayment`, `rpc_initiate_multi_payment`, `rpc_fast_track_initiate`) insert EARNED rows into `care_fund_transactions`. CASHBACK wallet spending in `rpc_initiate_multi_payment` inserts SPENT rows. Without these, the Care Fund transaction history page stays empty. ✅

---

## Verification Checklist

- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] No imports from `src/mocks/` in non-test code (grep returns zero)
- [ ] No imports of `useSupabase` anywhere
- [ ] No `axios` imports in hooks (only in generic utilities if any)
- [ ] All RPC functions created and callable (9 total)
- [ ] All `updated_at` triggers applied
- [ ] All pages load without 404s in browser console
- [ ] **Sign-up flow** completes without errors
- [ ] **Care Companion intake** (medication search, test selection, cost estimation) completes
- [ ] Dashboard payments list → payment details works
- [ ] **Payment creation updates displayed wallet balance** (validates stale-cache fix)
- [ ] Explore tab → facility details → reviews works
- [ ] Circle → add/remove members works
- [ ] Circle → acknowledge activity events works
- [ ] Care Fund → view transactions, transfer works
- [ ] Loans → view loan details, repayment works
- [ ] Loans → repayment earns cashback (5%) AND records EARNED row in care_fund_transactions
- [ ] Loans → repayment restores credit limit remainingAmount AND increases totalCreditLimitAmount by 25%
- [ ] Credit limit lifecycle: activation funds it → borrowing decreases remainingAmount → repayment restores remainingAmount AND grows totalCreditLimitAmount by 25%
- [ ] Care Companion → medications, costs, education, pharmacy stock all load
- [ ] Onboarding → medication search, test selection, facility search all work
- [ ] Onboarding → membership activation sets PLUS tier, funds credit limit (totalCreditLimitAmount = 50000, remainingAmount = 50000), sets isBasicMember=false and canPayMedicalBill=true
- [ ] Fast Track → provider resolution → payment works
- [ ] Profile page loads correctly
- [ ] Mark-all-notifications-read works via Supabase (`PatientNotificationsPage`)
- [ ] FacilitatorPanel loads without errors
- [ ] FacilitatorPanel → Reset Demo reseeds data correctly
- [ ] **Error states:** Loan application with amount exceeding credit limit shows error
- [ ] **Error states:** Payment with insufficient wallet balance shows error
- [ ] **Error states:** Repayment on an already-paid loan shows error (paid-loan guard)
- [ ] **Error states:** RPC failures surface user-friendly error messages (not raw Postgres exceptions)
- [ ] `src/mocks/` directory can be deleted without build errors
