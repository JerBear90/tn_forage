"use client";

/**
 * ForageWise — Admin Dashboard
 *
 * Landing page for the admin panel. Provides quick links to all
 * admin tools: Moderation, Species Editor, and Safety Notices.
 */

import Link from "next/link";

const adminSections = [
  {
    href: "/admin/moderation",
    icon: "🛡️",
    title: "Content Moderation",
    description:
      "Review flagged content, manage community posts, and handle reported items.",
  },
  {
    href: "/admin/species-editor",
    icon: "🍄",
    title: "Species Editor",
    description:
      "Create and edit species entries, update identification data, and manage images.",
  },
  {
    href: "/admin/safety-notices",
    icon: "⚠️",
    title: "Safety Notices",
    description:
      "Create and edit safety notices for species. Manage warnings and expert guidance.",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="p-4 md:p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-brand-charcoal dark:text-brand-sand">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage content, species data, and safety notices for ForageWise.
        </p>
      </div>

      {/* Server-side validation notice */}
      <div className="mb-6 p-3 rounded-lg bg-brand-teal-50 dark:bg-brand-teal-900/30 border border-brand-teal-200 dark:border-brand-teal-800">
        <p className="text-xs text-brand-teal-700 dark:text-brand-teal-300">
          <strong>Security note:</strong> All admin actions are validated
          server-side via PocketBase. This UI gate supplements but does not
          replace server-side role checks.
        </p>
      </div>

      {/* Section cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group flex flex-col p-4 rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal-800 hover:border-brand-teal dark:hover:border-brand-teal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            <span className="text-2xl mb-3" aria-hidden="true">
              {section.icon}
            </span>
            <h2 className="text-base font-heading font-semibold text-brand-charcoal dark:text-brand-sand group-hover:text-brand-teal transition-colors">
              {section.title}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
