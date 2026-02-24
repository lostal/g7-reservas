/**
 * Tests de Schemas de Validación (Zod)
 *
 * Verifica que todos los schemas del dominio aceptan datos correctos
 * y rechazan entradas inválidas con los mensajes y paths esperados.
 */

import { describe, it, expect } from "vitest";
import {
  createReservationSchema,
  createCessionSchema,
  createVisitorReservationSchema,
  createSpotSchema,
  updateSpotSchema,
  cancelReservationSchema,
  cancelCessionSchema,
  cancelVisitorReservationSchema,
  updateVisitorReservationSchema,
  deleteSpotSchema,
  updateUserRoleSchema,
  deleteUserSchema,
  assignSpotToUserSchema,
  updateProfileSchema,
  updateNotificationPreferencesSchema,
  updateThemeSchema,
  updateOutlookPreferencesSchema,
  updateCessionRulesSchema,
} from "@/lib/validations";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const DATE = "2025-03-15";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Zod v4 usa PropertyKey[] (string | number | symbol) para los paths de errores
type SafeParseResult = {
  success: boolean;
  error?: { issues: { path: PropertyKey[] }[] };
};

function errorPaths(result: SafeParseResult): string[] {
  if (result.success) return [];
  return result.error?.issues.map((i) => i.path.map(String).join(".")) ?? [];
}

// ─── createReservationSchema ──────────────────────────────────────────────────

describe("createReservationSchema", () => {
  it("acepta entrada válida mínima", () => {
    const r = createReservationSchema.safeParse({ spot_id: UUID, date: DATE });
    expect(r.success).toBe(true);
  });

  it("acepta notas opcionales", () => {
    const r = createReservationSchema.safeParse({
      spot_id: UUID,
      date: DATE,
      notes: "Notas de prueba",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza spot_id no UUID", () => {
    const r = createReservationSchema.safeParse({
      spot_id: "no-es-uuid",
      date: DATE,
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("spot_id");
  });

  it("rechaza fecha con formato incorrecto", () => {
    const r = createReservationSchema.safeParse({
      spot_id: UUID,
      date: "15/03/2025",
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("date");
  });

  it("rechaza notas con más de 500 caracteres", () => {
    const r = createReservationSchema.safeParse({
      spot_id: UUID,
      date: DATE,
      notes: "a".repeat(501),
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("notes");
  });

  it("acepta notas con exactamente 500 caracteres", () => {
    const r = createReservationSchema.safeParse({
      spot_id: UUID,
      date: DATE,
      notes: "a".repeat(500),
    });
    expect(r.success).toBe(true);
  });
});

// ─── createCessionSchema ──────────────────────────────────────────────────────

describe("createCessionSchema", () => {
  it("acepta un array de fechas válido", () => {
    const r = createCessionSchema.safeParse({
      spot_id: UUID,
      dates: [DATE, "2025-03-16"],
    });
    expect(r.success).toBe(true);
  });

  it("rechaza array vacío de fechas", () => {
    const r = createCessionSchema.safeParse({ spot_id: UUID, dates: [] });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("dates");
  });

  it("rechaza fechas con formato incorrecto en el array", () => {
    const r = createCessionSchema.safeParse({
      spot_id: UUID,
      dates: ["2025-03-15", "no-es-fecha"],
    });
    expect(r.success).toBe(false);
  });
});

// ─── createVisitorReservationSchema ──────────────────────────────────────────

describe("createVisitorReservationSchema", () => {
  const valid = {
    spot_id: UUID,
    date: DATE,
    visitor_name: "Juan García",
    visitor_company: "ACME Corp",
    visitor_email: "juan@acme.com",
  };

  it("acepta entrada válida completa", () => {
    const r = createVisitorReservationSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("rechaza nombre de visitante vacío", () => {
    const r = createVisitorReservationSchema.safeParse({
      ...valid,
      visitor_name: "",
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("visitor_name");
  });

  it("rechaza empresa vacía", () => {
    const r = createVisitorReservationSchema.safeParse({
      ...valid,
      visitor_company: "",
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("visitor_company");
  });

  it("rechaza email inválido con mensaje correcto", () => {
    const r = createVisitorReservationSchema.safeParse({
      ...valid,
      visitor_email: "no-es-email",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const emailIssue = r.error.issues.find((i) =>
        i.path.includes("visitor_email")
      );
      expect(emailIssue).toBeDefined();
      expect(emailIssue?.message).toBe("Email inválido");
    }
  });

  it("rechaza nombre de visitante con más de 200 caracteres", () => {
    const r = createVisitorReservationSchema.safeParse({
      ...valid,
      visitor_name: "a".repeat(201),
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("visitor_name");
  });

  it("acepta notas opcionales", () => {
    const r = createVisitorReservationSchema.safeParse({
      ...valid,
      notes: "Visitante VIP",
    });
    expect(r.success).toBe(true);
  });
});

// ─── createSpotSchema ────────────────────────────────────────────────────────

describe("createSpotSchema", () => {
  it("acepta spot de tipo management", () => {
    const r = createSpotSchema.safeParse({ label: "M-01", type: "management" });
    expect(r.success).toBe(true);
  });

  it("acepta spot de tipo visitor con assigned_to", () => {
    const r = createSpotSchema.safeParse({
      label: "V-01",
      type: "visitor",
      assigned_to: UUID,
    });
    expect(r.success).toBe(true);
  });

  it("rechaza tipo desconocido", () => {
    const r = createSpotSchema.safeParse({
      label: "X-01",
      type: "desconocido",
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("type");
  });

  it("rechaza etiqueta vacía", () => {
    const r = createSpotSchema.safeParse({ label: "", type: "management" });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("label");
  });

  it("rechaza etiqueta con más de 20 caracteres", () => {
    const r = createSpotSchema.safeParse({
      label: "a".repeat(21),
      type: "visitor",
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("label");
  });

  it("rechaza assigned_to no UUID", () => {
    const r = createSpotSchema.safeParse({
      label: "M-01",
      type: "management",
      assigned_to: "no-es-uuid",
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("assigned_to");
  });
});

// ─── updateSpotSchema ────────────────────────────────────────────────────────

describe("updateSpotSchema", () => {
  it("acepta actualización parcial solo con id", () => {
    const r = updateSpotSchema.safeParse({ id: UUID });
    expect(r.success).toBe(true);
  });

  it("acepta actualización de label y is_active", () => {
    const r = updateSpotSchema.safeParse({
      id: UUID,
      label: "A-02",
      is_active: false,
    });
    expect(r.success).toBe(true);
  });

  it("rechaza sin id", () => {
    const r = updateSpotSchema.safeParse({ label: "A-02" });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("id");
  });

  it("no permite assigned_to (fue omitido del schema)", () => {
    const r = updateSpotSchema.safeParse({ id: UUID, assigned_to: UUID });
    // assigned_to no existe en updateSpotSchema → debe ser ignorado (strip) o fallar
    if (r.success) {
      expect(
        (r.data as Record<string, unknown>)["assigned_to"]
      ).toBeUndefined();
    }
  });
});

// ─── Schemas de cancelación (base cancelByIdSchema) ──────────────────────────

// deleteUserSchema usa user_id en lugar de id — tiene su propio describe abajo
describe.each([
  ["cancelReservationSchema", cancelReservationSchema],
  ["cancelCessionSchema", cancelCessionSchema],
  ["cancelVisitorReservationSchema", cancelVisitorReservationSchema],
  ["deleteSpotSchema", deleteSpotSchema],
])("%s", (_name, schema) => {
  it("acepta UUID válido", () => {
    const r = schema.safeParse({ id: UUID });
    expect(r.success).toBe(true);
  });

  it("rechaza ID no UUID", () => {
    const r = schema.safeParse({ id: "no-uuid" });
    expect(r.success).toBe(false);
  });

  it("rechaza entrada vacía", () => {
    const r = schema.safeParse({});
    expect(r.success).toBe(false);
  });
});

// ─── deleteUserSchema usa user_id, no id ─────────────────────────────────────

describe("deleteUserSchema", () => {
  it("acepta user_id UUID válido", () => {
    const r = deleteUserSchema.safeParse({ user_id: UUID });
    expect(r.success).toBe(true);
  });

  it("rechaza user_id no UUID", () => {
    const r = deleteUserSchema.safeParse({ user_id: "no-uuid" });
    expect(r.success).toBe(false);
  });
});

// ─── updateVisitorReservationSchema ──────────────────────────────────────────

describe("updateVisitorReservationSchema", () => {
  it("acepta entrada válida con id", () => {
    const r = updateVisitorReservationSchema.safeParse({
      id: UUID,
      spot_id: UUID,
      date: DATE,
      visitor_name: "Juan García",
      visitor_company: "ACME Corp",
      visitor_email: "juan@acme.com",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza sin id", () => {
    const r = updateVisitorReservationSchema.safeParse({
      spot_id: UUID,
      date: DATE,
      visitor_name: "Juan",
      visitor_company: "Corp",
      visitor_email: "a@b.com",
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("id");
  });
});

// ─── updateUserRoleSchema ────────────────────────────────────────────────────

describe("updateUserRoleSchema", () => {
  it.each(["employee", "management", "admin"])("acepta role '%s'", (role) => {
    const r = updateUserRoleSchema.safeParse({ user_id: UUID, role });
    expect(r.success).toBe(true);
  });

  it("rechaza role desconocido", () => {
    const r = updateUserRoleSchema.safeParse({
      user_id: UUID,
      role: "superadmin",
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("role");
  });
});

// ─── assignSpotToUserSchema ──────────────────────────────────────────────────

describe("assignSpotToUserSchema", () => {
  it("acepta asignación con spot_id UUID", () => {
    const r = assignSpotToUserSchema.safeParse({
      user_id: UUID,
      spot_id: UUID,
    });
    expect(r.success).toBe(true);
  });

  it("acepta desasignación con spot_id null", () => {
    const r = assignSpotToUserSchema.safeParse({
      user_id: UUID,
      spot_id: null,
    });
    expect(r.success).toBe(true);
  });

  it("rechaza spot_id no UUID ni null", () => {
    const r = assignSpotToUserSchema.safeParse({
      user_id: UUID,
      spot_id: "no-uuid",
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("spot_id");
  });
});

// ─── updateProfileSchema ─────────────────────────────────────────────────────

describe("updateProfileSchema", () => {
  it("acepta entrada vacía (todo opcional)", () => {
    const r = updateProfileSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it("acepta full_name válido", () => {
    const r = updateProfileSchema.safeParse({ full_name: "María López" });
    expect(r.success).toBe(true);
  });

  it("rechaza avatar_url no URL", () => {
    const r = updateProfileSchema.safeParse({ avatar_url: "no-es-url" });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("avatar_url");
  });

  it("rechaza full_name vacío", () => {
    const r = updateProfileSchema.safeParse({ full_name: "" });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("full_name");
  });
});

// ─── updateNotificationPreferencesSchema ─────────────────────────────────────

describe("updateNotificationPreferencesSchema", () => {
  const validBase = {
    notification_channel: "email",
    notify_reservation_confirmed: true,
    notify_reservation_reminder: false,
    notify_cession_reserved: true,
    notify_alert_triggered: false,
    notify_visitor_confirmed: true,
    notify_daily_digest: false,
  };

  it("acepta configuración válida completa", () => {
    const r = updateNotificationPreferencesSchema.safeParse(validBase);
    expect(r.success).toBe(true);
  });

  it.each(["teams", "email", "both"])("acepta canal '%s'", (channel) => {
    const r = updateNotificationPreferencesSchema.safeParse({
      ...validBase,
      notification_channel: channel,
    });
    expect(r.success).toBe(true);
  });

  it("rechaza canal desconocido", () => {
    const r = updateNotificationPreferencesSchema.safeParse({
      ...validBase,
      notification_channel: "sms",
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("notification_channel");
  });

  it("acepta daily_digest_time en formato HH:MM válido", () => {
    const r = updateNotificationPreferencesSchema.safeParse({
      ...validBase,
      daily_digest_time: "08:30",
    });
    expect(r.success).toBe(true);
  });

  it("rechaza daily_digest_time con formato incorrecto", () => {
    const r = updateNotificationPreferencesSchema.safeParse({
      ...validBase,
      daily_digest_time: "8:30AM",
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("daily_digest_time");
  });

  it("rechaza hora inválida (25:00)", () => {
    const r = updateNotificationPreferencesSchema.safeParse({
      ...validBase,
      daily_digest_time: "25:00",
    });
    expect(r.success).toBe(false);
  });
});

// ─── updateThemeSchema ───────────────────────────────────────────────────────

describe("updateThemeSchema", () => {
  it.each(["light", "dark", "system"])("acepta theme '%s'", (theme) => {
    const r = updateThemeSchema.safeParse({ theme });
    expect(r.success).toBe(true);
  });

  it("rechaza theme desconocido", () => {
    const r = updateThemeSchema.safeParse({ theme: "pink" });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("theme");
  });
});

// ─── updateOutlookPreferencesSchema ──────────────────────────────────────────

describe("updateOutlookPreferencesSchema", () => {
  const validBase = {
    outlook_create_events: true,
    outlook_sync_enabled: false,
  };

  it("acepta configuración mínima válida", () => {
    const r = updateOutlookPreferencesSchema.safeParse(validBase);
    expect(r.success).toBe(true);
  });

  it("acepta intervalo en rango permitido (5-120)", () => {
    const r = updateOutlookPreferencesSchema.safeParse({
      ...validBase,
      outlook_sync_interval: 30,
    });
    expect(r.success).toBe(true);
  });

  it("rechaza intervalo menor a 5", () => {
    const r = updateOutlookPreferencesSchema.safeParse({
      ...validBase,
      outlook_sync_interval: 4,
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("outlook_sync_interval");
  });

  it("rechaza intervalo mayor a 120", () => {
    const r = updateOutlookPreferencesSchema.safeParse({
      ...validBase,
      outlook_sync_interval: 121,
    });
    expect(r.success).toBe(false);
    expect(errorPaths(r)).toContain("outlook_sync_interval");
  });

  it("rechaza intervalo decimal", () => {
    const r = updateOutlookPreferencesSchema.safeParse({
      ...validBase,
      outlook_sync_interval: 15.5,
    });
    expect(r.success).toBe(false);
  });
});

// ─── updateCessionRulesSchema ────────────────────────────────────────────────

describe("updateCessionRulesSchema", () => {
  it("acepta configuración válida", () => {
    const r = updateCessionRulesSchema.safeParse({
      auto_cede_on_ooo: true,
      auto_cede_notify: false,
      auto_cede_days: [1, 2, 3, 4, 5],
    });
    expect(r.success).toBe(true);
  });

  it("acepta array de días vacío", () => {
    const r = updateCessionRulesSchema.safeParse({
      auto_cede_on_ooo: false,
      auto_cede_notify: false,
      auto_cede_days: [],
    });
    expect(r.success).toBe(true);
  });

  it("rechaza día fuera de rango 0-6", () => {
    const r = updateCessionRulesSchema.safeParse({
      auto_cede_on_ooo: false,
      auto_cede_notify: false,
      auto_cede_days: [0, 7],
    });
    expect(r.success).toBe(false);
  });

  it("rechaza días negativos", () => {
    const r = updateCessionRulesSchema.safeParse({
      auto_cede_on_ooo: false,
      auto_cede_notify: false,
      auto_cede_days: [-1],
    });
    expect(r.success).toBe(false);
  });

  it("rechaza días decimales", () => {
    const r = updateCessionRulesSchema.safeParse({
      auto_cede_on_ooo: false,
      auto_cede_notify: false,
      auto_cede_days: [1.5],
    });
    expect(r.success).toBe(false);
  });
});
