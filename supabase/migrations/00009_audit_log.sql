-- Migration 00009: Audit log
--
-- Crea `audit_events` append-only para trazabilidad de acciones sensibles.
-- Acciones a auditar:
--   - payslip.viewed       — descarga de nómina
--   - leave.approved       — aprobación de vacaciones
--   - leave.rejected       — rechazo de vacaciones
--   - role.changed         — cambio de rol de usuario
--   - document.deleted     — borrado de documento
--   - user.deleted         — borrado de cuenta
--
-- RLS: solo INSERT para auth users. Solo SELECT para admin. Sin UPDATE ni DELETE.
--
-- Prerequisito: 00002, 00003
-- Después: pnpm db:types

-- ─── Tabla audit_events ───────────────────────────────────────────────────────

create table public.audit_events (
  id          bigserial primary key,
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_email text not null,
  event_type  text not null,    -- 'payslip.viewed', 'leave.approved', 'role.changed'
  entity_type text not null,    -- 'document', 'leave_request', 'profile'
  entity_id   uuid,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

comment on table public.audit_events is
  'Log de auditoría append-only. Sin UPDATE ni DELETE permitidos por RLS. '
  'Registrar manualmente en las 5-6 acciones sensibles del sistema.';

create index idx_audit_events_actor_id   on public.audit_events(actor_id);
create index idx_audit_events_event_type on public.audit_events(event_type);
create index idx_audit_events_entity_id  on public.audit_events(entity_id);
create index idx_audit_events_created_at on public.audit_events(created_at desc);

-- ─── RLS audit_events ─────────────────────────────────────────────────────────

alter table public.audit_events enable row level security;

-- Cualquier usuario autenticado puede insertar (sus propias acciones)
create policy "audit_events: authenticated insert"
  on public.audit_events for insert
  to authenticated
  with check (actor_id = auth.uid());

-- Solo admin puede leer
create policy "audit_events: admin read"
  on public.audit_events for select
  to authenticated
  using (public.is_admin());

-- Sin UPDATE ni DELETE — append-only por diseño
