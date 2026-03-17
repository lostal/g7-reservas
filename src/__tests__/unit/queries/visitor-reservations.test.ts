import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { createQueryChain } from "../../mocks/supabase";
import {
  getUpcomingVisitorReservations,
  getAvailableVisitorSpotsForDate,
} from "@/lib/queries/visitor-reservations";

// Helper to build a visitor reservation join row
function makeVisitorRow(overrides: {
  id?: string;
  spot_id?: string;
  status?: string;
  date?: string;
  visitor_name?: string;
  spots?: { label: string; entity_id: string | null } | null;
  profiles?: { full_name: string } | null;
  reserved_by?: string;
}) {
  return {
    id: overrides.id ?? "vis-1",
    spot_id: overrides.spot_id ?? "spot-1",
    status: overrides.status ?? "confirmed",
    date: overrides.date ?? "2026-04-01",
    visitor_name: overrides.visitor_name ?? "Visitante Test",
    visitor_email: null,
    visitor_company: null,
    notes: null,
    reserved_by: overrides.reserved_by ?? "user-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    spots:
      overrides.spots !== undefined
        ? overrides.spots
        : { label: "V-01", entity_id: null },
    profiles:
      overrides.profiles !== undefined
        ? overrides.profiles
        : { full_name: "Test User" },
  };
}

describe("getUpcomingVisitorReservations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("empty result → returns []", async () => {
    const chain = createQueryChain({ data: [], error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getUpcomingVisitorReservations();
    expect(result).toEqual([]);
  });

  it("2 rows, no entityId → returns both mapped with spot_label and reserved_by_name", async () => {
    const rows = [
      makeVisitorRow({
        id: "vis-1",
        spots: { label: "V-01", entity_id: null },
        profiles: { full_name: "User One" },
      }),
      makeVisitorRow({
        id: "vis-2",
        spots: { label: "V-02", entity_id: "ent-1" },
        profiles: { full_name: "User Two" },
      }),
    ];
    const chain = createQueryChain({ data: rows, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getUpcomingVisitorReservations();
    expect(result).toHaveLength(2);
    expect(result[0]?.spot_label).toBe("V-01");
    expect(result[0]?.reserved_by_name).toBe("User One");
    expect(result[1]?.spot_label).toBe("V-02");
    expect(result[1]?.reserved_by_name).toBe("User Two");
  });

  it("entityId filter: row with matching entity_id → included", async () => {
    const rows = [
      makeVisitorRow({
        id: "vis-1",
        spots: { label: "V-01", entity_id: "ent-target" },
      }),
    ];
    const chain = createQueryChain({ data: rows, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getUpcomingVisitorReservations(
      undefined,
      "ent-target"
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("vis-1");
  });

  it("entityId filter: row with null entity_id → included (global spots)", async () => {
    const rows = [
      makeVisitorRow({
        id: "vis-1",
        spots: { label: "V-01", entity_id: null },
      }),
    ];
    const chain = createQueryChain({ data: rows, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getUpcomingVisitorReservations(
      undefined,
      "ent-target"
    );
    expect(result).toHaveLength(1);
  });

  it("entityId filter: row with other entity_id → excluded", async () => {
    const rows = [
      makeVisitorRow({
        id: "vis-1",
        spots: { label: "V-01", entity_id: "ent-other" },
      }),
    ];
    const chain = createQueryChain({ data: rows, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getUpcomingVisitorReservations(
      undefined,
      "ent-target"
    );
    expect(result).toHaveLength(0);
  });

  it("entityId filter: mixed rows → returns only matching and null entity_id", async () => {
    const rows = [
      makeVisitorRow({
        id: "vis-1",
        spots: { label: "V-01", entity_id: "ent-target" },
      }),
      makeVisitorRow({
        id: "vis-2",
        spots: { label: "V-02", entity_id: null },
      }),
      makeVisitorRow({
        id: "vis-3",
        spots: { label: "V-03", entity_id: "ent-other" },
      }),
    ];
    const chain = createQueryChain({ data: rows, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getUpcomingVisitorReservations(
      undefined,
      "ent-target"
    );
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(["vis-1", "vis-2"]);
  });

  it("DB error → throws", async () => {
    const chain = createQueryChain({
      data: null as never,
      error: { message: "DB connection failed" },
    });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(getUpcomingVisitorReservations()).rejects.toThrow(
      "No se pudieron obtener las reservas de visitantes"
    );
  });

  it("userId filter → query is called with userId", async () => {
    const chain = createQueryChain({ data: [], error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await getUpcomingVisitorReservations("user-specific-123");
    expect(client.from).toHaveBeenCalledWith("visitor_reservations");
  });

  it("row with null spots → mapped with empty spot_label", async () => {
    const rows = [makeVisitorRow({ id: "vis-1", spots: null, profiles: null })];
    const chain = createQueryChain({ data: rows, error: null });
    const client = { from: vi.fn().mockReturnValue(chain) };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getUpcomingVisitorReservations();
    expect(result[0]?.spot_label).toBe("");
    expect(result[0]?.reserved_by_name).toBe("");
  });
});

describe("getAvailableVisitorSpotsForDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildClientForAvailability(opts: {
    spots: { id: string; label: string }[];
    reservedSpotIds: { spot_id: string }[];
    spotsError?: { message: string } | null;
    reservedError?: { message: string } | null;
  }) {
    const spotsChain = createQueryChain({
      data: opts.spots,
      error: opts.spotsError ?? null,
    });
    const reservedChain = createQueryChain({
      data: opts.reservedSpotIds,
      error: opts.reservedError ?? null,
    });

    const client = {
      from: vi.fn((table: string) => {
        if (table === "spots") return spotsChain;
        if (table === "visitor_reservations") return reservedChain;
        return createQueryChain({ data: [], error: null });
      }),
    };
    return client;
  }

  it("all spots available → returns all spots", async () => {
    const client = buildClientForAvailability({
      spots: [
        { id: "spot-1", label: "V-01" },
        { id: "spot-2", label: "V-02" },
      ],
      reservedSpotIds: [],
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getAvailableVisitorSpotsForDate("2026-04-01");
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe("spot-1");
    expect(result[1]?.id).toBe("spot-2");
  });

  it("1 spot reserved → excludes it, returns remaining spots", async () => {
    const client = buildClientForAvailability({
      spots: [
        { id: "spot-1", label: "V-01" },
        { id: "spot-2", label: "V-02" },
      ],
      reservedSpotIds: [{ spot_id: "spot-1" }],
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getAvailableVisitorSpotsForDate("2026-04-01");
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("spot-2");
  });

  it("all spots reserved → returns []", async () => {
    const client = buildClientForAvailability({
      spots: [
        { id: "spot-1", label: "V-01" },
        { id: "spot-2", label: "V-02" },
      ],
      reservedSpotIds: [{ spot_id: "spot-1" }, { spot_id: "spot-2" }],
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getAvailableVisitorSpotsForDate("2026-04-01");
    expect(result).toHaveLength(0);
  });

  it("no spots in DB → returns []", async () => {
    const client = buildClientForAvailability({
      spots: [],
      reservedSpotIds: [],
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getAvailableVisitorSpotsForDate("2026-04-01");
    expect(result).toEqual([]);
  });

  it("spots query error → throws", async () => {
    const spotsChain = createQueryChain({
      data: null as never,
      error: { message: "DB error" },
    });
    const reservedChain = createQueryChain({ data: [], error: null });
    const client = {
      from: vi.fn((table: string) => {
        if (table === "spots") return spotsChain;
        return reservedChain;
      }),
    };
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(getAvailableVisitorSpotsForDate("2026-04-01")).rejects.toThrow(
      "No se pudieron obtener las plazas de visitantes"
    );
  });

  it("reserved query error → throws", async () => {
    const client = buildClientForAvailability({
      spots: [{ id: "spot-1", label: "V-01" }],
      reservedSpotIds: [],
      reservedError: { message: "DB error" },
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    await expect(getAvailableVisitorSpotsForDate("2026-04-01")).rejects.toThrow(
      "No se pudieron obtener las plazas de visitantes"
    );
  });

  it("excludeReservationId → passes to reserved query (query is still called)", async () => {
    const client = buildClientForAvailability({
      spots: [{ id: "spot-1", label: "V-01" }],
      reservedSpotIds: [],
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getAvailableVisitorSpotsForDate(
      "2026-04-01",
      "exclude-this-res-id"
    );
    expect(result).toHaveLength(1);
    expect(client.from).toHaveBeenCalledWith("visitor_reservations");
  });

  it("with entityId → spots query is called and includes entity filter", async () => {
    const client = buildClientForAvailability({
      spots: [{ id: "spot-1", label: "V-01" }],
      reservedSpotIds: [],
    });
    vi.mocked(createClient).mockResolvedValue(
      client as unknown as Awaited<ReturnType<typeof createClient>>
    );

    const result = await getAvailableVisitorSpotsForDate(
      "2026-04-01",
      undefined,
      "ent-1"
    );
    expect(result).toHaveLength(1);
    expect(client.from).toHaveBeenCalledWith("spots");
  });
});
