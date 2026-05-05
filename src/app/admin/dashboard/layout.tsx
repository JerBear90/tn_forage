'use client';

/**
 * ForageWise — Admin Dashboard Layout
 *
 * Provides horizontal tab navigation for all dashboard sub-pages.
 * Scrollable on mobile with proper touch targets and ARIA labels.
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const dashboardTabs = [
  { href: '/admin/dashboard', label: 'Overview' },
  { href: '/admin/dashboard/users', label: 'Users' },
  { href: '/admin/dashboard/notifications', label: 'Notifications' },
  { href: '/admin/dashboard/content', label: 'Content' },
  { href: '/admin/dashboard/retention', label: 'Retention' },
  { href: '/admin/dashboard/funnels', label: 'Funnels' },
  { href: '/admin/dashboard/search', label: 'Search' },
  { href: '/admin/dashboard/onboarding', label: 'Onboarding' },
  { href: '/admin/dashboard/revenue', label: 'Revenue' },
  { href: '/admin/dashboard/alerts', label: 'Alerts' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Tab navigation */}
      <nav
        className="border-b border-brand-charcoal/10 dark:border-brand-sand/10 bg-white/80 dark:bg-brand-charcoal/80 backdrop-blur sticky top-0 z-10"
        aria-label="Dashboard sub-navigation"
      >
        <div className="overflow-x-auto">
          <div className="flex gap-1 px-4 py-2 min-w-max">
            {dashboardTabs.map((tab) => {
              const isActive =
                tab.href === '/admin/dashboard'
                  ? pathname === '/admin/dashboard'
                  : pathname.startsWith(tab.href);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-brand-teal text-white'
                      : 'text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal-50 dark:hover:bg-brand-teal-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="flex-1 p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
