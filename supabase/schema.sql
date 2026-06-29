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
  limit 1;
$$;

-- ─── Invite-code lookup (runs as definer to bypass RLS for unauthenticated users) ──
create or replace function public.get_household_by_invite_code(code text)
returns table(id uuid, name text, invite_code text)
language sql
security definer
set search_path = public
as $$
  select id, name, invite_code
  from public.households
  where invite_code = upper(trim(code))
  limit 1;
$$;

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

-- household_members: members can read their own household's members
create policy "members can read household_members"
  on public.household_members for select
  using (household_id = public.my_household_id());

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
