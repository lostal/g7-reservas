-- Migration 00006: Solicitudes de vacaciones/ausencias + notificaciones
--
-- Crea `leave_requests` con máquina de estados via enum `leave_status`.
-- Crea `notification_subscriptions` para preferencias de notificación por módulo.
--
-- Transiciones válidas (enforced en aplicación, no en DB):
--   pending → manager_approved  (solo manager del empleado)
--   pending | manager_approved → rejected  (manager o HR)
--   manager_approved → hr_approved  (solo HR)
--   pending | manager_approved → cancelled  (solo el empleado)
--
-- Prerequisitos: 00002, 00003
-- Después: pnpm db:types

-- ─── Enums ────────────────────────────────────────────────────────────────────

create type public.leave_status as enum (
  'pending',
  'manager_approved',
  'hr_approved',
  'rejected',
  'cancelled'
);

create type public.leave_type as enum (
  'vacation',
  'personal',
  'sick',
  'other'
);

-- ─── Tabla leave_requests ─────────────────────────────────────────────────────

create table public.leave_requests (
  id                  uuid primary key default uuid_generate_v4(),
  employee_id         uuid not null references public.profiles(id) on delete cascade,
  leave_type          public.leave_type   not null default 'vacation',
  start_date          date not null,
  end_date            date not null,
  status              public.leave_status not null default 'pending',
  reason              text,
  manager_id          uuid references public.profiles(id),   -- snapshot al crear
  manager_action_at   timestamptz,
  manager_notes       text,
  hr_id               uuid references public.profiles(id),
  hr_action_at        timestamptz,
  hr_notes            text,
  working_days        smallint,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint leave_requests_dates_valid check (end_date >= start_date)
);

comment on table public.leave_requests is
  'Solicitudes de vacaciones y ausencias. El enum leave_status es la máquina de estados.';

create index idx_leave_requests_employee_id on public.leave_requests(employee_id);
create index idx_leave_requests_manager_id  on public.leave_requests(manager_id);
create index idx_leave_requests_status      on public.leave_requests(status);

-- ─── Trigger updated_at ───────────────────────────────────────────────────────

create trigger trg_leave_requests_updated_at
  before update on public.leave_requests
  for each row execute function public.handle_updated_at();

-- ─── RLS leave_requests ───────────────────────────────────────────────────────

alter table public.leave_requests enable row level security;

-- Empleados: ven y crean sus propias solicitudes
create policy "leave_requests: employee read own"
  on public.leave_requests for select
  to authenticated
  using (employee_id = auth.uid());

create policy "leave_requests: employee insert own"
  on public.leave_requests for insert
  to authenticated
  with check (employee_id = auth.uid());

create policy "leave_requests: employee cancel own"
  on public.leave_requests for update
  to authenticated
  using (employee_id = auth.uid() and status in ('pending', 'manager_approved'))
  with check (status = 'cancelled');

-- Managers: ven solicitudes de sus reportes directos
create policy "leave_requests: manager read reports"
  on public.leave_requests for select
  to authenticated
  using (public.reports_to_current_user(employee_id));

create policy "leave_requests: manager approve reject"
  on public.leave_requests for update
  to authenticated
  using (
    public.reports_to_current_user(employee_id)
    and status = 'pending'
  );

-- HR y admin: acceso completo
create policy "leave_requests: hr admin all"
  on public.leave_requests for all
  to authenticated
  using (public.is_hr())
  with check (public.is_hr());

-- ─── Tabla notification_subscriptions ────────────────────────────────────────

create table public.notification_subscriptions (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  module      text not null,       -- 'vacaciones', 'nominas', 'tablon'
  event_type  text not null,       -- 'request.approved', 'payslip.available'
  channel     text not null default 'email'
    check (channel in ('email', 'teams', 'both', 'none')),
  primary key (user_id, module, event_type)
);

comment on table public.notification_subscriptions is
  'Preferencias de notificación por módulo y tipo de evento. '
  'Extensible sin alterar user_preferences.';

-- ─── RLS notification_subscriptions ──────────────────────────────────────────

alter table public.notification_subscriptions enable row level security;

create policy "notification_subscriptions: own read write"
  on public.notification_subscriptions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
