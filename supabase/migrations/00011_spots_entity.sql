-- Migration 00011: Add entity_id to spots
-- Prerequisite: 00002_entities.sql
alter table public.spots
  add column if not exists entity_id uuid references public.entities(id) on delete set null;

comment on column public.spots.entity_id is
  'Sede a la que pertenece esta plaza. Null = sin sede asignada (visible para todos los admins).';
