-- seed.sql
-- Demo account seed data for NCD Care Companion presentations
-- Run after migrations: supabase db push < supabase/seed.sql
--
-- Prerequisites:
--   1. Auth user must be created first via Supabase Auth (phone: +254700000001)
--   2. Copy the resulting auth.users UUID and replace the placeholder below

-- Demo user UUID (replace after creating auth user)
DO $$
DECLARE
  demo_uid uuid := '00000000-0000-0000-0000-000000000001';
  pay1_id uuid := gen_random_uuid();
  pay2_id uuid := gen_random_uuid();
  pay3_id uuid := gen_random_uuid();
BEGIN

-- ============================================================
-- 1. Profile
-- ============================================================
INSERT INTO profiles (id, phone, first_name, conditions, treatment, recurring_tests, cost_estimates, challenges, coping, goals, user_role, completed_at)
VALUES (
  demo_uid,
  '+254700000001',
  'Nancy',
  ARRAY['Type 2 Diabetes', 'Hypertension'],
  '{
    "medicationNames": ["Metformin 500mg", "Amlodipine 5mg", "Atorvastatin 20mg", "Lisinopril 10mg"],
    "dosages": {
      "Metformin 500mg": "Twice daily with meals",
      "Amlodipine 5mg": "Once daily in the morning",
      "Atorvastatin 20mg": "Once daily at bedtime",
      "Lisinopril 10mg": "Once daily in the morning"
    }
  }'::jsonb,
  '{
    "selectedTests": ["HbA1c", "Blood Pressure Check", "Lipid Panel", "Kidney Function (Creatinine & eGFR)"],
    "frequencies": {
      "HbA1c": 3,
      "Blood Pressure Check": 1,
      "Lipid Panel": 6,
      "Kidney Function (Creatinine & eGFR)": 6
    }
  }'::jsonb,
  '{
    "medications": [
      {"name": "Metformin 500mg", "monthlyCost": 450, "currency": "KES"},
      {"name": "Amlodipine 5mg", "monthlyCost": 350, "currency": "KES"},
      {"name": "Atorvastatin 20mg", "monthlyCost": 600, "currency": "KES"},
      {"name": "Lisinopril 10mg", "monthlyCost": 400, "currency": "KES"}
    ],
    "tests": [
      {"name": "HbA1c", "cost": 1500, "currency": "KES"},
      {"name": "Blood Pressure Check", "cost": 200, "currency": "KES"},
      {"name": "Lipid Panel", "cost": 2500, "currency": "KES"},
      {"name": "Kidney Function (Creatinine & eGFR)", "cost": 1800, "currency": "KES"}
    ],
    "monthlyTotal": 1800,
    "annualTotal": 27600,
    "currency": "KES"
  }'::jsonb,
  '{"items": ["Affording medication every month", "Understanding what to eat", "Remembering to take medication on time"]}'::jsonb,
  '{"items": ["Family support from my daughter", "Walking every morning", "Using a pill organiser"]}'::jsonb,
  ARRAY['Better blood sugar control', 'Reduce medication costs'],
  'caregiver',
  now() - interval '3 months'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Refill Schedules
-- ============================================================
INSERT INTO refill_schedules (user_id, medication_name, frequency_days, next_date, status) VALUES
  (demo_uid, 'Metformin 500mg',    30, current_date + interval '12 days', 'UPCOMING'),
  (demo_uid, 'Amlodipine 5mg',     30, current_date + interval '5 days',  'UPCOMING'),
  (demo_uid, 'Atorvastatin 20mg',  30, current_date + interval '18 days', 'UPCOMING'),
  (demo_uid, 'Lisinopril 10mg',    30, current_date + interval '5 days',  'UPCOMING');

-- ============================================================
-- 3. Test Schedules
-- ============================================================
INSERT INTO test_schedules (user_id, test_name, frequency_months, next_date, status) VALUES
  (demo_uid, 'HbA1c',                               3, current_date + interval '28 days', 'UPCOMING'),
  (demo_uid, 'Blood Pressure Check',                 1, current_date + interval '8 days',  'UPCOMING'),
  (demo_uid, 'Lipid Panel',                          6, current_date + interval '72 days', 'UPCOMING'),
  (demo_uid, 'Kidney Function (Creatinine & eGFR)',  6, current_date + interval '85 days', 'UPCOMING');

-- ============================================================
-- 4. Wallet
-- ============================================================
INSERT INTO wallets (user_id, cashback_balance)
VALUES (demo_uid, 2125)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 5. Payments
-- ============================================================
INSERT INTO payments (id, user_id, facility_name, facility_type, amount, currency, line_items, funding_sources, cashback_amount, status, created_at)
VALUES
  (
    pay1_id,
    demo_uid,
    'Aga Khan Pharmacy - Upperhill',
    'PHARMACY',
    1800,
    'KES',
    '[
      {"name": "Metformin 500mg x 60 tablets", "category": "MEDICATION", "quantity": 1, "unitPrice": 450, "total": 450},
      {"name": "Amlodipine 5mg x 30 tablets",  "category": "MEDICATION", "quantity": 1, "unitPrice": 350, "total": 350},
      {"name": "Atorvastatin 20mg x 30 tablets","category": "MEDICATION", "quantity": 1, "unitPrice": 600, "total": 600},
      {"name": "Lisinopril 10mg x 30 tablets",  "category": "MEDICATION", "quantity": 1, "unitPrice": 400, "total": 400}
    ]'::jsonb,
    '[{"source": "JIREH_WALLET", "amount": 1800}]'::jsonb,
    90,
    'COMPLETED',
    now() - interval '5 days'
  ),
  (
    pay2_id,
    demo_uid,
    'Nairobi Hospital - Outpatient',
    'HOSPITAL',
    4500,
    'KES',
    '[
      {"name": "Consultation - Diabetologist",  "category": "CONSULTATION", "quantity": 1, "unitPrice": 2500, "total": 2500},
      {"name": "HbA1c Test",                    "category": "LAB_TEST",     "quantity": 1, "unitPrice": 1500, "total": 1500},
      {"name": "Blood Pressure Check",          "category": "LAB_TEST",     "quantity": 1, "unitPrice": 200,  "total": 200},
      {"name": "Urinalysis",                    "category": "LAB_TEST",     "quantity": 1, "unitPrice": 300,  "total": 300}
    ]'::jsonb,
    '[{"source": "JIREH_WALLET", "amount": 3000}, {"source": "CARE_SAVER", "amount": 1500}]'::jsonb,
    225,
    'COMPLETED',
    now() - interval '18 days'
  ),
  (
    pay3_id,
    demo_uid,
    'Kenyatta National Hospital - Pharmacy',
    'PHARMACY',
    1250,
    'KES',
    '[
      {"name": "Metformin 500mg x 60 tablets",  "category": "MEDICATION", "quantity": 1, "unitPrice": 400, "total": 400},
      {"name": "Amlodipine 5mg x 30 tablets",   "category": "MEDICATION", "quantity": 1, "unitPrice": 300, "total": 300},
      {"name": "Glucometer test strips x 50",   "category": "SUPPLIES",   "quantity": 1, "unitPrice": 550, "total": 550}
    ]'::jsonb,
    '[{"source": "JIREH_WALLET", "amount": 1250}]'::jsonb,
    62.50,
    'COMPLETED',
    now() - interval '25 days'
  );

-- ============================================================
-- 6. Events
-- ============================================================
INSERT INTO events (user_id, type, data, created_at) VALUES
  -- Payment events
  (demo_uid, 'PAYMENT', jsonb_build_object(
    'paymentId', pay1_id, 'facilityName', 'Aga Khan Pharmacy - Upperhill',
    'amount', 1800, 'currency', 'KES', 'facilityType', 'PHARMACY'
  ), now() - interval '5 days'),

  (demo_uid, 'PAYMENT', jsonb_build_object(
    'paymentId', pay2_id, 'facilityName', 'Nairobi Hospital - Outpatient',
    'amount', 4500, 'currency', 'KES', 'facilityType', 'HOSPITAL'
  ), now() - interval '18 days'),

  (demo_uid, 'PAYMENT', jsonb_build_object(
    'paymentId', pay3_id, 'facilityName', 'Kenyatta National Hospital - Pharmacy',
    'amount', 1250, 'currency', 'KES', 'facilityType', 'PHARMACY'
  ), now() - interval '25 days'),

  -- Refill purchase
  (demo_uid, 'REFILL_PURCHASE', '{
    "medicationName": "Metformin 500mg",
    "quantity": 60,
    "cost": 450,
    "currency": "KES",
    "facilityName": "Aga Khan Pharmacy - Upperhill"
  }'::jsonb, now() - interval '5 days'),

  -- Cashback earned
  (demo_uid, 'CASHBACK_EARNED', jsonb_build_object(
    'amount', 90, 'paymentId', pay1_id, 'currency', 'KES'
  ), now() - interval '5 days'),

  (demo_uid, 'CASHBACK_EARNED', jsonb_build_object(
    'amount', 225, 'paymentId', pay2_id, 'currency', 'KES'
  ), now() - interval '18 days'),

  -- Test result
  (demo_uid, 'TEST_RESULT', '{
    "testName": "HbA1c",
    "metrics": [
      {"name": "HbA1c", "value": 7.2, "unit": "%", "referenceRange": "4.0 - 5.6", "status": "HIGH"}
    ],
    "labName": "Nairobi Hospital Laboratory",
    "date": "2026-08-15"
  }'::jsonb, now() - interval '18 days'),

  -- AI insight
  (demo_uid, 'AI_INSIGHT', '{
    "insightType": "MEDICATION_REMINDER",
    "title": "Your Metformin refill is coming up",
    "body": "Based on your 30-day supply purchased on Aug 28, your Metformin will run out around Sep 27. Consider refilling early to avoid gaps in your treatment.",
    "confidence": 0.92
  }'::jsonb, now() - interval '2 days');

-- ============================================================
-- 7. Notifications
-- ============================================================
INSERT INTO notifications (user_id, type, title, body, metadata, deep_link, read_at, sent_at) VALUES
  (demo_uid, 'CASHBACK_EARNED',
   'KES 90 cashback earned',
   'You earned cashback on your payment at Aga Khan Pharmacy - Upperhill',
   jsonb_build_object('amount', 90, 'paymentId', pay1_id),
   '/patients/companion/cost-tracker',
   now() - interval '4 days',
   now() - interval '5 days'),

  (demo_uid, 'CASHBACK_EARNED',
   'KES 225 cashback earned',
   'You earned cashback on your payment at Nairobi Hospital - Outpatient',
   jsonb_build_object('amount', 225, 'paymentId', pay2_id),
   '/patients/companion/cost-tracker',
   now() - interval '17 days',
   now() - interval '18 days'),

  (demo_uid, 'AI_INSIGHT',
   'Your HbA1c is trending in the right direction',
   'Your latest HbA1c of 7.2% shows improvement. Keep up with your Metformin schedule and post-meal walks — they are making a real difference.',
   '{"insightType": "TEST_TREND", "testName": "HbA1c"}'::jsonb,
   '/patients/companion/care-history',
   null,
   now() - interval '17 days'),

  (demo_uid, 'REFILL_REMINDER',
   'Amlodipine 5mg refill in 5 days',
   'Your Amlodipine supply is running low. Refill at Aga Khan Pharmacy or any in-network pharmacy to earn 5% cashback.',
   '{"medicationName": "Amlodipine 5mg", "daysUntilDue": 5}'::jsonb,
   '/patients/companion/refill-schedule',
   null,
   now() - interval '1 day'),

  (demo_uid, 'AI_INSIGHT',
   'New course: Ugali portions that work for blood sugar control',
   'Based on your conditions, we recommend this 5-minute read about managing ugali portions. It covers the fist-sized portion rule and the plate method.',
   '{"insightType": "EDUCATION_RECOMMENDATION", "courseSlug": "ugali-portions-that-work-for-blood-sugar-control"}'::jsonb,
   '/patients/companion/education/ugali-portions-that-work-for-blood-sugar-control',
   now() - interval '10 days',
   now() - interval '12 days');

-- ============================================================
-- 8. Chat Messages
-- ============================================================
INSERT INTO chat_messages (user_id, role, content, created_at) VALUES
  (demo_uid, 'user',      'What foods should I avoid with Type 2 Diabetes?', now() - interval '10 days'),
  (demo_uid, 'assistant', 'Great question, Nancy! With Type 2 Diabetes, the main foods to be mindful of are those that cause rapid blood sugar spikes. This includes sugary drinks like soda and sweetened juices, white bread, large portions of ugali or rice, and deep-fried snacks like mandazi. Instead, focus on vegetables (sukuma wiki is excellent), proteins like fish and beans, and whole grains. The key is not eliminating foods entirely but managing portions — a fist-sized serving of ugali with half a plate of vegetables is a great starting point.', now() - interval '10 days'),
  (demo_uid, 'user',      'How much does an HbA1c test cost in Nairobi?', now() - interval '7 days'),
  (demo_uid, 'assistant', 'An HbA1c test in Nairobi typically costs between KES 800 and KES 2,000 depending on where you go. Private labs like Lancet Kenya and PathCare charge around KES 1,200 to KES 1,800. Public hospitals like Kenyatta National Hospital offer it at lower rates, often KES 500 to KES 800. If you are registered with SHA (formerly NHIF), the test may be covered at accredited facilities. Based on your records, your next HbA1c is scheduled in about 4 weeks — would you like me to help estimate the total cost of that visit?', now() - interval '7 days'),
  (demo_uid, 'user',      'Yes, estimate the cost of my next hospital visit', now() - interval '7 days');

-- ============================================================
-- 9. Education Progress
-- ============================================================

-- Completed: "Ugali portions that work for blood sugar control" (8 sections)
INSERT INTO education_progress (user_id, content_id, current_section, completed, completed_at)
SELECT demo_uid, id, 8, true, now() - interval '10 days'
FROM education_content WHERE slug = 'ugali-portions-that-work-for-blood-sugar-control';

-- Completed: "Walking after meals lowers blood sugar" (9 sections)
INSERT INTO education_progress (user_id, content_id, current_section, completed, completed_at)
SELECT demo_uid, id, 9, true, now() - interval '6 days'
FROM education_content WHERE slug = 'walking-after-meals-lowers-blood-sugar';

-- Completed: "When and how to check your blood sugar at home" (6 sections)
INSERT INTO education_progress (user_id, content_id, current_section, completed, completed_at)
SELECT demo_uid, id, 6, true, now() - interval '3 days'
FROM education_content WHERE slug = 'when-and-how-to-check-your-blood-sugar-at-home';

-- In progress: "Why your morning chai matters for blood sugar" (section 4 of 9)
INSERT INTO education_progress (user_id, content_id, current_section, completed)
SELECT demo_uid, id, 4, false
FROM education_content WHERE slug = 'why-your-morning-chai-matters-for-blood-sugar';

-- In progress: "The guilt trap: when you eat something wrong" (section 2 of 5)
INSERT INTO education_progress (user_id, content_id, current_section, completed)
SELECT demo_uid, id, 2, false
FROM education_content WHERE slug = 'the-guilt-trap-when-you-eat-something-wrong';

-- ============================================================
-- 10. Medication Cards
-- ============================================================
INSERT INTO medication_cards (user_id, medication_id, slug, content) VALUES
  (demo_uid, 'metformin-500mg', 'metformin-500mg', '{
    "genericName": "Metformin",
    "brandNames": ["Glucophage", "Daonil"],
    "strength": "500mg",
    "category": "BIGUANIDE",
    "description": "Metformin helps lower blood sugar by reducing the amount of glucose your liver produces and improving your body''s response to insulin.",
    "sideEffects": ["Nausea", "Diarrhoea", "Stomach upset"],
    "tips": ["Take with meals to reduce stomach upset", "Do not skip doses even if you feel well"]
  }'::jsonb),
  (demo_uid, 'amlodipine-5mg', 'amlodipine-5mg', '{
    "genericName": "Amlodipine",
    "brandNames": ["Norvasc", "Amlopress"],
    "strength": "5mg",
    "category": "CALCIUM_CHANNEL_BLOCKER",
    "description": "Amlodipine relaxes blood vessels to lower blood pressure and reduce strain on your heart.",
    "sideEffects": ["Swollen ankles", "Dizziness", "Flushing"],
    "tips": ["Take at the same time each day", "Stand up slowly to avoid dizziness"]
  }'::jsonb),
  (demo_uid, 'atorvastatin-20mg', 'atorvastatin-20mg', '{
    "genericName": "Atorvastatin",
    "brandNames": ["Lipitor", "Atorva"],
    "strength": "20mg",
    "category": "STATIN",
    "description": "Atorvastatin lowers cholesterol and reduces the risk of heart disease, which is especially important when you have diabetes.",
    "sideEffects": ["Muscle pain", "Headache", "Nausea"],
    "tips": ["Take at bedtime for best effect", "Report unexplained muscle pain to your doctor"]
  }'::jsonb),
  (demo_uid, 'lisinopril-10mg', 'lisinopril-10mg', '{
    "genericName": "Lisinopril",
    "brandNames": ["Zestril", "Lisipril"],
    "strength": "10mg",
    "category": "ACE_INHIBITOR",
    "description": "Lisinopril lowers blood pressure and protects your kidneys from diabetes-related damage.",
    "sideEffects": ["Dry cough", "Dizziness", "Elevated potassium"],
    "tips": ["Take in the morning", "Report persistent dry cough to your doctor"]
  }'::jsonb);

END $$;
