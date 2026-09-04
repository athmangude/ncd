-- 014_full_migration_seed.sql
-- Seed data for reference tables + demo user data
-- Demo user UUID: 6b4d8e63-16c9-4aa6-ae9c-73820311007a

-- ============================================================================
-- 1. COUNTRY CODES (14 entries)
-- ============================================================================
insert into country_codes (country_code, name, calling_code) values
  ('KE', 'Kenya', '+254'),
  ('UG', 'Uganda', '+256'),
  ('TZ', 'Tanzania', '+255'),
  ('RW', 'Rwanda', '+250'),
  ('ET', 'Ethiopia', '+251'),
  ('SO', 'Somalia', '+252'),
  ('SS', 'South Sudan', '+211'),
  ('NG', 'Nigeria', '+234'),
  ('GH', 'Ghana', '+233'),
  ('ZA', 'South Africa', '+27'),
  ('GB', 'United Kingdom', '+44'),
  ('US', 'United States', '+1'),
  ('AE', 'United Arab Emirates', '+971'),
  ('IN', 'India', '+91');

-- ============================================================================
-- 2. LINK SOCIAL OPTIONS (3 entries)
-- ============================================================================
insert into link_social_options (provider, label) values
  ('FACEBOOK', 'Facebook'),
  ('GOOGLE', 'Google'),
  ('LINKEDIN', 'LinkedIn');

-- ============================================================================
-- 3. FAST TRACK PROVIDERS (1 entry)
-- ============================================================================
insert into fast_track_providers (id, name, payment_number, payment_code, sms_phone_numbers, is_active, facility) values
  (101, 'Outpatient Cashier', '482913', 'JH-482913', array['+254720000111'], true, '{
    "id": 55,
    "name": "Cana Hospital",
    "address": "Rimpa, Kajiado",
    "POBox": "P.O. Box 30270-00100",
    "orgName": "Cana Hospital Limited",
    "facilityLevel": "Level 4",
    "facilityVerificationStatus": "VERIFIED",
    "locationName": "Rimpa",
    "county": "Kajiado",
    "subCounty": "Kajiado North",
    "contactPhone": "+254203662000",
    "latitude": "-1.262420",
    "longitude": "36.815010",
    "isOutOfNetwork": false,
    "isPrimaryBranch": true,
    "branchDisplayName": "Cana Hospital - Rimpa",
    "createdAt": "2025-01-10T09:00:00.000Z",
    "updatedAt": "2026-05-20T12:00:00.000Z",
    "deletedAt": null
  }'::jsonb);

-- ============================================================================
-- 4. DEMO USER SEED DATA
-- ============================================================================

-- 4.1 Patient details (JSONB blob)
insert into patient_details (user_id, data) values ('6b4d8e63-16c9-4aa6-ae9c-73820311007a', '{
  "id": "patient-001",
  "firstName": "Wanjiru",
  "lastName": "Kamau",
  "email": "wanjiru.kamau@example.com",
  "phoneNumber": "+254712345678",
  "isVerified": true,
  "hasVerifiedId": "APPROVED",
  "membershipStatus": "ACTIVE",
  "hasActiveMembership": true,
  "creditLimit": {
    "totalCreditLimitAmount": "50000",
    "remainingAmount": "32000",
    "currency": {"countryName": "Kenya", "code": "KES", "id": 1}
  },
  "medicalRequests": [],
  "loans": [],
  "wallets": [
    {"id": "wallet-mpesa-001", "type": "MPESA", "remainingBalance": "0", "createdAt": "2026-01-15T09:30:00.000Z", "updatedAt": "2026-06-01T12:00:00.000Z"},
    {"id": "wallet-loan-001", "type": "LOAN", "remainingBalance": "32000", "createdAt": "2026-01-15T09:30:00.000Z", "updatedAt": "2026-06-01T12:00:00.000Z"},
    {"id": "wallet-cashback-001", "type": "CASHBACK", "remainingBalance": "500", "createdAt": "2026-01-15T09:30:00.000Z", "updatedAt": "2026-06-01T12:00:00.000Z"},
    {"id": "wallet-card-001", "type": "CARD", "remainingBalance": "0", "createdAt": "2026-01-15T09:30:00.000Z", "updatedAt": "2026-06-01T12:00:00.000Z"}
  ],
  "patientCircle": {
    "id": "circle-001", "status": "ACTIVE",
    "maxAccountableSlots": 2, "maxAuxiliarySlots": 3,
    "filledAccountableSlots": 2, "filledAuxiliarySlots": 1,
    "isFrozen": false, "hasCompletedSetup": true,
    "activatedAt": "2026-02-10T08:15:00.000Z",
    "createdAt": "2026-02-10T08:15:00.000Z", "updatedAt": "2026-06-01T12:00:00.000Z"
  },
  "hasAcceptedMedicalConsentForm": true,
  "hasAcceptedLatestTermsAndConditions": true,
  "hasBeenReferred": true,
  "hasVerifiedCrbScore": true,
  "idVerificationStatus": "APPROVED",
  "documentVerificationStatus": "PASSED",
  "network": [],
  "type": "PLUS",
  "canPayMedicalBill": true,
  "orgBorrower": null,
  "hasUploadedMpesaStatement": true,
  "careFundAccount": {
    "id": 1, "careFundBalance": "500",
    "createdAt": "2026-01-15T09:30:00.000Z", "updatedAt": "2026-06-01T12:00:00.000Z",
    "accountOwner": null,
    "currency": {"countryName": "Kenya", "code": "KES", "id": 1}
  },
  "accountReference": "JIR-WANJIRU-001",
  "subscriptions": [],
  "isBasicMember": false,
  "hasSetPin": true,
  "profilePhoto": null,
  "gender": "FEMALE",
  "dateOfBirth": "1992-04-18"
}'::jsonb);

-- 4.2 Network members (3 entries)
insert into network_members (id, user_id, first_name, last_name, phone_number, relationship, type, status, nickname, joined_at, has_defaulted_loan) values
  ('member-001', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'Brian', 'Kamau', '+254720112233', 'BROTHER', 'ACCOUNTABLE', 'ACTIVE', 'Bro', '2026-02-10T08:15:00.000Z', false),
  ('member-002', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'Wanjiru', 'Mwangi', '+254733445566', 'FRIEND', 'AUXILIARY', 'ACTIVE', null, '2026-03-05T14:42:00.000Z', false),
  ('member-003', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'Esther', 'Otieno', null, 'CHILD', 'CHILD', 'ACTIVE', 'Essy', '2026-01-20T10:00:00.000Z', false);

-- 4.3 Network invites (1 entry)
insert into network_invites (id, user_id, first_name, last_name, phone_number, status, invite_link, nickname, relationship, created_at) values
  ('invite-001', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'Kevin', 'Ochieng', '+254701998877', 'PENDING', 'https://app.jireh.health/invite/invite-001', 'Kev', 'FRIEND', '2026-06-01T09:00:00.000Z');

-- 4.4 Circle activity (3 entries)
insert into circle_activity (id, user_id, event_type, occurred_at, acknowledged_at, member, still_qualifies_for_borrowing, invite_id) values
  ('activity-001', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'MEMBER_JOINED', '2026-03-05T14:42:00.000Z', null, '{"id":"member-002","firstName":"Wanjiru","lastName":"Mwangi","avatarUrl":null}'::jsonb, true, null),
  ('activity-002', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'INVITE_REJECTED', '2026-05-18T11:20:00.000Z', null, '{"id":"member-099","firstName":"Daniel","lastName":"Njoroge","avatarUrl":null}'::jsonb, true, 'invite-090'),
  ('activity-003', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'MEMBER_REMOVED', '2026-04-22T16:05:00.000Z', '2026-04-23T08:00:00.000Z', '{"id":"member-098","firstName":"Faith","lastName":"Achieng","avatarUrl":null}'::jsonb, false, null);

-- 4.5 Care fund transactions (5 entries)
insert into care_fund_transactions (id, user_id, transaction_amount, currency, type, status, sender, receiver, receiver_phone_number, description, created_at, updated_at, expires_at) values
  ('cf-txn-001', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 500, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'EARNED', 'COMPLETED', null, '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, '+254712345678', 'Cashback earned', '2026-06-10T09:30:00.000Z', '2026-06-10T09:30:00.000Z', '2026-12-10T09:30:00.000Z'),
  ('cf-txn-002', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 300, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'TRANSFER', 'COMPLETED', '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, '{"accountOwner":{"id":"member-001","firstName":"Brian","lastName":"Kamau"}}'::jsonb, '+254720112233', 'Gift to Brian', '2026-06-08T13:15:00.000Z', '2026-06-08T13:15:00.000Z', null),
  ('cf-txn-003', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 250, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'TRANSFER', 'COMPLETED', '{"accountOwner":{"id":"member-002","firstName":"Wanjiru","lastName":"Mwangi"}}'::jsonb, '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, '+254712345678', 'Gift from Wanjiru', '2026-06-05T18:40:00.000Z', '2026-06-05T18:40:00.000Z', null),
  ('cf-txn-004', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 800, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'SPENT', 'COMPLETED', '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, null, null, 'Applied to medical bill', '2026-05-28T11:00:00.000Z', '2026-05-28T11:00:00.000Z', null),
  ('cf-txn-005', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 150, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'TRANSFER', 'PENDING', '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, '{"accountOwner":{"id":"member-002","firstName":"Wanjiru","lastName":"Mwangi"}}'::jsonb, '+254733445566', 'Gift to Wanjiru', '2026-05-20T07:25:00.000Z', '2026-05-20T07:25:00.000Z', null);

-- 4.6 Loans (2 entries)
insert into loans (id, user_id, amount, total_bill_amount, outstanding_amount, total_paid, care_fund_discount_amount, status, loan_type, currency, created_at, loan_due_date, first_payment_due, patient_name, patient_medical_info_request, transactions) values
  ('loan-1001', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 18000, 24000, 12000, 6000, 0, 'DISBURSED', 'MEMBERSHIP', '{"code":"KES"}'::jsonb, '2026-05-28T09:15:00.000Z', '2026-06-28T09:15:00.000Z', '2026-06-28T09:15:00.000Z', 'Wanjiru Kamau', '{"patientName":"Wanjiru Kamau","facility":{"id":"fac-001","name":"Aga Khan University Hospital"}}'::jsonb, '[{"id":"txn-2001","amount":6000,"description":"Loan repayment","transactionType":"COLLECTION","date":"2026-06-05T14:30:00.000Z","createdAt":"2026-06-05T14:30:00.000Z"}]'::jsonb),
  ('loan-1002', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 9500, 9500, 0, 9500, 475, 'PAID', 'MEMBERSHIP', '{"code":"KES"}'::jsonb, '2026-04-12T11:00:00.000Z', '2026-05-12T11:00:00.000Z', '2026-05-12T11:00:00.000Z', 'Wanjiru Kamau', '{"patientName":"Wanjiru Kamau","facility":{"id":"fac-002","name":"Nairobi Hospital"}}'::jsonb, '[{"id":"txn-2002","amount":4500,"description":"Loan repayment","transactionType":"COLLECTION","date":"2026-04-25T10:00:00.000Z","createdAt":"2026-04-25T10:00:00.000Z"},{"id":"txn-2003","amount":5000,"description":"Loan repayment","transactionType":"COLLECTION","date":"2026-05-10T16:45:00.000Z","createdAt":"2026-05-10T16:45:00.000Z"}]'::jsonb);

-- 4.7 Manual requests (2 entries)
insert into manual_requests (id, user_id, care_provider_name, bill_amount, payment_info, reason, status, created_at, updated_at, patient, kmpdc_facility, invoice_file) values
  ('mrr-7001', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'St. Mary''s Hospital Langata', '5400', '{"type":"MPTILL","tillNumber":"823914","paybillNumber":"","accountNumber":""}'::jsonb, null, 'PENDING', '2026-06-14T07:30:00.000Z', '2026-06-14T07:30:00.000Z', '{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau","phoneNumber":"+254712345678","email":"wanjiru.kamau@example.com"}'::jsonb, '{"id":"fac-004","name":"St. Mary''s Hospital Langata"}'::jsonb, '{"id":"file-9001","filePath":"/uploads/invoice-9001.pdf","originalFileName":"invoice-stmarys.pdf","url":"/uploads/invoice-9001.pdf"}'::jsonb),
  ('mrr-7002', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'Gertrude''s Children''s Hospital', '12300', '{"type":"MPAYBILL","tillNumber":"","paybillNumber":"247247","accountNumber":"GCH-4471"}'::jsonb, null, 'APPROVED', '2026-06-11T12:45:00.000Z', '2026-06-12T09:00:00.000Z', '{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau","phoneNumber":"+254712345678","email":"wanjiru.kamau@example.com"}'::jsonb, '{"id":"fac-005","name":"Gertrude''s Children''s Hospital"}'::jsonb, '{"id":"file-9002","filePath":"/uploads/invoice-9002.pdf","originalFileName":"invoice-gertrudes.pdf","url":"/uploads/invoice-9002.pdf"}'::jsonb);

-- 4.8 Enriched payments (2 entries — from payment-history.json)
insert into payments (id, user_id, amount, currency, status, facility_name, facility_type, funding_sources, payment_splits, cashback_details, cashback_amount, user_info, patient_medical_info_request, disbursement_transaction, description, created_at) values
  ('a0000000-0000-4000-8000-000000003001', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 2400, 'KES', 'COMPLETED', 'Cana Hospital', 'HOSPITAL',
    '[{"source":"WALLET","amount":600},{"source":"LOAN","amount":1800}]'::jsonb,
    '[{"id":"split-4001","createdAt":"2026-05-28T09:15:00.000Z","paymentSplitAmount":600,"wallet":{"type":"WALLET"},"loan":null},{"id":"split-4002","createdAt":"2026-05-28T09:15:00.000Z","paymentSplitAmount":1800,"wallet":{"type":"LOAN"},"loan":{"id":"loan-1001","amount":1800,"totalBillAmount":2400,"outstandingAmount":1200,"totalPaid":600,"loanDueDate":"2026-06-28T09:15:00.000Z","transactions":[{"id":"txn-2001","amount":600,"description":"Loan repayment","transactionType":"COLLECTION","createdAt":"2026-06-05T14:30:00.000Z"}]}}]'::jsonb,
    '[{"source":"Early repayment reward","amount":30}]'::jsonb,
    30, '{"firstName":"Wanjiru","lastName":"Kamau"}'::jsonb,
    '{"facility":{"id":"fac-001","name":"Cana Hospital"},"medicalInvoiceFile":{"careProviderName":"Cana Hospital"}}'::jsonb,
    '{"description":"Payment to Cana Hospital"}'::jsonb,
    'Payment to Cana Hospital', '2026-05-28T09:15:00.000Z'),
  ('a0000000-0000-4000-8000-000000003002', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 9500, 'KES', 'COMPLETED', 'Nairobi Hospital', 'HOSPITAL',
    '[{"source":"DISCOUNT","amount":475},{"source":"LOAN","amount":9025}]'::jsonb,
    '[{"id":"split-4003","createdAt":"2026-04-12T11:00:00.000Z","paymentSplitAmount":475,"wallet":{"type":"DISCOUNT"},"loan":null},{"id":"split-4004","createdAt":"2026-04-12T11:00:00.000Z","paymentSplitAmount":9025,"wallet":{"type":"LOAN"},"loan":{"id":"loan-1002","amount":9500,"totalBillAmount":9500,"outstandingAmount":0,"totalPaid":9500,"loanDueDate":"2026-05-12T11:00:00.000Z","transactions":[{"id":"txn-2002","amount":4500,"description":"Loan repayment","transactionType":"COLLECTION","createdAt":"2026-04-25T10:00:00.000Z"},{"id":"txn-2003","amount":5000,"description":"Loan repayment","transactionType":"COLLECTION","createdAt":"2026-05-10T16:45:00.000Z"}]}}]'::jsonb,
    '[{"source":"Care Fund discount","amount":475}]'::jsonb,
    475, '{"firstName":"Wanjiru","lastName":"Kamau"}'::jsonb,
    '{"facility":{"id":"fac-002","name":"Nairobi Hospital"},"medicalInvoiceFile":{"careProviderName":"Nairobi Hospital"}}'::jsonb,
    '{"description":"Payment to Nairobi Hospital"}'::jsonb,
    'Payment to Nairobi Hospital', '2026-04-12T11:00:00.000Z');

-- 4.9 Guarantor invites
insert into guarantor_invites (user_id, data) values ('6b4d8e63-16c9-4aa6-ae9c-73820311007a', '{
  "patientCountryCode": "KE",
  "countryOptions": [
    {"name":"Kenya","value":"KE","callingCode":"+254"},
    {"name":"Uganda","value":"UG","callingCode":"+256"},
    {"name":"Tanzania","value":"TZ","callingCode":"+255"},
    {"name":"Rwanda","value":"RW","callingCode":"+250"},
    {"name":"United Kingdom","value":"GB","callingCode":"+44"},
    {"name":"United States","value":"US","callingCode":"+1"},
    {"name":"United Arab Emirates","value":"AE","callingCode":"+971"}
  ],
  "localGuarantorInvites": [
    {"id":"guarantor-local-001","firstName":"Joseph","lastName":"Mwangi","phoneNumber":"+254722334455","countryCode":"KE","email":"joseph.mwangi@example.com","guarantorType":"LOCAL"}
  ],
  "internationalGuarantorInvites": [
    {"id":"guarantor-intl-001","firstName":"Grace","lastName":"Achieng","phoneNumber":"+447911123456","countryCode":"GB","email":"grace.achieng@example.com","guarantorType":"INTERNATIONAL"}
  ]
}'::jsonb);
