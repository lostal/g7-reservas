/**
 * Tests de Queries de Reservas (reservations.ts)
 *
 * Verifica la lógica de mapeo y consulta de:
 * - getReservationsByDate: reservas del día con detalle de plaza y usuario
 * - getUserReservations: reservas futuras de un usuario
 * - getUserReservationForDate: comprobación de reserva existente en una fecha
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getReservationsByDate,
  getUserReservations,
  getUserReservationForDate,
} from "@/lib/queries/reservations";
import { createQueryChain } from "../../mocks/supabase";
import {
  createMockReservationJoin,
  createMockReservation,
} from "../../mocks/factories";

// ─── Mock de Supabase ─────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

// ─── Helper de configuración ──────────────────────────────────────────────────

function setupSupabaseMock(config: {
  data?: unknown[];
  singleData?: unknown;
  error?: { message: string } | null;
}) {
  const chain = createQueryChain({
    data: config.data ?? [],
    error: config.error ?? null,
  });

  // .maybeSingle() para getUserReservationForDate
  (chain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: config.singleData ?? null,
    error: config.error ?? null,
  });

  const mockFrom = vi.fn(() => chain);
  vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);
  return mockFrom;
}

const DATE = "2025-03-15";
const USER_ID = "user-00000000-0000-0000-0000-000000000001";

// ─── getReservationsByDate ────────────────────────────────────────────────────

describe("getReservationsByDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve array vacío si no hay reservas", async () => {
    setupSupabaseMock({ data: [] });
    const result = await getReservationsByDate(DATE);
    expect(result).toEqual([]);
  });

  it("mapea correctamente spot_label desde el join de plazas", async () => {
    const res = createMockReservationJoin({ spots: { label: "B-03" } });
    setupSupabaseMock({ data: [res] });

    const result = await getReservationsByDate(DATE);

    expect(result).toHaveLength(1);
    expect(result[0]?.spot_label).toBe("B-03");
  });

  it("mapea correctamente user_name desde el join de perfiles", async () => {
    const res = createMockReservationJoin({
      profiles: { full_name: "María López" },
    });
    setupSupabaseMock({ data: [res] });

    const result = await getReservationsByDate(DATE);

    expect(result[0]?.user_name).toBe("María López");
  });

  it("filtra filas donde spots es null (datos de BD inconsistentes)", async () => {
    const res = createMockReservationJoin({ spots: null });
    setupSupabaseMock({ data: [res] });

    const result = await getReservationsByDate(DATE);

    // Las filas con spots===null se descartan para evitar tipos nulos en el resultado
    expect(result).toHaveLength(0);
  });

  it("usa cadena vacía como fallback si profiles es null", async () => {
    const res = createMockReservationJoin({ profiles: null });
    setupSupabaseMock({ data: [res] });

    const result = await getReservationsByDate(DATE);

    expect(result[0]?.user_name).toBe("");
  });

  it("el resultado incluye spot_label y user_name pero no los campos de join raw", async () => {
    const res = createMockReservationJoin({
      spots: { label: "A-01" },
      profiles: { full_name: "Test" },
    });
    setupSupabaseMock({ data: [res] });

    const result = await getReservationsByDate(DATE);

    // Los campos derivados están presentes
    expect(result[0]?.spot_label).toBe("A-01");
    expect(result[0]?.user_name).toBe("Test");
    // No hay campos de join en la interfaz tipada (TypeScript lo garantiza en compilación)
    expect(Object.keys(result[0] as object)).not.toContain("spots_raw");
  });

  it("preserva los campos base de la reserva", async () => {
    const res = createMockReservationJoin({
      id: "res-123",
      spot_id: "spot-456",
      user_id: USER_ID,
      date: DATE,
      status: "confirmed",
    });
    setupSupabaseMock({ data: [res] });

    const result = await getReservationsByDate(DATE);

    expect(result[0]).toMatchObject({
      id: "res-123",
      spot_id: "spot-456",
      user_id: USER_ID,
      date: DATE,
      status: "confirmed",
    });
  });

  it("lanza error si Supabase devuelve error", async () => {
    setupSupabaseMock({ error: { message: "Error de conexión" } });
    await expect(getReservationsByDate(DATE)).rejects.toThrow(
      "Error al obtener reservas: Error de conexión"
    );
  });

  it("devuelve múltiples reservas mapeadas", async () => {
    const reservations = [
      createMockReservationJoin({
        id: "r1",
        spots: { label: "A-01" },
        profiles: { full_name: "Ana" },
      }),
      createMockReservationJoin({
        id: "r2",
        spots: { label: "B-02" },
        profiles: { full_name: "Luis" },
      }),
    ];
    setupSupabaseMock({ data: reservations });

    const result = await getReservationsByDate(DATE);

    expect(result).toHaveLength(2);
    expect(result[0]?.spot_label).toBe("A-01");
    expect(result[1]?.spot_label).toBe("B-02");
  });
});

// ─── getUserReservations ──────────────────────────────────────────────────────

describe("getUserReservations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve array vacío si no hay reservas futuras", async () => {
    setupSupabaseMock({ data: [] });
    const result = await getUserReservations(USER_ID);
    expect(result).toEqual([]);
  });

  it("mapea spot_label y user_name correctamente", async () => {
    const res = createMockReservationJoin({
      spots: { label: "C-05" },
      profiles: { full_name: "Pedro García" },
    });
    setupSupabaseMock({ data: [res] });

    const result = await getUserReservations(USER_ID);

    expect(result[0]?.spot_label).toBe("C-05");
    expect(result[0]?.user_name).toBe("Pedro García");
  });

  it("lanza error si la query falla", async () => {
    setupSupabaseMock({ error: { message: "Timeout" } });
    await expect(getUserReservations(USER_ID)).rejects.toThrow(
      "Error al obtener reservas del usuario: Timeout"
    );
  });
});

// ─── getUserReservationForDate ────────────────────────────────────────────────

describe("getUserReservationForDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve la reserva si existe", async () => {
    const reservation = createMockReservation({ user_id: USER_ID, date: DATE });
    setupSupabaseMock({ singleData: reservation });

    const result = await getUserReservationForDate(USER_ID, DATE);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(reservation.id);
  });

  it("devuelve null si no existe reserva", async () => {
    setupSupabaseMock({ singleData: null });

    const result = await getUserReservationForDate(USER_ID, DATE);

    expect(result).toBeNull();
  });

  it("lanza error si la query falla", async () => {
    setupSupabaseMock({ error: { message: "Error de BD" } });

    await expect(getUserReservationForDate(USER_ID, DATE)).rejects.toThrow(
      "Error al comprobar reserva: Error de BD"
    );
  });
});
