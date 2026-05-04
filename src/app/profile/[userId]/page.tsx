'use client';

/**
 * ForageFlow — Other User Profile Page
 *
 * Displays another user's public profile with follow/unfollow functionality.
 * Shows "Profile unavailable offline" when the device is offline and the
 * profile is not cached.
 *
 * Requirements: 13.1, 2.5
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/auth/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import {
  followUser,
  unfollowUser,
  isFollowing as checkIsFollowing,
  getFollowerCount,
  getFollowingCount,
} from '@/social/followService';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';
import type { UserProfileExtended } from '@/types';

export default function OtherUserProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId ?? '';
  const { user } = useAuth();
  const currentUserId = user?.id ?? 'guest';
  const isOnline = useOnlineStatus();

  const [profile, setProfile] = useState<UserProfileExtended | null>(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile data
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        if (!isOnline) {
          setError('Profile unavailable offline');
          setLoading(false);
          return;
        }

        // Attempt to load from PocketBase
        // For now, build a minimal profile from available data
        const [followerCount, followingCount] = await Promise.all([
          getFollowerCount(userId),
          getFollowingCount(userId),
        ]);

        if (!cancelled) {
          setProfile({
            id: userId,
            email: '',
            displayName: userId,
            role: 'free',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            followerCount,
            followingCount,
            defaultVisibility: 'private',
          });
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load profile');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (userId) {
      loadProfile();
    }

    return () => {
      cancelled = true;
    };
  }, [userId, isOnline]);

  // Check follow state
  useEffect(() => {
    let cancelled = false;

    async function checkFollow() {
      try {
        const result = await checkIsFollowing(currentUserId, userId);
        if (!cancelled) setFollowing(result);
      } catch {
        // Silently fail — follow state defaults to false
      }
    }

    if (userId) {
      checkFollow();
    }

    return () => {
      cancelled = true;
    };
  }, [userId, currentUserId]);

  const handleFollow = useCallback(async () => {
    const success = await followUser(currentUserId, userId);
    if (success) {
      setFollowing(true);
      // Update follower count optimistically
      setProfile((prev) =>
        prev ? { ...prev, followerCount: (prev.followerCount ?? 0) + 1 } : prev,
      );
    }
  }, [userId, currentUserId]);

  const handleUnfollow = useCallback(async () => {
    const success = await unfollowUser(currentUserId, userId);
    if (success) {
      setFollowing(false);
      // Update follower count optimistically
      setProfile((prev) =>
        prev
          ? { ...prev, followerCount: Math.max(0, (prev.followerCount ?? 0) - 1) }
          : prev,
      );
    }
  }, [userId, currentUserId]);

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-brand-sand dark:bg-dark-bg px-4 pt-6 pb-24">
        <div className="max-w-lg mx-auto">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1 text-sm text-brand-teal hover:underline mb-4"
          >
            ← Back to Feed
          </Link>
          <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50 text-center py-12">
            Loading profile…
          </p>
        </div>
      </main>
    );
  }

  // Error / offline state
  if (error || !profile) {
    return (
      <main className="min-h-screen bg-brand-sand dark:bg-dark-bg px-4 pt-6 pb-24">
        <div className="max-w-lg mx-auto">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1 text-sm text-brand-teal hover:underline mb-4"
          >
            ← Back to Feed
          </Link>
          <div className="rounded-xl bg-white/80 dark:bg-brand-charcoal/60 border border-brand-teal/10 p-6 text-center">
            <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
              {error || 'Profile unavailable offline'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-sand dark:bg-dark-bg px-4 pt-6 pb-24">
      <div className="max-w-lg mx-auto space-y-4">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1 text-sm text-brand-teal hover:underline"
        >
          ← Back to Feed
        </Link>

        <ProfileHeader
          profile={profile}
          isOwnProfile={false}
          isFollowing={following}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
        />

        <ProfileTabs userId={userId} isOwnProfile={false} />
      </div>
    </main>
  );
}
