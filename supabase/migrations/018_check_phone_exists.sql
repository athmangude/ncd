-- Add columns for sign-up details
alter table profiles add column if not exists last_name text;
alter table profiles add column if not exists id_number text;
alter table profiles add column if not exists id_verified boolean default false;

-- RPC to check if a phone number is registered
create or replace function check_phone_exists(phone_input text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists(
    select 1 from auth.users where phone = phone_input
  );
$$;
