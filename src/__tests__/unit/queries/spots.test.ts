/**
 * Tests de Queries de Plazas (spots.ts)
 *
 * Verifica la lógica de estados calculados de getSpotsByDate:
 * - free: plaza estándar sin reservas
 * - reserved: plaza con reserva confirmada de empleado
 * - visitor-blocked: plaza con reserva de visitante (máxima prioridad)
 * - occupied: plaza de dirección sin cesión activa
 * - ceded: plaza de dirección cedida y disponible
 * - (reserved vía cesión): plaza de dirección cedida y ya reservada
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSpots, getSpotsByDate } from "@/lib/queries/spots";
import { createQueryChain } from "../../mocks/supabase";
import {
  createMockSpot,
  createMockReservationWithProfile,
  createMockCession,
  createMockVisitorReservation,
} from "../../mocks/factories";

// ─── Mock de Supabase ─────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

// ─── Helpers de test ──────────────────────────────────────────────────────────

/**
 * Configura el mock de Supabase para responder con los datos dados por tabla.
 * El mock de `from` devuelve un query chain diferente según el nombre de tabla.
 */
function setupSupabaseMock(tableData: {
  spots?: ReturnType<typeof createMockSpot>[];
  spotsError?: { message: string };
  reservations?: ReturnType<typeof createMockReservationWithProfile>[];
  cessions?: ReturnType<typeof createMockCession>[];
  visitor_reservations?: ReturnType<typeof createMockVisitorReservation>[];
}) {
  const mockFrom = vi.fn((table: string) => {
    switch (table) {
      case "spots":
        return createQueryChain({
          data: tableData.spots ?? [],
          error: tableData.spotsError ?? null,
        });
      case "reservations":
        return createQueryChain({
          data: tableData.reservations ?? [],
          error: null,
        });
      case "cessions":
        return createQueryChain({
          data: tableData.cessions ?? [],
          error: null,
        });
      case "visitor_reservations":
        return createQueryChain({
          data: tableData.visitor_reservations ?? [],
          error: null,
        });
      default:
        return createQueryChain({ data: [], error: null });
    }
  });

  vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);
  return mockFrom;
}

const DATE = "2025-03-15";

// ─── getSpots ─────────────────────────────────────────────────────────────────

describe("getSpots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve las plazas activas", async () => {
    const spot = createMockSpot({ label: "A-01" });
    setupSupabaseMock({ spots: [spot] });

    const result = await getSpots();

    expect(result).toHaveLength(1);
    expect(result[0]?.label).toBe("A-01");
  });

  it("devuelve array vacío si no hay plazas", async () => {
    setupSupabaseMock({ spots: [] });
    const result = await getSpots();
    expect(result).toEqual([]);
  });

  it("lanza error si Supabase devuelve error", async () => {
    setupSupabaseMock({ spotsError: { message: "Conexión fallida" } });
    await expect(getSpots()).rejects.toThrow("Conexión fallida");
  });
});

// ─── getSpotsByDate ───────────────────────────────────────────────────────────

describe("getSpotsByDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Plaza estándar libre ────────────────────────────────────────────────────

  it("devuelve estado 'free' para plaza estándar sin reservas", async () => {
    const spot = createMockSpot({ id: "spot-1", type: "standard" });
    setupSupabaseMock({ spots: [spot] });

    const result = await getSpotsByDate(DATE);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "spot-1",
      status: "free",
      reservation_id: undefined,
      reserved_by_name: undefined,
    });
  });

  // ── Plaza estándar reservada ────────────────────────────────────────────────

  it("devuelve estado 'reserved' para plaza con reserva confirmada", async () => {
    const spot = createMockSpot({ id: "spot-1", type: "standard" });
    const reservation = createMockReservationWithProfile({
      id: "res-1",
      spot_id: "spot-1",
      profiles: { full_name: "Ana Pérez" },
    });
    setupSupabaseMock({ spots: [spot], reservations: [reservation] });

    const result = await getSpotsByDate(DATE);

    expect(result[0]).toMatchObject({
      status: "reserved",
      reservation_id: "res-1",
      reserved_by_name: "Ana Pérez",
    });
  });

  it("devuelve reserved_by_name undefined si el perfil es null", async () => {
    const spot = createMockSpot({ id: "spot-1", type: "standard" });
    const reservation = createMockReservationWithProfile({
      spot_id: "spot-1",
      profiles: null,
    });
    setupSupabaseMock({ spots: [spot], reservations: [reservation] });

    const result = await getSpotsByDate(DATE);

    expect(result[0]?.reserved_by_name).toBeUndefined();
  });

  // ── Plaza con reserva de visitante ─────────────────────────────────────────

  it("devuelve estado 'visitor-blocked' para plaza con reserva de visitante", async () => {
    const spot = createMockSpot({ id: "spot-1", type: "standard" });
    const visitor = createMockVisitorReservation({
      id: "vis-1",
      spot_id: "spot-1",
      visitor_name: "Visitante Externo",
    });
    setupSupabaseMock({ spots: [spot], visitor_reservations: [visitor] });

    const result = await getSpotsByDate(DATE);

    expect(result[0]).toMatchObject({
      status: "visitor-blocked",
      reservation_id: "vis-1",
      reserved_by_name: "Visitante Externo",
    });
  });

  it("visitante tiene prioridad sobre reserva de empleado en la misma plaza", async () => {
    const spot = createMockSpot({ id: "spot-1", type: "standard" });
    const reservation = createMockReservationWithProfile({ spot_id: "spot-1" });
    const visitor = createMockVisitorReservation({
      id: "vis-priority",
      spot_id: "spot-1",
      visitor_name: "Visitante Prioritario",
    });
    setupSupabaseMock({
      spots: [spot],
      reservations: [reservation],
      visitor_reservations: [visitor],
    });

    const result = await getSpotsByDate(DATE);

    expect(result[0]?.status).toBe("visitor-blocked");
    expect(result[0]?.reservation_id).toBe("vis-priority");
  });

  // ── Plaza de dirección sin cesión ──────────────────────────────────────────

  it("devuelve estado 'occupied' para plaza de dirección sin cesión", async () => {
    const spot = createMockSpot({ id: "spot-mgmt", type: "management" });
    setupSupabaseMock({ spots: [spot] });

    const result = await getSpotsByDate(DATE);

    expect(result[0]).toMatchObject({
      status: "occupied",
      reservation_id: undefined,
    });
  });

  // ── Plaza de dirección cedida disponible ───────────────────────────────────

  it("devuelve estado 'ceded' para plaza de dirección con cesión 'available'", async () => {
    const spot = createMockSpot({ id: "spot-mgmt", type: "management" });
    const cession = createMockCession({
      id: "ces-1",
      spot_id: "spot-mgmt",
      status: "available",
    });
    setupSupabaseMock({ spots: [spot], cessions: [cession] });

    const result = await getSpotsByDate(DATE);

    expect(result[0]).toMatchObject({
      status: "ceded",
      reservation_id: "ces-1",
    });
  });

  // ── Plaza de dirección cedida y ya reservada ───────────────────────────────

  it("devuelve estado 'reserved' para plaza de dirección con cesión 'reserved'", async () => {
    const spot = createMockSpot({ id: "spot-mgmt", type: "management" });
    const cession = createMockCession({
      id: "ces-1",
      spot_id: "spot-mgmt",
      status: "reserved",
    });
    setupSupabaseMock({ spots: [spot], cessions: [cession] });

    const result = await getSpotsByDate(DATE);

    expect(result[0]).toMatchObject({
      status: "reserved",
      reservation_id: "ces-1",
    });
  });

  // ── Visitante en plaza de dirección ───────────────────────────────────────

  it("visitante en plaza de dirección tiene prioridad sobre la lógica de cesión", async () => {
    const spot = createMockSpot({ id: "spot-mgmt", type: "management" });
    const cession = createMockCession({
      spot_id: "spot-mgmt",
      status: "available",
    });
    const visitor = createMockVisitorReservation({
      id: "vis-mgmt",
      spot_id: "spot-mgmt",
    });
    setupSupabaseMock({
      spots: [spot],
      cessions: [cession],
      visitor_reservations: [visitor],
    });

    const result = await getSpotsByDate(DATE);

    expect(result[0]?.status).toBe("visitor-blocked");
  });

  // ── Múltiples plazas ──────────────────────────────────────────────────────

  it("calcula el estado de cada plaza de forma independiente", async () => {
    const spotFree = createMockSpot({ id: "spot-free", type: "standard" });
    const spotReserved = createMockSpot({
      id: "spot-reserved",
      type: "standard",
    });
    const spotMgmt = createMockSpot({ id: "spot-mgmt", type: "management" });

    const reservation = createMockReservationWithProfile({
      spot_id: "spot-reserved",
    });

    setupSupabaseMock({
      spots: [spotFree, spotReserved, spotMgmt],
      reservations: [reservation],
    });

    const result = await getSpotsByDate(DATE);
    const byId = Object.fromEntries(result.map((s) => [s.id, s.status]));

    expect(byId["spot-free"]).toBe("free");
    expect(byId["spot-reserved"]).toBe("reserved");
    expect(byId["spot-mgmt"]).toBe("occupied");
  });

  // ── Error de Supabase ─────────────────────────────────────────────────────

  it("lanza error si la query de plazas falla", async () => {
    setupSupabaseMock({ spotsError: { message: "Error de base de datos" } });
    await expect(getSpotsByDate(DATE)).rejects.toThrow(
      "Error de base de datos"
    );
  });

  // ── Mapeo de campos ────────────────────────────────────────────────────────

  it("mapea correctamente los campos de la plaza al resultado", async () => {
    const spot = createMockSpot({
      id: "spot-map",
      label: "B-05",
      type: "visitor",
      assigned_to: "user-abc",
      position_x: 100,
      position_y: 200,
    });
    setupSupabaseMock({ spots: [spot] });

    const result = await getSpotsByDate(DATE);

    expect(result[0]).toMatchObject({
      id: "spot-map",
      label: "B-05",
      type: "visitor",
      assigned_to: "user-abc",
      position_x: 100,
      position_y: 200,
    });
  });
});
