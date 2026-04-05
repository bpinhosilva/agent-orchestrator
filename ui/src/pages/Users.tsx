import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Trash2,
  Crown,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContextInstance';
import { usersApi, type User as UserType } from '../api/users';
import UserAvatar from '../components/UserAvatar';
import ConfirmDialog from '../components/ConfirmDialog';
import CreateUserModal from '../components/CreateUserModal';

/* ─────────────────────────── constants ─────────────────────────── */

const PAGE_SIZE = 15;
const SEARCH_DEBOUNCE_MS = 300;

/* ─────────────────────────── helpers ─────────────────────────── */

function RoleBadge({ role }: { role?: string }) {
  const isAdmin = role === 'admin';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
        isAdmin
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/20'
      }`}
    >
      {isAdmin ? <Crown size={9} /> : <User size={9} />}
      {isAdmin ? 'Admin' : 'Member'}
    </span>
  );
}

function UserRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-outline-variant/10 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-surface-container-highest/50" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-surface-container-highest/50 rounded w-36" />
        <div className="h-2.5 bg-surface-container-highest/40 rounded w-52" />
      </div>
      <div className="h-5 bg-surface-container-highest/40 rounded-full w-16" />
      <div className="h-3 bg-surface-container-highest/30 rounded w-20" />
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-surface-container-highest/30 rounded-lg" />
        <div className="h-8 w-8 bg-surface-container-highest/30 rounded-lg" />
      </div>
    </div>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* ═══════════════════════════ MAIN PAGE ════════════════════════════ */

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin';

  /* ── data ── */
  const [users, setUsers] = useState<UserType[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  /* ── search ── */
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  /* ── pagination ── */
  const [currentPage, setCurrentPage] = useState(1);

  /* ── role edit ── */
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [roleUpdateSuccess, setRoleUpdateSuccess] = useState<string | null>(null);

  /* ── delete ── */
  const [deleteTarget, setDeleteTarget] = useState<UserType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ── create modal ── */
  const [showCreateModal, setShowCreateModal] = useState(false);

  /* ── toast ── */
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  /* ── fetch ── */
  const fetchUsers = useCallback(async (page: number, searchTerm: string) => {
    setIsLoading(true);
    setFetchError('');
    try {
      const data = await usersApi.findAll({
        page,
        limit: PAGE_SIZE,
        search: searchTerm || undefined,
      });
      setUsers(data.items);
      setTotalUsers(data.total);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    if (isAdmin) {
      void fetchUsers(currentPage, debouncedSearch);
    }
  }, [currentPage, debouncedSearch, fetchUsers, isAdmin]);

  /* ── guard ── */
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const adminsOnPage = users.filter((u) => u.role === 'admin').length;
  const membersOnPage = users.filter((u) => u.role !== 'admin').length;

  /* ── pagination derived values ── */
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = totalUsers === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = totalUsers === 0 ? 0 : Math.min(safePage * PAGE_SIZE, totalUsers);

  /* reset to page 1 whenever search changes */
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  /* ── role update ── */
  const handleRoleChange = async (userId: string, newRole: string) => {
    setRoleUpdating(userId);
    try {
      await usersApi.updateRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      setRoleUpdateSuccess(userId);
      setEditingRoleId(null);
      setTimeout(() => setRoleUpdateSuccess(null), 2500);
      showToast('Role updated successfully.');
    } catch {
      showToast('Failed to update role.', 'error');
    } finally {
      setRoleUpdating(null);
    }
  };

  /* ── delete ── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await usersApi.deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      const nextPage = users.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(nextPage);
      if (nextPage === currentPage) {
        await fetchUsers(nextPage, debouncedSearch);
      }
      showToast(`${deleteTarget.name} ${deleteTarget.last_name} removed successfully.`);
    } catch {
      showToast('Failed to delete user.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-full pb-16 relative">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] bg-primary/3 blur-[160px] rounded-full -z-0" />
      <div className="pointer-events-none fixed bottom-0 left-64 w-[400px] h-[400px] bg-tertiary/3 blur-[120px] rounded-full -z-0" />

      {/* ── Header ── */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <UsersIcon size={20} />
            </div>
            <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
              User Directory
            </h1>
          </div>
          <p className="text-sm text-on-surface-variant ml-14">
            Manage identity nodes and access clearances across the network.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            id="users-refresh-btn"
            type="button"
            onClick={() => void fetchUsers(currentPage, debouncedSearch)}
            disabled={isLoading}
            className="p-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/20 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            id="users-create-btn"
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-primary text-on-primary hover:brightness-110 active:scale-95 transition-all shadow-[0_8px_24px_rgba(173,198,255,0.2)]"
          >
            <UserPlus size={16} />
            Provision User
          </button>
        </div>
      </header>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
        <div className="glass-panel ghost-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <UsersIcon size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Total Users
            </p>
            <p className="font-headline font-extrabold text-xl text-on-surface">
              {isLoading ? '…' : totalUsers}
            </p>
          </div>
        </div>
        <div className="glass-panel ghost-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
            <Crown size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Admins on Page
            </p>
            <p className="font-headline font-extrabold text-xl text-on-surface">
              {isLoading ? '…' : adminsOnPage}
            </p>
          </div>
        </div>
        <div className="glass-panel ghost-border rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-tertiary/10 text-tertiary">
            <User size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Members on Page
            </p>
            <p className="font-headline font-extrabold text-xl text-on-surface">
              {isLoading ? '…' : membersOnPage}
            </p>
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-4 z-10">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50"
        />
        <input
          id="users-search"
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full bg-surface-container-low rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface border border-outline-variant/15 focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-on-surface-variant/40 transition-all"
        />
      </div>

      {/* ── User table ── */}
      <div className="glass-panel ghost-border rounded-2xl overflow-hidden relative z-10">

        {/* Loading */}
        {isLoading && (
          <>
            <UserRowSkeleton />
            <UserRowSkeleton />
            <UserRowSkeleton />
            <UserRowSkeleton />
          </>
        )}

        {/* Error */}
        {!isLoading && fetchError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="p-3 rounded-full bg-error/10 text-error">
              <AlertCircle size={24} />
            </div>
            <p className="text-sm font-semibold text-on-surface">{fetchError}</p>
            <button
              type="button"
              onClick={() => void fetchUsers(currentPage, debouncedSearch)}
              className="text-xs text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !fetchError && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="p-3 rounded-full bg-surface-container-high text-on-surface-variant">
              <UsersIcon size={24} />
            </div>
            <p className="text-sm font-semibold text-on-surface">
              {debouncedSearch ? 'No users match your search.' : 'No users found.'}
            </p>
            {!debouncedSearch && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <UserPlus size={12} /> Provision the first user
              </button>
            )}
          </div>
        )}

        {/* Single table — thead + tbody share colgroup widths; alignment is guaranteed */}
        {!isLoading && !fetchError && users.length > 0 && (
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col style={{ width: '28%' }} />
              <col style={{ width: '28%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-high/40">
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.15em]">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.15em]">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.15em]">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.15em]">Joined</th>
                <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.15em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isEditingRole = editingRoleId === u.id;
                const isUpdatingRole = roleUpdating === u.id;
                const justUpdated = roleUpdateSuccess === u.id;
                const displayName = `${u.name} ${u.last_name}`.trim();

                return (
                  <tr
                    key={u.id}
                    onClick={() => navigate(`/users/${u.id}`)}
                    className="group border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors last:border-b-0 cursor-pointer"
                  >
                    {/* Name + Avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={displayName}
                          avatar={u.avatar}
                          avatarUrl={u.avatarUrl}
                          alt={displayName}
                          className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-outline-variant/20 flex-shrink-0"
                        />
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {displayName}
                          {isSelf && (
                            <span className="ml-2 text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                              You
                            </span>
                          )}
                        </p>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                      <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      {justUpdated ? (
                        <span className="flex items-center gap-1 text-xs text-secondary font-medium">
                          <CheckCircle2 size={13} /> Updated
                        </span>
                      ) : isEditingRole ? (
                        <div className="relative">
                          <select
                            id={`users-role-select-${u.id}`}
                            defaultValue={u.role ?? 'user'}
                            disabled={isSelf || isUpdatingRole}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              void handleRoleChange(u.id, (e.target as HTMLSelectElement).value);
                            }}
                            className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-lg border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/40 pl-3 pr-7 py-1.5 appearance-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="user">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                        </div>
                      ) : (
                        <RoleBadge role={u.role} />
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4">
                      <p className="text-[11px] text-on-surface-variant">{formatDate(u.createdAt)}</p>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isSelf && (
                          <button
                            id={`users-edit-role-${u.id}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRoleId(isEditingRole ? null : u.id);
                            }}
                            disabled={isUpdatingRole}
                            title={isEditingRole ? 'Cancel role edit' : 'Change role'}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all disabled:opacity-50 ${
                              isEditingRole
                                ? 'bg-surface-container-high text-on-surface border-outline-variant/30'
                                : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                            }`}
                          >
                            {isEditingRole ? 'Cancel' : 'Edit Role'}
                          </button>
                        )}
                        {!isSelf && (
                          <button
                            id={`users-delete-${u.id}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(u);
                            }}
                            title="Remove user"
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {isSelf && (
                          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/50 font-medium">
                            <ShieldAlert size={11} />
                            Current session
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* ── Pagination footer ── */}
        {!isLoading && !fetchError && totalUsers > PAGE_SIZE && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10 bg-surface-container-high/20">
            <p className="text-xs text-on-surface-variant">
              Showing{' '}
              <span className="font-semibold text-on-surface">
                {pageStart}–{pageEnd}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-on-surface">{totalUsers}</span>{' '}
              {debouncedSearch ? 'matching users' : 'users'}
            </p>
            <div className="flex items-center gap-1">
              <button
                id="users-page-prev"
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Show first, last, current ±1, and ellipsis logic
                  return (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - safePage) <= 1
                  );
                })
                .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                  if (idx > 0 && (page as number) - (arr[idx - 1] as number) > 1) {
                    acc.push('ellipsis');
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-on-surface-variant/50 text-xs"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      id={`users-page-${item}`}
                      type="button"
                      onClick={() => setCurrentPage(item as number)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        safePage === item
                          ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(173,198,255,0.2)]'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}

              <button
                id="users-page-next"
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            toastType === 'success'
              ? 'bg-secondary/15 text-secondary border border-secondary/30'
              : 'bg-error/15 text-error border border-error/30'
          }`}
        >
          {toastType === 'success' ? (
            <CheckCircle2 size={15} />
          ) : (
            <AlertCircle size={15} />
          )}
          {toastMessage}
        </div>
      )}

      {/* ── Delete confirm ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirm()}
        loading={isDeleting}
        title="Remove User"
        message={
          deleteTarget
            ? `Are you sure you want to permanently remove ${deleteTarget.name} ${deleteTarget.last_name}? This action cannot be undone.`
            : ''
        }
        confirmText="Remove"
        variant="danger"
      />

      {/* ── Create User Modal ── */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setCurrentPage(1);
          void fetchUsers(1, debouncedSearch);
          showToast('User provisioned successfully.');
        }}
      />
    </div>
  );
};

export default UsersPage;
