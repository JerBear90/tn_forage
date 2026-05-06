/**
 * Anomaly detection and alert management service.
 *
 * Provides anomaly detection logic that checks current metrics against
 * configured thresholds, creates alerts when anomalies are detected,
 * and automatically resolves alerts when metrics return to normal range.
 * Also provides CRUD operations for alert management and configuration.
 */

import { pb } from '@/auth/authService';
import type {
  AnomalyAlert,
  AnomalyConfig,
  AnomalyType,
  AlertSeverity,
} from '@/types/admin-dashboard';
import {
  detectErrorSpike,
  detectTrafficDrop,
  detectConnectionFailure,
  shouldResolve,
} from './computations/anomaly';

// ---------------------------------------------------------------------------
// Default Configuration
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: AnomalyConfig = {
  errorSpikeMultiplier: 3,
  trafficDropThreshold: 0.5,
  connectionFailureMinutes: 5,
  emailRecipients: [],
};

// ---------------------------------------------------------------------------
// Alert Configuration
// ---------------------------------------------------------------------------

/**
 * Fetches the anomaly detection configuration from the admin_alert_config collection.
 * Returns the default configuration if no config record exists.
 */
export async function getAlertConfig(): Promise<AnomalyConfig> {
  try {
    const records = await pb.collection('admin_alert_config').getList(1, 1);
    if (records.items.length === 0) {
      return DEFAULT_CONFIG;
    }

    const record = records.items[0];
    return {
      errorSpikeMultiplier: record.errorSpikeMultiplier ?? DEFAULT_CONFIG.errorSpikeMultiplier,
      trafficDropThreshold: record.trafficDropThreshold ?? DEFAULT_CONFIG.trafficDropThreshold,
      connectionFailureMinutes: record.connectionFailureMinutes ?? DEFAULT_CONFIG.connectionFailureMinutes,
      emailRecipients: record.emailRecipients ?? DEFAULT_CONFIG.emailRecipients,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Updates the anomaly detection configuration.
 * Creates a new config record if none exists, otherwise updates the existing one.
 *
 * @param config - Partial configuration to merge with existing config
 */
export async function updateAlertConfig(config: Partial<AnomalyConfig>): Promise<void> {
  const records = await pb.collection('admin_alert_config').getList(1, 1);

  const data = {
    ...config,
    updatedAt: new Date().toISOString(),
  };

  if (records.items.length === 0) {
    await pb.collection('admin_alert_config').create({
      ...DEFAULT_CONFIG,
      ...data,
    });
  } else {
    await pb.collection('admin_alert_config').update(records.items[0].id, data);
  }
}

// ---------------------------------------------------------------------------
// Alert CRUD
// ---------------------------------------------------------------------------

/**
 * Fetches all active (non-resolved) alerts from the admin_alerts collection.
 *
 * @returns Array of active AnomalyAlert records
 */
export async function getActiveAlerts(): Promise<AnomalyAlert[]> {
  const records = await pb.collection('admin_alerts').getList(1, 50, {
    filter: 'status != "resolved"',
    sort: '-detectedAt',
  });

  return records.items.map(mapRecordToAlert);
}

/**
 * Fetches alert history with pagination.
 *
 * @param page - Page number (1-indexed)
 * @param perPage - Number of items per page
 * @returns Paginated alert history
 */
export async function getAlertHistory(
  page: number = 1,
  perPage: number = 20
): Promise<{ items: AnomalyAlert[]; totalItems: number; totalPages: number }> {
  const records = await pb.collection('admin_alerts').getList(page, perPage, {
    sort: '-detectedAt',
  });

  return {
    items: records.items.map(mapRecordToAlert),
    totalItems: records.totalItems,
    totalPages: records.totalPages,
  };
}

/**
 * Marks an alert as acknowledged by a super user.
 *
 * @param alertId - The ID of the alert to acknowledge
 */
export async function acknowledgeAlert(alertId: string): Promise<void> {
  await pb.collection('admin_alerts').update(alertId, {
    status: 'acknowledged',
  });
}

/**
 * Marks an alert as resolved with a resolution timestamp.
 *
 * @param alertId - The ID of the alert to resolve
 */
export async function resolveAlert(alertId: string): Promise<void> {
  await pb.collection('admin_alerts').update(alertId, {
    status: 'resolved',
    resolvedAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Anomaly Detection
// ---------------------------------------------------------------------------

/**
 * Runs all anomaly detection checks against current metrics.
 *
 * Fetches current error counts, active user counts, and health check data,
 * compares them against the 7-day averages and configured thresholds,
 * creates new alerts for detected anomalies, and automatically resolves
 * existing alerts when metrics return to normal range.
 *
 * @returns Array of currently active AnomalyAlert records
 */
export async function checkForAnomalies(): Promise<AnomalyAlert[]> {
  const config = await getAlertConfig();
  const activeAlerts = await getActiveAlerts();

  // Gather current metrics
  const [errorMetrics, trafficMetrics, connectionMetrics] = await Promise.all([
    getErrorMetrics(),
    getTrafficMetrics(),
    getConnectionMetrics(),
  ]);

  // Check for new anomalies
  const newAlerts: AnomalyAlert[] = [];

  // Error spike detection
  if (detectErrorSpike(errorMetrics.current, errorMetrics.sevenDayAvg, config.errorSpikeMultiplier)) {
    const existingAlert = activeAlerts.find((a) => a.type === 'error_spike');
    if (!existingAlert) {
      const alert = await createAlert({
        type: 'error_spike',
        severity: errorMetrics.current > errorMetrics.sevenDayAvg * config.errorSpikeMultiplier * 2
          ? 'critical'
          : 'warning',
        message: `Error count (${errorMetrics.current}) exceeds ${config.errorSpikeMultiplier}x the 7-day average (${Math.round(errorMetrics.sevenDayAvg)})`,
        metricValue: errorMetrics.current,
        threshold: errorMetrics.sevenDayAvg * config.errorSpikeMultiplier,
      });
      newAlerts.push(alert);
    }
  }

  // Traffic drop detection
  if (detectTrafficDrop(trafficMetrics.current, trafficMetrics.sevenDayAvg, config.trafficDropThreshold)) {
    const existingAlert = activeAlerts.find((a) => a.type === 'traffic_drop');
    if (!existingAlert) {
      const alert = await createAlert({
        type: 'traffic_drop',
        severity: trafficMetrics.current < trafficMetrics.sevenDayAvg * config.trafficDropThreshold * 0.5
          ? 'critical'
          : 'warning',
        message: `Active users (${trafficMetrics.current}) dropped below ${Math.round(config.trafficDropThreshold * 100)}% of the 7-day average (${Math.round(trafficMetrics.sevenDayAvg)})`,
        metricValue: trafficMetrics.current,
        threshold: trafficMetrics.sevenDayAvg * config.trafficDropThreshold,
      });
      newAlerts.push(alert);
    }
  }

  // Connection failure detection
  if (detectConnectionFailure(connectionMetrics.lastSuccessfulCheckMs, config.connectionFailureMinutes)) {
    const existingAlert = activeAlerts.find((a) => a.type === 'connection_failure');
    if (!existingAlert) {
      const elapsedMinutes = Math.round((Date.now() - connectionMetrics.lastSuccessfulCheckMs) / 60000);
      const alert = await createAlert({
        type: 'connection_failure',
        severity: elapsedMinutes > config.connectionFailureMinutes * 2 ? 'critical' : 'warning',
        message: `PocketBase connection failure for ${elapsedMinutes} minutes (threshold: ${config.connectionFailureMinutes} min)`,
        metricValue: elapsedMinutes,
        threshold: config.connectionFailureMinutes,
      });
      newAlerts.push(alert);
    }
  }

  // Auto-resolve existing alerts when metrics return to normal
  for (const alert of activeAlerts) {
    let currentValue: number;
    let sevenDayAvg: number;

    switch (alert.type) {
      case 'error_spike':
        currentValue = errorMetrics.current;
        sevenDayAvg = errorMetrics.sevenDayAvg;
        break;
      case 'traffic_drop':
        currentValue = trafficMetrics.current;
        sevenDayAvg = trafficMetrics.sevenDayAvg;
        break;
      case 'connection_failure':
        currentValue = connectionMetrics.lastSuccessfulCheckMs;
        sevenDayAvg = 0; // Not used for connection failure
        break;
      default:
        continue;
    }

    if (shouldResolve(alert.type, currentValue, sevenDayAvg, config)) {
      await resolveAlert(alert.id);
    }
  }

  // Return all currently active alerts (including newly created ones)
  return getActiveAlerts();
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

interface MetricData {
  current: number;
  sevenDayAvg: number;
}

interface ConnectionMetricData {
  lastSuccessfulCheckMs: number;
}

/**
 * Fetches current error count and 7-day average from analytics_errors.
 */
async function getErrorMetrics(): Promise<MetricData> {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Current error count (last 24 hours)
    const currentRecords = await pb.collection('analytics_errors').getList(1, 1, {
      filter: `timestamp >= "${oneDayAgo.toISOString()}"`,
    });

    // 7-day error count for average
    const weekRecords = await pb.collection('analytics_errors').getList(1, 1, {
      filter: `timestamp >= "${sevenDaysAgo.toISOString()}"`,
    });

    const current = currentRecords.totalItems;
    const sevenDayAvg = weekRecords.totalItems / 7;

    return { current, sevenDayAvg };
  } catch {
    return { current: 0, sevenDayAvg: 0 };
  }
}

/**
 * Fetches current active user count and 7-day average from analytics_sessions.
 */
async function getTrafficMetrics(): Promise<MetricData> {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Current active users (sessions with activity in last 5 minutes)
    const currentRecords = await pb.collection('analytics_sessions').getList(1, 1, {
      filter: `endedAt >= "${fiveMinutesAgo.toISOString()}"`,
    });

    // 7-day average daily active users
    const weekRecords = await pb.collection('analytics_sessions').getList(1, 1, {
      filter: `startedAt >= "${sevenDaysAgo.toISOString()}"`,
    });

    const current = currentRecords.totalItems;
    const sevenDayAvg = weekRecords.totalItems / 7;

    return { current, sevenDayAvg };
  } catch {
    return { current: 0, sevenDayAvg: 0 };
  }
}

/**
 * Gets the timestamp of the last successful PocketBase health check.
 */
async function getConnectionMetrics(): Promise<ConnectionMetricData> {
  try {
    const start = performance.now();
    await pb.health.check();
    const responseTime = performance.now() - start;

    // If health check succeeds, the last successful check is now
    // If it takes too long (>2s), still counts as successful but degraded
    if (responseTime < 10000) {
      return { lastSuccessfulCheckMs: Date.now() };
    }

    return { lastSuccessfulCheckMs: Date.now() - responseTime };
  } catch {
    // Health check failed — use a timestamp far enough in the past
    // to potentially trigger the connection failure alert
    // We check if there's a stored last-success timestamp
    try {
      const alerts = await pb.collection('admin_alerts').getList(1, 1, {
        filter: 'type = "connection_failure" && status = "active"',
        sort: '-detectedAt',
      });

      if (alerts.items.length > 0) {
        // Use the detection time as a proxy for when connection was last good
        const detectedAt = new Date(alerts.items[0].detectedAt).getTime();
        return { lastSuccessfulCheckMs: detectedAt - 5 * 60 * 1000 };
      }
    } catch {
      // Can't reach PocketBase at all
    }

    // Default: assume connection has been down for longer than threshold
    return { lastSuccessfulCheckMs: Date.now() - 10 * 60 * 1000 };
  }
}

/**
 * Creates a new alert record in the admin_alerts collection.
 */
async function createAlert(params: {
  type: AnomalyType;
  severity: AlertSeverity;
  message: string;
  metricValue: number;
  threshold: number;
}): Promise<AnomalyAlert> {
  const record = await pb.collection('admin_alerts').create({
    type: params.type,
    severity: params.severity,
    status: 'active',
    message: params.message,
    metricValue: params.metricValue,
    threshold: params.threshold,
    detectedAt: new Date().toISOString(),
  });

  return mapRecordToAlert(record);
}

/**
 * Maps a PocketBase record to an AnomalyAlert interface.
 */
function mapRecordToAlert(record: Record<string, unknown>): AnomalyAlert {
  return {
    id: record.id as string,
    type: record.type as AnomalyType,
    severity: record.severity as AlertSeverity,
    status: record.status as 'active' | 'resolved' | 'acknowledged',
    message: record.message as string,
    metricValue: record.metricValue as number,
    threshold: record.threshold as number,
    detectedAt: record.detectedAt as string,
    resolvedAt: record.resolvedAt as string | undefined,
  };
}
