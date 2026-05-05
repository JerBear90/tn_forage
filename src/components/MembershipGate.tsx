"use client";

/**
 * ForageWise — MembershipGate
 *
 * Wrapper component that restricts premium features based on membership plan.
 * Works offline using cached membership data from the AuthProvider (which
 * reads from IndexedDB).
 *
 * Usage:
 *   <MembershipGate requiredPlan="monthly">
 *     <PremiumFeature />
 *   </MembershipGate>
 */

import Link from "next/link";
import { useAuth } from "@/auth/useAuth";
import { hasRequiredPlan } from "@/services/membershipPlanHierarchy";
import type { MembershipPlan } from "@/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MembershipGateProps {
  children: React.ReactNode;
  /** Minimum membership plan required to view the content. */
  requiredPlan: MembershipPlan;
  /** Optional custom fallback when plan is insufficient. */
  fallback?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MembershipGate({
  children,
  requiredPlan,
  fallback,
}: MembershipGateProps) {
  const { membership, loading } = useAuth();

  // While auth is restoring, show a loading indicator
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-[20vh]"
        role="status"
        aria-label="Checking membership"
      >
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-600 border-t-transparent" />
        <span className="sr-only">Checking membership…</span>
      </div>
    );
  }

  // Check plan hierarchy
  if (!hasRequiredPlan(membership.plan, requiredPlan)) {
    // Show custom fallback or default upgrade prompt
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }

    return (
      <div
        className="flex flex-col items-center justify-center min-h-[30vh] p-6 text-center"
        role="alert"
      >
        <div className="w-12 h-12 rounded-full bg-brand-teal/10 flex items-center justify-center mb-3">
          <svg
            aria-hidden="true"
            className="w-6 h-6 text-brand-teal"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-brand-charcoal dark:text-brand-sand">
          Premium Feature
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          This feature requires a{" "}
          <span className="font-medium text-brand-teal">
            {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
          </span>{" "}
          plan or higher.
        </p>
        <Link
          href="/membership"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-teal text-white px-5 py-2.5 text-sm font-semibold hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px]"
        >
          View Plans
          <svg
            aria-hidden="true"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
