/**
 * ForageWise — Admin Dashboard TypeScript type definitions
 *
 * These types define the shape of data used throughout the admin dashboard
 * for analytics, monitoring, user management, notifications, retention,
 * funnels, search analytics, anomaly detection, and data export.
 */

// ---------------------------------------------------------------------------
// Time Range
// ---------------------------------------------------------------------------

/** A resolved time range with human-readable label */
export interface TimeRange {
  label: string;
  startDate: Date;
  endDate: Date;
}

/** Preset time range options for the dashboard selector */
export type TimeRangePreset = 'today' | '7d' | '30d' | '90d' | 'custom';

// ---------------------------------------------------------------------------
// Event Capture Types
// ---------------------------------------------------------------------------

/** A single page view event recorded by the analytics capture layer */
export interface PageViewEvent {
  id: string;
  path: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
}

/** A client-side error log entry captured by the global error handler */
export interface ErrorLogEntry {
  id: string;
  message: string;
  stack: string;
  pageUrl: string;
  timestamp: string;
  browser: string;
  userId?: string;
  resolved?: boolean;
}

/** A search query event recorded when a user performs a search */
export interface SearchQueryEvent {
  id: string;
  term: string;
  timestamp: string;
  resultsCount: number;
  clickedResult: boolean;
  userId?: string;
}

// ---------------------------------------------------------------------------
// Analytics Summary Types
// ---------------------------------------------------------------------------

/** Summary of page view analytics for a given time range */
export interface PageViewSummary {
  totalViews: number;
  timeSeriesData: TimeSeriesPoint[];
  topPages: RankedItem[];
}

/** A single data point in a time-series chart */
export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

/** A ranked item with label and count (used for top pages, top searches, etc.) */
export interface RankedItem {
  label: string;
  count: number;
}

/** Summary of session duration analytics */
export interface SessionSummary {
  averageDuration: number; // seconds
  distribution: DistributionBucket[];
  totalSessions: number;
}

/** A bucket in a distribution chart (e.g., session duration ranges) */
export interface DistributionBucket {
  label: string;
  min: number;
  max: number;
  count: number;
}

// ---------------------------------------------------------------------------
// User Management
// ---------------------------------------------------------------------------

/** An admin-facing user record for the user management table */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'free' | 'member' | 'super_user';
  membershipPlan: 'free' | 'monthly' | 'yearly' | 'lifetime';
  lastActiveAt: string;
  totalSessions: number;
  accountStatus: 'active' | 'disabled';
  createdAt: string;
}

/** Parameters for searching and paginating the user list */
export interface UserSearchParams {
  query: string;
  page: number;
  perPage: number;
  sortBy: 'name' | 'email' | 'lastActiveAt' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

/** Paginated result set from a user search */
export interface UserSearchResult {
  users: AdminUser[];
  totalCount: number;
  page: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

/** Target audience for a push notification */
export type NotificationTarget =
  | { type: 'all' }
  | { type: 'region'; region: string }
  | { type: 'role'; role: string };

/** A draft notification ready to be sent */
export interface NotificationDraft {
  title: string;
  body: string;
  linkUrl?: string;
  target: NotificationTarget;
}

/** A notification that has been sent with delivery metadata */
export interface SentNotification {
  id: string;
  title: string;
  body: string;
  linkUrl?: string;
  target: NotificationTarget;
  recipientCount: number;
  sentAt: string;
  status: 'delivered' | 'partial' | 'failed';
}

// ---------------------------------------------------------------------------
// Retention Metrics
// ---------------------------------------------------------------------------

/** Retention metrics including DAU/WAU/MAU, churn, and cohort data */
export interface RetentionMetrics {
  dau: number;
  wau: number;
  mau: number;
  churnRate: number;    // 0-1
  returnRate: number;   // 0-1
  cohortTable: CohortRow[];
}

/** A single row in the cohort retention table */
export interface CohortRow {
  cohortWeek: string;           // ISO week start date
  totalUsers: number;
  retentionByWeek: number[];    // percentages for week 1, 2, 3...
}

// ---------------------------------------------------------------------------
// Funnel Tracking
// ---------------------------------------------------------------------------

/** A single step in a conversion funnel */
export interface FunnelStep {
  name: string;
  userCount: number;
  conversionRate: number; // percentage from previous step
  highlighted: boolean;   // true if conversion < 20%
}

/** A named funnel with its ordered steps */
export interface FunnelData {
  name: string;
  steps: FunnelStep[];
}

// ---------------------------------------------------------------------------
// Anomaly Detection
// ---------------------------------------------------------------------------

/** Types of anomalies the system can detect */
export type AnomalyType = 'error_spike' | 'traffic_drop' | 'connection_failure';

/** Severity levels for anomaly alerts */
export type AlertSeverity = 'warning' | 'critical';

/** Lifecycle status of an anomaly alert */
export type AlertStatus = 'active' | 'resolved' | 'acknowledged';

/** An anomaly alert record */
export interface AnomalyAlert {
  id: string;
  type: AnomalyType;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  metricValue: number;
  threshold: number;
  detectedAt: string;
  resolvedAt?: string;
}

/** Configuration for anomaly detection thresholds */
export interface AnomalyConfig {
  errorSpikeMultiplier: number;       // default: 3
  trafficDropThreshold: number;       // default: 0.5 (50%)
  connectionFailureMinutes: number;   // default: 5
  emailRecipients: string[];
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** Supported export file formats */
export type ExportFormat = 'json' | 'csv';

/** Options for generating a data export */
export interface ExportOptions {
  format: ExportFormat;
  timeRange: TimeRange;
  sections: ('pageViews' | 'sessions' | 'errors' | 'feedback')[];
  includeOptOutDisclaimer: boolean;
}

/** Result of a completed data export */
export interface ExportResult {
  blob: Blob;
  filename: string;
  recordCount: number;
}

// ---------------------------------------------------------------------------
// Chart Configuration
// ---------------------------------------------------------------------------

/** Brand-consistent chart colors for Recharts visualizations */
export const CHART_COLORS = {
  primary: 'var(--brand-teal)',
  secondary: 'var(--brand-moss)',
  tertiary: 'var(--brand-earth)',
  quaternary: 'var(--brand-forest)',
  background: 'var(--brand-sand)',
  text: '#e5e7eb',
  grid: 'rgba(255, 255, 255, 0.1)',
} as const;

/** Recharts theme configuration using brand tokens */
export const CHART_THEME = {
  fontFamily: 'inherit',
  fontSize: 12,
  colors: [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.tertiary,
    CHART_COLORS.quaternary,
  ],
} as const;
