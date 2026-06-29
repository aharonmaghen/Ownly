-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Households ───────────────────────────────────────────────────────────────
create table public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'My Household',
  invite_code text not null unique default upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at  timestamptz not null default now()
);

-- ─── Household members ────────────────────────────────────────────────────────
create table public.household_members (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner', 'member')),
  joined_at    timestamptz not null default now(),
  unique (household_id, user_id)
);

-- ─── Budget categories ────────────────────────────────────────────────────────
create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null,
  monthly_limit numeric(12,2) not null default 0,
  icon          text not null default 'cart-outline',
  color         text not null default '#0284c7',
  created_at    timestamptz not null default now()
);

-- ─── Envelopes (savings allocations) ─────────────────────────────────────────
create table public.envelopes (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null,
  balance       numeric(12,2) not null default 0,
  target_amount numeric(12,2),
  icon          text not null default 'save-outline',
  color         text not null default '#0284c7',
  created_at    timestamptz not null default now()
);

-- ─── Transactions ─────────────────────────────────────────────────────────────
create type public.transaction_type as enum (
  'income', 'expense', 'envelope_deposit', 'envelope_withdrawal', 'adjustment'
);

create table public.transactions (
  id                    uuid primary key default gen_random_uuid(),
  household_id          uuid not null references public.households(id) on delete cascade,
  type                  public.transaction_type not null,
  amount                numeric(12,2) not null,
  note                  text not null default '',
  category_id           uuid references public.categories(id) on delete set null,
  envelope_id           uuid references public.envelopes(id) on delete set null,
  is_negative_adjustment boolean,
  timestamp             timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

-- ─── Helper: current user's household ────────────────────────────────────────
-- Deterministic and data-aware: if a user somehow belongs to more than one
-- household (e.g. an empty household left behind by a stray signup before they
-- joined another via invite code), prefer the household that actually holds
-- data, then break ties by most recently joined. Without an explicit ORDER BY
-- the `limit 1` is non-deterministic and can lock onto the wrong (empty)
-- household, making every RLS-scoped query return zero rows.
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

-- ─── Signup helper: atomically creates or joins a household ──────────────────
-- Runs as SECURITY DEFINER so it bypasses RLS and works even before the user
-- has an active session (email-confirmation flow included).
-- Callable by anon so it works immediately after supabase.auth.signUp().
create or replace function public.complete_household_signup(
  p_invite_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id     uuid := auth.uid();
  v_hh_id       uuid;
  v_hh_name     text;
  v_invite_code text;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if p_invite_code is not null and trim(p_invite_code) <> '' then
    -- Join an existing household by invite code
    select id, name, invite_code
      into v_hh_id, v_hh_name, v_invite_code
      from households
     where invite_code = upper(trim(p_invite_code))
     limit 1;
    if v_hh_id is null then
      raise exception 'Invalid invite code';
    end if;
    insert into household_members (household_id, user_id, role)
    values (v_hh_id, v_user_id, 'member')
    on conflict do nothing;
  else
    -- Create a brand-new household for this user
    insert into households (name)
    values ('My Household')
    returning id, name, invite_code
    into v_hh_id, v_hh_name, v_invite_code;
    insert into household_members (household_id, user_id, role)
    values (v_hh_id, v_user_id, 'owner');
  end if;

  return jsonb_build_object(
    'id',          v_hh_id,
    'name',        v_hh_name,
    'invite_code', v_invite_code
  );
end;
$$;

-- Only authenticated users can call this (requires email confirmation to be disabled in Supabase)
revoke execute on function public.complete_household_signup(text) from anon;
grant  execute on function public.complete_household_signup(text) to authenticated;

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.categories        enable row level security;
alter table public.envelopes         enable row level security;
alter table public.transactions      enable row level security;

-- households: members can read their own household
create policy "household members can read"
  on public.households for select
  using (id = public.my_household_id());

-- households: members can update their own household (e.g. rename)
create policy "household members can update"
  on public.households for update
  using (id = public.my_household_id());

-- household_members: a user can always read their OWN membership rows, plus the
-- other members of the household they're currently scoped to. Scoping the read
-- to `household_id = my_household_id()` alone hid a user's other membership rows
-- from themselves, which masked the wrong-household bug above.
create policy "members can read household_members"
  on public.household_members for select
  using (user_id = auth.uid() or household_id = public.my_household_id());

-- household_members: users can insert themselves (join)
create policy "users can join a household"
  on public.household_members for insert
  with check (user_id = auth.uid());

-- categories
create policy "household members can read categories"
  on public.categories for select
  using (household_id = public.my_household_id());

create policy "household members can insert categories"
  on public.categories for insert
  with check (household_id = public.my_household_id());

create policy "household members can update categories"
  on public.categories for update
  using (household_id = public.my_household_id());

create policy "household members can delete categories"
  on public.categories for delete
  using (household_id = public.my_household_id());

-- envelopes
create policy "household members can read envelopes"
  on public.envelopes for select
  using (household_id = public.my_household_id());

create policy "household members can insert envelopes"
  on public.envelopes for insert
  with check (household_id = public.my_household_id());

create policy "household members can update envelopes"
  on public.envelopes for update
  using (household_id = public.my_household_id());

create policy "household members can delete envelopes"
  on public.envelopes for delete
  using (household_id = public.my_household_id());

-- transactions
create policy "household members can read transactions"
  on public.transactions for select
  using (household_id = public.my_household_id());

create policy "household members can insert transactions"
  on public.transactions for insert
  with check (household_id = public.my_household_id());

create policy "household members can delete transactions"
  on public.transactions for delete
  using (household_id = public.my_household_id());
