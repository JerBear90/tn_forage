/**
 * Onboarding service for the admin dashboard.
 *
 * Tracks milestone completion for new users by querying PocketBase
 * analytics collections (page views and usage events) and computing
 * completion percentages, average time-to-milestone, and flagging
 * milestones with low completion rates.
 */

import { pb } from '@/auth/authService';
import type { TimeRange } from '@/types/admin-dashboard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OnboardingMilestone {
  id: string;
  name: string;
  completionPercentage: number;
  averageTimeToComplete: number; // hours from registration
  completedCount: number;
  totalNewUsers: number;
  flagged: boolean; // true if completion < 30%
}

export interface OnboardingMetrics {
  milestones: OnboardingMilestone[];
  totalNewUsers: number;
  overallCompletionRate: number; // average across all milestones
}

// ---------------------------------------------------------------------------
// Milestone Definitions
// ---------------------------------------------------------------------------

export const ONBOARDING_MILESTONES = [
  {
    id: 'first-species-view',
    name: 'First Species View',
    type: 'page_view' as const,
    match: '/field-guide/',
  },
  {
    id: 'first-map-interaction',
    name: 'First Map Interaction',
    type: 'usage_event' as const,
    featureKey: 'map',
  },
  {
    id: 'first-trip-created',
    name: 'First Trip Created',
    type: 'usage_event' as const,
    featureKey: 'trips',
  },
  {
    id: 'first-sighting-posted',
    name: 'First Sighting Posted',
    type: 'usage_event' as const,
    featureKey: 'community',
  },
  {
    id: 'first-challenge-started',
    name: 'First Challenge Started',
    type: 'page_view' as const,
    match: '/community/challenges',
  },
] as const;

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

/**
 * Computes the average time in hours between two dates for a set of completions.
 */
function computeAverageHours(
  completions: Array<{ registeredAt: string; completedAt: string }>
): number {
  if (completions.length === 0) return 0;
  const totalHours = completions.reduce((sum, c) => {
    const regTime = new Date(c.registeredAt).getTime();
    const compTime = new Date(c.completedAt).getTime();
    const hours = Math.max(0, (compTime - regTime) / (1000 * 60 * 60));
    return sum + hours;
  }, 0);
  return totalHours / completions.length;
}

// ---------------------------------------------------------------------------
// Onboarding Metrics
// ---------------------------------------------------------------------------

/**
 * Fetches onboarding metrics for the given time range.
 *
 * Identifies new users (registered in the last 30 days relative to the
 * time range end), then checks which milestones each user has completed
 * by querying page views and usage events.
 *
 * @param timeRange - The time range to query
 * @returns OnboardingMetrics with milestone completion data
 */
export async function getOnboardingMetrics(timeRange: TimeRange): Promise<OnboardingMetrics> {
  // Get new users registered in the last 30 days relative to time range end
  const thirtyDaysAgo = new Date(timeRange.endDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startStr = thirtyDaysAgo.toISOString().replace('T', ' ');
  const endStr = timeRange.endDate.toISOString().replace('T', ' ');

  const newUsers = await pb.collection('users').getFullList({
    filter: `created >= "${startStr}" && created <= "${endStr}"`,
    sort: '-created',
  });

  const totalNewUsers = newUsers.length;

  if (totalNewUsers === 0) {
    return {
      milestones: ONBOARDING_MILESTONES.map((m) => ({
        id: m.id,
        name: m.name,
        completionPercentage: 0,
        averageTimeToComplete: 0,
        completedCount: 0,
        totalNewUsers: 0,
        flagged: true,
      })),
      totalNewUsers: 0,
      overallCompletionRate: 0,
    };
  }

  // Build a map of userId -> registration date
  const userRegMap = new Map<string, string>();
  const userIds = new Set<string>();
  for (const user of newUsers) {
    userRegMap.set(user.id, (user.created as string) ?? new Date().toISOString());
    userIds.add(user.id);
  }

  // Fetch page views for these users within the time range
  const pageViewFilter = timeRangeFilter(timeRange);
  const pageViews = await pb.collection('analytics_page_views').getFullList({
    filter: pageViewFilter,
    sort: 'timestamp',
  });

  // Fetch usage events for these users within the time range
  const usageFilter = timeRangeFilter(timeRange);
  const usageEvents = await pb.collection('analytics_usage_events').getFullList({
    filter: usageFilter,
    sort: 'timestamp',
  });

  // Compute milestones
  const milestones: OnboardingMilestone[] = ONBOARDING_MILESTONES.map((milestone) => {
    const completions: Array<{ registeredAt: string; completedAt: string }> = [];

    if (milestone.type === 'page_view') {
      // Find first page view matching the path for each new user
      const userFirstView = new Map<string, string>();
      for (const pv of pageViews) {
        const userId = pv.userId as string | undefined;
        if (!userId || !userIds.has(userId)) continue;
        const path = pv.path as string;
        if (path.includes(milestone.match) && !userFirstView.has(userId)) {
          userFirstView.set(userId, pv.timestamp as string);
        }
      }
      userFirstView.forEach((timestamp, userId) => {
        const registeredAt = userRegMap.get(userId);
        if (registeredAt) {
          completions.push({ registeredAt, completedAt: timestamp });
        }
      });
    } else {
      // usage_event type
      const userFirstEvent = new Map<string, string>();
      for (const ue of usageEvents) {
        const userId = ue.userId as string | undefined;
        if (!userId || !userIds.has(userId)) continue;
        const featureKey = ue.featureKey as string;
        if (featureKey === milestone.featureKey && !userFirstEvent.has(userId)) {
          userFirstEvent.set(userId, ue.timestamp as string);
        }
      }
      userFirstEvent.forEach((timestamp, userId) => {
        const registeredAt = userRegMap.get(userId);
        if (registeredAt) {
          completions.push({ registeredAt, completedAt: timestamp });
        }
      });
    }

    const completedCount = completions.length;
    const completionPercentage = (completedCount / totalNewUsers) * 100;
    const averageTimeToComplete = computeAverageHours(completions);
    const flagged = completionPercentage < 30;

    return {
      id: milestone.id,
      name: milestone.name,
      completionPercentage,
      averageTimeToComplete,
      completedCount,
      totalNewUsers,
      flagged,
    };
  });

  const overallCompletionRate =
    milestones.reduce((sum, m) => sum + m.completionPercentage, 0) / milestones.length;

  return {
    milestones,
    totalNewUsers,
    overallCompletionRate,
  };
}
