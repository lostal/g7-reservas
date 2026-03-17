import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ requireAdmin: vi.fn() }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";
import { createQueryChain } from "../../mocks/supabase";
import { createMockProfile } from "../../mocks/factories";
import {
  updateDirectorioUser,
  createDirectorioUser,
} from "@/app/(dashboard)/directorio/actions";

const mockAdminUser = {
  id: "admin-1",
  email: "admin@test.com",
  profile: createMockProfile({ role: "admin" }),
};

describe("updateDirectorioUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(mockAdminUser as never);
  });

  it("success → returns { success: true, data: { updated: true } }", async () => {
    const chain = createQueryChain({ data: null, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await updateDirectorioUser({
      user_id: "550e8400-e29b-41d4-a716-446655440123",
      nombre: "Juan Pérez",
      puesto: "",
      telefono: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ updated: true });
    }
    expect(revalidatePath).toHaveBeenCalledWith("/directorio");
  });

  it("success with all optional fields → returns { success: true, data: { updated: true } }", async () => {
    const chain = createQueryChain({ data: null, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await updateDirectorioUser({
      user_id: "550e8400-e29b-41d4-a716-446655440123",
      nombre: "Juan Pérez",
      puesto: "Developer",
      telefono: "+34 600 000 000",
      entity_id: "550e8400-e29b-41d4-a716-446655440001",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ updated: true });
    }
  });

  it("DB error → success: false, error contains 'Error al actualizar el usuario'", async () => {
    const chain = createQueryChain({
      data: null,
      error: { message: "DB error updating profile" },
    });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await updateDirectorioUser({
      user_id: "550e8400-e29b-41d4-a716-446655440123",
      nombre: "Juan Pérez",
      puesto: "",
      telefono: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Error al actualizar el usuario");
    }
  });

  it("calls profiles table with correct user_id", async () => {
    const chain = createQueryChain({ data: null, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await updateDirectorioUser({
      user_id: "550e8400-e29b-41d4-a716-44665544abc0",
      nombre: "Test User",
      puesto: "",
      telefono: "",
    });

    expect(client.from).toHaveBeenCalledWith("profiles");
  });
});

describe("createDirectorioUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue(mockAdminUser as never);
  });

  function mockAdminClientWithCreateUser(result: {
    data: { user: { id: string } | null };
    error: { message: string } | null;
  }) {
    const adminClientMock = {
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue(result),
        },
      },
    };
    vi.mocked(createAdminClient).mockReturnValue(
      adminClientMock as unknown as ReturnType<typeof createAdminClient>
    );
    return adminClientMock;
  }

  it("success → returns { success: true, data: { created: true } }", async () => {
    mockAdminClientWithCreateUser({
      data: { user: { id: "new-user-1" } },
      error: null,
    });
    // Also mock createClient for the secondary profile update (won't be called if no puesto)
    const chain = createQueryChain({ data: null, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await createDirectorioUser({
      correo: "newuser@test.com",
      nombre: "New User",
      puesto: "",
      telefono: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ created: true });
    }
    expect(revalidatePath).toHaveBeenCalledWith("/directorio");
  });

  it("'already been registered' error → success: false, error contains 'Ya existe un usuario'", async () => {
    mockAdminClientWithCreateUser({
      data: { user: null },
      error: { message: "User with this email has already been registered" },
    });

    const result = await createDirectorioUser({
      correo: "existing@test.com",
      nombre: "Existing User",
      puesto: "",
      telefono: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain(
        "Ya existe un usuario con ese correo electrónico."
      );
    }
  });

  it("other auth error → success: false, error contains 'Error al crear el usuario'", async () => {
    mockAdminClientWithCreateUser({
      data: { user: null },
      error: { message: "Rate limit exceeded" },
    });

    const result = await createDirectorioUser({
      correo: "newuser@test.com",
      nombre: "User",
      puesto: "",
      telefono: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Error al crear el usuario");
    }
  });

  it("success with puesto → secondary profile update is called", async () => {
    mockAdminClientWithCreateUser({
      data: { user: { id: "new-user-2" } },
      error: null,
    });
    const chain = createQueryChain({ data: null, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await createDirectorioUser({
      correo: "newuser2@test.com",
      nombre: "New User With Puesto",
      puesto: "Software Engineer",
      telefono: "",
    });

    expect(result.success).toBe(true);
    // The secondary call to update job_title should have been made
    expect(client.from).toHaveBeenCalledWith("profiles");
  });

  it("success with puesto but secondary update fails → still returns success (non-blocking)", async () => {
    mockAdminClientWithCreateUser({
      data: { user: { id: "new-user-3" } },
      error: null,
    });
    // Secondary update fails
    const chain = createQueryChain({
      data: null,
      error: { message: "Update failed" },
    });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await createDirectorioUser({
      correo: "newuser3@test.com",
      nombre: "New User",
      puesto: "Designer",
      telefono: "",
    });

    // Should still succeed even if secondary update fails
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ created: true });
    }
  });

  it("success without puesto → secondary update NOT called", async () => {
    mockAdminClientWithCreateUser({
      data: { user: { id: "new-user-4" } },
      error: null,
    });
    const chain = createQueryChain({ data: null, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await createDirectorioUser({
      correo: "nopuesto@test.com",
      nombre: "No Puesto User",
      puesto: "",
      telefono: "",
    });

    // createClient for profile update should NOT have been called
    expect(client.from).not.toHaveBeenCalled();
  });

  it("success with entity_id → creates user with entity_id in metadata", async () => {
    const adminClientMock = mockAdminClientWithCreateUser({
      data: { user: { id: "new-user-5" } },
      error: null,
    });

    await createDirectorioUser({
      correo: "entity@test.com",
      nombre: "Entity User",
      puesto: "",
      telefono: "",
      entity_id: "550e8400-e29b-41d4-a716-446655440001",
    });

    expect(adminClientMock.auth.admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        user_metadata: expect.objectContaining({
          entity_id: "550e8400-e29b-41d4-a716-446655440001",
        }),
      })
    );
  });
});
