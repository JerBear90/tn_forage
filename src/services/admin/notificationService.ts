/**
 * ForageWise — Admin Notification Broadcasting Service
 *
 * Provides functions for sending push notifications to targeted user groups,
 * checking for duplicates within a 5-minute window, and retrieving
 * sent notification history.
 */

import { pb } from '@/auth/authService';
import type { NotificationDraft, NotificationTarget, SentNotification } from '@/types/admin-dashboard';

/** Result of fetching notification history */
export interface NotificationHistoryResult {
  items: SentNotification[];
  totalItems: number;
  totalPages: number;
}

/**
 * Check if a notification with the same title and body was sent within the last 5 minutes.
 *
 * @param title - Notification title to check.
 * @param body - Notification body to check.
 * @returns true if a duplicate exists within the 5-minute window.
 */
export async function checkDuplicate(title: string, body: string): Promise<boolean> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const escapedTitle = title.replace(/'/g, "\\'");
  const escapedBody = body.replace(/'/g, "\\'");

  const result = await pb.collection('admin_notifications').getList(1, 1, {
    filter: `title = '${escapedTitle}' && body = '${escapedBody}' && sentAt >= '${fiveMinutesAgo}'`,
  });

  return result.totalItems > 0;
}

/**
 * Send a push notification to the targeted audience.
 *
 * Checks for duplicates within a 5-minute window before sending.
 * Records the notification in the `admin_notifications` collection.
 *
 * @param draft - The notification draft containing title, body, optional link, and target.
 * @returns The number of recipients the notification was sent to.
 * @throws Error if a duplicate notification was sent within 5 minutes.
 */
export async function sendNotification(
  draft: NotificationDraft,
): Promise<{ recipientCount: number }> {
  // Check for duplicates
  const isDuplicate = await checkDuplicate(draft.title, draft.body);
  if (isDuplicate) {
    throw new Error(
      'A notification with the same title and body was sent within the last 5 minutes. Please wait before sending again.',
    );
  }

  // Determine recipient count based on target
  const recipientCount = await getRecipientCount(draft.target);

  // Build the target fields for PocketBase
  const targetType = draft.target.type;
  let targetValue = '';
  if (draft.target.type === 'region') {
    targetValue = draft.target.region;
  } else if (draft.target.type === 'role') {
    targetValue = draft.target.role;
  }

  // Record the notification in PocketBase
  await pb.collection('admin_notifications').create({
    title: draft.title,
    body: draft.body,
    linkUrl: draft.linkUrl || '',
    targetType,
    targetValue,
    recipientCount,
    sentAt: new Date().toISOString(),
    sentBy: pb.authStore.record?.id ?? '',
    status: 'delivered',
  });

  return { recipientCount };
}

/**
 * Get the count of recipients for a given notification target.
 *
 * @param target - The notification target criteria.
 * @returns The number of users matching the target.
 */
async function getRecipientCount(target: NotificationTarget): Promise<number> {
  let filter = 'disabled != true';

  if (target.type === 'region') {
    const escapedRegion = target.region.replace(/'/g, "\\'");
    filter += ` && region = '${escapedRegion}'`;
  } else if (target.type === 'role') {
    const escapedRole = target.role.replace(/'/g, "\\'");
    filter += ` && role = '${escapedRole}'`;
  }

  const result = await pb.collection('users').getList(1, 1, { filter });
  return result.totalItems;
}

/**
 * Fetch paginated notification history sorted by most recent first.
 *
 * @param page - Page number (1-indexed).
 * @param perPage - Number of items per page.
 * @returns Paginated notification history result.
 */
export async function getNotificationHistory(
  page: number = 1,
  perPage: number = 20,
): Promise<NotificationHistoryResult> {
  const result = await pb.collection('admin_notifications').getList(page, perPage, {
    sort: '-sentAt',
  });

  const items: SentNotification[] = result.items.map((record) => ({
    id: record.id,
    title: (record['title'] as string) ?? '',
    body: (record['body'] as string) ?? '',
    linkUrl: (record['linkUrl'] as string) || undefined,
    target: parseTarget(
      (record['targetType'] as string) ?? 'all',
      (record['targetValue'] as string) ?? '',
    ),
    recipientCount: (record['recipientCount'] as number) ?? 0,
    sentAt: (record['sentAt'] as string) ?? (record['created'] as string) ?? '',
    status: ((record['status'] as string) ?? 'delivered') as SentNotification['status'],
  }));

  return {
    items,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
  };
}

/**
 * Parse target type and value from PocketBase record into a NotificationTarget.
 */
function parseTarget(targetType: string, targetValue: string): NotificationTarget {
  switch (targetType) {
    case 'region':
      return { type: 'region', region: targetValue };
    case 'role':
      return { type: 'role', role: targetValue };
    default:
      return { type: 'all' };
  }
}
