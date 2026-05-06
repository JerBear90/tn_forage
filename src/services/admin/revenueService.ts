/**
 * Revenue service for the admin dashboard.
 *
 * Provides membership and revenue metrics by querying PocketBase user
 * collection for subscription data and applying pure computation utilities.
 */

import { pb } from '@/auth/authService';
import type { TimeRange, TimeSeriesPoint } from '@/types/admin-dashboard';
import { computeMRR, computeConversionRate, computeSubscriptionChurn } from './computations/revenue';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RevenueMetrics {
  activeSubscribers: number;
  freeUsers: number;
  mrr: number;
  conversionRate: number;
  churnRate: number;
  mrrTrend: TimeSeriesPoint[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a PocketBase filter string for records within a time range.
 */
function timeRangeFilter(timeRange: TimeRange, field: string = 'created'): string {
  const start = timeRange.startDate.toISOString().replace('T', ' ');
  const end = timeRange.endDate.toISOString().replace('T', ' ');
  return `${field} >= "${start}" && ${field} <= "${end}"`;
}

// ---------------------------------------------------------------------------
// Revenue Metrics
// ---------------------------------------------------------------------------

/**
 * Fetches revenue metrics for the given time range.
 *
 * Queries the PocketBase `users` collection for membership data
 * (membershipPlan, membershipStatus fields) and computes MRR,
 * conversion rate, and churn rate.
 *
 * @param timeRange - The time range to query
 * @returns RevenueMetrics with subscriber count, MRR, conversion, churn, and trend
 */
export async function getRevenueMetrics(timeRange: TimeRange): Promise<RevenueMetrics> {
  // Fetch all users to get current membership state
  const allUsers = await pb.collection('users').getFullList({
    sort: 'created',
  });

  // Count active subscribers and free users
  const activeSubscribers = allUsers.filter(
    (u) => u.membershipStatus === 'active' && u.membershipPlan && u.membershipPlan !== 'free'
  ).length;

  const freeUsers = allUsers.filter(
    (u) => !u.membershipPlan || u.membershipPlan === 'free' || u.membershipStatus !== 'active'
  ).length;

  // Build subscription list for MRR calculation
  const subscriptions = allUsers
    .filter((u) => u.membershipStatus === 'active' && u.membershipPlan && u.membershipPlan !== 'free')
    .map((u) => ({
      plan: (u.membershipPlan as string) ?? 'monthly',
      amount: (u.membershipAmount as number) ?? 0,
      status: 'active',
    }));

  const mrr = computeMRR(subscriptions);

  // Compute conversion rate: users who upgraded within the time range
  const rangeStart = timeRange.startDate.getTime();
  const rangeEnd = timeRange.endDate.getTime();

  const upgradedInPeriod = allUsers.filter((u) => {
    const upgradedAt = u.membershipStartDate || u.membershipUpdated;
    if (!upgradedAt) return false;
    const ts = new Date(upgradedAt as string).getTime();
    return (
      ts >= rangeStart &&
      ts <= rangeEnd &&
      u.membershipStatus === 'active' &&
      u.membershipPlan &&
      u.membershipPlan !== 'free'
    );
  }).length;

  // Total free users at the start of the period (approximate: users created before range start without active membership)
  const freeAtStart = allUsers.filter((u) => {
    const createdTs = new Date(u.created as string).getTime();
    return createdTs < rangeStart && (!u.membershipPlan || u.membershipPlan === 'free');
  }).length || freeUsers;

  const conversionRate = computeConversionRate(upgradedInPeriod, freeAtStart);

  // Compute churn: users who canceled within the time range
  const cancellations = allUsers.filter((u) => {
    const canceledAt = u.membershipCanceledAt || u.membershipUpdated;
    if (!canceledAt) return false;
    const ts = new Date(canceledAt as string).getTime();
    return (
      ts >= rangeStart &&
      ts <= rangeEnd &&
      u.membershipStatus === 'canceled'
    );
  }).length;

  // Active subscribers at start of period (approximate)
  const activeAtStart = allUsers.filter((u) => {
    const createdTs = new Date(u.created as string).getTime();
    return (
      createdTs < rangeStart &&
      u.membershipStatus === 'active' &&
      u.membershipPlan &&
      u.membershipPlan !== 'free'
    );
  }).length || activeSubscribers;

  const churnRate = computeSubscriptionChurn(cancellations, activeAtStart);

  // Build MRR trend: group by month within the time range
  const mrrTrend = buildMRRTrend(allUsers, timeRange);

  return {
    activeSubscribers,
    freeUsers,
    mrr,
    conversionRate,
    churnRate,
    mrrTrend,
  };
}

/**
 * Builds a monthly MRR trend by simulating MRR at each month boundary
 * within the time range.
 */
function buildMRRTrend(
  users: Array<Record<string, unknown>>,
  timeRange: TimeRange
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const start = new Date(timeRange.startDate);
  const end = new Date(timeRange.endDate);

  // Generate monthly data points
  const current = new Date(start.getFullYear(), start.getMonth(), 1);

  while (current <= end) {
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthEndMs = monthEnd.getTime();

    // Count subscriptions active by this month end
    const activeByMonth = users.filter((u) => {
      const createdTs = new Date(u.created as string).getTime();
      if (createdTs > monthEndMs) return false;

      const membershipStart = u.membershipStartDate
        ? new Date(u.membershipStartDate as string).getTime()
        : createdTs;

      if (membershipStart > monthEndMs) return false;

      // Check if canceled before this month end
      if (u.membershipCanceledAt) {
        const canceledTs = new Date(u.membershipCanceledAt as string).getTime();
        if (canceledTs <= monthEndMs) return false;
      }

      return (
        u.membershipPlan &&
        u.membershipPlan !== 'free' &&
        (u.membershipStatus === 'active' || membershipStart <= monthEndMs)
      );
    });

    const subscriptions = activeByMonth.map((u) => ({
      plan: (u.membershipPlan as string) ?? 'monthly',
      amount: (u.membershipAmount as number) ?? 0,
      status: 'active',
    }));

    const monthMRR = computeMRR(subscriptions);

    points.push({
      timestamp: current.toISOString().split('T')[0],
      value: monthMRR,
    });

    // Move to next month
    current.setMonth(current.getMonth() + 1);
  }

  return points;
}
