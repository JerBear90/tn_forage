"use client";

/**
 * ForageWise — Content Moderation Page
 *
 * Structural page for content moderation tools. Provides the layout
 * and sections for:
 * - Flagged content review
 * - Community post management
 *
 * Full CRUD functionality will be added when the Community features
 * (Phase 14) are implemented. This page establishes the routing,
 * protection (via admin layout's SuperUserGate), and UI structure.
 */

const flaggedContentColumns = [
  "Type",
  "Content",
  "Reported By",
  "Reason",
  "Date",
  "Status",
  "Actions",
];

const communityPostColumns = [
  "Author",
  "Species",
  "Location",
  "Date",
  "Visibility",
  "Flags",
  "Actions",
];

export default function ModerationPage() {
  return (
    <div className="p-4 md:p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-charcoal dark:text-brand-sand">
          Content Moderation
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Review flagged content and manage community posts.
        </p>
      </div>

      {/* Flagged Content Review */}
      <section className="mb-8" aria-labelledby="flagged-content-heading">
        <div className="flex items-center justify-between mb-3">
          <h2
            id="flagged-content-heading"
            className="text-lg font-heading font-semibold text-brand-charcoal dark:text-brand-sand"
          >
            Flagged Content
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-earth-50 dark:bg-brand-earth-900 text-brand-earth dark:text-brand-earth-300">
            0 pending
          </span>
        </div>

        <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 overflow-hidden">
          {/* Table header */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Flagged content review">
              <thead>
                <tr className="bg-brand-sand-100 dark:bg-brand-charcoal-700">
                  {flaggedContentColumns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={flaggedContentColumns.length}
                    className="px-4 py-12 text-center text-gray-400 dark:text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl" aria-hidden="true">
                        ✅
                      </span>
                      <p className="font-medium">No flagged content</p>
                      <p className="text-xs">
                        Flagged items from community posts will appear here once
                        community features are active.
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Community Post Management */}
      <section aria-labelledby="community-posts-heading">
        <div className="flex items-center justify-between mb-3">
          <h2
            id="community-posts-heading"
            className="text-lg font-heading font-semibold text-brand-charcoal dark:text-brand-sand"
          >
            Community Posts
          </h2>
        </div>

        <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Community post management">
              <thead>
                <tr className="bg-brand-sand-100 dark:bg-brand-charcoal-700">
                  {communityPostColumns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={communityPostColumns.length}
                    className="px-4 py-12 text-center text-gray-400 dark:text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl" aria-hidden="true">
                        📝
                      </span>
                      <p className="font-medium">No community posts yet</p>
                      <p className="text-xs">
                        Community sightings and posts will be manageable here
                        once community features are active.
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Info notice */}
      <div className="mt-6 p-3 rounded-lg bg-brand-teal-50 dark:bg-brand-teal-900/30 border border-brand-teal-200 dark:border-brand-teal-800">
        <p className="text-xs text-brand-teal-700 dark:text-brand-teal-300">
          <strong>Note:</strong> Full moderation tools (approve, reject, ban,
          edit) will be available when community features are implemented in
          Phase 14. All moderation actions are validated server-side.
        </p>
      </div>
    </div>
  );
}
