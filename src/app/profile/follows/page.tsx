'use client';

/**
 * ForageWise — Followers/Following List Page
 *
 * Shows who you follow and who follows you, with follow-back buttons.
 */

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDB } from '@/offline/db';
import type { FollowLocal } from '@/types';

export default function FollowsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-teal border-t-transparent" /></div>}>
      <FollowsContent />
    </Suspense>
  );
}

interface FollowEntry {
  id: string;
  userId: string;
  displayName: string;
}

function FollowsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') === 'followers' ? 'followers' : 'following';

  const [activeTab, setActiveTab] = useState<'following' | 'followers'>(tab);
  const [following, setFollowing] = useState<FollowEntry[]>([]);
  const [followers, setFollowers] = useState<FollowEntry[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load follows from both IndexedDB and localStorage
  useEffect(() => {
    async function loadFollows() {
      const followingList: FollowEntry[] = [];
      const followerList: FollowEntry[] = [];
      const followingIdSet = new Set<string>();

      try {
        // Load from IndexedDB
        const db = await getDB();
        const allFollows = await db.getAll('follows') as FollowLocal[];

        // Get current user ID
        let currentUserId = 'local-user';
        try {
          const { pb } = await import('@/auth/authService');
          if (pb.authStore.record?.id) currentUserId = pb.authStore.record.id;
        } catch { /* ignore */ }

        // Following: where I am the follower
        for (const f of allFollows) {
          if (f.followerId === currentUserId) {
            followingList.push({
              id: f.id,
              userId: f.followedId,
              displayName: `Forager ${f.followedId.slice(0, 8)}`,
            });
            followingIdSet.add(f.followedId);
          }
        }

        // Followers: where I am the followed
        for (const f of allFollows) {
          if (f.followedId === currentUserId) {
            followerList.push({
              id: f.id,
              userId: f.followerId,
              displayName: `Forager ${f.followerId.slice(0, 8)}`,
            });
          }
        }
      } catch { /* IndexedDB may not be available */ }

      // Also check localStorage for feed follows (these are people I follow)
      try {
        const raw = localStorage.getItem('foragewise_feed_follows');
        if (raw) {
          const lsFollows: string[] = JSON.parse(raw);
          for (const userId of lsFollows) {
            if (!followingIdSet.has(userId)) {
              followingList.push({
                id: `ls-${userId}`,
                userId,
                displayName: `Forager ${userId.slice(0, 8)}`,
              });
              followingIdSet.add(userId);
            }
          }
        }
      } catch { /* ignore */ }

      // Resolve real names from PocketBase community_posts
      try {
        const { pb } = await import('@/auth/authService');
        const allUserIds = [...new Set([...followingList.map(f => f.userId), ...followerList.map(f => f.userId)])];
        for (const uid of allUserIds.slice(0, 20)) {
          try {
            const result = await pb.collection('community_posts').getList(1, 1, { filter: `userId = "${uid}"` });
            if (result.items.length > 0) {
              const name = (result.items[0].userName as string) || undefined;
              if (name) {
                followingList.forEach(f => { if (f.userId === uid) f.displayName = name; });
                followerList.forEach(f => { if (f.userId === uid) f.displayName = name; });
              }
            }
          } catch { /* skip individual lookup */ }
        }
      } catch { /* skip name resolution */ }

      setFollowing(followingList);
      setFollowers(followerList);
      setFollowingIds(followingIdSet);
      setLoading(false);
    }

    loadFollows();
  }, []);

  // Follow back a user
  const handleFollowBack = useCallback(async (userId: string) => {
    try {
      const { putRecord } = await import('@/offline/db');
      let currentUserId = 'local-user';
      try {
        const { pb } = await import('@/auth/authService');
        if (pb.authStore.record?.id) currentUserId = pb.authStore.record.id;
      } catch { /* ignore */ }

      const followId = `follow-${currentUserId}-${userId}`;
      await putRecord('follows', {
        id: followId,
        followerId: currentUserId,
        followedId: userId,
        createdAt: new Date().toISOString(),
        syncStatus: 'pending' as const,
      });

      // Also add to localStorage
      try {
        const raw = localStorage.getItem('foragewise_feed_follows');
        const current: string[] = raw ? JSON.parse(raw) : [];
        if (!current.includes(userId)) {
          current.push(userId);
          localStorage.setItem('foragewise_feed_follows', JSON.stringify(current));
        }
      } catch { /* ignore */ }

      setFollowingIds((prev) => new Set(prev).add(userId));
    } catch { /* ignore */ }
  }, []);

  // Unfollow a user
  const handleUnfollow = useCallback(async (userId: string) => {
    try {
      const { getDB: getDatabase } = await import('@/offline/db');
      const db = await getDatabase();
      let currentUserId = 'local-user';
      try {
        const { pb } = await import('@/auth/authService');
        if (pb.authStore.record?.id) currentUserId = pb.authStore.record.id;
      } catch { /* ignore */ }

      const followId = `follow-${currentUserId}-${userId}`;
      await db.delete('follows', followId);

      // Also remove from localStorage
      try {
        const raw = localStorage.getItem('foragewise_feed_follows');
        if (raw) {
          const current: string[] = JSON.parse(raw);
          localStorage.setItem('foragewise_feed_follows', JSON.stringify(current.filter((id) => id !== userId)));
        }
      } catch { /* ignore */ }

      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setFollowing((prev) => prev.filter((f) => f.userId !== userId));
    } catch { /* ignore */ }
  }, []);

  const activeList = activeTab === 'following' ? following : followers;

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
      <header className="mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-brand-teal hover:underline mb-2 inline-block"
        >
          ← Back to Profile
        </button>
        <h1 className="text-xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Connections
        </h1>
      </header>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl bg-brand-charcoal/5 dark:bg-brand-sand/5 p-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('following')}
          className={`flex-1 rounded-lg text-sm font-medium py-3 min-h-[44px] transition-colors ${
            activeTab === 'following'
              ? 'bg-brand-teal text-white shadow-sm'
              : 'text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/10'
          }`}
        >
          Following ({following.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('followers')}
          className={`flex-1 rounded-lg text-sm font-medium py-3 min-h-[44px] transition-colors ${
            activeTab === 'followers'
              ? 'bg-brand-teal text-white shadow-sm'
              : 'text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/10'
          }`}
        >
          Followers ({followers.length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-brand-charcoal/50 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : activeList.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-3xl block mb-3" aria-hidden="true">
            {activeTab === 'following' ? '👥' : '🙋'}
          </span>
          <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
            {activeTab === 'following'
              ? "You're not following anyone yet. Follow people from the community feed!"
              : "No one is following you yet. Share posts to grow your community!"}
          </p>
          <Link
            href="/community#feed"
            className="inline-block mt-4 text-sm font-medium text-brand-teal hover:underline"
          >
            Go to Community Feed →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {activeList.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-brand-charcoal/50 border border-brand-charcoal/10 dark:border-brand-sand/10"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-brand-moss/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-brand-moss" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand truncate">
                    {entry.displayName}
                  </p>
                  <p className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40">
                    {entry.userId.slice(0, 12)}...
                  </p>
                </div>
              </div>

              {/* Follow/Unfollow/Follow Back button */}
              {activeTab === 'following' ? (
                <button
                  type="button"
                  onClick={() => handleUnfollow(entry.userId)}
                  className="rounded-full text-xs px-3 py-1.5 min-h-[36px] bg-brand-charcoal/10 dark:bg-brand-sand/10 text-brand-charcoal dark:text-brand-sand font-medium hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                >
                  Unfollow
                </button>
              ) : followingIds.has(entry.userId) ? (
                <span className="rounded-full text-xs px-3 py-1.5 bg-brand-teal/10 text-brand-teal font-medium">
                  Following
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleFollowBack(entry.userId)}
                  className="rounded-full text-xs px-3 py-1.5 min-h-[36px] bg-brand-teal text-white font-medium hover:bg-brand-teal/90 transition-colors"
                >
                  Follow Back
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
