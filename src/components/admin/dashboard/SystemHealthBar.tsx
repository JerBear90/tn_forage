'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSystemHealth } from '@/services/admin/healthService';
import type { SystemHealthData, PocketBaseStatus, ServiceWorkerStatus } from '@/services/admin/healthService';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REFRESH_INTERVAL_MS = 30_000; // 30 seconds

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusColor(status: PocketBaseStatus | ServiceWorkerStatus): string {
  switch (status) {
    case 'connected':
    case 'active':
      return 'bg-green-500';
    case 'degraded':
    case 'updating':
      return 'bg-yellow-500';
    case 'disconnected':
    case 'error':
      return 'bg-red-500';
    case 'none':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

function getStatusLabel(status: PocketBaseStatus): string {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'degraded':
      return 'Degraded';
    case 'disconnected':
      return 'Disconnected';
    default:
      return 'Unknown';
  }
}

function getSwStatusLabel(status: ServiceWorkerStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'updating':
      return 'Updating';
    case 'error':
      return 'Error';
    case 'none':
      return 'Not Registered';
    default:
      return 'Unknown';
  }
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusDot({ status, label }: { status: PocketBaseStatus | ServiceWorkerStatus; label: string }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${getStatusColor(status)}`}
      aria-label={`${label} status: ${status}`}
    />
  );
}

function HealthIndicator({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: PocketBaseStatus | ServiceWorkerStatus;
}) {
  return (
    <div className="flex items-center gap-2 text-xs" aria-label={`${label}: ${value}`}>
      {status && <StatusDot status={status} label={label} />}
      <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">{label}:</span>
      <span className="font-medium text-brand-charcoal dark:text-brand-sand whitespace-nowrap">
        {value}
      </span>
    </div>
  );
}

function AlertBanner() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-3 flex items-center gap-2 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-4 py-2.5 text-sm font-medium text-red-700 dark:text-red-300"
    >
      <svg
        className="h-5 w-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
      <span>System health issue detected — one or more components are in an error state.</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse flex flex-wrap gap-4" aria-label="Loading system health data">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-700" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SystemHealthBar() {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const fetchHealth = useCallback(async () => {
    try {
      const data = await getSystemHealth();
      setHealth(data);
      setError(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check system health');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchHealth();

    const interval = setInterval(fetchHealth, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <section aria-label="System health monitoring">
      {/* Alert banner when any component is in error state */}
      {health?.hasError && <AlertBanner />}

      {/* Health indicators bar */}
      <div className="rounded-xl border border-brand-charcoal/10 dark:border-brand-sand/10 bg-white dark:bg-brand-charcoal-800 px-4 py-3 shadow-sm">
        {loading && !health ? (
          <LoadingSkeleton />
        ) : error && !health ? (
          <p className="text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : health ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <HealthIndicator
              label="PocketBase"
              value={getStatusLabel(health.pocketBase.status)}
              status={health.pocketBase.status}
            />
            <HealthIndicator
              label="Last Check"
              value={formatTimestamp(health.lastHealthCheck)}
            />
            <HealthIndicator
              label="Sync Queue"
              value={health.syncQueueDepth < 0 ? 'Error' : `${health.syncQueueDepth} pending`}
              status={health.syncQueueDepth < 0 ? 'error' : health.syncQueueDepth > 50 ? 'degraded' : 'connected'}
            />
            <HealthIndicator
              label="Service Worker"
              value={getSwStatusLabel(health.serviceWorkerStatus)}
              status={health.serviceWorkerStatus}
            />
            <HealthIndicator
              label="Avg Response"
              value={`${health.averageResponseTimeMs}ms`}
              status={
                health.averageResponseTimeMs > 2000
                  ? 'degraded'
                  : health.averageResponseTimeMs === 0 && health.pocketBase.status === 'disconnected'
                    ? 'disconnected'
                    : 'connected'
              }
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
