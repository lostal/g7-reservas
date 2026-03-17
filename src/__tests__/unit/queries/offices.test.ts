import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { createQueryChain } from "../../mocks/supabase";
import { createMockOfficeSpot } from "../../mocks/factories";
import {
  getOfficeSpots,
  getOfficeAvailabilityForDate,
  getAvailableTimeSlots,
  getUserOfficeReservations,
} from "@/lib/queries/offices";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildClient(
  tableMap: Record<string, { data: unknown; error: { message: string } | null }>
) {
  return {
    from: vi.fn((table: string) => {
      const response = tableMap[table] ?? { data: [], error: null };
      return createQueryChain(
        response as { data: unknown; error: { message: string } | null }
      );
    }),
  };
}

// ─── getOfficeSpots ───────────────────────────────────────────────────────────

describe("getOfficeSpots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns active office spots from DB", async () => {
    const spot1 = createMockOfficeSpot({ id: "spot-1", label: "OF-01" });
    const spot2 = createMockOfficeSpot({ id: "spot-2", label: "OF-02" });
    const client = buildClient({
      spots: { data: [spot1, spot2], error: null },
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getOfficeSpots();
    expect(result).toHaveLength(2);
    expect(result[0]?.label).toBe("OF-01");
    expect(result[1]?.label).toBe("OF-02");
  });

  it("with entityId → query is called on spots table", async () => {
    const spot = createMockOfficeSpot({ entity_id: "ent-1" });
    const client = buildClient({
      spots: { data: [spot], error: null },
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getOfficeSpots("ent-1");
    expect(client.from).toHaveBeenCalledWith("spots");
    expect(result).toHaveLength(1);
  });

  it("empty DB → returns []", async () => {
    const client = buildClient({
      spots: { data: [], error: null },
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getOfficeSpots();
    expect(result).toEqual([]);
  });

  it("DB error → throws", async () => {
    const client = buildClient({
      spots: { data: null as never, error: { message: "DB error" } },
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(getOfficeSpots()).rejects.toThrow(
      "No se pudieron obtener los puestos"
    );
  });
});

// ─── getOfficeAvailabilityForDate ────────────────────────────────────────────

/**
 * Creates a query chain that also supports `.in()` (not in the base mock).
 * The `getOfficeAvailabilityForDate` function uses `.in("spot_id", spotIds)`
 * on reservations and cessions sub-queries.
 */
function createChainWithIn<T>(response: {
  data: T;
  error: { message: string } | null;
}) {
  const chain = createQueryChain(response) as Record<string, unknown> &
    PromiseLike<{ data: T; error: { message: string } | null }>;
  // Add `.in()` to the chain returning the chain itself
  chain["in"] = vi.fn().mockReturnValue(chain);
  return chain;
}

function buildAvailabilityClient(opts: {
  spots: ReturnType<typeof createMockOfficeSpot>[];
  spotsError?: { message: string } | null;
  reservations: {
    id: string;
    spot_id: string;
    start_time: string | null;
    end_time: string | null;
  }[];
  cessions: { id: string; spot_id: string; status: string }[];
}) {
  const spotsChain = createChainWithIn({
    data: opts.spots,
    error: opts.spotsError ?? null,
  });
  const reservationsChain = createChainWithIn({
    data: opts.reservations,
    error: null,
  });
  const cessionsChain = createChainWithIn({ data: opts.cessions, error: null });

  return {
    from: vi.fn((table: string) => {
      if (table === "spots") return spotsChain;
      if (table === "reservations") return reservationsChain;
      if (table === "cessions") return cessionsChain;
      return createChainWithIn({ data: [], error: null });
    }),
  };
}

describe("getOfficeAvailabilityForDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no reservations → all visitor spots are 'free'", async () => {
    const spot = createMockOfficeSpot({
      id: "spot-1",
      type: "visitor",
      assigned_to: null,
    });
    const client = buildAvailabilityClient({
      spots: [spot],
      reservations: [],
      cessions: [],
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getOfficeAvailabilityForDate("2026-04-01");
    expect(result).toHaveLength(1);
    expect(result[0]?.status).toBe("free");
  });

  it("visitor spot with reservation → status is 'occupied'", async () => {
    const spot = createMockOfficeSpot({
      id: "spot-1",
      type: "visitor",
      assigned_to: null,
    });
    const client = buildAvailabilityClient({
      spots: [spot],
      reservations: [
        { id: "res-1", spot_id: "spot-1", start_time: null, end_time: null },
      ],
      cessions: [],
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getOfficeAvailabilityForDate("2026-04-01");
    expect(result[0]?.status).toBe("occupied");
  });

  it("assigned spot with cession status='available' → status is 'ceded'", async () => {
    const spot = createMockOfficeSpot({
      id: "spot-1",
      type: "standard",
      assigned_to: "owner-user",
    });
    const client = buildAvailabilityClient({
      spots: [spot],
      reservations: [],
      cessions: [{ id: "ces-1", spot_id: "spot-1", status: "available" }],
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getOfficeAvailabilityForDate("2026-04-01");
    expect(result[0]?.status).toBe("ceded");
  });

  it("assigned spot without cession → status is 'occupied'", async () => {
    const spot = createMockOfficeSpot({
      id: "spot-1",
      type: "standard",
      assigned_to: "owner-user",
    });
    const client = buildAvailabilityClient({
      spots: [spot],
      reservations: [],
      cessions: [],
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getOfficeAvailabilityForDate("2026-04-01");
    expect(result[0]?.status).toBe("occupied");
  });

  it("assigned spot with cession but has reservation → status is 'occupied'", async () => {
    const spot = createMockOfficeSpot({
      id: "spot-1",
      type: "standard",
      assigned_to: "owner-user",
    });
    const client = buildAvailabilityClient({
      spots: [spot],
      reservations: [
        { id: "res-1", spot_id: "spot-1", start_time: null, end_time: null },
      ],
      cessions: [{ id: "ces-1", spot_id: "spot-1", status: "available" }],
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    // Has reservation → occupied even if cession is available
    const result = await getOfficeAvailabilityForDate("2026-04-01");
    expect(result[0]?.status).toBe("occupied");
  });

  it("unassigned standard spot (assigned_to=null) → status is 'occupied'", async () => {
    const spot = createMockOfficeSpot({
      id: "spot-1",
      type: "standard",
      assigned_to: null,
    });
    const client = buildAvailabilityClient({
      spots: [spot],
      reservations: [],
      cessions: [],
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getOfficeAvailabilityForDate("2026-04-01");
    expect(result[0]?.status).toBe("occupied");
  });

  it("empty spots → returns []", async () => {
    const spotsChain = createChainWithIn({ data: [], error: null });
    const client = { from: vi.fn().mockReturnValue(spotsChain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getOfficeAvailabilityForDate("2026-04-01");
    expect(result).toEqual([]);
  });

  it("spots query error → throws", async () => {
    const spotsChain = createChainWithIn({
      data: null as never,
      error: { message: "spots error" },
    });
    const client = { from: vi.fn().mockReturnValue(spotsChain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(getOfficeAvailabilityForDate("2026-04-01")).rejects.toThrow(
      "No se pudieron obtener los puestos"
    );
  });
});

// ─── getAvailableTimeSlots ────────────────────────────────────────────────────

describe("getAvailableTimeSlots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no existing reservations → all slots available (8am-10am, 60min = 2 slots)", async () => {
    const chain = createQueryChain({ data: [], error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    // startHour=8, endHour=10, slotDurationMinutes=60
    const slots = await getAvailableTimeSlots(
      "spot-1",
      "2026-04-01",
      8,
      10,
      60
    );
    expect(slots).toHaveLength(2);
    expect(slots[0]).toEqual({
      start_time: "08:00",
      end_time: "09:00",
      available: true,
    });
    expect(slots[1]).toEqual({
      start_time: "09:00",
      end_time: "10:00",
      available: true,
    });
  });

  it("existing reservation at 08:00-09:00 → that slot is not available", async () => {
    const reservations = [{ start_time: "08:00", end_time: "09:00" }];
    const chain = createQueryChain({ data: reservations, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const slots = await getAvailableTimeSlots(
      "spot-1",
      "2026-04-01",
      8,
      10,
      60
    );
    expect(slots).toHaveLength(2);
    expect(slots[0]).toEqual({
      start_time: "08:00",
      end_time: "09:00",
      available: false,
    });
    expect(slots[1]).toEqual({
      start_time: "09:00",
      end_time: "10:00",
      available: true,
    });
  });

  it("all-day reservation (null start/end) → no slots available", async () => {
    const reservations = [{ start_time: null, end_time: null }];
    const chain = createQueryChain({ data: reservations, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const slots = await getAvailableTimeSlots(
      "spot-1",
      "2026-04-01",
      8,
      10,
      60
    );
    expect(slots).toHaveLength(2);
    expect(slots.every((s) => !s.available)).toBe(true);
  });

  it("8am-20am with 60min slots → 12 slots total", async () => {
    const chain = createQueryChain({ data: [], error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const slots = await getAvailableTimeSlots(
      "spot-1",
      "2026-04-01",
      8,
      20,
      60
    );
    expect(slots).toHaveLength(12);
    expect(slots[0]?.start_time).toBe("08:00");
    expect(slots[11]?.end_time).toBe("20:00");
  });

  it("30-minute slots 8am-10am → 4 slots", async () => {
    const chain = createQueryChain({ data: [], error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const slots = await getAvailableTimeSlots(
      "spot-1",
      "2026-04-01",
      8,
      10,
      30
    );
    expect(slots).toHaveLength(4);
    expect(slots[0]).toEqual({
      start_time: "08:00",
      end_time: "08:30",
      available: true,
    });
    expect(slots[1]).toEqual({
      start_time: "08:30",
      end_time: "09:00",
      available: true,
    });
  });

  it("DB error → throws", async () => {
    const chain = createQueryChain({
      data: null as never,
      error: { message: "query failed" },
    });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(
      getAvailableTimeSlots("spot-1", "2026-04-01", 8, 10, 60)
    ).rejects.toThrow("No se pudieron obtener las franjas");
  });

  it("overlapping reservation (09:00-10:00) blocks the 09:00-10:00 slot", async () => {
    const reservations = [{ start_time: "09:00", end_time: "10:00" }];
    const chain = createQueryChain({ data: reservations, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const slots = await getAvailableTimeSlots(
      "spot-1",
      "2026-04-01",
      8,
      10,
      60
    );
    expect(slots[0]?.available).toBe(true); // 08:00-09:00 free
    expect(slots[1]?.available).toBe(false); // 09:00-10:00 blocked
  });

  it("all-day reservation with null start blocks even when there are other timed reservations", async () => {
    const reservations = [
      { start_time: null, end_time: null },
      { start_time: "09:00", end_time: "10:00" },
    ];
    const chain = createQueryChain({ data: reservations, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const slots = await getAvailableTimeSlots(
      "spot-1",
      "2026-04-01",
      8,
      10,
      60
    );
    expect(slots.every((s) => !s.available)).toBe(true);
  });
});

// ─── getUserOfficeReservations ────────────────────────────────────────────────

describe("getUserOfficeReservations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns future confirmed reservations with spot details", async () => {
    const rows = [
      {
        id: "res-1",
        spot_id: "spot-1",
        user_id: "user-1",
        date: "2026-04-15",
        status: "confirmed",
        notes: null,
        start_time: null,
        end_time: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        spots: { label: "OF-01", resource_type: "office" },
        profiles: { full_name: "Test User" },
      },
    ];
    const chain = createQueryChain({ data: rows, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getUserOfficeReservations("user-1");
    expect(result).toHaveLength(1);
    expect(result[0]?.spot_label).toBe("OF-01");
    expect(result[0]?.resource_type).toBe("office");
    expect(result[0]?.user_name).toBe("Test User");
    expect(result[0]?.date).toBe("2026-04-15");
  });

  it("empty result → returns []", async () => {
    const chain = createQueryChain({ data: [], error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getUserOfficeReservations("user-1");
    expect(result).toEqual([]);
  });

  it("DB error → throws", async () => {
    const chain = createQueryChain({
      data: null as never,
      error: { message: "DB error" },
    });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(getUserOfficeReservations("user-1")).rejects.toThrow(
      "No se pudieron obtener las reservas de oficina"
    );
  });

  it("filters out rows where spots.resource_type is not 'office'", async () => {
    const rows = [
      {
        id: "res-1",
        spot_id: "spot-1",
        user_id: "user-1",
        date: "2026-04-15",
        status: "confirmed",
        notes: null,
        start_time: null,
        end_time: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        spots: { label: "OF-01", resource_type: "office" },
        profiles: { full_name: "Test User" },
      },
      {
        id: "res-2",
        spot_id: "spot-2",
        user_id: "user-1",
        date: "2026-04-16",
        status: "confirmed",
        notes: null,
        start_time: null,
        end_time: null,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        spots: null, // No spots join — should be filtered out
        profiles: { full_name: "Test User" },
      },
    ];
    const chain = createQueryChain({ data: rows, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getUserOfficeReservations("user-1");
    // The row with spots=null is filtered since spots?.resource_type !== "office"
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("res-1");
  });

  it("maps start_time and end_time correctly for time-slot reservations", async () => {
    const rows = [
      {
        id: "res-1",
        spot_id: "spot-1",
        user_id: "user-1",
        date: "2026-04-15",
        status: "confirmed",
        notes: "morning slot",
        start_time: "09:00",
        end_time: "10:00",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        spots: { label: "OF-02", resource_type: "office" },
        profiles: { full_name: "Slot User" },
      },
    ];
    const chain = createQueryChain({ data: rows, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getUserOfficeReservations("user-1");
    expect(result[0]?.start_time).toBe("09:00");
    expect(result[0]?.end_time).toBe("10:00");
    expect(result[0]?.notes).toBe("morning slot");
  });
});
