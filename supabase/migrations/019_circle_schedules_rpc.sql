-- RPC to fetch upcoming schedules for a user's circle connections.
-- Runs as SECURITY DEFINER so it can read across RLS-protected tables.
-- Returns schedules for: the calling user + their circle members + people who added them.
-- Limited to next 30 days. Includes cost from profile cost_estimates.

create or replace function get_circle_schedules()
returns json
language plpgsql
security definer
as $$
declare
  my_id uuid := auth.uid();
  my_phone text;
  result json;
begin
  -- Get my phone
  select phone into my_phone from profiles where id = my_id;

  with
  -- People in my circle
  my_members as (
    select nm.id as network_member_id, nm.first_name, nm.last_name, nm.phone_number,
           p.id as profile_id
    from network_members nm
    join profiles p on p.phone = nm.phone_number
    where nm.user_id = my_id
  ),
  -- People who added me to their circle
  circle_owners as (
    select p.id as profile_id, p.first_name, p.last_name, p.phone,
           p.id::text as network_member_id
    from network_members nm
    join profiles p on p.id = nm.user_id
    where nm.phone_number = my_phone
      and nm.user_id != my_id
  ),
  -- All connected user IDs (self + direct connections, deduplicated)
  connected_users as (
    select my_id as profile_id, 'You' as first_name, '' as last_name,
           my_phone as phone, my_id::text as network_member_id, true as is_self
    union
    select profile_id, first_name, last_name, phone_number as phone,
           network_member_id, false as is_self
    from my_members
    union
    select profile_id, first_name, last_name, phone,
           network_member_id, false as is_self
    from circle_owners
  ),
  -- Deduplicate by profile_id (keep first match)
  deduped as (
    select distinct on (profile_id)
      profile_id, first_name, last_name, phone, network_member_id, is_self
    from connected_users
    order by profile_id, is_self desc
  ),
  -- Extract medication costs from each user's profile
  med_costs as (
    select d.profile_id,
           lower(m->>'name') as med_name,
           (m->>'estimatedCostPerRefill')::numeric as cost
    from deduped d
    join profiles p on p.id = d.profile_id,
    lateral jsonb_array_elements(p.cost_estimates->'medications') as m
    where p.cost_estimates is not null
      and p.cost_estimates->'medications' is not null
  ),
  -- Extract test costs from each user's profile
  test_costs as (
    select d.profile_id,
           lower(t->>'name') as test_name,
           (t->>'estimatedCostPerTest')::numeric as cost
    from deduped d
    join profiles p on p.id = d.profile_id,
    lateral jsonb_array_elements(p.cost_estimates->'tests') as t
    where p.cost_estimates is not null
      and p.cost_estimates->'tests' is not null
  ),
  -- Refill schedules
  refills as (
    select
      'refill-' || rs.id as id,
      d.network_member_id as member_id,
      d.first_name as member_first_name,
      d.last_name as member_last_name,
      d.phone as member_phone,
      'MEDICATION' as type,
      rs.medication_name as name,
      rs.next_date::text as next_date,
      rs.status as db_status,
      d.is_self,
      coalesce(mc.cost, 0) as cost
    from refill_schedules rs
    join deduped d on d.profile_id = rs.user_id
    left join med_costs mc on mc.profile_id = rs.user_id
      and mc.med_name = lower(rs.medication_name)
    where rs.status != 'CANCELLED'
      and rs.next_date <= current_date + interval '30 days'
  ),
  -- Test schedules
  tests as (
    select
      'test-' || ts.id as id,
      d.network_member_id as member_id,
      d.first_name as member_first_name,
      d.last_name as member_last_name,
      d.phone as member_phone,
      'TEST' as type,
      ts.test_name as name,
      ts.next_date::text as next_date,
      ts.status as db_status,
      d.is_self,
      coalesce(tc.cost, 0) as cost
    from test_schedules ts
    join deduped d on d.profile_id = ts.user_id
    left join test_costs tc on tc.profile_id = ts.user_id
      and tc.test_name = lower(ts.test_name)
    where ts.status != 'CANCELLED'
      and ts.next_date <= current_date + interval '30 days'
  ),
  -- Combined
  all_events as (
    select * from refills
    union all
    select * from tests
  )
  select coalesce(json_agg(
    json_build_object(
      'id', id,
      'memberId', member_id,
      'memberFirstName', member_first_name,
      'memberLastName', member_last_name,
      'memberPhone', member_phone,
      'type', type,
      'name', name,
      'nextDate', next_date,
      'dbStatus', db_status,
      'isSelf', is_self,
      'cost', cost
    ) order by next_date
  ), '[]'::json) into result
  from all_events;

  return result;
end;
$$;
