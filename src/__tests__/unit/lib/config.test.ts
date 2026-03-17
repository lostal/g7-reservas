import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((fn: unknown) => fn),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateTag } from "next/cache";
import { createQueryChain } from "../../mocks/supabase";

// Import after mocks are set up
import {
  getAllResourceConfigs,
  getGlobalConfigs,
  getResourceConfig,
  invalidateConfigCache,
  CONFIG_CACHE_TAG,
} from "@/lib/config";

type MockRow = { key: string; value: unknown };

function setupAdminClient(rows: MockRow[]) {
  const mockChain = createQueryChain({ data: rows, error: null });
  const mockAdminClient = {
    from: vi.fn().mockReturnValue(mockChain),
  };
  vi.mocked(createAdminClient).mockReturnValue(
    mockAdminClient as unknown as ReturnType<typeof createAdminClient>
  );
  return mockAdminClient;
}

describe("getAllResourceConfigs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("empty DB → returns parking defaults", async () => {
    setupAdminClient([]);
    const config = await getAllResourceConfigs("parking");
    expect(config.booking_enabled).toBe(true);
    expect(config.max_advance_days).toBe(14);
    expect(config.allowed_days).toEqual([1, 2, 3, 4, 5]);
    expect(config.cession_enabled).toBe(true);
    expect(config.time_slots_enabled).toBe(false);
  });

  it("empty DB → returns office defaults", async () => {
    setupAdminClient([]);
    const config = await getAllResourceConfigs("office");
    expect(config.booking_enabled).toBe(true);
    expect(config.max_advance_days).toBe(7);
    expect(config.time_slots_enabled).toBe(true);
    expect(config.slot_duration_minutes).toBe(60);
    expect(config.day_start_hour).toBe(8);
    expect(config.day_end_hour).toBe(20);
  });

  it("DB has parking.max_advance_days=30 → returns 30", async () => {
    setupAdminClient([{ key: "parking.max_advance_days", value: 30 }]);
    const config = await getAllResourceConfigs("parking");
    expect(config.max_advance_days).toBe(30);
  });

  it("DB has parking.booking_enabled=true (boolean) → true", async () => {
    setupAdminClient([{ key: "parking.booking_enabled", value: true }]);
    const config = await getAllResourceConfigs("parking");
    expect(config.booking_enabled).toBe(true);
  });

  it("DB has parking.booking_enabled=1 (integer) → true", async () => {
    setupAdminClient([{ key: "parking.booking_enabled", value: 1 }]);
    const config = await getAllResourceConfigs("parking");
    expect(config.booking_enabled).toBe(true);
  });

  it("DB has parking.booking_enabled=false (boolean) → false", async () => {
    setupAdminClient([{ key: "parking.booking_enabled", value: false }]);
    const config = await getAllResourceConfigs("parking");
    expect(config.booking_enabled).toBe(false);
  });

  it("DB has parking.booking_enabled=0 → false", async () => {
    setupAdminClient([{ key: "parking.booking_enabled", value: 0 }]);
    const config = await getAllResourceConfigs("parking");
    expect(config.booking_enabled).toBe(false);
  });

  it("DB has parking.allowed_days as non-array string → falls back to default [1,2,3,4,5]", async () => {
    setupAdminClient([{ key: "parking.allowed_days", value: "1,2,3" }]);
    const config = await getAllResourceConfigs("parking");
    expect(config.allowed_days).toEqual([1, 2, 3, 4, 5]);
  });

  it("DB has parking.allowed_days as array → returns that array", async () => {
    setupAdminClient([{ key: "parking.allowed_days", value: [1, 3, 5] }]);
    const config = await getAllResourceConfigs("parking");
    expect(config.allowed_days).toEqual([1, 3, 5]);
  });

  it("DB has parking.slot_duration_minutes=null → null", async () => {
    setupAdminClient([{ key: "parking.slot_duration_minutes", value: null }]);
    const config = await getAllResourceConfigs("parking");
    expect(config.slot_duration_minutes).toBeNull();
  });

  it("DB has office.max_consecutive_days=2 → returns 2", async () => {
    setupAdminClient([{ key: "office.max_consecutive_days", value: 2 }]);
    const config = await getAllResourceConfigs("office");
    expect(config.max_consecutive_days).toBe(2);
  });
});

describe("getGlobalConfigs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("empty DB → defaults (notifications_enabled=true, email=true, teams=true)", async () => {
    setupAdminClient([]);
    const config = await getGlobalConfigs();
    expect(config.notifications_enabled).toBe(true);
    expect(config.email_notifications_enabled).toBe(true);
    expect(config.teams_notifications_enabled).toBe(true);
  });

  it("DB has notifications_enabled=false → false", async () => {
    setupAdminClient([{ key: "notifications_enabled", value: false }]);
    const config = await getGlobalConfigs();
    expect(config.notifications_enabled).toBe(false);
  });

  it("DB has email_notifications_enabled=0 → false", async () => {
    setupAdminClient([{ key: "email_notifications_enabled", value: 0 }]);
    const config = await getGlobalConfigs();
    expect(config.email_notifications_enabled).toBe(false);
  });

  it("DB has teams_notifications_enabled=1 → true", async () => {
    setupAdminClient([{ key: "teams_notifications_enabled", value: 1 }]);
    const config = await getGlobalConfigs();
    expect(config.teams_notifications_enabled).toBe(true);
  });
});

describe("getResourceConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to getAllResourceConfigs and returns single key value", async () => {
    setupAdminClient([{ key: "parking.max_advance_days", value: 21 }]);
    const value = await getResourceConfig("parking", "max_advance_days");
    expect(value).toBe(21);
  });

  it("returns default when key not in DB", async () => {
    setupAdminClient([]);
    const value = await getResourceConfig("parking", "max_advance_days");
    expect(value).toBe(14);
  });

  it("returns boolean config correctly", async () => {
    setupAdminClient([{ key: "office.booking_enabled", value: false }]);
    const value = await getResourceConfig("office", "booking_enabled");
    expect(value).toBe(false);
  });
});

describe("invalidateConfigCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls revalidateTag with CONFIG_CACHE_TAG and 'default'", async () => {
    await invalidateConfigCache();
    expect(revalidateTag).toHaveBeenCalledWith(CONFIG_CACHE_TAG, "default");
  });

  it("calls revalidateTag exactly once", async () => {
    await invalidateConfigCache();
    expect(revalidateTag).toHaveBeenCalledTimes(1);
  });
});
