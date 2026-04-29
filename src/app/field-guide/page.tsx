import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Field Guide — ForageFlow",
  description:
    "Browse mushrooms, plants, and trees found in Tennessee. Works offline.",
};

const categories = [
  {
    name: "Mushrooms",
    count: 0,
    description: "Gilled, pored, toothed, and more",
    color: "bg-brand-earth/10 text-brand-earth border-brand-earth/20",
  },
  {
    name: "Plants",
    count: 0,
    description: "Wildflowers, herbs, and edible greens",
    color: "bg-brand-moss/10 text-brand-moss border-brand-moss/20",
  },
  {
    name: "Trees",
    count: 0,
    description: "Hardwoods, conifers, and bark ID",
    color: "bg-brand-forest/10 text-brand-forest border-brand-forest/20",
  },
];

const filters = ["All", "Mushrooms", "Plants", "Trees"];
const seasons = ["Spring", "Summer", "Fall", "Winter"];

export default function FieldGuidePage() {
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Field Guide
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Offline species reference for Tennessee mushrooms, plants, and trees.
        </p>
      </header>

      {/* Search */}
      <div className="mb-4">
        <label htmlFor="field-guide-search" className="sr-only">
          Search species
        </label>
        <input
          id="field-guide-search"
          type="search"
          placeholder="Search by name, habitat, or tree…"
          className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" role="group" aria-label="Category filters">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className="shrink-0 rounded-full border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-3 py-1.5 text-xs font-medium text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Season chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" role="group" aria-label="Season filters">
        {seasons.map((season) => (
          <button
            key={season}
            type="button"
            className="shrink-0 rounded-full border border-brand-moss/20 bg-white/60 dark:bg-brand-charcoal/40 px-3 py-1.5 text-xs font-medium text-brand-charcoal dark:text-brand-sand hover:bg-brand-moss/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
          >
            {season}
          </button>
        ))}
      </div>

      {/* Category cards */}
      <section aria-label="Species categories" className="space-y-3 mb-8">
        <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand">
          Categories
        </h2>
        {categories.map((cat) => (
          <div
            key={cat.name}
            className={`rounded-xl border p-4 ${cat.color}`}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-heading font-semibold text-sm">{cat.name}</h3>
              <span className="text-xs opacity-70">{cat.count} species</span>
            </div>
            <p className="text-xs opacity-80">{cat.description}</p>
          </div>
        ))}
      </section>

      {/* Empty state */}
      <div className="text-center py-8 text-brand-charcoal/50 dark:text-brand-sand/50">
        <p className="text-sm">
          Species data will be loaded from the local database.
        </p>
        <p className="text-xs mt-1">
          The Field Guide works offline once data is seeded.
        </p>
      </div>
    </main>
  );
}
