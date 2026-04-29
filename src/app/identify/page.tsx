import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Identify — ForageFlow",
  description:
    "Identify mushrooms and plants using the step-by-step Guided ID Wizard or AI photo recognition.",
};

const wizardSteps = [
  { step: 1, label: "Underside type", options: "Gills, Pores, Teeth, Smooth, Unknown" },
  { step: 2, label: "Growth location", options: "Soil, Dead wood, Living tree, Leaf litter, Moss" },
  { step: 3, label: "Nearby tree", options: "Oak, Hickory, Elm, Maple, Pine, Poplar" },
  { step: 4, label: "Cap color & shape", options: "Visual selection" },
  { step: 5, label: "Stem features", options: "Ring, Volva, Hollow, Solid" },
  { step: 6, label: "Bruising reaction", options: "Blue, Brown, Yellow, None, Unknown" },
];

export default function IdentifyPage() {
  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-brand-teal font-heading">
          Identify
        </h1>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Use the Guided ID Wizard for step-by-step identification, or try AI
          photo recognition when online.
        </p>
      </header>

      {/* Method selection */}
      <section aria-label="Identification methods" className="space-y-4 mb-8">
        {/* Guided Wizard */}
        <div className="rounded-xl border border-brand-teal/20 bg-white/80 dark:bg-brand-charcoal/60 p-5">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-brand-teal mt-0.5">
              <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </span>
            <div>
              <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand">
                Guided ID Wizard
              </h2>
              <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mt-0.5">
                Answer questions about what you see. Works offline.
              </p>
            </div>
          </div>

          {/* Wizard step preview */}
          <ol className="space-y-2 mb-4">
            {wizardSteps.map((s) => (
              <li
                key={s.step}
                className="flex items-center gap-2 text-xs text-brand-charcoal/70 dark:text-brand-sand/70"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-teal/10 text-brand-teal font-semibold text-[10px]">
                  {s.step}
                </span>
                <span className="font-medium">{s.label}</span>
                <span className="text-brand-charcoal/40 dark:text-brand-sand/40">
                  — {s.options}
                </span>
              </li>
            ))}
          </ol>

          <button
            type="button"
            className="w-full rounded-lg bg-brand-teal text-white font-semibold text-sm py-3 hover:bg-brand-teal/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98]"
          >
            Start Guided ID
          </button>
        </div>

        {/* AI Recognition */}
        <div className="rounded-xl border border-brand-moss/20 bg-white/80 dark:bg-brand-charcoal/60 p-5">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-brand-moss mt-0.5">
              <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </span>
            <div>
              <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand">
                AI Photo Recognition
              </h2>
              <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mt-0.5">
                Upload or capture photos for AI-assisted matching. Requires
                internet connection.
              </p>
            </div>
          </div>

          <p className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50 mb-3">
            For best results, capture multiple angles: top view, underside,
            habitat, and stem/base.
          </p>

          <button
            type="button"
            className="w-full rounded-lg bg-brand-moss text-white font-semibold text-sm py-3 hover:bg-brand-moss/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors active:scale-[0.98]"
          >
            Upload or Capture Photo
          </button>
        </div>
      </section>

      {/* Safety reminder */}
      <section
        aria-label="Safety reminder"
        className="rounded-lg bg-brand-earth/10 border border-brand-earth/20 p-4"
      >
        <p className="text-xs text-brand-earth font-medium leading-relaxed">
          Results are possible matches only. Never consume a wild species based
          solely on app results. Verify with a qualified expert before consuming.
        </p>
      </section>

      {/* Link to Field Guide */}
      <div className="mt-6 text-center">
        <Link
          href="/field-guide"
          className="text-sm text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          Browse the Field Guide instead →
        </Link>
      </div>
    </main>
  );
}
