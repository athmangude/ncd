-- seed.sql
-- Demo account seed data for NCD Care Companion presentations
-- Run after migrations: supabase db push < supabase/seed.sql
--
-- Prerequisites:
--   1. Auth user must be created first via Supabase Auth (phone: +254700000001)
--   2. Copy the resulting auth.users UUID and replace the placeholder below
--
-- IMPORTANT: All jsonb column values must match the TypeScript types in
-- src/types/care-companion.ts (CareCompanionProfile interface).
-- The save mutation in CareCompanionIntake.tsx maps:
--   conditions     → data.conditions.type            (text[], enum values like 'DIABETES')
--   treatment      → data.treatment                  (jsonb, full treatment object)
--   recurring_tests→ data.recurringTests              (jsonb, { selectedTests: string[] })
--   cost_estimates → data.costEstimates               (jsonb, { medications: [{name, refillFrequencyDays, estimatedCostPerRefill}], tests: [{name, frequencyMonths, estimatedCostPerTest}] })
--   challenges     → data.challenges                  (jsonb, { selected: string[], topChallenge: string | null })
--   coping         → data.coping                      (jsonb, { costCoping: string[] | null, informationSources: string[], hasEmergencyPlan: boolean | null, exerciseFrequency: string | null })
--   goals          → data.goals.selected              (text[], enum values like 'TRACK_COSTS')
--   user_role      → data.userRole.role.toLowerCase() (text, e.g. 'caregiver')
--   completed_at   → data.completedAt                 (timestamptz or null)

-- Demo user UUID (replace after creating auth user)
DO $$
DECLARE
  demo_uid uuid := '6b4d8e63-16c9-4aa6-ae9c-73820311007a';
  pay1_id uuid := gen_random_uuid();
  pay2_id uuid := gen_random_uuid();
  pay3_id uuid := gen_random_uuid();
BEGIN

-- ============================================================
-- 1. Profile
-- ============================================================
INSERT INTO profiles (id, phone, first_name, last_name, conditions, diagnosis_recency, conditions_other_description, treatment, recurring_tests, cost_estimates, challenges, coping, goals, user_role, completed_at)
VALUES (
  demo_uid,
  '+254700000001',
  'Nancy',
  'Kamau',
  ARRAY['DIABETES', 'HYPERTENSION'],
  'MORE_THAN_2_YEARS',
  NULL,
  '{
    "currentlyOnMedication": true,
    "medicationNames": ["Metformin 500mg", "Amlodipine 5mg", "Atorvastatin 20mg", "Lisinopril 10mg"],
    "takingMedicationRegularly": "MOSTLY",
    "reasonsForMissing": [],
    "usingHerbalAlternatives": false,
    "herbalDetails": null
  }'::jsonb,
  '{"selectedTests": ["HbA1c", "Blood Pressure Check", "Lipid Panel", "Kidney Function (Creatinine & eGFR)"]}'::jsonb,
  '{
    "medications": [
      {"name": "Metformin 500mg", "refillFrequencyDays": 30, "estimatedCostPerRefill": 450},
      {"name": "Amlodipine 5mg", "refillFrequencyDays": 30, "estimatedCostPerRefill": 350},
      {"name": "Atorvastatin 20mg", "refillFrequencyDays": 30, "estimatedCostPerRefill": 600},
      {"name": "Lisinopril 10mg", "refillFrequencyDays": 30, "estimatedCostPerRefill": 400}
    ],
    "tests": [
      {"name": "HbA1c", "frequencyMonths": 3, "estimatedCostPerTest": 1500},
      {"name": "Blood Pressure Check", "frequencyMonths": 1, "estimatedCostPerTest": 200},
      {"name": "Lipid Panel", "frequencyMonths": 6, "estimatedCostPerTest": 2500},
      {"name": "Kidney Function (Creatinine & eGFR)", "frequencyMonths": 6, "estimatedCostPerTest": 1800}
    ]
  }'::jsonb,
  '{"selected": ["COST", "DIET", "UNDERSTANDING_MEDICATION"], "topChallenge": "COST"}'::jsonb,
  '{"informationSources": ["DOCTOR", "FAMILY"], "costCoping": ["BORROW_FAMILY"], "hasEmergencyPlan": false, "exerciseFrequency": "FEW_TIMES_WEEK"}'::jsonb,
  ARRAY['TRACK_COSTS', 'MEDICATION_REMINDERS'],
  'caregiver',
  NULL
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
DELETE FROM notifications WHERE user_id = demo_uid;
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
   now() - interval '12 days'),

  (demo_uid, 'AI_INSIGHT',
   'Potential interaction: Metformin and Atorvastatin',
   'Taking Metformin 500mg and Atorvastatin 20mg together is generally safe, but monitoring liver function is recommended. Both medications are processed by the liver, and regular blood tests can help ensure everything stays on track.',
   '{"actionType": "DRUG_INTERACTION_WARNING", "severity": "MEDIUM", "relatedMedication": "Metformin 500mg + Atorvastatin 20mg"}'::jsonb,
   '/patients/companion/medication-cards/metformin-500mg',
   null,
   now() - interval '2 days'),

  (demo_uid, 'AI_INSIGHT',
   'Your Lisinopril medication card is ready',
   'We have prepared a detailed medication card for Lisinopril 10mg. It includes how it works, common side effects, and tips for getting the most from your treatment.',
   '{"actionType": "MEDICATION_CARD_AVAILABLE", "relatedMedication": "Lisinopril 10mg"}'::jsonb,
   '/patients/companion/medication-cards/lisinopril-10mg',
   null,
   now() - interval '3 days');

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
    "locale": "en",
    "description": "Metformin helps lower blood sugar by reducing the amount of glucose your liver produces and improving your body''s response to insulin. It is the most commonly prescribed medication for Type 2 Diabetes worldwide.",
    "howItWorks": "Metformin works in three ways: it reduces how much glucose your liver releases into your blood, it helps your muscles use insulin more effectively, and it slows glucose absorption from food in your intestines.",
    "commonSideEffects": [
      {"effect": "Nausea", "frequency": "Common in the first 1-2 weeks", "advice": "Take with food to reduce stomach upset. Symptoms usually improve as your body adjusts."},
      {"effect": "Diarrhoea", "frequency": "Common initially", "advice": "Stay hydrated and eat smaller meals. If it persists beyond 2 weeks, talk to your doctor."},
      {"effect": "Stomach upset", "frequency": "Occasional", "advice": "Taking your dose with or after meals helps. Avoid alcohol, which can worsen discomfort."}
    ],
    "seriousSideEffects": [
      {"effect": "Lactic acidosis (very rare)", "action": "Seek emergency care if you experience unusual muscle pain, difficulty breathing, or unusual tiredness."}
    ],
    "avoidanceWarnings": [
      {"substance": "Excessive alcohol", "reason": "Increases the risk of lactic acidosis and can cause dangerously low blood sugar."},
      {"substance": "Contrast dye (CT scans)", "reason": "Tell your doctor you take Metformin before any imaging with contrast dye."}
    ],
    "whenToSeekHelp": "Contact your doctor if you experience severe nausea or vomiting, unusual muscle pain, difficulty breathing, or if your blood sugar stays very high despite taking your medication.",
    "storageInstructions": "Store at room temperature away from moisture and heat. Keep in original container."
  }'::jsonb),
  (demo_uid, 'amlodipine-5mg', 'amlodipine-5mg', '{
    "locale": "en",
    "description": "Amlodipine relaxes blood vessels to lower blood pressure and reduce strain on your heart. It is a calcium channel blocker commonly used alongside diabetes medications.",
    "howItWorks": "Amlodipine blocks calcium from entering the muscle cells of your heart and blood vessels. This causes the blood vessels to relax and widen, allowing blood to flow more easily and lowering your blood pressure.",
    "commonSideEffects": [
      {"effect": "Swollen ankles", "frequency": "Common", "advice": "Elevate your feet when sitting. This is usually harmless but tell your doctor if it bothers you."},
      {"effect": "Dizziness", "frequency": "Occasional, especially when starting", "advice": "Stand up slowly from sitting or lying down. Avoid driving until you know how it affects you."},
      {"effect": "Flushing", "frequency": "Occasional", "advice": "Usually mild and temporary. Stay cool and avoid hot environments when possible."}
    ],
    "seriousSideEffects": [
      {"effect": "Severe dizziness or fainting", "action": "Sit or lie down immediately and contact your doctor."},
      {"effect": "Rapid or irregular heartbeat", "action": "Seek medical attention promptly."}
    ],
    "avoidanceWarnings": [
      {"substance": "Grapefruit juice", "reason": "Can increase Amlodipine levels in your blood, potentially causing side effects."}
    ],
    "whenToSeekHelp": "Contact your doctor if you experience severe dizziness, fainting, rapid heartbeat, or if your ankles swell significantly.",
    "storageInstructions": "Store at room temperature away from light and moisture."
  }'::jsonb),
  (demo_uid, 'atorvastatin-20mg', 'atorvastatin-20mg', '{
    "locale": "en",
    "description": "Atorvastatin lowers cholesterol and reduces the risk of heart disease, which is especially important when you have diabetes. People with diabetes are at higher risk of cardiovascular problems.",
    "howItWorks": "Atorvastatin blocks an enzyme in your liver that produces cholesterol (HMG-CoA reductase). This reduces the amount of ''bad'' cholesterol (LDL) in your blood and helps prevent plaque buildup in your arteries.",
    "commonSideEffects": [
      {"effect": "Muscle pain or weakness", "frequency": "Common", "advice": "Mild muscle aches are common. Report unexplained or severe muscle pain to your doctor immediately."},
      {"effect": "Headache", "frequency": "Occasional", "advice": "Usually resolves on its own. Stay hydrated and rest."},
      {"effect": "Nausea", "frequency": "Occasional", "advice": "Taking your dose with food may help. This usually improves over time."}
    ],
    "seriousSideEffects": [
      {"effect": "Severe muscle pain (rhabdomyolysis)", "action": "Stop the medication and seek emergency care immediately — this is rare but serious."},
      {"effect": "Yellowing of skin or eyes", "action": "Contact your doctor immediately as this may indicate liver problems."}
    ],
    "avoidanceWarnings": [
      {"substance": "Grapefruit juice", "reason": "Can increase Atorvastatin levels and risk of side effects."},
      {"substance": "Excessive alcohol", "reason": "Can increase the risk of liver problems when combined with Atorvastatin."}
    ],
    "whenToSeekHelp": "Contact your doctor if you experience unexplained muscle pain, dark urine, yellowing of skin or eyes, or unusual tiredness.",
    "storageInstructions": "Store at room temperature. Take at bedtime for best effect."
  }'::jsonb),
  (demo_uid, 'lisinopril-10mg', 'lisinopril-10mg', '{
    "locale": "en",
    "description": "Lisinopril lowers blood pressure and protects your kidneys from diabetes-related damage. ACE inhibitors like Lisinopril are often recommended for people with diabetes to preserve kidney function.",
    "howItWorks": "Lisinopril blocks an enzyme called ACE (angiotensin-converting enzyme) that narrows blood vessels. By blocking this enzyme, your blood vessels relax and widen, lowering blood pressure and reducing the workload on your heart and kidneys.",
    "commonSideEffects": [
      {"effect": "Dry cough", "frequency": "Common (affects up to 1 in 10 people)", "advice": "A persistent dry cough is the most common side effect. If it becomes bothersome, talk to your doctor about alternatives."},
      {"effect": "Dizziness", "frequency": "Common when starting or increasing dose", "advice": "Stand up slowly. Take your first dose at bedtime to reduce daytime dizziness."},
      {"effect": "Elevated potassium", "frequency": "Occasional", "advice": "Your doctor will monitor your potassium levels. Avoid excessive potassium-rich foods like bananas and oranges."}
    ],
    "seriousSideEffects": [
      {"effect": "Swelling of face, lips, or tongue", "action": "Stop the medication and seek emergency care immediately — this could be angioedema."},
      {"effect": "Signs of kidney problems (reduced urination)", "action": "Contact your doctor promptly for blood tests."}
    ],
    "avoidanceWarnings": [
      {"substance": "Potassium supplements", "reason": "Lisinopril can raise potassium levels — do not take supplements without your doctor''s advice."},
      {"substance": "NSAIDs (e.g. ibuprofen)", "reason": "Can reduce the effectiveness of Lisinopril and increase kidney risk."}
    ],
    "whenToSeekHelp": "Seek emergency care if you experience swelling of the face, lips, or tongue. Contact your doctor for persistent dry cough, reduced urination, or unusual tiredness.",
    "storageInstructions": "Store at room temperature away from moisture. Take in the morning at the same time each day."
  }'::jsonb);

END $$;
