'use client';

import { useState, useCallback, useEffect } from 'react';
import { putRecord, getAllRecords } from '@/offline/db';
import type { TrailConditionReport, TrailConditionCategory } from '@/types';
import type { SyncStatus } from '@/types';
import {
  aggregateTrailConditions,
  getReportsForTrail,
  type AggregatedCondition,
} from '@/utils/trailConditionAggregator';

/**
 * Generates a unique report ID.
 */
function generateReportId(): string {
  return `tcr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Trail conditions hook that fetches, aggregates, and caches trail
 * condition reports for offline display.
 *
 * - Fetch and aggregate trail condition reports
 * - Cache for offline display with timestamp
 *
 * Requirements: 10.1–10.6, 17.7, 17.8
 */
export function useTrailConditions(trailId?: string) {
  const [reports, setReports] = useState<TrailConditionReport[]>([]);
  const [aggregated, setAggregated] = useState<AggregatedCondition | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Loads trail condition reports from IndexedDB.
   */
  const loadReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const allReports = await getAllRecords('trailConditionReports');
      const trailReports = trailId
        ? getReportsForTrail(allReports as TrailConditionReport[], trailId)
        : (allReports as TrailConditionReport[]);

      setReports(trailReports);
      setLastFetchedAt(new Date().toISOString());

      // Aggregate if we have a specific trail
      if (trailId) {
        const result = aggregateTrailConditions(trailReports);
        setAggregated(result);
      }
    } catch {
      // Silently fail — display cached data or empty state
    } finally {
      setIsLoading(false);
    }
  }, [trailId]);

  /**
   * Submits a new trail condition report.
   */
  const submitReport = useCallback(
    async (
      userId: string,
      targetTrailId: string,
      categories: TrailConditionCategory[],
      details?: string,
      photoId?: string,
    ) => {
      const report: TrailConditionReport = {
        id: generateReportId(),
        userId,
        trailId: targetTrailId,
        categories,
        details,
        photoId,
        reportedAt: new Date().toISOString(),
        syncStatus: 'pending' as SyncStatus,
      };

      await putRecord('trailConditionReports', report);

      // Refresh local state
      await loadReports();

      return report;
    },
    [loadReports],
  );

  /**
   * Gets the aggregated condition for a specific trail.
   */
  const getConditionForTrail = useCallback(
    async (targetTrailId: string): Promise<AggregatedCondition> => {
      const allReports = await getAllRecords('trailConditionReports');
      const trailReports = getReportsForTrail(
        allReports as TrailConditionReport[],
        targetTrailId,
      );
      return aggregateTrailConditions(trailReports);
    },
    [],
  );

  // Load reports on mount and when trailId changes
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return {
    reports,
    aggregated,
    lastFetchedAt,
    isLoading,
    loadReports,
    submitReport,
    getConditionForTrail,
  };
}
