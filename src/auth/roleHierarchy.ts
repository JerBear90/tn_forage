/**
 * ForageFlow — Role Hierarchy
 *
 * Defines the role hierarchy and comparison utilities.
 * Role order: guest < free < member < super_user
 *
 * Extracted into its own module so it can be unit-tested
 * without React dependencies.
 */

import type { UserRole } from '@/types';

/**
 * Numeric weight for each role. Higher = more privileged.
 */
const ROLE_WEIGHT: Record<UserRole, number> = {
  guest: 0,
  free: 1,
  member: 2,
  super_user: 3,
};

/**
 * All roles in ascending order of privilege.
 */
export const ROLE_ORDER: readonly UserRole[] = [
  'guest',
  'free',
  'member',
  'super_user',
] as const;

/**
 * Get the numeric weight for a role.
 * Returns 0 (guest-level) for unknown roles.
 */
export function getRoleWeight(role: UserRole): number {
  return ROLE_WEIGHT[role] ?? 0;
}

/**
 * Check whether `userRole` meets or exceeds `requiredRole`.
 *
 * @param userRole - The user's current role.
 * @param requiredRole - The minimum role required.
 * @returns true if the user's role is equal to or higher than the required role.
 */
export function hasRequiredRole(
  userRole: UserRole,
  requiredRole: UserRole,
): boolean {
  return getRoleWeight(userRole) >= getRoleWeight(requiredRole);
}
