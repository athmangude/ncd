-- 002_rls_policies.sql
-- Row Level Security policies for all tables

-- Profiles: id IS the user_id
alter table profiles enable row level security;
create policy "Users manage own profile" on profiles
  for all using (auth.uid() = id)
  with check (auth.uid() = id);

-- Events
alter table events enable row level security;
create policy "Users manage own events" on events
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Refill schedules
alter table refill_schedules enable row level security;
create policy "Users manage own refill schedules" on refill_schedules
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Test schedules
alter table test_schedules enable row level security;
create policy "Users manage own test schedules" on test_schedules
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Medication cards
alter table medication_cards enable row level security;
create policy "Users manage own medication cards" on medication_cards
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Notifications
alter table notifications enable row level security;
create policy "Users manage own notifications" on notifications
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Payments
alter table payments enable row level security;
create policy "Users manage own payments" on payments
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Wallets
alter table wallets enable row level security;
create policy "Users manage own wallet" on wallets
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Chat messages
alter table chat_messages enable row level security;
create policy "Users manage own chat messages" on chat_messages
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Education content: public read for all authenticated users
alter table education_content enable row level security;
create policy "Authenticated users can read education content" on education_content
  for select using (auth.role() = 'authenticated');

-- Education progress
alter table education_progress enable row level security;
create policy "Users manage own education progress" on education_progress
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
