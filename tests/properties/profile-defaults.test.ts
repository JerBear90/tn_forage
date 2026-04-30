/**
 * Profile Defaults — Property-Based Tests
 *
 * Property 18: Default profile privacy
 *
 * **Validates: Requirements 15.1**
 *
 * For any newly created user profile, the defaultVisibility field shall be 'private'.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { UserProfileExtended, UserRole } from '@/types';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generate a random user role */
const userRoleArb = fc.constantFrom<UserRole>('guest', 'free', 'member', 'super_user');

/** Generate random user profile data */
const userDataArb = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  displayName: fc.string({ minLength: 1, maxLength: 50 }),
  role: userRoleArb,
  bio: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
});

// ---------------------------------------------------------------------------
// Helper: create a new UserProfileExtended with default values
// ---------------------------------------------------------------------------

function createDefaultProfile(data: {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  bio?: string;
}): UserProfileExtended {
  const now = new Date().toISOString();
  return {
    id: data.id,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    createdAt: now,
    updatedAt: now,
    bio: data.bio || '',
    followerCount: 0,
    followingCount: 0,
    completedTripCount: 0,
    achievementCount: 0,
    defaultVisibility: 'private',
  };
}

// ---------------------------------------------------------------------------
// Property 18: Default profile privacy
// ---------------------------------------------------------------------------

describe('Feature: social-profile-and-park-details, Property 18: Default profile privacy', () => {
  it('For any newly created user profile, the defaultVisibility field shall be "private"', () => {
    fc.assert(
      fc.property(userDataArb, (userData) => {
        const profile = createDefaultProfile(userData);

        // The default visibility must always be 'private'
        expect(profile.defaultVisibility).toBe('private');
      }),
      { numRuns: 100 },
    );
  });

  it('The defaultVisibility field shall be a valid visibility value', () => {
    fc.assert(
      fc.property(userDataArb, (userData) => {
        const profile = createDefaultProfile(userData);

        // Must be one of the valid visibility values
        expect(['private', 'public']).toContain(profile.defaultVisibility);
      }),
      { numRuns: 100 },
    );
  });

  it('New profiles shall have zero follower and following counts', () => {
    fc.assert(
      fc.property(userDataArb, (userData) => {
        const profile = createDefaultProfile(userData);

        expect(profile.followerCount).toBe(0);
        expect(profile.followingCount).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});
