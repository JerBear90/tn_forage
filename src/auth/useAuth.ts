"use client";

import { useContext } from "react";
import { AuthContext } from "@/auth/authContext";
import type { AuthContextValue } from "@/auth/authContext";

/**
 * Consume the AuthProvider context.
 *
 * Returns the full auth state and actions:
 *   user, role, membership, authState, isOffline, isAuthenticated,
 *   loading, login, signup, logout, startSSO, refreshSession
 *
 * @throws Error if called outside of an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export type { AuthContextValue };
