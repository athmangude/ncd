-- 005_get_otp_function.sql
-- SQL function to retrieve OTP from Supabase Auth internal tables.
-- Only callable via service_role (Edge Function), never from client.
--
-- Supabase stores phone OTPs in auth.users.confirmation_token (hashed)
-- and the raw OTP in auth.one_time_tokens. The token_type for phone
-- signup/login is 'confirmation_token'.

create or replace function get_otp_for_phone(phone_number text)
returns text
language sql
security definer
set search_path = auth, public
as $$
  select id::text
  from auth.one_time_tokens
  where relates_to = phone_number
    and token_type = 'confirmation_token'
  order by created_at desc
  limit 1;
$$;

-- Revoke public access — only service_role can call this
revoke execute on function get_otp_for_phone(text) from public;
revoke execute on function get_otp_for_phone(text) from anon;
revoke execute on function get_otp_for_phone(text) from authenticated;
