'use client';

/**
 * ForageWise — MonetizationGate Component
 *
 * Wraps premium features with a soft paywall. Shows a preview with a
 * "Upgrade to unlock" prompt for free users. Members see full content.
 *
 * Use this to gate features you plan to monetize:
 * - AI species identification (unlimited)
 * - Offline map downloads (more than 1 region)
 * - Advanced foraging forecasts
 * - Export trip data
 * - Priority support
 */

import Link from 'next/link';
import { useAuth } from '@/auth/useAuth';

export interface MonetizationGateProps {
  /** Feature name shown in the upgrade prompt */
  feature: string;
  /** What the user gets by upgrading */
  description?: string;
  /** Content shown to members */
  children: React.ReactNode;
  /** Show a blurred preview for free users (default: true) */
  showPreview?: boolean;
}

export default function MonetizationGate({
  feature,
  description,
  children,
  showPreview = true,
}: MonetizationGateProps) {
  const { membership } = useAuth();

  // Members and above get full access
  const hasAccess = membership.plan !== 'free';

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred preview */}
      {showPreview && (
        <div className="overflow-hidden rounded-lg max-h-32 pointer-events-none select-none" aria-hidden="true">
          <div className="blur-sm opacity-60">
            {children}
          </div>
        </div>
      )}

      {/* Upgrade prompt */}
      <div className={`${showPreview ? 'absolute inset-0 flex items-center justify-center' : ''}`}>
        <div className="rounded-xl bg-white/95 dark:bg-dark-surface/95 border border-brand-teal/20 shadow-lg px-5 py-4 text-center max-w-xs mx-auto">
          <span className="text-2xl mb-2 block" aria-hidden="true">✨</span>
          <p className="text-sm font-semibold text-brand-charcoal dark:text-dark-text mb-1">
            {feature}
          </p>
          {description && (
            <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mb-3">
              {description}
            </p>
          )}
          <Link
            href="/membership"
            className="inline-block rounded-lg bg-brand-teal text-white text-xs font-semibold px-4 py-2 hover:bg-brand-teal/90 transition-colors"
          >
            Upgrade to Unlock
          </Link>
        </div>
      </div>
    </div>
  );
}
