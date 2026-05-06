"use client";

/**
 * ForageWise — Safety Notice Management Page
 *
 * Structural page for creating and editing safety notices for species.
 * Provides the layout and sections for:
 * - Listing existing safety notices
 * - Creating new safety notices
 * - Editing safety notices linked to species
 *
 * Full CRUD functionality will be added when the Species Editor
 * features are fully implemented. This page establishes the routing,
 * protection (via admin layout's SuperUserGate), and UI structure.
 */

import { useState } from "react";

const noticeColumns = [
  "Species",
  "Notice Type",
  "Summary",
  "Severity",
  "Last Updated",
  "Actions",
];

const severityOptions = ["Critical", "Warning", "Info"] as const;

export default function SafetyNoticesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-brand-charcoal dark:text-brand-sand">
            Safety Notices
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage safety notices for species entries.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal-600 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          aria-expanded={showCreateForm}
        >
          {showCreateForm ? "Cancel" : "+ New Notice"}
        </button>
      </div>

      {/* Create form (structural — not yet wired to backend) */}
      {showCreateForm && (
        <div className="mb-6 p-4 rounded-xl border border-brand-teal/30 bg-white dark:bg-brand-charcoal-800">
          <h2 className="text-base font-heading font-semibold text-brand-charcoal dark:text-brand-sand mb-4">
            Create Safety Notice
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Future: submit to PocketBase
            }}
            className="space-y-4"
          >
            {/* Species selector */}
            <div>
              <label
                htmlFor="notice-species"
                className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1"
              >
                Species
              </label>
              <input
                id="notice-species"
                type="text"
                placeholder="Search species by name..."
                className="w-full px-3 py-2 rounded-lg border border-brand-charcoal/20 dark:border-brand-sand/20 bg-brand-sand dark:bg-brand-charcoal text-brand-charcoal dark:text-brand-sand text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                disabled
              />
              <p className="mt-1 text-xs text-gray-400">
                Species search will be available when the species editor is
                connected.
              </p>
            </div>

            {/* Notice type */}
            <div>
              <label
                htmlFor="notice-type"
                className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1"
              >
                Notice Type
              </label>
              <select
                id="notice-type"
                className="w-full px-3 py-2 rounded-lg border border-brand-charcoal/20 dark:border-brand-sand/20 bg-brand-sand dark:bg-brand-charcoal text-brand-charcoal dark:text-brand-sand text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                disabled
              >
                <option value="toxicity">Toxicity Warning</option>
                <option value="lookalike">Lookalike Alert</option>
                <option value="habitat">Habitat Caution</option>
                <option value="seasonal">Seasonal Notice</option>
                <option value="general">General Safety</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-2">
                  Severity
                </legend>
                <div className="flex gap-3">
                  {severityOptions.map((severity) => (
                    <label
                      key={severity}
                      className="flex items-center gap-2 text-sm text-brand-charcoal dark:text-brand-sand"
                    >
                      <input
                        type="radio"
                        name="severity"
                        value={severity.toLowerCase()}
                        className="accent-brand-teal"
                        disabled
                      />
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          severity === "Critical"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : severity === "Warning"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {severity}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Notice content */}
            <div>
              <label
                htmlFor="notice-content"
                className="block text-sm font-medium text-brand-charcoal dark:text-brand-sand mb-1"
              >
                Notice Content
              </label>
              <textarea
                id="notice-content"
                rows={4}
                placeholder="Describe the safety concern..."
                className="w-full px-3 py-2 rounded-lg border border-brand-charcoal/20 dark:border-brand-sand/20 bg-brand-sand dark:bg-brand-charcoal text-brand-charcoal dark:text-brand-sand text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal resize-y"
                disabled
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled
                className="px-4 py-2 rounded-lg bg-brand-teal text-white text-sm font-medium opacity-50 cursor-not-allowed"
              >
                Save Notice (coming soon)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing notices table */}
      <section aria-labelledby="notices-list-heading">
        <h2 id="notices-list-heading" className="sr-only">
          Safety Notices List
        </h2>

        <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Safety notices">
              <thead>
                <tr className="bg-brand-sand-100 dark:bg-brand-charcoal-700">
                  {noticeColumns.map((col) => (
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
                    colSpan={noticeColumns.length}
                    className="px-4 py-12 text-center text-gray-400 dark:text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl" aria-hidden="true">
                        ⚠️
                      </span>
                      <p className="font-medium">No safety notices yet</p>
                      <p className="text-xs">
                        Safety notices will be linked to species entries. Create
                        your first notice using the button above.
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Safety language reminder */}
      <div className="mt-6 p-3 rounded-lg bg-brand-earth-50 dark:bg-brand-earth-900/30 border border-brand-earth-200 dark:border-brand-earth-800">
        <p className="text-xs text-brand-earth-700 dark:text-brand-earth-300">
          <strong>Safety language reminder:</strong> Never use &quot;safe to
          eat&quot;, &quot;confirmed edible&quot;, or &quot;AI verified&quot;.
          Use &quot;commonly considered edible with expert confirmation&quot; and
          &quot;verify with a qualified expert before consuming&quot;.
        </p>
      </div>

      {/* Server-side notice */}
      <div className="mt-3 p-3 rounded-lg bg-brand-teal-50 dark:bg-brand-teal-900/30 border border-brand-teal-200 dark:border-brand-teal-800">
        <p className="text-xs text-brand-teal-700 dark:text-brand-teal-300">
          <strong>Note:</strong> Full CRUD operations for safety notices will be
          available when the species editor backend is connected. All changes are
          validated server-side via PocketBase.
        </p>
      </div>
    </div>
  );
}
