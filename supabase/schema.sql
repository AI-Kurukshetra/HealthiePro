create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  dob date,
  role text not null default 'patient' check (role in ('patient', 'provider', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  record_type text not null,
  record_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  provider_name text,
  starts_at timestamptz not null,
  consultation_url text,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.care_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null,
  status text not null default 'active' check (status in ('active','paused','completed')),
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.care_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  care_plan_id uuid not null references public.care_plans(id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  reminder_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.provider_availability (
  id uuid primary key default gen_random_uuid(),
  provider_user_id uuid not null references auth.users(id) on delete cascade,
  provider_name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null default 'in_app' check (channel in ('in_app','email','sms')),
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id text,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.health_records enable row level security;
alter table public.appointments enable row level security;
alter table public.care_plans enable row level security;
alter table public.care_tasks enable row level security;
alter table public.provider_availability enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p where p.id = uid and p.role = 'admin'
  );
$$;

drop policy if exists "Users can manage own profile" on public.profiles;
create policy "Users can manage own profile"
on public.profiles
for all
using (auth.uid() = id or public.is_admin(auth.uid()))
with check (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "Users can manage own health_records" on public.health_records;
create policy "Users can manage own health_records"
on public.health_records
for all
using (auth.uid() = user_id or public.is_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Users can manage own appointments" on public.appointments;
create policy "Users can manage own appointments"
on public.appointments
for all
using (auth.uid() = user_id or public.is_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Users can manage own care_plans" on public.care_plans;
create policy "Users can manage own care_plans"
on public.care_plans
for all
using (auth.uid() = user_id or public.is_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Users can manage own care_tasks" on public.care_tasks;
create policy "Users can manage own care_tasks"
on public.care_tasks
for all
using (auth.uid() = user_id or public.is_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Users can manage own notifications" on public.notifications;
create policy "Users can manage own notifications"
on public.notifications
for all
using (auth.uid() = user_id or public.is_admin(auth.uid()))
with check (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "Anyone authenticated can read provider slots" on public.provider_availability;
create policy "Anyone authenticated can read provider slots"
on public.provider_availability
for select
using (auth.uid() is not null);

drop policy if exists "Providers and admins can manage own slots" on public.provider_availability;
create policy "Providers and admins can manage own slots"
on public.provider_availability
for all
using (provider_user_id = auth.uid() or public.is_admin(auth.uid()))
with check (provider_user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Users and admins can read audit logs" on public.audit_logs;
create policy "Users and admins can read audit logs"
on public.audit_logs
for select
using (actor_user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Users can insert own audit logs" on public.audit_logs;
create policy "Users can insert own audit logs"
on public.audit_logs
for insert
with check (actor_user_id = auth.uid() or public.is_admin(auth.uid()));

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
