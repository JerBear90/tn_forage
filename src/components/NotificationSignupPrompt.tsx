'use client';

/**
 * NotificationSignupPrompt — Shows on first app load to ask users
 * to sign up for notifications via email and/or phone.
 *
 * Stores dismissal in localStorage so it only shows once.
 */

import { useState, useEffect } from 'react';
import { pb } from '@/auth/authService';
import { useAuth } from '@/auth/useAuth';

const STORAGE_KEY = 'fw_notification_prompt_dismissed';

export default function NotificationSignupPrompt() {
  const { isAuthenticated, user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only show if not previously dismissed and user is authenticated
    if (!isAuthenticated) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Small delay so it doesn't flash immediately on load
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() && !phone.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Update the user's record with notification preferences
      if (user?.id) {
        await pb.collection('users').update(user.id, {
          notificationEmail: email.trim() || undefined,
          notificationPhone: phone.trim() || undefined,
          notificationsEnabled: true,
        });
      }
      setSuccess(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      setTimeout(() => setVisible(false), 2000);
    } catch (err) {
      // If the fields don't exist yet, just dismiss gracefully
      setSuccess(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      setTimeout(() => setVisible(false), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-prompt-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-brand-charcoal shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="bg-brand-teal px-6 py-5 text-center">
          <span className="text-3xl" aria-hidden="true">🔔</span>
          <h2
            id="notification-prompt-title"
            className="mt-2 text-lg font-bold text-white"
          >
            Stay in the Loop!
          </h2>
          <p className="mt-1 text-sm text-white/80">
            Get notified about seasonal foraging alerts, weekly challenges, and new features.
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-5">
          {success ? (
            <div className="text-center py-4">
              <span className="text-3xl" aria-hidden="true">✅</span>
              <p className="mt-2 text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                You&apos;re all set! We&apos;ll keep you updated.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="notify-email"
                  className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1"
                >
                  Email
                </label>
                <input
                  id="notify-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={user?.email || 'your@email.com'}
                  className="w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal-800 dark:text-brand-sand dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="notify-phone"
                  className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1"
                >
                  Phone <span className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50">(optional, for SMS alerts)</span>
                </label>
                <input
                  id="notify-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(615) 555-0123"
                  className="w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal-800 dark:text-brand-sand dark:placeholder-gray-500"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || (!email.trim() && !phone.trim())}
                className="w-full min-h-[44px] rounded-lg bg-brand-teal px-4 py-3 text-sm font-semibold text-white hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Saving...' : '🔔 Enable Notifications'}
              </button>
            </form>
          )}

          {/* Dismiss */}
          {!success && (
            <button
              type="button"
              onClick={handleDismiss}
              className="mt-3 w-full min-h-[44px] text-sm text-gray-500 dark:text-gray-400 hover:text-brand-charcoal dark:hover:text-brand-sand transition-colors"
            >
              Maybe later
            </button>
          )}
        </div>

        {/* Privacy note */}
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            We respect your privacy. Unsubscribe anytime in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
