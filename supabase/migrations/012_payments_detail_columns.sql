-- Add detail columns to payments table for the payment details page.
-- These store the nested structures that PatientViewPaymentDetails.tsx expects.

alter table payments
  add column if not exists facility_id integer references facilities(id),
  add column if not exists payment_splits jsonb default '[]',
  add column if not exists cashback_details jsonb default '[]',
  add column if not exists user_info jsonb;

-- Backfill: build payment_splits from funding_sources
update payments set
  payment_splits = (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'id', 'split-' || ordinality::text,
        'createdAt', payments.created_at,
        'paymentSplitAmount', (elem->>'amount')::numeric,
        'wallet', jsonb_build_object('type', elem->>'source'),
        'loan', null
      )
    ), '[]'::jsonb)
    from jsonb_array_elements(payments.funding_sources) with ordinality as t(elem, ordinality)
  ),
  user_info = '{"firstName": "Wanjiru", "lastName": "Kamau"}'::jsonb,
  cashback_details = case
    when cashback_amount > 0 then jsonb_build_array(
      jsonb_build_object('source', 'Jireh cashback', 'amount', cashback_amount)
    )
    else '[]'::jsonb
  end
where payment_splits = '[]'::jsonb or payment_splits is null;
