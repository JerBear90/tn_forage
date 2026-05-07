'use client';

/**
 * ForageWise — Community Page
 *
 * Displays community posts from PocketBase,
 * plus sub-tab navigation for Feed, ID This, Challenges, and Blog sections.
 *
 * - Hash-based sub-tab routing: /community#feed, /community#challenges, /community#blog
 * - Location fuzzing for public posts (task 14.5)
 * - Flagging with reason options (task 14.3)
 * - Comment/suggest ID placeholders (task 14.2)
 * - TrendingSpeciesSection, photo preview, pull-to-refresh (task 12.6)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/auth/useAuth';
import { pb } from '@/auth/authService';
import OnlineHint from '@/components/OnlineHint';
import IdRequest from '@/components/community/IdRequest';
import { getAllRecords, putRecord } from '@/offline/db';
import { applyLocationPrivacy } from '@/services/locationPrivacy';
import ChallengesSection from '@/components/ChallengesSection';
import CommunityFeed from '@/components/community/CommunityFeed';
import type {
  CommunityDraft,
  CommunityFlag,
  CommunitySubSection,
  BlogArticle,
  FlagReason,
  Coordinates,
} from '@/types';
import { useGeolocation } from '@/hooks/useGeolocation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Resolve avatar to a full URL (handles PocketBase filenames and OAuth URLs) */
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

/** Compress an image file to fit within maxSize using canvas */
async function compressImage(file: File, quality: number, maxDimension: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Compression failed')); return; }
        resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', quality);
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Flag reason labels
// ---------------------------------------------------------------------------

const FLAG_REASONS: { value: FlagReason; label: string }[] = [
  { value: 'unsafe-content', label: 'Unsafe content' },
  { value: 'incorrect-id', label: 'Incorrect ID' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
];

// ---------------------------------------------------------------------------
// New Sighting Form
// ---------------------------------------------------------------------------

interface NewSightingFormProps {
  onSave: (draft: CommunityDraft) => void;
  onCancel: () => void;
}

function NewSightingForm({ onSave, onCancel }: NewSightingFormProps) {
  const { user } = useAuth();
  const [speciesGuess, setSpeciesGuess] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>('manual');
  const geo = useGeolocation();

  // Photo handling — stores photo IDs, names, files, and preview URLs
  const [photoFiles, setPhotoFiles] = useState<{ id: string; name: string; file?: File; previewUrl?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      photoFiles.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const newPhotos = Array.from(files).map((f) => ({
      id: generateId(),
      name: f.name,
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setPhotoFiles((prev) => [...prev, ...newPhotos]);
  }, []);

  const handleRemovePhoto = useCallback((photoId: string) => {
    setPhotoFiles((prev) => {
      const removed = prev.find((p) => p.id === photoId);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((p) => p.id !== photoId);
    });
  }, []);

  async function handleSubmit() {
    // Require internet to post
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert('You need internet to post. Please connect and try again.');
      return;
    }

    // Check PocketBase auth — try to refresh if expired
    if (!pb.authStore.isValid) {
      // Attempt to refresh the session
      try {
        await pb.collection('users').authRefresh();
      } catch {
        alert('Your session has expired. Please sign in again to post.');
        return;
      }
    }

    setSaving(true);
    const now = new Date().toISOString();

    const rawCoords: Coordinates | undefined =
      locationMode === 'gps' && geo.position
        ? { lat: geo.position.lat, lng: geo.position.lng }
        : undefined;

    // Apply location privacy — fuzz for public posts
    const coords = applyLocationPrivacy(rawCoords, 'public');

    // Collect photo files for upload (compress if too large for mobile)
    const photoFilesForUpload: File[] = [];
    for (const photo of photoFiles) {
      if (photo.file) {
        // If file is over 4MB, skip it (PocketBase limit is 5MB)
        if (photo.file.size > 4 * 1024 * 1024) {
          // Try to compress by re-encoding as JPEG via canvas
          try {
            const compressed = await compressImage(photo.file, 0.7, 1600);
            photoFilesForUpload.push(compressed);
          } catch {
            // Skip files that can't be compressed
            console.warn('[NewSightingForm] Skipping large photo:', photo.name);
          }
        } else {
          photoFilesForUpload.push(photo.file);
        }
      }
    }

    // Post directly to PocketBase (with 15s timeout)
    try {
      const { createCommunityPost } = await import('@/services/communityPostService');
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 15000)
      );
      const result = await Promise.race([
        createCommunityPost({
          userId: pb.authStore.record?.id || user?.id || 'local-user',
          displayName: user?.displayName || pb.authStore.record?.name || undefined,
          avatarUrl: resolveAvatarUrl(user?.id || pb.authStore.record?.id, user?.avatar || pb.authStore.record?.avatar as string),
          speciesGuess: speciesGuess.trim() || undefined,
          notes: notes.trim() || undefined,
          coordinates: coords,
          photoFiles: photoFilesForUpload,
        }),
        timeoutPromise,
      ]);
      if (!result) {
        alert('Failed to post. You may need to sign in again.');
        setSaving(false);
        return;
      }
    } catch (err) {
      console.error('[NewSightingForm] PocketBase post failed:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to post: ${msg}`);
      setSaving(false);
      return;
    }

    // Build a minimal draft object for the onSave callback (triggers feed reload)
    const draft: CommunityDraft = {
      id: generateId(),
      userId: user?.id || 'local-user',
      displayName: user?.displayName || undefined,
      avatarUrl: resolveAvatarUrl(user?.id, user?.avatar),
      speciesGuess: speciesGuess.trim() || undefined,
      photos: [],
      coordinates: coords,
      notes: notes.trim(),
      visibility: 'public',
      createdAt: now,
      updatedAt: now,
    };

    onSave(draft);
    setSaving(false);
  }

  return (
    <section
      aria-label="New sighting form"
      className="rounded-xl border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 p-5 mb-6"
    >
      <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-4">
        New Sighting
      </h2>

      <div className="space-y-4">
        {/* Species Guess */}
        <div>
          <label
            htmlFor="sighting-species"
            className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Species Guess
          </label>
          <input
            id="sighting-species"
            type="text"
            value={speciesGuess}
            onChange={(e) => setSpeciesGuess(e.target.value)}
            placeholder="What do you think it is?"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        {/* Photos */}
        <div>
          <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
            Photos
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            aria-label="Upload sighting photos"
            onChange={(e) => {
              handleFileSelect(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-teal/30 bg-brand-teal/5 py-3 text-brand-teal hover:bg-brand-teal/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[48px]"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
            <span className="text-sm font-medium">Add Photos</span>
          </button>

          {/* Photo preview thumbnails (Req 9.1) */}
          {photoFiles.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
                {photoFiles.length} photo{photoFiles.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Selected photo previews">
                {photoFiles.map((photo) => (
                  <div key={photo.id} className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-brand-teal/20 bg-brand-sand/30 dark:bg-brand-charcoal/40">
                    {photo.previewUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={photo.previewUrl}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <span className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40 text-center px-1 truncate">
                          {photo.name}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-teal"
                      aria-label={`Remove photo ${photo.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
            Location
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setLocationMode('gps');
                geo.requestLocation();
              }}
              disabled={geo.loading}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                locationMode === 'gps'
                  ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                  : 'border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/5'
              }`}
            >
              {geo.loading ? '⏳ Getting…' : '📍 GPS Location'}
            </button>
            <button
              type="button"
              onClick={() => setLocationMode('manual')}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                locationMode === 'manual'
                  ? 'border-brand-teal bg-brand-teal/10 text-brand-teal'
                  : 'border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/5'
              }`}
            >
              ✏️ Skip Location
            </button>
          </div>
          {locationMode === 'gps' && geo.position && (
            <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mt-1">
              📍 {geo.position.lat.toFixed(5)}, {geo.position.lng.toFixed(5)}
              {geo.isCached && ' (cached)'}
            </p>
          )}
          {locationMode === 'gps' && geo.error && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              {geo.error}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="sighting-notes"
            className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Notes
          </label>
          <textarea
            id="sighting-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what you found, habitat, nearby trees…"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 text-brand-charcoal/70 dark:text-brand-sand/70 font-medium text-sm py-2.5 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-lg bg-brand-teal text-white font-semibold text-sm py-2.5 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
          >
            {saving ? 'Saving…' : 'Save Sighting'}
          </button>
        </div>
      </div>
    </section>
  );
}


// ---------------------------------------------------------------------------
// Flag Dialog
// ---------------------------------------------------------------------------

interface FlagDialogProps {
  sightingId: string;
  onClose: () => void;
  onSubmit: (flag: CommunityFlag) => void;
}

function FlagDialog({ sightingId, onClose, onSubmit }: FlagDialogProps) {
  const [reason, setReason] = useState<FlagReason | ''>('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleFlag() {
    if (!reason) return;
    setSubmitting(true);

    const flag: CommunityFlag = {
      id: generateId(),
      targetId: sightingId,
      userId: 'local-user',
      reason,
      details: details.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await putRecord('communityFlags', flag);
    onSubmit(flag);
    setSubmitting(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-label="Report sighting"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-brand-charcoal border border-brand-teal/20 p-5 shadow-lg">
        <h3 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-3">
          Report Sighting
        </h3>

        <fieldset>
          <legend className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
            Reason
          </legend>
          <div className="space-y-2">
            {FLAG_REASONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors min-h-[44px] ${
                  reason === opt.value
                    ? 'border-brand-teal bg-brand-teal/10'
                    : 'border-brand-teal/15 bg-white/60 dark:bg-brand-charcoal/40 hover:bg-brand-teal/5'
                }`}
              >
                <input
                  type="radio"
                  name="flag-reason"
                  value={opt.value}
                  checked={reason === opt.value}
                  onChange={() => setReason(opt.value)}
                  className="accent-brand-teal w-4 h-4"
                />
                <span className="text-sm text-brand-charcoal dark:text-brand-sand">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {reason === 'other' && (
          <div className="mt-3">
            <label htmlFor="flag-details" className="sr-only">
              Additional details
            </label>
            <textarea
              id="flag-details"
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please describe the issue…"
              className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-3 py-2 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
            />
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 text-brand-charcoal/70 dark:text-brand-sand/70 font-medium text-sm py-2.5 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFlag}
            disabled={!reason || submitting}
            className="flex-1 rounded-lg bg-red-600 text-white font-semibold text-sm py-2.5 hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
          >
            {submitting ? 'Reporting…' : 'Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-Tab Navigation Helpers
// ---------------------------------------------------------------------------

const VALID_SECTIONS: CommunitySubSection[] = ['feed', 'id-this', 'challenges', 'blog'];

function parseHashSection(hash: string): CommunitySubSection {
  const cleaned = hash.replace('#', '').toLowerCase();
  // Support legacy 'sightings' hash
  if (cleaned === 'sightings') return 'feed';
  if (VALID_SECTIONS.includes(cleaned as CommunitySubSection)) {
    return cleaned as CommunitySubSection;
  }
  return 'feed';
}

// ---------------------------------------------------------------------------
// Blog Sub-Section
// ---------------------------------------------------------------------------

function BlogSubSection() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadArticles() {
      try {
        const all = await getAllRecords('blogArticles');
        const sorted = (all as BlogArticle[]).sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
        );
        setArticles(sorted);
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }
    loadArticles();
  }, []);

  if (isLoading) {
    return (
      <section aria-label="Blog articles">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss mb-4">
          Blog
        </h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-brand-charcoal/5 dark:bg-brand-sand/5" />
          ))}
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return (
      <section aria-label="Blog articles">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss mb-4">
          Blog
        </h2>
        <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50 text-center py-8">
          No articles available yet.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Blog articles">
      <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss mb-4">
        Blog
      </h2>
      <div className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/blog/${article.id}`}
            className="block rounded-xl border border-brand-teal/15 bg-white/80 dark:bg-brand-charcoal/60 p-4 hover:bg-brand-teal/5 dark:hover:bg-brand-teal/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-1">
              {article.title}
            </h3>
            <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mb-2">
              {article.author} · {new Date(article.publishedAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 line-clamp-2">
              {article.summary}
            </p>
            {article.tags.length > 0 && (
              <div className="flex gap-1 mt-2">
                {article.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand-teal/10 px-2 py-0.5 text-[10px] text-brand-teal"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-Tab Navigation Bar
// ---------------------------------------------------------------------------

interface SubTabNavProps {
  activeSection: CommunitySubSection;
  onSectionChange: (section: CommunitySubSection) => void;
}

function SubTabNav({ activeSection, onSectionChange }: SubTabNavProps) {
  const tabs: { key: CommunitySubSection; label: string }[] = [
    { key: 'feed', label: 'Feed' },
    { key: 'id-this', label: 'ID This' },
    { key: 'challenges', label: 'Challenges' },
    { key: 'blog', label: 'Blog' },
  ];

  return (
    <nav aria-label="Community sub-sections" className="mb-4">
      <div className="flex gap-1 rounded-lg bg-brand-charcoal/5 dark:bg-brand-sand/5 p-0.5">
        {tabs.map((tab) => {
          const isActive = activeSection === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSectionChange(tab.key)}
              aria-label={`View ${tab.label} section`}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 rounded-md text-xs font-medium py-2 min-h-[36px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                isActive
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/10 hover:text-brand-teal'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Main Community Page
// ---------------------------------------------------------------------------

function CommunityContent() {
  const { isAuthenticated } = useAuth();
  const [showNewForm, setShowNewForm] = useState(false);
  const [flagTarget, setFlagTarget] = useState<string | null>(null);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  // Sub-tab navigation state
  const [activeSection, setActiveSection] = useState<CommunitySubSection>(() => {
    if (typeof window !== 'undefined') {
      return parseHashSection(window.location.hash);
    }
    return 'feed';
  });

  // Listen for hash changes (browser back/forward, direct link)
  useEffect(() => {
    function handleHashChange() {
      setActiveSection(parseHashSection(window.location.hash));
    }
    window.addEventListener('hashchange', handleHashChange);
    // Also read hash on mount in case SSR initial state differs
    setActiveSection(parseHashSection(window.location.hash));
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSectionChange = useCallback((section: CommunitySubSection) => {
    setActiveSection(section);
    window.location.hash = section;
  }, []);

  // Key to force CommunityFeed to reload
  const [feedKey, setFeedKey] = useState(0);

  // Trigger feed reload
  const loadData = useCallback(async () => {
    setFeedKey((k) => k + 1);
  }, []);

  // Pull-to-refresh disabled — feed reloads on navigation and after posting
  // Users can tap the feed tab again to refresh

  const handleSave = useCallback((_draft: CommunityDraft) => {
    setShowNewForm(false);
    // Reload feed from PocketBase to show the new post
    loadData();
  }, [loadData]);

  const handleFlag = useCallback((flag: CommunityFlag) => {
    setFlaggedIds((prev) => new Set(prev).add(flag.targetId));
    setFlagTarget(null);
  }, []);

  return (
    <main
      className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28 overflow-y-auto"
    >
      <header className="mb-6">
        <Link
          href="/"
          className="text-sm text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal mb-2 inline-block"
        >
          ← Home
        </Link>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Community
        </h1>
        <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mt-1">
          Community sightings are user-submitted and not verified by experts. Always verify with a qualified expert.
        </p>
      </header>

      <OnlineHint message="Go online to see the latest community sightings, post observations, and sync your data." />

      {/* Sub-tab navigation */}
      <SubTabNav activeSection={activeSection} onSectionChange={handleSectionChange} />

      {/* Sightings sub-section */}
      {activeSection === 'feed' && (
        <>
          {showNewForm ? (
            <NewSightingForm
              onSave={handleSave}
              onCancel={() => setShowNewForm(false)}
            />
          ) : (
            <CommunityFeed
              key={feedKey}
              onAddPost={isAuthenticated ? () => setShowNewForm(true) : undefined}
            />
          )}
        </>
      )}

      {/* ID This sub-section */}
      {activeSection === 'id-this' && (
        <section className="space-y-4">
          <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
            Upload a photo and ask the community to help identify what you found.
          </p>
          {isAuthenticated ? (
            <IdRequest />
          ) : (
            <div className="rounded-lg border border-brand-teal/20 bg-brand-teal/5 px-4 py-3 text-center">
              <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70">
                <Link href="/login" className="font-medium text-brand-teal hover:underline">Sign in</Link> to submit an ID request.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Challenges sub-section */}
      {activeSection === 'challenges' && (
        <ChallengesSection />
      )}

      {/* Blog sub-section */}
      {activeSection === 'blog' && (
        <BlogSubSection />
      )}

      {/* Flag dialog */}
      {flagTarget && (
        <FlagDialog
          sightingId={flagTarget}
          onClose={() => setFlagTarget(null)}
          onSubmit={handleFlag}
        />
      )}

    </main>
  );
}

export default function CommunityPage() {
  return <CommunityContent />;
}
