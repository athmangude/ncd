-- 013_full_migration_schema.sql
-- Full Supabase migration: 14 new tables + RLS + indexes + triggers + 9 RPC functions
-- Removes dependency on MSW/fixtures for all remaining data paths

-- ============================================================================
-- 1. NEW TABLES
-- ============================================================================

-- 1.1 network_members — circle members
create table network_members (
  id text primary key,
  user_id uuid not null references auth.users(id),
  first_name text not null,
  last_name text not null,
  phone_number text,
  profile_photo text,
  relationship text not null,
  type text not null,
  status text default 'ACTIVE',
  nickname text,
  joined_at timestamptz,
  has_defaulted_loan boolean default false
);
create index idx_network_members_user on network_members(user_id);

-- 1.2 network_invites — pending circle invites
create table network_invites (
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
);
create index idx_network_invites_user on network_invites(user_id);

-- 1.3 circle_activity — circle events
create table circle_activity (
  id text primary key,
  user_id uuid not null references auth.users(id),
  event_type text not null,
  occurred_at timestamptz not null,
  acknowledged_at timestamptz,
  member jsonb not null,
  still_qualifies_for_borrowing boolean default true,
  invite_id text
);
create index idx_circle_activity_user on circle_activity(user_id, occurred_at desc);

-- 1.4 care_fund_transactions — cashback/transfer history
create table care_fund_transactions (
  id text primary key,
  user_id uuid not null references auth.users(id),
  transaction_amount numeric not null,
  currency jsonb not null,
  type text not null,
  status text default 'COMPLETED',
  sender jsonb,
  receiver jsonb,
  receiver_phone_number text,
  description text,
  loan jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz
);
create index idx_care_fund_transactions_user on care_fund_transactions(user_id, created_at desc);

-- 1.5 loans — loan records
create table loans (
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
);
create index idx_loans_user on loans(user_id, status);

-- 1.6 manual_requests — manual payment review requests
create table manual_requests (
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
);

-- 1.7 patient_details — login details / profile summary (JSONB blob)
create table patient_details (
  user_id uuid primary key references auth.users(id),
  data jsonb not null,
  updated_at timestamptz default now()
);

-- 1.8 country_codes — reference data
create table country_codes (
  country_code text primary key,
  name text not null,
  calling_code text not null
);

-- 1.9 guarantor_invites — onboarding data
create table guarantor_invites (
  user_id uuid primary key references auth.users(id),
  data jsonb not null
);

-- 1.10 medication_taxonomy — medication database (~350 records, seeded via script)
create table medication_taxonomy (
  id text primary key,
  name text not null,
  generic_name text,
  category text not null,
  sub_category text,
  dosage_form text,
  strength text,
  unit text,
  condition_tags text[] default '{}',
  common_brands text[] default '{}',
  price_kes numeric,
  requires_prescription boolean default false,
  is_controlled boolean default false,
  storage text,
  side_effects text[] default '{}',
  interactions text[] default '{}',
  notes text
);
create extension if not exists pg_trgm;
create index idx_medication_taxonomy_name on medication_taxonomy using gin(name gin_trgm_ops);

-- 1.11 recurring_tests — test catalog
create table recurring_tests (
  id text primary key,
  name text not null,
  category text not null,
  description text,
  frequency_months integer,
  estimated_cost_kes numeric,
  condition_tags text[] default '{}'
);

-- 1.12 pharmacy_stock — pre-generated stock data
create table pharmacy_stock (
  id text primary key,
  facility_id integer not null references facilities(id),
  medication_name text not null,
  status text not null,
  price_kes numeric,
  last_verified_at timestamptz default now()
);
create index idx_pharmacy_stock_facility on pharmacy_stock(facility_id);
create index idx_pharmacy_stock_medication on pharmacy_stock using gin(medication_name gin_trgm_ops);

-- 1.13 fast_track_providers — payment point data
create table fast_track_providers (
  id integer primary key,
  name text not null,
  payment_number text not null,
  payment_code text not null,
  sms_phone_numbers text[] default '{}',
  is_active boolean default true,
  facility jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 1.14 link_social_options — social linking options
create table link_social_options (
  provider text primary key,
  label text not null
);

-- Add new columns to existing payments table
alter table payments
  add column if not exists patient_medical_info_request jsonb,
  add column if not exists disbursement_transaction jsonb,
  add column if not exists description text;

-- ============================================================================
-- 2. UPDATED_AT TRIGGERS
-- ============================================================================

create trigger care_fund_transactions_updated_at before update on care_fund_transactions
  for each row execute function update_updated_at();
create trigger manual_requests_updated_at before update on manual_requests
  for each row execute function update_updated_at();
create trigger patient_details_updated_at before update on patient_details
  for each row execute function update_updated_at();
create trigger fast_track_providers_updated_at before update on fast_track_providers
  for each row execute function update_updated_at();

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

-- Reference data: authenticated read
alter table country_codes enable row level security;
create policy "Authenticated read country_codes" on country_codes
  for select using (auth.role() = 'authenticated');

alter table medication_taxonomy enable row level security;
create policy "Authenticated read medication_taxonomy" on medication_taxonomy
  for select using (auth.role() = 'authenticated');

alter table recurring_tests enable row level security;
create policy "Authenticated read recurring_tests" on recurring_tests
  for select using (auth.role() = 'authenticated');

alter table pharmacy_stock enable row level security;
create policy "Authenticated read pharmacy_stock" on pharmacy_stock
  for select using (auth.role() = 'authenticated');

alter table fast_track_providers enable row level security;
create policy "Authenticated read fast_track_providers" on fast_track_providers
  for select using (auth.role() = 'authenticated');

alter table link_social_options enable row level security;
create policy "Authenticated read link_social_options" on link_social_options
  for select using (auth.role() = 'authenticated');

-- User-scoped data: user can read/write own rows
alter table network_members enable row level security;
create policy "Users manage own network_members" on network_members
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table network_invites enable row level security;
create policy "Users manage own network_invites" on network_invites
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table circle_activity enable row level security;
create policy "Users manage own circle_activity" on circle_activity
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table care_fund_transactions enable row level security;
create policy "Users manage own care_fund_transactions" on care_fund_transactions
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table loans enable row level security;
create policy "Users manage own loans" on loans
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table manual_requests enable row level security;
create policy "Users manage own manual_requests" on manual_requests
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table patient_details enable row level security;
create policy "Users manage own patient_details" on patient_details
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table guarantor_invites enable row level security;
create policy "Users manage own guarantor_invites" on guarantor_invites
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- 4. RPC FUNCTIONS (9 total)
-- ============================================================================

-- 4.1 rpc_apply_for_loan
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
    '[]'::jsonb, v_user_info, now());

  update patient_details set data = jsonb_set(
    data, '{creditLimit,remainingAmount}', to_jsonb((v_remaining - p_amount)::text)
  ) where user_id = v_user_id;

  return jsonb_build_object('loanId', v_loan_id, 'paymentId', v_payment_id);
end;
$$ language plpgsql security definer;

-- 4.2 rpc_initiate_repayment
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

  p_amount := least(p_amount, v_loan.outstanding_amount);

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

  v_current_total := coalesce((v_details->'creditLimit'->>'totalCreditLimitAmount')::numeric, 0);

  if v_new_outstanding = 0 then
    v_new_total := round(v_current_total * 1.25, 2);
    v_growth_delta := v_new_total - v_current_total;
    v_new_remaining := least(
      coalesce((v_details->'creditLimit'->>'remainingAmount')::numeric, 0) + p_amount + v_growth_delta,
      v_new_total
    );
  else
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

  update wallets set cashback_balance = cashback_balance + v_cashback where user_id = v_user_id;

  insert into care_fund_transactions (id, user_id, transaction_amount, currency, type, status, description, created_at)
  values ('cft-' || gen_random_uuid()::text, v_user_id, v_cashback,
    '{"code": "KES", "symbol": "KES", "name": "Kenyan Shilling"}'::jsonb,
    'EARNED', 'COMPLETED', 'Cashback from loan repayment', now());

  insert into payments (id, user_id, amount, currency, status, facility_name, facility_type,
    funding_sources, payment_splits, cashback_details, cashback_amount, user_info, description, created_at)
  values (v_reference, v_user_id, p_amount, 'KES', 'COMPLETED', 'Loan Repayment', 'REPAYMENT',
    jsonb_build_array(jsonb_build_object('source', 'MPESA', 'amount', p_amount)),
    jsonb_build_array(jsonb_build_object(
      'id', 'split-1', 'createdAt', now(), 'paymentSplitAmount', p_amount,
      'wallet', jsonb_build_object('type', 'MPESA'), 'loan', null
    )),
    jsonb_build_array(jsonb_build_object('source', 'Loan repayment reward', 'amount', v_cashback)),
    v_cashback, v_user_info, 'Loan repayment of ' || p_amount || ' KES', now());

  return jsonb_build_object(
    'isChargeTransaction', true, 'authorizationUrl', '', 'reference', v_reference,
    'success', true, 'newOutstanding', v_new_outstanding
  );
end;
$$ language plpgsql security definer;

-- 4.3 rpc_initiate_multi_payment
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

  select data into v_details from patient_details where user_id = v_user_id for update;
  v_user_info := jsonb_build_object(
    'firstName', coalesce(v_details->>'firstName', 'Demo'),
    'lastName', coalesce(v_details->>'lastName', 'User')
  );
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
      if (v_source->>'amount')::numeric > v_remaining then
        raise exception 'Loan amount exceeds credit limit (remaining: %)', v_remaining;
      end if;

      v_loan_id := 'loan-' || gen_random_uuid()::text;
      insert into loans (id, user_id, amount, total_bill_amount, outstanding_amount, currency, status, created_at)
      values (v_loan_id, v_user_id, (v_source->>'amount')::numeric, (v_source->>'amount')::numeric,
        (v_source->>'amount')::numeric, jsonb_build_object('code', p_currency), 'DISBURSED', now());

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

  update patient_details set data = jsonb_set(
    data, '{creditLimit,remainingAmount}', to_jsonb(v_remaining::text)
  ) where user_id = v_user_id;

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
    v_user_info, now());

  if v_cashback > 0 then
    update wallets set cashback_balance = cashback_balance + v_cashback where user_id = v_user_id;
    insert into care_fund_transactions (id, user_id, transaction_amount, currency, type, status, description, created_at)
    values ('cft-' || gen_random_uuid()::text, v_user_id, v_cashback,
      '{"code": "KES", "symbol": "KES", "name": "Kenyan Shilling"}'::jsonb,
      'EARNED', 'COMPLETED', 'Cashback from payment at ' || p_facility_name, now());
  end if;

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

-- 4.4 rpc_care_fund_transfer
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

-- 4.5 rpc_fast_track_initiate
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

  update patient_details set data = jsonb_set(
    data, '{creditLimit,remainingAmount}', to_jsonb(v_remaining::text)
  ) where user_id = v_user_id;

  if v_wallet_amount > 0 then
    update wallets set cashback_balance = cashback_balance - v_wallet_amount
    where user_id = v_user_id and cashback_balance >= v_wallet_amount;
    if not found then raise exception 'Insufficient wallet balance'; end if;
  end if;

  v_cashback := round(v_mpesa_amount * 0.05, 2);

  insert into payments (id, user_id, amount, currency, status, facility_name, facility_type,
    funding_sources, payment_splits, cashback_details, cashback_amount, user_info, created_at)
  values (v_payment_id, v_user_id, p_amount, 'KES', 'COMPLETED',
    v_provider.name, 'HOSPITAL', p_funding_sources, v_splits,
    case when v_cashback > 0 then jsonb_build_array(jsonb_build_object('source', 'Jireh cashback', 'amount', v_cashback))
    else '[]'::jsonb end,
    v_cashback, v_user_info, now());

  if v_cashback > 0 then
    update wallets set cashback_balance = cashback_balance + v_cashback where user_id = v_user_id;
    insert into care_fund_transactions (id, user_id, transaction_amount, currency, type, status, description, created_at)
    values ('cft-' || gen_random_uuid()::text, v_user_id, v_cashback,
      '{"code": "KES", "symbol": "KES", "name": "Kenyan Shilling"}'::jsonb,
      'EARNED', 'COMPLETED', 'Cashback from Fast Track payment', now());
  end if;

  if v_cashback_spent > 0 then
    insert into care_fund_transactions (id, user_id, transaction_amount, currency, type, status, description, created_at)
    values ('cft-' || gen_random_uuid()::text, v_user_id, v_cashback_spent,
      '{"code": "KES", "symbol": "KES", "name": "Kenyan Shilling"}'::jsonb,
      'SPENT', 'COMPLETED', 'Cashback used for Fast Track payment', now());
  end if;

  return jsonb_build_object('paymentId', v_payment_id, 'loanId', coalesce(v_loan_id, ''), 'reference', v_payment_id);
end;
$$ language plpgsql security definer;

-- 4.6 rpc_activate_membership
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

-- 4.7 rpc_seed_demo_account (FacilitatorPanel)
create or replace function rpc_seed_demo_account() returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
begin
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

  update wallets set cashback_balance = 500 where user_id = v_user_id;
  update profiles set data = '{}' where user_id = v_user_id;

  delete from patient_details where user_id = v_user_id;

  -- Re-insert seed data (inlined from 014_full_migration_seed.sql)
  insert into patient_details (user_id, data) values (v_user_id, '{
    "id": "patient-001",
    "firstName": "Wanjiru",
    "lastName": "Kamau",
    "email": "wanjiru.kamau@example.com",
    "phoneNumber": "+254712345678",
    "isVerified": true,
    "hasVerifiedId": "APPROVED",
    "membershipStatus": "ACTIVE",
    "hasActiveMembership": true,
    "creditLimit": {
      "totalCreditLimitAmount": "50000",
      "remainingAmount": "32000",
      "currency": {"countryName": "Kenya", "code": "KES", "id": 1}
    },
    "medicalRequests": [],
    "loans": [],
    "wallets": [
      {"id": "wallet-mpesa-001", "type": "MPESA", "remainingBalance": "0", "createdAt": "2026-01-15T09:30:00.000Z", "updatedAt": "2026-06-01T12:00:00.000Z"},
      {"id": "wallet-loan-001", "type": "LOAN", "remainingBalance": "32000", "createdAt": "2026-01-15T09:30:00.000Z", "updatedAt": "2026-06-01T12:00:00.000Z"},
      {"id": "wallet-cashback-001", "type": "CASHBACK", "remainingBalance": "500", "createdAt": "2026-01-15T09:30:00.000Z", "updatedAt": "2026-06-01T12:00:00.000Z"},
      {"id": "wallet-card-001", "type": "CARD", "remainingBalance": "0", "createdAt": "2026-01-15T09:30:00.000Z", "updatedAt": "2026-06-01T12:00:00.000Z"}
    ],
    "patientCircle": {
      "id": "circle-001", "status": "ACTIVE",
      "maxAccountableSlots": 2, "maxAuxiliarySlots": 3,
      "filledAccountableSlots": 2, "filledAuxiliarySlots": 1,
      "isFrozen": false, "hasCompletedSetup": true,
      "activatedAt": "2026-02-10T08:15:00.000Z",
      "createdAt": "2026-02-10T08:15:00.000Z", "updatedAt": "2026-06-01T12:00:00.000Z"
    },
    "hasAcceptedMedicalConsentForm": true,
    "hasAcceptedLatestTermsAndConditions": true,
    "hasBeenReferred": true,
    "hasVerifiedCrbScore": true,
    "idVerificationStatus": "APPROVED",
    "documentVerificationStatus": "PASSED",
    "network": [],
    "type": "PLUS",
    "canPayMedicalBill": true,
    "orgBorrower": null,
    "hasUploadedMpesaStatement": true,
    "careFundAccount": {
      "id": 1, "careFundBalance": "500",
      "createdAt": "2026-01-15T09:30:00.000Z", "updatedAt": "2026-06-01T12:00:00.000Z",
      "accountOwner": null,
      "currency": {"countryName": "Kenya", "code": "KES", "id": 1}
    },
    "accountReference": "JIR-WANJIRU-001",
    "subscriptions": [],
    "isBasicMember": false,
    "hasSetPin": true,
    "profilePhoto": null,
    "gender": "FEMALE",
    "dateOfBirth": "1992-04-18"
  }'::jsonb);

  -- Network members
  insert into network_members (id, user_id, first_name, last_name, phone_number, relationship, type, status, nickname, joined_at, has_defaulted_loan)
  values
    ('member-001', v_user_id, 'Brian', 'Kamau', '+254720112233', 'BROTHER', 'ACCOUNTABLE', 'ACTIVE', 'Bro', '2026-02-10T08:15:00.000Z', false),
    ('member-002', v_user_id, 'Wanjiru', 'Mwangi', '+254733445566', 'FRIEND', 'AUXILIARY', 'ACTIVE', null, '2026-03-05T14:42:00.000Z', false),
    ('member-003', v_user_id, 'Esther', 'Otieno', null, 'CHILD', 'CHILD', 'ACTIVE', 'Essy', '2026-01-20T10:00:00.000Z', false);

  -- Network invites
  insert into network_invites (id, user_id, first_name, last_name, phone_number, status, invite_link, nickname, relationship, created_at)
  values ('invite-001', v_user_id, 'Kevin', 'Ochieng', '+254701998877', 'PENDING', 'https://app.jireh.health/invite/invite-001', 'Kev', 'FRIEND', '2026-06-01T09:00:00.000Z');

  -- Circle activity
  insert into circle_activity (id, user_id, event_type, occurred_at, acknowledged_at, member, still_qualifies_for_borrowing, invite_id)
  values
    ('activity-001', v_user_id, 'MEMBER_JOINED', '2026-03-05T14:42:00.000Z', null, '{"id":"member-002","firstName":"Wanjiru","lastName":"Mwangi","avatarUrl":null}'::jsonb, true, null),
    ('activity-002', v_user_id, 'INVITE_REJECTED', '2026-05-18T11:20:00.000Z', null, '{"id":"member-099","firstName":"Daniel","lastName":"Njoroge","avatarUrl":null}'::jsonb, true, 'invite-090'),
    ('activity-003', v_user_id, 'MEMBER_REMOVED', '2026-04-22T16:05:00.000Z', '2026-04-23T08:00:00.000Z', '{"id":"member-098","firstName":"Faith","lastName":"Achieng","avatarUrl":null}'::jsonb, false, null);

  -- Care fund transactions
  insert into care_fund_transactions (id, user_id, transaction_amount, currency, type, status, sender, receiver, receiver_phone_number, description, created_at, updated_at, expires_at)
  values
    ('cf-txn-001', v_user_id, 500, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'EARNED', 'COMPLETED', null, '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, '+254712345678', 'Cashback earned', '2026-06-10T09:30:00.000Z', '2026-06-10T09:30:00.000Z', '2026-12-10T09:30:00.000Z'),
    ('cf-txn-002', v_user_id, 300, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'TRANSFER', 'COMPLETED', '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, '{"accountOwner":{"id":"member-001","firstName":"Brian","lastName":"Kamau"}}'::jsonb, '+254720112233', 'Gift to Brian', '2026-06-08T13:15:00.000Z', '2026-06-08T13:15:00.000Z', null),
    ('cf-txn-003', v_user_id, 250, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'TRANSFER', 'COMPLETED', '{"accountOwner":{"id":"member-002","firstName":"Wanjiru","lastName":"Mwangi"}}'::jsonb, '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, '+254712345678', 'Gift from Wanjiru', '2026-06-05T18:40:00.000Z', '2026-06-05T18:40:00.000Z', null),
    ('cf-txn-004', v_user_id, 800, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'SPENT', 'COMPLETED', '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, null, null, 'Applied to medical bill', '2026-05-28T11:00:00.000Z', '2026-05-28T11:00:00.000Z', null),
    ('cf-txn-005', v_user_id, 150, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'TRANSFER', 'PENDING', '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, '{"accountOwner":{"id":"member-002","firstName":"Wanjiru","lastName":"Mwangi"}}'::jsonb, '+254733445566', 'Gift to Wanjiru', '2026-05-20T07:25:00.000Z', '2026-05-20T07:25:00.000Z', null);

  -- Loans
  insert into loans (id, user_id, amount, total_bill_amount, outstanding_amount, total_paid, care_fund_discount_amount, status, loan_type, currency, created_at, loan_due_date, first_payment_due, patient_name, patient_medical_info_request, transactions)
  values
    ('loan-1001', v_user_id, 18000, 24000, 12000, 6000, 0, 'DISBURSED', 'MEMBERSHIP', '{"code":"KES"}'::jsonb, '2026-05-28T09:15:00.000Z', '2026-06-28T09:15:00.000Z', '2026-06-28T09:15:00.000Z', 'Wanjiru Kamau', '{"patientName":"Wanjiru Kamau","facility":{"id":"fac-001","name":"Aga Khan University Hospital"}}'::jsonb, '[{"id":"txn-2001","amount":6000,"description":"Loan repayment","transactionType":"COLLECTION","date":"2026-06-05T14:30:00.000Z","createdAt":"2026-06-05T14:30:00.000Z"}]'::jsonb),
    ('loan-1002', v_user_id, 9500, 9500, 0, 9500, 475, 'PAID', 'MEMBERSHIP', '{"code":"KES"}'::jsonb, '2026-04-12T11:00:00.000Z', '2026-05-12T11:00:00.000Z', '2026-05-12T11:00:00.000Z', 'Wanjiru Kamau', '{"patientName":"Wanjiru Kamau","facility":{"id":"fac-002","name":"Nairobi Hospital"}}'::jsonb, '[{"id":"txn-2002","amount":4500,"description":"Loan repayment","transactionType":"COLLECTION","date":"2026-04-25T10:00:00.000Z","createdAt":"2026-04-25T10:00:00.000Z"},{"id":"txn-2003","amount":5000,"description":"Loan repayment","transactionType":"COLLECTION","date":"2026-05-10T16:45:00.000Z","createdAt":"2026-05-10T16:45:00.000Z"}]'::jsonb);

  -- Manual requests
  insert into manual_requests (id, user_id, care_provider_name, bill_amount, payment_info, reason, status, created_at, updated_at, patient, kmpdc_facility, invoice_file)
  values
    ('mrr-7001', v_user_id, 'St. Mary''s Hospital Langata', '5400', '{"type":"MPTILL","tillNumber":"823914","paybillNumber":"","accountNumber":""}'::jsonb, null, 'PENDING', '2026-06-14T07:30:00.000Z', '2026-06-14T07:30:00.000Z', '{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau","phoneNumber":"+254712345678","email":"wanjiru.kamau@example.com"}'::jsonb, '{"id":"fac-004","name":"St. Mary''s Hospital Langata"}'::jsonb, '{"id":"file-9001","filePath":"/uploads/invoice-9001.pdf","originalFileName":"invoice-stmarys.pdf","url":"/uploads/invoice-9001.pdf"}'::jsonb),
    ('mrr-7002', v_user_id, 'Gertrude''s Children''s Hospital', '12300', '{"type":"MPAYBILL","tillNumber":"","paybillNumber":"247247","accountNumber":"GCH-4471"}'::jsonb, null, 'APPROVED', '2026-06-11T12:45:00.000Z', '2026-06-12T09:00:00.000Z', '{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau","phoneNumber":"+254712345678","email":"wanjiru.kamau@example.com"}'::jsonb, '{"id":"fac-005","name":"Gertrude''s Children''s Hospital"}'::jsonb, '{"id":"file-9002","filePath":"/uploads/invoice-9002.pdf","originalFileName":"invoice-gertrudes.pdf","url":"/uploads/invoice-9002.pdf"}'::jsonb);

  -- Enriched payments (from payment-history.json)
  insert into payments (id, user_id, amount, currency, status, facility_name, facility_type, funding_sources, payment_splits, cashback_details, cashback_amount, user_info, patient_medical_info_request, disbursement_transaction, created_at)
  values
    ('pay-3001', v_user_id, 2400, 'KES', 'COMPLETED', 'Cana Hospital', 'HOSPITAL',
      '[{"source":"WALLET","amount":600},{"source":"LOAN","amount":1800}]'::jsonb,
      '[{"id":"split-4001","createdAt":"2026-05-28T09:15:00.000Z","paymentSplitAmount":600,"wallet":{"type":"WALLET"},"loan":null},{"id":"split-4002","createdAt":"2026-05-28T09:15:00.000Z","paymentSplitAmount":1800,"wallet":{"type":"LOAN"},"loan":{"id":"loan-1001","amount":1800,"totalBillAmount":2400,"outstandingAmount":1200,"totalPaid":600,"loanDueDate":"2026-06-28T09:15:00.000Z","transactions":[{"id":"txn-2001","amount":600,"description":"Loan repayment","transactionType":"COLLECTION","createdAt":"2026-06-05T14:30:00.000Z"}]}}]'::jsonb,
      '[{"source":"Early repayment reward","amount":30}]'::jsonb,
      30, '{"firstName":"Wanjiru","lastName":"Kamau"}'::jsonb,
      '{"facility":{"id":"fac-001","name":"Cana Hospital"},"medicalInvoiceFile":{"careProviderName":"Cana Hospital"}}'::jsonb,
      '{"description":"Payment to Cana Hospital"}'::jsonb,
      '2026-05-28T09:15:00.000Z'),
    ('pay-3002', v_user_id, 9500, 'KES', 'COMPLETED', 'Nairobi Hospital', 'HOSPITAL',
      '[{"source":"DISCOUNT","amount":475},{"source":"LOAN","amount":9025}]'::jsonb,
      '[{"id":"split-4003","createdAt":"2026-04-12T11:00:00.000Z","paymentSplitAmount":475,"wallet":{"type":"DISCOUNT"},"loan":null},{"id":"split-4004","createdAt":"2026-04-12T11:00:00.000Z","paymentSplitAmount":9025,"wallet":{"type":"LOAN"},"loan":{"id":"loan-1002","amount":9500,"totalBillAmount":9500,"outstandingAmount":0,"totalPaid":9500,"loanDueDate":"2026-05-12T11:00:00.000Z","transactions":[{"id":"txn-2002","amount":4500,"description":"Loan repayment","transactionType":"COLLECTION","createdAt":"2026-04-25T10:00:00.000Z"},{"id":"txn-2003","amount":5000,"description":"Loan repayment","transactionType":"COLLECTION","createdAt":"2026-05-10T16:45:00.000Z"}]}}]'::jsonb,
      '[{"source":"Care Fund discount","amount":475}]'::jsonb,
      475, '{"firstName":"Wanjiru","lastName":"Kamau"}'::jsonb,
      '{"facility":{"id":"fac-002","name":"Nairobi Hospital"},"medicalInvoiceFile":{"careProviderName":"Nairobi Hospital"}}'::jsonb,
      '{"description":"Payment to Nairobi Hospital"}'::jsonb,
      '2026-04-12T11:00:00.000Z');

  -- Guarantor invites
  insert into guarantor_invites (user_id, data)
  values (v_user_id, '{"patientCountryCode":"KE","countryOptions":[{"name":"Kenya","value":"KE","callingCode":"+254"},{"name":"Uganda","value":"UG","callingCode":"+256"},{"name":"Tanzania","value":"TZ","callingCode":"+255"},{"name":"Rwanda","value":"RW","callingCode":"+250"},{"name":"United Kingdom","value":"GB","callingCode":"+44"},{"name":"United States","value":"US","callingCode":"+1"},{"name":"United Arab Emirates","value":"AE","callingCode":"+971"}],"localGuarantorInvites":[{"id":"guarantor-local-001","firstName":"Joseph","lastName":"Mwangi","phoneNumber":"+254722334455","countryCode":"KE","email":"joseph.mwangi@example.com","guarantorType":"LOCAL"}],"internationalGuarantorInvites":[{"id":"guarantor-intl-001","firstName":"Grace","lastName":"Achieng","phoneNumber":"+447911123456","countryCode":"GB","email":"grace.achieng@example.com","guarantorType":"INTERNATIONAL"}]}'::jsonb);

  return jsonb_build_object('success', true, 'message', 'Demo account reset');
end;
$$ language plpgsql security definer;

-- 4.8 rpc_reset_to_onboarding (FacilitatorPanel)
create or replace function rpc_reset_to_onboarding() returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
begin
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

  update wallets set cashback_balance = 0 where user_id = v_user_id;
  update profiles set data = '{}' where user_id = v_user_id;

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

-- 4.9 rpc_seed_at_stage (FacilitatorPanel)
create or replace function rpc_seed_at_stage(p_stage text) returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
begin
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
    insert into network_members (id, user_id, first_name, last_name, phone_number, relationship, type, status, nickname, joined_at, has_defaulted_loan)
    values
      ('member-001', v_user_id, 'Brian', 'Kamau', '+254720112233', 'BROTHER', 'ACCOUNTABLE', 'ACTIVE', 'Bro', '2026-02-10T08:15:00.000Z', false),
      ('member-002', v_user_id, 'Wanjiru', 'Mwangi', '+254733445566', 'FRIEND', 'AUXILIARY', 'ACTIVE', null, '2026-03-05T14:42:00.000Z', false),
      ('member-003', v_user_id, 'Esther', 'Otieno', null, 'CHILD', 'CHILD', 'ACTIVE', 'Essy', '2026-01-20T10:00:00.000Z', false);
    insert into network_invites (id, user_id, first_name, last_name, phone_number, status, invite_link, nickname, relationship, created_at)
    values ('invite-001', v_user_id, 'Kevin', 'Ochieng', '+254701998877', 'PENDING', 'https://app.jireh.health/invite/invite-001', 'Kev', 'FRIEND', '2026-06-01T09:00:00.000Z');

  elsif p_stage = 'membership_active' then
    update patient_details set data = data || jsonb_build_object(
      'hasSetPin', true, 'isVerified', true,
      'documentVerificationStatus', 'VERIFIED',
      'hasActiveMembership', true, 'type', 'PLUS',
      'membershipStatus', 'ACTIVE', 'isBasicMember', false,
      'canPayMedicalBill', true,
      'creditLimit', jsonb_build_object('totalCreditLimitAmount', '50000', 'remainingAmount', '50000')
    ) where user_id = v_user_id;
    insert into network_members (id, user_id, first_name, last_name, phone_number, relationship, type, status, nickname, joined_at, has_defaulted_loan)
    values
      ('member-001', v_user_id, 'Brian', 'Kamau', '+254720112233', 'BROTHER', 'ACCOUNTABLE', 'ACTIVE', 'Bro', '2026-02-10T08:15:00.000Z', false),
      ('member-002', v_user_id, 'Wanjiru', 'Mwangi', '+254733445566', 'FRIEND', 'AUXILIARY', 'ACTIVE', null, '2026-03-05T14:42:00.000Z', false),
      ('member-003', v_user_id, 'Esther', 'Otieno', null, 'CHILD', 'CHILD', 'ACTIVE', 'Essy', '2026-01-20T10:00:00.000Z', false);
    update wallets set cashback_balance = 500 where user_id = v_user_id;

  elsif p_stage = 'post_first_payment' then
    update patient_details set data = data || jsonb_build_object(
      'hasSetPin', true, 'isVerified', true,
      'documentVerificationStatus', 'VERIFIED',
      'hasActiveMembership', true, 'type', 'PLUS',
      'membershipStatus', 'ACTIVE', 'isBasicMember', false,
      'canPayMedicalBill', true,
      'creditLimit', jsonb_build_object('totalCreditLimitAmount', '50000', 'remainingAmount', '32000')
    ) where user_id = v_user_id;
    insert into network_members (id, user_id, first_name, last_name, phone_number, relationship, type, status, nickname, joined_at, has_defaulted_loan)
    values
      ('member-001', v_user_id, 'Brian', 'Kamau', '+254720112233', 'BROTHER', 'ACCOUNTABLE', 'ACTIVE', 'Bro', '2026-02-10T08:15:00.000Z', false),
      ('member-002', v_user_id, 'Wanjiru', 'Mwangi', '+254733445566', 'FRIEND', 'AUXILIARY', 'ACTIVE', null, '2026-03-05T14:42:00.000Z', false),
      ('member-003', v_user_id, 'Esther', 'Otieno', null, 'CHILD', 'CHILD', 'ACTIVE', 'Essy', '2026-01-20T10:00:00.000Z', false);
    update wallets set cashback_balance = 500 where user_id = v_user_id;
    insert into payments (id, user_id, amount, currency, status, facility_name, facility_type, funding_sources, payment_splits, cashback_details, cashback_amount, user_info, created_at)
    values ('pay-stage-001', v_user_id, 18000, 'KES', 'COMPLETED', 'Aga Khan University Hospital', 'HOSPITAL',
      '[{"source":"LOAN","amount":18000}]'::jsonb,
      '[{"id":"split-1","createdAt":"2026-05-28T09:15:00.000Z","paymentSplitAmount":18000,"wallet":{"type":"LOAN"},"loan":{"id":"loan-stage-001"}}]'::jsonb,
      '[]'::jsonb, 0, '{"firstName":"Wanjiru","lastName":"Kamau"}'::jsonb, '2026-05-28T09:15:00.000Z');
    insert into loans (id, user_id, amount, total_bill_amount, outstanding_amount, currency, status, created_at, loan_due_date, patient_name)
    values ('loan-stage-001', v_user_id, 18000, 18000, 18000, '{"code":"KES"}'::jsonb, 'DISBURSED', '2026-05-28T09:15:00.000Z', '2026-06-28T09:15:00.000Z', 'Wanjiru Kamau');

  else
    raise exception 'Unknown stage: %. Valid stages: id_verified, circle_built, membership_active, post_first_payment', p_stage;
  end if;

  return jsonb_build_object('success', true, 'stage', p_stage);
end;
$$ language plpgsql security definer;
