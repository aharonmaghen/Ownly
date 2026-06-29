-- Drop the redundant on_auth_user_created trigger that auto-created a new
-- household for every new auth user.
--
-- When a user signed up using an invite code, two things happened:
--   1. supabase.auth.signUp() fired this trigger → handle_new_user() created
--      a fresh "My Household" (user as owner).
--   2. complete_household_signup(inviteCode) ran and added them as a member
--      of the invited household.
-- The user ended up with two household memberships instead of one.
--
-- complete_household_signup() already handles both the "new household" and
-- "join by invite code" cases, so the trigger is entirely redundant.
-- Idempotent — safe to run even if the trigger was already removed by 0001.

drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
