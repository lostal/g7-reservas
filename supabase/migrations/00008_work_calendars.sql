-- Migration 00008: Calendarios laborales y festivos
--
-- Crea `holiday_calendars`, `holidays` y `entity_holiday_calendars`.
-- Permite definir calendarios de festivos nacionales/autonómicos/locales
-- y asignarlos a entidades.
--
-- Prerequisito: 00002_entities.sql
-- Después: pnpm db:types

-- ─── Tabla holiday_calendars ──────────────────────────────────────────────────

create table public.holiday_calendars (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,        -- "España Nacional", "Comunidad de Madrid"
  country     text not null default 'ES',
  region      text,                 -- "MAD", "CAT" — null = nacional
  year        smallint not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.holiday_calendars is
  'Calendarios de festivos por año y región. Una entidad puede tener múltiples calendarios.';

-- ─── Tabla holidays ───────────────────────────────────────────────────────────

create table public.holidays (
  id          uuid primary key default uuid_generate_v4(),
  calendar_id uuid not null references public.holiday_calendars(id) on delete cascade,
  date        date not null,
  name        text not null,
  is_optional boolean not null default false,   -- festivos de libre disposición
  created_at  timestamptz not null default now()
);

create unique index idx_holidays_calendar_date on public.holidays(calendar_id, date);
create index idx_holidays_date on public.holidays(date);

-- ─── Tabla entity_holiday_calendars ──────────────────────────────────────────

create table public.entity_holiday_calendars (
  entity_id   uuid not null references public.entities(id) on delete cascade,
  calendar_id uuid not null references public.holiday_calendars(id) on delete cascade,
  primary key (entity_id, calendar_id)
);

comment on table public.entity_holiday_calendars is
  'Calendarios aplicables a cada entidad. Una entidad puede combinar múltiples calendarios.';

-- ─── Triggers updated_at ─────────────────────────────────────────────────────

create trigger trg_holiday_calendars_updated_at
  before update on public.holiday_calendars
  for each row execute function public.handle_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table public.holiday_calendars enable row level security;
alter table public.holidays enable row level security;
alter table public.entity_holiday_calendars enable row level security;

-- Lectura pública para usuarios autenticados
create policy "holiday_calendars: authenticated read"
  on public.holiday_calendars for select
  to authenticated using (true);

create policy "holidays: authenticated read"
  on public.holidays for select
  to authenticated using (true);

create policy "entity_holiday_calendars: authenticated read"
  on public.entity_holiday_calendars for select
  to authenticated using (true);

-- Escritura: solo admin
create policy "holiday_calendars: admin write"
  on public.holiday_calendars for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "holidays: admin write"
  on public.holidays for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "entity_holiday_calendars: admin write"
  on public.entity_holiday_calendars for all
  to authenticated
  using (public.is_admin()) with check (public.is_admin());
