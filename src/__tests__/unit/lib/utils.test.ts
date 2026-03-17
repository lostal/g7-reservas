import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  toServerDateStr,
  toClientDateStr,
  isPast,
  getDayOfWeek,
  getPageNumbers,
} from "@/lib/utils";

describe("toServerDateStr", () => {
  it("converts a known date to correct yyyy-MM-dd string", () => {
    const date = new Date(2026, 2, 14); // March 14, 2026 (local)
    expect(toServerDateStr(date)).toBe("2026-03-14");
  });

  it("pads single-digit month and day with leading zeros", () => {
    const date = new Date(2026, 0, 5); // January 5, 2026 (local)
    expect(toServerDateStr(date)).toBe("2026-01-05");
  });

  it("handles December 31 edge case", () => {
    const date = new Date(2025, 11, 31); // December 31, 2025 (local)
    expect(toServerDateStr(date)).toBe("2025-12-31");
  });

  it("handles February 29 in a leap year", () => {
    const date = new Date(2024, 1, 29); // February 29, 2024
    expect(toServerDateStr(date)).toBe("2024-02-29");
  });
});

describe("toClientDateStr", () => {
  it("returns formatted date matching en-CA format without explicit timezone", () => {
    const date = new Date(2026, 2, 14); // March 14, 2026 (local)
    const result = toClientDateStr(date);
    // en-CA format is yyyy-MM-dd
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Should contain 2026 and 03
    expect(result).toContain("2026");
  });

  it("with explicit timezone America/New_York returns correct date string", () => {
    // Use a UTC date to test timezone conversion
    // 2026-03-14T05:00:00Z = 2026-03-14T00:00:00 in America/New_York (UTC-5 in March)
    const date = new Date("2026-03-14T05:00:00Z");
    const result = toClientDateStr(date, "America/New_York");
    expect(result).toBe("2026-03-14");
  });

  it("with America/New_York the date can differ from UTC for midnight UTC dates", () => {
    // 2026-03-15T02:00:00Z = 2026-03-14T21:00:00 in America/New_York (UTC-5)
    const date = new Date("2026-03-15T02:00:00Z");
    const result = toClientDateStr(date, "America/New_York");
    expect(result).toBe("2026-03-14");
  });

  it("returns yyyy-MM-dd format with UTC timezone", () => {
    const date = new Date("2026-06-01T12:00:00Z");
    const result = toClientDateStr(date, "UTC");
    expect(result).toBe("2026-06-01");
  });
});

describe("isPast", () => {
  beforeEach(() => {
    // Fake timer set to 2026-03-14T12:00:00Z (local = 2026-03-14)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-14T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for yesterday", () => {
    expect(isPast("2026-03-13")).toBe(true);
  });

  it("returns false for today", () => {
    expect(isPast("2026-03-14")).toBe(false);
  });

  it("returns false for tomorrow", () => {
    expect(isPast("2026-03-15")).toBe(false);
  });

  it("returns true for a date well in the past", () => {
    expect(isPast("2025-01-01")).toBe(true);
  });

  it("returns false for a date well in the future", () => {
    expect(isPast("2027-12-31")).toBe(false);
  });
});

describe("getDayOfWeek", () => {
  it("returns 6 for Saturday 2026-03-14", () => {
    expect(getDayOfWeek("2026-03-14")).toBe(6);
  });

  it("returns 1 for Monday 2026-03-09", () => {
    expect(getDayOfWeek("2026-03-09")).toBe(1);
  });

  it("returns 0 for Sunday 2026-03-15", () => {
    expect(getDayOfWeek("2026-03-15")).toBe(0);
  });

  it("returns 5 for Friday 2026-03-13", () => {
    expect(getDayOfWeek("2026-03-13")).toBe(5);
  });

  it("returns 3 for Wednesday 2026-01-01", () => {
    expect(getDayOfWeek("2026-01-01")).toBe(4); // Jan 1, 2026 is Thursday
  });
});

describe("getPageNumbers", () => {
  it("returns all pages when total is 3 (<=5)", () => {
    expect(getPageNumbers(1, 3)).toEqual([1, 2, 3]);
  });

  it("returns all pages when total is 5", () => {
    expect(getPageNumbers(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns [1,2,3,4,'...',10] when total=10 and current=1", () => {
    expect(getPageNumbers(1, 10)).toEqual([1, 2, 3, 4, "...", 10]);
  });

  it("returns [1,2,3,4,'...',10] when total=10 and current=3 (still in start range)", () => {
    expect(getPageNumbers(3, 10)).toEqual([1, 2, 3, 4, "...", 10]);
  });

  it("returns [1,'...',4,5,6,'...',10] when total=10 and current=5", () => {
    expect(getPageNumbers(5, 10)).toEqual([1, "...", 4, 5, 6, "...", 10]);
  });

  it("returns [1,'...',7,8,9,10] when total=10 and current=9", () => {
    expect(getPageNumbers(9, 10)).toEqual([1, "...", 7, 8, 9, 10]);
  });

  it("returns [1,'...',7,8,9,10] when total=10 and current=10", () => {
    expect(getPageNumbers(10, 10)).toEqual([1, "...", 7, 8, 9, 10]);
  });

  it("returns [1,'...',7,8,9,10] when total=10 and current=8 (near end)", () => {
    expect(getPageNumbers(8, 10)).toEqual([1, "...", 7, 8, 9, 10]);
  });

  it("single page returns [1]", () => {
    expect(getPageNumbers(1, 1)).toEqual([1]);
  });
});
