"use client";

/**
 * ForageWise — useChallenges Hook
 *
 * Loads all challenges from the IndexedDB `challenges` store on mount.
 * Seeds the database if stores are empty (first run).
 *
 * Provides:
 * - `challenges`: all challenge records
 * - `updateCriterion`: update a single criterion's completed state and
 *   derive challenge-level completedAt accordingly
 * - `getChallengesPreview`: returns at most 3 non-completed challenges
 * - `badges`: all badges (earned and unearned)
 * - `earnedBadges`: only earned badges
 * - `justEarnedBadge`: set when a badge is newly earned (for celebration UI)
 * - `dismissBadgeCelebration`: clears the justEarnedBadge
 *
 * Requirements: 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { useState, useEffect, useCallback } from "react";
import { getAllRecords, putRecord } from "@/offline/db";
import { seedDatabase } from "@/data/seedDatabase";
import type { Challenge, ChallengeBadge } from "@/types";

export interface UseChallengesResult {
  challenges: Challenge[];
  loading: boolean;
  error: string | null;
  updateCriterion: (
    challengeId: string,
    criterionId: string,
    completed: boolean,
  ) => Promise<void>;
  getChallengesPreview: () => Challenge[];
  badges: ChallengeBadge[];
  earnedBadges: ChallengeBadge[];
  justEarnedBadge: ChallengeBadge | null;
  dismissBadgeCelebration: () => void;
}

/**
 * Hook that loads all challenges and badges from IndexedDB, seeds the database
 * on first run, and provides mutation + preview helpers.
 */
export function useChallenges(): UseChallengesResult {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [badges, setBadges] = useState<ChallengeBadge[]>([]);
  const [justEarnedBadge, setJustEarnedBadge] = useState<ChallengeBadge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Seed database if empty (idempotent)
        await seedDatabase();

        const records = await getAllRecords("challenges");
        const badgeRecords = await getAllRecords("challengeBadges");

        if (cancelled) return;

        setChallenges(records);
        setBadges(badgeRecords);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load challenges",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Award a badge when a challenge is completed.
   * Finds the badge linked to the given challengeId, marks it as earned,
   * persists to IndexedDB, and triggers the celebration UI.
   */
  const awardBadgeForChallenge = useCallback(
    async (challengeId: string) => {
      const badge = badges.find((b) => b.challengeId === challengeId);
      if (!badge || badge.isEarned) return;

      const now = new Date().toISOString();
      const earnedBadge: ChallengeBadge = {
        ...badge,
        isEarned: true,
        earnedAt: now,
      };

      // Persist to IndexedDB
      await putRecord("challengeBadges", earnedBadge);

      // Update local state
      setBadges((prev) =>
        prev.map((b) => (b.id === earnedBadge.id ? earnedBadge : b)),
      );

      // Trigger celebration
      setJustEarnedBadge(earnedBadge);
    },
    [badges],
  );

  /**
   * Update a single criterion's `completed` state within a challenge.
   *
   * - Sets `completedAt` on the criterion when completed is true.
   * - If ALL criteria are now completed, sets `completedAt` on the challenge
   *   and awards the corresponding badge.
   * - If any criterion is not completed, clears `completedAt` on the challenge.
   * - Persists the updated challenge to IndexedDB.
   * - Updates local state.
   */
  const updateCriterion = useCallback(
    async (challengeId: string, criterionId: string, completed: boolean) => {
      let shouldAwardBadge = false;

      setChallenges((prev) => {
        const idx = prev.findIndex((c) => c.id === challengeId);
        if (idx === -1) return prev;

        const challenge = prev[idx];
        const now = new Date().toISOString();

        const updatedCriteria = challenge.criteria.map((criterion) => {
          if (criterion.id !== criterionId) return criterion;
          return {
            ...criterion,
            completed,
            completedAt: completed ? now : undefined,
          };
        });

        const allCompleted = updatedCriteria.every((c) => c.completed);

        // Only award badge if challenge was not previously completed and is now
        if (allCompleted && !challenge.completedAt) {
          shouldAwardBadge = true;
        }

        const updatedChallenge: Challenge = {
          ...challenge,
          criteria: updatedCriteria,
          completedAt: allCompleted ? now : undefined,
          lastUpdated: now,
        };

        // Persist to IndexedDB (fire-and-forget with error logging)
        putRecord("challenges", updatedChallenge).catch((err) => {
          console.error("Failed to persist challenge update:", err);
        });

        const next = [...prev];
        next[idx] = updatedChallenge;
        return next;
      });

      // Award badge outside of setState to avoid stale closure issues
      if (shouldAwardBadge) {
        await awardBadgeForChallenge(challengeId);
      }
    },
    [awardBadgeForChallenge],
  );

  /**
   * Returns at most 3 challenges where `completedAt` is null/undefined,
   * preserving their relative order from the full challenges list.
   */
  const getChallengesPreview = useCallback((): Challenge[] => {
    return challenges
      .filter((c) => !c.completedAt)
      .slice(0, 3);
  }, [challenges]);

  /** Dismiss the badge celebration overlay */
  const dismissBadgeCelebration = useCallback(() => {
    setJustEarnedBadge(null);
  }, []);

  /** Derived: only earned badges */
  const earnedBadges = badges.filter((b) => b.isEarned);

  return {
    challenges,
    loading,
    error,
    updateCriterion,
    getChallengesPreview,
    badges,
    earnedBadges,
    justEarnedBadge,
    dismissBadgeCelebration,
  };
}
