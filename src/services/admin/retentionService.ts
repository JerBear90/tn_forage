/**
 * Retention service for the admin dashboard.
 *
 * Provides DAU/WAU/MAU metrics, churn rate, return rate, and cohort
 * retention data by querying PocketBase analytics collections and
 * applying pure computation utilities.
 */

import { pb } from '@/auth/authService';
import type { TimeRange, RetentionMetrics } from '@/types/admin-dashboard';
import {
  computeDAU,
  computeWAU,
  computeMAU,
  computeChurnRate,
  computeReturnRate,
  generateCohortTable,
} from './computations/retention';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a PocketBase filter string for records within a time range.
 */
function timeRangeFilter(timeRange: TimeRange, field: string = 'timestamp'): string {
  const start = timeRange.startDate.toISOString().replace('T', ' ');
  const end = timeRange.endDate.toISOString().replace('T', ' ');
  return `${field} >= "${start}" && ${field} <= "${end}"`;
}

// ---------------------------------------------------------------------------
// Retention Metrics
// ---------------------------------------------------------------------------

/**
 * Fetches retention metrics for the given time range.
 *
 * Queries page view events and user data, then computes DAU, WAU, MAU,
 * churn rate, return rate, and a cohort retention table.
 *
 * @param timeRange - The time range to query
 * @returns RetentionMetrics with DAU, WAU, MAU, churn, return rate, and cohort table
 */
export async function getRetentionMetrics(timeRange: TimeRange): Promise<RetentionMetrics> {
  const filter = timeRangeFilter(timeRange);

  // Fetch page view events within the time range
  const pageViewRecords = await pb.collection('analytics_page_views').getFullList({
    filter,
    sort: 'timestamp',
  });

  // Map records to the shape expected by computation functions
  const events = pageViewRecords
    .filter((r) => r.userId)
    .map((r) => ({
      userId: r.userId as string,
      timestamp: r.timestamp as string,
    }));

  // Compute DAU/WAU/MAU using the end date of the time range
  const endDate = timeRange.endDate;
  const dau = computeDAU(events, endDate);
  const wau = computeWAU(events, endDate);
  const mau = computeMAU(events, endDate);

  // Compute churn rate: compare previous 7-day window to current 7-day window
  const currentWeekEnd = new Date(endDate);
  currentWeekEnd.setHours(23, 59, 59, 999);
  const currentWeekStart = new Date(currentWeekEnd);
  currentWeekStart.setDate(currentWeekStart.getDate() - 6);
  currentWeekStart.setHours(0, 0, 0, 0);

  const previousWeekEnd = new Date(currentWeekStart);
  previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
  previousWeekEnd.setHours(23, 59, 59, 999);
  const previousWeekStart = new Date(previousWeekEnd);
  previousWeekStart.setDate(previousWeekStart.getDate() - 6);
  previousWeekStart.setHours(0, 0, 0, 0);

  const previousWeekStartMs = previousWeekStart.getTime();
  const previousWeekEndMs = previousWeekEnd.getTime();
  const currentWeekStartMs = currentWeekStart.getTime();
  const currentWeekEndMs = currentWeekEnd.getTime();

  const previousPeriodUsers = new Set<string>();
  const currentPeriodUsers = new Set<string>();

  for (const event of events) {
    const ts = new Date(event.timestamp).getTime();
    if (ts >= previousWeekStartMs && ts <= previousWeekEndMs) {
      previousPeriodUsers.add(event.userId);
    }
    if (ts >= currentWeekStartMs && ts <= currentWeekEndMs) {
      currentPeriodUsers.add(event.userId);
    }
  }

  const churnRate = computeChurnRate(previousPeriodUsers, currentPeriodUsers);

  // Compute return rate: users who churned in the previous comparison but returned
  const churnedUsers = new Set<string>();
  Array.from(previousPeriodUsers).forEach((userId) => {
    if (!currentPeriodUsers.has(userId)) {
      churnedUsers.add(userId);
    }
  });
  const returnRate = computeReturnRate(churnedUsers, currentPeriodUsers);

  // Fetch users for cohort table generation
  const userRecords = await pb.collection('users').getFullList({
    sort: 'created',
  });

  const users = userRecords.map((r) => ({
    id: r.id as string,
    createdAt: (r.created as string) ?? (r.createdAt as string) ?? new Date().toISOString(),
  }));

  // Generate cohort table for the last 8 weeks
  const cohortTable = generateCohortTable(users, events, 8);

  return {
    dau,
    wau,
    mau,
    churnRate,
    returnRate,
    cohortTable,
  };
}
