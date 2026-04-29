"use client";

import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";

const profileSections = [
  {
    label: "My Trips",
    href: "/trips",
    description: "View and manage saved trips",
    icon: "🗺️",
  },
  {
    label: "Expedition Logs",
    href: "/expedition",
    description: "Browse your field observations",
    icon: "📷",
  },
  {
    label: "Field Guide",
    href: "/field-guide",
    description: "Species reference library",
    icon: "📖",
  },
];

export default function ProfileContent() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Profile
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Your account, settings, and activity.
        </p>
      </header>

      {/* Avatar and name */}
      <section
        aria-label="Profile info"
        className="flex items-center gap-4 rounded-xl bg-white/80 dark:bg-brand-charcoal/60 border border-brand-teal/10 p-5 mb-6"
      >
        <div className="w-16 h-16 rounded-full bg-brand-teal/10 border-2 border-brand-teal/20 flex items-center justify-center">
          <svg
            aria-hidden="true"
            className="w-8 h-8 text-brand-teal/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-brand-charcoal dark:text-brand-sand">
            Not signed in
          </p>
          <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mt-0.5">
            Sign in to sync your data across devices.
          </p>
          <Link
            href="/login"
            className="inline-block mt-2 text-sm font-medium text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            Sign in →
          </Link>
        </div>
      </section>

      {/* Quick links */}
      <section aria-label="Quick links" className="space-y-2 mb-8">
        <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-2">
          Activity
        </h2>
        {profileSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex items-center gap-3 rounded-lg bg-white/60 dark:bg-brand-charcoal/40 border border-brand-forest/10 px-4 py-3 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
          >
            <span className="text-lg" aria-hidden="true">{section.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-brand-charcoal dark:text-brand-sand">
                {section.label}
              </p>
              <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
                {section.description}
              </p>
            </div>
            <svg
              aria-hidden="true"
              className="w-4 h-4 text-brand-charcoal/30 dark:text-brand-sand/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        ))}
      </section>

      {/* Settings */}
      <section aria-label="Settings" className="space-y-3 mb-8">
        <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand">
          Settings
        </h2>

        {/* Dark mode toggle */}
        <div className="flex items-center justify-between rounded-lg bg-white/60 dark:bg-brand-charcoal/40 border border-brand-forest/10 px-4 py-3">
          <div>
            <p className="font-semibold text-sm text-brand-charcoal dark:text-brand-sand">
              Dark Mode
            </p>
            <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
              Toggle light and dark themes
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            className={`relative w-11 h-6 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
              isDark ? "bg-brand-teal" : "bg-brand-charcoal/20"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isDark ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Membership */}
        <div className="flex items-center justify-between rounded-lg bg-white/60 dark:bg-brand-charcoal/40 border border-brand-forest/10 px-4 py-3">
          <div>
            <p className="font-semibold text-sm text-brand-charcoal dark:text-brand-sand">
              Membership
            </p>
            <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
              Free plan
            </p>
          </div>
          <span className="text-xs font-medium text-brand-teal bg-brand-teal/10 rounded-full px-2 py-0.5">
            Free
          </span>
        </div>
      </section>

      {/* Offline note */}
      <p className="text-xs text-center text-brand-charcoal/50 dark:text-brand-sand/50">
        Profile data is cached locally for offline access.
      </p>
    </main>
  );
}
