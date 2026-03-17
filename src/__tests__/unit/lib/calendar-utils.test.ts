import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildMonthRange,
  isOutsideBookingWindow,
  isTooSoonForCession,
  computeCessionDayStatus,
  iterMonthDays,
} from "@/lib/calendar/calendar-utils";

// ─── buildMonthRange ──────────────────────────────────────────────────────────

describe("buildMonthRange", () => {
  it("March 2026: firstDay=2026-03-01, lastDay=2026-03-31", () => {
    const result = buildMonthRange(new Date(2026, 2, 1)); // month 2 = March
    expect(result.year).toBe(2026);
    expect(result.month).toBe(2); // 0-based
    expect(result.firstDay).toBe("2026-03-01");
    expect(result.lastDay).toBe("2026-03-31");
  });

  it("Feb 2024 (leap year): lastDay=2024-02-29", () => {
    const result = buildMonthRange(new Date(2024, 1, 1)); // Feb 2024
    expect(result.firstDay).toBe("2024-02-01");
    expect(result.lastDay).toBe("2024-02-29");
  });

  it("Feb 2025 (non-leap): lastDay=2025-02-28", () => {
    const result = buildMonthRange(new Date(2025, 1, 1)); // Feb 2025
    expect(result.firstDay).toBe("2025-02-01");
    expect(result.lastDay).toBe("2025-02-28");
  });

  it("Jan 2026: lastDay=2026-01-31", () => {
    const result = buildMonthRange(new Date(2026, 0, 1)); // Jan 2026
    expect(result.firstDay).toBe("2026-01-01");
    expect(result.lastDay).toBe("2026-01-31");
  });

  it("returns month as 0-based index", () => {
    const result = buildMonthRange(new Date(2026, 11, 1)); // Dec
    expect(result.month).toBe(11);
    expect(result.lastDay).toBe("2026-12-31");
  });
});

// ─── isOutsideBookingWindow ───────────────────────────────────────────────────

describe("isOutsideBookingWindow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-14T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("null maxAdvanceDays always returns false", () => {
    expect(isOutsideBookingWindow("2026-06-01", null)).toBe(false);
    expect(isOutsideBookingWindow("2026-12-31", null)).toBe(false);
  });

  it("today+15 with limit 14 → true", () => {
    // today = 2026-03-14, +15 = 2026-03-29
    expect(isOutsideBookingWindow("2026-03-29", 14)).toBe(true);
  });

  it("today+14 with limit 14 → false (exactly at limit)", () => {
    // today = 2026-03-14, +14 = 2026-03-28
    expect(isOutsideBookingWindow("2026-03-28", 14)).toBe(false);
  });

  it("today+0 (today itself) with limit 14 → false", () => {
    expect(isOutsideBookingWindow("2026-03-14", 14)).toBe(false);
  });

  it("yesterday with limit 14 → false (past dates are not outside booking window)", () => {
    expect(isOutsideBookingWindow("2026-03-13", 14)).toBe(false);
  });

  it("today+1 with limit 0 → true", () => {
    expect(isOutsideBookingWindow("2026-03-15", 0)).toBe(true);
  });
});

// ─── isTooSoonForCession ──────────────────────────────────────────────────────

describe("isTooSoonForCession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set to 2026-03-14T12:00:00 (noon)
    vi.setSystemTime(new Date("2026-03-14T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("0 hours minAdvance → always false", () => {
    expect(isTooSoonForCession("2026-03-14", 0)).toBe(false);
    expect(isTooSoonForCession("2026-03-15", 0)).toBe(false);
  });

  it("negative hours → always false", () => {
    expect(isTooSoonForCession("2026-03-14", -1)).toBe(false);
  });

  it("tomorrow midnight is 12h from now, with 24h min → true (12 < 24)", () => {
    // Now = 2026-03-14T12:00:00Z, target midnight = 2026-03-15T00:00:00 local
    // hoursUntil ≈ 12 < 24 → true
    expect(isTooSoonForCession("2026-03-15", 24)).toBe(true);
  });

  it("day after tomorrow midnight is ~36h away, with 24h min → false", () => {
    // Now = noon March 14, target = midnight March 16 ≈ 36h ahead
    expect(isTooSoonForCession("2026-03-16", 24)).toBe(false);
  });

  it("past date → true (negative hours until)", () => {
    expect(isTooSoonForCession("2026-03-13", 24)).toBe(true);
  });
});

// ─── computeCessionDayStatus ──────────────────────────────────────────────────

describe("computeCessionDayStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Now = 2026-03-14T12:00:00Z (Saturday)
    vi.setSystemTime(new Date("2026-03-14T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("day not in allowedDays → unavailable", () => {
    // 2026-03-15 is Sunday (0), allowedDays=[1,2,3,4,5]
    const result = computeCessionDayStatus({
      dateStr: "2026-03-15",
      allowedDays: [1, 2, 3, 4, 5],
    });
    expect(result).toBe("unavailable");
  });

  it("past date in allowedDays → past", () => {
    // 2026-03-10 is Tuesday (2), past
    const result = computeCessionDayStatus({
      dateStr: "2026-03-10",
      allowedDays: [1, 2, 3, 4, 5],
    });
    expect(result).toBe("past");
  });

  it("future date that is too soon for cession → in-use", () => {
    // 2026-03-16 is Monday (1), minAdvanceHours=48
    // Now is March 14 noon; March 16 midnight is only ~36h away
    const result = computeCessionDayStatus({
      dateStr: "2026-03-16",
      allowedDays: [1],
      minAdvanceHours: 48,
    });
    expect(result).toBe("in-use");
  });

  it("future date with no cession → can-cede", () => {
    // 2026-03-20 is Friday (5), far enough ahead
    const result = computeCessionDayStatus({
      dateStr: "2026-03-20",
      allowedDays: [5],
    });
    expect(result).toBe("can-cede");
  });

  it("future date with cession.status=available → ceded-free", () => {
    const result = computeCessionDayStatus({
      dateStr: "2026-03-20",
      allowedDays: [5],
      cession: { status: "available" },
    });
    expect(result).toBe("ceded-free");
  });

  it("future date with cession.status=reserved → ceded-taken", () => {
    const result = computeCessionDayStatus({
      dateStr: "2026-03-20",
      allowedDays: [5],
      cession: { status: "reserved" },
    });
    expect(result).toBe("ceded-taken");
  });

  it("future date with cession.status=cancelled (other) → in-use", () => {
    const result = computeCessionDayStatus({
      dateStr: "2026-03-20",
      allowedDays: [5],
      cession: { status: "cancelled" },
    });
    expect(result).toBe("in-use");
  });

  it("future date with cession.status=unknown string → in-use", () => {
    const result = computeCessionDayStatus({
      dateStr: "2026-03-20",
      allowedDays: [5],
      cession: { status: "other" },
    });
    expect(result).toBe("in-use");
  });

  it("uses default minAdvanceHours=0 when not provided → can-cede for near future", () => {
    // 2026-03-16 Monday is within 48h, but with default 0h it's can-cede
    const result = computeCessionDayStatus({
      dateStr: "2026-03-16",
      allowedDays: [1],
    });
    expect(result).toBe("can-cede");
  });
});

// ─── iterMonthDays ────────────────────────────────────────────────────────────

describe("iterMonthDays", () => {
  it("Jan 2026 yields 31 days, first=2026-01-01, last=2026-01-31", () => {
    const days = [...iterMonthDays(2026, 0)]; // 0 = January
    expect(days).toHaveLength(31);
    expect(days[0]).toBe("2026-01-01");
    expect(days[30]).toBe("2026-01-31");
  });

  it("Feb 2024 (leap year) yields 29 days", () => {
    const days = [...iterMonthDays(2024, 1)]; // 1 = February
    expect(days).toHaveLength(29);
    expect(days[0]).toBe("2024-02-01");
    expect(days[28]).toBe("2024-02-29");
  });

  it("Feb 2025 (non-leap) yields 28 days", () => {
    const days = [...iterMonthDays(2025, 1)];
    expect(days).toHaveLength(28);
    expect(days[27]).toBe("2025-02-28");
  });

  it("March 2026 yields 31 days", () => {
    const days = [...iterMonthDays(2026, 2)]; // 2 = March
    expect(days).toHaveLength(31);
    expect(days[0]).toBe("2026-03-01");
    expect(days[30]).toBe("2026-03-31");
  });

  it("all yielded strings match yyyy-MM-dd format", () => {
    const days = [...iterMonthDays(2026, 5)]; // June
    expect(days).toHaveLength(30);
    for (const d of days) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("days are in sequential order", () => {
    const days = [...iterMonthDays(2026, 3)]; // April
    for (let i = 1; i < days.length; i++) {
      expect(days[i]! > days[i - 1]!).toBe(true);
    }
  });
});
