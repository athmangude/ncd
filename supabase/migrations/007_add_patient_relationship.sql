ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS patient_relationship text;
