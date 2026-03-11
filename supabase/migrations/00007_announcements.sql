-- Migration 00007: Tablón de anuncios
--
-- Crea `announcements` (global o por entidad) y `announcement_reads` para tracking.
--
-- Prerequisito: 00002_entities.sql
-- Después: pnpm db:types

-- ─── Tabla announcements ──────────────────────────────────────────────────────

create table public.announcements (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  body         text not null,
  entity_id    uuid references public.entities(id) on delete cascade,  -- null = global
  published_at timestamptz,
  expires_at   timestamptz,
  created_by   uuid not null references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.announcements is
  'Anuncios del tablón. entity_id null = visible para todos. '
  'published_at null = borrador. expires_at null = sin expiración.';

create index idx_announcements_entity_id    on public.announcements(entity_id);
create index idx_announcements_published_at on public.announcements(published_at)
  where published_at is not null;

-- ─── Trigger updated_at ───────────────────────────────────────────────────────

create trigger trg_announcements_updated_at
  before update on public.announcements
  for each row execute function public.handle_updated_at();

-- ─── Tabla announcement_reads ─────────────────────────────────────────────────

create table public.announcement_reads (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

-- ─── RLS announcements ────────────────────────────────────────────────────────

alter table public.announcements enable row level security;

-- Lectura: anuncios publicados globales + de tu entidad
create policy "announcements: employee read published"
  on public.announcements for select
  to authenticated
  using (
    published_at is not null
    and published_at <= now()
    and (expires_at is null or expires_at > now())
    and (
      entity_id is null
      or entity_id = (select entity_id from public.profiles where id = auth.uid())
    )
  );

-- HR/admin: ven todos (incluidos borradores y expirados)
create policy "announcements: hr admin read all"
  on public.announcements for select
  to authenticated
  using (public.is_hr());

-- Solo HR/admin pueden escribir
create policy "announcements: hr admin write"
  on public.announcements for all
  to authenticated
  using (public.is_hr())
  with check (public.is_hr());

-- ─── RLS announcement_reads ───────────────────────────────────────────────────

alter table public.announcement_reads enable row level security;

create policy "announcement_reads: own read write"
  on public.announcement_reads for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
