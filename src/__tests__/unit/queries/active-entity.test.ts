import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));
vi.mock("@/lib/supabase/auth", () => ({
  getCurrentUser: vi.fn(),
}));

import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createMockProfile } from "../../mocks/factories";
import {
  getActiveEntityId,
  getEffectiveEntityId,
} from "@/lib/queries/active-entity";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function mockCookieStore(entityId: string | undefined): CookieStore {
  return {
    get: vi.fn((name: string) =>
      name === "active-entity-id" && entityId !== undefined
        ? { value: entityId }
        : undefined
    ),
  } as unknown as CookieStore;
}

describe("getActiveEntityId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cookie exists → returns its value", async () => {
    vi.mocked(cookies).mockResolvedValue(mockCookieStore("entity-123"));

    const result = await getActiveEntityId();
    expect(result).toBe("entity-123");
  });

  it("cookie missing → returns null", async () => {
    vi.mocked(cookies).mockResolvedValue(mockCookieStore(undefined));

    const result = await getActiveEntityId();
    expect(result).toBeNull();
  });

  it("different cookie name → returns null", async () => {
    const store = {
      get: vi.fn((name: string) =>
        name === "other-cookie" ? { value: "some-value" } : undefined
      ),
    } as unknown as CookieStore;
    vi.mocked(cookies).mockResolvedValue(store);

    const result = await getActiveEntityId();
    expect(result).toBeNull();
  });
});

describe("getEffectiveEntityId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no user (unauthenticated) → returns null", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    vi.mocked(cookies).mockResolvedValue(mockCookieStore(undefined));

    const result = await getEffectiveEntityId();
    expect(result).toBeNull();
  });

  it("admin with cookie → returns cookie value", async () => {
    const adminProfile = createMockProfile({ role: "admin", entity_id: null });
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "admin-1",
      email: "admin@test.com",
      profile: adminProfile,
    });
    vi.mocked(cookies).mockResolvedValue(mockCookieStore("entity-456"));

    const result = await getEffectiveEntityId();
    expect(result).toBe("entity-456");
  });

  it("admin without cookie → returns null", async () => {
    const adminProfile = createMockProfile({ role: "admin", entity_id: null });
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "admin-1",
      email: "admin@test.com",
      profile: adminProfile,
    });
    vi.mocked(cookies).mockResolvedValue(mockCookieStore(undefined));

    const result = await getEffectiveEntityId();
    expect(result).toBeNull();
  });

  it("employee with entity_id → returns entity_id from profile", async () => {
    const employeeProfile = createMockProfile({
      role: "employee",
      entity_id: "ent-789",
    });
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
      email: "emp@test.com",
      profile: employeeProfile,
    });
    vi.mocked(cookies).mockResolvedValue(mockCookieStore(undefined));

    const result = await getEffectiveEntityId();
    expect(result).toBe("ent-789");
  });

  it("employee without entity_id → returns null", async () => {
    const employeeProfile = createMockProfile({
      role: "employee",
      entity_id: null,
    });
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
      email: "emp@test.com",
      profile: employeeProfile,
    });
    vi.mocked(cookies).mockResolvedValue(mockCookieStore(undefined));

    const result = await getEffectiveEntityId();
    expect(result).toBeNull();
  });

  it("employee ignores cookie, uses profile entity_id instead", async () => {
    const employeeProfile = createMockProfile({
      role: "employee",
      entity_id: "ent-from-profile",
    });
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
      email: "emp@test.com",
      profile: employeeProfile,
    });
    // Cookie is set but should be ignored for non-admin users
    vi.mocked(cookies).mockResolvedValue(mockCookieStore("ent-from-cookie"));

    const result = await getEffectiveEntityId();
    expect(result).toBe("ent-from-profile");
  });

  it("user with null profile → returns null", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      profile: null,
    });
    vi.mocked(cookies).mockResolvedValue(mockCookieStore(undefined));

    const result = await getEffectiveEntityId();
    expect(result).toBeNull();
  });

  it("hr role with entity_id → returns entity_id from profile (non-admin path)", async () => {
    const hrProfile = createMockProfile({
      role: "hr",
      entity_id: "ent-hr",
    });
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "hr-1",
      email: "hr@test.com",
      profile: hrProfile,
    });
    vi.mocked(cookies).mockResolvedValue(mockCookieStore(undefined));

    const result = await getEffectiveEntityId();
    expect(result).toBe("ent-hr");
  });
});
