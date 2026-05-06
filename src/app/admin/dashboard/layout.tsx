'use client';

/**
 * ForageWise — Admin Dashboard Layout
 *
 * Simple wrapper that provides consistent padding for all dashboard sub-pages.
 * Navigation is handled by the parent admin sidebar.
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 p-4 md:p-6">
      {children}
    </div>
  );
}
