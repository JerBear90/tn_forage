/**
 * Admin service layer barrel file.
 *
 * Re-exports computation utilities used by service modules and tests.
 */

export {
  filterByTimeRange,
  resolvePreset,
  startOfDay,
  endOfDay,
} from './computations/timeRange';

export {
  topN,
  average,
  percentile,
  groupByTimeBucket,
} from './computations/aggregation';

export { recordPageView, recordUsageEvent, recordSearchQuery, FEATURE_KEYS } from './eventCapture';
export type { FeatureKey } from './eventCapture';

export { initErrorCapture, recordError } from './errorCapture';

export { initSessionTracking, recordActivity } from './sessionTracking';

export { getPageViewSummary, getSessionSummary, getActiveUserCount } from './analyticsService';

export { getErrorLogs, getErrorSummary, toggleErrorResolved } from './errorService';
export type { ErrorLogResult, ErrorSummary } from './errorService';

export { getFeedbackSummary, getFeedbackList } from './feedbackService';
export type { FeedbackRecord, FeedbackSummary, FeedbackListResult } from './feedbackService';

export { computeAverageRating, computeRatingDistribution, filterByRating } from './computations/feedback';

export { identifyLowRatingPages, identifyHighErrorPages, generateInsights } from './computations/insights';
export type { Insight } from './computations/insights';

export {
  computeDAU,
  computeWAU,
  computeMAU,
  computeChurnRate,
  computeReturnRate,
  generateCohortTable,
} from './computations/retention';

export { getRetentionMetrics } from './retentionService';

export { computeConversionRates, validateMonotonicity } from './computations/funnel';

export {
  computeTopTerms,
  computeZeroResultSearches,
  computeClickThroughRate,
  identifyContentGaps,
} from './computations/search';

export { getFunnelData } from './funnelService';

export { getSearchAnalytics } from './searchService';
export type { SearchAnalytics } from './searchService';

export { getOnboardingMetrics, ONBOARDING_MILESTONES } from './onboardingService';
export type { OnboardingMetrics, OnboardingMilestone } from './onboardingService';

export { searchUsers, changeUserRole, toggleUserStatus } from './userService';

export { sendNotification, checkDuplicate, getNotificationHistory } from './notificationService';
export type { NotificationHistoryResult } from './notificationService';

export {
  getSightings,
  moderateSighting,
  getBlogArticles,
  createBlogArticle,
  updateBlogArticle,
  unpublishBlogArticle,
} from './contentService';
export type {
  SightingStatus,
  ModerationAction,
  SightingRecord,
  SightingListResult,
  BlogArticle,
  BlogArticleListResult,
  BlogArticleData,
} from './contentService';

export { computeMRR, computeConversionRate, computeSubscriptionChurn } from './computations/revenue';
export type { SubscriptionInput } from './computations/revenue';

export { getRevenueMetrics } from './revenueService';
export type { RevenueMetrics } from './revenueService';

export {
  checkPocketBaseHealth,
  getSyncQueueDepth,
  getServiceWorkerStatus,
  getSystemHealth,
} from './healthService';
export type {
  PocketBaseStatus,
  ServiceWorkerStatus,
  PocketBaseHealthResult,
  SystemHealthData,
} from './healthService';

export {
  detectErrorSpike,
  detectTrafficDrop,
  detectConnectionFailure,
  shouldResolve,
} from './computations/anomaly';

export {
  getAlertConfig,
  updateAlertConfig,
  getActiveAlerts,
  getAlertHistory,
  acknowledgeAlert,
  resolveAlert,
  checkForAnomalies,
} from './alertService';

export { exportData } from './exportService';
