'use client';

/**
 * ForageWise — Park Check-In Page
 *
 * Allows users to check in at a park from the map and optionally
 * share it publicly on the community feed.
 */

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { pb } from '@/auth/authService';
import { useAuth } from '@/auth/useAuth';

function resolveAvatarUrl(userId: string | undefined, avatar: string | undefined): string | undefined {
  if (!avatar) return undefined;
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('/')) {
    return avatar;
  }
  if (userId) {
    return `${pb.baseURL}/api/files/_pb_users_auth_/${userId}/${avatar}`;
  }
  return undefined;
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-teal border-t-transparent" /></div>}>
      <CheckInContent />
    </Suspense>
  );
}

function CheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  const parkId = searchParams.get('parkId') || '';
  const parkName = searchParams.get('parkName') || 'Unknown Park';

  const [notes, setNotes] = useState('');
  const [sharePublicly, setSharePublicly] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(`/community/checkin?parkId=${parkId}&parkName=${encodeURIComponent(parkName)}`)}`);
    }
  }, [isAuthenticated, router, parkId, parkName]);

  function handlePhotoSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleCheckIn() {
    setSaving(true);

    // Compress photo if needed
    let uploadFile: File | undefined;
    if (photoFile) {
      if (photoFile.size > 4 * 1024 * 1024) {
        try {
          uploadFile = await new Promise<File>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let { width, height } = img;
              const max = 1600;
              if (width > max || height > max) {
                if (width > height) { height = (height / width) * max; width = max; }
                else { width = (width / height) * max; height = max; }
              }
              canvas.width = width; canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) { reject(new Error('No ctx')); return; }
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob((blob) => {
                if (!blob) { reject(new Error('Compress failed')); return; }
                resolve(new File([blob], 'checkin.jpg', { type: 'image/jpeg' }));
              }, 'image/jpeg', 0.7);
            };
            img.onerror = () => reject(new Error('Load failed'));
            img.src = URL.createObjectURL(photoFile);
          });
        } catch {
          uploadFile = photoFile;
        }
      } else {
        uploadFile = photoFile;
      }
    }

    // Post to PocketBase directly (no local save)
    if (sharePublicly) {
      try {
        const { createCommunityPost } = await import('@/services/communityPostService');
        await createCommunityPost({
          userId: pb.authStore.record?.id || user?.id || 'local-user',
          displayName: user?.displayName || pb.authStore.record?.name || undefined,
          avatarUrl: resolveAvatarUrl(user?.id || pb.authStore.record?.id, user?.avatar || pb.authStore.record?.avatar as string),
          speciesGuess: parkName,
          notes: `Checked in at ${parkName}${notes ? '. ' + notes.trim() : ''}`,
          photoFiles: uploadFile ? [uploadFile] : undefined,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        alert(`Failed to check in: ${msg}`);
        setSaving(false);
        return;
      }
    }

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

        {/* Photo */}
        <div>
          <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
            Add a photo <span className="text-brand-charcoal/50 dark:text-brand-sand/50 font-normal">(optional)</span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { handlePhotoSelect(e.target.files); e.target.value = ''; }}
          />
          {photoPreview ? (
            <div className="relative w-full h-40 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Check-in photo" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setPhotoFile(null); if (photoPreview) URL.revokeObjectURL(photoPreview); setPhotoPreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-sm"
                aria-label="Remove photo"
              >✕</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-moss/30 bg-brand-moss/5 py-4 text-brand-moss hover:bg-brand-moss/10 transition-colors min-h-[48px]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              <span className="text-sm font-medium">Add Photo</span>
            </button>
          )}
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
