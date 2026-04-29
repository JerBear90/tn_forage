import Image from "next/image";
import OfflineRetryButton from "./OfflineRetryButton";

export const metadata = {
  title: "Offline — ForageFlow",
  description: "You are currently offline. Some ForageFlow features are still available.",
};

/**
 * Offline fallback page shown when navigating to an uncached route while offline.
 * The service worker (via next-pwa) serves this page automatically when a
 * navigation request fails both the network and cache lookups.
 *
 * Uses inline styles alongside Tailwind so the page renders correctly even if
 * the CSS bundle hasn't been cached yet.
 */
export default function OfflinePage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center bg-brand-sand dark:bg-brand-charcoal"
      style={{ backgroundColor: "#F5F0DF", minHeight: "100vh" }}
    >
      <div className="mx-auto max-w-md">
        {/* ForageFlow logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/branding/logo.svg"
            alt="ForageFlow logo"
            width={96}
            height={96}
            className="rounded-3xl shadow-lg"
            style={{ borderRadius: "1.5rem" }}
            priority
          />
        </div>

        {/* Heading */}
        <h1
          className="mb-3 font-heading text-3xl font-bold text-brand-teal dark:text-brand-teal-300"
          style={{ color: "#0F766E", fontSize: "1.875rem", fontWeight: 700 }}
        >
          You&apos;re offline
        </h1>

        {/* Friendly message */}
        <p
          className="mb-6 text-lg text-brand-charcoal/80 dark:text-brand-sand/80"
          style={{ color: "#1F2937", opacity: 0.85 }}
        >
          It looks like you&apos;ve lost your connection. Don&apos;t worry — many
          ForageFlow features still work without internet.
        </p>

        {/* Available features */}
        <div
          className="mb-8 rounded-2xl border border-brand-teal/20 bg-white/60 p-6 text-left dark:bg-brand-charcoal/40"
          style={{
            borderRadius: "1rem",
            border: "1px solid rgba(15,118,110,0.2)",
            padding: "1.5rem",
            backgroundColor: "rgba(255,255,255,0.6)",
          }}
        >
          <h2
            className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider text-brand-teal dark:text-brand-teal-300"
            style={{ color: "#0F766E", fontSize: "0.875rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}
          >
            Available offline
          </h2>
          <ul
            className="space-y-2 text-brand-charcoal/90 dark:text-brand-sand/90"
            style={{ color: "#1F2937", listStyle: "none", padding: 0, margin: 0 }}
          >
            {[
              { icon: "🍄", label: "Field Guide — browse cached species" },
              { icon: "🗺️", label: "Map — view previously loaded areas" },
              { icon: "🎒", label: "Saved Trips — access your plans" },
              { icon: "📓", label: "Expedition Logs — review past entries" },
              { icon: "🔍", label: "Guided ID Wizard — identify offline" },
            ].map(({ icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-3 text-base"
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}
              >
                <span className="text-xl" role="img" aria-hidden="true" style={{ fontSize: "1.25rem" }}>
                  {icon}
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Retry / go home */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-brand-teal px-6 py-3 text-base font-semibold text-white shadow-md transition-colors hover:bg-brand-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "9999px",
              backgroundColor: "#0F766E",
              color: "#fff",
              padding: "0.75rem 1.5rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go to Home
          </a>
          <OfflineRetryButton />
        </div>

        {/* Subtle footer note */}
        <p
          className="mt-8 text-xs text-brand-charcoal/50 dark:text-brand-sand/50"
          style={{ color: "rgba(31,41,55,0.5)", fontSize: "0.75rem", marginTop: "2rem" }}
        >
          Your connection will be restored automatically when you&apos;re back online.
        </p>
      </div>
    </main>
  );
}
