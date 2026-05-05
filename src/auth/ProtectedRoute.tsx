"use client";

/**
 * ForageWise — ProtectedRoute
 *
 * Wrapper component that guards routes behind authentication.
 *
 * Behaviour:
 * - Shows children when the user is authenticated (online or offline).
 * - Redirects to /login when not authenticated.
 * - Shows a loading spinner while auth state is restoring.
 * - `allowOffline` (default true): when true, authenticated-offline users
 *   can access cached field tools (Field Guide, trips, logs, maps).
 * - `requireOnline` (default false): when true, requires online auth
 *   (for features like Stripe checkout that need a live connection).
 */

import { useEffect } from "react";
import { useAuth } from "@/auth/useAuth";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Allow authenticated-offline users through. Default: true. */
  allowOffline?: boolean;
  /** Require online authentication (e.g. Stripe checkout). Default: false. */
  requireOnline?: boolean;
}

export default function ProtectedRoute({
  children,
  allowOffline = true,
  requireOnline = false,
}: ProtectedRouteProps) {
  const { authState, isAuthenticated, loading } = useAuth();

  // Determine if the user should be redirected
  const isOfflineAuth = authState === "authenticated-offline";
  const isOnlineAuth = authState === "authenticated-online";

  // User passes if:
  // 1. They are authenticated AND
  // 2. Either requireOnline is false, or they are online-authenticated AND
  // 3. Either allowOffline is true, or they are not in offline-auth state
  const isAllowed =
    isAuthenticated &&
    (!requireOnline || isOnlineAuth) &&
    (allowOffline || !isOfflineAuth);

  // Redirect to login when not loading and not allowed
  useEffect(() => {
    if (!loading && !isAllowed) {
      // Use window.location for redirect to avoid importing next/navigation
      // which keeps this component simpler and testable
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, [loading, isAllowed]);

  // Loading state — show accessible spinner
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-[50vh]"
        role="status"
        aria-label="Restoring session"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent" />
        <span className="sr-only">Restoring session…</span>
      </div>
    );
  }

  // Not allowed — show nothing while redirect happens
  if (!isAllowed) {
    // If requireOnline and user is offline-authenticated, show a message
    // instead of silently redirecting
    if (isAuthenticated && requireOnline && isOfflineAuth) {
      return (
        <div
          className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center"
          role="alert"
        >
          <p className="text-lg font-medium text-charcoal dark:text-sand">
            This feature requires an internet connection.
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Please connect to the internet and try again.
          </p>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}
