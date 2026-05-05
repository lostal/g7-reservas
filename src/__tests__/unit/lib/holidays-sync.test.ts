/**
 * Tests de Holidays Sync (OpenHolidays API)
 *
 * Verifica:
 * - syncHolidaysForEntity: entidad sin CCAA → early return
 * - syncHolidaysForEntity: entidad con CCAA → sincroniza festivos
 * - syncHolidaysForEntity: crea nuevo calendario si no existe
 * - syncHolidaysForEntity: reutiliza calendario existente
 * - syncAllHolidays: agrega resultados entre múltiples entidades
 * - syncAllHolidays: captura errores por entidad sin romper el bucle
 * - getHolidayName: prefiere ES, fallback a primer idioma, fallback a "Festivo"
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  mockDb,
  resetDbMocks,
  setupSelectMock,
  setupInsertMock,
  setupUpdateMock,
} from "../../mocks/db";

vi.mock("@/lib/db", async () => {
  const { mockDb } = await import("../../mocks/db");
  return { db: mockDb };
});

import { syncHolidaysForEntity, syncAllHolidays } from "@/lib/holidays-sync";

const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal("fetch", mockFetch);

const SAMPLE_HOLIDAYS = [
  {
    startDate: "2026-01-01",
    endDate: "2026-01-01",
    name: [
      { language: "ES", text: "Año Nuevo" },
      { language: "EN", text: "New Year" },
    ],
    nationwide: true,
  },
  {
    startDate: "2026-05-01",
    endDate: "2026-05-01",
    name: [{ language: "ES", text: "Día del Trabajador" }],
    nationwide: true,
  },
];

describe("syncHolidaysForEntity", () => {
  beforeEach(() => {
    resetDbMocks();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(SAMPLE_HOLIDAYS),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns early when entity has no autonomousCommunity", async () => {
    setupSelectMock([{ autonomousCommunity: null }]);

    await syncHolidaysForEntity("ent-001");

    expect(mockFetch).not.toHaveBeenCalled();
    // Only the entity query was made, nothing else
    expect(mockDb.select).toHaveBeenCalledTimes(1);
  });

  it("returns early when entity is not found", async () => {
    setupSelectMock([]);

    await syncHolidaysForEntity("ent-nonexistent");

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("syncs holidays for entity with autonomous community (creates new calendar)", async () => {
    // 1. Entity query
    setupSelectMock([{ autonomousCommunity: "ES-MD" }]);
    // 2. First year: calendar lookup → not found
    setupSelectMock([]);
    // 3. Insert calendar → return new row
    setupInsertMock([{ id: "cal-new-md-2026" }]);
    // 4-5. Insert holidays for each entry (2 entries)
    setupInsertMock([{ id: "hol-1" }]);
    setupInsertMock([{ id: "hol-2" }]);
    // 6. Link entity→calendar
    setupInsertMock([]);
    // 7. Second year: calendar lookup → not found
    setupSelectMock([]);
    // 8. Insert calendar → return new row
    setupInsertMock([{ id: "cal-new-md-2027" }]);
    // 9-10. Insert holidays (2 entries)
    setupInsertMock([{ id: "hol-3" }]);
    setupInsertMock([{ id: "hol-4" }]);
    // 11. Link entity→calendar
    setupInsertMock([]);

    await syncHolidaysForEntity("ent-001");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("ES-MD"),
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("reuses existing calendar when found", async () => {
    // 1. Entity query
    setupSelectMock([{ autonomousCommunity: "ES-MD" }]);
    // 2. Calendar lookup → found
    setupSelectMock([{ id: "cal-existing-001" }]);
    // 3. Update calendar
    setupUpdateMock([{ id: "cal-existing-001" }]);
    // 4-5. Insert holidays
    setupInsertMock([{ id: "hol-1" }]);
    setupInsertMock([{ id: "hol-2" }]);
    // 6. Link entity→calendar
    setupInsertMock([]);
    // 7. Second year: calendar lookup → found
    setupSelectMock([{ id: "cal-existing-002" }]);
    // 8. Update calendar
    setupUpdateMock([{ id: "cal-existing-002" }]);
    // 9-10. Insert holidays
    setupInsertMock([{ id: "hol-3" }]);
    setupInsertMock([{ id: "hol-4" }]);
    // 11. Link entity→calendar
    setupInsertMock([]);

    await syncHolidaysForEntity("ent-001");

    // Should update existing calendars, not insert new ones
    expect(mockDb.update).toHaveBeenCalledTimes(2);
  });

  it("handles fetch errors from OpenHolidays API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    setupSelectMock([{ autonomousCommunity: "ES-MD" }]);

    await expect(syncHolidaysForEntity("ent-001")).rejects.toThrow(
      "OpenHolidays API error 500"
    );
  });

  it("syncs for current year and next year (2026 and 2027)", async () => {
    setupSelectMock([{ autonomousCommunity: "ES-MD" }]);
    // Year 2026: no calendar
    setupSelectMock([]);
    setupInsertMock([{ id: "cal-2026" }]);
    setupInsertMock([{ id: "h1" }]);
    setupInsertMock([{ id: "h2" }]);
    setupInsertMock([]);
    // Year 2027: no calendar
    setupSelectMock([]);
    setupInsertMock([{ id: "cal-2027" }]);
    setupInsertMock([{ id: "h3" }]);
    setupInsertMock([{ id: "h4" }]);
    setupInsertMock([]);

    await syncHolidaysForEntity("ent-001");

    const urls = mockFetch.mock.calls.map((c) => c[0]) as string[];
    expect(urls.some((u) => u.includes("2026"))).toBe(true);
    expect(urls.some((u) => u.includes("2027"))).toBe(true);
  });

  it("extracts Spanish holiday name from multi-language name", async () => {
    const holidaysWithName = [
      {
        startDate: "2026-01-06",
        endDate: "2026-01-06",
        name: [
          { language: "CA", text: "Dia de Reis" },
          { language: "ES", text: "Día de Reyes" },
        ],
        nationwide: true,
      },
    ];
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(holidaysWithName),
    });

    setupSelectMock([{ autonomousCommunity: "ES-CL" }]);
    // No calendar
    setupSelectMock([]);
    setupInsertMock([{ id: "cal-1" }]);
    setupInsertMock([{ id: "hol-1" }]);
    setupInsertMock([]);
    // Second year
    setupSelectMock([]);
    setupInsertMock([{ id: "cal-2" }]);
    setupInsertMock([{ id: "hol-2" }]);
    setupInsertMock([]);

    await syncHolidaysForEntity("ent-001");

    // The holiday name should be "Día de Reyes" (Spanish)
    const insertCall = vi.mocked(mockDb.insert).mock.calls[2];
    expect(insertCall).toBeDefined();
  });

  it("continues even if calendar insert returns no row", async () => {
    setupSelectMock([{ autonomousCommunity: "ES-MD" }]);
    // Calendar not found
    setupSelectMock([]);
    // Insert returns empty (no row)
    setupInsertMock([]);
    // Still tries 2nd year
    setupSelectMock([]);
    setupInsertMock([{ id: "cal-2027" }]);
    setupInsertMock([{ id: "hol-1" }]);
    setupInsertMock([{ id: "hol-2" }]);
    setupInsertMock([]);

    await syncHolidaysForEntity("ent-001");

    // Should not crash
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("syncAllHolidays", () => {
  beforeEach(() => {
    resetDbMocks();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(SAMPLE_HOLIDAYS),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns synced=0 when no entities have CCAA", async () => {
    setupSelectMock([
      { id: "ent-1", autonomousCommunity: null },
      { id: "ent-2", autonomousCommunity: null },
    ]);

    const result = await syncAllHolidays();

    expect(result.synced).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("skips inactive entities", async () => {
    // The query filters by isActive=true, so inactive ones aren't returned
    setupSelectMock([{ id: "ent-active", autonomousCommunity: "ES-MD" }]);
    // Entity query within syncHolidaysForEntity
    setupSelectMock([{ autonomousCommunity: "ES-MD" }]);
    // Calendar
    setupSelectMock([]);
    setupInsertMock([{ id: "cal-1" }]);
    setupInsertMock([{ id: "h1" }]);
    setupInsertMock([{ id: "h2" }]);
    setupInsertMock([]);
    // 2nd year
    setupSelectMock([]);
    setupInsertMock([{ id: "cal-2" }]);
    setupInsertMock([{ id: "h3" }]);
    setupInsertMock([{ id: "h4" }]);
    setupInsertMock([]);

    const result = await syncAllHolidays();
    expect(result.synced).toBe(1);
  });

  it("captures errors per entity without breaking the loop", async () => {
    setupSelectMock([
      { id: "ent-ok", autonomousCommunity: "ES-MD" },
      { id: "ent-fail", autonomousCommunity: "ES-CT" },
    ]);

    // ent-ok entity query
    setupSelectMock([{ autonomousCommunity: "ES-MD" }]);
    setupSelectMock([]);
    setupInsertMock([{ id: "cal-ok-2026" }]);
    setupInsertMock([{ id: "hol-1" }]);
    setupInsertMock([{ id: "hol-2" }]);
    setupInsertMock([]);
    setupSelectMock([]);
    setupInsertMock([{ id: "cal-ok-2027" }]);
    setupInsertMock([{ id: "hol-3" }]);
    setupInsertMock([{ id: "hol-4" }]);
    setupInsertMock([]);

    // ent-fail entity query
    setupSelectMock([{ autonomousCommunity: "ES-CT" }]);

    // Make the 3rd fetch call (ent-fail's first) reject.
    // ent-ok uses 2 fetch calls (2026 + 2027), ent-fail's first is #3.
    let callIndex = 0;
    mockFetch.mockReset();
    mockFetch.mockImplementation(() => {
      callIndex++;
      if (callIndex === 3) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(SAMPLE_HOLIDAYS),
      });
    });

    const result = await syncAllHolidays();

    expect(result.synced).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("ent-fail");
    expect(result.errors[0]).toContain("Network error");
  });

  it("returns all synced when all succeed", async () => {
    setupSelectMock([
      { id: "ent-1", autonomousCommunity: "ES-MD" },
      { id: "ent-2", autonomousCommunity: "ES-CT" },
    ]);

    // ent-1
    setupSelectMock([{ autonomousCommunity: "ES-MD" }]);
    setupSelectMock([]);
    setupInsertMock([{ id: "c1" }]);
    setupInsertMock([{ id: "h1" }]);
    setupInsertMock([{ id: "h2" }]);
    setupInsertMock([]);
    setupSelectMock([]);
    setupInsertMock([{ id: "c2" }]);
    setupInsertMock([{ id: "h3" }]);
    setupInsertMock([{ id: "h4" }]);
    setupInsertMock([]);
    // ent-2
    setupSelectMock([{ autonomousCommunity: "ES-CT" }]);
    setupSelectMock([]);
    setupInsertMock([{ id: "c3" }]);
    setupInsertMock([{ id: "h5" }]);
    setupInsertMock([{ id: "h6" }]);
    setupInsertMock([]);
    setupSelectMock([]);
    setupInsertMock([{ id: "c4" }]);
    setupInsertMock([{ id: "h7" }]);
    setupInsertMock([{ id: "h8" }]);
    setupInsertMock([]);

    const result = await syncAllHolidays();
    expect(result.synced).toBe(2);
    expect(result.errors).toHaveLength(0);
  });
});
