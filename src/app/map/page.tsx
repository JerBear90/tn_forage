import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Map — ForageFlow",
  description:
    "Explore Tennessee state parks, trails, and routes on an interactive Leaflet map.",
};

const mapLayers = [
  { name: "State Parks", description: "Tennessee state parks with amenities and foraging info", icon: "🏞️" },
  { name: "Trails", description: "Hiking trails with distance, difficulty, and likely species", icon: "🥾" },
  { name: "Routes", description: "Curated foraging routes with tree and species data", icon: "🗺️" },
  { name: "Saved Trips", description: "Your planned and completed trips", icon: "📌" },
  { name: "Expedition Logs", description: "Your field observations and photos", icon: "📷" },
];

export default function MapPage() {
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Map
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Tennessee parks, trails, and routes. Previously viewed areas are
          available offline.
        </p>
      </header>

      {/* Map placeholder — Leaflet will be integrated in Phase 7 */}
      <div
        className="rounded-xl border-2 border-dashed border-brand-teal/30 bg-brand-teal/5 dark:bg-brand-teal/10 flex flex-col items-center justify-center min-h-[280px] mb-6"
        role="region"
        aria-label="Map view"
      >
        <svg aria-hidden="true" className="w-12 h-12 text-brand-teal/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503-12.713l5.248-2.187A.75.75 0 0121.75 3v14.25a.75.75 0 01-.497.702l-5.253 2.188a.75.75 0 01-.503 0L9.75 17.953a.75.75 0 00-.503 0l-5.248 2.187A.75.75 0 013 19.39V5.14a.75.75 0 01.497-.702l5.253-2.188a.75.75 0 01.503 0L15 5.327" />
        </svg>
        <p className="text-sm text-brand-teal/60 font-medium">
          Leaflet map loads here
        </p>
        <p className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40 mt-1">
          Interactive map with clustering and offline tile cache
        </p>
      </div>

      {/* Find Me button */}
      <button
        type="button"
        className="w-full rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 mb-6 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        Find Me
      </button>

      {/* Map layers */}
      <section aria-label="Map layers" className="mb-6">
        <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-3">
          Layers
        </h2>
        <ul className="space-y-2">
          {mapLayers.map((layer) => (
            <li
              key={layer.name}
              className="flex items-center gap-3 rounded-lg bg-white/60 dark:bg-brand-charcoal/40 border border-brand-forest/10 px-4 py-3"
            >
              <span className="text-lg" aria-hidden="true">{layer.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-brand-charcoal dark:text-brand-sand">
                  {layer.name}
                </p>
                <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 truncate">
                  {layer.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Offline note */}
      <p className="text-xs text-center text-brand-charcoal/50 dark:text-brand-sand/50">
        Map tiles are cached as you browse. Previously viewed areas work offline.
      </p>
    </main>
  );
}
