"use client";

/**
 * ForageFlow — Membership Page
 *
 * Displays current plan, status indicator, and upgrade/downgrade options.
 * Protected route — requires authentication.
 * Shows cached membership data when offline.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/auth/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import ProtectedRoute from "@/auth/ProtectedRoute";
import { getDB } from "@/offline/db";
import type { MembershipLocal, MembershipPlan, MembershipStatus } from "@/types";

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

interface PlanInfo {
  id: MembershipPlan;
  name: string;
  price: string;
  period: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    features: [
      "Field Guide access",
      "Basic map",
      "Trip planning & logs",
      "Limited AI usage",
    ],
  },
  {
    id: "monthly",
    name: "Monthly",
    price: "$9.99",
    period: "/mo",
    highlight: true,
    features: [
      "Everything in Free",
      "Extended offline species packs",
      "Advanced filters",
      "Higher AI limits",
      "Cloud sync",
      "Premium trip tools",
    ],
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$89.99",
    period: "/yr",
    features: [
      "Everything in Monthly",
      "Save ~25% vs monthly",
      "Priority support",
    ],
  },
];

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<MembershipStatus, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", dot: "bg-green-500" },
  trialing: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", dot: "bg-blue-500" },
  past_due: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  canceled: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", dot: "bg-red-500" },
  inactive: { bg: "bg-gray-100 dark:bg-gray-800/30", text: "text-gray-600 dark:text-gray-400", dot: "bg-gray-400" },
};

function statusLabel(status: MembershipStatus): string {
  switch (status) {
    case "active": return "Active";
    case "trialing": return "Trialing";
    case "past_due": return "Past Due";
    case "canceled": return "Canceled";
    case "inactive": return "Inactive";
    default: return status;
  }
}

/** Plan weight for comparison — higher = more premium */
const PLAN_WEIGHT: Record<MembershipPlan, number> = {
  free: 0,
  monthly: 1,
  yearly: 2,
  lifetime: 3,
  admin: 4,
};

function getActionLabel(currentPlan: MembershipPlan, targetPlan: MembershipPlan): string | null {
  if (currentPlan === targetPlan) return null;
  if (targetPlan === "free") return "Downgrade";
  if (PLAN_WEIGHT[targetPlan] > PLAN_WEIGHT[currentPlan]) return "Upgrade";
  return "Switch";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MembershipPage() {
  const { user, membership, isAuthenticated } = useAuth();
  const isOnline = useOnlineStatus();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cachedMembership, setCachedMembership] = useState<MembershipLocal | null>(null);

  // Load cached membership from IndexedDB for offline display
  useEffect(() => {
    let cancelled = false;
    async function loadCached() {
      try {
        const db = await getDB();
        const all = await db.getAll("membershipLocal");
        const match = all.find((m) => m.userId === user?.id);
        if (!cancelled && match) {
          setCachedMembership(match);
        }
      } catch {
        // IndexedDB may not be available
      }
    }
    loadCached();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Effective membership — prefer live auth context, fall back to cached
  const currentPlan = membership.plan;
  const currentStatus = membership.status;
  const currentPeriodEnd = membership.currentPeriodEnd;
  const lastVerified = cachedMembership?.membershipLastVerifiedAt;

  const handleCheckout = useCallback(async (plan: MembershipPlan) => {
    if (!isOnline) {
      setError("Checkout requires an internet connection.");
      return;
    }
    if (!user?.id) {
      setError("You must be signed in to upgrade.");
      return;
    }
    if (plan === "free") return;

    setCheckoutLoading(plan);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userId: user.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create checkout session.");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setCheckoutLoading(null);
    }
  }, [isOnline, user?.id]);

  const statusColors = STATUS_COLORS[currentStatus] || STATUS_COLORS.inactive;

  return (
    <ProtectedRoute>
      <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
              Membership
            </h1>
            {!isOnline && (
              <span
                aria-label="You are offline"
                className="inline-flex items-center gap-1 rounded-full bg-brand-earth/15 dark:bg-brand-earth/25 px-2.5 py-0.5 text-xs font-medium text-brand-earth dark:text-amber-300 border border-brand-earth/30 dark:border-amber-400/30"
              >
                Offline
              </span>
            )}
          </div>
          <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
            Manage your plan and billing.
          </p>
        </header>

        {/* Current plan status */}
        <section
          aria-label="Current membership status"
          className="rounded-xl bg-white/80 dark:bg-brand-charcoal/60 border border-brand-teal/10 p-5 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand">
              Current Plan
            </h2>
            {/* Status indicator */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
              role="status"
              aria-label={`Membership status: ${statusLabel(currentStatus)}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusColors.dot}`} aria-hidden="true" />
              {statusLabel(currentStatus)}
            </span>
          </div>

          <p className="text-lg font-bold text-brand-teal">
            {currentPlan === "free"
              ? "Free"
              : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
          </p>

          {currentPeriodEnd && currentPlan !== "free" && (
            <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mt-1">
              Current period ends:{" "}
              {new Date(currentPeriodEnd).toLocaleDateString()}
            </p>
          )}

          {lastVerified && !isOnline && (
            <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mt-1">
              Last verified: {new Date(lastVerified).toLocaleString()}
            </p>
          )}

          {currentStatus === "past_due" && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Your payment is past due. Please update your payment method to
              continue your membership.
            </p>
          )}

          {currentStatus === "canceled" && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              Your membership has been canceled. You can resubscribe below.
            </p>
          )}
        </section>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {/* Plan cards */}
        <section aria-label="Available plans" className="space-y-4 mb-8">
          <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand">
            Plans
          </h2>

          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const actionLabel = getActionLabel(currentPlan, plan.id);

            return (
              <div
                key={plan.id}
                className={`rounded-xl border p-5 transition-colors ${
                  isCurrent
                    ? "border-brand-teal bg-brand-teal/5 dark:bg-brand-teal/10"
                    : plan.highlight
                    ? "border-brand-moss/30 bg-white/80 dark:bg-brand-charcoal/60"
                    : "border-brand-forest/10 bg-white/60 dark:bg-brand-charcoal/40"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-heading font-semibold text-brand-charcoal dark:text-brand-sand">
                      {plan.name}
                    </h3>
                    <p className="text-lg font-bold text-brand-teal">
                      {plan.price}
                      {plan.period && (
                        <span className="text-sm font-normal text-brand-charcoal/60 dark:text-brand-sand/60">
                          {plan.period}
                        </span>
                      )}
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="rounded-full bg-brand-teal text-white text-xs font-medium px-2.5 py-0.5">
                      Current
                    </span>
                  )}
                  {plan.highlight && !isCurrent && (
                    <span className="rounded-full bg-brand-moss text-white text-xs font-medium px-2.5 py-0.5">
                      Popular
                    </span>
                  )}
                </div>

                <ul className="space-y-1 mb-4">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-xs text-brand-charcoal/70 dark:text-brand-sand/70"
                    >
                      <svg
                        aria-hidden="true"
                        className="w-3.5 h-3.5 text-brand-teal flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Action button */}
                {isCurrent ? (
                  <p className="text-xs text-brand-teal font-medium text-center">
                    Your current plan
                  </p>
                ) : actionLabel && plan.id !== "free" ? (
                  <button
                    type="button"
                    onClick={() => handleCheckout(plan.id)}
                    disabled={!isOnline || checkoutLoading !== null}
                    className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                      actionLabel === "Upgrade"
                        ? "bg-brand-teal text-white hover:bg-brand-teal/90 disabled:opacity-50"
                        : "border border-brand-teal/30 text-brand-teal hover:bg-brand-teal/5 disabled:opacity-50"
                    }`}
                  >
                    {checkoutLoading === plan.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                        Loading…
                      </span>
                    ) : !isOnline ? (
                      "Requires internet"
                    ) : (
                      `${actionLabel} to ${plan.name}`
                    )}
                  </button>
                ) : plan.id === "free" && currentPlan !== "free" ? (
                  <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 text-center">
                    Cancel your subscription to return to Free.
                  </p>
                ) : null}
              </div>
            );
          })}
        </section>

        {/* Back to profile */}
        <div className="text-center">
          <Link
            href="/profile"
            className="text-sm font-medium text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            ← Back to Profile
          </Link>
        </div>

        {/* Offline note */}
        {!isOnline && (
          <p className="mt-4 text-xs text-center text-brand-charcoal/50 dark:text-brand-sand/50">
            Membership data shown from local cache. Connect to the internet to
            manage your subscription.
          </p>
        )}
      </main>
    </ProtectedRoute>
  );
}
