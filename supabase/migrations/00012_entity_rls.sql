-- ============================================================
-- Migración 00012: Políticas RLS por entidad (multi-sede)
-- ============================================================
-- Reemplaza las políticas SELECT genéricas `using (true)` de las
-- tablas principales por políticas que restringen la visibilidad
-- al scope de la entidad del usuario autenticado.
--
-- Principios:
--   · Los administradores siempre ven TODO (is_admin() pasa el check).
--   · Los empleados solo ven datos de su propia entidad.
--   · Los spots sin entity_id (globales) son visibles para todos.
--   · Reservas y cesiones se validan a través del spot al que pertenecen.
--   · Las políticas de ESCRITURA existentes no se modifican.
-- ============================================================

-- ─── Helper: obtener entity_id del usuario actual ─────────────

create or replace function public.get_user_entity_id()
returns uuid
language sql stable security definer
as $$
  select entity_id from public.profiles where id = auth.uid()
$$;

comment on function public.get_user_entity_id() is
  'Devuelve el entity_id del perfil del usuario autenticado. Usado en políticas RLS.';

-- ─── Spots ───────────────────────────────────────────────────

drop policy if exists "spots_select_authenticated" on public.spots;

create policy "spots_select_entity"
  on public.spots for select to authenticated
  using (
    public.is_admin()
    or entity_id is null
    or entity_id = public.get_user_entity_id()
  );

-- ─── Profiles ────────────────────────────────────────────────

drop policy if exists "profiles_select_authenticated" on public.profiles;

create policy "profiles_select_entity"
  on public.profiles for select to authenticated
  using (
    public.is_admin()
    or id = auth.uid()
    or entity_id = public.get_user_entity_id()
  );

-- ─── Reservations ────────────────────────────────────────────

drop policy if exists "reservations_select_authenticated" on public.reservations;

create policy "reservations_select_entity"
  on public.reservations for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.spots
      where spots.id = reservations.spot_id
        and (
          spots.entity_id is null
          or spots.entity_id = public.get_user_entity_id()
        )
    )
  );

-- ─── Cessions ────────────────────────────────────────────────

drop policy if exists "cessions_select_authenticated" on public.cessions;

create policy "cessions_select_entity"
  on public.cessions for select to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.spots
      where spots.id = cessions.spot_id
        and (
          spots.entity_id is null
          or spots.entity_id = public.get_user_entity_id()
        )
    )
  );

-- ─── Visitor Reservations ────────────────────────────────────

drop policy if exists "visitor_reservations_select_authenticated" on public.visitor_reservations;

create policy "visitor_reservations_select_entity"
  on public.visitor_reservations for select to authenticated
  using (
    public.is_admin()
    or reserved_by = auth.uid()
    or exists (
      select 1 from public.spots
      where spots.id = visitor_reservations.spot_id
        and (
          spots.entity_id is null
          or spots.entity_id = public.get_user_entity_id()
        )
    )
  );
