/**
 * Tests de Sign Out Action
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignOut = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/config", () => ({
  signOut: mockSignOut,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((_url: string) => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

import { redirect } from "next/navigation";
import { signOutAction } from "@/lib/auth/sign-out";

describe("signOutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls signOut with redirect:false then redirects to login", async () => {
    mockSignOut.mockResolvedValueOnce(undefined);

    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT");

    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("calls signOut before redirect", async () => {
    const order: string[] = [];
    mockSignOut.mockImplementationOnce(async () => {
      order.push("signOut");
    });
    // redirect mock is global, just capture its call
    try {
      await signOutAction();
    } catch {
      order.push("redirect");
    }

    expect(order).toEqual(["signOut", "redirect"]);
  });
});
