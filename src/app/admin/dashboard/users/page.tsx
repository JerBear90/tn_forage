'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AdminUser, UserSearchParams, UserSearchResult } from '@/types/admin-dashboard';
import { searchUsers, changeUserRole, toggleUserStatus, changeMembershipPlan } from '@/services/admin/userService';

const ROLES: AdminUser['role'][] = ['free', 'member', 'super_user'];
const MEMBERSHIP_PLANS = ['free', 'monthly', 'yearly', 'lifetime'] as const;
const PER_PAGE = 20;

export default function UsersManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<UserSearchParams['sortBy']>('createdAt');
  const [sortOrder, setSortOrder] = useState<UserSearchParams['sortOrder']>('desc');
  const [result, setResult] = useState<UserSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({ open: false, title: '', message: '', onConfirm: async () => {} });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchUsers({ query: debouncedQuery, page, perPage: PER_PAGE, sortBy, sortOrder });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, page, sortBy, sortOrder]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSort = (field: UserSearchParams['sortBy']) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleRoleChange = (user: AdminUser, newRole: string) => {
    setConfirmDialog({
      open: true,
      title: 'Change User Role',
      message: `Change ${user.name || user.email}'s role from "${user.role}" to "${newRole}"?`,
      onConfirm: async () => {
        await changeUserRole(user.id, newRole);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        fetchUsers();
      },
    });
  };

  const handleMembershipChange = (user: AdminUser, newPlan: string) => {
    setConfirmDialog({
      open: true,
      title: 'Change Membership Plan',
      message: `Change ${user.name || user.email}'s membership from "${user.membershipPlan}" to "${newPlan}"?${newPlan !== 'free' ? ' This will also set their role to "member".' : ''}`,
      onConfirm: async () => {
        await changeMembershipPlan(user.id, newPlan);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        fetchUsers();
      },
    });
  };

  const handleToggleStatus = (user: AdminUser) => {
    const willDisable = user.accountStatus === 'active';
    setConfirmDialog({
      open: true,
      title: willDisable ? 'Disable Account' : 'Enable Account',
      message: willDisable
        ? `Disable ${user.name || user.email}'s account? They won't be able to log in.`
        : `Re-enable ${user.name || user.email}'s account?`,
      onConfirm: async () => {
        await toggleUserStatus(user.id, willDisable);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        fetchUsers();
      },
    });
  };

  const getSortIndicator = (field: UserSearchParams['sortBy']) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-charcoal dark:text-brand-sand">User Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Search, view, and manage user accounts and memberships</p>
        </div>
        {result && <p className="text-sm text-gray-500 dark:text-gray-400">{result.totalCount} total user{result.totalCount !== 1 ? 's' : ''}</p>}
      </div>

      <div className="relative">
        <label htmlFor="user-search" className="sr-only">Search users</label>
        <input
          id="user-search"
          type="search"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-[44px] rounded-lg border border-brand-charcoal/20 bg-white px-4 py-2 text-brand-charcoal placeholder-gray-400 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30 dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand dark:placeholder-gray-500"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" role="alert">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-brand-charcoal/10 bg-brand-sand/30 dark:border-brand-sand/10 dark:bg-brand-charcoal/50">
              <th className="px-4 py-3"><button onClick={() => handleSort('name')} className="font-semibold text-brand-charcoal dark:text-brand-sand hover:text-brand-teal">Name{getSortIndicator('name')}</button></th>
              <th className="px-4 py-3"><button onClick={() => handleSort('email')} className="font-semibold text-brand-charcoal dark:text-brand-sand hover:text-brand-teal">Email{getSortIndicator('email')}</button></th>
              <th className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Role</th>
              <th className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Membership</th>
              <th className="px-4 py-3"><button onClick={() => handleSort('lastActiveAt')} className="font-semibold text-brand-charcoal dark:text-brand-sand hover:text-brand-teal">Last Active{getSortIndicator('lastActiveAt')}</button></th>
              <th className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Status</th>
              <th className="px-4 py-3 font-semibold text-brand-charcoal dark:text-brand-sand">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !result ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-brand-charcoal/60 dark:text-brand-sand/60">Loading users...</td></tr>
            ) : result && result.users.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-brand-charcoal/60 dark:text-brand-sand/60">No users found{debouncedQuery ? ` matching "${debouncedQuery}"` : ''}.</td></tr>
            ) : (
              result?.users.map((user) => (
                <tr key={user.id} className="border-b border-brand-charcoal/5 dark:border-brand-sand/5 hover:bg-brand-sand/50 dark:hover:bg-brand-charcoal/30">
                  <td className="px-4 py-3 font-medium text-brand-charcoal dark:text-brand-sand whitespace-nowrap">{user.name || '—'}</td>
                  <td className="px-4 py-3 text-brand-charcoal dark:text-brand-sand whitespace-nowrap">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      aria-label={`Role for ${user.name || user.email}`}
                      className="min-h-[36px] rounded border border-brand-charcoal/20 bg-white px-2 py-1 text-xs dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                    >
                      {ROLES.map((role) => (<option key={role} value={role}>{role.replace('_', ' ')}</option>))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.membershipPlan}
                      onChange={(e) => handleMembershipChange(user, e.target.value)}
                      aria-label={`Membership for ${user.name || user.email}`}
                      className="min-h-[36px] rounded border border-brand-charcoal/20 bg-white px-2 py-1 text-xs dark:border-brand-sand/20 dark:bg-brand-charcoal dark:text-brand-sand focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                    >
                      {MEMBERSHIP_PLANS.map((plan) => (<option key={plan} value={plan}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</option>))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{user.lastActiveAt ? formatDate(user.lastActiveAt) : '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={user.accountStatus} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      aria-label={user.accountStatus === 'active' ? `Disable ${user.name || user.email}` : `Enable ${user.name || user.email}`}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        user.accountStatus === 'active'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {user.accountStatus === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {result && result.totalPages > 1 && (
        <nav className="flex items-center justify-between" aria-label="Pagination">
          <p className="text-sm text-brand-charcoal/60 dark:text-brand-sand/60">Page {result.page} of {result.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand">Previous</button>
            <button onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))} disabled={page >= result.totalPages} className="rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-brand-sand/20 dark:text-brand-sand">Next</button>
          </div>
        </nav>
      )}

      {confirmDialog.open && (
        <ConfirmationDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        />
      )}
    </div>
  );
}


function StatusBadge({ status }: { status: AdminUser['accountStatus'] }) {
  const isActive = status === 'active';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }`}>
      {isActive ? 'Active' : 'Disabled'}
    </span>
  );
}

function ConfirmationDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => Promise<void>; onCancel: () => void }) {
  const [processing, setProcessing] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-brand-charcoal">
        <h2 className="text-lg font-bold text-brand-charcoal dark:text-brand-sand">{title}</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} disabled={processing} className="rounded-lg border border-brand-charcoal/20 px-4 py-2 text-sm font-medium dark:border-brand-sand/20 dark:text-brand-sand">Cancel</button>
          <button onClick={async () => { setProcessing(true); try { await onConfirm(); } finally { setProcessing(false); } }} disabled={processing} className="rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white hover:bg-brand-teal/90 disabled:opacity-50">{processing ? 'Processing...' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return '—'; }
}
