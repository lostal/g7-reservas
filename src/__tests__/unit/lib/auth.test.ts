import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
}));
vi.mock("@/lib/constants", () => ({
  ROUTES: {
    LOGIN: "/login",
    PARKING: "/parking",
    OFFICES: "/oficinas",
  },
}));

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createQueryChain } from "../../mocks/supabase";
import { createMockProfile } from "../../mocks/factories";
import {
  getCurrentUser,
  requireAuth,
  requireAdmin,
  requireHR,
  requireManagerOrAbove,
  requireSpotOwner,
} from "@/lib/supabase/auth";

type MockUser = { id: string; email: string };
type MockSupabaseClient = {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
  };
  from: ReturnType<typeof vi.fn>;
};

function buildSupabaseClient(
  authUser: MockUser | null,
  authError: { message: string } | null,
  profile: ReturnType<typeof createMockProfile> | null,
  spot: { id: string } | null = null
): MockSupabaseClient {
  const profileChain = createQueryChain({
    data: profile,
    error: null,
  });
  const spotChain = createQueryChain({
    data: spot,
    error: null,
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUser },
        error: authError,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") return profileChain;
      if (table === "spots") return spotChain;
      return createQueryChain({ data: null, error: null });
    }),
  };
}

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("auth error → returns null", async () => {
    const client = buildSupabaseClient(null, { message: "Auth error" }, null);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );
    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it("no user → returns null", async () => {
    const client = buildSupabaseClient(null, null, null);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );
    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it("user with profile → returns AuthUser with id, email, profile", async () => {
    const mockUser: MockUser = { id: "user-123", email: "test@example.com" };
    const mockProfile = createMockProfile({ id: "user-123", role: "employee" });
    const client = buildSupabaseClient(mockUser, null, mockProfile);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getCurrentUser();
    expect(result).not.toBeNull();
    expect(result?.id).toBe("user-123");
    expect(result?.email).toBe("test@example.com");
    expect(result?.profile?.role).toBe("employee");
  });

  it("user with no profile → returns AuthUser with profile=null", async () => {
    const mockUser: MockUser = { id: "user-123", email: "test@example.com" };
    const client = buildSupabaseClient(mockUser, null, null);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getCurrentUser();
    expect(result).not.toBeNull();
    expect(result?.profile).toBeNull();
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unauthenticated → calls redirect('/login')", async () => {
    const client = buildSupabaseClient(null, null, null);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(requireAuth()).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("authenticated → returns user", async () => {
    const mockUser: MockUser = { id: "user-123", email: "test@example.com" };
    const mockProfile = createMockProfile({ id: "user-123" });
    const client = buildSupabaseClient(mockUser, null, mockProfile);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const user = await requireAuth();
    expect(user.id).toBe("user-123");
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("employee role → calls redirect('/parking')", async () => {
    const mockUser: MockUser = { id: "user-123", email: "test@example.com" };
    const mockProfile = createMockProfile({ id: "user-123", role: "employee" });
    const client = buildSupabaseClient(mockUser, null, mockProfile);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(requireAdmin()).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/parking");
  });

  it("hr role → calls redirect('/parking')", async () => {
    const mockUser: MockUser = { id: "user-123", email: "test@example.com" };
    const mockProfile = createMockProfile({ id: "user-123", role: "hr" });
    const client = buildSupabaseClient(mockUser, null, mockProfile);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(requireAdmin()).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/parking");
  });

  it("admin role → returns user", async () => {
    const mockUser: MockUser = { id: "user-123", email: "admin@example.com" };
    const mockProfile = createMockProfile({ id: "user-123", role: "admin" });
    const client = buildSupabaseClient(mockUser, null, mockProfile);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const user = await requireAdmin();
    expect(user.id).toBe("user-123");
    expect(user.profile?.role).toBe("admin");
  });
});

describe("requireHR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("employee role → redirect('/parking')", async () => {
    const mockUser: MockUser = { id: "user-123", email: "test@example.com" };
    const mockProfile = createMockProfile({ id: "user-123", role: "employee" });
    const client = buildSupabaseClient(mockUser, null, mockProfile);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(requireHR()).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/parking");
  });

  it("manager role → redirect('/parking')", async () => {
    const mockUser: MockUser = { id: "user-123", email: "test@example.com" };
    const mockProfile = createMockProfile({ id: "user-123", role: "manager" });
    const client = buildSupabaseClient(mockUser, null, mockProfile);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(requireHR()).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/parking");
  });

  it("hr role → returns user", async () => {
    const mockUser: MockUser = { id: "user-123", email: "hr@example.com" };
    const mockProfile = createMockProfile({ id: "user-123", role: "hr" });
    const client = buildSupabaseClient(mockUser, null, mockProfile);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const user = await requireHR();
    expect(user.profile?.role).toBe("hr");
  });

  it("admin role → returns user", async () => {
    const mockUser: MockUser = { id: "user-123", email: "admin@example.com" };
    const mockProfile = createMockProfile({ id: "user-123", role: "admin" });
    const client = buildSupabaseClient(mockUser, null, mockProfile);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const user = await requireHR();
    expect(user.profile?.role).toBe("admin");
  });
});

describe("requireManagerOrAbove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("employee role → redirect('/parking')", async () => {
    const mockUser: MockUser = { id: "user-123", email: "test@example.com" };
    const mockProfile = createMockProfile({ id: "user-123", role: "employee" });
    const client = buildSupabaseClient(mockUser, null, mockProfile);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(requireManagerOrAbove()).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/parking");
  });

  it("manager role → returns user", async () => {
    const mockUser: MockUser = { id: "user-123", email: "mgr@example.com" };
    const mockProfile = createMockProfile({ id: "user-123", role: "manager" });
    const client = buildSupabaseClient(mockUser, null, mockProfile);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const user = await requireManagerOrAbove();
    expect(user.profile?.role).toBe("manager");
  });

  it("hr role → returns user", async () => {
    const mockUser: MockUser = { id: "user-123", email: "hr@example.com" };
    const mockProfile = createMockProfile({ id: "user-123", role: "hr" });
    const client = buildSupabaseClient(mockUser, null, mockProfile);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const user = await requireManagerOrAbove();
    expect(user.profile?.role).toBe("hr");
  });

  it("admin role → returns user", async () => {
    const mockUser: MockUser = { id: "user-123", email: "admin@example.com" };
    const mockProfile = createMockProfile({ id: "user-123", role: "admin" });
    const client = buildSupabaseClient(mockUser, null, mockProfile);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const user = await requireManagerOrAbove();
    expect(user.profile?.role).toBe("admin");
  });
});

describe("requireSpotOwner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin role → bypasses spot check and returns user", async () => {
    const mockUser: MockUser = { id: "admin-1", email: "admin@example.com" };
    const mockProfile = createMockProfile({ id: "admin-1", role: "admin" });
    // Spot query should not matter for admin
    const client = buildSupabaseClient(mockUser, null, mockProfile, null);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const user = await requireSpotOwner("parking");
    expect(user.id).toBe("admin-1");
    // Spot query from should not have been called for "spots" table
    const fromCalls = (client.from as ReturnType<typeof vi.fn>).mock.calls;
    const spotCalls = fromCalls.filter((args: string[]) => args[0] === "spots");
    expect(spotCalls).toHaveLength(0);
  });

  it("employee with assigned parking spot → returns user", async () => {
    const mockUser: MockUser = { id: "user-1", email: "emp@example.com" };
    const mockProfile = createMockProfile({ id: "user-1", role: "employee" });
    const mockSpot = { id: "spot-1" };
    const client = buildSupabaseClient(mockUser, null, mockProfile, mockSpot);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const user = await requireSpotOwner("parking");
    expect(user.id).toBe("user-1");
  });

  it("employee without parking spot → redirect('/parking')", async () => {
    const mockUser: MockUser = { id: "user-1", email: "emp@example.com" };
    const mockProfile = createMockProfile({ id: "user-1", role: "employee" });
    const client = buildSupabaseClient(mockUser, null, mockProfile, null);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(requireSpotOwner("parking")).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/parking");
  });

  it("employee without office spot → redirect('/oficinas')", async () => {
    const mockUser: MockUser = { id: "user-1", email: "emp@example.com" };
    const mockProfile = createMockProfile({ id: "user-1", role: "employee" });
    const client = buildSupabaseClient(mockUser, null, mockProfile, null);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(requireSpotOwner("office")).rejects.toThrow("REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/oficinas");
  });

  it("employee with assigned office spot → returns user", async () => {
    const mockUser: MockUser = { id: "user-1", email: "emp@example.com" };
    const mockProfile = createMockProfile({ id: "user-1", role: "employee" });
    const mockSpot = { id: "office-spot-1" };
    const client = buildSupabaseClient(mockUser, null, mockProfile, mockSpot);
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const user = await requireSpotOwner("office");
    expect(user.id).toBe("user-1");
  });
});
