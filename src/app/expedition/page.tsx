import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expedition Log — ForageFlow",
  description:
    "Quick-log field observations with photos, GPS, species guesses, and habitat notes.",
};

export default function ExpeditionPage() {
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
          Expedition Log
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Quick-log your field observations. Photos and data save locally first.
        </p>
      </header>

      {/* Quick Log entry */}
      <section
        aria-label="New log entry"
        className="rounded-xl border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 p-5 mb-6"
      >
        <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-4">
          New Entry
        </h2>

        <div className="space-y-4">
          {/* Photo capture */}
          <div>
            <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
              Photos
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-brand-teal/30 bg-brand-teal/5 py-4 text-brand-teal hover:bg-brand-teal/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
              >
                <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
                <span className="text-xs font-medium">Camera</span>
              </button>
              <button
                type="button"
                className="flex-1 flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed border-brand-moss/30 bg-brand-moss/5 py-4 text-brand-moss hover:bg-brand-moss/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
              >
                <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <span className="text-xs font-medium">Gallery</span>
              </button>
            </div>
          </div>

          {/* Species guess */}
          <div>
            <label
              htmlFor="log-species"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
            >
              Species Guess
            </label>
            <input
              id="log-species"
              type="text"
              placeholder="What do you think it is?"
              className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            />
          </div>

          {/* Habitat notes */}
          <div>
            <label
              htmlFor="log-habitat"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
            >
              Habitat Notes
            </label>
            <textarea
              id="log-habitat"
              rows={2}
              placeholder="Soil type, moisture, nearby trees, growth substrate…"
              className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 resize-none"
            />
          </div>

          {/* Tree nearby */}
          <div>
            <label
              htmlFor="log-tree"
              className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1.5"
            >
              Tree Nearby
            </label>
            <input
              id="log-tree"
              type="text"
              placeholder="Oak, Hickory, Pine, Unknown…"
              className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-2.5 text-sm text-brand-charcoal dark:text-brand-sand placeholder:text-brand-charcoal/40 dark:placeholder:text-brand-sand/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
            />
          </div>

          {/* Location */}
          <div>
            <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
              Location
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 py-2.5 text-sm font-medium text-brand-teal hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
              >
                📍 Use GPS
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 py-2.5 text-sm font-medium text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
              >
                ✏️ Enter Manually
              </button>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
              Visibility
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg border border-brand-teal bg-brand-teal/10 py-2.5 text-sm font-medium text-brand-teal"
              >
                🔒 Private
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 py-2.5 text-sm font-medium text-brand-charcoal/70 dark:text-brand-sand/70 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
              >
                🌐 Public
              </button>
            </div>
            <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mt-1">
              Logs are private by default. Public logs have GPS coordinates
              fuzzed for privacy.
            </p>
          </div>

          {/* Save */}
          <button
            type="button"
            className="w-full rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98]"
          >
            Save Log Entry
          </button>
        </div>
      </section>

      {/* Previous logs empty state */}
      <section aria-label="Previous logs" className="text-center py-8">
        <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50">
          Your expedition logs will appear here.
        </p>
        <p className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40 mt-1">
          All entries save locally and sync when online.
        </p>
      </section>
    </main>
  );
}
