/**
 * Tests de Server Actions de Cesiones de Oficina
 *
 * Verifica la lógica de negocio de:
 * - createOfficeCession: verificación de propiedad y antelación
 * - cancelOfficeCession: bloqueo de no-admin si hay reserva activa
 * - cancelOfficeCession: cascade admin para cancelar reserva + cesión
 *
 * Los casos son equivalentes a cessions.test.ts (parking) con las
 * diferencias propias de oficinas (resource_type, mensajes de error).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createOfficeCession,
  cancelOfficeCession,
} from "@/app/(dashboard)/oficinas/cession-actions";
import { createQueryChain } from "../../mocks/supabase";
import { createMockAuthUser } from "../../mocks/factories";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/config", () => ({
  getAllResourceConfigs: vi.fn().mockResolvedValue({
    cession_enabled: true,
    cession_min_advance_hours: 0,
  }),
}));

vi.mock("@/lib/calendar/calendar-utils", () => ({
  isTooSoonForCession: vi.fn().mockReturnValue(false),
}));

vi.mock("@/lib/queries/active-entity", () => ({
  getEffectiveEntityId: vi.fn().mockResolvedValue(null),
}));

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getAllResourceConfigs } from "@/lib/config";
import { isTooSoonForCession } from "@/lib/calendar/calendar-utils";

// ─── Constantes ───────────────────────────────────────────────────────────────

const USER_ID = "user-00000000-0000-0000-0000-000000000001";
const OTHER_USER_ID = "other-0000-0000-0000-000000000002";
const SPOT_UUID = "550e8400-e29b-41d4-a716-446655440000";
const CESSION_UUID = "660e8400-e29b-41d4-a716-446655440001";
const RESERVATION_UUID = "770e8400-e29b-41d4-a716-446655440002";
const FUTURE_DATE = "2025-01-13";

// ─── createOfficeCession ──────────────────────────────────────────────────────

describe("createOfficeCession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(
      createMockAuthUser({ id: USER_ID }) as never
    );
    vi.mocked(isTooSoonForCession).mockReturnValue(false);
    vi.mocked(getAllResourceConfigs).mockResolvedValue({
      cession_enabled: true,
      cession_min_advance_hours: 0,
    } as never);
  });

  function setupSpotMock(
    spotData: unknown,
    insertResult?: {
      data: { id: string }[] | null;
      error: { message: string; code?: string } | null;
    }
  ) {
    const mockFrom = vi.fn((table: string) => {
      if (table === "spots") {
        const chain = createQueryChain({ data: null, error: null });
        (chain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: spotData,
          error: null,
        });
        return chain;
      }
      if (table === "cessions") {
        return createQueryChain(
          insertResult ?? { data: [{ id: CESSION_UUID }], error: null }
        );
      }
      return createQueryChain({ data: [], error: null });
    });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);
    return mockFrom;
  }

  it("lanza error si las cesiones de oficina están deshabilitadas", async () => {
    vi.mocked(getAllResourceConfigs).mockResolvedValue({
      cession_enabled: false,
    } as never);

    const result = await createOfficeCession({
      spot_id: SPOT_UUID,
      dates: [FUTURE_DATE],
    });

    expect(result?.success).toBe(false);
    if (!result?.success) expect(result.error).toContain("deshabilitadas");
  });

  it("lanza error si el puesto no existe", async () => {
    setupSpotMock(null);

    const result = await createOfficeCession({
      spot_id: SPOT_UUID,
      dates: [FUTURE_DATE],
    });

    expect(result?.success).toBe(false);
    if (!result?.success) expect(result.error).toContain("no encontrado");
  });

  it("lanza error si el puesto no es de tipo office", async () => {
    setupSpotMock({
      id: SPOT_UUID,
      assigned_to: USER_ID,
      resource_type: "parking", // ← tipo incorrecto
    });

    const result = await createOfficeCession({
      spot_id: SPOT_UUID,
      dates: [FUTURE_DATE],
    });

    expect(result?.success).toBe(false);
    if (!result?.success)
      expect(result.error).toContain("no es un espacio de oficina");
  });

  it("lanza error si el usuario no es el propietario del puesto", async () => {
    setupSpotMock({
      id: SPOT_UUID,
      assigned_to: OTHER_USER_ID,
      resource_type: "office",
    });

    const result = await createOfficeCession({
      spot_id: SPOT_UUID,
      dates: [FUTURE_DATE],
    });

    expect(result?.success).toBe(false);
    if (!result?.success)
      expect(result.error).toContain("Solo puedes ceder tu propio puesto");
  });

  it("verifica propiedad ANTES del check de antelación", async () => {
    vi.mocked(isTooSoonForCession).mockReturnValue(true);
    vi.mocked(getAllResourceConfigs).mockResolvedValue({
      cession_enabled: true,
      cession_min_advance_hours: 24,
    } as never);

    setupSpotMock({
      id: SPOT_UUID,
      assigned_to: OTHER_USER_ID, // NO es el dueño
      resource_type: "office",
    });

    const result = await createOfficeCession({
      spot_id: SPOT_UUID,
      dates: [FUTURE_DATE],
    });

    // Debe devolver error de propiedad, NO de antelación
    expect(result?.success).toBe(false);
    if (!result?.success) {
      expect(result.error).toContain("Solo puedes ceder tu propio puesto");
      expect(result.error).not.toContain("antelación");
    }
  });

  it("lanza error si la fecha no cumple la antelación mínima", async () => {
    vi.mocked(isTooSoonForCession).mockReturnValue(true);
    vi.mocked(getAllResourceConfigs).mockResolvedValue({
      cession_enabled: true,
      cession_min_advance_hours: 24,
    } as never);

    setupSpotMock({
      id: SPOT_UUID,
      assigned_to: USER_ID,
      resource_type: "office",
    });

    const result = await createOfficeCession({
      spot_id: SPOT_UUID,
      dates: [FUTURE_DATE],
    });

    expect(result?.success).toBe(false);
    if (!result?.success)
      expect(result.error).toContain("antelación mínima de 24 horas");
  });

  it("lanza error si ya existe una cesión para esa fecha (23505)", async () => {
    setupSpotMock(
      { id: SPOT_UUID, assigned_to: USER_ID, resource_type: "office" },
      { data: null, error: { code: "23505", message: "duplicate key" } }
    );

    const result = await createOfficeCession({
      spot_id: SPOT_UUID,
      dates: [FUTURE_DATE],
    });

    expect(result?.success).toBe(false);
    if (!result?.success)
      expect(result.error).toContain("Ya existe una cesión");
  });

  it("crea la cesión con éxito y devuelve el count", async () => {
    setupSpotMock(
      { id: SPOT_UUID, assigned_to: USER_ID, resource_type: "office" },
      { data: [{ id: CESSION_UUID }], error: null }
    );

    const result = await createOfficeCession({
      spot_id: SPOT_UUID,
      dates: [FUTURE_DATE],
    });

    expect(result?.success).toBe(true);
    if (result?.success) expect(result.data).toEqual({ count: 1 });
  });
});

// ─── cancelOfficeCession ──────────────────────────────────────────────────────

describe("cancelOfficeCession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(
      createMockAuthUser({ id: USER_ID }) as never
    );
  });

  function setupCancelMock(config: {
    cession?: unknown;
    cessionFetchError?: boolean;
    activeReservation?: { id: string } | null;
    reservationCancelError?: string;
    cessionCancelError?: string;
  }) {
    let reservationsCallCount = 0;

    const mockFrom = vi.fn((table: string) => {
      if (table === "cessions") {
        const fetchChain = createQueryChain({ data: null, error: null });
        (fetchChain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: config.cessionFetchError ? null : (config.cession ?? null),
          error: config.cessionFetchError ? { message: "not found" } : null,
        });
        const updateChain = createQueryChain({
          data: config.cessionCancelError ? null : [{ id: CESSION_UUID }],
          error: config.cessionCancelError
            ? { message: config.cessionCancelError }
            : null,
        });
        const tableChain: Record<string, unknown> & PromiseLike<unknown> = {
          select: vi.fn().mockReturnValue(fetchChain),
          update: vi.fn().mockReturnValue(updateChain),
          then: fetchChain.then.bind(fetchChain),
        };
        return tableChain;
      }

      if (table === "reservations") {
        reservationsCallCount++;
        if (reservationsCallCount === 1) {
          const chain = createQueryChain({ data: null, error: null });
          (chain.maybeSingle as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: config.activeReservation ?? null,
            error: null,
          });
          return chain;
        }
        return createQueryChain({
          data: config.reservationCancelError
            ? null
            : [{ id: RESERVATION_UUID }],
          error: config.reservationCancelError
            ? { message: config.reservationCancelError }
            : null,
        });
      }

      return createQueryChain({ data: [], error: null });
    });

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);
    return mockFrom;
  }

  it("lanza error si la cesión no existe", async () => {
    setupCancelMock({ cessionFetchError: true });

    const result = await cancelOfficeCession({ id: CESSION_UUID });

    expect(result?.success).toBe(false);
    if (!result?.success)
      expect(result.error).toContain("Cesión no encontrada");
  });

  it("lanza error si el usuario no es el propietario", async () => {
    setupCancelMock({
      cession: {
        id: CESSION_UUID,
        user_id: OTHER_USER_ID,
        spot_id: SPOT_UUID,
        date: FUTURE_DATE,
        status: "available",
      },
    });

    const result = await cancelOfficeCession({ id: CESSION_UUID });

    expect(result?.success).toBe(false);
    if (!result?.success)
      expect(result.error).toContain("No puedes cancelar esta cesión");
  });

  it("lanza error para no-admin si hay una reserva activa", async () => {
    setupCancelMock({
      cession: {
        id: CESSION_UUID,
        user_id: USER_ID,
        spot_id: SPOT_UUID,
        date: FUTURE_DATE,
        status: "reserved",
      },
      activeReservation: { id: RESERVATION_UUID },
    });

    const result = await cancelOfficeCession({ id: CESSION_UUID });

    expect(result?.success).toBe(false);
    if (!result?.success)
      expect(result.error).toContain("alguien ya ha reservado este puesto");
  });

  it("cancela con éxito sin reserva activa", async () => {
    setupCancelMock({
      cession: {
        id: CESSION_UUID,
        user_id: USER_ID,
        spot_id: SPOT_UUID,
        date: FUTURE_DATE,
        status: "available",
      },
      activeReservation: null,
    });

    const result = await cancelOfficeCession({ id: CESSION_UUID });

    expect(result?.success).toBe(true);
    if (result?.success)
      expect(result.data).toEqual({
        cancelled: true,
        reservationAlsoCancelled: false,
      });
  });

  it("admin cancela con cascade cuando hay reserva activa", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(
      createMockAuthUser({
        id: USER_ID,
        profile: { role: "admin" },
      }) as never
    );

    setupCancelMock({
      cession: {
        id: CESSION_UUID,
        user_id: OTHER_USER_ID,
        spot_id: SPOT_UUID,
        date: FUTURE_DATE,
        status: "reserved",
      },
      activeReservation: { id: RESERVATION_UUID },
    });

    const result = await cancelOfficeCession({ id: CESSION_UUID });

    expect(result?.success).toBe(true);
    if (result?.success)
      expect(result.data).toEqual({
        cancelled: true,
        reservationAlsoCancelled: true,
      });
  });

  it("rechaza id no UUID sin llamar a BD (validación Zod)", async () => {
    const result = await cancelOfficeCession({ id: "no-es-uuid" });

    expect(result?.success).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });
});
