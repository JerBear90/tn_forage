"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { handleSSOCallback, type SSOProvider } from "@/auth/authService";

// ---------------------------------------------------------------------------
// Session storage keys (must match authService.startSSO)
// ---------------------------------------------------------------------------

const SSO_KEYS = {
  codeVerifier: "sso_code_verifier",
  state: "sso_state",
  provider: "sso_provider",
  redirectUrl: "sso_redirect_url",
} as const;

// ---------------------------------------------------------------------------
// Inner component that reads search params (must be inside Suspense)
// ---------------------------------------------------------------------------

function OAuthCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  const processCallback = useCallback(async () => {
    // 1. Extract code and state from URL search params
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      setError(
        "Missing authorization parameters. The sign-in link may have expired."
      );
      return;
    }

    // 2. Retrieve stored SSO data from sessionStorage
    const codeVerifier = sessionStorage.getItem(SSO_KEYS.codeVerifier);
    const storedState = sessionStorage.getItem(SSO_KEYS.state);
    const provider = sessionStorage.getItem(SSO_KEYS.provider);
    const redirectUrl = sessionStorage.getItem(SSO_KEYS.redirectUrl);

    // Validate all required session data is present
    if (!codeVerifier || !storedState || !provider || !redirectUrl) {
      setError(
        "Session data is missing. Your sign-in session may have expired. Please try again."
      );
      return;
    }

    // Validate state matches to prevent CSRF
    if (state !== storedState) {
      setError(
        "Security validation failed. The sign-in state does not match. Please try again."
      );
      return;
    }

    // Validate provider is a supported SSO provider
    const validProviders: SSOProvider[] = ["google", "apple", "microsoft"];
    if (!validProviders.includes(provider as SSOProvider)) {
      setError(`Unsupported sign-in provider: ${provider}. Please try again.`);
      return;
    }

    try {
      // 3. Call handleSSOCallback with the params
      const result = await handleSSOCallback({
        code,
        state,
        codeVerifier,
        provider: provider as SSOProvider,
        redirectUrl,
      });

      if (result.success) {
        // 4. On success: redirect to home page
        router.replace("/");
      } else {
        setError(result.error ?? "Authentication failed. Please try again.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during sign-in.";
      setError(message);
    } finally {
      // 7. Clean up sessionStorage after processing
      sessionStorage.removeItem(SSO_KEYS.codeVerifier);
      sessionStorage.removeItem(SSO_KEYS.state);
      sessionStorage.removeItem(SSO_KEYS.provider);
      sessionStorage.removeItem(SSO_KEYS.redirectUrl);
    }
  }, [searchParams, router]);

  useEffect(() => {
    processCallback();
  }, [processCallback]);

  // 5. On error: show error message with a "Try again" link to /login
  if (error) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center px-4 py-8 max-w-sm mx-auto"
        role="alert"
      >
        <div className="text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
            aria-hidden="true"
          >
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>

          <h1 className="text-lg font-semibold text-brand-charcoal dark:text-brand-sand mb-2">
            Sign-in failed
          </h1>
          <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mb-6">
            {error}
          </p>

          <Link
            href="/login"
            className="inline-block rounded-lg bg-brand-teal px-6 py-3 text-sm font-semibold text-white hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98]"
          >
            Try again
          </Link>
        </div>
      </main>
    );
  }

  // 6. Show a loading state while processing
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4 py-8"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="text-center">
        <div
          className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-teal/20 border-t-brand-teal"
          role="status"
          aria-label="Completing sign-in"
        />
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70">
          Completing sign-in…
        </p>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Page component with Suspense boundary (required for useSearchParams)
// ---------------------------------------------------------------------------

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main
          className="flex min-h-screen flex-col items-center justify-center px-4 py-8"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="text-center">
            <div
              className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-teal/20 border-t-brand-teal"
              role="status"
              aria-label="Loading sign-in"
            />
            <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70">
              Loading…
            </p>
          </div>
        </main>
      }
    >
      <OAuthCallbackInner />
    </Suspense>
  );
}
