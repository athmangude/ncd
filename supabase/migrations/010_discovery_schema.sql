-- 010_discovery_schema.sql
-- Discovery/explore tab tables: facilities, services, categories, discounts, reviews, recent searches, preferred providers

-- Healthcare facilities (reference data)
create table facilities (
  id integer primary key,
  name text not null,
  registration_number text,
  po_box text,
  facility_type text not null,
  facility_level text,
  bed_capacity integer default 0,
  county text not null,
  status text default 'OPERATIONAL',
  plot_number text,
  latitude numeric,
  longitude numeric,
  location_name text,
  phone_number text,
  place_image_url text,
  distance numeric,
  has_active_discount boolean default false,
  active_discount jsonb,
  verification_status text default 'PENDING',
  service_categories text[] default '{}',
  rating numeric,
  closing_time text,
  discount_percentage text,
  is_onboarded boolean default false,
  linked_facility jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger facilities_updated_at before update on facilities
  for each row execute function update_updated_at();

-- Facility services (reference data)
create table facility_services (
  id text primary key,
  facility_id integer not null references facilities(id),
  name text not null,
  code text not null,
  category text not null
);

-- Service categories (reference data)
create table service_categories (
  category text primary key,
  display_name text not null,
  count integer default 0
);

-- Discount codes (reference data)
create table discount_codes (
  id integer primary key,
  code text not null unique,
  description text,
  discount_type text not null,
  discount_value text not null,
  currency jsonb not null,
  context text not null,
  discount_amount text,
  valid_from timestamptz,
  valid_until timestamptz,
  minimum_order_amount text,
  maximum_discount_amount text,
  is_active boolean default true,
  is_valid boolean default true
);

-- Facility reviews (user-generated, public read)
create table facility_reviews (
  id text primary key,
  facility_id integer not null references facilities(id),
  user_id uuid not null references auth.users(id),
  payment_id text not null,
  nps_score integer not null,
  loved_most text,
  could_do_better text,
  make_it_a_ten text,
  created_at timestamptz default now()
);
create index idx_facility_reviews_facility on facility_reviews(facility_id);

-- Recent searches (per-user)
create table recent_searches (
  id text primary key,
  user_id uuid not null references auth.users(id),
  facility_id integer not null references facilities(id),
  created_at timestamptz default now()
);
create index idx_recent_searches_user on recent_searches(user_id, created_at desc);

-- Preferred providers (per-user)
create table preferred_providers (
  id text primary key,
  user_id uuid not null references auth.users(id),
  facility_id integer not null references facilities(id),
  created_at timestamptz default now(),
  unique(user_id, facility_id)
);
create index idx_preferred_providers_user on preferred_providers(user_id);

-- RLS Policies

alter table facilities enable row level security;
create policy "Authenticated read facilities" on facilities
  for select using (auth.role() = 'authenticated');

alter table facility_services enable row level security;
create policy "Authenticated read facility_services" on facility_services
  for select using (auth.role() = 'authenticated');

alter table service_categories enable row level security;
create policy "Authenticated read service_categories" on service_categories
  for select using (auth.role() = 'authenticated');

alter table discount_codes enable row level security;
create policy "Authenticated read discount_codes" on discount_codes
  for select using (auth.role() = 'authenticated');

alter table facility_reviews enable row level security;
create policy "Authenticated read reviews" on facility_reviews
  for select using (auth.role() = 'authenticated');
create policy "Users insert own reviews" on facility_reviews
  for insert with check (auth.uid() = user_id);

alter table recent_searches enable row level security;
create policy "Users manage own recent searches" on recent_searches
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table preferred_providers enable row level security;
create policy "Users manage own preferred providers" on preferred_providers
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
