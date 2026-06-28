-- ============================================================
-- QuoteForge — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. WORKSHOP PROFILES
-- One row per registered user, extends Supabase's built-in auth.users table.
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  company_name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Automatically create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, company_name)
  values (new.id, '');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. CLIENTS
-- Foreign clients saved by each workshop, reusable across quotes.
create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  contact text,
  country text,
  created_at timestamptz default now()
);

alter table public.clients enable row level security;

create policy "Users can view their own clients"
  on public.clients for select
  using (auth.uid() = user_id);

create policy "Users can insert their own clients"
  on public.clients for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own clients"
  on public.clients for update
  using (auth.uid() = user_id);

create policy "Users can delete their own clients"
  on public.clients for delete
  using (auth.uid() = user_id);


-- 3. QUOTES
-- Each saved quote, with parts stored as JSON (flexible, avoids a separate parts table for v1).
create table if not exists public.quotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  client_id uuid references public.clients on delete set null,
  client_name_snapshot text,
  lead_time text,
  contact text,
  parts jsonb not null default '[]'::jsonb,
  grand_total numeric(12,2) not null default 0,
  created_at timestamptz default now()
);

alter table public.quotes enable row level security;

create policy "Users can view their own quotes"
  on public.quotes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own quotes"
  on public.quotes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own quotes"
  on public.quotes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own quotes"
  on public.quotes for delete
  using (auth.uid() = user_id);

-- Helpful index for sorting quote history by date
create index if not exists quotes_user_created_idx
  on public.quotes (user_id, created_at desc);
