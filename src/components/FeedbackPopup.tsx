'use client';

/**
 * ForageWise — Feedback Popup Modal
 *
 * A slide-up modal that collects user feedback with star rating and text.
 * Stores feedback in IndexedDB and dismissal timestamp in localStorage.
 */

import { useState, useCallback, useEffect } from 'react';
import { putRecord } from '@/offline/db';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DISMISSED_KEY = 'foragewise-feedback-dismissed-at';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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

/**
 * Check if the feedback popup was dismissed within the last 7 days.
 */
export function wasDismissedRecently(): boolean {
  try {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) return false;
    const dismissedAt = parseInt(dismissed, 10);
    return Date.now() - dismissedAt < SEVEN_DAYS_MS;
  } catch {
    return false;
  }
}

/**
 * Mark the feedback popup as dismissed now.
 */
function markDismissed(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  } catch {
    // localStorage unavailable — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FeedbackPopupProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FeedbackPopup({ open, onClose }: FeedbackPopupProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setRating(0);
      setHoveredStar(0);
      setMessage('');
      setSubmitted(false);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) return;
    setSubmitting(true);

    try {
      const feedbackRecord = {
        id: `feedback-${generateId()}`,
        rating,
        message: message.trim(),
        createdAt: new Date().toISOString(),
        userId: 'local-user',
      };

      // Store in IndexedDB settings store
      await putRecord('settings', feedbackRecord as any);
      markDismissed();
      setSubmitted(true);

      // Auto-close after brief success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to save feedback:', err);
    } finally {
      setSubmitting(false);
    }
  }, [rating, message, onClose]);

  const handleDismiss = useCallback(() => {
    markDismissed();
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 [@media(max-height:600px)]:items-start [@media(max-height:600px)]:pt-4"
      role="dialog"
      aria-label="App feedback"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-brand-charcoal border border-brand-teal/20 shadow-xl animate-slide-up max-h-[85vh] overflow-y-auto"
      >
        {/* Success state */}
        {submitted ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-base font-semibold text-brand-charcoal dark:text-brand-sand">
              Thank you for your feedback!
            </p>
            <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60 mt-1">
              Your input helps us improve ForageWise.
            </p>
          </div>
        ) : (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-heading font-semibold text-lg text-brand-charcoal dark:text-brand-sand">
                  How&apos;s ForageWise?
                </h2>
                <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60 mt-0.5">
                  We&apos;d love to hear your thoughts.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-brand-charcoal/40 dark:text-brand-sand/40 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
                aria-label="Close feedback dialog"
              >
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Star Rating */}
            <div className="mb-5">
              <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
                Rate your experience
              </p>
              <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
                  >
                    <svg
                      aria-hidden="true"
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoveredStar || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-brand-charcoal/20 dark:text-brand-sand/20'
                      }`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="mb-5">
              <label
                htmlFor="feedback-message"
                className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
              >
                Tell us more (optional)
              </label>
              <textarea
                id="feedback-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's working well? What could be better?"
                className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex-1 rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 text-brand-charcoal/70 dark:text-brand-sand/70 font-medium text-sm py-3 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px]"
                aria-label="Dismiss feedback and ask again later"
              >
                Maybe Later
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="flex-1 rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
                aria-label="Submit feedback"
              >
                {submitting ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
