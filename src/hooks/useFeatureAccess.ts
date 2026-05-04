'use client';

import { useState, useEffect } from 'react';
import { getAllRecords } from '@/offline/db';
import type { FeatureFlag } from '@/types';

/**
 * Feature access result returned by the hook.
 */
export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Determines whether the current user has access to a given feature.
 *
 * In Phase 3.2, all features return `{ allowed: true }` regardless of
 * membership tier. This hook establishes the gating infrastructure for
 * future membership-based access control in Phase 4.
 *
 * Reads feature flags from IndexedDB on mount.
 *
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 */
export function useFeatureAccess(featureKey: string): FeatureAccessResult {
  const [result, setResult] = useState<FeatureAccessResult>({ allowed: true });

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      try {
        const flags = await getAllRecords('featureFlags');
        if (cancelled) return;

        const flag = flags.find((f: FeatureFlag) => f.featureKey === featureKey);

        // Phase 3.2: all features are free — always allow access
        if (!flag) {
          setResult({ allowed: true, reason: 'Feature not configured — defaulting to allowed.' });
          return;
        }

        // In Phase 3.2, all access tiers resolve to allowed
        setResult({ allowed: true });
      } catch {
        // On error (e.g., IndexedDB unavailable), default to allowed
        if (!cancelled) {
          setResult({ allowed: true, reason: 'Unable to check feature access — defaulting to allowed.' });
        }
      }
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [featureKey]);

  return result;
}
