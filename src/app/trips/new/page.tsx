import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create Trip — ForageFlow",
  description:
    "Plan a new foraging trip to a Tennessee park, trail, or custom location.",
};

const locationTypes = [
  { value: "park", label: "State Park", icon: "🏞️" },
  { value: "trail", label: "Trail", icon: "🥾" },
  { value: "route", label: "Route", icon: "🗺️" },
  { value: "custom", label: "Custom Location", icon: "📍" },
];

export default function CreateTripPage() {
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto">
      <header className="mb-6">
        <Link
          href="/trips"
          className="text-sm text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal mb-2 inline-block"
        >
          ← Back to Trips
        </Link>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Create Trip
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Plan your next foraging outing. Saved locally first, synced when
          online.
        </p>
      </header>

      <form className="space-y-6">
        {/* Location type */}
        <fieldset>
          <legend className="font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-3">
            Where are you going?
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {locationTypes.map((loc) => (
              <label
                key={loc.value}
                className="flex items-center gap-2 rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-3 py-3 cursor-pointer hover:bg-brand-teal/5 transition-colors has-[:checked]:border-brand-teal has-[:checked]:bg-brand-teal/10"
              >
                <input
                  type="radio"
                  name="locationType"
                  value={loc.value}
                  className="sr-only"
                />
                <span aria-hidden="true">{loc.icon}</span>
                <span className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                  {loc.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Date */}
        <div>
          <label
            htmlFor="trip-date"
            className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Date
          </label>
          <input
            id="trip-date"
            type="date"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        {/* Target species */}
        <div>
          <label
            htmlFor="trip-species"
            className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Target Species
            <span className="font-normal text-brand-charcoal/50 dark:text-brand-sand/50 ml-1">
              (optional)
            </span>
          </label>
          <input
            id="trip-species"
            type="text"
            placeholder="e.g. Chanterelles, Morels"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="trip-notes"
            className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Notes
            <span className="font-normal text-brand-charcoal/50 dark:text-brand-sand/50 ml-1">
              (optional)
            </span>
          </label>
          <textarea
            id="trip-notes"
            rows={3}
            placeholder="Weather conditions, gear to bring, meeting point…"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
          />
        </div>

        {/* Companions */}
        <div>
          <label
            htmlFor="trip-companions"
            className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Companions
            <span className="font-normal text-brand-charcoal/50 dark:text-brand-sand/50 ml-1">
              (optional)
            </span>
          </label>
          <input
            id="trip-companions"
            type="text"
            placeholder="Who's coming along?"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
          />
        </div>

        {/* Safety notes */}
        <div>
          <label
            htmlFor="trip-safety"
            className="block font-heading font-semibold text-sm text-brand-charcoal dark:text-brand-sand mb-1.5"
          >
            Safety Notes
            <span className="font-normal text-brand-charcoal/50 dark:text-brand-sand/50 ml-1">
              (optional)
            </span>
          </label>
          <textarea
            id="trip-safety"
            rows={2}
            placeholder="Allergies, emergency contacts, trail hazards…"
            className="w-full rounded-lg border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 px-4 py-3 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98]"
        >
          Save Trip
        </button>
      </form>

      {/* Offline note */}
      <p className="text-xs text-center text-brand-charcoal/50 dark:text-brand-sand/50 mt-6">
        Trips are saved locally first and sync when you&apos;re back online.
      </p>
    </main>
  );
}
