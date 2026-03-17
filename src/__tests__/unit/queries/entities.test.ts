import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { createQueryChain } from "../../mocks/supabase";
import { createMockEntity } from "../../mocks/factories";
import {
  getAllEntities,
  getEntityWithModules,
  getEntityEnabledModules,
} from "@/lib/queries/entities";

const ALL_MODULES = [
  "parking",
  "office",
  "visitors",
  "nominas",
  "vacaciones",
  "tablon",
];

function buildClient(tableMap: Record<string, unknown>) {
  return {
    from: vi.fn((table: string) => {
      const response = tableMap[table] ?? { data: [], error: null };
      return createQueryChain(response as { data: unknown; error: null });
    }),
  };
}

describe("getAllEntities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("empty DB → returns []", async () => {
    const client = buildClient({ entities: { data: [], error: null } });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getAllEntities();
    expect(result).toEqual([]);
  });

  it("DB returns 2 entities → returns both", async () => {
    const entity1 = createMockEntity({ id: "ent-1", name: "Sede A" });
    const entity2 = createMockEntity({ id: "ent-2", name: "Sede B" });
    const client = buildClient({
      entities: { data: [entity1, entity2], error: null },
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getAllEntities();
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe("Sede A");
    expect(result[1]?.name).toBe("Sede B");
  });

  it("DB error → returns [] (graceful — data is null)", async () => {
    const client = buildClient({
      entities: { data: null, error: { message: "DB error" } },
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getAllEntities();
    expect(result).toEqual([]);
  });
});

describe("getEntityWithModules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("entity not found → returns null", async () => {
    const entityChain = createQueryChain({ data: null, error: null });
    const modulesChain = createQueryChain({ data: [], error: null });

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "entities") return entityChain;
        if (table === "entity_modules") return modulesChain;
        return createQueryChain({ data: null, error: null });
      }),
    };
    vi.mocked(createClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getEntityWithModules("non-existent-id");
    expect(result).toBeNull();
  });

  it("entity found with no modules → returns entity with modules=[]", async () => {
    const mockEntity = createMockEntity({ id: "ent-1" });
    const entityChain = createQueryChain({ data: mockEntity, error: null });
    const modulesChain = createQueryChain({ data: [], error: null });

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "entities") return entityChain;
        if (table === "entity_modules") return modulesChain;
        return createQueryChain({ data: null, error: null });
      }),
    };
    vi.mocked(createClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getEntityWithModules("ent-1");
    expect(result).not.toBeNull();
    expect(result?.id).toBe("ent-1");
    expect(result?.modules).toEqual([]);
  });

  it("entity found with 2 modules → returns entity with modules array", async () => {
    const mockEntity = createMockEntity({ id: "ent-1" });
    const mockModules = [
      { entity_id: "ent-1", module: "parking", enabled: true },
      { entity_id: "ent-1", module: "office", enabled: false },
    ];
    const entityChain = createQueryChain({ data: mockEntity, error: null });
    const modulesChain = createQueryChain({ data: mockModules, error: null });

    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === "entities") return entityChain;
        if (table === "entity_modules") return modulesChain;
        return createQueryChain({ data: null, error: null });
      }),
    };
    vi.mocked(createClient).mockResolvedValue(
      mockClient as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getEntityWithModules("ent-1");
    expect(result?.modules).toHaveLength(2);
    expect(result?.modules[0]?.module).toBe("parking");
    expect(result?.modules[1]?.module).toBe("office");
  });
});

describe("getEntityEnabledModules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no rows in entity_modules → returns all 6 modules (opt-out model)", async () => {
    const client = buildClient({ entity_modules: { data: [], error: null } });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getEntityEnabledModules("ent-1");
    expect(result).toHaveLength(6);
    expect(result).toEqual(expect.arrayContaining(ALL_MODULES));
  });

  it("parking disabled → returns 5 modules without parking", async () => {
    const modules = [{ module: "parking", enabled: false }];
    const client = buildClient({
      entity_modules: { data: modules, error: null },
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getEntityEnabledModules("ent-1");
    expect(result).toHaveLength(5);
    expect(result).not.toContain("parking");
    expect(result).toContain("office");
    expect(result).toContain("visitors");
  });

  it("all modules disabled → returns []", async () => {
    const modules = ALL_MODULES.map((m) => ({ module: m, enabled: false }));
    const client = buildClient({
      entity_modules: { data: modules, error: null },
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getEntityEnabledModules("ent-1");
    expect(result).toHaveLength(0);
  });

  it("enabled=true rows are included in result", async () => {
    const modules = [
      { module: "parking", enabled: true },
      { module: "office", enabled: false },
    ];
    const client = buildClient({
      entity_modules: { data: modules, error: null },
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getEntityEnabledModules("ent-1");
    expect(result).toContain("parking");
    expect(result).not.toContain("office");
  });

  it("DB throws (e.g. migration pending) → returns all 6 modules as fallback", async () => {
    // createClient() is called before the try/catch, so we need the Supabase chain
    // to throw during the actual query (inside try/catch), not during createClient()
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation(() => {
        throw new Error("relation does not exist");
      }),
    };
    const client = {
      from: vi.fn().mockReturnValue(chain),
    };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getEntityEnabledModules("ent-1");
    expect(result).toHaveLength(6);
    expect(result).toEqual(expect.arrayContaining(ALL_MODULES));
  });
});
