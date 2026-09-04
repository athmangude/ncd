#!/usr/bin/env python3
"""Create 10 test users via the create-account edge function, then seed all data via SQL."""

import json
import subprocess
import sys
import urllib.request

SUPABASE_URL = "https://qippjxnvfuedcaourdav.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcHBqeG52ZnVlZGNhb3VyZGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzYzMzQsImV4cCI6MjEwMzk1MjMzNH0.SP4DJGjcWNwRoUColMzkCMcfEeoP5J4M5ttZzGCRINA"

USERS = [
    {"suffix": "2",  "first": "James",   "last": "Ochieng", "id_number": "28456123", "conditions": ["DIABETES", "HYPERTENSION"]},
    {"suffix": "3",  "first": "Mary",    "last": "Wanjiku", "id_number": "31290456", "conditions": ["DIABETES", "HYPERTENSION"]},
    {"suffix": "4",  "first": "Peter",   "last": "Mwangi",  "id_number": "24817390", "conditions": ["DIABETES", "HYPERTENSION"]},
    {"suffix": "5",  "first": "Grace",   "last": "Akinyi",  "id_number": "33461278", "conditions": ["DIABETES"]},
    {"suffix": "6",  "first": "David",   "last": "Kimani",  "id_number": "27953814", "conditions": ["DIABETES"]},
    {"suffix": "7",  "first": "Sarah",   "last": "Njeri",   "id_number": "30182647", "conditions": ["HYPERTENSION"]},
    {"suffix": "8",  "first": "John",    "last": "Otieno",  "id_number": "26794531", "conditions": ["HYPERTENSION"]},
    {"suffix": "9",  "first": "Faith",   "last": "Wambui",  "id_number": "35128963", "conditions": ["DIABETES", "HYPERTENSION", "HIGH_CHOLESTEROL"]},
    {"suffix": "10", "first": "Michael", "last": "Kiprop",  "id_number": "29673415", "conditions": ["DIABETES", "HYPERTENSION", "HIGH_CHOLESTEROL"]},
    {"suffix": "11", "first": "Agnes",   "last": "Chebet",  "id_number": "32845109", "conditions": ["ASTHMA", "HYPERTENSION"]},
]

MEDICATION_MAP = {
    "DIABETES": [
        {"name": "Metformin 500mg", "slug": "metformin-500mg", "freq": 30, "cost": 450},
        {"name": "Glibenclamide 5mg", "slug": "glibenclamide-5mg", "freq": 30, "cost": 300},
    ],
    "HYPERTENSION": [
        {"name": "Amlodipine 5mg", "slug": "amlodipine-5mg", "freq": 30, "cost": 350},
        {"name": "Lisinopril 10mg", "slug": "lisinopril-10mg", "freq": 30, "cost": 400},
    ],
    "HIGH_CHOLESTEROL": [
        {"name": "Atorvastatin 20mg", "slug": "atorvastatin-20mg", "freq": 30, "cost": 600},
    ],
    "ASTHMA": [
        {"name": "Salbutamol inhaler", "slug": "salbutamol-inhaler", "freq": 60, "cost": 800},
        {"name": "Beclometasone inhaler", "slug": "beclometasone-inhaler", "freq": 30, "cost": 1200},
    ],
}

TEST_MAP = {
    "DIABETES": [
        {"name": "HbA1c", "freq_months": 3, "cost": 1500},
        {"name": "Fasting Blood Sugar", "freq_months": 1, "cost": 300},
    ],
    "HYPERTENSION": [
        {"name": "Blood Pressure Check", "freq_months": 1, "cost": 200},
        {"name": "Kidney Function (Creatinine & eGFR)", "freq_months": 6, "cost": 1800},
    ],
    "HIGH_CHOLESTEROL": [
        {"name": "Lipid Panel", "freq_months": 6, "cost": 2500},
    ],
    "ASTHMA": [
        {"name": "Peak Flow Test", "freq_months": 3, "cost": 500},
    ],
}

MED_CARD_CONTENT = {
    "metformin-500mg": {
        "locale": "en", "description": "Metformin helps lower blood sugar.",
        "howItWorks": "Reduces glucose production in the liver.",
        "commonSideEffects": [{"effect": "Nausea", "frequency": "Common", "advice": "Take with food."}],
        "seriousSideEffects": [{"effect": "Lactic acidosis", "action": "Seek emergency care."}],
        "avoidanceWarnings": [{"substance": "Alcohol", "reason": "Increases lactic acidosis risk."}],
        "whenToSeekHelp": "Severe nausea or muscle pain.", "storageInstructions": "Room temperature."
    },
    "glibenclamide-5mg": {
        "locale": "en", "description": "Glibenclamide stimulates insulin release.",
        "howItWorks": "Stimulates the pancreas to produce more insulin.",
        "commonSideEffects": [{"effect": "Low blood sugar", "frequency": "Common", "advice": "Carry glucose tablets."}],
        "seriousSideEffects": [{"effect": "Severe hypoglycemia", "action": "Seek emergency care."}],
        "avoidanceWarnings": [{"substance": "Alcohol", "reason": "May worsen low blood sugar."}],
        "whenToSeekHelp": "Confusion, sweating, trembling.", "storageInstructions": "Room temperature."
    },
    "amlodipine-5mg": {
        "locale": "en", "description": "Amlodipine relaxes blood vessels to lower blood pressure.",
        "howItWorks": "Blocks calcium from entering muscle cells of blood vessels.",
        "commonSideEffects": [{"effect": "Swollen ankles", "frequency": "Common", "advice": "Elevate feet."}],
        "seriousSideEffects": [{"effect": "Severe dizziness", "action": "Sit down and contact doctor."}],
        "avoidanceWarnings": [{"substance": "Grapefruit", "reason": "Increases drug levels."}],
        "whenToSeekHelp": "Severe dizziness or fainting.", "storageInstructions": "Room temperature."
    },
    "lisinopril-10mg": {
        "locale": "en", "description": "Lisinopril lowers blood pressure and protects kidneys.",
        "howItWorks": "Blocks ACE enzyme that narrows blood vessels.",
        "commonSideEffects": [{"effect": "Dry cough", "frequency": "Common", "advice": "Talk to doctor if bothersome."}],
        "seriousSideEffects": [{"effect": "Swelling of face/lips", "action": "Seek emergency care."}],
        "avoidanceWarnings": [{"substance": "Potassium supplements", "reason": "May raise potassium too high."}],
        "whenToSeekHelp": "Swelling of face, lips, or tongue.", "storageInstructions": "Room temperature."
    },
    "atorvastatin-20mg": {
        "locale": "en", "description": "Atorvastatin lowers cholesterol.",
        "howItWorks": "Blocks enzyme that produces cholesterol in the liver.",
        "commonSideEffects": [{"effect": "Muscle pain", "frequency": "Common", "advice": "Report severe pain to doctor."}],
        "seriousSideEffects": [{"effect": "Rhabdomyolysis", "action": "Seek emergency care."}],
        "avoidanceWarnings": [{"substance": "Grapefruit", "reason": "Increases drug levels."}],
        "whenToSeekHelp": "Unexplained muscle pain or dark urine.", "storageInstructions": "Room temperature."
    },
    "salbutamol-inhaler": {
        "locale": "en", "description": "Salbutamol opens airways during asthma attacks.",
        "howItWorks": "Relaxes muscles around the airways.",
        "commonSideEffects": [{"effect": "Tremor", "frequency": "Common", "advice": "Usually mild and temporary."}],
        "seriousSideEffects": [{"effect": "Fast heartbeat", "action": "Contact doctor if persistent."}],
        "avoidanceWarnings": [{"substance": "Other bronchodilators", "reason": "May increase side effects."}],
        "whenToSeekHelp": "Needing reliever more than 3 times per week.", "storageInstructions": "Room temperature, away from heat."
    },
    "beclometasone-inhaler": {
        "locale": "en", "description": "Beclometasone prevents asthma symptoms long-term.",
        "howItWorks": "Reduces inflammation in the airways.",
        "commonSideEffects": [{"effect": "Oral thrush", "frequency": "Common", "advice": "Rinse mouth after use."}],
        "seriousSideEffects": [{"effect": "Adrenal suppression", "action": "Do not stop suddenly."}],
        "avoidanceWarnings": [{"substance": "None specific", "reason": "N/A"}],
        "whenToSeekHelp": "Worsening breathing or white patches in mouth.", "storageInstructions": "Room temperature."
    },
}

FACILITIES = [
    ("Aga Khan Pharmacy - Upperhill", "PHARMACY"),
    ("Nairobi Hospital - Outpatient", "HOSPITAL"),
    ("Kenyatta National Hospital - Pharmacy", "PHARMACY"),
    ("Mater Hospital Pharmacy", "PHARMACY"),
    ("MP Shah Hospital Pharmacy", "PHARMACY"),
    ("Gertrude's Children Hospital", "HOSPITAL"),
    ("Karen Hospital", "HOSPITAL"),
    ("Avenue Hospital", "HOSPITAL"),
    ("Coptic Hospital", "HOSPITAL"),
    ("Mbagathi Hospital", "HOSPITAL"),
]


def create_user(phone: str) -> str | None:
    """Create user via edge function, return UUID or None."""
    url = f"{SUPABASE_URL}/functions/v1/create-account"
    body = json.dumps({"phone": phone, "password": "123456"}).encode()
    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={
            "Authorization": f"Bearer {ANON_KEY}",
            "apikey": ANON_KEY,
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            return data.get("user", {}).get("id")
    except urllib.error.HTTPError as e:
        err_body = json.loads(e.read())
        err_msg = err_body.get("error", "")
        if "already" in err_msg.lower():
            print(f"  Already exists, looking up UUID...")
            return lookup_user(phone)
        print(f"  ERROR: {err_msg}")
        return None


def lookup_user(phone: str) -> str | None:
    """Look up existing user UUID by phone (Supabase stores without + prefix)."""
    phone_no_plus = phone.lstrip("+")
    result = subprocess.run(
        ["npx", "supabase", "db", "query", "--linked",
         f"SELECT id FROM auth.users WHERE phone = '{phone_no_plus}'", "-o", "json"],
        capture_output=True, text=True, cwd="/Users/athmangude/Workspace/Jireh/ncd-prototype"
    )
    try:
        parsed = json.loads(result.stdout)
        rows = parsed.get("rows", parsed) if isinstance(parsed, dict) else parsed
        return rows[0]["id"] if rows else None
    except (json.JSONDecodeError, IndexError, KeyError):
        return None


def esc(s: str) -> str:
    """Escape single quotes for SQL."""
    return s.replace("'", "''")


def json_sql(obj) -> str:
    """Convert Python object to SQL JSON literal."""
    return f"'{esc(json.dumps(obj, ensure_ascii=False))}'::jsonb"


def build_seed_sql(users_with_uuids: list[dict]) -> str:
    """Build the full SQL seed script."""
    lines = []

    for idx, u in enumerate(users_with_uuids):
        uid = u["uuid"]
        first = u["first"]
        last = u["last"]
        phone = u["phone"]
        id_number = u["id_number"]
        conditions = u["conditions"]

        # Collect medications and tests based on conditions
        meds = []
        seen_med_slugs = set()
        for c in conditions:
            for m in MEDICATION_MAP.get(c, []):
                if m["slug"] not in seen_med_slugs:
                    meds.append(m)
                    seen_med_slugs.add(m["slug"])

        tests = []
        seen_test_names = set()
        for c in conditions:
            for t in TEST_MAP.get(c, []):
                if t["name"] not in seen_test_names:
                    tests.append(t)
                    seen_test_names.add(t["name"])

        med_names = [m["name"] for m in meds]
        test_names = [t["name"] for t in tests]
        total_med_cost = sum(m["cost"] for m in meds)

        conditions_sql = "ARRAY[" + ",".join(f"'{c}'" for c in conditions) + "]"

        treatment = {
            "currentlyOnMedication": True,
            "medicationNames": med_names,
            "takingMedicationRegularly": "MOSTLY",
            "reasonsForMissing": [],
            "usingHerbalAlternatives": False,
            "herbalDetails": None,
        }
        recurring_tests = {"selectedTests": test_names}
        cost_meds = [{"name": m["name"], "refillFrequencyDays": m["freq"], "estimatedCostPerRefill": m["cost"]} for m in meds]
        cost_tests = [{"name": t["name"], "frequencyMonths": t["freq_months"], "estimatedCostPerTest": t["cost"]} for t in tests]
        cost_estimates = {"medications": cost_meds, "tests": cost_tests}
        challenges = {"selected": ["COST", "DIET"], "topChallenge": "COST"}
        coping = {
            "informationSources": ["DOCTOR"],
            "costCoping": ["BORROW_FAMILY"],
            "hasEmergencyPlan": False,
            "exerciseFrequency": "FEW_TIMES_WEEK",
        }
        goals = "ARRAY['TRACK_COSTS', 'MEDICATION_REMINDERS']"

        facility1, ftype1 = FACILITIES[idx % len(FACILITIES)]
        facility2, ftype2 = FACILITIES[(idx + 3) % len(FACILITIES)]
        cashback1 = total_med_cost * 5 // 100

        lines.append(f"""
-- ============================================================
-- User {idx+1}: {first} {last} ({phone}) — {uid}
-- ============================================================

-- Update profile
UPDATE profiles SET
  first_name = '{esc(first)}',
  last_name = '{esc(last)}',
  pin = '1234',
  id_number = '{id_number}',
  id_verified = true,
  conditions = {conditions_sql},
  diagnosis_recency = 'MORE_THAN_2_YEARS',
  treatment = {json_sql(treatment)},
  recurring_tests = {json_sql(recurring_tests)},
  cost_estimates = {json_sql(cost_estimates)},
  challenges = {json_sql(challenges)},
  coping = {json_sql(coping)},
  goals = {goals},
  user_role = 'patient'
WHERE id = '{uid}';

-- Update wallet balance
UPDATE wallets SET cashback_balance = {cashback1 + 175 + 45}
WHERE user_id = '{uid}';
""")

        # Refill schedules
        refill_vals = []
        for j, m in enumerate(meds):
            offset = (idx + 1) * 3 + j * 5
            refill_vals.append(
                f"('{uid}', '{esc(m['name'])}', {m['freq']}, current_date + interval '{offset} days', 'UPCOMING')"
            )
        if refill_vals:
            lines.append(f"""INSERT INTO refill_schedules (user_id, medication_name, frequency_days, next_date, status)
VALUES
  {',\n  '.join(refill_vals)}
ON CONFLICT DO NOTHING;
""")

        # Test schedules
        test_vals = []
        for j, t in enumerate(tests):
            offset = 10 + j * 20 + idx * 3
            test_vals.append(
                f"('{uid}', '{esc(t['name'])}', {t['freq_months']}, current_date + interval '{offset} days', 'UPCOMING')"
            )
        if test_vals:
            lines.append(f"""INSERT INTO test_schedules (user_id, test_name, frequency_months, next_date, status)
VALUES
  {',\n  '.join(test_vals)}
ON CONFLICT DO NOTHING;
""")

        # Payments
        pay_items_1 = [{"name": f"{m['name']} x 30", "category": "MEDICATION", "quantity": 1, "unitPrice": m["cost"], "total": m["cost"]} for m in meds]
        lines.append(f"""INSERT INTO payments (user_id, facility_name, facility_type, amount, currency, line_items, funding_sources, cashback_amount, status, created_at)
VALUES
  ('{uid}', '{esc(facility1)}', '{ftype1}', {total_med_cost}, 'KES',
   {json_sql(pay_items_1)},
   {json_sql([{"source": "JIREH_WALLET", "amount": total_med_cost}])},
   {cashback1}, 'COMPLETED', now() - interval '5 days'),
  ('{uid}', '{esc(facility2)}', '{ftype2}', 3500, 'KES',
   {json_sql([{"name": "Consultation", "category": "CONSULTATION", "quantity": 1, "unitPrice": 2500, "total": 2500}, {"name": "Blood Test", "category": "LAB_TEST", "quantity": 1, "unitPrice": 1000, "total": 1000}])},
   {json_sql([{"source": "JIREH_WALLET", "amount": 2000}, {"source": "CARE_SAVER", "amount": 1500}])},
   175, 'COMPLETED', now() - interval '18 days'),
  ('{uid}', 'Kenyatta National Hospital - Pharmacy', 'PHARMACY', 900, 'KES',
   {json_sql([{"name": "Medication refill", "category": "MEDICATION", "quantity": 1, "unitPrice": 900, "total": 900}])},
   {json_sql([{"source": "JIREH_WALLET", "amount": 900}])},
   45, 'COMPLETED', now() - interval '25 days')
ON CONFLICT DO NOTHING;
""")

        # Events
        lines.append(f"""INSERT INTO events (user_id, type, data, created_at) VALUES
  ('{uid}', 'PAYMENT', {json_sql({"facilityName": facility1, "amount": total_med_cost, "currency": "KES", "facilityType": ftype1})}, now() - interval '5 days'),
  ('{uid}', 'PAYMENT', {json_sql({"facilityName": facility2, "amount": 3500, "currency": "KES", "facilityType": ftype2})}, now() - interval '18 days'),
  ('{uid}', 'PAYMENT', {json_sql({"facilityName": "Kenyatta National Hospital - Pharmacy", "amount": 900, "currency": "KES", "facilityType": "PHARMACY"})}, now() - interval '25 days'),
  ('{uid}', 'CASHBACK_EARNED', {json_sql({"amount": cashback1, "currency": "KES"})}, now() - interval '5 days'),
  ('{uid}', 'CASHBACK_EARNED', {json_sql({"amount": 175, "currency": "KES"})}, now() - interval '18 days'),
  ('{uid}', 'AI_INSIGHT', {json_sql({"insightType": "MEDICATION_REMINDER", "title": "Medication refill coming up", "body": "Based on your purchase history, a refill is due soon.", "confidence": 0.92})}, now() - interval '2 days');
""")

        # Notifications
        lines.append(f"""INSERT INTO notifications (user_id, type, title, body, metadata, deep_link, read_at, sent_at) VALUES
  ('{uid}', 'CASHBACK_EARNED', 'KES {cashback1} cashback earned', 'You earned cashback on your payment at {esc(facility1)}', {json_sql({"amount": cashback1})}, '/patients/companion/cost-tracker', now() - interval '4 days', now() - interval '5 days'),
  ('{uid}', 'CASHBACK_EARNED', 'KES 175 cashback earned', 'You earned cashback on your payment at {esc(facility2)}', {json_sql({"amount": 175})}, '/patients/companion/cost-tracker', now() - interval '17 days', now() - interval '18 days'),
  ('{uid}', 'REFILL_REMINDER', 'Medication refill coming up', 'Your medication supply is running low. Refill at any in-network pharmacy to earn 5%% cashback.', '{{}}'::jsonb, '/patients/companion/refill-schedule', null, now() - interval '1 day'),
  ('{uid}', 'AI_INSIGHT', 'New health education content', 'Based on your conditions, we recommend reading about diet and lifestyle changes.', {json_sql({"insightType": "EDUCATION_RECOMMENDATION"})}, '/patients/companion/education', now() - interval '10 days', now() - interval '12 days'),
  ('{uid}', 'AI_INSIGHT', 'Medication interaction check', 'We have reviewed your medications for potential interactions. All looks good.', {json_sql({"actionType": "DRUG_INTERACTION_WARNING", "severity": "LOW"})}, '/patients/companion/medication-cards', null, now() - interval '2 days');
""")

        # Chat messages
        lines.append(f"""INSERT INTO chat_messages (user_id, role, content, created_at) VALUES
  ('{uid}', 'user', 'What should I know about my medications?', now() - interval '10 days'),
  ('{uid}', 'assistant', 'Great question, {esc(first)}! Your medications work together to manage your conditions. Take them as prescribed and with food where recommended. If you experience any unusual side effects, contact your doctor.', now() - interval '10 days'),
  ('{uid}', 'user', 'Where can I get affordable medication in Nairobi?', now() - interval '7 days'),
  ('{uid}', 'assistant', 'Several options in Nairobi: Kenyatta National Hospital pharmacy offers the most affordable rates. Aga Khan and Nairobi Hospital pharmacies are pricier but well-stocked. Using Jireh Pay at in-network pharmacies earns you 5%% cashback.', now() - interval '7 days'),
  ('{uid}', 'user', 'How much will my next hospital visit cost?', now() - interval '7 days');
""")

        # Medication cards
        for m in meds:
            content = MED_CARD_CONTENT.get(m["slug"])
            if content:
                lines.append(f"""INSERT INTO medication_cards (user_id, medication_id, slug, content)
VALUES ('{uid}', '{m["slug"]}', '{m["slug"]}', {json_sql(content)})
ON CONFLICT DO NOTHING;
""")

        # Education progress (using real content_id UUIDs from education_content table)
        lines.append(f"""INSERT INTO education_progress (user_id, content_id, current_section, completed, completed_at, updated_at)
VALUES
  ('{uid}', 'a19f9c8f-395a-48a3-880e-341e2d1a07c8', 1, true, now() - interval '15 days', now() - interval '15 days'),
  ('{uid}', '8472b641-359d-4943-ab57-8056adb5e4b6', 1, true, now() - interval '12 days', now() - interval '12 days'),
  ('{uid}', '64ea4b1f-be53-4ff0-9862-f3331ec790e3', 1, false, null, now() - interval '8 days'),
  ('{uid}', '59e3381c-976a-40d2-905a-228dcd5ed802', 1, false, null, now() - interval '5 days'),
  ('{uid}', 'c395384f-960f-4786-8cb7-1fb0f7caf760', 0, false, null, null)
ON CONFLICT DO NOTHING;
""")

    return "\n".join(lines)


def main():
    created = []

    print("=== Step 1: Creating users via create-account edge function ===\n")
    for u in USERS:
        phone = f"+254700000{u['suffix'].zfill(3)}"
        print(f"Creating {phone} ({u['first']} {u['last']})...", end=" ")
        uuid = create_user(phone)
        if uuid:
            print(f"OK — {uuid}")
            created.append({**u, "phone": phone, "uuid": uuid})
        else:
            print("FAILED — skipping")

    if not created:
        print("\nNo users created. Exiting.")
        sys.exit(1)

    print(f"\n=== Step 2: Seeding data for {len(created)} users ===\n")
    sql = build_seed_sql(created)

    sql_path = "/tmp/seed-test-users.sql"
    with open(sql_path, "w") as f:
        f.write(sql)

    print(f"SQL written to {sql_path} ({len(sql)} chars)")
    print("Running SQL via supabase db query...\n")

    result = subprocess.run(
        ["npx", "supabase", "db", "query", "--linked", "-f", sql_path],
        capture_output=True, text=True,
        cwd="/Users/athmangude/Workspace/Jireh/ncd-prototype"
    )

    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)

    if result.returncode != 0:
        print(f"\nSQL failed with exit code {result.returncode}")
        print("You can inspect the SQL at:", sql_path)
        sys.exit(1)

    print("\n=== Done! ===")
    print(f"Created and seeded {len(created)} test users.")
    print("Login PIN: 123456 | Payment PIN: 1234")
    print("\nUsers:")
    for u in created:
        print(f"  {u['phone']}  {u['first']:>8} {u['last']:<10}  {u['uuid']}  {', '.join(u['conditions'])}")


if __name__ == "__main__":
    main()
