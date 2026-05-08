'use client';

/**
 * ForageWise — User Profile Posts Page
 *
 * Displays all community posts by a specific user.
 * Shows their avatar, display name, and a vertical list of post cards
 * sorted newest first.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { pb } from '@/auth/authService';
import { resolveAvatar } from '@/utils/avatarResolver';
import type { AvatarResolution } from '@/utils/avatarResolver';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserPost {
  id: string;
  speciesGuess?: string;
  notes?: string;
  photos: string[];
  created: string;
}

// ---------------------------------------------------------------------------
// Loading Fallback
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-brand-sand/30 dark:bg-brand-charcoal p-4">
      <div className="animate-pulse space-y-4 max-w-lg mx-auto">
        <div className="h-10 w-10 rounded-full bg-brand-charcoal/10 dark:bg-brand-sand/10" />
        <div className="h-20 w-20 rounded-full bg-brand-charcoal/10 dark:bg-brand-sand/10 mx-auto" />
        <div className="h-5 w-32 rounded bg-brand-charcoal/10 dark:bg-brand-sand/10 mx-auto" />
        <div className="h-32 rounded-xl bg-brand-charcoal/10 dark:bg-brand-sand/10" />
        <div className="h-32 rounded-xl bg-brand-charcoal/10 dark:bg-brand-sand/10" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User Profile Client Component
// ---------------------------------------------------------------------------

function UserProfileContent() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [avatar, setAvatar] = useState<AvatarResolution | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        // Resolve avatar and display name
        const avatarData = await resolveAvatar(userId);
        setAvatar(avatarData);

        // Fetch posts filtered by userId, sorted newest first
        const result = await pb.collection('community_posts').getList(1, 50, {
          filter: `userId = "${userId}"`,
          sort: '-created',
        });

        const userPosts: UserPost[] = result.items.map((record) => {
          // Build photo URLs the same way as communityPostService.ts
          const photoFiles = record.photos as string[] | string | undefined;
          let photoUrls: string[] = [];
          if (photoFiles) {
            const files = Array.isArray(photoFiles) ? photoFiles : [photoFiles];
            photoUrls = files
              .filter((f) => f)
              .map(
                (filename) =>
                  `${pb.baseURL}/api/files/community_posts/${record.id}/${filename}`
              );
          }

          return {
            id: record.id,
            speciesGuess: (record.speciesGuess as string) || undefined,
            notes: (record.notes as string) || undefined,
            photos: photoUrls,
            created: record.created as string,
          };
        });

        setPosts(userPosts);
      } catch (err) {
        console.error('[UserProfile] Failed to load profile:', err);
        setError('Unable to load user profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [userId]);

  // Format date helper
  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-sand/30 dark:bg-brand-charcoal p-4">
        <div className="max-w-lg mx-auto text-center py-12">
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back to previous page"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-teal/90 transition-colors min-h-[44px] min-w-[44px]"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-sand/30 dark:bg-brand-charcoal p-4">
      <div className="max-w-lg mx-auto">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back to previous page"
          className="mb-4 inline-flex items-center gap-2 rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-3 py-2.5 text-sm font-medium text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal/5 transition-colors min-h-[44px] min-w-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back
        </button>

        {/* User Header */}
        <div className="flex flex-col items-center mb-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-teal/30 bg-brand-sand/50 dark:bg-brand-charcoal/50 mb-3">
            {avatar?.url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatar.url}
                alt={`${avatar.displayName}'s avatar`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Hide broken image, show fallback
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  aria-hidden="true"
                  className="w-10 h-10 text-brand-charcoal/30 dark:text-brand-sand/30"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            )}
          </div>

          {/* Display Name */}
          <h1 className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand">
            {avatar?.displayName || 'Unknown User'}
          </h1>
          <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mt-1">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </p>
        </div>

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <svg
              aria-hidden="true"
              className="w-12 h-12 mx-auto text-brand-charcoal/20 dark:text-brand-sand/20 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
            <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50">
              No posts yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-xl border border-brand-teal/15 bg-white/80 dark:bg-brand-charcoal/60 overflow-hidden"
              >
                {/* Post Photo */}
                {post.photos.length > 0 && (
                  <div className="aspect-[4/3] bg-brand-sand/30 dark:bg-brand-charcoal/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.photos[0]}
                      alt={post.speciesGuess || 'Community post photo'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Post Content */}
                <div className="p-4">
                  {post.speciesGuess && (
                    <h3 className="text-sm font-semibold text-brand-forest dark:text-brand-moss mb-1">
                      {post.speciesGuess}
                    </h3>
                  )}
                  {post.notes && (
                    <p className="text-sm text-brand-charcoal/80 dark:text-brand-sand/80 line-clamp-3 mb-2">
                      {post.notes}
                    </p>
                  )}
                  <time
                    dateTime={post.created}
                    className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50"
                  >
                    {formatDate(post.created)}
                  </time>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Export (Server Component Wrapper with Suspense)
// ---------------------------------------------------------------------------

export default function UserProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <UserProfileContent />
    </Suspense>
  );
}
