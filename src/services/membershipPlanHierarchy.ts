/**
 * ForageWise — Membership Plan Hierarchy
 *
 * Defines the plan hierarchy and comparison utilities.
 * Plan order: free < monthly < yearly < lifetime < admin
 *
 * Extracted into its own module so it can be unit-tested
 * without React/JSX dependencies.
 */

import type { MembershipPlan } from "@/types";

/**
 * Numeric weight for each plan. Higher = more premium.
 */
const PLAN_WEIGHT: Record<MembershipPlan, number> = {
  free: 0,
  monthly: 1,
  yearly: 2,
  lifetime: 3,
  admin: 4,
};

/**
 * All plans in ascending order of privilege.
 */
export const PLAN_ORDER: readonly MembershipPlan[] = [
  "free",
  "monthly",
  "yearly",
  "lifetime",
  "admin",
] as const;

/**
 * Get the numeric weight for a plan.
 * Returns 0 (free-level) for unknown plans.
 */
export function getPlanWeight(plan: MembershipPlan): number {
  return PLAN_WEIGHT[plan] ?? 0;
}

/**
 * Check whether `userPlan` meets or exceeds `requiredPlan`.
 *
 * @param userPlan - The user's current membership plan.
 * @param requiredPlan - The minimum plan required.
 * @returns true if the user's plan is equal to or higher than the required plan.
 */
export function hasRequiredPlan(
  userPlan: MembershipPlan,
  requiredPlan: MembershipPlan,
): boolean {
  return getPlanWeight(userPlan) >= getPlanWeight(requiredPlan);
}
