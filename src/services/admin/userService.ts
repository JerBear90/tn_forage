/**
 * ForageWise — Admin User Management Service
 *
 * Provides search, pagination, role change, and disable/enable functions
 * for the admin user management page.
 */

import { pb } from '@/auth/authService';
import type { AdminUser, UserSearchParams, UserSearchResult } from '@/types/admin-dashboard';

/**
 * Search and paginate users from the PocketBase `users` collection.
 *
 * @param params - Search, pagination, and sorting parameters.
 * @returns Paginated user search result.
 */
export async function searchUsers(params: UserSearchParams): Promise<UserSearchResult> {
  const { query, page, perPage, sortBy, sortOrder } = params;

  // Build the sort string for PocketBase
  const sortPrefix = sortOrder === 'desc' ? '-' : '+';
  // Map our field names to PocketBase field names
  const fieldMap: Record<string, string> = {
    name: 'name',
    email: 'email',
    lastActiveAt: 'lastActiveAt',
    createdAt: 'created',
  };
  const sortField = fieldMap[sortBy] ?? 'created';
  const sort = `${sortPrefix}${sortField}`;

  // Build filter for search query (name or email contains query, case-insensitive)
  let filter = '';
  if (query.trim()) {
    const escaped = query.trim().replace(/'/g, "\\'");
    filter = `name ~ '${escaped}' || email ~ '${escaped}'`;
  }

  const result = await pb.collection('users').getList(page, perPage, {
    sort,
    filter: filter || undefined,
  });

  const users: AdminUser[] = result.items.map((record) => ({
    id: record.id,
    name: (record['name'] as string) ?? '',
    email: (record['email'] as string) ?? '',
    role: ((record['role'] as string) ?? 'free') as AdminUser['role'],
    membershipPlan: ((record['membershipPlan'] as string) ?? 'free') as AdminUser['membershipPlan'],
    lastActiveAt: (record['lastActiveAt'] as string) ?? (record['updated'] as string) ?? '',
    totalSessions: (record['totalSessions'] as number) ?? 0,
    accountStatus: record['disabled'] ? 'disabled' : 'active',
    createdAt: (record['created'] as string) ?? '',
  }));

  return {
    users,
    totalCount: result.totalItems,
    page: result.page,
    totalPages: result.totalPages,
  };
}

/**
 * Change a user's role.
 *
 * @param userId - The PocketBase user record ID.
 * @param newRole - The new role to assign ('free', 'member', or 'super_user').
 */
export async function changeUserRole(userId: string, newRole: string): Promise<void> {
  await pb.collection('users').update(userId, { role: newRole });
}

/**
 * Enable or disable a user account.
 *
 * @param userId - The PocketBase user record ID.
 * @param disabled - true to disable, false to re-enable.
 */
export async function toggleUserStatus(userId: string, disabled: boolean): Promise<void> {
  await pb.collection('users').update(userId, { disabled });
}

/**
 * Change a user's membership plan.
 *
 * @param userId - The PocketBase user record ID.
 * @param plan - The new membership plan ('free', 'monthly', 'yearly', or 'lifetime').
 */
export async function changeMembershipPlan(userId: string, plan: string): Promise<void> {
  // Update the membership plan and set role to 'member' if upgrading from free
  const updates: Record<string, unknown> = { membershipPlan: plan };
  if (plan !== 'free') {
    updates.role = 'member';
  }
  await pb.collection('users').update(userId, updates);
}
