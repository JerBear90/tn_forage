"use client";

/**
 * ForageWise — SuperUserGate
 *
 * Convenience wrapper around RoleGate that restricts content to super_user role.
 *
 * This is a client-side gate only. Server-side validation is also required:
 * PocketBase validates the user's role on all API calls, ensuring that
 * even if the frontend gate is bypassed, unauthorized actions are blocked.
 *
 * NOTE: Super User permissions are enforced server-side via PocketBase
 * collection rules and API middleware. This component provides a UX gate
 * but is NOT a security boundary on its own.
 */

import RoleGate from "@/auth/RoleGate";

export interface SuperUserGateProps {
  children: React.ReactNode;
  /** Optional custom fallback when user is not a super_user. */
  fallback?: React.ReactNode;
}

export default function SuperUserGate({
  children,
  fallback,
}: SuperUserGateProps) {
  return (
    <RoleGate requiredRole="super_user" fallback={fallback}>
      {children}
    </RoleGate>
  );
}
