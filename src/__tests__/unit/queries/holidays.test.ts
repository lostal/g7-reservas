/**
 * Tests de Holiday Queries
 *
 * Verifica getHolidaysForEntity y getHolidayDatesSet.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb, resetDbMocks, setupSelectMock } from "../../mocks/db";

vi.mock("@/lib/db", async () => {
  const { mockDb } = await import("../../mocks/db");
  return { db: mockDb };
});

import {
  getHolidaysForEntity,
  getHolidayDatesSet,
} from "@/lib/queries/holidays";

const MOCK_HOLIDAYS = [
  { id: "h-1", date: "2026-01-01", name: "Año Nuevo", isOptional: false },
  {
    id: "h-2",
    date: "2026-05-01",
    name: "Día del Trabajador",
    isOptional: false,
  },
  {
    id: "h-3",
    date: "2026-12-06",
    name: "Día de la Constitución",
    isOptional: false,
  },
  { id: "h-4", date: "2026-03-19", name: "San José", isOptional: true },
];

describe("getHolidaysForEntity", () => {
  beforeEach(() => {
    resetDbMocks();
    vi.clearAllMocks();
  });

  it("returns holidays for an entity and year", async () => {
    setupSelectMock(MOCK_HOLIDAYS);

    const result = await getHolidaysForEntity("ent-1", 2026);

    expect(result).toHaveLength(4);
    expect(result[0]?.date).toBe("2026-01-01");
    expect(result[0]?.name).toBe("Año Nuevo");
    expect(mockDb.select).toHaveBeenCalledTimes(1);
  });

  it("returns empty array when entity has no holidays", async () => {
    setupSelectMock([]);

    const result = await getHolidaysForEntity("ent-empty", 2026);

    expect(result).toHaveLength(0);
  });

  it("uses innerJoin with holidayCalendars and entityHolidayCalendars", async () => {
    setupSelectMock(MOCK_HOLIDAYS);

    await getHolidaysForEntity("ent-1", 2026);

    // Verify joins were called
    const builder = vi.mocked(mockDb.select).mock.results[0]?.value;
    expect(builder.innerJoin).toHaveBeenCalledTimes(2);
  });
});

describe("getHolidayDatesSet", () => {
  beforeEach(() => {
    resetDbMocks();
    vi.clearAllMocks();
  });

  it("returns Set of mandatory (non-optional) holiday dates", async () => {
    setupSelectMock(MOCK_HOLIDAYS);

    const result = await getHolidayDatesSet("ent-1", 2026);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(3);
    expect(result.has("2026-01-01")).toBe(true);
    expect(result.has("2026-05-01")).toBe(true);
    expect(result.has("2026-12-06")).toBe(true);
    // Optional holiday should NOT be in the set
    expect(result.has("2026-03-19")).toBe(false);
  });

  it("returns empty Set when no holidays exist", async () => {
    setupSelectMock([]);

    const result = await getHolidayDatesSet("ent-1", 2026);

    expect(result.size).toBe(0);
  });

  it("returns empty Set when all holidays are optional", async () => {
    setupSelectMock([
      { id: "h-1", date: "2026-01-01", name: "Fiesta local", isOptional: true },
    ]);

    const result = await getHolidayDatesSet("ent-1", 2026);

    expect(result.size).toBe(0);
  });
});
