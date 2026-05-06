"use client";

/**
 * ForageWise — Profile Header Component
 *
 * Displays user avatar, display name, bio, follower/following counts,
 * and a follow/unfollow button when viewing another user's profile.
 *
 * Requirements: 13.1, 13.2, 13.5, 1.1, 1.2, 1.6
 */

import { useState } from "react";
import Link from "next/link";
import type { UserProfileExtended } from "@/types";
import { pb } from "@/auth/authService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Constructs the full PocketBase file URL for a user's avatar.
 * PocketBase stores files at: {baseURL}/api/files/{collectionId}/{recordId}/{filename}
 */
function getAvatarUrl(userId: string, avatarFilename: string | undefined): string | null {
  if (!avatarFilename) return null;
  // If it's already a full URL, use as-is
  if (avatarFilename.startsWith('http://') || avatarFilename.startsWith('https://') || avatarFilename.startsWith('/')) {
    return avatarFilename;
  }
  // Construct PocketBase file URL
  return `${pb.baseURL}/api/files/_pb_users_auth_/${userId}/${avatarFilename}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProfileHeaderProps {
  profile: UserProfileExtended;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowing,
  onFollow,
  onUnfollow,
}: ProfileHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = getAvatarUrl(profile.id, profile.avatar);
  const initials = profile.displayName
    ? profile.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="rounded-xl bg-white/80 dark:bg-brand-charcoal/60 border border-brand-teal/10 p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-teal/20 bg-brand-teal/10 flex items-center justify-center">
            {avatarUrl && !imgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`${profile.displayName}'s avatar`}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-lg font-bold text-brand-teal/60" aria-hidden="true">
                {initials}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="font-heading font-semibold text-lg text-brand-charcoal dark:text-brand-sand truncate">
            {profile.displayName}
          </h2>

          {profile.bio && (
            <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-0.5 line-clamp-2">
              {profile.bio}
            </p>
          )}

          {/* Follower / Following / Trips counts */}
          <div className="flex items-center gap-4 mt-2">
            <Link
              href="/profile/follows?tab=followers"
              className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 hover:text-brand-teal transition-colors"
            >
              <span className="font-semibold">{profile.followerCount ?? 0}</span>{" "}
              <span className="text-brand-charcoal/60 dark:text-brand-sand/60">
                {profile.followerCount === 1 ? "follower" : "followers"}
              </span>
            </Link>
            <Link
              href="/profile/follows?tab=following"
              className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 hover:text-brand-teal transition-colors"
            >
              <span className="font-semibold">{profile.followingCount ?? 0}</span>{" "}
              <span className="text-brand-charcoal/60 dark:text-brand-sand/60">
                following
              </span>
            </Link>
            <Link
              href="/trips"
              className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 hover:text-brand-teal transition-colors"
            >
              <span className="font-semibold">{profile.completedTripCount ?? 0}</span>{" "}
              <span className="text-brand-charcoal/60 dark:text-brand-sand/60">
                {profile.completedTripCount === 1 ? "trip" : "trips"}
              </span>
            </Link>
          </div>
          <p className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40 mt-1">
            Tap to view your followers or following
          </p>
        </div>
      </div>

      {/* Follow / Unfollow button — only shown on other users' profiles */}
      {!isOwnProfile && (
        <div className="mt-4">
          {isFollowing ? (
            <button
              type="button"
              onClick={onUnfollow}
              aria-label={`Unfollow ${profile.displayName}`}
              className="w-full rounded-lg border border-brand-teal/30 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm font-medium text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px]"
            >
              Following
            </button>
          ) : (
            <button
              type="button"
              onClick={onFollow}
              aria-label={`Follow ${profile.displayName}`}
              className="w-full rounded-lg bg-brand-teal text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px]"
            >
              Follow
            </button>
          )}
        </div>
      )}
    </div>
  );
}
