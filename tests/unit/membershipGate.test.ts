/**
 * MembershipGate — Unit Tests
 *
 * Tests the plan hierarchy logic used by MembershipGate.
 * Plan order: free < monthly < yearly < lifetime < admin
 */

import { describe, it, expect } from "vitest";
import { hasRequiredPlan } from "@/services/membershipPlanHierarchy";
import type { MembershipPlan } from "@/types";

// ---------------------------------------------------------------------------
// hasRequiredPlan
// ---------------------------------------------------------------------------

describe("hasRequiredPlan", () => {
  const ALL_PLANS: MembershipPlan[] = ["free", "monthly", "yearly", "lifetime", "admin"];

  // Every plan should meet its own requirement
  it.each<MembershipPlan>(ALL_PLANS)(
    "%s meets its own plan requirement",
    (plan) => {
      expect(hasRequiredPlan(plan, plan)).toBe(true);
    },
  );

  // admin meets all plan requirements
  it("admin meets all plan requirements", () => {
    for (const plan of ALL_PLANS) {
      expect(hasRequiredPlan("admin", plan)).toBe(true);
    }
  });

  // lifetime meets all except admin
  it("lifetime meets free, monthly, yearly, and lifetime", () => {
    expect(hasRequiredPlan("lifetime", "free")).toBe(true);
    expect(hasRequiredPlan("lifetime", "monthly")).toBe(true);
    expect(hasRequiredPlan("lifetime", "yearly")).toBe(true);
    expect(hasRequiredPlan("lifetime", "lifetime")).toBe(true);
  });

  it("lifetime does not meet admin requirement", () => {
    expect(hasRequiredPlan("lifetime", "admin")).toBe(false);
  });

  // yearly meets free and monthly
  it("yearly meets free and monthly requirements", () => {
    expect(hasRequiredPlan("yearly", "free")).toBe(true);
    expect(hasRequiredPlan("yearly", "monthly")).toBe(true);
  });

  // monthly meets free
  it("monthly meets free requirement", () => {
    expect(hasRequiredPlan("monthly", "free")).toBe(true);
  });

  // free does not meet paid requirements
  it("free does not meet monthly requirement", () => {
    expect(hasRequiredPlan("free", "monthly")).toBe(false);
  });

  it("free does not meet yearly requirement", () => {
    expect(hasRequiredPlan("free", "yearly")).toBe(false);
  });

  it("free does not meet lifetime requirement", () => {
    expect(hasRequiredPlan("free", "lifetime")).toBe(false);
  });

  // monthly does not meet yearly
  it("monthly does not meet yearly requirement", () => {
    expect(hasRequiredPlan("monthly", "yearly")).toBe(false);
  });

  // Exhaustive: every pair
  it("correctly evaluates all plan pairs", () => {
    const PLAN_WEIGHT: Record<MembershipPlan, number> = {
      free: 0,
      monthly: 1,
      yearly: 2,
      lifetime: 3,
      admin: 4,
    };

    for (const userPlan of ALL_PLANS) {
      for (const requiredPlan of ALL_PLANS) {
        const expected = PLAN_WEIGHT[userPlan] >= PLAN_WEIGHT[requiredPlan];
        expect(hasRequiredPlan(userPlan, requiredPlan)).toBe(expected);
      }
    }
  });
});
