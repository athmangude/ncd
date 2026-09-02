-- 001_schema.sql
-- Full database schema for the NCD Care Companion prototype

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

-- Care companion events (discriminated union by type)
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
create index idx_refill_schedules_user on refill_schedules(user_id);

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
create index idx_test_schedules_user on test_schedules(user_id);

-- Medication cards (educational content per medication)
create table medication_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  medication_id text not null,
  slug text not null,
  content jsonb not null,
  created_at timestamptz default now()
);
create index idx_medication_cards_user on medication_cards(user_id);

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
create index idx_notifications_user_sent on notifications(user_id, sent_at desc);

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
create index idx_payments_user_created on payments(user_id, created_at desc);

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
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);
create index idx_chat_messages_user_created on chat_messages(user_id, created_at desc);

-- Education content (seeded from local fixture data)
create table education_content (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  conditions text[] default '{}',
  content_type text not null,
  summary text,
  body text not null,
  sections jsonb default '[]',
  estimated_minutes integer default 5,
  learning_objectives text[] default '{}',
  image_theme text,
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
create index idx_education_progress_user on education_progress(user_id);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger refill_schedules_updated_at before update on refill_schedules
  for each row execute function update_updated_at();
create trigger test_schedules_updated_at before update on test_schedules
  for each row execute function update_updated_at();
create trigger wallets_updated_at before update on wallets
  for each row execute function update_updated_at();
create trigger education_content_updated_at before update on education_content
  for each row execute function update_updated_at();
create trigger education_progress_updated_at before update on education_progress
  for each row execute function update_updated_at();
