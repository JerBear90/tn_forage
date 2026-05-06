"use client";

/**
 * ForageWise — RoleGate
 *
 * Wrapper component that restricts content based on user role.
 *
 * Role hierarchy: guest < free < member < super_user
 *
 * Shows children only if the user's role meets or exceeds `requiredRole`.
 * Works offline — uses the cached role from IndexedDB via useAuth.
 */

import { useAuth } from "@/auth/useAuth";
import { hasRequiredRole } from "@/auth/roleHierarchy";
import type { UserRole } from "@/types";

export interface RoleGateProps {
  children: React.ReactNode;
  /** Minimum role required to view the content. */
  requiredRole: UserRole;
  /** Optional custom fallback when role is insufficient. */
  fallback?: React.ReactNode;
}

export default function RoleGate({
  children,
  requiredRole,
  fallback,
}: RoleGateProps) {
  const { role, loading } = useAuth();

  // While auth is restoring, show a loading indicator
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-[20vh]"
        role="status"
        aria-label="Checking permissions"
      >
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-teal-600 border-t-transparent" />
        <span className="sr-only">Checking permissions…</span>
      </div>
    );
  }

  // Check role hierarchy
  if (!hasRequiredRole(role, requiredRole)) {
    // Show custom fallback or default "not authorized" message
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }

    return (
      <div
        className="flex flex-col items-center justify-center min-h-[30vh] p-6 text-center"
        role="alert"
      >
        <p className="text-lg font-medium text-charcoal dark:text-sand">
          Not authorized
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          You don&apos;t have permission to access this content.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
