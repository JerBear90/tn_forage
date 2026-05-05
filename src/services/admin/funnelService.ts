/**
 * Funnel tracking service for the admin dashboard.
 *
 * Provides funnel data for the identification flow and onboarding flow
 * by querying PocketBase analytics collections and computing conversion
 * rates using pure computation utilities.
 */

import { pb } from '@/auth/authService';
import type { TimeRange, FunnelData } from '@/types/admin-dashboard';
import { computeConversionRates } from './computations/funnel';

// ---------------------------------------------------------------------------
// Funnel Definitions
// ---------------------------------------------------------------------------

/** Steps in the identification flow funnel */
const IDENTIFICATION_FLOW_STEPS = [
  'Field Guide Browse',
  'Species Detail',
  'AI Identification',
  'Trip Plan',
] as const;

/** Steps in the onboarding flow funnel */
const ONBOARDING_FLOW_STEPS = [
  'First Visit',
  'Account Creation',
  'First Species View',
  'First Sighting Post',
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
 * Counts unique users who viewed a specific page path pattern within the time range.
 */
async function countPageViewUsers(
  timeRange: TimeRange,
  pathPattern: string
): Promise<number> {
  const filter = `${timeRangeFilter(timeRange)} && path ~ "${pathPattern}"`;

  try {
    const records = await pb.collection('analytics_page_views').getFullList({
      filter,
      fields: 'userId,sessionId',
    });

    // Count unique users (by userId if available, otherwise by sessionId)
    const uniqueIdentifiers = new Set<string>();
    for (const record of records) {
      const identifier = (record.userId as string) || (record.sessionId as string);
      if (identifier) {
        uniqueIdentifiers.add(identifier);
      }
    }

    return uniqueIdentifiers.size;
  } catch {
    return 0;
  }
}

/**
 * Counts unique users who triggered a specific usage event within the time range.
 */
async function countUsageEventUsers(
  timeRange: TimeRange,
  featureKey: string
): Promise<number> {
  const filter = `${timeRangeFilter(timeRange)} && featureKey = "${featureKey}"`;

  try {
    const records = await pb.collection('analytics_usage_events').getFullList({
      filter,
      fields: 'userId,sessionId',
    });

    const uniqueIdentifiers = new Set<string>();
    for (const record of records) {
      const identifier = (record.userId as string) || (record.sessionId as string);
      if (identifier) {
        uniqueIdentifiers.add(identifier);
      }
    }

    return uniqueIdentifiers.size;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Funnel Data Retrieval
// ---------------------------------------------------------------------------

/**
 * Fetches funnel data for both the identification flow and onboarding flow.
 *
 * Queries `analytics_page_views` and `analytics_usage_events` to count
 * unique users at each step, then computes conversion rates.
 *
 * @param timeRange - The time range to query
 * @returns Array of FunnelData objects for each funnel
 */
export async function getFunnelData(timeRange: TimeRange): Promise<FunnelData[]> {
  // --- Identification Flow ---
  // Field Guide Browse → Species Detail → AI Identification → Trip Plan
  const [
    fieldGuideBrowseCount,
    speciesDetailCount,
    aiIdentificationCount,
    tripPlanCount,
  ] = await Promise.all([
    countPageViewUsers(timeRange, '/field-guide'),
    countPageViewUsers(timeRange, '/field-guide/'),
    countUsageEventUsers(timeRange, 'identification'),
    countPageViewUsers(timeRange, '/trips'),
  ]);

  const identificationStepCounts = [
    fieldGuideBrowseCount,
    speciesDetailCount,
    aiIdentificationCount,
    tripPlanCount,
  ];

  const identificationSteps = computeConversionRates(
    identificationStepCounts,
    [...IDENTIFICATION_FLOW_STEPS]
  );

  // --- Onboarding Flow ---
  // First Visit → Account Creation → First Species View → First Sighting Post
  const [
    firstVisitCount,
    accountCreationCount,
    firstSpeciesViewCount,
    firstSightingPostCount,
  ] = await Promise.all([
    countPageViewUsers(timeRange, '/'),
    countNewAccountUsers(timeRange),
    countUsageEventUsers(timeRange, 'field-guide'),
    countUsageEventUsers(timeRange, 'community'),
  ]);

  const onboardingStepCounts = [
    firstVisitCount,
    accountCreationCount,
    firstSpeciesViewCount,
    firstSightingPostCount,
  ];

  const onboardingSteps = computeConversionRates(
    onboardingStepCounts,
    [...ONBOARDING_FLOW_STEPS]
  );

  return [
    { name: 'Identification Flow', steps: identificationSteps },
    { name: 'Onboarding Flow', steps: onboardingSteps },
  ];
}

/**
 * Counts users who created accounts within the time range.
 */
async function countNewAccountUsers(timeRange: TimeRange): Promise<number> {
  const filter = timeRangeFilter(timeRange, 'created');

  try {
    const records = await pb.collection('users').getFullList({
      filter,
      fields: 'id',
    });

    return records.length;
  } catch {
    return 0;
  }
}
