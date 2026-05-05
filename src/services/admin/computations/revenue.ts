/**
 * Revenue metric computation utilities.
 *
 * Pure functions for calculating MRR, conversion rate, and subscription churn.
 * No side effects, no PocketBase calls.
 */

/**
 * Represents a subscription for MRR calculation.
 */
export interface SubscriptionInput {
  plan: string;   // 'monthly' | 'yearly' | 'lifetime'
  amount: number; // amount in cents or dollars (consistent unit)
  status: string; // 'active' | 'canceled' | etc.
}

/**
 * Computes Monthly Recurring Revenue (MRR) from a set of subscriptions.
 *
 * - Monthly subscriptions contribute their amount as-is
 * - Yearly subscriptions contribute amount / 12
 * - Lifetime subscriptions are excluded (not recurring)
 * - Only active subscriptions are counted
 *
 * @param subscriptions - Array of subscription records
 * @returns MRR as a number (same unit as input amounts)
 */
export function computeMRR(
  subscriptions: SubscriptionInput[]
): number {
  let mrr = 0;

  for (const sub of subscriptions) {
    if (sub.status !== 'active') continue;

    const planLower = sub.plan.toLowerCase();

    if (planLower === 'monthly') {
      mrr += sub.amount;
    } else if (planLower === 'yearly') {
      mrr += sub.amount / 12;
    }
    // lifetime plans are excluded from MRR
  }

  return Math.round(mrr * 100) / 100;
}

/**
 * Computes the conversion rate from free to paid users.
 *
 * @param upgradedCount - Number of users who upgraded from free to paid in the period
 * @param totalFreeAtStart - Total number of free users at the start of the period
 * @returns Conversion rate as a percentage (0-100), or 0 if totalFreeAtStart is 0
 */
export function computeConversionRate(
  upgradedCount: number,
  totalFreeAtStart: number
): number {
  if (totalFreeAtStart <= 0) return 0;
  return (upgradedCount / totalFreeAtStart) * 100;
}

/**
 * Computes subscription churn rate.
 *
 * @param cancellations - Number of subscription cancellations in the period
 * @param activeAtStart - Number of active subscribers at the start of the period
 * @returns Churn rate as a percentage (0-100), or 0 if activeAtStart is 0
 */
export function computeSubscriptionChurn(
  cancellations: number,
  activeAtStart: number
): number {
  if (activeAtStart <= 0) return 0;
  return (cancellations / activeAtStart) * 100;
}
