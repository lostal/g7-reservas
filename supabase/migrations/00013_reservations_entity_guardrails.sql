-- Harden RLS for reservation mutations with entity/type guardrails.
-- This keeps DB constraints aligned with app-level checks (defense in depth).

-- ─── Reservations (employee parking/office) ───────────────────────────────

drop policy if exists "reservations_insert_own" on public.reservations;
create policy "reservations_insert_own"
  on public.reservations for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.get_user_role() != 'admin'
    and exists (
      select 1 from public.spots
      where spots.id = reservations.spot_id
        and (
          spots.entity_id is null
          or spots.entity_id = public.get_user_entity_id()
        )
    )
  );

drop policy if exists "reservations_update_own" on public.reservations;
create policy "reservations_update_own"
  on public.reservations for update to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.spots
      where spots.id = reservations.spot_id
        and (
          spots.entity_id is null
          or spots.entity_id = public.get_user_entity_id()
        )
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.spots
      where spots.id = reservations.spot_id
        and (
          spots.entity_id is null
          or spots.entity_id = public.get_user_entity_id()
        )
    )
  );

-- ─── Visitor Reservations (external visitors) ─────────────────────────────

drop policy if exists "visitor_reservations_insert_own" on public.visitor_reservations;
create policy "visitor_reservations_insert_own"
  on public.visitor_reservations for insert to authenticated
  with check (
    reserved_by = auth.uid()
    and exists (
      select 1 from public.spots
      where spots.id = visitor_reservations.spot_id
        and spots.type = 'visitor'
        and spots.resource_type = 'parking'
        and (
          spots.entity_id is null
          or spots.entity_id = public.get_user_entity_id()
        )
    )
  );

drop policy if exists "visitor_reservations_update_own" on public.visitor_reservations;
create policy "visitor_reservations_update_own"
  on public.visitor_reservations for update to authenticated
  using (
    reserved_by = auth.uid()
    and exists (
      select 1 from public.spots
      where spots.id = visitor_reservations.spot_id
        and spots.type = 'visitor'
        and spots.resource_type = 'parking'
        and (
          spots.entity_id is null
          or spots.entity_id = public.get_user_entity_id()
        )
    )
  )
  with check (
    reserved_by = auth.uid()
    and exists (
      select 1 from public.spots
      where spots.id = visitor_reservations.spot_id
        and spots.type = 'visitor'
        and spots.resource_type = 'parking'
        and (
          spots.entity_id is null
          or spots.entity_id = public.get_user_entity_id()
        )
    )
  );
