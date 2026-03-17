/**
 * Tests de Server Actions de Administración
 *
 * Verifica la lógica de negocio de:
 * - createSpot: creación de plazas con validación y manejo de duplicados
 * - updateSpot: actualización con validación de constraint único
 * - deleteSpot: eliminación por id
 * - updateUserRole: cambio de rol de usuario
 * - assignSpotToUser: asignación/desasignación de plaza de dirección
 * - assignUserToSpot: asignación desde perspectiva de plaza con control de cleanup
 * - deleteUser: eliminación de cuenta vía admin API
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSpot,
  updateSpot,
  deleteSpot,
  updateUserRole,
  assignSpotToUser,
  assignUserToSpot,
  deleteUser,
} from "@/app/(dashboard)/administracion/actions";
import { createQueryChain } from "../../mocks/supabase";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/queries/active-entity", () => ({
  getActiveEntityId: vi.fn().mockResolvedValue(null),
  getEffectiveEntityId: vi.fn().mockResolvedValue(null),
}));

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveEntityId } from "@/lib/queries/active-entity";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const UUID2 = "660e8400-e29b-41d4-a716-446655440001";

/**
 * Configura requireAdmin como admin válido (no redirige).
 */
function setupAdminUser() {
  vi.mocked(requireAdmin).mockResolvedValue({
    id: UUID,
    email: "admin@test.com",
    profile: {
      id: UUID,
      email: "admin@test.com",
      role: "admin" as const,
      full_name: "Admin",
      avatar_url: null,
      dni: null,
      entity_id: null,
      job_title: null,
      location: null,
      manager_id: null,
      phone: null,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
  });
}

/**
 * Configura el mock de Supabase con respuesta simple por tabla.
 */
function setupSupabaseMock(
  config: {
    singleData?: unknown;
    singleError?: { message: string; code?: string } | null;
    thenableError?: { message: string; code?: string } | null;
  } = {}
) {
  const chain = createQueryChain({
    data: config.thenableError ? null : { ok: true },
    error: config.thenableError ?? null,
  });

  (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
    data:
      config.singleData !== undefined ? config.singleData : { id: "new-id" },
    error: config.singleError ?? null,
  });

  const mockFrom = vi.fn(() => chain);
  vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);
  return { mockFrom, chain };
}

// ─── createSpot ───────────────────────────────────────────────────────────────

describe("createSpot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAdminUser();
  });

  it("crea la plaza y devuelve el id", async () => {
    setupSupabaseMock({ singleData: { id: "spot-new" } });

    const result = await createSpot({
      label: "A-01",
      type: "standard",
      resource_type: "parking",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toHaveProperty("id");
  });

  it("falla con mensaje claro en violación de constraint único (23505)", async () => {
    setupSupabaseMock({
      singleError: { message: "duplicate key", code: "23505" },
    });

    const result = await createSpot({
      label: "A-01",
      type: "standard",
      resource_type: "parking",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Ya existe una plaza con la etiqueta");
    }
  });

  it("falla con error genérico de BD para otros códigos", async () => {
    setupSupabaseMock({
      singleError: { message: "Error de conexión", code: "PGRST999" },
    });

    const result = await createSpot({
      label: "A-01",
      type: "standard",
      resource_type: "parking",
    });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toContain("Error al crear la plaza");
  });

  it("rechaza input inválido sin llamar a la BD (validación Zod)", async () => {
    const result = await createSpot({
      label: "",
      type: "standard",
      resource_type: "parking",
    });

    expect(result.success).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("rechaza tipo de plaza no válido", async () => {
    const result = await createSpot({
      label: "A-01",
      type: "invalid-type" as never,
      resource_type: "parking",
    });

    expect(result.success).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("falla si requireAdmin lanza error (no admin)", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new Error("No autorizado"));

    const result = await createSpot({
      label: "A-01",
      type: "standard",
      resource_type: "parking",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("No autorizado");
  });
});

// ─── updateSpot ───────────────────────────────────────────────────────────────

describe("updateSpot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAdminUser();
  });

  it("actualiza la plaza con éxito", async () => {
    setupSupabaseMock();

    const result = await updateSpot({ id: UUID, label: "A-02" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ updated: true });
  });

  it("falla con mensaje claro en constraint único (23505)", async () => {
    let callCount = 0;
    const fetchChain = createQueryChain({
      data: { id: UUID, entity_id: null },
      error: null,
    });
    const updateChain = createQueryChain({
      data: null,
      error: { message: "duplicate key", code: "23505" },
    });
    const mockFrom = vi.fn(() => {
      callCount++;
      return callCount === 1 ? fetchChain : updateChain;
    });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await updateSpot({ id: UUID, label: "A-01" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Ya existe una plaza con esa etiqueta");
    }
  });

  it("falla con error genérico de BD", async () => {
    let callCount = 0;
    const fetchChain = createQueryChain({
      data: { id: UUID, entity_id: null },
      error: null,
    });
    const updateChain = createQueryChain({
      data: null,
      error: { message: "Error de BD", code: "PGRST999" },
    });
    const mockFrom = vi.fn(() => {
      callCount++;
      return callCount === 1 ? fetchChain : updateChain;
    });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await updateSpot({ id: UUID, label: "A-01" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Error al actualizar la plaza");
    }
  });

  it("rechaza id no UUID sin llamar a BD", async () => {
    const result = await updateSpot({ id: "no-es-uuid", label: "A-01" });

    expect(result.success).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("falla si el spot no existe", async () => {
    const fetchChain = createQueryChain({ data: null, error: null });
    const mockFrom = vi.fn(() => fetchChain);
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await updateSpot({ id: UUID, label: "A-01" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Plaza no encontrada");
  });
});

// ─── deleteSpot ───────────────────────────────────────────────────────────────

describe("deleteSpot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAdminUser();
  });

  it("elimina la plaza con éxito", async () => {
    setupSupabaseMock();

    const result = await deleteSpot({ id: UUID });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ deleted: true });
  });

  it("falla si la BD devuelve error", async () => {
    let callCount = 0;
    const fetchChain = createQueryChain({
      data: { id: UUID, entity_id: null },
      error: null,
    });
    const deleteChain = createQueryChain({
      data: null,
      error: { message: "Foreign key constraint" },
    });
    const mockFrom = vi.fn(() => {
      callCount++;
      return callCount === 1 ? fetchChain : deleteChain;
    });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await deleteSpot({ id: UUID });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toContain("Error al eliminar la plaza");
  });

  it("rechaza id no UUID sin llamar a BD", async () => {
    const result = await deleteSpot({ id: "not-a-uuid" });

    expect(result.success).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("falla si el spot no existe", async () => {
    const fetchChain = createQueryChain({ data: null, error: null });
    const mockFrom = vi.fn(() => fetchChain);
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await deleteSpot({ id: UUID });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Plaza no encontrada");
  });
});

// ─── updateUserRole ───────────────────────────────────────────────────────────

describe("updateUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAdminUser();
  });

  it("actualiza el rol con éxito", async () => {
    setupSupabaseMock();

    const result = await updateUserRole({ user_id: UUID, role: "employee" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ updated: true });
  });

  it("falla si la BD devuelve error", async () => {
    setupSupabaseMock({
      thenableError: { message: "No se pudo actualizar" },
    });

    const result = await updateUserRole({ user_id: UUID, role: "employee" });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toContain("Error al actualizar el rol");
  });

  it("rechaza rol inválido sin llamar a BD", async () => {
    const result = await updateUserRole({
      user_id: UUID,
      role: "superuser" as never,
    });

    expect(result.success).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });
});

// ─── assignSpotToUser ─────────────────────────────────────────────────────────

describe("assignSpotToUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAdminUser();
  });

  it("desasigna la plaza cuando spot_id es null", async () => {
    setupSupabaseMock();

    const result = await assignSpotToUser({
      user_id: UUID,
      spot_id: null,
      resource_type: "parking",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ assigned: false });
  });

  it("asigna plaza estándar con éxito", async () => {
    // Necesita respuestas distintas: primera llamada = validate spot (single),
    // segunda y tercera = update queries (thenable)
    let callCount = 0;
    const mockFrom = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        // validate: select spot
        const chain = createQueryChain({ data: null, error: null });
        (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: {
            id: UUID2,
            type: "standard",
            assigned_to: null,
          },
          error: null,
        });
        return chain;
      }
      // update queries: thenable success
      return createQueryChain({ data: { ok: true }, error: null });
    });
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await assignSpotToUser({
      user_id: UUID,
      spot_id: UUID2,
      resource_type: "parking",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ assigned: true });
  });

  it("falla si la plaza no existe", async () => {
    const chain = createQueryChain({ data: null, error: null });
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });
    const mockFrom = vi.fn(() => chain);
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await assignSpotToUser({
      user_id: UUID,
      spot_id: UUID2,
      resource_type: "parking",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Plaza no encontrada");
  });

  it("falla si la plaza es de tipo visitor (no asignable a usuarios)", async () => {
    const chain = createQueryChain({ data: null, error: null });
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { id: UUID2, type: "visitor", assigned_to: null },
      error: null,
    });
    const mockFrom = vi.fn(() => chain);
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await assignSpotToUser({
      user_id: UUID,
      spot_id: UUID2,
      resource_type: "parking",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("No se pueden asignar plazas de visitas");
    }
  });

  it("falla si la plaza ya está asignada a otro usuario", async () => {
    const chain = createQueryChain({ data: null, error: null });
    (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        id: UUID2,
        type: "standard",
        assigned_to: "otro-usuario-uuid-0000-0000-000000000099",
      },
      error: null,
    });
    const mockFrom = vi.fn(() => chain);
    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await assignSpotToUser({
      user_id: UUID,
      spot_id: UUID2,
      resource_type: "parking",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("ya está asignada a otro usuario");
    }
  });

  it("rechaza user_id no UUID sin llamar a BD", async () => {
    const result = await assignSpotToUser({
      user_id: "no-es-uuid",
      spot_id: null,
      resource_type: "parking",
    });

    expect(result.success).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });
});

// ─── assignUserToSpot ─────────────────────────────────────────────────────────

describe("assignUserToSpot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAdminUser();
  });

  it("falla si el cleanup de la plaza anterior devuelve error", async () => {
    let callCount = 0;
    const mockFrom = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return createQueryChain({ data: { ok: true }, error: null });
      }
      return createQueryChain({
        data: null,
        error: { message: "cleanup failed", code: "PGRST999" },
      });
    });

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await assignUserToSpot({
      spot_id: UUID2,
      user_id: UUID,
      resource_type: "parking",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Error al limpiar la plaza anterior");
    }
  });

  it("bloquea asignación si el usuario objetivo es de otra sede activa", async () => {
    vi.mocked(getActiveEntityId).mockResolvedValueOnce("ent-1");

    let callCount = 0;
    const mockFrom = vi.fn((table: string) => {
      callCount++;
      const chain = createQueryChain({ data: null, error: null });

      if (table === "spots" && callCount === 1) {
        (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { entity_id: "ent-1" },
          error: null,
        });
      }

      if (table === "profiles") {
        (chain.single as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { entity_id: "ent-2" },
          error: null,
        });
      }

      return chain;
    });

    vi.mocked(createClient).mockResolvedValue({ from: mockFrom } as never);

    const result = await assignUserToSpot({
      spot_id: UUID2,
      user_id: UUID,
      resource_type: "office",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain(
        "Este usuario no pertenece a la sede activa"
      );
    }
  });
});

// ─── deleteUser ───────────────────────────────────────────────────────────────

describe("deleteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupAdminUser();
  });

  it("elimina el usuario con éxito", async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    } as never);

    const result = await deleteUser({ user_id: UUID });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ deleted: true });
  });

  it("falla si la API de admin devuelve error", async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      auth: {
        admin: {
          deleteUser: vi
            .fn()
            .mockResolvedValue({ error: { message: "User not found" } }),
        },
      },
    } as never);

    const result = await deleteUser({ user_id: UUID });

    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toContain("Error al eliminar la cuenta");
  });

  it("rechaza user_id no UUID sin llamar al admin client", async () => {
    const result = await deleteUser({ user_id: "not-a-uuid" });

    expect(result.success).toBe(false);
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});
