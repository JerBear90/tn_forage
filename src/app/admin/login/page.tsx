"use client";

/**
 * ForageWise — Admin Login Page
 *
 * A dedicated login screen for super users at /admin/login.
 * Branded with the ForageWise admin aesthetic.
 * On successful login, redirects to /admin dashboard.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/useAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSubmitting(true);

      try {
        const result = await login(email, password);
        if (result.success) {
          router.replace("/admin");
        } else {
          setError(result.error || "Invalid credentials. Admin access only.");
        }
      } catch {
        setError("Login failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, login, router]
  );

  // If already authenticated, redirect to admin dashboard
  if (!authLoading && isAuthenticated) {
    router.replace("/admin");
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-charcoal via-gray-900 to-brand-charcoal p-4">
      <div className="w-full max-w-sm">
        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-teal/10 border border-brand-teal/20 mb-4">
            <svg
              className="w-8 h-8 text-brand-teal"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-heading font-bold text-white">
            ForageWise Admin
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Super user access only
          </p>
        </div>

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl"
        >
          {/* Error message */}
          {error && (
            <div
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Email field */}
          <div className="mb-4">
            <label
              htmlFor="admin-email"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@foragewise.app"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-colors"
            />
          </div>

          {/* Password field */}
          <div className="mb-6">
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-colors"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Authenticating...
              </span>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Security note */}
          <p className="mt-4 text-center text-xs text-gray-500">
            All admin actions are validated server-side via PocketBase.
          </p>
        </form>

        {/* Back link */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-brand-teal transition-colors"
          >
            &larr; Back to ForageWise
          </a>
        </div>
      </div>
    </div>
  );
}
