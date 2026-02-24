/**
 * Tests de Helpers de Supabase
 *
 * Verifica que validateUserPreferences convierte correctamente
 * los tipos genéricos de la BD a tipos literales de la aplicación
 * y aplica los fallbacks esperados cuando los valores no son válidos.
 */

import { describe, it, expect } from "vitest";
import { validateUserPreferences } from "@/lib/supabase/helpers";
import { createMockUserPreferencesRow } from "../mocks/factories";

describe("validateUserPreferences", () => {
  // ── theme ──────────────────────────────────────────────────────────────────

  it.each(["light", "dark", "system"] as const)(
    "mantiene theme válido '%s'",
    (theme) => {
      const prefs = createMockUserPreferencesRow({ theme });
      expect(validateUserPreferences(prefs).theme).toBe(theme);
    }
  );

  it("convierte theme inválido a 'system' (fallback)", () => {
    const prefs = createMockUserPreferencesRow({ theme: "pink" });
    expect(validateUserPreferences(prefs).theme).toBe("system");
  });

  it("convierte theme vacío a 'system'", () => {
    const prefs = createMockUserPreferencesRow({ theme: "" });
    expect(validateUserPreferences(prefs).theme).toBe("system");
  });

  // ── locale ─────────────────────────────────────────────────────────────────

  it.each(["es", "en"] as const)("mantiene locale válido '%s'", (locale) => {
    const prefs = createMockUserPreferencesRow({ locale });
    expect(validateUserPreferences(prefs).locale).toBe(locale);
  });

  it("convierte locale inválido a 'es' (fallback)", () => {
    const prefs = createMockUserPreferencesRow({ locale: "fr" });
    expect(validateUserPreferences(prefs).locale).toBe("es");
  });

  // ── default_view ───────────────────────────────────────────────────────────

  it.each(["map", "list", "calendar"] as const)(
    "mantiene vista válida '%s'",
    (view) => {
      const prefs = createMockUserPreferencesRow({ default_view: view });
      expect(validateUserPreferences(prefs).default_view).toBe(view);
    }
  );

  it("convierte vista inválida a 'map' (fallback)", () => {
    const prefs = createMockUserPreferencesRow({ default_view: "table" });
    expect(validateUserPreferences(prefs).default_view).toBe("map");
  });

  // ── notification_channel ───────────────────────────────────────────────────

  it.each(["teams", "email", "both"] as const)(
    "mantiene canal de notificación válido '%s'",
    (channel) => {
      const prefs = createMockUserPreferencesRow({
        notification_channel: channel,
      });
      expect(validateUserPreferences(prefs).notification_channel).toBe(channel);
    }
  );

  it("convierte canal inválido a 'teams' (fallback)", () => {
    const prefs = createMockUserPreferencesRow({ notification_channel: "sms" });
    expect(validateUserPreferences(prefs).notification_channel).toBe("teams");
  });

  // ── arrays con valor null ──────────────────────────────────────────────────

  it("convierte favorite_spot_ids null a array vacío", () => {
    const prefs = createMockUserPreferencesRow({ favorite_spot_ids: null });
    expect(validateUserPreferences(prefs).favorite_spot_ids).toEqual([]);
  });

  it("mantiene favorite_spot_ids con valores", () => {
    const ids = ["id-1", "id-2"];
    const prefs = createMockUserPreferencesRow({ favorite_spot_ids: ids });
    expect(validateUserPreferences(prefs).favorite_spot_ids).toEqual(ids);
  });

  it("convierte auto_cede_days null a array vacío", () => {
    const prefs = createMockUserPreferencesRow({ auto_cede_days: null });
    expect(validateUserPreferences(prefs).auto_cede_days).toEqual([]);
  });

  it("mantiene auto_cede_days con valores", () => {
    const days = [1, 2, 3];
    const prefs = createMockUserPreferencesRow({ auto_cede_days: days });
    expect(validateUserPreferences(prefs).auto_cede_days).toEqual(days);
  });

  // ── resto de campos no modificados ─────────────────────────────────────────

  it("preserva el resto de campos sin modificarlos", () => {
    const prefs = createMockUserPreferencesRow({
      user_id: "user-abc-123",
      notify_reservation_confirmed: false,
      outlook_sync_enabled: true,
    });
    const result = validateUserPreferences(prefs);
    expect(result.user_id).toBe("user-abc-123");
    expect(result.notify_reservation_confirmed).toBe(false);
    expect(result.outlook_sync_enabled).toBe(true);
  });
});
