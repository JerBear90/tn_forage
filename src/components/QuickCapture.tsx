'use client';

/**
 * ForageWise — QuickCapture Component
 *
 * One-tap field capture mode. Optimized for speed in the field:
 * - Single tap to open camera
 * - Auto-captures GPS + timestamp
 * - Optional quick species tag
 * - Saves instantly to IndexedDB
 * - No internet required
 *
 * Designed for: gloves on, rain falling, quick documentation.
 */

import { useState, useRef, useCallback } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { putRecord } from '@/offline/db';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export default function QuickCapture() {
  const geo = useGeolocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [count, setCount] = useState(0);

  const handleCapture = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setSaving(true);

    try {
      // Request location if not already available
      if (!geo.position) geo.requestLocation();

      const file = files[0];
      const id = generateId();

      await putRecord('expeditionLogs', {
        id,
        userId: 'local-user',
        tripId: '',
        photos: [id],
        coordinates: geo.position ?? undefined,
        speciesGuess: '',
        notes: 'Quick capture — identify later',
        visibility: 'private' as const,
        syncStatus: 'pending' as const,
        createdAt: new Date().toISOString(),
      });

      // Store the photo blob
      const blob = new Blob([await file.arrayBuffer()], { type: file.type });
      await putRecord('photos', {
        id,
        expeditionLogId: id,
        blob,
        mimeType: file.type || 'image/jpeg',
        caption: '',
        coordinates: geo.position ?? undefined,
        createdAt: new Date().toISOString(),
        syncStatus: 'pending' as const,
      });

      setCount((c) => c + 1);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silently fail — offline-first
    } finally {
      setSaving(false);
    }
  }, [geo]);

  return (
    <div className="relative">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { handleCapture(e.target.files); e.target.value = ''; }}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={saving}
        className="w-full rounded-xl bg-brand-teal text-white font-semibold text-base py-4 flex items-center justify-center gap-3 hover:bg-brand-teal/90 active:scale-[0.97] transition-all shadow-lg disabled:opacity-60 min-h-[56px]"
        aria-label="Quick capture — take a photo"
      >
        {saving ? (
          <span className="animate-pulse">Saving…</span>
        ) : saved ? (
          <>
            <span className="text-xl">✓</span>
            Saved! ({count} today)
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
            Quick Capture
            {count > 0 && <span className="text-xs opacity-70">({count})</span>}
          </>
        )}
      </button>
      <p className="text-[10px] text-center text-brand-charcoal/40 dark:text-brand-sand/40 mt-1.5">
        One tap. Auto-saves photo + GPS + time. ID later.
      </p>
    </div>
  );
}
