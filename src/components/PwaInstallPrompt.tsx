"use client";

import { useEffect, useState } from "react";
import { shouldShowPwaPrompt } from "./pwaPromptUtils";

// Re-export for convenience
export { shouldShowPwaPrompt } from "./pwaPromptUtils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DISMISSAL_KEY = "forageflow-pwa-prompt-dismissed";

// ---------------------------------------------------------------------------
// Platform detection helpers
// ---------------------------------------------------------------------------

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // Check display-mode media query
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS Safari standalone check
  if ((navigator as unknown as { standalone?: boolean }).standalone === true) return true;
  return false;
}

function getDismissalTimestamp(): number | null {
  if (typeof localStorage === "undefined") return null;
  const stored = localStorage.getItem(DISMISSAL_KEY);
  if (!stored) return null;
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PwaInstallPromptProps {
  /** Override for testing — force show even in standalone mode */
  forceShow?: boolean;
}

export default function PwaInstallPrompt({ forceShow }: PwaInstallPromptProps) {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    const isStandalone = getIsStandalone();
    const dismissal = getDismissalTimestamp();
    const now = Date.now();

    const show = forceShow || shouldShowPwaPrompt(isStandalone, dismissal, now);
    setVisible(show);
    setPlatform(detectPlatform());
  }, [forceShow]);

  function handleDismiss() {
    localStorage.setItem(DISMISSAL_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="complementary"
      aria-label="Install ForageFlow"
      className="fixed bottom-20 inset-x-0 z-40 mx-4 max-w-lg sm:mx-auto"
    >
      <div className="rounded-xl border border-brand-teal/20 bg-white/95 dark:bg-brand-charcoal/95 backdrop-blur shadow-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand">
              Add ForageFlow to Home Screen
            </h2>
            <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
              Use ForageFlow like a native app — works offline in the field.
            </p>

            {platform === "ios" && (
              <ol className="mt-2 space-y-1 text-xs text-brand-charcoal/80 dark:text-brand-sand/80 list-decimal list-inside">
                <li>
                  Tap the <strong>Share</strong> button{" "}
                  <span aria-hidden="true">⬆️</span> in Safari
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong>
                </li>
              </ol>
            )}

            {platform === "android" && (
              <ol className="mt-2 space-y-1 text-xs text-brand-charcoal/80 dark:text-brand-sand/80 list-decimal list-inside">
                <li>
                  Tap the <strong>menu</strong> button{" "}
                  <span aria-hidden="true">⋮</span> in Chrome
                </li>
                <li>
                  Tap <strong>Add to Home Screen</strong>
                </li>
              </ol>
            )}

            {platform === "other" && (
              <p className="mt-2 text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
                Open this page in your mobile browser to install ForageFlow on
                your device.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="flex-shrink-0 rounded-lg p-2 text-brand-charcoal/50 dark:text-brand-sand/50 hover:bg-brand-teal/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
