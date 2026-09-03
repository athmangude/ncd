-- 011_discovery_seed.sql
-- Seed data for discovery/explore tab tables

-- ============================================================
-- Facilities (12 records)
-- ============================================================
insert into facilities (id, name, registration_number, po_box, facility_type, facility_level, bed_capacity, county, status, plot_number, latitude, longitude, location_name, phone_number, place_image_url, distance, has_active_discount, active_discount, verification_status, service_categories, rating, closing_time, discount_percentage, is_onboarded, linked_facility, created_at, updated_at) values
(1, 'Cana Hospital', 'KMPDC-NRB-0001', 'P.O. Box 30026-00100, Kajiado', 'PRIVATE INTERNSHIP TEACHING AND REFERRAL HOSPITAL', 'LEVEL 4', 363, 'Kajiado', 'OPERATIONAL', 'LR No. 209/4137', -1.2966, 36.8083, 'Rimpa Road, Kajiado', '+254 20 2845000', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800', 1.2, true, '{"id":101,"code":"CANHOSP10","description":"10% off outpatient consultations","discountType":"PERCENTAGE","discountValue":"10","validUntil":"2026-12-31T23:59:59.000Z","maximumDiscountAmount":"3000"}', 'APPROVED', '{outpatient_primary_care,inpatient_services,critical_care,neonatal_services}', 8.7, 'Open 24 hrs', '10% OFF', true, '{"id":1,"name":"Cana Hospital","facilityVerificationStatus":"APPROVED","createdAt":"2024-01-10T08:30:00.000Z","updatedAt":"2026-05-12T08:30:00.000Z"}', '2024-01-10T08:30:00.000Z', '2026-05-12T08:30:00.000Z'),

(2, 'Aga Khan University Hospital', 'KMPDC-NRB-0002', 'P.O. Box 30270-00100, Nairobi', 'SPECIALIZED TERTIARY REFERRAL HOSPITAL', 'LEVEL 6A', 254, 'Nairobi', 'OPERATIONAL', 'LR No. 1870/IX/45', -1.2625, 36.8186, '3rd Parklands Avenue, Parklands', '+254 20 3662000', 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800', 3.4, false, null, 'APPROVED', '{outpatient_primary_care,inpatient_services,critical_care,neonatal_services,preventive_public_health}', 9.1, 'Open 24 hrs', null, true, '{"id":2,"name":"Aga Khan University Hospital","facilityVerificationStatus":"APPROVED","createdAt":"2024-02-02T10:00:00.000Z","updatedAt":"2026-05-08T10:00:00.000Z"}', '2024-02-02T10:00:00.000Z', '2026-05-08T10:00:00.000Z'),

(3, 'Kenyatta National Hospital', 'KMPDC-NRB-0003', 'P.O. Box 20723-00202, Nairobi', 'NATIONAL TEACHING AND REFERRAL HOSPITAL', 'LEVEL 6B', 1800, 'Nairobi', 'OPERATIONAL', 'LR No. 209/567', -1.3009, 36.8065, 'Hospital Road, Upper Hill', '+254 20 2726300', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800', 2.1, false, null, 'PENDING', '{outpatient_primary_care,inpatient_services,critical_care,neonatal_services,preventive_public_health,conditional_services}', 7.2, 'Open 24 hrs', null, false, null, '2024-01-15T09:15:00.000Z', '2026-04-20T09:15:00.000Z'),

(4, 'Gertrude''s Children''s Hospital', 'KMPDC-NRB-0004', 'P.O. Box 42325-00100, Nairobi', 'HOSPITAL LEVEL 5', 'LEVEL 5', 110, 'Nairobi', 'OPERATIONAL', 'LR No. 330/12', -1.2486, 36.8050, 'Muthaiga Road, Muthaiga', '+254 20 7206000', 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800', 4.8, true, '{"id":102,"code":"GERTKIDS15","description":"15% off paediatric wellness check-ups","discountType":"PERCENTAGE","discountValue":"15","validUntil":"2026-09-30T23:59:59.000Z","maximumDiscountAmount":"2500"}', 'APPROVED', '{outpatient_primary_care,inpatient_services,neonatal_services}', 8.9, 'Open 24 hrs', '15% OFF', true, '{"id":4,"name":"Gertrude''s Children''s Hospital","facilityVerificationStatus":"APPROVED","createdAt":"2024-03-12T11:45:00.000Z","updatedAt":"2026-05-01T11:45:00.000Z"}', '2024-03-12T11:45:00.000Z', '2026-05-01T11:45:00.000Z'),

(5, 'MP Shah Hospital', 'KMPDC-NRB-0005', 'P.O. Box 14497-00800, Nairobi', 'HOSPITAL LEVEL 5', 'LEVEL 5', 210, 'Nairobi', 'OPERATIONAL', 'LR No. 1870/IX/120', -1.2631, 36.8126, 'Shivachi Road, Parklands', '+254 20 4291000', 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=800', 3.0, true, '{"id":103,"code":"MPSHAHLAB","description":"KES 500 off laboratory tests","discountType":"FIXED_AMOUNT","discountValue":"500","validUntil":"2026-08-31T23:59:59.000Z","maximumDiscountAmount":"500"}', 'APPROVED', '{outpatient_primary_care,inpatient_services,critical_care,preventive_public_health}', 8.4, 'Open 24 hrs', 'KES 500 OFF', true, '{"id":5,"name":"MP Shah Hospital","facilityVerificationStatus":"APPROVED","createdAt":"2024-02-20T14:20:00.000Z","updatedAt":"2026-04-28T14:20:00.000Z"}', '2024-02-20T14:20:00.000Z', '2026-04-28T14:20:00.000Z'),

(6, 'Coast General Teaching and Referral Hospital', 'KMPDC-MSA-0006', 'P.O. Box 90231-80100, Mombasa', 'COUNTY REFERRAL HOSPITAL', 'LEVEL 5', 700, 'Mombasa', 'OPERATIONAL', 'MN/I/1234', -4.0573, 39.6657, 'Kisauni Road, Mombasa', '+254 41 2314204', 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800', 0.9, false, null, 'APPROVED', '{outpatient_primary_care,inpatient_services,critical_care,preventive_public_health}', 7.6, 'Open 24 hrs', null, true, '{"id":6,"name":"Coast General Teaching and Referral Hospital","facilityVerificationStatus":"APPROVED","createdAt":"2024-04-05T07:50:00.000Z","updatedAt":"2026-03-30T07:50:00.000Z"}', '2024-04-05T07:50:00.000Z', '2026-03-30T07:50:00.000Z'),

(7, 'Pandya Memorial Hospital', 'KMPDC-MSA-0007', 'P.O. Box 90434-80100, Mombasa', 'HOSPITAL LEVEL 4', 'LEVEL 4', 90, 'Mombasa', 'OPERATIONAL', 'MN/I/2210', -4.0617, 39.6700, 'Dedan Kimathi Avenue, Mombasa', '+254 41 2314253', 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=800', 1.7, true, '{"id":104,"code":"PANDYA20","description":"20% off maternity package deposits","discountType":"PERCENTAGE","discountValue":"20","validUntil":"2026-10-15T23:59:59.000Z","maximumDiscountAmount":"8000"}', 'APPROVED', '{outpatient_primary_care,inpatient_services,neonatal_services}', 8.0, 'Closes 10:00 PM', '20% OFF', true, '{"id":7,"name":"Pandya Memorial Hospital","facilityVerificationStatus":"APPROVED","createdAt":"2024-05-18T13:10:00.000Z","updatedAt":"2026-04-11T13:10:00.000Z"}', '2024-05-18T13:10:00.000Z', '2026-04-11T13:10:00.000Z'),

(8, 'Jaramogi Oginga Odinga Teaching and Referral Hospital', 'KMPDC-KSM-0008', 'P.O. Box 849-40100, Kisumu', 'COUNTY REFERRAL HOSPITAL', 'LEVEL 5', 457, 'Kisumu', 'OPERATIONAL', 'Kisumu/Municipality/Block 8/55', -0.0917, 34.7680, 'Kakamega Road, Kisumu', '+254 57 2024480', 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800', 2.6, false, null, 'PENDING', '{outpatient_primary_care,inpatient_services,critical_care,preventive_public_health}', 7.0, 'Open 24 hrs', null, false, null, '2024-06-01T09:00:00.000Z', '2026-02-25T09:00:00.000Z'),

(9, 'Avenue Healthcare Kisumu', 'KMPDC-KSM-0009', 'P.O. Box 1320-40100, Kisumu', 'MEDICAL CENTRE', 'LEVEL 3B', 40, 'Kisumu', 'OPERATIONAL', 'Kisumu/Block 12/210', -0.1022, 34.7617, 'Oginga Odinga Street, Kisumu CBD', '+254 709 691000', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', 1.1, true, '{"id":105,"code":"AVENUE12","description":"12% off outpatient consultation fees","discountType":"PERCENTAGE","discountValue":"12","validUntil":"2026-11-30T23:59:59.000Z","maximumDiscountAmount":"1500"}', 'APPROVED', '{outpatient_primary_care,preventive_public_health}', 8.2, 'Closes 8:00 PM', '12% OFF', true, '{"id":9,"name":"Avenue Healthcare Kisumu","facilityVerificationStatus":"APPROVED","createdAt":"2024-07-09T15:30:00.000Z","updatedAt":"2026-05-05T15:30:00.000Z"}', '2024-07-09T15:30:00.000Z', '2026-05-05T15:30:00.000Z'),

(10, 'Goodlife Pharmacy Yaya Centre', 'PPB-NRB-0010', 'P.O. Box 24530-00100, Nairobi', 'MEDICAL CLINIC', 'LEVEL 2', 0, 'Nairobi', 'OPERATIONAL', 'LR No. 209/8401', -1.2935, 36.7826, 'Yaya Centre, Argwings Kodhek Road', '+254 730 945000', 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=800', 0.6, true, '{"id":106,"code":"GOODLIFE5","description":"5% off all over-the-counter medication","discountType":"PERCENTAGE","discountValue":"5","validUntil":null,"maximumDiscountAmount":"1000"}', 'APPROVED', '{outpatient_primary_care,preventive_public_health}', 8.6, 'Closes 9:00 PM', '5% OFF', true, '{"id":10,"name":"Goodlife Pharmacy Yaya Centre","facilityVerificationStatus":"APPROVED","createdAt":"2024-08-14T12:00:00.000Z","updatedAt":"2026-05-10T12:00:00.000Z"}', '2024-08-14T12:00:00.000Z', '2026-05-10T12:00:00.000Z'),

(11, 'Eldoret Hospital', 'KMPDC-USG-0011', 'P.O. Box 2251-30100, Eldoret', 'HOSPITAL LEVEL 4', 'LEVEL 4', 120, 'Uasin Gishu', 'OPERATIONAL', 'Eldoret Municipality/Block 5/88', 0.5143, 35.2698, 'Elgon View, Eldoret', '+254 53 2033656', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800', 5.3, false, null, 'APPROVED', '{outpatient_primary_care,inpatient_services,critical_care}', 7.8, 'Open 24 hrs', null, true, '{"id":11,"name":"Eldoret Hospital","facilityVerificationStatus":"APPROVED","createdAt":"2024-09-22T08:00:00.000Z","updatedAt":"2026-03-18T08:00:00.000Z"}', '2024-09-22T08:00:00.000Z', '2026-03-18T08:00:00.000Z'),

(12, 'Nakuru Level 5 Hospital', 'KMPDC-NKR-0012', 'P.O. Box 71-20100, Nakuru', 'COUNTY REFERRAL HOSPITAL', 'LEVEL 5', 580, 'Nakuru', 'OPERATIONAL', 'Nakuru Municipality/Block 14/3', -0.2935, 36.0800, 'Kenyatta Avenue, Nakuru', '+254 51 2212286', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800', 3.9, true, '{"id":107,"code":"NAKURUMAT","description":"KES 1,000 off maternity admission","discountType":"FIXED_AMOUNT","discountValue":"1000","validUntil":"2026-12-15T23:59:59.000Z","maximumDiscountAmount":"1000"}', 'APPROVED', '{outpatient_primary_care,inpatient_services,neonatal_services,preventive_public_health}', 7.4, 'Open 24 hrs', 'KES 1,000 OFF', true, null, '2024-10-30T10:30:00.000Z', '2026-02-10T10:30:00.000Z');

-- ============================================================
-- Facility services (47 records)
-- ============================================================
insert into facility_services (id, facility_id, name, code, category) values
('svc-1-1', 1, 'General Outpatient Consultation', 'OPD-GEN', 'outpatient_primary_care'),
('svc-1-2', 1, 'Specialist Clinics', 'OPD-SPEC', 'outpatient_primary_care'),
('svc-1-3', 1, 'General Medical Ward', 'IPD-MED', 'inpatient_services'),
('svc-1-4', 1, 'Surgical Ward', 'IPD-SURG', 'inpatient_services'),
('svc-1-5', 1, 'Accident & Emergency', 'CC-AE', 'critical_care'),
('svc-1-6', 1, 'Intensive Care Unit', 'CC-ICU', 'critical_care'),
('svc-1-7', 1, 'Newborn Unit', 'NEO-NBU', 'neonatal_services'),
('svc-2-1', 2, 'Family Medicine Clinic', 'OPD-FAM', 'outpatient_primary_care'),
('svc-2-2', 2, 'Cardiology Clinic', 'OPD-CARD', 'outpatient_primary_care'),
('svc-2-3', 2, 'Oncology Inpatient', 'IPD-ONC', 'inpatient_services'),
('svc-2-4', 2, 'Critical Care Unit', 'CC-CCU', 'critical_care'),
('svc-2-5', 2, 'Neonatal Intensive Care', 'NEO-NICU', 'neonatal_services'),
('svc-2-6', 2, 'Health Screening Packages', 'PREV-SCR', 'preventive_public_health'),
('svc-3-1', 3, 'Casualty & Outpatient', 'OPD-CAS', 'outpatient_primary_care'),
('svc-3-2', 3, 'Renal Unit', 'IPD-REN', 'inpatient_services'),
('svc-3-3', 3, 'Trauma Centre', 'CC-TRA', 'critical_care'),
('svc-3-4', 3, 'Immunisation Clinic', 'PREV-IMM', 'preventive_public_health'),
('svc-4-1', 4, 'Paediatric Outpatient', 'OPD-PAED', 'outpatient_primary_care'),
('svc-4-2', 4, 'Child Wellness Clinic', 'OPD-WELL', 'outpatient_primary_care'),
('svc-4-3', 4, 'Paediatric Inpatient Ward', 'IPD-PAED', 'inpatient_services'),
('svc-4-4', 4, 'Newborn Unit', 'NEO-NBU', 'neonatal_services'),
('svc-5-1', 5, 'Outpatient Consultation', 'OPD-GEN', 'outpatient_primary_care'),
('svc-5-2', 5, 'Medical Ward', 'IPD-MED', 'inpatient_services'),
('svc-5-3', 5, 'High Dependency Unit', 'CC-HDU', 'critical_care'),
('svc-5-4', 5, 'Laboratory Services', 'PREV-LAB', 'preventive_public_health'),
('svc-6-1', 6, 'Outpatient Department', 'OPD-GEN', 'outpatient_primary_care'),
('svc-6-2', 6, 'General Wards', 'IPD-GEN', 'inpatient_services'),
('svc-6-3', 6, 'Emergency Department', 'CC-ED', 'critical_care'),
('svc-6-4', 6, 'Public Health Clinic', 'PREV-PH', 'preventive_public_health'),
('svc-7-1', 7, 'Outpatient Clinic', 'OPD-GEN', 'outpatient_primary_care'),
('svc-7-2', 7, 'Maternity Ward', 'IPD-MAT', 'inpatient_services'),
('svc-7-3', 7, 'Newborn Care', 'NEO-NBU', 'neonatal_services'),
('svc-8-1', 8, 'Outpatient Services', 'OPD-GEN', 'outpatient_primary_care'),
('svc-8-2', 8, 'General Inpatient Wards', 'IPD-GEN', 'inpatient_services'),
('svc-8-3', 8, 'Emergency & Casualty', 'CC-ED', 'critical_care'),
('svc-8-4', 8, 'Reproductive Health Clinic', 'PREV-RH', 'preventive_public_health'),
('svc-9-1', 9, 'Outpatient Consultation', 'OPD-GEN', 'outpatient_primary_care'),
('svc-9-2', 9, 'Wellness & Screening', 'PREV-SCR', 'preventive_public_health'),
('svc-10-1', 10, 'Pharmacy Dispensing', 'OPD-PHARM', 'outpatient_primary_care'),
('svc-10-2', 10, 'Health Checks', 'PREV-CHK', 'preventive_public_health'),
('svc-11-1', 11, 'Outpatient Department', 'OPD-GEN', 'outpatient_primary_care'),
('svc-11-2', 11, 'Surgical Ward', 'IPD-SURG', 'inpatient_services'),
('svc-11-3', 11, 'Emergency Unit', 'CC-ED', 'critical_care'),
('svc-12-1', 12, 'Outpatient Services', 'OPD-GEN', 'outpatient_primary_care'),
('svc-12-2', 12, 'Maternity Ward', 'IPD-MAT', 'inpatient_services'),
('svc-12-3', 12, 'Newborn Unit', 'NEO-NBU', 'neonatal_services'),
('svc-12-4', 12, 'Immunisation & Antenatal', 'PREV-ANC', 'preventive_public_health');

-- ============================================================
-- Service categories (6 records)
-- ============================================================
insert into service_categories (category, display_name, count) values
('outpatient_primary_care', 'Outpatient Care', 12),
('inpatient_services', 'Inpatient Services', 9),
('critical_care', 'Emergency', 7),
('neonatal_services', 'Neonatal Services', 5),
('preventive_public_health', 'Preventive & Public Health', 8),
('conditional_services', 'Conditional Services', 1);

-- ============================================================
-- Discount codes (5 records)
-- ============================================================
insert into discount_codes (id, code, description, discount_type, discount_value, currency, context, discount_amount, valid_from, valid_until, minimum_order_amount, maximum_discount_amount, is_active, is_valid) values
(1, 'WELCOME15', '15% off your first facility payment with Jireh', 'PERCENTAGE', '15', '{"id":1,"code":"KES","name":"Kenyan Shilling","symbol":"KES"}', 'PROMOTIONAL', '0', '2026-01-01T00:00:00.000Z', '2026-12-31T23:59:59.000Z', '1000', '3000', true, true),
(2, 'AFYA500', 'KES 500 off lab tests and diagnostics', 'FIXED_AMOUNT', '500', '{"id":1,"code":"KES","name":"Kenyan Shilling","symbol":"KES"}', 'ORDER_BASED', '500', '2026-03-01T00:00:00.000Z', '2026-09-30T23:59:59.000Z', '2000', '500', true, true),
(3, 'MAMA10', '10% off maternity and antenatal care', 'PERCENTAGE', '10', '{"id":1,"code":"KES","name":"Kenyan Shilling","symbol":"KES"}', 'PROMOTIONAL', '0', null, null, null, '5000', true, true),
(4, 'PHARMA5', '5% off pharmacy purchases at partner outlets', 'PERCENTAGE', '5', '{"id":1,"code":"KES","name":"Kenyan Shilling","symbol":"KES"}', 'ORDER_BASED', '0', '2026-02-01T00:00:00.000Z', '2026-11-30T23:59:59.000Z', '500', '1000', true, true),
(5, 'EXPIRED20', 'Past promotion — 20% off (no longer valid)', 'PERCENTAGE', '20', '{"id":1,"code":"KES","name":"Kenyan Shilling","symbol":"KES"}', 'PROMOTIONAL', '0', '2025-01-01T00:00:00.000Z', '2025-12-31T23:59:59.000Z', null, '4000', false, false);

-- ============================================================
-- Facility reviews (8 records) — all assigned to demo user
-- ============================================================
insert into facility_reviews (id, facility_id, user_id, payment_id, nps_score, loved_most, could_do_better, make_it_a_ten, created_at) values
('rev-1-1', 1, '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'pay-1-1', 9, 'Quick triage and friendly nurses', 'Parking was tight', 'Shorter pharmacy queue', '2026-04-02T10:00:00.000Z'),
('rev-1-2', 1, '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'pay-1-2', 8, 'Clean wards', 'Billing took a while', '', '2026-04-20T14:30:00.000Z'),
('rev-1-3', 1, '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'pay-1-3', 10, 'Excellent specialist care', '', 'Already perfect', '2026-05-05T09:15:00.000Z'),
('rev-2-1', 2, '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'pay-2-1', 10, 'World-class facilities', 'Pricey', '', '2026-03-18T11:00:00.000Z'),
('rev-2-2', 2, '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'pay-2-2', 9, 'Very professional staff', 'Long wait for results', 'Faster results', '2026-04-25T16:45:00.000Z'),
('rev-4-1', 4, '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'pay-4-1', 9, 'Great with kids', '', 'More play areas', '2026-05-01T08:00:00.000Z'),
('rev-6-1', 6, '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'pay-6-1', 7, 'Affordable', 'Crowded outpatient', 'Less waiting time', '2026-02-28T13:20:00.000Z'),
('rev-6-2', 6, '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 'pay-6-2', 8, 'Helpful staff', 'Old facilities', '', '2026-03-15T10:10:00.000Z');

-- ============================================================
-- Recent searches (2 records) — demo user
-- ============================================================
insert into recent_searches (id, user_id, facility_id, created_at) values
('recent-seed-1', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 1, now()),
('recent-seed-2', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 10, now());

-- ============================================================
-- Preferred providers (1 record) — demo user
-- Fixed: original fixture had id=2 with name "Cana Hospital" (mismatch); using id=1 (actual Cana Hospital)
-- ============================================================
insert into preferred_providers (id, user_id, facility_id, created_at) values
('preferred-seed-1', '6b4d8e63-16c9-4aa6-ae9c-73820311007a', 1, now());
