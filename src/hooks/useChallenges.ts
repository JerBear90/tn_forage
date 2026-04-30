"use client";

/**
 * ForageFlow — useChallenges Hook
 *
 * Loads all challenges from the IndexedDB `challenges` store on mount.
 * Seeds the database if stores are empty (first run).
 *
 * Provides:
 * - `challenges`: all challenge records
 * - `updateCriterion`: update a single criterion's completed state and
 *   derive challenge-level completedAt accordingly
 * - `getChallengesPreview`: returns at most 3 non-completed challenges
 *
 * Requirements: 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { useState, useEffect, useCallback } from "react";
import { getAllRecords, putRecord } from "@/offline/db";
import { seedDatabase } from "@/data/seedDatabase";
import type { Challenge } from "@/types";

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
}

/**
 * Hook that loads all challenges from IndexedDB, seeds the database
 * on first run, and provides mutation + preview helpers.
 */
export function useChallenges(): UseChallengesResult {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Seed database if empty (idempotent)
        await seedDatabase();

        const records = await getAllRecords("challenges");

        if (cancelled) return;

        setChallenges(records);
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
   * Update a single criterion's `completed` state within a challenge.
   *
   * - Sets `completedAt` on the criterion when completed is true.
   * - If ALL criteria are now completed, sets `completedAt` on the challenge.
   * - If any criterion is not completed, clears `completedAt` on the challenge.
   * - Persists the updated challenge to IndexedDB.
   * - Updates local state.
   */
  const updateCriterion = useCallback(
    async (challengeId: string, criterionId: string, completed: boolean) => {
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
    },
    [],
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

  return { challenges, loading, error, updateCriterion, getChallengesPreview };
}
