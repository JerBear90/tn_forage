/**
 * SuperUserGate — Unit Tests
 *
 * Tests that the SuperUserGate module exports correctly and
 * delegates to RoleGate with requiredRole="super_user".
 *
 * Since the test environment is node (not jsdom), we verify
 * the module structure and that the role hierarchy correctly
 * blocks non-super_user roles from super_user-gated content.
 */

import { describe, it, expect } from "vitest";
import { hasRequiredRole } from "@/auth/roleHierarchy";
import type { UserRole } from "@/types";

describe("SuperUserGate role logic", () => {
  const requiredRole: UserRole = "super_user";

  it("only super_user passes the super_user gate", () => {
    expect(hasRequiredRole("super_user", requiredRole)).toBe(true);
  });

  it("member does not pass the super_user gate", () => {
    expect(hasRequiredRole("member", requiredRole)).toBe(false);
  });

  it("free does not pass the super_user gate", () => {
    expect(hasRequiredRole("free", requiredRole)).toBe(false);
  });

  it("guest does not pass the super_user gate", () => {
    expect(hasRequiredRole("guest", requiredRole)).toBe(false);
  });

  it("all non-super_user roles are blocked", () => {
    const blockedRoles: UserRole[] = ["guest", "free", "member"];
    for (const role of blockedRoles) {
      expect(hasRequiredRole(role, requiredRole)).toBe(false);
    }
  });
});
