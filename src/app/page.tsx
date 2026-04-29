import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ForageFlow — Home",
  description:
    "Offline-first field app for mushroom, plant, tree, park, trail, and expedition discovery in Tennessee.",
};

const quickActions = [
  {
    href: "/identify",
    label: "Identify",
    description: "ID a species step-by-step",
    icon: (
      <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
    ),
  },
  {
    href: "/field-guide",
    label: "Field Guide",
    description: "Browse species offline",
    icon: (
      <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    href: "/map",
    label: "Map",
    description: "Parks, trails & routes",
    icon: (
      <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503-12.713l5.248-2.187A.75.75 0 0121.75 3v14.25a.75.75 0 01-.497.702l-5.253 2.188a.75.75 0 01-.503 0L9.75 17.953a.75.75 0 00-.503 0l-5.248 2.187A.75.75 0 013 19.39V5.14a.75.75 0 01.497-.702l5.253-2.188a.75.75 0 01.503 0L15 5.327" />
      </svg>
    ),
  },
  {
    href: "/trips/new",
    label: "Create Trip",
    description: "Plan your next outing",
    icon: (
      <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    href: "/trips",
    label: "My Trips",
    description: "View saved trips & logs",
    icon: (
      <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    href: "/expedition",
    label: "Expedition Log",
    description: "Quick-log a find",
    icon: (
      <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
    ),
  },
];

const seasonalHighlights = [
  { name: "Chanterelles", season: "Jun–Sep", habitat: "Oak & hardwood forests" },
  { name: "Chicken of the Woods", season: "May–Oct", habitat: "Dead hardwoods & stumps" },
  { name: "Morels", season: "Mar–May", habitat: "Tulip poplar, ash, elm areas" },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto">
      {/* Hero */}
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
        <p className="text-brand-charcoal/70 dark:text-brand-sand/70 text-sm">
          Mushroom, plant &amp; trail discovery in Tennessee
        </p>
      </section>

      {/* Quick Actions */}
      <section aria-label="Quick actions" className="mb-8">
        <h2 className="sr-only">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-xl bg-white/80 dark:bg-brand-charcoal/60 border border-brand-teal/10 p-4 text-center transition-colors hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal active:scale-[0.98]"
            >
              <span className="text-brand-teal">{action.icon}</span>
              <span className="font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand">
                {action.label}
              </span>
              <span className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 leading-tight">
                {action.description}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Seasonal Highlights */}
      <section aria-label="Seasonal highlights" className="mb-8">
        <h2 className="font-heading font-semibold text-lg text-brand-forest dark:text-brand-moss mb-3">
          Seasonal Highlights
        </h2>
        <ul className="space-y-2">
          {seasonalHighlights.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between rounded-lg bg-white/60 dark:bg-brand-charcoal/40 border border-brand-moss/10 px-4 py-3"
            >
              <div>
                <p className="font-semibold text-sm text-brand-charcoal dark:text-brand-sand">
                  {item.name}
                </p>
                <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
                  {item.habitat}
                </p>
              </div>
              <span className="text-xs font-medium text-brand-teal bg-brand-teal/10 rounded-full px-2 py-0.5">
                {item.season}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Safety Notice */}
      <section
        aria-label="Safety notice"
        className="rounded-lg bg-brand-earth/10 border border-brand-earth/20 p-4 text-center"
      >
        <p className="text-xs text-brand-earth dark:text-brand-earth font-medium leading-relaxed">
          ForageFlow provides identification assistance only. Always verify with
          a qualified expert before consuming any wild species.
        </p>
      </section>
    </main>
  );
}
