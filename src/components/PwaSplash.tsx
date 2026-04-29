"use client";

import { useEffect, useState } from "react";

/**
 * CSS-based PWA splash / loading screen.
 *
 * Shows the ForageFlow logo centered on the brand teal background while the
 * app hydrates. Automatically fades out after a short delay and is removed
 * from the DOM once the transition completes.
 *
 * On iOS, the native `apple-touch-startup-image` meta tags handle the
 * pre-render splash. This component covers the gap between the native splash
 * dismissing and React finishing hydration, giving a seamless branded
 * experience on all platforms (Android, desktop PWA, and iOS).
 */
export default function PwaSplash() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Begin fade-out shortly after mount (app is hydrated at this point)
    const fadeTimer = setTimeout(() => setFadeOut(true), 300);
    // Remove from DOM after the CSS transition finishes
    const removeTimer = setTimeout(() => setVisible(false), 800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`pwa-splash ${fadeOut ? "pwa-splash--hidden" : ""}`}
    >
      {/* Inline SVG of the app icon so it renders instantly without a network request */}
      <svg
        width="96"
        height="96"
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="ForageFlow logo"
        className="pwa-splash__icon"
      >
        <rect width="512" height="512" rx="112" fill="#0F766E" />
        <path
          d="M256 70C185 70 128 122 128 186c0 18 15 33 33 33h190c18 0 33-15 33-33C384 122 327 70 256 70Z"
          fill="#F5F0DF"
        />
        <path
          d="M214 219h84l22 163c4 29-19 55-48 55h-32c-29 0-52-26-48-55l22-163Z"
          fill="#F5F0DF"
        />
        <path
          d="M256 284c-35 0-63 28-63 63 0 58 63 101 63 101s63-43 63-101c0-35-28-63-63-63Zm0 88a25 25 0 1 1 0-50 25 25 0 0 1 0 50Z"
          fill="#14532D"
        />
        <path
          d="M342 112c31 4 57 28 66 59 30-23 50-56 57-94-44 2-85 14-123 35Z"
          fill="#4D7C0F"
        />
        <circle cx="190" cy="160" r="12" fill="#0F766E" />
        <circle cx="249" cy="137" r="10" fill="#0F766E" />
        <circle cx="314" cy="164" r="12" fill="#0F766E" />
      </svg>

      <p className="pwa-splash__title">ForageFlow</p>
    </div>
  );
}
