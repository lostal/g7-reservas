/**
 * Factories de datos de prueba
 *
 * Funciones que generan objetos con los tipos del dominio listos
 * para usar en tests. Todos los campos tienen valores por defecto
 * razonables y se pueden sobreescribir con el parámetro `overrides`.
 */

import type { Database } from "@/lib/supabase/database.types";

type SpotRow = Database["public"]["Tables"]["spots"]["Row"];
type UserPreferencesRow =
  Database["public"]["Tables"]["user_preferences"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ReservationRow = Database["public"]["Tables"]["reservations"]["Row"];

// ─── Spot ─────────────────────────────────────────────────────────────────────

export function createMockSpot(overrides?: Partial<SpotRow>): SpotRow {
  return {
    id: "spot-00000000-0000-0000-0000-000000000001",
    label: "A-01",
    type: "standard",
    assigned_to: null,
    is_active: true,
    position_x: 10,
    position_y: 20,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// ─── Reservation con perfil (shape del join en spots.ts) ──────────────────────

export function createMockReservationWithProfile(overrides?: {
  id?: string;
  spot_id?: string;
  user_id?: string;
  profiles?: { full_name: string } | null;
}) {
  return {
    id: "res-00000000-0000-0000-0000-000000000001",
    spot_id: "spot-00000000-0000-0000-0000-000000000001",
    user_id: "user-00000000-0000-0000-0000-000000000001",
    profiles: { full_name: "Usuario Test" },
    ...overrides,
  };
}

// ─── Cession ──────────────────────────────────────────────────────────────────

export function createMockCession(overrides?: {
  id?: string;
  spot_id?: string;
  status?: "available" | "reserved" | "cancelled";
}) {
  return {
    id: "ces-00000000-0000-0000-0000-000000000001",
    spot_id: "spot-00000000-0000-0000-0000-000000000001",
    status: "available" as const,
    ...overrides,
  };
}

// ─── Visitor Reservation ──────────────────────────────────────────────────────

export function createMockVisitorReservation(overrides?: {
  id?: string;
  spot_id?: string;
  visitor_name?: string;
}) {
  return {
    id: "vis-00000000-0000-0000-0000-000000000001",
    spot_id: "spot-00000000-0000-0000-0000-000000000001",
    visitor_name: "Visitante Test",
    ...overrides,
  };
}

// ─── UserPreferences ──────────────────────────────────────────────────────────

export function createMockUserPreferencesRow(
  overrides?: Partial<UserPreferencesRow>
): UserPreferencesRow {
  return {
    user_id: "user-00000000-0000-0000-0000-000000000001",
    theme: "system",
    locale: "es",
    default_view: "map",
    notification_channel: "teams",
    favorite_spot_ids: [],
    auto_cede_days: [],
    auto_cede_notify: true,
    auto_cede_on_ooo: false,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    daily_digest_time: null,
    notify_alert_triggered: true,
    notify_cession_reserved: true,
    notify_daily_digest: false,
    notify_reservation_confirmed: true,
    notify_reservation_reminder: true,
    notify_visitor_confirmed: true,
    outlook_calendar_name: null,
    outlook_create_events: false,
    outlook_sync_enabled: false,
    outlook_sync_interval: null,
    usual_arrival_time: null,
    ...overrides,
  };
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export function createMockProfile(overrides?: Partial<ProfileRow>): ProfileRow {
  return {
    id: "user-00000000-0000-0000-0000-000000000001",
    email: "test@example.com",
    full_name: "Test User",
    role: "employee",
    avatar_url: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// ─── Reservation Join (con plazas y perfiles) ─────────────────────────────────

export function createMockReservationJoin(overrides?: {
  id?: string;
  spot_id?: string;
  user_id?: string;
  date?: string;
  status?: ReservationRow["status"];
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  spots?: { label: string } | null;
  profiles?: { full_name: string } | null;
}) {
  return {
    id: "res-00000000-0000-0000-0000-000000000001",
    spot_id: "spot-00000000-0000-0000-0000-000000000001",
    user_id: "user-00000000-0000-0000-0000-000000000001",
    date: "2025-03-15",
    status: "confirmed" as const,
    notes: null,
    created_at: "2025-01-01T10:00:00Z",
    updated_at: "2025-01-01T10:00:00Z",
    spots: { label: "A-01" },
    profiles: { full_name: "Usuario Test" },
    ...overrides,
  };
}

// ─── Reservation completa (sin join) ──────────────────────────────────────────

export function createMockReservation(
  overrides?: Partial<ReservationRow>
): ReservationRow {
  return {
    id: "res-00000000-0000-0000-0000-000000000001",
    spot_id: "spot-00000000-0000-0000-0000-000000000001",
    user_id: "user-00000000-0000-0000-0000-000000000001",
    date: "2025-03-15",
    status: "confirmed",
    notes: null,
    created_at: "2025-01-01T10:00:00Z",
    updated_at: "2025-01-01T10:00:00Z",
    ...overrides,
  };
}

// ─── Auth User ────────────────────────────────────────────────────────────────

export function createMockAuthUser(overrides?: {
  id?: string;
  email?: string;
  profile?: { role?: string } | null;
}) {
  return {
    id: "user-00000000-0000-0000-0000-000000000001",
    email: "test@example.com",
    profile: { role: "employee" },
    ...overrides,
  };
}
