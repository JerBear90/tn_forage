'use client';

/**
 * ForageWise — FindsTimeline Component
 *
 * Instagram-style grid showing the user's posts from PocketBase community_posts.
 * Each card shows a photo (or placeholder), species name, and date.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { pb } from '@/auth/authService';

interface FindEntry {
  id: string;
  speciesName: string;
  date: string;
  photoUrl: string | null;
  isIdRequest: boolean;
}

export default function FindsTimeline({ userId }: { userId: string }) {
  const [finds, setFinds] = useState<FindEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFinds() {
      try {
        // Load user's posts from PocketBase
        const effectiveUserId = pb.authStore.record?.id || userId;
        const result = await pb.collection('community_posts').getList(1, 30, {
          filter: `userId = "${effectiveUserId}"`,
          sort: '-created',
        });

        if (cancelled) return;

        const entries: FindEntry[] = result.items.map((record) => {
          const photos = record.photos as string[] | string | undefined;
          let photoUrl: string | null = null;
          if (photos) {
            const files = Array.isArray(photos) ? photos : [photos];
            if (files[0]) {
              photoUrl = `${pb.baseURL}/api/files/community_posts/${record.id}/${files[0]}`;
            }
          }

          return {
            id: record.id,
            speciesName: (record.speciesGuess as string) || (record.notes as string)?.slice(0, 30) || 'Post',
            date: record.created as string,
            photoUrl,
            isIdRequest: ((record.speciesGuess as string) || '').startsWith('[ID Request]'),
          };
        });

        setFinds(entries);
      } catch {
        // PocketBase may not be available
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFinds();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-square rounded-lg bg-brand-charcoal/10 dark:bg-brand-sand/10 animate-pulse" />
        ))}
      </div>
    );
  }

  if (finds.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="text-3xl mb-2 block" aria-hidden="true">🍄</span>
        <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">
          No posts yet. Share your discoveries with the community!
        </p>
        <Link
          href="/community#feed"
          className="inline-block mt-3 text-xs font-medium text-brand-teal hover:underline"
        >
          Go to Community →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1" role="list" aria-label="Your posts">
        {finds.map((find) => (
          <Link
            key={find.id}
            href="/community#feed"
            role="listitem"
            className="relative aspect-square rounded-lg overflow-hidden bg-brand-charcoal/5 dark:bg-brand-charcoal/20 group hover:ring-2 hover:ring-brand-teal/40 transition-shadow"
          >
            {find.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={find.photoUrl}
                alt={find.speciesName}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-teal/10 to-brand-moss/10">
                <span className="text-2xl" aria-hidden="true">
                  {find.isIdRequest ? '🔍' : '🍄'}
                </span>
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 pt-4">
              <p className="text-[9px] font-medium text-white leading-tight truncate">
                {find.isIdRequest ? find.speciesName.replace('[ID Request] ', '') : find.speciesName}
              </p>
              {find.date && (
                <p className="text-[8px] text-white/70">
                  {new Date(find.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>

            {/* Badge */}
            {find.isIdRequest && (
              <div className="absolute top-1 left-1">
                <span className="inline-block rounded px-1 py-0.5 text-[7px] font-bold bg-amber-500 text-white">ID</span>
              </div>
            )}
          </Link>
        ))}
      </div>

      <div className="text-center pt-1">
        <Link href="/community#feed" className="text-xs font-medium text-brand-teal hover:underline">
          View all in Feed →
        </Link>
      </div>
    </div>
  );
}
