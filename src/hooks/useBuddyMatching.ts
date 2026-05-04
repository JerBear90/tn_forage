'use client';

import { useState, useCallback, useEffect } from 'react';
import { putRecord, getAllRecords, deleteRecord } from '@/offline/db';
import type {
  ForagingProfile,
  OutingInvitation,
  ExperienceLevel,
  ForagingInterest,
  TnRegion,
} from '@/types';

/**
 * Generates a unique profile/invitation ID.
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Buddy matching hook providing profile management, match display,
 * and invitation CRUD.
 *
 * Requirements: 30.1–30.9
 */
export function useBuddyMatching(userId: string) {
  const [profile, setProfile] = useState<ForagingProfile | null>(null);
  const [matches, setMatches] = useState<ForagingProfile[]>([]);
  const [invitations, setInvitations] = useState<OutingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Loads the user's foraging profile.
   */
  const loadProfile = useCallback(async () => {
    try {
      const all = await getAllRecords('foragingProfiles');
      const userProfile = (all as ForagingProfile[]).find((p) => p.userId === userId);
      setProfile(userProfile ?? null);
    } catch {
      // Silently fail
    }
  }, [userId]);

  /**
   * Creates or updates the user's foraging profile.
   */
  const saveProfile = useCallback(
    async (params: {
      experienceLevel: ExperienceLevel;
      interests: ForagingInterest[];
      preferredParks: string[];
      preferredRegions: TnRegion[];
      availability: ('weekdays' | 'weekends')[];
      optedIn: boolean;
    }): Promise<ForagingProfile> => {
      const now = new Date().toISOString();
      const existing = profile;

      const updated: ForagingProfile = {
        id: existing?.id ?? generateId('profile'),
        userId,
        experienceLevel: params.experienceLevel,
        interests: params.interests,
        preferredParks: params.preferredParks,
        preferredRegions: params.preferredRegions,
        availability: params.availability,
        optedIn: params.optedIn,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        syncStatus: 'pending',
      };

      await putRecord('foragingProfiles', updated);
      setProfile(updated);

      return updated;
    },
    [userId, profile],
  );

  /**
   * Finds matching profiles based on shared interests, regions, and availability.
   */
  const findMatches = useCallback(async () => {
    if (!profile || !profile.optedIn) {
      setMatches([]);
      return;
    }

    setIsLoading(true);
    try {
      const all = await getAllRecords('foragingProfiles');
      const otherProfiles = (all as ForagingProfile[]).filter(
        (p) => p.userId !== userId && p.optedIn,
      );

      // Score matches based on shared attributes
      const scored = otherProfiles.map((other) => {
        let score = 0;

        // Shared interests
        const sharedInterests = profile.interests.filter((i) =>
          other.interests.includes(i),
        );
        score += sharedInterests.length * 3;

        // Shared regions
        const sharedRegions = profile.preferredRegions.filter((r) =>
          other.preferredRegions.includes(r),
        );
        score += sharedRegions.length * 2;

        // Shared availability
        const sharedAvailability = profile.availability.filter((a) =>
          other.availability.includes(a),
        );
        score += sharedAvailability.length * 2;

        // Similar experience level
        if (profile.experienceLevel === other.experienceLevel) {
          score += 1;
        }

        return { profile: other, score };
      });

      // Sort by score descending and take top matches
      scored.sort((a, b) => b.score - a.score);
      setMatches(scored.filter((s) => s.score > 0).map((s) => s.profile));
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [userId, profile]);

  /**
   * Sends an outing invitation to another user.
   */
  const sendInvitation = useCallback(
    async (params: {
      toUserId: string;
      date: string;
      parkId?: string;
      description: string;
    }): Promise<OutingInvitation> => {
      const invitation: OutingInvitation = {
        id: generateId('invite'),
        fromUserId: userId,
        toUserId: params.toUserId,
        date: params.date,
        parkId: params.parkId,
        description: params.description,
        status: 'pending',
        createdAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      await putRecord('outingInvitations', invitation);
      await loadInvitations();

      return invitation;
    },
    [userId],
  );

  /**
   * Responds to an invitation (accept or decline).
   */
  const respondToInvitation = useCallback(
    async (invitationId: string, response: 'accepted' | 'declined') => {
      const all = await getAllRecords('outingInvitations');
      const invitation = (all as OutingInvitation[]).find((i) => i.id === invitationId);
      if (!invitation) return;

      const updated: OutingInvitation = {
        ...invitation,
        status: response,
        syncStatus: 'pending',
      };

      await putRecord('outingInvitations', updated);
      await loadInvitations();
    },
    [],
  );

  /**
   * Loads invitations for the current user.
   */
  const loadInvitations = useCallback(async () => {
    try {
      const all = await getAllRecords('outingInvitations');
      const userInvitations = (all as OutingInvitation[]).filter(
        (i) => i.fromUserId === userId || i.toUserId === userId,
      );
      setInvitations(userInvitations);
    } catch {
      // Silently fail
    }
  }, [userId]);

  // Load data on mount
  useEffect(() => {
    loadProfile();
    loadInvitations();
  }, [loadProfile, loadInvitations]);

  return {
    profile,
    matches,
    invitations,
    isLoading,
    saveProfile,
    findMatches,
    sendInvitation,
    respondToInvitation,
    loadProfile,
  };
}
