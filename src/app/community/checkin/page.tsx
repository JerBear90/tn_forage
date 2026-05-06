'use client';

/**
 * ForageWise — Park Check-In Page
 *
 * Allows users to check in at a park from the map and optionally
 * share it publicly on the community feed.
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { putRecord } from '@/offline/db';
import { useAuth } from '@/auth/useAuth';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function CheckInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const parkId = searchParams.get('parkId') || '';
  const parkName = searchParams.get('parkName') || 'Unknown Park';

  const [notes, setNotes] = useState('');
  const [sharePublicly, setSharePublicly] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(`/community/checkin?parkId=${parkId}&parkName=${encodeURIComponent(parkName)}`)}`);
    }
  }, [isAuthenticated, router, parkId, parkName]);

  async function handleCheckIn() {
    setSaving(true);
    const now = new Date().toISOString();

    // Create a community draft as a check-in post
    await putRecord('communityDrafts', {
      id: generateId(),
      userId: 'local-user',
      speciesGuess: parkName,
      photos: [],
      notes: `[Check-in] Checked in at ${parkName}${notes ? '. ' + notes.trim() : ''}`,
      visibility: sharePublicly ? 'public' : 'private',
      createdAt: now,
      updatedAt: now,
    });

    setSaved(true);
    setSaving(false);
  }

  if (!isAuthenticated) {
    return null;
  }

  if (saved) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-6 max-w-lg mx-auto">
        <div className="w-full rounded-2xl bg-white dark:bg-brand-charcoal/60 border border-brand-teal/20 shadow-lg p-6 text-center">
          <span className="text-4xl block mb-3" aria-hidden="true">📍</span>
          <h1 className="text-xl font-bold text-brand-forest dark:text-brand-moss font-heading mb-2">
            Checked In!
          </h1>
          <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">
            You checked in at <strong>{parkName}</strong>
          </p>
          {sharePublicly && (
            <p className="text-xs text-brand-teal mb-4">
              Your check-in is visible on the community feed.
            </p>
          )}
          <div className="space-y-2 mt-4">
            <Link
              href="/community#feed"
              className="w-full min-h-[44px] rounded-lg bg-brand-teal px-4 py-3 text-sm font-semibold text-white hover:bg-brand-teal/90 transition-colors flex items-center justify-center"
            >
              View Feed
            </Link>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 dark:border-brand-sand/20 px-4 py-3 text-sm font-medium text-brand-charcoal dark:text-brand-sand hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Back to Map
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
      <header className="mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal mb-2 inline-block"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Check In
        </h1>
      </header>

      <div className="rounded-xl border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 p-5 space-y-5">
        {/* Park info */}
        <div className="flex items-center gap-3 rounded-lg bg-brand-moss/10 dark:bg-brand-moss/20 p-3">
          <span className="text-2xl" aria-hidden="true">🏞️</span>
          <div>
            <h2 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand">
              {parkName}
            </h2>
            <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="checkin-notes"
            className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Add a note <span className="text-brand-charcoal/50 dark:text-brand-sand/50 font-normal">(optional)</span>
          </label>
          <textarea
            id="checkin-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What are you looking for today? How are the conditions?"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
          />
        </div>

        {/* Share publicly toggle */}
        <div className="flex items-center justify-between rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">
              Share on Feed
            </p>
            <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50">
              Let others see you&apos;re here
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={sharePublicly}
            onClick={() => setSharePublicly(!sharePublicly)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors min-w-[48px] ${
              sharePublicly ? 'bg-brand-teal' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            aria-label="Share check-in publicly"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                sharePublicly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Check In button */}
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={saving}
          className="w-full min-h-[48px] rounded-lg bg-brand-moss text-white font-semibold text-sm py-3 hover:bg-brand-moss/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-moss transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            'Checking in...'
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              Check In
            </>
          )}
        </button>
      </div>
    </main>
  );
}
