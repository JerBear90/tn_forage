/**
 * Auth context definition and types.
 *
 * Separated from AuthProvider.tsx so that non-JSX modules (hooks, tests)
 * can import the context and types without pulling in JSX.
 */

import { createContext } from "react";
import type {
  AuthState,
  UserProfileLocal,
  UserRole,
  MembershipPlan,
  MembershipStatus,
} from "@/types";
import type { AuthResult, SSOProvider } from "@/auth/authService";

// ---------------------------------------------------------------------------
// Context Value Type
// ---------------------------------------------------------------------------

/** Shape of the value exposed by AuthProvider via useAuth. */
export interface AuthContextValue {
  /** Current user profile, or null if not authenticated. */
  user: UserProfileLocal | null;
  /** Current user role derived from profile. */
  role: UserRole;
  /** Cached membership info (plan, status, period end). */
  membership: {
    plan: MembershipPlan;
    status: MembershipStatus;
    currentPeriodEnd?: string;
  };
  /** Current auth state machine value. */
  authState: AuthState;
  /** Whether the device is currently offline. */
  isOffline: boolean;
  /** Whether the user is authenticated (online or offline). */
  isAuthenticated: boolean;
  /** True while restoreSession is running on mount. */
  loading: boolean;
  /** Authenticate with email and password. */
  login: (email: string, password: string) => Promise<AuthResult>;
  /** Create a new account. */
  signup: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<AuthResult>;
  /** Log out and clear session. */
  logout: () => Promise<void>;
  /** Start SSO redirect flow for a provider. */
  startSSO: (provider: SSOProvider) => Promise<void>;
  /** Re-run session restore (e.g. after coming back online). */
  refreshSession: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const AuthContext = createContext<AuthContextValue | null>(null);
