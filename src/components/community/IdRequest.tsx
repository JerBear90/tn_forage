'use client';

/**
 * ForageWise — IdRequest Component
 *
 * "ID This For Me" feature. Users upload photos and ask the community
 * to help identify a species. Posts to PocketBase community_posts with
 * [ID Request] prefix so it shows with "Needs ID" badge in the feed.
 */

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/auth/useAuth';

export interface IdRequestProps {
  onSubmitted?: () => void;
}

export default function IdRequest({ onSubmitted }: IdRequestProps) {
  const { user, isAuthenticated } = useAuth();
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [question, setQuestion] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newPhotos = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (photos.length === 0) {
      setError('Please add at least one photo of what you found.');
      return;
    }
    if (!question.trim()) {
      setError('Please describe what you need help with.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { createCommunityPost } = await import('@/services/communityPostService');
      const { pb } = await import('@/auth/authService');

      if (!pb.authStore.isValid) {
        try {
          await pb.collection('users').authRefresh();
        } catch {
          setError('Please sign in again to submit.');
          setSubmitting(false);
          return;
        }
      }

      // Compress photos if needed (mobile cameras take large photos)
      const photoFiles: File[] = [];
      for (const photo of photos) {
        if (photo.file.size > 4 * 1024 * 1024) {
          try {
            const compressed = await compressImage(photo.file);
            photoFiles.push(compressed);
          } catch {
            photoFiles.push(photo.file);
          }
        } else {
          photoFiles.push(photo.file);
        }
      }

      const result = await createCommunityPost({
        userId: pb.authStore.record?.id || user?.id || 'local-user',
        displayName: user?.displayName || pb.authStore.record?.name || undefined,
        avatarUrl: (() => {
          const avatar = user?.avatar || pb.authStore.record?.avatar as string | undefined;
          if (!avatar) return undefined;
          if (avatar.startsWith('http')) return avatar;
          const uid = user?.id || pb.authStore.record?.id;
          return uid ? `${pb.baseURL}/api/files/_pb_users_auth_/${uid}/${avatar}` : undefined;
        })(),
        speciesGuess: `[ID Request] ${question.trim()}`,
        notes: question.trim() + (location.trim() ? `\n📍 Found at: ${location.trim()}` : ''),
        photoFiles,
      });

      if (!result) {
        setError('Failed to post. Please check your connection.');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to submit: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }, [photos, question, location, user?.id, user?.displayName, onSubmitted]);

  if (!isAuthenticated) return null;

  if (submitted) {
    return (
      <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-center">
        <span className="text-2xl mb-2 block" aria-hidden="true">✅</span>
        <p className="text-sm font-medium text-green-800 dark:text-green-300">ID request submitted!</p>
        <p className="text-xs text-green-700/70 dark:text-green-400/70 mt-1">Your post is now visible in the feed with a &quot;Needs ID&quot; badge.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-teal/20 bg-white/80 dark:bg-dark-surface/80 p-4">
      <h3 className="font-heading font-semibold text-sm text-brand-charcoal dark:text-dark-text mb-3 flex items-center gap-2">
        <span aria-hidden="true">🔍</span>
        ID This For Me
      </h3>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-3" role="alert">{error}</p>
      )}

      {/* Photo upload — multiple */}
      <div className="mb-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { handlePhotoSelect(e.target.files); e.target.value = ''; }}
        />

        {photos.length > 0 ? (
          <div className="space-y-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((photo, i) => (
                <div key={i} className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-brand-charcoal/10 dark:border-dark-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center text-xs"
                    aria-label={`Remove photo ${i + 1}`}
                  >×</button>
                </div>
              ))}
              {/* Add more button */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="shrink-0 w-24 h-24 rounded-lg border-2 border-dashed border-brand-teal/30 flex items-center justify-center text-brand-teal/50 hover:bg-brand-teal/5"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-brand-charcoal/50 dark:text-brand-sand/50">{photos.length} photo{photos.length !== 1 ? 's' : ''} selected</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full h-32 rounded-lg border-2 border-dashed border-brand-teal/30 bg-brand-teal/5 flex flex-col items-center justify-center gap-2 hover:bg-brand-teal/10 transition-colors"
          >
            <svg className="w-8 h-8 text-brand-teal/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            <span className="text-xs text-brand-teal/70 font-medium">Tap to add photos</span>
          </button>
        )}
      </div>

      {/* Question */}
      <div className="mb-3">
        <label htmlFor="id-question" className="block text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">
          What do you need help with?
        </label>
        <textarea
          id="id-question"
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Found this on a dead oak log. What species could it be?"
          className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-3 py-2 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
        />
      </div>

      {/* Location */}
      <div className="mb-4">
        <label htmlFor="id-location" className="block text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">
          Where did you find it? (optional)
        </label>
        <input
          id="id-location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Fall Creek Falls, near the creek"
          className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-3 py-2 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-lg bg-brand-teal text-white font-semibold text-sm py-2.5 hover:bg-brand-teal/90 transition-colors active:scale-[0.98] disabled:opacity-60 min-h-[44px]"
      >
        {submitting ? 'Submitting…' : 'Ask the Community'}
      </button>

      <p className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40 mt-2 text-center">
        Community IDs are not expert confirmations. Always verify with a qualified expert.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image compression helper
// ---------------------------------------------------------------------------

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const max = 1600;
      if (width > max || height > max) {
        if (width > height) { height = (height / width) * max; width = max; }
        else { width = (width / height) * max; height = max; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Compression failed')); return; }
        resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.7);
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
}
