-- Seed care profiles, payments, and circles for 3 anchor users
-- Then add all 11 users to circles (everyone in ≥1, some in 2)

DO $$
DECLARE
  -- Demo user (Nancy Kamau - DIABETES + HYPERTENSION)
  demo_uid uuid := '6b4d8e63-16c9-4aa6-ae9c-73820311007a';
  -- 3 anchor caregivers with full care profiles
  james_uid uuid := 'cf4e9a05-1ec4-4ad7-bf73-a1352775ba83';   -- James Ochieng - DIABETES + HYPERTENSION
  grace_uid uuid := 'a8ffe817-e26d-489c-907d-b5d4f7cdc957';   -- Grace Akinyi - DIABETES
  faith_uid uuid := '1cbc1fe5-676f-4f6f-9852-fbbc3e8eff95';   -- Faith Wambui - DIABETES + HYPERTENSION + HIGH_CHOLESTEROL
  -- Other users (circle members)
  mary_uid uuid := '0e3cf2ad-7db4-4277-a83a-c74cbde2b306';    -- Mary Wanjiku
  peter_uid uuid := '7b9e65d7-b976-47e9-bb2a-8d5a76ca07fa';   -- Peter Mwangi
  david_uid uuid := 'c82df9ca-cabd-463d-bba8-342dd4a2916d';   -- David Kimani
  sarah_uid uuid := 'ad404650-e51b-45fb-9e65-1bb0831f7d8c';   -- Sarah Njeri
  john_uid uuid := 'f80eac6c-cf22-4cf9-acb0-55c64158c4cf';    -- John Otieno
  michael_uid uuid := '79a39eda-7e2c-4b60-aa1e-2d35a14218b4'; -- Michael Kiprop
  agnes_uid uuid := 'c1eea30c-a5f7-4721-8fb0-35f477b6c05a';   -- Agnes Chebet
  -- Payment IDs
  j_pay1 uuid := gen_random_uuid();
  j_pay2 uuid := gen_random_uuid();
  j_pay3 uuid := gen_random_uuid();
  j_pay4 uuid := gen_random_uuid();
  g_pay1 uuid := gen_random_uuid();
  g_pay2 uuid := gen_random_uuid();
  g_pay3 uuid := gen_random_uuid();
  g_pay4 uuid := gen_random_uuid();
  f_pay1 uuid := gen_random_uuid();
  f_pay2 uuid := gen_random_uuid();
  f_pay3 uuid := gen_random_uuid();
  f_pay4 uuid := gen_random_uuid();
  f_pay5 uuid := gen_random_uuid();
BEGIN

-- ============================================================
-- PART 1: Update care profiles for 3 anchor users
-- Set completed_at so the app treats them as having completed intake
-- ============================================================

-- James Ochieng: DIABETES + HYPERTENSION (already set, enrich profile)
UPDATE profiles SET
  conditions = ARRAY['DIABETES', 'HYPERTENSION'],
  diagnosis_recency = 'ONE_TO_TWO_YEARS',
  treatment = '{
    "currentlyOnMedication": true,
    "medicationNames": ["Metformin 500mg", "Glibenclamide 5mg", "Amlodipine 5mg", "Losartan 50mg"],
    "takingMedicationRegularly": "ALWAYS",
    "reasonsForMissing": [],
    "usingHerbalAlternatives": false,
    "herbalDetails": null
  }'::jsonb,
  recurring_tests = '{"selectedTests": ["HbA1c", "Blood Pressure Check", "Fasting Blood Sugar", "Kidney Function (Creatinine & eGFR)"]}'::jsonb,
  cost_estimates = '{
    "medications": [
      {"name": "Metformin 500mg", "refillFrequencyDays": 30, "estimatedCostPerRefill": 450},
      {"name": "Glibenclamide 5mg", "refillFrequencyDays": 30, "estimatedCostPerRefill": 280},
      {"name": "Amlodipine 5mg", "refillFrequencyDays": 30, "estimatedCostPerRefill": 350},
      {"name": "Losartan 50mg", "refillFrequencyDays": 30, "estimatedCostPerRefill": 520}
    ],
    "tests": [
      {"name": "HbA1c", "frequencyMonths": 3, "estimatedCostPerTest": 1500},
      {"name": "Blood Pressure Check", "frequencyMonths": 1, "estimatedCostPerTest": 200},
      {"name": "Fasting Blood Sugar", "frequencyMonths": 1, "estimatedCostPerTest": 350},
      {"name": "Kidney Function (Creatinine & eGFR)", "frequencyMonths": 6, "estimatedCostPerTest": 1800}
    ]
  }'::jsonb,
  challenges = '{"selected": ["COST", "TRANSPORT", "SIDE_EFFECTS"], "topChallenge": "COST"}'::jsonb,
  coping = '{"informationSources": ["DOCTOR", "PHARMACY"], "costCoping": ["BORROW_FAMILY", "SKIP_DOSES"], "hasEmergencyPlan": false, "exerciseFrequency": "RARELY"}'::jsonb,
  goals = ARRAY['TRACK_COSTS', 'MEDICATION_REMINDERS', 'FIND_AFFORDABLE_CARE'],
  user_role = 'patient',
  pin = '1234',
  id_number = '28456123',
  id_verified = true,
  completed_at = now() - interval '45 days'
WHERE id = james_uid;

-- Grace Akinyi: DIABETES only
UPDATE profiles SET
  conditions = ARRAY['DIABETES'],
  diagnosis_recency = 'LESS_THAN_6_MONTHS',
  treatment = '{
    "currentlyOnMedication": true,
    "medicationNames": ["Metformin 500mg", "Glipizide 5mg"],
    "takingMedicationRegularly": "MOSTLY",
    "reasonsForMissing": ["FORGOT"],
    "usingHerbalAlternatives": true,
    "herbalDetails": "Uses bitter leaf tea occasionally"
  }'::jsonb,
  recurring_tests = '{"selectedTests": ["HbA1c", "Fasting Blood Sugar", "Lipid Panel"]}'::jsonb,
  cost_estimates = '{
    "medications": [
      {"name": "Metformin 500mg", "refillFrequencyDays": 30, "estimatedCostPerRefill": 450},
      {"name": "Glipizide 5mg", "refillFrequencyDays": 30, "estimatedCostPerRefill": 380}
    ],
    "tests": [
      {"name": "HbA1c", "frequencyMonths": 3, "estimatedCostPerTest": 1500},
      {"name": "Fasting Blood Sugar", "frequencyMonths": 1, "estimatedCostPerTest": 350},
      {"name": "Lipid Panel", "frequencyMonths": 6, "estimatedCostPerTest": 2500}
    ]
  }'::jsonb,
  challenges = '{"selected": ["UNDERSTANDING_MEDICATION", "DIET", "COST"], "topChallenge": "UNDERSTANDING_MEDICATION"}'::jsonb,
  coping = '{"informationSources": ["FAMILY", "INTERNET"], "costCoping": ["PAY_OUT_OF_POCKET"], "hasEmergencyPlan": true, "exerciseFrequency": "FEW_TIMES_WEEK"}'::jsonb,
  goals = ARRAY['LEARN_ABOUT_CONDITION', 'TRACK_COSTS'],
  user_role = 'caregiver',
  pin = '1234',
  id_number = '34567891',
  id_verified = true,
  completed_at = now() - interval '30 days'
WHERE id = grace_uid;

-- Faith Wambui: DIABETES + HYPERTENSION + HIGH_CHOLESTEROL
UPDATE profiles SET
  conditions = ARRAY['DIABETES', 'HYPERTENSION', 'HIGH_CHOLESTEROL'],
  diagnosis_recency = 'MORE_THAN_2_YEARS',
  treatment = '{
    "currentlyOnMedication": true,
    "medicationNames": ["Metformin 1000mg", "Insulin Glargine", "Amlodipine 10mg", "Atorvastatin 40mg", "Aspirin 75mg"],
    "takingMedicationRegularly": "ALWAYS",
    "reasonsForMissing": [],
    "usingHerbalAlternatives": false,
    "herbalDetails": null
  }'::jsonb,
  recurring_tests = '{"selectedTests": ["HbA1c", "Blood Pressure Check", "Lipid Panel", "Kidney Function (Creatinine & eGFR)", "Liver Function Test", "Fasting Blood Sugar"]}'::jsonb,
  cost_estimates = '{
    "medications": [
      {"name": "Metformin 1000mg", "refillFrequencyDays": 30, "estimatedCostPerRefill": 680},
      {"name": "Insulin Glargine", "refillFrequencyDays": 30, "estimatedCostPerRefill": 3200},
      {"name": "Amlodipine 10mg", "refillFrequencyDays": 30, "estimatedCostPerRefill": 450},
      {"name": "Atorvastatin 40mg", "refillFrequencyDays": 30, "estimatedCostPerRefill": 850},
      {"name": "Aspirin 75mg", "refillFrequencyDays": 30, "estimatedCostPerRefill": 150}
    ],
    "tests": [
      {"name": "HbA1c", "frequencyMonths": 3, "estimatedCostPerTest": 1500},
      {"name": "Blood Pressure Check", "frequencyMonths": 1, "estimatedCostPerTest": 200},
      {"name": "Lipid Panel", "frequencyMonths": 3, "estimatedCostPerTest": 2500},
      {"name": "Kidney Function (Creatinine & eGFR)", "frequencyMonths": 6, "estimatedCostPerTest": 1800},
      {"name": "Liver Function Test", "frequencyMonths": 6, "estimatedCostPerTest": 2200},
      {"name": "Fasting Blood Sugar", "frequencyMonths": 1, "estimatedCostPerTest": 350}
    ]
  }'::jsonb,
  challenges = '{"selected": ["COST", "SIDE_EFFECTS", "MULTIPLE_MEDS"], "topChallenge": "COST"}'::jsonb,
  coping = '{"informationSources": ["DOCTOR", "SUPPORT_GROUP"], "costCoping": ["BORROW_FAMILY", "USE_SAVINGS"], "hasEmergencyPlan": true, "exerciseFrequency": "FEW_TIMES_WEEK"}'::jsonb,
  goals = ARRAY['TRACK_COSTS', 'MEDICATION_REMINDERS', 'FIND_AFFORDABLE_CARE', 'LEARN_ABOUT_CONDITION'],
  user_role = 'caregiver',
  pin = '1234',
  id_number = '29034567',
  id_verified = true,
  completed_at = now() - interval '90 days'
WHERE id = faith_uid;

-- ============================================================
-- PART 2: Refill & Test Schedules for 3 anchors
-- ============================================================

-- Clear existing schedules for these users
DELETE FROM refill_schedules WHERE user_id IN (james_uid, grace_uid, faith_uid);
DELETE FROM test_schedules WHERE user_id IN (james_uid, grace_uid, faith_uid);

-- James refill schedules
INSERT INTO refill_schedules (user_id, medication_name, frequency_days, next_date, status) VALUES
  (james_uid, 'Metformin 500mg',    30, current_date + interval '8 days',  'UPCOMING'),
  (james_uid, 'Glibenclamide 5mg',  30, current_date + interval '8 days',  'UPCOMING'),
  (james_uid, 'Amlodipine 5mg',     30, current_date + interval '15 days', 'UPCOMING'),
  (james_uid, 'Losartan 50mg',      30, current_date + interval '15 days', 'UPCOMING');

INSERT INTO test_schedules (user_id, test_name, frequency_months, next_date, status) VALUES
  (james_uid, 'HbA1c',                               3, current_date + interval '35 days', 'UPCOMING'),
  (james_uid, 'Blood Pressure Check',                 1, current_date + interval '10 days', 'UPCOMING'),
  (james_uid, 'Fasting Blood Sugar',                  1, current_date + interval '10 days', 'UPCOMING'),
  (james_uid, 'Kidney Function (Creatinine & eGFR)',  6, current_date + interval '95 days', 'UPCOMING');

-- Grace refill schedules
INSERT INTO refill_schedules (user_id, medication_name, frequency_days, next_date, status) VALUES
  (grace_uid, 'Metformin 500mg', 30, current_date + interval '3 days',  'UPCOMING'),
  (grace_uid, 'Glipizide 5mg',  30, current_date + interval '3 days',  'UPCOMING');

INSERT INTO test_schedules (user_id, test_name, frequency_months, next_date, status) VALUES
  (grace_uid, 'HbA1c',              3, current_date + interval '50 days', 'UPCOMING'),
  (grace_uid, 'Fasting Blood Sugar', 1, current_date + interval '18 days', 'UPCOMING'),
  (grace_uid, 'Lipid Panel',        6, current_date + interval '120 days', 'UPCOMING');

-- Faith refill schedules
INSERT INTO refill_schedules (user_id, medication_name, frequency_days, next_date, status) VALUES
  (faith_uid, 'Metformin 1000mg',    30, current_date + interval '5 days',  'UPCOMING'),
  (faith_uid, 'Insulin Glargine',    30, current_date + interval '5 days',  'UPCOMING'),
  (faith_uid, 'Amlodipine 10mg',    30, current_date + interval '12 days', 'UPCOMING'),
  (faith_uid, 'Atorvastatin 40mg',  30, current_date + interval '12 days', 'UPCOMING'),
  (faith_uid, 'Aspirin 75mg',       30, current_date + interval '12 days', 'UPCOMING');

INSERT INTO test_schedules (user_id, test_name, frequency_months, next_date, status) VALUES
  (faith_uid, 'HbA1c',                               3, current_date + interval '22 days', 'UPCOMING'),
  (faith_uid, 'Blood Pressure Check',                 1, current_date + interval '6 days',  'UPCOMING'),
  (faith_uid, 'Lipid Panel',                          3, current_date + interval '45 days', 'UPCOMING'),
  (faith_uid, 'Kidney Function (Creatinine & eGFR)',  6, current_date + interval '80 days', 'UPCOMING'),
  (faith_uid, 'Liver Function Test',                  6, current_date + interval '80 days', 'UPCOMING'),
  (faith_uid, 'Fasting Blood Sugar',                  1, current_date + interval '6 days',  'UPCOMING');

-- ============================================================
-- PART 3: Payments with invoice line items for 3 anchors
-- ============================================================

-- James: 4 payments over the past 2 months
INSERT INTO payments (id, user_id, facility_name, facility_type, amount, currency, line_items, funding_sources, cashback_amount, status, created_at) VALUES
  (j_pay1, james_uid, 'Kenyatta National Hospital - Diabetic Clinic', 'HOSPITAL', 5200, 'KES',
   '[
     {"name": "Consultation - Endocrinologist", "category": "CONSULTATION", "quantity": 1, "unitPrice": 2500, "total": 2500},
     {"name": "HbA1c Test", "category": "LAB_TEST", "quantity": 1, "unitPrice": 1500, "total": 1500},
     {"name": "Fasting Blood Sugar", "category": "LAB_TEST", "quantity": 1, "unitPrice": 350, "total": 350},
     {"name": "Blood Pressure Check", "category": "LAB_TEST", "quantity": 1, "unitPrice": 200, "total": 200},
     {"name": "Urinalysis", "category": "LAB_TEST", "quantity": 1, "unitPrice": 300, "total": 300},
     {"name": "Kidney Function Panel", "category": "LAB_TEST", "quantity": 1, "unitPrice": 350, "total": 350}
   ]'::jsonb,
   '[{"source": "JIREH_WALLET", "amount": 3500}, {"source": "MPESA", "amount": 1700}]'::jsonb,
   260, 'COMPLETED', now() - interval '7 days'),

  (j_pay2, james_uid, 'Nairobi West Hospital Pharmacy', 'PHARMACY', 1600, 'KES',
   '[
     {"name": "Metformin 500mg x 60 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 450, "total": 450},
     {"name": "Glibenclamide 5mg x 30 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 280, "total": 280},
     {"name": "Amlodipine 5mg x 30 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 350, "total": 350},
     {"name": "Losartan 50mg x 30 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 520, "total": 520}
   ]'::jsonb,
   '[{"source": "JIREH_WALLET", "amount": 1600}]'::jsonb,
   80, 'COMPLETED', now() - interval '7 days'),

  (j_pay3, james_uid, 'Mater Hospital Pharmacy', 'PHARMACY', 1600, 'KES',
   '[
     {"name": "Metformin 500mg x 60 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 450, "total": 450},
     {"name": "Glibenclamide 5mg x 30 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 280, "total": 280},
     {"name": "Amlodipine 5mg x 30 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 350, "total": 350},
     {"name": "Losartan 50mg x 30 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 520, "total": 520}
   ]'::jsonb,
   '[{"source": "JIREH_WALLET", "amount": 1600}]'::jsonb,
   80, 'COMPLETED', now() - interval '37 days'),

  (j_pay4, james_uid, 'Kenyatta National Hospital - Diabetic Clinic', 'HOSPITAL', 3050, 'KES',
   '[
     {"name": "Consultation - Endocrinologist", "category": "CONSULTATION", "quantity": 1, "unitPrice": 2500, "total": 2500},
     {"name": "Fasting Blood Sugar", "category": "LAB_TEST", "quantity": 1, "unitPrice": 350, "total": 350},
     {"name": "Blood Pressure Check", "category": "LAB_TEST", "quantity": 1, "unitPrice": 200, "total": 200}
   ]'::jsonb,
   '[{"source": "JIREH_WALLET", "amount": 2000}, {"source": "CARE_SAVER", "amount": 1050}]'::jsonb,
   152.50, 'COMPLETED', now() - interval '37 days');

-- Grace: 4 payments (newly diagnosed, more frequent visits)
INSERT INTO payments (id, user_id, facility_name, facility_type, amount, currency, line_items, funding_sources, cashback_amount, status, created_at) VALUES
  (g_pay1, grace_uid, 'Aga Khan University Hospital - Diabetes Centre', 'HOSPITAL', 6500, 'KES',
   '[
     {"name": "Consultation - Diabetologist", "category": "CONSULTATION", "quantity": 1, "unitPrice": 3500, "total": 3500},
     {"name": "HbA1c Test", "category": "LAB_TEST", "quantity": 1, "unitPrice": 1500, "total": 1500},
     {"name": "Fasting Blood Sugar", "category": "LAB_TEST", "quantity": 1, "unitPrice": 350, "total": 350},
     {"name": "Lipid Panel", "category": "LAB_TEST", "quantity": 1, "unitPrice": 850, "total": 850},
     {"name": "Urinalysis", "category": "LAB_TEST", "quantity": 1, "unitPrice": 300, "total": 300}
   ]'::jsonb,
   '[{"source": "JIREH_WALLET", "amount": 4000}, {"source": "MPESA", "amount": 2500}]'::jsonb,
   325, 'COMPLETED', now() - interval '5 days'),

  (g_pay2, grace_uid, 'Goodlife Pharmacy - Westlands', 'PHARMACY', 830, 'KES',
   '[
     {"name": "Metformin 500mg x 60 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 450, "total": 450},
     {"name": "Glipizide 5mg x 30 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 380, "total": 380}
   ]'::jsonb,
   '[{"source": "JIREH_WALLET", "amount": 830}]'::jsonb,
   41.50, 'COMPLETED', now() - interval '5 days'),

  (g_pay3, grace_uid, 'Nairobi Hospital - Outpatient', 'HOSPITAL', 4200, 'KES',
   '[
     {"name": "Consultation - General Physician", "category": "CONSULTATION", "quantity": 1, "unitPrice": 2500, "total": 2500},
     {"name": "Fasting Blood Sugar", "category": "LAB_TEST", "quantity": 1, "unitPrice": 350, "total": 350},
     {"name": "Diabetes Education Session", "category": "CONSULTATION", "quantity": 1, "unitPrice": 1000, "total": 1000},
     {"name": "Blood Pressure Check", "category": "LAB_TEST", "quantity": 1, "unitPrice": 200, "total": 200},
     {"name": "BMI Assessment", "category": "CONSULTATION", "quantity": 1, "unitPrice": 150, "total": 150}
   ]'::jsonb,
   '[{"source": "JIREH_WALLET", "amount": 2500}, {"source": "CARE_SAVER", "amount": 1700}]'::jsonb,
   210, 'COMPLETED', now() - interval '20 days'),

  (g_pay4, grace_uid, 'Goodlife Pharmacy - Westlands', 'PHARMACY', 830, 'KES',
   '[
     {"name": "Metformin 500mg x 60 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 450, "total": 450},
     {"name": "Glipizide 5mg x 30 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 380, "total": 380}
   ]'::jsonb,
   '[{"source": "JIREH_WALLET", "amount": 830}]'::jsonb,
   41.50, 'COMPLETED', now() - interval '20 days');

-- Faith: 5 payments (complex multi-condition, highest spend)
INSERT INTO payments (id, user_id, facility_name, facility_type, amount, currency, line_items, funding_sources, cashback_amount, status, created_at) VALUES
  (f_pay1, faith_uid, 'Nairobi Hospital - Cardiac & Diabetes Centre', 'HOSPITAL', 9800, 'KES',
   '[
     {"name": "Consultation - Cardiologist", "category": "CONSULTATION", "quantity": 1, "unitPrice": 3500, "total": 3500},
     {"name": "HbA1c Test", "category": "LAB_TEST", "quantity": 1, "unitPrice": 1500, "total": 1500},
     {"name": "Lipid Panel", "category": "LAB_TEST", "quantity": 1, "unitPrice": 2500, "total": 2500},
     {"name": "Liver Function Test", "category": "LAB_TEST", "quantity": 1, "unitPrice": 2200, "total": 2200},
     {"name": "Blood Pressure Check", "category": "LAB_TEST", "quantity": 1, "unitPrice": 200, "total": 200}
   ]'::jsonb,
   '[{"source": "JIREH_WALLET", "amount": 5000}, {"source": "CARE_SAVER", "amount": 3000}, {"source": "MPESA", "amount": 1800}]'::jsonb,
   490, 'COMPLETED', now() - interval '3 days'),

  (f_pay2, faith_uid, 'Aga Khan Pharmacy - Upperhill', 'PHARMACY', 5330, 'KES',
   '[
     {"name": "Metformin 1000mg x 60 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 680, "total": 680},
     {"name": "Insulin Glargine 100IU/ml pen", "category": "MEDICATION", "quantity": 1, "unitPrice": 3200, "total": 3200},
     {"name": "Amlodipine 10mg x 30 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 450, "total": 450},
     {"name": "Atorvastatin 40mg x 30 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 850, "total": 850},
     {"name": "Aspirin 75mg x 30 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 150, "total": 150}
   ]'::jsonb,
   '[{"source": "JIREH_WALLET", "amount": 5330}]'::jsonb,
   266.50, 'COMPLETED', now() - interval '3 days'),

  (f_pay3, faith_uid, 'Kenyatta National Hospital - Cardiac Clinic', 'HOSPITAL', 4700, 'KES',
   '[
     {"name": "Consultation - Cardiologist", "category": "CONSULTATION", "quantity": 1, "unitPrice": 2500, "total": 2500},
     {"name": "ECG (Electrocardiogram)", "category": "LAB_TEST", "quantity": 1, "unitPrice": 1500, "total": 1500},
     {"name": "Blood Pressure Check", "category": "LAB_TEST", "quantity": 1, "unitPrice": 200, "total": 200},
     {"name": "Fasting Blood Sugar", "category": "LAB_TEST", "quantity": 1, "unitPrice": 350, "total": 350},
     {"name": "BMI Assessment", "category": "CONSULTATION", "quantity": 1, "unitPrice": 150, "total": 150}
   ]'::jsonb,
   '[{"source": "JIREH_WALLET", "amount": 3000}, {"source": "MPESA", "amount": 1700}]'::jsonb,
   235, 'COMPLETED', now() - interval '30 days'),

  (f_pay4, faith_uid, 'Aga Khan Pharmacy - Upperhill', 'PHARMACY', 5330, 'KES',
   '[
     {"name": "Metformin 1000mg x 60 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 680, "total": 680},
     {"name": "Insulin Glargine 100IU/ml pen", "category": "MEDICATION", "quantity": 1, "unitPrice": 3200, "total": 3200},
     {"name": "Amlodipine 10mg x 30 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 450, "total": 450},
     {"name": "Atorvastatin 40mg x 30 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 850, "total": 850},
     {"name": "Aspirin 75mg x 30 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 150, "total": 150}
   ]'::jsonb,
   '[{"source": "JIREH_WALLET", "amount": 5330}]'::jsonb,
   266.50, 'COMPLETED', now() - interval '33 days'),

  (f_pay5, faith_uid, 'Nairobi Hospital - Cardiac & Diabetes Centre', 'HOSPITAL', 7500, 'KES',
   '[
     {"name": "Consultation - Endocrinologist", "category": "CONSULTATION", "quantity": 1, "unitPrice": 3000, "total": 3000},
     {"name": "HbA1c Test", "category": "LAB_TEST", "quantity": 1, "unitPrice": 1500, "total": 1500},
     {"name": "Kidney Function Panel", "category": "LAB_TEST", "quantity": 1, "unitPrice": 1800, "total": 1800},
     {"name": "Fasting Blood Sugar", "category": "LAB_TEST", "quantity": 1, "unitPrice": 350, "total": 350},
     {"name": "Insulin Pen Needles x 100", "category": "SUPPLY", "quantity": 1, "unitPrice": 850, "total": 850}
   ]'::jsonb,
   '[{"source": "JIREH_WALLET", "amount": 4000}, {"source": "CARE_SAVER", "amount": 2500}, {"source": "MPESA", "amount": 1000}]'::jsonb,
   375, 'COMPLETED', now() - interval '60 days');

-- ============================================================
-- PART 4: Events for 3 anchors
-- ============================================================

-- James events
INSERT INTO events (user_id, type, data, created_at) VALUES
  (james_uid, 'PAYMENT', jsonb_build_object('paymentId', j_pay1, 'facilityName', 'Kenyatta National Hospital - Diabetic Clinic', 'amount', 5200, 'currency', 'KES', 'facilityType', 'HOSPITAL'), now() - interval '7 days'),
  (james_uid, 'PAYMENT', jsonb_build_object('paymentId', j_pay2, 'facilityName', 'Nairobi West Hospital Pharmacy', 'amount', 1600, 'currency', 'KES', 'facilityType', 'PHARMACY'), now() - interval '7 days'),
  (james_uid, 'CASHBACK_EARNED', jsonb_build_object('amount', 340, 'paymentId', j_pay1, 'currency', 'KES'), now() - interval '7 days'),
  (james_uid, 'REFILL_PURCHASE', '{"medicationName": "Metformin 500mg", "quantity": 60, "cost": 450, "currency": "KES", "facilityName": "Nairobi West Hospital Pharmacy"}'::jsonb, now() - interval '7 days'),
  (james_uid, 'TEST_RESULT', '{"testName": "HbA1c", "metrics": [{"name": "HbA1c", "value": 7.8, "unit": "%", "referenceRange": "4.0 - 5.6", "status": "HIGH"}], "labName": "KNH Laboratory", "date": "2026-08-28"}'::jsonb, now() - interval '7 days'),
  (james_uid, 'TEST_RESULT', '{"testName": "Fasting Blood Sugar", "metrics": [{"name": "Fasting Glucose", "value": 8.4, "unit": "mmol/L", "referenceRange": "3.9 - 5.6", "status": "HIGH"}], "labName": "KNH Laboratory", "date": "2026-08-28"}'::jsonb, now() - interval '7 days'),
  (james_uid, 'PAYMENT', jsonb_build_object('paymentId', j_pay3, 'facilityName', 'Mater Hospital Pharmacy', 'amount', 1600, 'currency', 'KES', 'facilityType', 'PHARMACY'), now() - interval '37 days'),
  (james_uid, 'PAYMENT', jsonb_build_object('paymentId', j_pay4, 'facilityName', 'Kenyatta National Hospital - Diabetic Clinic', 'amount', 3050, 'currency', 'KES', 'facilityType', 'HOSPITAL'), now() - interval '37 days');

-- Grace events
INSERT INTO events (user_id, type, data, created_at) VALUES
  (grace_uid, 'PAYMENT', jsonb_build_object('paymentId', g_pay1, 'facilityName', 'Aga Khan University Hospital - Diabetes Centre', 'amount', 6500, 'currency', 'KES', 'facilityType', 'HOSPITAL'), now() - interval '5 days'),
  (grace_uid, 'PAYMENT', jsonb_build_object('paymentId', g_pay2, 'facilityName', 'Goodlife Pharmacy - Westlands', 'amount', 830, 'currency', 'KES', 'facilityType', 'PHARMACY'), now() - interval '5 days'),
  (grace_uid, 'CASHBACK_EARNED', jsonb_build_object('amount', 366.50, 'paymentId', g_pay1, 'currency', 'KES'), now() - interval '5 days'),
  (grace_uid, 'TEST_RESULT', '{"testName": "HbA1c", "metrics": [{"name": "HbA1c", "value": 8.9, "unit": "%", "referenceRange": "4.0 - 5.6", "status": "HIGH"}], "labName": "Aga Khan Laboratory", "date": "2026-08-30"}'::jsonb, now() - interval '5 days'),
  (grace_uid, 'TEST_RESULT', '{"testName": "Fasting Blood Sugar", "metrics": [{"name": "Fasting Glucose", "value": 11.2, "unit": "mmol/L", "referenceRange": "3.9 - 5.6", "status": "HIGH"}], "labName": "Aga Khan Laboratory", "date": "2026-08-30"}'::jsonb, now() - interval '5 days'),
  (grace_uid, 'PAYMENT', jsonb_build_object('paymentId', g_pay3, 'facilityName', 'Nairobi Hospital - Outpatient', 'amount', 4200, 'currency', 'KES', 'facilityType', 'HOSPITAL'), now() - interval '20 days'),
  (grace_uid, 'PAYMENT', jsonb_build_object('paymentId', g_pay4, 'facilityName', 'Goodlife Pharmacy - Westlands', 'amount', 830, 'currency', 'KES', 'facilityType', 'PHARMACY'), now() - interval '20 days'),
  (grace_uid, 'AI_INSIGHT', '{"insightType": "MEDICATION_REMINDER", "title": "Starting Metformin: what to expect", "body": "In the first 1-2 weeks of Metformin you may experience mild nausea or stomach upset. Taking it with food helps. These side effects usually pass as your body adjusts.", "confidence": 0.95}'::jsonb, now() - interval '3 days');

-- Faith events
INSERT INTO events (user_id, type, data, created_at) VALUES
  (faith_uid, 'PAYMENT', jsonb_build_object('paymentId', f_pay1, 'facilityName', 'Nairobi Hospital - Cardiac & Diabetes Centre', 'amount', 9800, 'currency', 'KES', 'facilityType', 'HOSPITAL'), now() - interval '3 days'),
  (faith_uid, 'PAYMENT', jsonb_build_object('paymentId', f_pay2, 'facilityName', 'Aga Khan Pharmacy - Upperhill', 'amount', 5330, 'currency', 'KES', 'facilityType', 'PHARMACY'), now() - interval '3 days'),
  (faith_uid, 'CASHBACK_EARNED', jsonb_build_object('amount', 756.50, 'paymentId', f_pay1, 'currency', 'KES'), now() - interval '3 days'),
  (faith_uid, 'REFILL_PURCHASE', '{"medicationName": "Insulin Glargine", "quantity": 1, "cost": 3200, "currency": "KES", "facilityName": "Aga Khan Pharmacy - Upperhill"}'::jsonb, now() - interval '3 days'),
  (faith_uid, 'TEST_RESULT', '{"testName": "HbA1c", "metrics": [{"name": "HbA1c", "value": 7.5, "unit": "%", "referenceRange": "4.0 - 5.6", "status": "HIGH"}], "labName": "Nairobi Hospital Laboratory", "date": "2026-09-01"}'::jsonb, now() - interval '3 days'),
  (faith_uid, 'TEST_RESULT', '{"testName": "Lipid Panel", "metrics": [{"name": "Total Cholesterol", "value": 5.8, "unit": "mmol/L", "referenceRange": "< 5.2", "status": "HIGH"}, {"name": "LDL", "value": 3.4, "unit": "mmol/L", "referenceRange": "< 2.6", "status": "HIGH"}, {"name": "HDL", "value": 1.1, "unit": "mmol/L", "referenceRange": "> 1.0", "status": "NORMAL"}, {"name": "Triglycerides", "value": 2.1, "unit": "mmol/L", "referenceRange": "< 1.7", "status": "HIGH"}], "labName": "Nairobi Hospital Laboratory", "date": "2026-09-01"}'::jsonb, now() - interval '3 days'),
  (faith_uid, 'TEST_RESULT', '{"testName": "Liver Function Test", "metrics": [{"name": "ALT", "value": 28, "unit": "U/L", "referenceRange": "7 - 56", "status": "NORMAL"}, {"name": "AST", "value": 22, "unit": "U/L", "referenceRange": "10 - 40", "status": "NORMAL"}], "labName": "Nairobi Hospital Laboratory", "date": "2026-09-01"}'::jsonb, now() - interval '3 days'),
  (faith_uid, 'PAYMENT', jsonb_build_object('paymentId', f_pay3, 'facilityName', 'Kenyatta National Hospital - Cardiac Clinic', 'amount', 4700, 'currency', 'KES', 'facilityType', 'HOSPITAL'), now() - interval '30 days'),
  (faith_uid, 'PAYMENT', jsonb_build_object('paymentId', f_pay4, 'facilityName', 'Aga Khan Pharmacy - Upperhill', 'amount', 5330, 'currency', 'KES', 'facilityType', 'PHARMACY'), now() - interval '33 days'),
  (faith_uid, 'PAYMENT', jsonb_build_object('paymentId', f_pay5, 'facilityName', 'Nairobi Hospital - Cardiac & Diabetes Centre', 'amount', 7500, 'currency', 'KES', 'facilityType', 'HOSPITAL'), now() - interval '60 days'),
  (faith_uid, 'CASHBACK_EARNED', jsonb_build_object('amount', 375, 'paymentId', f_pay5, 'currency', 'KES'), now() - interval '60 days'),
  (faith_uid, 'AI_INSIGHT', '{"insightType": "COST_SAVING_SUGGESTION", "title": "You could save on Atorvastatin", "body": "Kenyatta National Hospital Pharmacy offers Atorvastatin 40mg at KES 650 compared to KES 850 at Aga Khan. That is KES 2,400 saved per year.", "confidence": 0.88}'::jsonb, now() - interval '2 days');

-- ============================================================
-- PART 5: Update wallet balances for 3 anchors
-- ============================================================
UPDATE wallets SET cashback_balance = 572.50 WHERE user_id = james_uid;
UPDATE wallets SET cashback_balance = 618.00 WHERE user_id = grace_uid;
UPDATE wallets SET cashback_balance = 1633.00 WHERE user_id = faith_uid;

-- ============================================================
-- PART 6: Circles (network_members)
-- Each anchor caregiver has a circle; all 11 users distributed
-- ============================================================

-- Circle 1: James Ochieng's circle
-- Members: Nancy (demo), Mary Wanjiku, Peter Mwangi, David Kimani
INSERT INTO network_members (id, user_id, first_name, last_name, phone_number, relationship, type, status, joined_at, has_defaulted_loan) VALUES
  ('nm-james-nancy',  james_uid, 'Nancy',  'Kamau',   '+254700000001', 'FRIEND',  'ACCOUNTABLE', 'ACTIVE', now() - interval '40 days', false),
  ('nm-james-mary',   james_uid, 'Mary',   'Wanjiku', '+254700000003', 'SISTER',  'ACCOUNTABLE', 'ACTIVE', now() - interval '38 days', false),
  ('nm-james-peter',  james_uid, 'Peter',  'Mwangi',  '+254700000004', 'FRIEND',  'AUXILIARY',   'ACTIVE', now() - interval '35 days', false),
  ('nm-james-david',  james_uid, 'David',  'Kimani',  '+254700000006', 'BROTHER', 'AUXILIARY',   'ACTIVE', now() - interval '30 days', false)
ON CONFLICT (id) DO NOTHING;

-- Circle 2: Grace Akinyi's circle
-- Members: Sarah Njeri, John Otieno, Agnes Chebet, Nancy (demo) — Nancy in 2 circles
INSERT INTO network_members (id, user_id, first_name, last_name, phone_number, relationship, type, status, joined_at, has_defaulted_loan) VALUES
  ('nm-grace-sarah',  grace_uid, 'Sarah',  'Njeri',   '+254700000007', 'FRIEND',  'ACCOUNTABLE', 'ACTIVE', now() - interval '25 days', false),
  ('nm-grace-john',   grace_uid, 'John',   'Otieno',  '+254700000008', 'COUSIN',  'ACCOUNTABLE', 'ACTIVE', now() - interval '25 days', false),
  ('nm-grace-agnes',  grace_uid, 'Agnes',  'Chebet',  '+254700000011', 'FRIEND',  'AUXILIARY',   'ACTIVE', now() - interval '20 days', false),
  ('nm-grace-nancy',  grace_uid, 'Nancy',  'Kamau',   '+254700000001', 'SISTER',  'ACCOUNTABLE', 'ACTIVE', now() - interval '28 days', false)
ON CONFLICT (id) DO NOTHING;

-- Circle 3: Faith Wambui's circle
-- Members: Michael Kiprop, Peter Mwangi (Peter in 2 circles), James Ochieng, Mary Wanjiku (Mary in 2 circles)
INSERT INTO network_members (id, user_id, first_name, last_name, phone_number, relationship, type, status, joined_at, has_defaulted_loan) VALUES
  ('nm-faith-michael', faith_uid, 'Michael', 'Kiprop',  '+254700000010', 'BROTHER',  'ACCOUNTABLE', 'ACTIVE', now() - interval '85 days', false),
  ('nm-faith-peter',   faith_uid, 'Peter',   'Mwangi',  '+254700000004', 'FRIEND',   'ACCOUNTABLE', 'ACTIVE', now() - interval '80 days', false),
  ('nm-faith-james',   faith_uid, 'James',   'Ochieng', '+254700000002', 'FRIEND',   'AUXILIARY',   'ACTIVE', now() - interval '75 days', false),
  ('nm-faith-mary',    faith_uid, 'Mary',    'Wanjiku', '+254700000003', 'COLLEAGUE','AUXILIARY',   'ACTIVE', now() - interval '70 days', false)
ON CONFLICT (id) DO NOTHING;

-- Also add David Kimani to Grace's circle (David in 2 circles)
INSERT INTO network_members (id, user_id, first_name, last_name, phone_number, relationship, type, status, joined_at, has_defaulted_loan) VALUES
  ('nm-grace-david', grace_uid, 'David', 'Kimani', '+254700000006', 'COLLEAGUE', 'AUXILIARY', 'ACTIVE', now() - interval '18 days', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Summary of circle membership:
-- Nancy (demo): James's circle + Grace's circle = 2 circles
-- James (002): anchor of circle 1, in Faith's circle = 2 circles
-- Mary (003): James's circle + Faith's circle = 2 circles
-- Peter (004): James's circle + Faith's circle = 2 circles
-- Grace (005): anchor of circle 2 = 1 circle
-- David (006): James's circle + Grace's circle = 2 circles
-- Sarah (007): Grace's circle = 1 circle
-- John (008): Grace's circle = 1 circle
-- Faith (009): anchor of circle 3 = 1 circle
-- Michael (010): Faith's circle = 1 circle
-- Agnes (011): Grace's circle = 1 circle
-- ============================================================

-- ============================================================
-- PART 7: Notifications for 3 anchors
-- ============================================================

-- Clear existing and add condition-specific notifications
DELETE FROM notifications WHERE user_id IN (james_uid, grace_uid, faith_uid);

-- James notifications
INSERT INTO notifications (user_id, type, title, body, metadata, deep_link, read_at, sent_at) VALUES
  (james_uid, 'CASHBACK_EARNED', 'KES 340 cashback earned', 'You earned cashback on your visit to Kenyatta National Hospital - Diabetic Clinic',
   jsonb_build_object('amount', 340, 'paymentId', j_pay1), '/patients/companion/cost-tracker', now() - interval '6 days', now() - interval '7 days'),
  (james_uid, 'AI_INSIGHT', 'Your HbA1c is 7.8% — room for improvement', 'Your latest HbA1c shows your blood sugar is above target. Consistent medication and regular walks after meals can help bring it down.',
   '{"insightType": "TEST_TREND", "testName": "HbA1c"}'::jsonb, '/patients/companion/care-history', null, now() - interval '6 days'),
  (james_uid, 'REFILL_REMINDER', 'Metformin and Glibenclamide refill in 8 days', 'Your diabetes medications are running low. Refill at an in-network pharmacy to earn 5% cashback.',
   '{"medicationName": "Metformin 500mg", "daysUntilDue": 8}'::jsonb, '/patients/companion/refill-schedule', null, now() - interval '1 day'),
  (james_uid, 'AI_INSIGHT', 'Consider switching to KNH for cheaper refills', 'KNH Pharmacy offers Losartan 50mg at KES 380 vs KES 520 at Nairobi West. Annual saving: KES 1,680.',
   '{"actionType": "COST_SAVING_SUGGESTION", "relatedMedication": "Losartan 50mg"}'::jsonb, '/patients/companion/medication-cards/losartan-50mg', null, now() - interval '2 days');

-- Grace notifications
INSERT INTO notifications (user_id, type, title, body, metadata, deep_link, read_at, sent_at) VALUES
  (grace_uid, 'CASHBACK_EARNED', 'KES 366.50 cashback earned', 'You earned cashback on your visit to Aga Khan University Hospital',
   jsonb_build_object('amount', 366.50, 'paymentId', g_pay1), '/patients/companion/cost-tracker', now() - interval '4 days', now() - interval '5 days'),
  (grace_uid, 'AI_INSIGHT', 'Your first HbA1c: 8.9% — let us work on this together', 'An HbA1c of 8.9% is common at diagnosis. With consistent Metformin and diet changes, many patients see significant improvement within 3 months.',
   '{"insightType": "TEST_TREND", "testName": "HbA1c"}'::jsonb, '/patients/companion/care-history', null, now() - interval '4 days'),
  (grace_uid, 'AI_INSIGHT', 'New course: Understanding your diabetes diagnosis', 'We have a 5-minute guide designed for people recently diagnosed with Type 2 Diabetes. It covers what is happening in your body and what you can do about it.',
   '{"insightType": "EDUCATION_RECOMMENDATION", "courseSlug": "understanding-type-2-diabetes-the-basics"}'::jsonb, '/patients/companion/education/understanding-type-2-diabetes-the-basics', null, now() - interval '3 days'),
  (grace_uid, 'REFILL_REMINDER', 'Metformin refill in 3 days', 'Your Metformin supply is running low. Remember to take it with food to reduce stomach upset.',
   '{"medicationName": "Metformin 500mg", "daysUntilDue": 3}'::jsonb, '/patients/companion/refill-schedule', null, now() - interval '1 day'),
  (grace_uid, 'AI_INSIGHT', 'Tip: bitter leaf tea and Metformin', 'You mentioned using bitter leaf tea. While some studies suggest it may help blood sugar, it can interact with Metformin. Discuss this with your doctor at your next visit.',
   '{"actionType": "DRUG_INTERACTION_WARNING", "severity": "LOW", "relatedMedication": "Metformin 500mg"}'::jsonb, '/patients/companion/medication-cards/metformin-500mg', null, now() - interval '2 days');

-- Faith notifications
INSERT INTO notifications (user_id, type, title, body, metadata, deep_link, read_at, sent_at) VALUES
  (faith_uid, 'CASHBACK_EARNED', 'KES 756.50 cashback earned', 'You earned cashback on your visit to Nairobi Hospital - Cardiac & Diabetes Centre',
   jsonb_build_object('amount', 756.50, 'paymentId', f_pay1), '/patients/companion/cost-tracker', now() - interval '2 days', now() - interval '3 days'),
  (faith_uid, 'AI_INSIGHT', 'Good news: your liver function is normal', 'Your ALT and AST levels are within normal range. This is important since Atorvastatin and Metformin are processed by the liver.',
   '{"insightType": "TEST_TREND", "testName": "Liver Function Test"}'::jsonb, '/patients/companion/care-history', now() - interval '1 day', now() - interval '3 days'),
  (faith_uid, 'AI_INSIGHT', 'Your cholesterol needs attention', 'Your LDL is 3.4 mmol/L (target: < 2.6). Your Atorvastatin dose may need adjustment — discuss with your cardiologist at your next visit.',
   '{"insightType": "TEST_TREND", "testName": "Lipid Panel"}'::jsonb, '/patients/companion/care-history', null, now() - interval '2 days'),
  (faith_uid, 'REFILL_REMINDER', 'Insulin Glargine refill in 5 days', 'Your insulin supply is running low. Aga Khan Pharmacy has it in stock. Do not skip doses — maintain your injection schedule.',
   '{"medicationName": "Insulin Glargine", "daysUntilDue": 5}'::jsonb, '/patients/companion/refill-schedule', null, now() - interval '1 day'),
  (faith_uid, 'AI_INSIGHT', 'Save KES 2,400/year on Atorvastatin', 'KNH Pharmacy offers Atorvastatin 40mg at KES 650 compared to KES 850 at Aga Khan. Consider switching pharmacies for your next refill.',
   '{"actionType": "COST_SAVING_SUGGESTION", "relatedMedication": "Atorvastatin 40mg"}'::jsonb, '/patients/companion/cost-tracker', null, now() - interval '2 days'),
  (faith_uid, 'AI_INSIGHT', 'Your Insulin Glargine medication card is ready', 'We have prepared a detailed guide for Insulin Glargine including injection technique, storage instructions, and what to do if you miss a dose.',
   '{"actionType": "MEDICATION_CARD_AVAILABLE", "relatedMedication": "Insulin Glargine"}'::jsonb, '/patients/companion/medication-cards/insulin-glargine', null, now() - interval '3 days');

END $$;
