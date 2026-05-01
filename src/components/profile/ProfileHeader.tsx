"use client";

/**
 * ForageFlow — Profile Header Component
 *
 * Displays user avatar, display name, bio, follower/following counts,
 * and a follow/unfollow button when viewing another user's profile.
 *
 * Requirements: 13.1, 13.2, 13.5, 1.1, 1.2, 1.6
 */

import type { UserProfileExtended } from "@/types";

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
  return (
    <div className="rounded-xl bg-white/80 dark:bg-brand-charcoal/60 border border-brand-teal/10 p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-teal/20 bg-brand-teal/10 flex items-center justify-center">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar}
                alt={`${profile.displayName}'s avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                aria-hidden="true"
                className="w-8 h-8 text-brand-teal/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
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

          {/* Follower / Following counts */}
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80">
              <span className="font-semibold">{profile.followerCount ?? 0}</span>{" "}
              <span className="text-brand-charcoal/60 dark:text-brand-sand/60">
                {profile.followerCount === 1 ? "follower" : "followers"}
              </span>
            </span>
            <span className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80">
              <span className="font-semibold">{profile.followingCount ?? 0}</span>{" "}
              <span className="text-brand-charcoal/60 dark:text-brand-sand/60">
                following
              </span>
            </span>
          </div>
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
