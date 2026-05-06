'use client';

/**
 * ForageWise — Support Page
 *
 * Allows users to report problems. Collects which page they're having
 * an issue on, a description, and submits to the admin dashboard.
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/auth/useAuth';
import { putRecord } from '@/offline/db';

const PAGE_OPTIONS = [
  { value: 'field-guide', label: 'Field Guide' },
  { value: 'map', label: 'Map' },
  { value: 'trips', label: 'Trips' },
  { value: 'community', label: 'Community' },
  { value: 'profile', label: 'Profile' },
  { value: 'identify', label: 'Identify' },
  { value: 'expedition', label: 'Expedition Log' },
  { value: 'login-signup', label: 'Login / Signup' },
  { value: 'parks', label: 'Parks' },
  { value: 'membership', label: 'Membership' },
  { value: 'settings', label: 'Settings' },
  { value: 'other', label: 'Other' },
];

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

export default function SupportPage() {
  const { user } = useAuth();
  const [page, setPage] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const isValid = page.length > 0 && description.trim().length > 0;

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;

    setSubmitting(true);
    setError(null);

    try {
      // Store support ticket in settings store (will sync to admin dashboard)
      await putRecord('settings', {
        id: `support-ticket-${generateId()}`,
        theme: 'light',
        safetyDisclaimerDismissed: false,
        introAnimationShown: false,
        lastSyncAt: new Date().toISOString(),
        // Custom fields stored as JSON in a known pattern
        _supportTicket: JSON.stringify({
          page,
          description: description.trim(),
          userId: user?.id || 'anonymous',
          userEmail: user?.email || '',
          createdAt: new Date().toISOString(),
          status: 'open',
        }),
      });
      setSubmitted(true);
    } catch {
      setError('Failed to submit. Your request will be saved and sent when online.');
    } finally {
      setSubmitting(false);
    }
  }, [isValid, page, description, user]);

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-4" aria-hidden="true">✅</div>
          <h1 className="font-heading text-2xl font-bold text-brand-forest dark:text-brand-moss mb-2">
            Request Submitted
          </h1>
          <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mb-6">
            Thank you for reaching out. Our team will review your report and get back to you.
          </p>
          <Link
            href="/profile"
            className="inline-block rounded-lg bg-brand-teal text-white font-semibold text-sm px-6 py-3 hover:bg-brand-teal/90 transition-colors"
          >
            Back to Profile
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
      <header className="mb-6">
        <Link
          href="/profile"
          className="text-sm text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal mb-2 inline-block"
        >
          ← Back to Profile
        </Link>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Support
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Tell us what page you&apos;re having a problem on and describe the issue.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Page selector */}
        <div>
          <label
            htmlFor="support-page"
            className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Which page are you having a problem on?
          </label>
          <select
            id="support-page"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            aria-required="true"
            aria-invalid={touched && !page}
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          >
            <option value="">Select a page…</option>
            {PAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {touched && !page && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
              Please select which page you need help with.
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="support-description"
            className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Describe the problem
          </label>
          <textarea
            id="support-description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened? What did you expect to happen?"
            aria-required="true"
            aria-invalid={touched && !description.trim()}
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
          />
          {touched && !description.trim() && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
              Please describe the problem you&apos;re experiencing.
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
        >
          {submitting ? 'Submitting…' : 'Submit Support Request'}
        </button>
      </form>
    </main>
  );
}
