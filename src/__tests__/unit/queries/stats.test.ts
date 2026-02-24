/**
 * Tests de Queries de Estadísticas (stats.ts)
 *
 * Verifica la lógica de agregación y transformación de datos de:
 * - getDailyCountsLast30Days: conteos diarios de reservas y visitantes
 * - getTopSpots: plazas más usadas del mes
 * - getMovementDistribution: distribución de tipos de movimiento
 * - getMonthlyReservationCount: total de reservas del mes
 * - getRecentActivity: actividad reciente combinada
 * - getActiveUsersThisMonth: usuarios únicos con reserva este mes
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getDailyCountsLast30Days,
  getTopSpots,
  getMovementDistribution,
  getMonthlyReservationCount,
  getRecentActivity,
  getActiveUsersThisMonth,
} from "@/lib/queries/stats";
import { createQueryChain } from "../../mocks/supabase";

// ─── Mock de Supabase ─────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

// ─── Helpers de test ──────────────────────────────────────────────────────────

function setupFromMock(
  tableData: Record<string, { data?: unknown; count?: number; error?: unknown }>
) {
  const mockFrom = vi.fn((table: string) => {
    const config = tableData[table] ?? {};
    return createQueryChain({
      data: config.data ?? [],
      count: config.count ?? null,
      error: (config.error as { message: string } | null) ?? null,
    });
  });
  vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);
  return mockFrom;
}

// ─── getDailyCountsLast30Days ─────────────────────────────────────────────────

describe("getDailyCountsLast30Days", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve exactamente 30 entradas por defecto", async () => {
    setupFromMock({});
    const result = await getDailyCountsLast30Days();
    expect(result).toHaveLength(30);
  });

  it("devuelve N entradas cuando se especifica days=N", async () => {
    setupFromMock({});
    const result = await getDailyCountsLast30Days(7);
    expect(result).toHaveLength(7);
  });

  it("todos los conteos son 0 con datos vacíos", async () => {
    setupFromMock({});
    const result = await getDailyCountsLast30Days();
    expect(result.every((d) => d.reservations === 0)).toBe(true);
    expect(result.every((d) => d.visitors === 0)).toBe(true);
  });

  it("incrementa el conteo de reservas para el día correspondiente", async () => {
    const today = new Date().toISOString().split("T")[0]!;
    setupFromMock({
      reservations: { data: [{ date: today }] },
    });

    const result = await getDailyCountsLast30Days();
    const todayEntry = result.find((d) => d.date === today);

    expect(todayEntry?.reservations).toBe(1);
    expect(todayEntry?.visitors).toBe(0);
  });

  it("incrementa el conteo de visitantes para el día correspondiente", async () => {
    const today = new Date().toISOString().split("T")[0]!;
    setupFromMock({
      visitor_reservations: { data: [{ date: today }, { date: today }] },
    });

    const result = await getDailyCountsLast30Days();
    const todayEntry = result.find((d) => d.date === today);

    expect(todayEntry?.visitors).toBe(2);
    expect(todayEntry?.reservations).toBe(0);
  });

  it("acumula correctamente múltiples registros del mismo día", async () => {
    const today = new Date().toISOString().split("T")[0]!;
    setupFromMock({
      reservations: {
        data: [{ date: today }, { date: today }, { date: today }],
      },
      visitor_reservations: { data: [{ date: today }] },
    });

    const result = await getDailyCountsLast30Days();
    const todayEntry = result.find((d) => d.date === today);

    expect(todayEntry?.reservations).toBe(3);
    expect(todayEntry?.visitors).toBe(1);
  });

  it("ignora fechas fuera del rango", async () => {
    // Fecha muy antigua, fuera del rango de 30 días
    setupFromMock({
      reservations: { data: [{ date: "2000-01-01" }] },
    });

    const result = await getDailyCountsLast30Days();
    expect(result.every((d) => d.reservations === 0)).toBe(true);
  });

  it("cada entrada incluye date, label, reservations y visitors", async () => {
    setupFromMock({});
    const result = await getDailyCountsLast30Days(1);

    expect(result[0]).toHaveProperty("date");
    expect(result[0]).toHaveProperty("label");
    expect(result[0]).toHaveProperty("reservations");
    expect(result[0]).toHaveProperty("visitors");
  });
});

// ─── getTopSpots ──────────────────────────────────────────────────────────────

describe("getTopSpots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve array vacío si no hay reservas", async () => {
    setupFromMock({ reservations: { data: [] } });
    const result = await getTopSpots();
    expect(result).toEqual([]);
  });

  it("agrupa correctamente por etiqueta de plaza", async () => {
    setupFromMock({
      reservations: {
        data: [
          { id: "r1", date: "2025-01-10", spots: { label: "A-01" } },
          { id: "r2", date: "2025-01-11", spots: { label: "A-01" } },
          { id: "r3", date: "2025-01-12", spots: { label: "B-02" } },
        ],
      },
    });

    const result = await getTopSpots();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ spot_label: "A-01", count: 2 });
    expect(result[1]).toEqual({ spot_label: "B-02", count: 1 });
  });

  it("ordena por conteo descendente", async () => {
    setupFromMock({
      reservations: {
        data: [
          { id: "r1", date: "2025-01-10", spots: { label: "Z-99" } },
          { id: "r2", date: "2025-01-10", spots: { label: "A-01" } },
          { id: "r3", date: "2025-01-11", spots: { label: "A-01" } },
          { id: "r4", date: "2025-01-11", spots: { label: "A-01" } },
        ],
      },
    });

    const result = await getTopSpots();

    expect(result[0]?.spot_label).toBe("A-01");
    expect(result[0]?.count).toBe(3);
  });

  it("respeta el límite especificado", async () => {
    setupFromMock({
      reservations: {
        data: [
          { id: "r1", date: "2025-01-10", spots: { label: "A-01" } },
          { id: "r2", date: "2025-01-10", spots: { label: "B-02" } },
          { id: "r3", date: "2025-01-10", spots: { label: "C-03" } },
        ],
      },
    });

    const result = await getTopSpots(2);

    expect(result).toHaveLength(2);
  });

  it("usa '—' para plazas sin etiqueta (spots null)", async () => {
    setupFromMock({
      reservations: {
        data: [{ id: "r1", date: "2025-01-10", spots: null }],
      },
    });

    const result = await getTopSpots();

    expect(result[0]?.spot_label).toBe("—");
  });

  it("devuelve array vacío si Supabase devuelve error", async () => {
    setupFromMock({
      reservations: { error: { message: "Error de BD" }, data: null },
    });

    const result = await getTopSpots();
    expect(result).toEqual([]);
  });
});

// ─── getMovementDistribution ──────────────────────────────────────────────────

describe("getMovementDistribution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve las tres categorías de movimiento", async () => {
    setupFromMock({});
    const result = await getMovementDistribution();
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.name)).toEqual([
      "Reservas empleados",
      "Cesiones dirección",
      "Visitantes",
    ]);
  });

  it("usa los counts de Supabase correctamente", async () => {
    const mockFrom = vi.fn((table: string) => {
      const counts: Record<string, number> = {
        reservations: 10,
        cessions: 5,
        visitor_reservations: 3,
      };
      return createQueryChain({
        data: null,
        count: counts[table] ?? 0,
        error: null,
      });
    });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await getMovementDistribution();

    expect(result[0]?.value).toBe(10); // reservas
    expect(result[1]?.value).toBe(5); // cesiones
    expect(result[2]?.value).toBe(3); // visitantes
  });

  it("usa 0 como fallback cuando count es null", async () => {
    setupFromMock({
      reservations: { count: undefined },
      cessions: { count: undefined },
      visitor_reservations: { count: undefined },
    });

    const result = await getMovementDistribution();

    expect(result.every((r) => r.value === 0)).toBe(true);
  });
});

// ─── getMonthlyReservationCount ───────────────────────────────────────────────

describe("getMonthlyReservationCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve el count de Supabase", async () => {
    setupFromMock({ reservations: { count: 42 } });
    const result = await getMonthlyReservationCount();
    expect(result).toBe(42);
  });

  it("devuelve 0 cuando count es null", async () => {
    setupFromMock({ reservations: { count: undefined } });
    const result = await getMonthlyReservationCount();
    expect(result).toBe(0);
  });
});

// ─── getRecentActivity ────────────────────────────────────────────────────────

describe("getRecentActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve array vacío si no hay actividad", async () => {
    setupFromMock({});
    const result = await getRecentActivity();
    expect(result).toEqual([]);
  });

  it("combina reservas y visitantes en el resultado", async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === "reservations") {
        return createQueryChain({
          data: [
            {
              id: "r1",
              date: "2025-03-15",
              created_at: "2025-03-15T10:00:00Z",
              spots: { label: "A-01" },
              profiles: { full_name: "Ana García" },
            },
          ],
          error: null,
        });
      }
      if (table === "visitor_reservations") {
        return createQueryChain({
          data: [
            {
              id: "v1",
              date: "2025-03-15",
              created_at: "2025-03-15T09:00:00Z",
              visitor_name: "Visitante Externo",
              spots: { label: "B-02" },
            },
          ],
          error: null,
        });
      }
      return createQueryChain({ data: [], error: null });
    });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await getRecentActivity();

    expect(result).toHaveLength(2);
    expect(result.some((r) => r.type === "reservation")).toBe(true);
    expect(result.some((r) => r.type === "visitor")).toBe(true);
  });

  it("ordena por created_at descendente (más reciente primero)", async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === "reservations") {
        return createQueryChain({
          data: [
            {
              id: "r-old",
              date: "2025-03-14",
              created_at: "2025-03-14T08:00:00Z",
              spots: { label: "A-01" },
              profiles: { full_name: "Ana" },
            },
          ],
          error: null,
        });
      }
      if (table === "visitor_reservations") {
        return createQueryChain({
          data: [
            {
              id: "v-new",
              date: "2025-03-15",
              created_at: "2025-03-15T12:00:00Z",
              visitor_name: "Visitante",
              spots: { label: "B-02" },
            },
          ],
          error: null,
        });
      }
      return createQueryChain({ data: [], error: null });
    });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await getRecentActivity();

    expect(result[0]?.id).toBe("v-new");
    expect(result[1]?.id).toBe("r-old");
  });

  it("mapea los campos correctamente para reservas", async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === "reservations") {
        return createQueryChain({
          data: [
            {
              id: "r1",
              date: "2025-03-15",
              created_at: "2025-03-15T10:00:00Z",
              spots: { label: "A-01" },
              profiles: { full_name: "María López" },
            },
          ],
          error: null,
        });
      }
      return createQueryChain({ data: [], error: null });
    });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await getRecentActivity();
    const reservation = result.find((r) => r.type === "reservation");

    expect(reservation).toMatchObject({
      id: "r1",
      user_name: "María López",
      spot_label: "A-01",
      type: "reservation",
    });
  });

  it("mapea los campos correctamente para visitantes", async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === "visitor_reservations") {
        return createQueryChain({
          data: [
            {
              id: "v1",
              date: "2025-03-15",
              created_at: "2025-03-15T10:00:00Z",
              visitor_name: "Juan Pérez",
              spots: { label: "B-02" },
            },
          ],
          error: null,
        });
      }
      return createQueryChain({ data: [], error: null });
    });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await getRecentActivity();
    const visitor = result.find((r) => r.type === "visitor");

    expect(visitor).toMatchObject({
      id: "v1",
      user_name: "Juan Pérez",
      visitor_name: "Juan Pérez",
      spot_label: "B-02",
      type: "visitor",
    });
  });

  it("el resultado no incluye el campo created_at", async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === "reservations") {
        return createQueryChain({
          data: [
            {
              id: "r1",
              date: "2025-03-15",
              created_at: "2025-03-15T10:00:00Z",
              spots: { label: "A-01" },
              profiles: null,
            },
          ],
          error: null,
        });
      }
      return createQueryChain({ data: [], error: null });
    });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await getRecentActivity();
    expect(result[0]).not.toHaveProperty("created_at");
  });

  it("respeta el límite especificado", async () => {
    const reservationData = Array.from({ length: 5 }, (_, i) => ({
      id: `r${i}`,
      date: "2025-03-15",
      created_at: `2025-03-15T${String(i + 10).padStart(2, "0")}:00:00Z`,
      spots: { label: "A-01" },
      profiles: { full_name: "Usuario" },
    }));

    const mockFrom = vi.fn((table: string) => {
      if (table === "reservations") {
        return createQueryChain({ data: reservationData, error: null });
      }
      return createQueryChain({ data: [], error: null });
    });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await getRecentActivity(3);
    expect(result).toHaveLength(3);
  });

  it("usa fallbacks para joins null (spots y profiles)", async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === "reservations") {
        return createQueryChain({
          data: [
            {
              id: "r1",
              date: "2025-03-15",
              created_at: "2025-03-15T10:00:00Z",
              spots: null,
              profiles: null,
            },
          ],
          error: null,
        });
      }
      return createQueryChain({ data: [], error: null });
    });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await getRecentActivity();

    expect(result[0]?.spot_label).toBe("—");
    expect(result[0]?.user_name).toBe("Usuario");
  });
});

// ─── getActiveUsersThisMonth ──────────────────────────────────────────────────

describe("getActiveUsersThisMonth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 0 si no hay reservas", async () => {
    setupFromMock({ reservations: { data: [] } });
    const result = await getActiveUsersThisMonth();
    expect(result).toBe(0);
  });

  it("cuenta usuarios únicos (deduplica por user_id)", async () => {
    setupFromMock({
      reservations: {
        data: [
          { user_id: "u1" },
          { user_id: "u1" }, // duplicado
          { user_id: "u2" },
          { user_id: "u3" },
        ],
      },
    });

    const result = await getActiveUsersThisMonth();
    expect(result).toBe(3);
  });

  it("devuelve 0 si la query falla", async () => {
    setupFromMock({
      reservations: { data: null, error: { message: "Error" } },
    });

    const result = await getActiveUsersThisMonth();
    expect(result).toBe(0);
  });
});
