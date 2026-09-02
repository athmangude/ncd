ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS diagnosis_recency text,
  ADD COLUMN IF NOT EXISTS conditions_other_description text;
