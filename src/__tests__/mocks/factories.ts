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

// ─── Forward-compat types (added in migrations 00002-00006) ──────────────────
// These tables don't exist in the DB until migrations are applied.
// Defined locally to keep factories type-safe in the meantime.
// Run `pnpm db:types` after applying migrations to replace these.

type EntityRow = {
  id: string;
  name: string;
  short_code: string;
  is_active: boolean;
  created_at: string;
};

type DocumentRow = {
  id: string;
  category: "payslip" | "corporate" | "contract" | "other";
  access_level: "own" | "entity" | "global";
  owner_id: string | null;
  entity_id: string | null;
  title: string;
  storage_path: string;
  file_size_bytes: number | null;
  mime_type: string;
  period_year: number | null;
  period_month: number | null;
  uploaded_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type LeaveRequestRow = {
  id: string;
  employee_id: string;
  leave_type: "vacation" | "personal" | "sick" | "other";
  start_date: string;
  end_date: string;
  status:
    | "pending"
    | "manager_approved"
    | "hr_approved"
    | "rejected"
    | "cancelled";
  reason: string | null;
  manager_id: string | null;
  manager_action_at: string | null;
  manager_notes: string | null;
  hr_id: string | null;
  hr_action_at: string | null;
  hr_notes: string | null;
  working_days: number | null;
  created_at: string;
  updated_at: string;
};

// ─── Spot ─────────────────────────────────────────────────────────────────────

export function createMockSpot(overrides?: Partial<SpotRow>): SpotRow {
  return {
    id: "spot-00000000-0000-0000-0000-000000000001",
    label: "A-01",
    type: "standard",
    assigned_to: null,
    resource_type: "parking",
    is_active: true,
    position_x: 10,
    position_y: 20,
    entity_id: null,
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
    dni: null,
    entity_id: null,
    job_title: null,
    location: null,
    manager_id: null,
    phone: null,
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
    start_time: null,
    end_time: null,
    created_at: "2025-01-01T10:00:00Z",
    updated_at: "2025-01-01T10:00:00Z",
    ...overrides,
  };
}

// ─── Office variants ──────────────────────────────────────────────────────────

export function createMockOfficeSpot(overrides?: Partial<SpotRow>): SpotRow {
  return createMockSpot({
    id: "spot-00000000-0000-0000-0000-000000000002",
    label: "OF-01",
    resource_type: "office",
    ...overrides,
  });
}

export function createMockOfficeReservation(
  overrides?: Partial<ReservationRow>
): ReservationRow {
  return createMockReservation({
    id: "res-00000000-0000-0000-0000-000000000002",
    spot_id: "spot-00000000-0000-0000-0000-000000000002",
    ...overrides,
  });
}

export function createMockOfficeCession(overrides?: {
  id?: string;
  spot_id?: string;
  status?: "available" | "reserved" | "cancelled";
}) {
  return createMockCession({
    id: "ces-00000000-0000-0000-0000-000000000002",
    spot_id: "spot-00000000-0000-0000-0000-000000000002",
    ...overrides,
  });
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

// ─── Entity ───────────────────────────────────────────────────────────────────

export function createMockEntity(overrides?: Partial<EntityRow>): EntityRow {
  return {
    id: "ent-00000000-0000-0000-0000-000000000001",
    name: "Empresa Test S.L.",
    short_code: "TST",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// ─── Document ─────────────────────────────────────────────────────────────────

export function createMockDocument(
  overrides?: Partial<DocumentRow>
): DocumentRow {
  return {
    id: "doc-00000000-0000-0000-0000-000000000001",
    category: "payslip",
    access_level: "own",
    owner_id: "user-00000000-0000-0000-0000-000000000001",
    entity_id: "ent-00000000-0000-0000-0000-000000000001",
    title: "Nómina Enero 2025",
    storage_path:
      "payslips/ent-00000000-0000-0000-0000-000000000001/user-00000000-0000-0000-0000-000000000001/2025/1.pdf",
    file_size_bytes: 102400,
    mime_type: "application/pdf",
    period_year: 2025,
    period_month: 1,
    uploaded_by: "user-00000000-0000-0000-0000-000000000002",
    is_active: true,
    created_at: "2025-02-01T00:00:00Z",
    updated_at: "2025-02-01T00:00:00Z",
    ...overrides,
  };
}

// ─── Leave Request ────────────────────────────────────────────────────────────

export function createMockLeaveRequest(
  overrides?: Partial<LeaveRequestRow>
): LeaveRequestRow {
  return {
    id: "lr-00000000-0000-0000-0000-000000000001",
    employee_id: "user-00000000-0000-0000-0000-000000000001",
    leave_type: "vacation",
    start_date: "2025-07-01",
    end_date: "2025-07-14",
    status: "pending",
    reason: null,
    manager_id: "user-00000000-0000-0000-0000-000000000002",
    manager_action_at: null,
    manager_notes: null,
    hr_id: null,
    hr_action_at: null,
    hr_notes: null,
    working_days: 10,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}
