-- Add payment PIN column to profiles
alter table profiles add column if not exists pin text;

-- Set demo user's PIN to 1234
update profiles
set pin = '1234'
where id = '6b4d8e63-16c9-4aa6-ae9c-73820311007a';
