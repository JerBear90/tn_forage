"use client";

/**
 * Client-side retry button that reloads the page when tapped.
 * Extracted as a client component so the offline page itself can
 * remain a server component (better for precaching).
 */
export default function OfflineRetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="inline-flex items-center justify-center rounded-full border-2 border-brand-teal px-6 py-3 text-base font-semibold text-brand-teal transition-colors hover:bg-brand-teal/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "9999px",
        border: "2px solid #0F766E",
        color: "#0F766E",
        padding: "0.75rem 1.5rem",
        fontWeight: 600,
        backgroundColor: "transparent",
        cursor: "pointer",
      }}
    >
      Try again
    </button>
  );
}
