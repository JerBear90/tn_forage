"use client";

import { useEffect, useState } from "react";

/**
 * CSS-based PWA splash / loading screen.
 *
 * Shows the ForageWise logo centered on the brand teal background while the
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
      {/* Logo image */}
      <img
        src="/branding/mush_logo.png"
        width={96}
        height={96}
        alt="ForageWise logo"
        className="pwa-splash__icon"
      />

      <p className="pwa-splash__title">ForageWise</p>
    </div>
  );
}
