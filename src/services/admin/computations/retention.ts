/**
 * Retention metric computation utilities.
 *
 * Pure functions for calculating DAU, WAU, MAU, churn rate, return rate,
 * and cohort retention tables. No side effects, no PocketBase calls.
 */

import type { CohortRow } from '@/types/admin-dashboard';

/**
 * Computes Daily Active Users — the count of unique users active on the given day.
 *
 * @param events - Array of activity events with userId and timestamp
 * @param date - The day to compute DAU for
 * @returns Number of unique users active on that day
 */
export function computeDAU(
  events: Array<{ userId: string; timestamp: string }>,
  date: Date
): number {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const startMs = dayStart.getTime();
  const endMs = dayEnd.getTime();

  const uniqueUsers = new Set<string>();
  for (const event of events) {
    const ts = new Date(event.timestamp).getTime();
    if (ts >= startMs && ts <= endMs && event.userId) {
      uniqueUsers.add(event.userId);
    }
  }

  return uniqueUsers.size;
}

/**
 * Computes Weekly Active Users — the count of unique users active in the
 * 7-day window ending on weekEndDate (inclusive).
 *
 * @param events - Array of activity events with userId and timestamp
 * @param weekEndDate - The end date of the 7-day window
 * @returns Number of unique users active in the 7-day window
 */
export function computeWAU(
  events: Array<{ userId: string; timestamp: string }>,
  weekEndDate: Date
): number {
  const end = new Date(weekEndDate);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const startMs = start.getTime();
  const endMs = end.getTime();

  const uniqueUsers = new Set<string>();
  for (const event of events) {
    const ts = new Date(event.timestamp).getTime();
    if (ts >= startMs && ts <= endMs && event.userId) {
      uniqueUsers.add(event.userId);
    }
  }

  return uniqueUsers.size;
}

/**
 * Computes Monthly Active Users — the count of unique users active in the
 * 30-day window ending on monthEndDate (inclusive).
 *
 * @param events - Array of activity events with userId and timestamp
 * @param monthEndDate - The end date of the 30-day window
 * @returns Number of unique users active in the 30-day window
 */
export function computeMAU(
  events: Array<{ userId: string; timestamp: string }>,
  monthEndDate: Date
): number {
  const end = new Date(monthEndDate);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const startMs = start.getTime();
  const endMs = end.getTime();

  const uniqueUsers = new Set<string>();
  for (const event of events) {
    const ts = new Date(event.timestamp).getTime();
    if (ts >= startMs && ts <= endMs && event.userId) {
      uniqueUsers.add(event.userId);
    }
  }

  return uniqueUsers.size;
}

/**
 * Computes churn rate — the fraction of users from the previous period
 * who are not active in the current period.
 *
 * @param previousPeriodUsers - Set of user IDs active in the previous period
 * @param currentPeriodUsers - Set of user IDs active in the current period
 * @returns Churn rate as a number between 0 and 1 (0 if previous period is empty)
 */
export function computeChurnRate(
  previousPeriodUsers: Set<string>,
  currentPeriodUsers: Set<string>
): number {
  if (previousPeriodUsers.size === 0) return 0;

  let churnedCount = 0;
  Array.from(previousPeriodUsers).forEach((userId) => {
    if (!currentPeriodUsers.has(userId)) {
      churnedCount++;
    }
  });

  return churnedCount / previousPeriodUsers.size;
}

/**
 * Computes return rate — the fraction of churned users who returned
 * in the current period.
 *
 * @param churnedUsers - Set of user IDs who previously churned
 * @param currentPeriodUsers - Set of user IDs active in the current period
 * @returns Return rate as a number between 0 and 1 (0 if no churned users)
 */
export function computeReturnRate(
  churnedUsers: Set<string>,
  currentPeriodUsers: Set<string>
): number {
  if (churnedUsers.size === 0) return 0;

  let returnedCount = 0;
  Array.from(churnedUsers).forEach((userId) => {
    if (currentPeriodUsers.has(userId)) {
      returnedCount++;
    }
  });

  return returnedCount / churnedUsers.size;
}

/**
 * Generates a cohort retention table showing what percentage of users
 * from each signup week are still active in subsequent weeks.
 *
 * @param users - Array of user records with id and createdAt timestamp
 * @param events - Array of activity events with userId and timestamp
 * @param weeks - Number of weeks to track retention for
 * @returns Array of CohortRow objects, one per signup week cohort
 */
export function generateCohortTable(
  users: Array<{ id: string; createdAt: string }>,
  events: Array<{ userId: string; timestamp: string }>,
  weeks: number
): CohortRow[] {
  if (users.length === 0 || weeks <= 0) return [];

  // Group users by their signup week (week starts on Monday)
  const cohorts = new Map<string, Set<string>>();

  for (const user of users) {
    const createdDate = new Date(user.createdAt);
    const weekStart = getWeekStart(createdDate);
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!cohorts.has(weekKey)) {
      cohorts.set(weekKey, new Set());
    }
    cohorts.get(weekKey)!.add(user.id);
  }

  // Build a lookup: userId → set of week keys they were active in
  const userActiveWeeks = new Map<string, Set<string>>();
  for (const event of events) {
    if (!event.userId) continue;
    const eventDate = new Date(event.timestamp);
    const weekStart = getWeekStart(eventDate);
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!userActiveWeeks.has(event.userId)) {
      userActiveWeeks.set(event.userId, new Set());
    }
    userActiveWeeks.get(event.userId)!.add(weekKey);
  }

  // Sort cohort weeks chronologically
  const sortedCohortWeeks = Array.from(cohorts.keys()).sort();

  const rows: CohortRow[] = [];

  for (const cohortWeek of sortedCohortWeeks) {
    const cohortUsers = cohorts.get(cohortWeek)!;
    const totalUsers = cohortUsers.size;
    const retentionByWeek: number[] = [];

    const cohortStartDate = new Date(cohortWeek);

    for (let w = 1; w <= weeks; w++) {
      // Calculate the week start for week w after the cohort week
      const targetWeekStart = new Date(cohortStartDate);
      targetWeekStart.setDate(targetWeekStart.getDate() + w * 7);
      const targetWeekKey = targetWeekStart.toISOString().split('T')[0];

      // Count how many cohort users were active in this target week
      let activeCount = 0;
      Array.from(cohortUsers).forEach((userId) => {
        const activeWeeks = userActiveWeeks.get(userId);
        if (activeWeeks && activeWeeks.has(targetWeekKey)) {
          activeCount++;
        }
      });

      const retentionPct = totalUsers > 0 ? (activeCount / totalUsers) * 100 : 0;
      retentionByWeek.push(Math.round(retentionPct * 10) / 10);
    }

    rows.push({
      cohortWeek,
      totalUsers,
      retentionByWeek,
    });
  }

  return rows;
}

/**
 * Returns the Monday of the week containing the given date.
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  // Adjust to Monday (day 1). Sunday (0) goes back 6 days.
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}
