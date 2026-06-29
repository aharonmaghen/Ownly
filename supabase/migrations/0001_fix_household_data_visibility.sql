-- Fix: joined member (and even the owner) sees no household data
--
-- Two compounding causes:
--
--  1. A leftover trigger `on_auth_user_created` -> handle_new_user() created a
--     fresh "My Household" for EVERY new auth user. Signup already creates or
--     joins a household explicitly via complete_household_signup(), so the
--     trigger only produced a duplicate: a joiner ended up in the real
--     household PLUS a stray empty one, and a brand-new user got two households.
--
--  2. my_household_id() resolved the household with `limit 1` and no `order by`,
--     so when a user had more than one membership it non-deterministically
--     locked onto one — often the empty stray — and every RLS-scoped query
--     returned zero rows. The household_members SELECT policy compounded this
--     by hiding the user's other membership rows from themselves.
--
-- This migration is idempotent and performs NO deletions. Existing stray
-- households are made harmless (resolution now prefers the household with data).
-- To also remove the leftover empty households, run the optional
-- 0002_cleanup_orphan_households.sql afterwards.

-- ─── 1. Remove the redundant signup trigger (root cause of duplicates) ────────
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ─── 2. Deterministic, data-aware household resolution ────────────────────────
-- Prefer the household that actually holds data; tiebreak by most recently
-- joined. This keeps both the owner (whose data may sit in the older household)
-- and the joiner pointed at the correct, populated household.
create or replace function public.my_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select hm.household_id
  from public.household_members hm
  where hm.user_id = auth.uid()
  order by
    (exists (select 1 from public.categories   c where c.household_id = hm.household_id)
     or exists (select 1 from public.envelopes    e where e.household_id = hm.household_id)
     or exists (select 1 from public.transactions t where t.household_id = hm.household_id)) desc,
    hm.joined_at desc,
    hm.household_id
  limit 1;
$$;

-- ─── 3. A user can always read their OWN membership rows ──────────────────────
drop policy if exists "members can read household_members" on public.household_members;
create policy "members can read household_members"
  on public.household_members for select
  using (user_id = auth.uid() or household_id = public.my_household_id());
