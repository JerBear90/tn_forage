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
import { fetchUserSubmissions, submitChallenge as submitChallengeService } from "@/services/challengeSubmissionService";
import { pb } from "@/auth/authService";
import type { Challenge, ChallengeBadge, ChallengeSubmission } from "@/types";

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
  submitChallenge: (challengeId: string, photoFile: File) => Promise<ChallengeSubmission>;
  submissionLoading: boolean;
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
  const [submissionLoading, setSubmissionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Seed database if empty (idempotent)
        await seedDatabase();

        const records = await getAllRecords("challenges");
        const badgeRecords = await getAllRecords("challengeBadges");

        if (cancelled) return;

        // Check PocketBase for approved submissions and mark challenges as completed
        let updatedRecords = records;
        try {
          const userId = pb.authStore.record?.id;
          if (userId) {
            const submissions = await fetchUserSubmissions(userId);
            const approvedSubmissions = submissions.filter(
              (s) => s.status === 'approved',
            );

            if (approvedSubmissions.length > 0) {
              updatedRecords = records.map((challenge) => {
                if (challenge.completedAt) return challenge;

                const approvedSub = approvedSubmissions.find(
                  (s) => s.challengeId === challenge.id,
                );
                if (approvedSub) {
                  const completedAt = approvedSub.reviewedAt || new Date().toISOString();
                  const updatedChallenge: Challenge = {
                    ...challenge,
                    completedAt,
                    lastUpdated: completedAt,
                    criteria: challenge.criteria.map((c) => ({
                      ...c,
                      completed: true,
                      completedAt: completedAt,
                    })),
                  };
                  // Persist to IndexedDB
                  putRecord("challenges", updatedChallenge).catch(() => {});
                  return updatedChallenge;
                }
                return challenge;
              });

              // Award badges for newly completed challenges
              for (const sub of approvedSubmissions) {
                const challenge = records.find((c) => c.id === sub.challengeId);
                if (challenge && !challenge.completedAt) {
                  const badge = badgeRecords.find(
                    (b) => b.challengeId === sub.challengeId && !b.isEarned,
                  );
                  if (badge) {
                    const earnedBadge: ChallengeBadge = {
                      ...badge,
                      isEarned: true,
                      earnedAt: sub.reviewedAt || new Date().toISOString(),
                    };
                    await putRecord("challengeBadges", earnedBadge);
                    // eslint-disable-next-line no-loop-func
                    if (!cancelled) {
                      setBadges((prev) =>
                        prev.map((b) => (b.id === earnedBadge.id ? earnedBadge : b)),
                      );
                      setJustEarnedBadge(earnedBadge);
                    }
                  }
                }
              }
            }
          }
        } catch {
          // PocketBase unreachable — gracefully use local challenge state
        }

        if (cancelled) return;

        setChallenges(updatedRecords);
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

  /**
   * Submit a challenge photo. Wraps the service call and exposes loading state.
   */
  const submitChallengePhoto = useCallback(
    async (challengeId: string, photoFile: File): Promise<ChallengeSubmission> => {
      setSubmissionLoading(true);
      try {
        const submission = await submitChallengeService(challengeId, photoFile);
        return submission;
      } finally {
        setSubmissionLoading(false);
      }
    },
    [],
  );

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
    submitChallenge: submitChallengePhoto,
    submissionLoading,
  };
}
