"use client";

/**
 * ForageWise — Admin Layout
 *
 * Shell layout for all /admin/* routes. Wraps content in ProtectedRoute
 * and SuperUserGate to ensure only authenticated super_users can access
 * admin tools. The /admin/login page is excluded from auth gates.
 *
 * Provides a sidebar/nav with links to:
 * - Dashboard
 * - Moderation
 * - Species Editor (future)
 * - Safety Notices
 *
 * Mobile-friendly: sidebar collapses to a horizontal nav on small screens.
 */

import { usePathname } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/auth/ProtectedRoute";
import SuperUserGate from "@/auth/SuperUserGate";

const adminLinks = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/dashboard", label: "Analytics", icon: "📈" },
  { href: "/admin/dashboard/users", label: "Users", icon: "👥" },
  { href: "/admin/dashboard/notifications", label: "Notifications", icon: "🔔" },
  { href: "/admin/dashboard/content", label: "Content", icon: "📝" },
  { href: "/admin/dashboard/retention", label: "Retention", icon: "📉" },
  { href: "/admin/dashboard/funnels", label: "Funnels", icon: "🔄" },
  { href: "/admin/dashboard/search", label: "Search", icon: "🔍" },
  { href: "/admin/dashboard/onboarding", label: "Onboarding", icon: "🚀" },
  { href: "/admin/dashboard/revenue", label: "Revenue", icon: "💰" },
  { href: "/admin/dashboard/alerts", label: "Alerts", icon: "🚨" },
  { href: "/admin/dashboard/releases", label: "Releases", icon: "📋" },
  { href: "/admin/dashboard/reviews", label: "Reviews", icon: "⭐" },
  { href: "/admin/moderation", label: "Moderation", icon: "🛡️" },
  { href: "/admin/safety-notices", label: "Safety Notices", icon: "⚠️" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // The login page should not be wrapped in auth gates
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute>
      <SuperUserGate
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h1 className="text-xl font-heading font-semibold text-brand-charcoal dark:text-brand-sand">
              Admin Access Required
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
              This area is restricted to Super Users. If you believe you should
              have access, contact an administrator.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal-600 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
            >
              Return Home
            </Link>
          </div>
        }
      >
        <div className="min-h-screen">
          {/* Mobile horizontal nav */}
          <nav
            className="md:hidden overflow-x-auto border-b border-brand-charcoal/10 dark:border-brand-sand/10 bg-brand-sand/80 dark:bg-brand-charcoal/80 backdrop-blur"
            aria-label="Admin navigation"
          >
            <div className="flex gap-1 px-3 py-2 min-w-max">
              {adminLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/admin" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-brand-teal text-white"
                        : "text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal-50 dark:hover:bg-brand-teal-900"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span aria-hidden="true">{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="flex">
            {/* Desktop sidebar */}
            <aside
              className="hidden md:flex md:flex-col md:w-56 md:shrink-0 border-r border-brand-charcoal/10 dark:border-brand-sand/10 bg-brand-sand/50 dark:bg-brand-charcoal/50 min-h-[calc(100vh-3rem)]"
              aria-label="Admin navigation"
            >
              <div className="px-4 py-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-teal">
                  Admin Panel
                </h2>
              </div>
              <nav className="flex-1 px-2 space-y-1">
                {adminLinks.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/admin" && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-brand-teal text-white"
                          : "text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal-50 dark:hover:bg-brand-teal-900"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span aria-hidden="true" className="text-base">
                        {link.icon}
                      </span>
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="px-4 py-3 border-t border-brand-charcoal/10 dark:border-brand-sand/10">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Server-side role validation active
                </p>
              </div>
            </aside>

            {/* Main content area */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </SuperUserGate>
    </ProtectedRoute>
  );
}
