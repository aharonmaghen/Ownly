-- OPTIONAL cleanup: remove leftover empty "stray" households created by the old
-- on_auth_user_created trigger (see 0001). Run this only AFTER 0001.
--
-- This DELETES rows, but is conservative:
--   * Only households with NO categories, envelopes, or transactions qualify.
--   * A household is kept if it is the canonical (data-aware) household for any
--     of its members, so no user is ever left with zero households and no
--     household holding data is ever removed.
--   * Deleting a household cascades to its household_members rows only.
--
-- Safe to run more than once.

with ranked as (
  select hm.user_id,
         hm.household_id,
         row_number() over (
           partition by hm.user_id
           order by
             (exists (select 1 from public.categories   c where c.household_id = hm.household_id)
              or exists (select 1 from public.envelopes    e where e.household_id = hm.household_id)
              or exists (select 1 from public.transactions t where t.household_id = hm.household_id)) desc,
             hm.joined_at desc,
             hm.household_id
         ) as rn
  from public.household_members hm
),
kept as (
  select household_id from ranked where rn = 1
),
empty_hh as (
  select h.id
  from public.households h
  where not exists (select 1 from public.categories   c where c.household_id = h.id)
    and not exists (select 1 from public.envelopes    e where e.household_id = h.id)
    and not exists (select 1 from public.transactions t where t.household_id = h.id)
)
delete from public.households h
using empty_hh e
where h.id = e.id
  and h.id not in (select household_id from kept);
