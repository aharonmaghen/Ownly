-- Fix: joined member sees no household data
--
-- A user who joined a household via invite code could see an empty household
-- with none of the shared categories/envelopes/transactions, even though their
-- household_members row was correct.
--
-- Cause: my_household_id() resolved the household with `limit 1` and no
-- `order by`. When a user had more than one membership row (e.g. an empty
-- auto-created household left behind before joining another via code), the pick
-- was non-deterministic and could lock onto the wrong, empty household, making
-- every RLS-scoped query return zero rows. The household_members SELECT policy
-- compounded this by hiding the user's other membership rows from themselves.
--
-- Idempotent — safe to run on the live database.

-- ─── 1. Deterministic household resolution (most recently joined wins) ────────
create or replace function public.my_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id
  from public.household_members
  where user_id = auth.uid()
  order by joined_at desc, household_id
  limit 1;
$$;

-- ─── 2. A user can always read their OWN membership rows ──────────────────────
drop policy if exists "members can read household_members" on public.household_members;
create policy "members can read household_members"
  on public.household_members for select
  using (user_id = auth.uid() or household_id = public.my_household_id());
