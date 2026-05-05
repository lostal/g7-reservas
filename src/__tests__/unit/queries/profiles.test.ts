/**
 * Tests de Profile Queries
 *
 * Verifica getProfiles con y sin filtro de entityId.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockDb, resetDbMocks, setupSelectMock } from "../../mocks/db";

vi.mock("@/lib/db", async () => {
  const { mockDb } = await import("../../mocks/db");
  return { db: mockDb };
});

import { getProfiles } from "@/lib/queries/profiles";

describe("getProfiles", () => {
  beforeEach(() => {
    resetDbMocks();
    vi.clearAllMocks();
  });

  it("returns profiles ordered by fullName", async () => {
    setupSelectMock([
      { id: "p1", fullName: "Ana García", entityId: "ent-1" },
      { id: "p2", fullName: "Carlos Pérez", entityId: "ent-1" },
      { id: "p3", fullName: "Beatriz López", entityId: "ent-1" },
    ]);

    const profiles = await getProfiles();

    expect(profiles).toHaveLength(3);
    expect(mockDb.select).toHaveBeenCalledTimes(1);
    expect(profiles[0]?.fullName).toBe("Ana García");
  });

  it("filters by entityId when provided", async () => {
    setupSelectMock([{ id: "p1", fullName: "Ana García", entityId: "ent-1" }]);

    const profiles = await getProfiles("ent-1");

    expect(profiles).toHaveLength(1);
    expect(profiles[0]?.entityId).toBe("ent-1");
  });

  it("returns all profiles when entityId is null", async () => {
    setupSelectMock([
      { id: "p1", fullName: "Ana", entityId: null },
      { id: "p2", fullName: "Beto", entityId: "ent-1" },
    ]);

    const profiles = await getProfiles(null);

    expect(profiles).toHaveLength(2);
  });

  it("returns empty array when no profiles exist", async () => {
    setupSelectMock([]);

    const profiles = await getProfiles();

    expect(profiles).toHaveLength(0);
  });

  it("returns empty array when entityId has no profiles", async () => {
    setupSelectMock([]);

    const profiles = await getProfiles("ent-nonexistent");

    expect(profiles).toHaveLength(0);
  });
});
