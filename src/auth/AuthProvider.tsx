"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AuthState,
  UserProfileLocal,
  UserRole,
  MembershipPlan,
  MembershipStatus,
} from "@/types";
import {
  login as authLogin,
  signup as authSignup,
  logout as authLogout,
  startSSO as authStartSSO,
  restoreSession,
  getAuthState,
  getCurrentUser,
  onAuthStateChange,
  setupOnlineOfflineListener,
} from "@/auth/authService";
import type { SSOProvider } from "@/auth/authService";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getDB } from "@/offline/db";
import type { MembershipLocal } from "@/types";
import { AuthContext } from "@/auth/authContext";
import type { AuthContextValue } from "@/auth/authContext";

export { AuthContext };
export type { AuthContextValue };

// ---------------------------------------------------------------------------
// Provider Component
// ---------------------------------------------------------------------------

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authState, setAuthState] = useState<AuthState>(getAuthState);
  const [user, setUser] = useState<UserProfileLocal | null>(getCurrentUser);
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<{
    plan: MembershipPlan;
    status: MembershipStatus;
    currentPeriodEnd?: string;
  }>({ plan: "free", status: "inactive" });

  const isOffline = !useOnlineStatus();

  // -----------------------------------------------------------------------
  // Load cached membership from IndexedDB
  // -----------------------------------------------------------------------
  const loadMembership = useCallback(
    async (userId: string | undefined) => {
      if (!userId) {
        setMembership({ plan: "free", status: "inactive" });
        return;
      }
      try {
        const db = await getDB();
        const all = await db.getAll("membershipLocal");
        const match = all.find(
          (m: MembershipLocal) => m.userId === userId,
        );
        if (match) {
          setMembership({
            plan: match.membershipPlan,
            status: match.membershipStatus,
            currentPeriodEnd: match.currentPeriodEnd,
          });
        } else {
          setMembership({ plan: "free", status: "inactive" });
        }
      } catch {
        setMembership({ plan: "free", status: "inactive" });
      }
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Subscribe to auth state changes
  // -----------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChange((newState, newUser) => {
      setAuthState(newState);
      setUser(newUser);
      loadMembership(newUser?.id);
    });
    return unsubscribe;
  }, [loadMembership]);

  // -----------------------------------------------------------------------
  // Restore session on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await restoreSession();
      } finally {
        if (!cancelled) {
          // Sync local state with service state after restore
          setAuthState(getAuthState());
          setUser(getCurrentUser());
          await loadMembership(getCurrentUser()?.id);
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [loadMembership]);

  // -----------------------------------------------------------------------
  // Setup online/offline listener
  // -----------------------------------------------------------------------
  useEffect(() => {
    const cleanup = setupOnlineOfflineListener();
    return cleanup;
  }, []);

  // -----------------------------------------------------------------------
  // Wrapped auth actions
  // -----------------------------------------------------------------------
  const login = useCallback(
    (email: string, password: string) => authLogin(email, password),
    [],
  );

  const signup = useCallback(
    (email: string, password: string, displayName: string) =>
      authSignup(email, password, displayName),
    [],
  );

  const logoutAction = useCallback(async () => {
    await authLogout();
    setMembership({ plan: "free", status: "inactive" });
  }, []);

  const startSSOAction = useCallback(
    (provider: SSOProvider) => authStartSSO(provider),
    [],
  );

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      await restoreSession();
    } finally {
      setAuthState(getAuthState());
      setUser(getCurrentUser());
      await loadMembership(getCurrentUser()?.id);
      setLoading(false);
    }
  }, [loadMembership]);

  // -----------------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------------
  const role: UserRole = user?.role ?? "guest";

  const authenticated =
    authState === "authenticated-online" ||
    authState === "authenticated-offline";

  // -----------------------------------------------------------------------
  // Memoised context value
  // -----------------------------------------------------------------------
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      membership,
      authState,
      isOffline,
      isAuthenticated: authenticated,
      loading,
      login,
      signup,
      logout: logoutAction,
      startSSO: startSSOAction,
      refreshSession,
    }),
    [
      user,
      role,
      membership,
      authState,
      isOffline,
      authenticated,
      loading,
      login,
      signup,
      logoutAction,
      startSSOAction,
      refreshSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
