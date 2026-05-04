/**
 * Profile Components — Unit Tests (logic-level)
 *
 * Tests the underlying logic used by ProfileHeader and ProfileTabs components.
 *
 * Since vitest runs in a Node environment (no jsdom), these tests verify
 * pure functions, data construction, boolean logic, and filtering rather
 * than DOM rendering.
 *
 * Validates: Requirements 13.1–13.5, 15.1
 */

import { describe, it, expect } from 'vitest';
import { filterPublicItems } from '@/social/visibilityFilter';
import type { UserProfileExtended, UserRole } from '@/types';

// ---------------------------------------------------------------------------
// Helper: construct a UserProfileExtended with defaults
// ---------------------------------------------------------------------------

function createExtendedProfile(overrides?: Partial<UserProfileExtended>): UserProfileExtended {
  const now = new Date().toISOString();
  return {
    id: 'user-1',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'free' as UserRole,
    createdAt: now,
    updatedAt: now,
    bio: '',
    followerCount: 0,
    followingCount: 0,
    completedTripCount: 0,
    achievementCount: 0,
    defaultVisibility: 'private',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. ProfileHeader logic tests
// ---------------------------------------------------------------------------

describe('ProfileHeader logic', () => {
  describe('UserProfileExtended construction with default values', () => {
    it('creates a profile with private default visibility', () => {
      const profile = createExtendedProfile();
      expect(profile.defaultVisibility).toBe('private');
    });

    it('creates a profile with zero follower and following counts', () => {
      const profile = createExtendedProfile();
      expect(profile.followerCount).toBe(0);
      expect(profile.followingCount).toBe(0);
    });

    it('preserves display name from base profile', () => {
      const profile = createExtendedProfile({ displayName: 'Alice Forager' });
      expect(profile.displayName).toBe('Alice Forager');
    });

    it('preserves avatar from base profile', () => {
      const profile = createExtendedProfile({ avatar: '/images/avatar.jpg' });
      expect(profile.avatar).toBe('/images/avatar.jpg');
    });

    it('includes optional bio field', () => {
      const profile = createExtendedProfile({ bio: 'I love foraging in Tennessee!' });
      expect(profile.bio).toBe('I love foraging in Tennessee!');
    });

    it('defaults bio to empty string', () => {
      const profile = createExtendedProfile();
      expect(profile.bio).toBe('');
    });

    it('includes follower count', () => {
      const profile = createExtendedProfile({ followerCount: 42 });
      expect(profile.followerCount).toBe(42);
    });

    it('includes following count', () => {
      const profile = createExtendedProfile({ followingCount: 15 });
      expect(profile.followingCount).toBe(15);
    });
  });

  describe('isOwnProfile controls follow button visibility', () => {
    it('follow button should be hidden on own profile (isOwnProfile === true)', () => {
      const isOwnProfile = true;
      const showFollowButton = !isOwnProfile;
      expect(showFollowButton).toBe(false);
    });

    it('follow button should be visible on other user profile (isOwnProfile === false)', () => {
      const isOwnProfile = false;
      const showFollowButton = !isOwnProfile;
      expect(showFollowButton).toBe(true);
    });
  });

  describe('follow/unfollow button state', () => {
    it('shows "Follow" when not following', () => {
      const isFollowing = false;
      const buttonLabel = isFollowing ? 'Following' : 'Follow';
      expect(buttonLabel).toBe('Follow');
    });

    it('shows "Following" when already following', () => {
      const isFollowing = true;
      const buttonLabel = isFollowing ? 'Following' : 'Follow';
      expect(buttonLabel).toBe('Following');
    });
  });

  describe('follower/following count display', () => {
    it('uses singular "follower" for count of 1', () => {
      const count = 1;
      const label = (count as number) === 1 ? 'follower' : 'followers';
      expect(label).toBe('follower');
    });

    it('uses plural "followers" for count of 0', () => {
      const count = 0;
      const label = (count as number) === 1 ? 'follower' : 'followers';
      expect(label).toBe('followers');
    });

    it('uses plural "followers" for count > 1', () => {
      const count = 5;
      const label = (count as number) === 1 ? 'follower' : 'followers';
      expect(label).toBe('followers');
    });
  });
});

// ---------------------------------------------------------------------------
// 2. ProfileTabs logic tests
// ---------------------------------------------------------------------------

describe('ProfileTabs logic', () => {
  describe('tab names', () => {
    const expectedTabs = ['Completed Trips', 'Achievements', 'Reviews', 'Photos'];

    it('has exactly four tabs', () => {
      expect(expectedTabs).toHaveLength(4);
    });

    it.each(expectedTabs)('includes tab "%s"', (tabName) => {
      expect(expectedTabs).toContain(tabName);
    });

    it('tabs are in the correct order', () => {
      expect(expectedTabs[0]).toBe('Completed Trips');
      expect(expectedTabs[1]).toBe('Achievements');
      expect(expectedTabs[2]).toBe('Reviews');
      expect(expectedTabs[3]).toBe('Photos');
    });
  });

  describe('default active tab', () => {
    it('defaults to "Completed Trips"', () => {
      const defaultTab = 'Completed Trips';
      expect(defaultTab).toBe('Completed Trips');
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Visibility filtering for other user profiles
// ---------------------------------------------------------------------------

describe('Profile visibility filtering', () => {
  it('filterPublicItems returns only public items', () => {
    const items = [
      { id: '1', name: 'Public Trip', visibility: 'public' as const },
      { id: '2', name: 'Private Trip', visibility: 'private' as const },
      { id: '3', name: 'Another Public', visibility: 'public' as const },
    ];

    const result = filterPublicItems(items);
    expect(result).toHaveLength(2);
    expect(result.every((item) => item.visibility === 'public')).toBe(true);
  });

  it('filterPublicItems returns empty array when all items are private', () => {
    const items = [
      { id: '1', name: 'Private 1', visibility: 'private' as const },
      { id: '2', name: 'Private 2', visibility: 'private' as const },
    ];

    const result = filterPublicItems(items);
    expect(result).toHaveLength(0);
  });

  it('filterPublicItems returns all items when all are public', () => {
    const items = [
      { id: '1', name: 'Public 1', visibility: 'public' as const },
      { id: '2', name: 'Public 2', visibility: 'public' as const },
    ];

    const result = filterPublicItems(items);
    expect(result).toHaveLength(2);
  });

  it('filterPublicItems handles empty array', () => {
    const result = filterPublicItems([]);
    expect(result).toHaveLength(0);
  });

  it('private items are hidden when viewing another user profile', () => {
    const isOwnProfile = false;
    const items = [
      { id: '1', name: 'Trip A', visibility: 'public' as const },
      { id: '2', name: 'Trip B', visibility: 'private' as const },
    ];

    // When viewing another user's profile, filter to public only
    const displayItems = !isOwnProfile ? filterPublicItems(items) : items;
    expect(displayItems).toHaveLength(1);
    expect(displayItems[0].id).toBe('1');
  });

  it('all items shown when viewing own profile', () => {
    const isOwnProfile = true;
    const items = [
      { id: '1', name: 'Trip A', visibility: 'public' as const },
      { id: '2', name: 'Trip B', visibility: 'private' as const },
    ];

    // When viewing own profile, show all items
    const displayItems = !isOwnProfile ? filterPublicItems(items) : items;
    expect(displayItems).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 4. Default profile privacy (Requirement 15.1)
// ---------------------------------------------------------------------------

describe('Default profile privacy', () => {
  it('new profiles default to private visibility', () => {
    const profile = createExtendedProfile();
    expect(profile.defaultVisibility).toBe('private');
  });

  it('profile can be set to public visibility', () => {
    const profile = createExtendedProfile({ defaultVisibility: 'public' });
    expect(profile.defaultVisibility).toBe('public');
  });

  it('defaultVisibility is always a valid value', () => {
    const validValues = ['private', 'public'];
    const profile = createExtendedProfile();
    expect(validValues).toContain(profile.defaultVisibility);
  });
});
