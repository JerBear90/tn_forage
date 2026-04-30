import type { Metadata } from "next";
import Link from "next/link";
import SeasonalHighlights from "@/components/SeasonalHighlights";
import CommunityFeedPreview from "@/components/CommunityFeedPreview";
import ChallengesSection from "@/components/ChallengesSection";

export const metadata: Metadata = {
  title: "ForageFlow — Home",
  description:
    "Offline-first field app for mushroom, plant, tree, park, trail, and expedition discovery in Tennessee.",
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
      {/* Hero — Logo and tagline */}
      <section className="text-center mb-8 pt-4">
        <h1 className="flex flex-col items-center gap-2 mb-1">
          {/* Light mode logo */}
          <img
            src="/branding/logo.svg"
            alt="ForageFlow"
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-2xl dark:hidden"
          />
          {/* Dark mode logo */}
          <img
            src="/branding/logo-dark.svg"
            alt="ForageFlow"
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-2xl hidden dark:block"
          />
          <span className="text-3xl font-bold text-brand-teal font-heading">
            ForageFlow
          </span>
        </h1>
        <p className="text-brand-charcoal/70 dark:text-dark-text-muted text-sm">
          Mushroom, plant &amp; trail discovery in Tennessee
        </p>
      </section>

      {/* Seasonal Highlights */}
      <section className="mb-8">
        <SeasonalHighlights />
      </section>

      {/* Community Feed Preview */}
      <section className="mb-8">
        <CommunityFeedPreview />
      </section>

      {/* Active Challenges Preview */}
      <section className="mb-8">
        <ChallengesSection preview />
      </section>

      {/* Community Link */}
      <section className="mb-8">
        <Link
          href="/community"
          className="flex items-center justify-center gap-2 w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-dark-surface/80 px-4 py-3 text-sm font-semibold text-brand-teal transition-colors hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.98] min-h-[44px]"
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
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
          Explore Community Sightings
        </Link>
      </section>

      {/* Safety Notice */}
      <section
        aria-label="Safety notice"
        className="rounded-lg bg-brand-earth/10 border border-brand-earth/20 p-4 text-center"
      >
        <p className="text-xs text-brand-earth dark:text-brand-earth-300 font-medium leading-relaxed">
          ForageFlow provides identification assistance only. Always verify with
          a qualified expert before consuming any wild species.
        </p>
      </section>
    </main>
  );
}
