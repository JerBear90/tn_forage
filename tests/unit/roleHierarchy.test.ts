/**
 * Role Hierarchy — Unit Tests
 *
 * Tests the role hierarchy logic used by ProtectedRoute and RoleGate.
 * Role order: guest < free < member < super_user
 */

import { describe, it, expect } from "vitest";
import {
  getRoleWeight,
  hasRequiredRole,
  ROLE_ORDER,
} from "@/auth/roleHierarchy";
import type { UserRole } from "@/types";

// ---------------------------------------------------------------------------
// ROLE_ORDER
// ---------------------------------------------------------------------------

describe("ROLE_ORDER", () => {
  it("contains all four roles in ascending order", () => {
    expect(ROLE_ORDER).toEqual(["guest", "free", "member", "super_user"]);
  });

  it("has exactly 4 roles", () => {
    expect(ROLE_ORDER).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// getRoleWeight
// ---------------------------------------------------------------------------

describe("getRoleWeight", () => {
  it("guest has weight 0", () => {
    expect(getRoleWeight("guest")).toBe(0);
  });

  it("free has weight 1", () => {
    expect(getRoleWeight("free")).toBe(1);
  });

  it("member has weight 2", () => {
    expect(getRoleWeight("member")).toBe(2);
  });

  it("super_user has weight 3", () => {
    expect(getRoleWeight("super_user")).toBe(3);
  });

  it("weights are strictly ascending", () => {
    for (let i = 1; i < ROLE_ORDER.length; i++) {
      expect(getRoleWeight(ROLE_ORDER[i])).toBeGreaterThan(
        getRoleWeight(ROLE_ORDER[i - 1]),
      );
    }
  });
});

// ---------------------------------------------------------------------------
// hasRequiredRole
// ---------------------------------------------------------------------------

describe("hasRequiredRole", () => {
  // Every role should meet its own requirement
  it.each<UserRole>(["guest", "free", "member", "super_user"])(
    "%s meets its own role requirement",
    (role) => {
      expect(hasRequiredRole(role, role)).toBe(true);
    },
  );

  // Higher roles meet lower requirements
  it("super_user meets all role requirements", () => {
    expect(hasRequiredRole("super_user", "guest")).toBe(true);
    expect(hasRequiredRole("super_user", "free")).toBe(true);
    expect(hasRequiredRole("super_user", "member")).toBe(true);
    expect(hasRequiredRole("super_user", "super_user")).toBe(true);
  });

  it("member meets guest and free requirements", () => {
    expect(hasRequiredRole("member", "guest")).toBe(true);
    expect(hasRequiredRole("member", "free")).toBe(true);
  });

  it("free meets guest requirement", () => {
    expect(hasRequiredRole("free", "guest")).toBe(true);
  });

  // Lower roles do NOT meet higher requirements
  it("guest does not meet free requirement", () => {
    expect(hasRequiredRole("guest", "free")).toBe(false);
  });

  it("guest does not meet member requirement", () => {
    expect(hasRequiredRole("guest", "member")).toBe(false);
  });

  it("guest does not meet super_user requirement", () => {
    expect(hasRequiredRole("guest", "super_user")).toBe(false);
  });

  it("free does not meet member requirement", () => {
    expect(hasRequiredRole("free", "member")).toBe(false);
  });

  it("free does not meet super_user requirement", () => {
    expect(hasRequiredRole("free", "super_user")).toBe(false);
  });

  it("member does not meet super_user requirement", () => {
    expect(hasRequiredRole("member", "super_user")).toBe(false);
  });

  // Exhaustive: every pair
  it("correctly evaluates all role pairs", () => {
    const roles: UserRole[] = ["guest", "free", "member", "super_user"];
    for (const userRole of roles) {
      for (const requiredRole of roles) {
        const expected =
          getRoleWeight(userRole) >= getRoleWeight(requiredRole);
        expect(hasRequiredRole(userRole, requiredRole)).toBe(expected);
      }
    }
  });
});
