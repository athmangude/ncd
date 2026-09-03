-- 015_fix_rpc_uuid_types.sql
-- Fix payment IDs in seed RPCs to use valid UUIDs (payments.id is uuid, not text)
-- Also fix profiles update (no `data` column — clear specific fields instead)

-- Fix rpc_seed_demo_account
create or replace function rpc_seed_demo_account() returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
begin
  delete from network_members where user_id = v_user_id;
  delete from network_invites where user_id = v_user_id;
  delete from circle_activity where user_id = v_user_id;
  delete from care_fund_transactions where user_id = v_user_id;
  delete from loans where user_id = v_user_id;
  delete from manual_requests where user_id = v_user_id;
  delete from payments where user_id = v_user_id;
  delete from guarantor_invites where user_id = v_user_id;
  delete from notifications where user_id = v_user_id;
  delete from events where user_id = v_user_id;
  delete from recent_searches where user_id = v_user_id;
  delete from preferred_providers where user_id = v_user_id;
  delete from chat_messages where user_id = v_user_id;
  delete from education_progress where user_id = v_user_id;
  delete from refill_schedules where user_id = v_user_id;
  delete from test_schedules where user_id = v_user_id;
  delete from medication_cards where user_id = v_user_id;
  delete from facility_reviews where user_id = v_user_id;

  update wallets set cashback_balance = 500 where user_id = v_user_id;

  delete from patient_details where user_id = v_user_id;

  insert into patient_details (user_id, data) values (v_user_id, '{
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

  insert into network_members (id, user_id, first_name, last_name, phone_number, relationship, type, status, nickname, joined_at, has_defaulted_loan)
  values
    ('member-001', v_user_id, 'Brian', 'Kamau', '+254720112233', 'BROTHER', 'ACCOUNTABLE', 'ACTIVE', 'Bro', '2026-02-10T08:15:00.000Z', false),
    ('member-002', v_user_id, 'Wanjiru', 'Mwangi', '+254733445566', 'FRIEND', 'AUXILIARY', 'ACTIVE', null, '2026-03-05T14:42:00.000Z', false),
    ('member-003', v_user_id, 'Esther', 'Otieno', null, 'CHILD', 'CHILD', 'ACTIVE', 'Essy', '2026-01-20T10:00:00.000Z', false);

  insert into network_invites (id, user_id, first_name, last_name, phone_number, status, invite_link, nickname, relationship, created_at)
  values ('invite-001', v_user_id, 'Kevin', 'Ochieng', '+254701998877', 'PENDING', 'https://app.jireh.health/invite/invite-001', 'Kev', 'FRIEND', '2026-06-01T09:00:00.000Z');

  insert into circle_activity (id, user_id, event_type, occurred_at, acknowledged_at, member, still_qualifies_for_borrowing, invite_id)
  values
    ('activity-001', v_user_id, 'MEMBER_JOINED', '2026-03-05T14:42:00.000Z', null, '{"id":"member-002","firstName":"Wanjiru","lastName":"Mwangi","avatarUrl":null}'::jsonb, true, null),
    ('activity-002', v_user_id, 'INVITE_REJECTED', '2026-05-18T11:20:00.000Z', null, '{"id":"member-099","firstName":"Daniel","lastName":"Njoroge","avatarUrl":null}'::jsonb, true, 'invite-090'),
    ('activity-003', v_user_id, 'MEMBER_REMOVED', '2026-04-22T16:05:00.000Z', '2026-04-23T08:00:00.000Z', '{"id":"member-098","firstName":"Faith","lastName":"Achieng","avatarUrl":null}'::jsonb, false, null);

  insert into care_fund_transactions (id, user_id, transaction_amount, currency, type, status, sender, receiver, receiver_phone_number, description, created_at, updated_at, expires_at)
  values
    ('cf-txn-001', v_user_id, 500, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'EARNED', 'COMPLETED', null, '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, '+254712345678', 'Cashback earned', '2026-06-10T09:30:00.000Z', '2026-06-10T09:30:00.000Z', '2026-12-10T09:30:00.000Z'),
    ('cf-txn-002', v_user_id, 300, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'TRANSFER', 'COMPLETED', '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, '{"accountOwner":{"id":"member-001","firstName":"Brian","lastName":"Kamau"}}'::jsonb, '+254720112233', 'Gift to Brian', '2026-06-08T13:15:00.000Z', '2026-06-08T13:15:00.000Z', null),
    ('cf-txn-003', v_user_id, 250, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'TRANSFER', 'COMPLETED', '{"accountOwner":{"id":"member-002","firstName":"Wanjiru","lastName":"Mwangi"}}'::jsonb, '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, '+254712345678', 'Gift from Wanjiru', '2026-06-05T18:40:00.000Z', '2026-06-05T18:40:00.000Z', null),
    ('cf-txn-004', v_user_id, 800, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'SPENT', 'COMPLETED', '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, null, null, 'Applied to medical bill', '2026-05-28T11:00:00.000Z', '2026-05-28T11:00:00.000Z', null),
    ('cf-txn-005', v_user_id, 150, '{"code":"KES","symbol":"KSh","name":"Kenyan Shilling"}'::jsonb, 'TRANSFER', 'PENDING', '{"accountOwner":{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau"}}'::jsonb, '{"accountOwner":{"id":"member-002","firstName":"Wanjiru","lastName":"Mwangi"}}'::jsonb, '+254733445566', 'Gift to Wanjiru', '2026-05-20T07:25:00.000Z', '2026-05-20T07:25:00.000Z', null);

  insert into loans (id, user_id, amount, total_bill_amount, outstanding_amount, total_paid, care_fund_discount_amount, status, loan_type, currency, created_at, loan_due_date, first_payment_due, patient_name, patient_medical_info_request, transactions)
  values
    ('loan-1001', v_user_id, 18000, 24000, 12000, 6000, 0, 'DISBURSED', 'MEMBERSHIP', '{"code":"KES"}'::jsonb, '2026-05-28T09:15:00.000Z', '2026-06-28T09:15:00.000Z', '2026-06-28T09:15:00.000Z', 'Wanjiru Kamau', '{"patientName":"Wanjiru Kamau","facility":{"id":"fac-001","name":"Aga Khan University Hospital"}}'::jsonb, '[{"id":"txn-2001","amount":6000,"description":"Loan repayment","transactionType":"COLLECTION","date":"2026-06-05T14:30:00.000Z","createdAt":"2026-06-05T14:30:00.000Z"}]'::jsonb),
    ('loan-1002', v_user_id, 9500, 9500, 0, 9500, 475, 'PAID', 'MEMBERSHIP', '{"code":"KES"}'::jsonb, '2026-04-12T11:00:00.000Z', '2026-05-12T11:00:00.000Z', '2026-05-12T11:00:00.000Z', 'Wanjiru Kamau', '{"patientName":"Wanjiru Kamau","facility":{"id":"fac-002","name":"Nairobi Hospital"}}'::jsonb, '[{"id":"txn-2002","amount":4500,"description":"Loan repayment","transactionType":"COLLECTION","date":"2026-04-25T10:00:00.000Z","createdAt":"2026-04-25T10:00:00.000Z"},{"id":"txn-2003","amount":5000,"description":"Loan repayment","transactionType":"COLLECTION","date":"2026-05-10T16:45:00.000Z","createdAt":"2026-05-10T16:45:00.000Z"}]'::jsonb);

  insert into manual_requests (id, user_id, care_provider_name, bill_amount, payment_info, reason, status, created_at, updated_at, patient, kmpdc_facility, invoice_file)
  values
    ('mrr-7001', v_user_id, 'St. Mary''s Hospital Langata', '5400', '{"type":"MPTILL","tillNumber":"823914","paybillNumber":"","accountNumber":""}'::jsonb, null, 'PENDING', '2026-06-14T07:30:00.000Z', '2026-06-14T07:30:00.000Z', '{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau","phoneNumber":"+254712345678","email":"wanjiru.kamau@example.com"}'::jsonb, '{"id":"fac-004","name":"St. Mary''s Hospital Langata"}'::jsonb, '{"id":"file-9001","filePath":"/uploads/invoice-9001.pdf","originalFileName":"invoice-stmarys.pdf","url":"/uploads/invoice-9001.pdf"}'::jsonb),
    ('mrr-7002', v_user_id, 'Gertrude''s Children''s Hospital', '12300', '{"type":"MPAYBILL","tillNumber":"","paybillNumber":"247247","accountNumber":"GCH-4471"}'::jsonb, null, 'APPROVED', '2026-06-11T12:45:00.000Z', '2026-06-12T09:00:00.000Z', '{"id":"patient-001","firstName":"Wanjiru","lastName":"Kamau","phoneNumber":"+254712345678","email":"wanjiru.kamau@example.com"}'::jsonb, '{"id":"fac-005","name":"Gertrude''s Children''s Hospital"}'::jsonb, '{"id":"file-9002","filePath":"/uploads/invoice-9002.pdf","originalFileName":"invoice-gertrudes.pdf","url":"/uploads/invoice-9002.pdf"}'::jsonb);

  insert into payments (id, user_id, amount, currency, status, facility_name, facility_type, funding_sources, payment_splits, cashback_details, cashback_amount, user_info, patient_medical_info_request, disbursement_transaction, created_at)
  values
    (gen_random_uuid(), v_user_id, 2400, 'KES', 'COMPLETED', 'Cana Hospital', 'HOSPITAL',
      '[{"source":"WALLET","amount":600},{"source":"LOAN","amount":1800}]'::jsonb,
      '[{"id":"split-4001","createdAt":"2026-05-28T09:15:00.000Z","paymentSplitAmount":600,"wallet":{"type":"WALLET"},"loan":null},{"id":"split-4002","createdAt":"2026-05-28T09:15:00.000Z","paymentSplitAmount":1800,"wallet":{"type":"LOAN"},"loan":{"id":"loan-1001","amount":1800,"totalBillAmount":2400,"outstandingAmount":1200,"totalPaid":600,"loanDueDate":"2026-06-28T09:15:00.000Z","transactions":[{"id":"txn-2001","amount":600,"description":"Loan repayment","transactionType":"COLLECTION","createdAt":"2026-06-05T14:30:00.000Z"}]}}]'::jsonb,
      '[{"source":"Early repayment reward","amount":30}]'::jsonb,
      30, '{"firstName":"Wanjiru","lastName":"Kamau"}'::jsonb,
      '{"facility":{"id":"fac-001","name":"Cana Hospital"},"medicalInvoiceFile":{"careProviderName":"Cana Hospital"}}'::jsonb,
      '{"description":"Payment to Cana Hospital"}'::jsonb,
      '2026-05-28T09:15:00.000Z'),
    (gen_random_uuid(), v_user_id, 9500, 'KES', 'COMPLETED', 'Nairobi Hospital', 'HOSPITAL',
      '[{"source":"DISCOUNT","amount":475},{"source":"LOAN","amount":9025}]'::jsonb,
      '[{"id":"split-4003","createdAt":"2026-04-12T11:00:00.000Z","paymentSplitAmount":475,"wallet":{"type":"DISCOUNT"},"loan":null},{"id":"split-4004","createdAt":"2026-04-12T11:00:00.000Z","paymentSplitAmount":9025,"wallet":{"type":"LOAN"},"loan":{"id":"loan-1002","amount":9500,"totalBillAmount":9500,"outstandingAmount":0,"totalPaid":9500,"loanDueDate":"2026-05-12T11:00:00.000Z","transactions":[{"id":"txn-2002","amount":4500,"description":"Loan repayment","transactionType":"COLLECTION","createdAt":"2026-04-25T10:00:00.000Z"},{"id":"txn-2003","amount":5000,"description":"Loan repayment","transactionType":"COLLECTION","createdAt":"2026-05-10T16:45:00.000Z"}]}}]'::jsonb,
      '[{"source":"Care Fund discount","amount":475}]'::jsonb,
      475, '{"firstName":"Wanjiru","lastName":"Kamau"}'::jsonb,
      '{"facility":{"id":"fac-002","name":"Nairobi Hospital"},"medicalInvoiceFile":{"careProviderName":"Nairobi Hospital"}}'::jsonb,
      '{"description":"Payment to Nairobi Hospital"}'::jsonb,
      '2026-04-12T11:00:00.000Z');

  insert into guarantor_invites (user_id, data)
  values (v_user_id, '{"patientCountryCode":"KE","countryOptions":[{"name":"Kenya","value":"KE","callingCode":"+254"},{"name":"Uganda","value":"UG","callingCode":"+256"},{"name":"Tanzania","value":"TZ","callingCode":"+255"},{"name":"Rwanda","value":"RW","callingCode":"+250"},{"name":"United Kingdom","value":"GB","callingCode":"+44"},{"name":"United States","value":"US","callingCode":"+1"},{"name":"United Arab Emirates","value":"AE","callingCode":"+971"}],"localGuarantorInvites":[{"id":"guarantor-local-001","firstName":"Joseph","lastName":"Mwangi","phoneNumber":"+254722334455","countryCode":"KE","email":"joseph.mwangi@example.com","guarantorType":"LOCAL"}],"internationalGuarantorInvites":[{"id":"guarantor-intl-001","firstName":"Grace","lastName":"Achieng","phoneNumber":"+447911123456","countryCode":"GB","email":"grace.achieng@example.com","guarantorType":"INTERNATIONAL"}]}'::jsonb);

  return jsonb_build_object('success', true, 'message', 'Demo account reset');
end;
$$ language plpgsql security definer;

-- Fix rpc_seed_at_stage
create or replace function rpc_seed_at_stage(p_stage text) returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
begin
  perform rpc_reset_to_onboarding();

  if p_stage = 'id_verified' then
    update patient_details set data = data || jsonb_build_object(
      'hasSetPin', true, 'isVerified', true,
      'documentVerificationStatus', 'VERIFIED'
    ) where user_id = v_user_id;

  elsif p_stage = 'circle_built' then
    update patient_details set data = data || jsonb_build_object(
      'hasSetPin', true, 'isVerified', true,
      'documentVerificationStatus', 'VERIFIED'
    ) where user_id = v_user_id;
    insert into network_members (id, user_id, first_name, last_name, phone_number, relationship, type, status, nickname, joined_at, has_defaulted_loan)
    values
      ('member-001', v_user_id, 'Brian', 'Kamau', '+254720112233', 'BROTHER', 'ACCOUNTABLE', 'ACTIVE', 'Bro', '2026-02-10T08:15:00.000Z', false),
      ('member-002', v_user_id, 'Wanjiru', 'Mwangi', '+254733445566', 'FRIEND', 'AUXILIARY', 'ACTIVE', null, '2026-03-05T14:42:00.000Z', false),
      ('member-003', v_user_id, 'Esther', 'Otieno', null, 'CHILD', 'CHILD', 'ACTIVE', 'Essy', '2026-01-20T10:00:00.000Z', false);
    insert into network_invites (id, user_id, first_name, last_name, phone_number, status, invite_link, nickname, relationship, created_at)
    values ('invite-001', v_user_id, 'Kevin', 'Ochieng', '+254701998877', 'PENDING', 'https://app.jireh.health/invite/invite-001', 'Kev', 'FRIEND', '2026-06-01T09:00:00.000Z');

  elsif p_stage = 'membership_active' then
    update patient_details set data = data || jsonb_build_object(
      'hasSetPin', true, 'isVerified', true,
      'documentVerificationStatus', 'VERIFIED',
      'hasActiveMembership', true, 'type', 'PLUS',
      'membershipStatus', 'ACTIVE', 'isBasicMember', false,
      'canPayMedicalBill', true,
      'creditLimit', jsonb_build_object('totalCreditLimitAmount', '50000', 'remainingAmount', '50000')
    ) where user_id = v_user_id;
    insert into network_members (id, user_id, first_name, last_name, phone_number, relationship, type, status, nickname, joined_at, has_defaulted_loan)
    values
      ('member-001', v_user_id, 'Brian', 'Kamau', '+254720112233', 'BROTHER', 'ACCOUNTABLE', 'ACTIVE', 'Bro', '2026-02-10T08:15:00.000Z', false),
      ('member-002', v_user_id, 'Wanjiru', 'Mwangi', '+254733445566', 'FRIEND', 'AUXILIARY', 'ACTIVE', null, '2026-03-05T14:42:00.000Z', false),
      ('member-003', v_user_id, 'Esther', 'Otieno', null, 'CHILD', 'CHILD', 'ACTIVE', 'Essy', '2026-01-20T10:00:00.000Z', false);
    update wallets set cashback_balance = 500 where user_id = v_user_id;

  elsif p_stage = 'post_first_payment' then
    update patient_details set data = data || jsonb_build_object(
      'hasSetPin', true, 'isVerified', true,
      'documentVerificationStatus', 'VERIFIED',
      'hasActiveMembership', true, 'type', 'PLUS',
      'membershipStatus', 'ACTIVE', 'isBasicMember', false,
      'canPayMedicalBill', true,
      'creditLimit', jsonb_build_object('totalCreditLimitAmount', '50000', 'remainingAmount', '32000')
    ) where user_id = v_user_id;
    insert into network_members (id, user_id, first_name, last_name, phone_number, relationship, type, status, nickname, joined_at, has_defaulted_loan)
    values
      ('member-001', v_user_id, 'Brian', 'Kamau', '+254720112233', 'BROTHER', 'ACCOUNTABLE', 'ACTIVE', 'Bro', '2026-02-10T08:15:00.000Z', false),
      ('member-002', v_user_id, 'Wanjiru', 'Mwangi', '+254733445566', 'FRIEND', 'AUXILIARY', 'ACTIVE', null, '2026-03-05T14:42:00.000Z', false),
      ('member-003', v_user_id, 'Esther', 'Otieno', null, 'CHILD', 'CHILD', 'ACTIVE', 'Essy', '2026-01-20T10:00:00.000Z', false);
    update wallets set cashback_balance = 500 where user_id = v_user_id;
    insert into payments (id, user_id, amount, currency, status, facility_name, facility_type, funding_sources, payment_splits, cashback_details, cashback_amount, user_info, created_at)
    values (gen_random_uuid(), v_user_id, 18000, 'KES', 'COMPLETED', 'Aga Khan University Hospital', 'HOSPITAL',
      '[{"source":"LOAN","amount":18000}]'::jsonb,
      '[{"id":"split-1","createdAt":"2026-05-28T09:15:00.000Z","paymentSplitAmount":18000,"wallet":{"type":"LOAN"},"loan":{"id":"loan-stage-001"}}]'::jsonb,
      '[]'::jsonb, 0, '{"firstName":"Wanjiru","lastName":"Kamau"}'::jsonb, '2026-05-28T09:15:00.000Z');
    insert into loans (id, user_id, amount, total_bill_amount, outstanding_amount, currency, status, created_at, loan_due_date, patient_name)
    values ('loan-stage-001', v_user_id, 18000, 18000, 18000, '{"code":"KES"}'::jsonb, 'DISBURSED', '2026-05-28T09:15:00.000Z', '2026-06-28T09:15:00.000Z', 'Wanjiru Kamau');

  else
    raise exception 'Unknown stage: %. Valid stages: id_verified, circle_built, membership_active, post_first_payment', p_stage;
  end if;

  return jsonb_build_object('success', true, 'stage', p_stage);
end;
$$ language plpgsql security definer;

-- Fix rpc_reset_to_onboarding (remove profiles.data reference)
create or replace function rpc_reset_to_onboarding() returns jsonb as $$
declare
  v_user_id uuid := auth.uid();
begin
  delete from network_members where user_id = v_user_id;
  delete from network_invites where user_id = v_user_id;
  delete from circle_activity where user_id = v_user_id;
  delete from care_fund_transactions where user_id = v_user_id;
  delete from loans where user_id = v_user_id;
  delete from manual_requests where user_id = v_user_id;
  delete from payments where user_id = v_user_id;
  delete from guarantor_invites where user_id = v_user_id;
  delete from notifications where user_id = v_user_id;
  delete from events where user_id = v_user_id;
  delete from recent_searches where user_id = v_user_id;
  delete from preferred_providers where user_id = v_user_id;
  delete from chat_messages where user_id = v_user_id;
  delete from education_progress where user_id = v_user_id;
  delete from refill_schedules where user_id = v_user_id;
  delete from test_schedules where user_id = v_user_id;
  delete from medication_cards where user_id = v_user_id;
  delete from facility_reviews where user_id = v_user_id;

  update wallets set cashback_balance = 0 where user_id = v_user_id;

  delete from patient_details where user_id = v_user_id;
  insert into patient_details (user_id, data) values (v_user_id, jsonb_build_object(
    'firstName', 'Wanjiru', 'lastName', 'Kamau',
    'hasSetPin', false, 'isVerified', false,
    'membershipStatus', 'NONE', 'type', 'PUBLIC',
    'isBasicMember', true, 'canPayMedicalBill', false
  ));

  return jsonb_build_object('success', true, 'message', 'Reset to onboarding');
end;
$$ language plpgsql security definer;
