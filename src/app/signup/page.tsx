"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth/useAuth";
import type { SSOProvider } from "@/auth/authService";

// ---------------------------------------------------------------------------
// SSO Provider Config
// ---------------------------------------------------------------------------

interface SSOProviderConfig {
  id: SSOProvider;
  name: string;
  icon: React.ReactNode;
  bgClass: string;
  disabledClass: string;
}

const ssoProviders: SSOProviderConfig[] = [
  {
    id: "google",
    name: "Google",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09A6.97 6.97 0 0 1 5.47 12c0-.72.13-1.43.37-2.09V7.07H2.18A11.96 11.96 0 0 0 .96 12c0 1.94.46 3.77 1.22 5.33l3.66-3.24Z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
          fill="#EA4335"
        />
      </svg>
    ),
    bgClass:
      "bg-white border-gray-300 text-brand-charcoal hover:bg-gray-50 dark:bg-white dark:text-brand-charcoal dark:hover:bg-gray-100",
    disabledClass:
      "bg-gray-100 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500",
  },
];

// ---------------------------------------------------------------------------
// Signup Page
// ---------------------------------------------------------------------------

export default function SignupPage() {
  const router = useRouter();
  const { signup, startSSO, isOffline, isAuthenticated, loading, authState } =
    useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<SSOProvider | null>(null);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/");
    }
  }, [loading, isAuthenticated, router]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};

    // Client-side validation with field-level errors
    if (!displayName.trim()) {
      errors.displayName = "Display name is required.";
    }
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors below.");
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const result = await signup(email, password, displayName.trim());
      if (!result.success) {
        setError(result.error ?? "Signup failed. Please try again.");
      }
      // On success, the useEffect above will redirect
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSSO(provider: SSOProvider) {
    setError(null);
    setSsoLoading(provider);
    try {
      await startSSO(provider);
      // Browser will redirect — no further action needed
    } catch (err) {
      const message =
        err instanceof Error
          ? `SSO Error: ${err.message}`
          : "SSO sign-up failed. Please try again.";
      setError(message);
      setSsoLoading(null);
    }
  }

  const isFormBusy = submitting || authState === "syncing";

  // Show a loading skeleton while auth state is being restored
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-brand-teal" role="status">
          <span className="sr-only">Loading…</span>
          <svg
            className="h-10 w-10 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
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
              d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z"
            />
          </svg>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-8 text-center">
          <Image
            src="/branding/mush_logo.png"
            alt="ForageWise logo"
            width={64}
            height={64}
            className="mx-auto mb-3 rounded-2xl"
            priority
          />
          <h1 className="font-heading text-3xl font-bold text-brand-teal">
            Join ForageWise
          </h1>
          <p className="mt-1 text-sm text-brand-charcoal/70 dark:text-brand-sand/70">
            Create an account to sync your trips, logs, and species data across
            devices.
          </p>
        </div>

        {/* Offline banner */}
        {isOffline && (
          <div
            className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-200"
            role="alert"
          >
            <p className="font-medium">Internet connection required</p>
            <p className="mt-0.5 text-xs">
              Account creation and SSO sign-up need an active connection.
              Previously authenticated users can access cached data offline.
            </p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div
            className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-600 dark:bg-red-900/30 dark:text-red-200"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* SSO buttons */}
        <section aria-label="Sign up with SSO" className="mb-6 w-full space-y-2">
          {ssoProviders.map((provider) => {
            const disabled = isOffline || ssoLoading !== null || isFormBusy;
            return (
              <div key={provider.id} className="relative">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSSO(provider.id)}
                  aria-label={
                    isOffline
                      ? `Continue with ${provider.name} (unavailable offline)`
                      : `Continue with ${provider.name}`
                  }
                  className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
                    disabled ? provider.disabledClass + " cursor-not-allowed" : provider.bgClass + " active:scale-[0.98]"
                  }`}
                >
                  {ssoLoading === provider.id ? (
                    <svg
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
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
                        d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z"
                      />
                    </svg>
                  ) : (
                    provider.icon
                  )}
                  Continue with {provider.name}
                </button>
                {isOffline && (
                  <span className="mt-0.5 block text-center text-xs text-brand-charcoal/40 dark:text-brand-sand/40">
                    Requires internet
                  </span>
                )}
              </div>
            );
          })}
        </section>

        {/* Divider */}
        <div className="mb-6 flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-brand-charcoal/10 dark:bg-brand-sand/10" />
          <span className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40">
            or sign up with email
          </span>
          <div className="h-px flex-1 bg-brand-charcoal/10 dark:bg-brand-sand/10" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="mb-6 w-full space-y-4" noValidate>
          <div>
            <label
              htmlFor="signup-name"
              className="mb-1.5 block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Display Name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              required
              placeholder="Your name"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setFieldErrors(prev => { const n = {...prev}; delete n.displayName; return n; }); }}
              disabled={isFormBusy}
              aria-invalid={!!fieldErrors.displayName}
              aria-describedby={fieldErrors.displayName ? "signup-name-error" : undefined}
              className={`w-full rounded-lg border ${fieldErrors.displayName ? 'border-red-400 dark:border-red-600' : 'border-brand-teal/20'} bg-white/80 px-4 py-3 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-charcoal/60 dark:text-brand-sand dark:placeholder:text-brand-sand/40`}
            />
            {fieldErrors.displayName && (
              <p id="signup-name-error" className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">{fieldErrors.displayName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="signup-email"
              className="mb-1.5 block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => { const n = {...prev}; delete n.email; return n; }); }}
              disabled={isFormBusy}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "signup-email-error" : undefined}
              className={`w-full rounded-lg border ${fieldErrors.email ? 'border-red-400 dark:border-red-600' : 'border-brand-teal/20'} bg-white/80 px-4 py-3 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-charcoal/60 dark:text-brand-sand dark:placeholder:text-brand-sand/40`}
            />
            {fieldErrors.email && (
              <p id="signup-email-error" className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="signup-password"
              className="mb-1.5 block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => { const n = {...prev}; delete n.password; return n; }); }}
              disabled={isFormBusy}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "signup-password-error" : "signup-password-hint"}
              className={`w-full rounded-lg border ${fieldErrors.password ? 'border-red-400 dark:border-red-600' : 'border-brand-teal/20'} bg-white/80 px-4 py-3 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-charcoal/60 dark:text-brand-sand dark:placeholder:text-brand-sand/40`}
            />
            {fieldErrors.password ? (
              <p id="signup-password-error" className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">{fieldErrors.password}</p>
            ) : (
              <p id="signup-password-hint" className="mt-1 text-xs text-brand-charcoal/50 dark:text-brand-sand/50">
                At least 8 characters
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="signup-password-confirm"
              className="mb-1.5 block text-sm font-medium text-brand-charcoal dark:text-brand-sand"
            >
              Confirm Password
            </label>
            <input
              id="signup-password-confirm"
              type="password"
              autoComplete="new-password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(prev => { const n = {...prev}; delete n.confirmPassword; return n; }); }}
              disabled={isFormBusy}
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? "signup-confirm-error" : undefined}
              className={`w-full rounded-lg border ${fieldErrors.confirmPassword ? 'border-red-400 dark:border-red-600' : 'border-brand-teal/20'} bg-white/80 px-4 py-3 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-brand-charcoal/60 dark:text-brand-sand dark:placeholder:text-brand-sand/40`}
            />
            {fieldErrors.confirmPassword && (
              <p id="signup-confirm-error" className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isFormBusy}
            className="flex w-full items-center justify-center rounded-lg bg-brand-teal py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFormBusy ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
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
                    d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z"
                  />
                </svg>
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Links */}
        <div className="text-center">
          <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Safety note */}
        <p className="mt-8 max-w-xs mx-auto text-center text-xs text-brand-charcoal/50 dark:text-brand-sand/50">
          By creating an account you agree that ForageWise provides
          identification assistance only. Always verify species with a qualified
          expert.
        </p>
      </div>
    </main>
  );
}
