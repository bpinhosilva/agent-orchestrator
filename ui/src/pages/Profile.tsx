import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  FolderKanban,
  Eye,
  EyeOff,
  Save,
  X,
  CheckCircle2,
  PlusCircle,
  Edit3,
  Rocket,
  Box,
  ChevronDown,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContextInstance';
import { authApi } from '../api/auth';
import { useProject } from '../hooks/useProject';
import { usersApi } from '../api/users';
import {
  projectsApi,
  ProjectStatus,
  type ProjectStatus as ProjectLifecycleStatus,
} from '../api/projects';
import CreateProjectModal from '../components/CreateProjectModal';
import type { UpdateProfilePayload } from '../api/auth';
import AvatarPickerModal from '../components/AvatarPickerModal';
import UserAvatar from '../components/UserAvatar';
import {
  DEFAULT_AVATAR_PRESET,
  isAvatarPresetKey,
  type AvatarPresetKey,
} from '../lib/avatarPresets';

/* ─────────────────────────── helpers ─────────────────────────── */

function Toggle({
  enabled,
  onToggle,
  id,
}: {
  enabled: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`relative inline-flex flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
        enabled ? 'bg-secondary' : 'bg-surface-container-highest'
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${
          enabled ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  );
}

function InputField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  suffix,
  autoComplete,
  error,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  suffix?: React.ReactNode;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label
        htmlFor={id}
        className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.15em]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-sm text-on-surface border focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-on-surface-variant/40 ${
            error
              ? 'border-error/60 focus:ring-error/40'
              : 'border-outline-variant/20 focus:ring-primary/40'
          }`}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-[11px] text-error mt-0.5">{error}</p>}
    </div>
  );
}

function PasswordField({
  label,
  id,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <InputField
      label={label}
      id={id}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      autoComplete="new-password"
      placeholder={placeholder ?? '••••••••'}
      error={error}
      suffix={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="text-on-surface-variant hover:text-primary transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  );
}

function ProjectCard({
  projectId,
  title,
  description,
  status,
  icon,
  iconColor,
}: {
  projectId: string;
  title: string;
  description: string;
  status: ProjectLifecycleStatus;
  icon: React.ReactNode;
  iconColor: string;
}) {
  return (
    <Link
      to={`/projects/${projectId}`}
      className={`bg-surface-container-low p-5 rounded-xl border border-outline-variant/10 hover:bg-surface-container-high transition-colors cursor-pointer ${
        status === 'archived' ? 'opacity-70' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${iconColor}`}>{icon}</div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-tight ${
            status === 'active'
              ? 'bg-secondary/10 text-secondary border border-secondary/20'
              : 'bg-surface-container-highest text-on-surface-variant'
          }`}
        >
          {status.replace('_', ' ')}
        </span>
      </div>
      <h3 className="font-headline font-bold text-on-surface text-sm">
        {title}
      </h3>
      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
        {description}
      </p>
    </Link>
  );
}

/* ═══════════════════════════ MAIN PAGE ════════════════════════════ */

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { projects, refreshProjects } = useProject();
  const isAdmin = user?.role === 'admin';
  const hasActiveProject = projects.some(
    (project) => project.status === ProjectStatus.ACTIVE,
  );
  const canCreateProject = isAdmin && !hasActiveProject;
  const createProjectBlockedReason = !isAdmin
    ? 'Only admins can create projects.'
    : 'Only one active project is allowed at a time. Move the active project out of active status before creating a new one.';

  /* ── personal info ── */
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  /* ── role ── */
  const [selectedRole, setSelectedRole] = useState('user');

  /* ── password ── */
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  /* ── security toggles ── */
  const [twoFactor, setTwoFactor] = useState(false);
  const [biometric, setBiometric] = useState(false);

  /* ── field-level validation errors ── */
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pwdFieldErrors, setPwdFieldErrors] = useState<Record<string, string>>(
    {},
  );

  /* ── ui state ── */
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  /* ── modals ── */
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showAssignProject, setShowAssignProject] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [assigningProjectId, setAssigningProjectId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarPresetKey>(
    DEFAULT_AVATAR_PRESET,
  );

  /* ── validation (mirrors backend DTOs) ── */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateInfo = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'First name is required.';
    else if (name.length > 100) e.name = 'Maximum 100 characters.';
    if (!lastName.trim()) e.lastName = 'Last name is required.';
    else if (lastName.length > 100) e.lastName = 'Maximum 100 characters.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!EMAIL_RE.test(email)) e.email = 'Must be a valid email address.';
    else if (email.length > 255) e.email = 'Maximum 255 characters.';
    return e;
  };

  const validatePassword = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!newPwd) e.newPwd = 'New password is required.';
    else if (newPwd.length < 8) e.newPwd = 'Minimum 8 characters.';
    else if (newPwd.length > 72) e.newPwd = 'Maximum 72 characters.';
    if (!confirmPwd) e.confirmPwd = 'Please confirm the new password.';
    else if (newPwd !== confirmPwd) e.confirmPwd = 'Passwords do not match.';
    return e;
  };

  const getSelectedAvatar = (avatar?: string | null): AvatarPresetKey =>
    isAvatarPresetKey(avatar) ? avatar : DEFAULT_AVATAR_PRESET;

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setLastName(user.lastName ?? '');
      setEmail(user.email ?? '');
      setSelectedRole(user.role ?? 'user');
      setSelectedAvatar(getSelectedAvatar(user.avatar));
    }
  }, [user]);

  /* ── save personal info + role ── */
  const handleSaveInfo = async () => {
    const errs = validateInfo();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const payload: UpdateProfilePayload = {};
      if (name !== (user?.name ?? '')) payload.name = name;
      if (lastName !== (user?.lastName ?? '')) payload.lastName = lastName;
      if (email !== (user?.email ?? '')) payload.email = email;

      const ops: Promise<unknown>[] = [];
      if (Object.keys(payload).length > 0)
        ops.push(authApi.updateProfile(payload));
      if (isAdmin && user?.id && selectedRole !== user?.role) {
        ops.push(usersApi.updateRole(user.id, selectedRole));
      }

      if (ops.length > 0) {
        await Promise.all(ops);
        await refreshUser();
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save changes',
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* ── change password ── */
  const handleChangePassword = async () => {
    const errs = validatePassword();
    if (Object.keys(errs).length > 0) {
      setPwdFieldErrors(errs);
      return;
    }
    setPwdFieldErrors({});
    setPwdError('');
    setPwdSuccess(false);
    setIsChangingPwd(true);
    try {
      await authApi.updateProfile({ newPassword: newPwd });
      setNewPwd('');
      setConfirmPwd('');
      setPwdSuccess(true);
      setTimeout(() => setPwdSuccess(false), 4000);
    } catch (err: unknown) {
      setPwdError(
        err instanceof Error ? err.message : 'Failed to update password',
      );
    } finally {
      setIsChangingPwd(false);
    }
  };

  /* ── assign project (admin) ── */
  const handleAssignProject = async () => {
    if (!assigningProjectId || !user?.id) return;
    setIsAssigning(true);
    try {
      await projectsApi.addMember(assigningProjectId, user.id);
      await refreshProjects();
      setShowAssignProject(false);
      setAssigningProjectId('');
    } catch (err: unknown) {
      console.error('Failed to assign project:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSaveAvatar = async () => {
    setSaveError('');
    setSaveSuccess(false);
    setIsSavingAvatar(true);
    try {
      await authApi.updateProfile({ avatar: selectedAvatar });
      await refreshUser();
      setShowAvatarPicker(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to update avatar',
      );
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const displayName = user
    ? `${user.name ?? ''} ${user.lastName ?? ''}`.trim()
    : 'Agent';
  const roleLabel = user?.role ?? 'user';
  const roleDisplay = roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1);

  return (
    <div className="min-h-full pb-16">
      {/* ── Hero header ── */}
      <header className="mb-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
        {/* Avatar */}
        <div className="relative group flex-shrink-0">
          <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-tertiary rounded-full blur opacity-20 group-hover:opacity-40 transition duration-700" />
          <UserAvatar
            name={displayName}
            avatar={user?.avatar}
            avatarUrl={user?.avatarUrl}
            alt={displayName}
            className="relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-surface sm:h-32 sm:w-32"
          />
          <button
            type="button"
            onClick={() => {
              setSelectedAvatar(getSelectedAvatar(user?.avatar));
              setShowAvatarPicker(true);
            }}
            title="Change avatar"
            className="absolute bottom-1 right-1 bg-primary text-on-primary p-1.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform"
          >
            <Edit3 size={14} />
          </button>
        </div>

        {/* Name / role */}
        <div className="text-center sm:text-left flex-1">
          <h1 className="font-headline text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            {displayName}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 justify-center sm:justify-start">
            <span className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-[0_0_12px_rgba(78,222,163,0.1)]">
              {roleDisplay}
            </span>
            <span className="text-on-surface-variant text-sm font-body">
              {user?.email}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 sm:ml-auto flex-shrink-0">
          <button
            id="profile-cancel-btn"
            onClick={() => {
              setName(user?.name ?? '');
              setLastName(user?.lastName ?? '');
              setEmail(user?.email ?? '');
              setSelectedRole(user?.role ?? 'user');
              setSaveError('');
              setFieldErrors({});
            }}
            className="px-5 py-2 rounded-lg font-bold text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/20 transition-colors text-sm"
          >
            <span className="flex items-center gap-1.5">
              <X size={15} /> Cancel
            </span>
          </button>
          <button
            id="profile-save-btn"
            onClick={handleSaveInfo}
            disabled={isSaving}
            className="px-6 py-2 rounded-lg font-bold bg-primary text-on-primary hover:brightness-110 active:scale-95 transition-all shadow-[0_8px_24px_rgba(173,198,255,0.15)] text-sm disabled:opacity-60 flex items-center gap-1.5"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <Save size={15} />
            )}
            Save Changes
          </button>
        </div>
      </header>

      {/* Banners */}
      {saveSuccess && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary text-sm font-medium flex items-center gap-2">
          <CheckCircle2 size={16} /> Profile updated successfully.
        </div>
      )}
      {saveError && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm font-medium">
          {saveError}
        </div>
      )}

      {/* ── Bento grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Left column ── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Personal Information */}
          <section className="glass-panel ghost-border p-7 rounded-2xl shadow-[0_24px_48px_rgba(173,198,255,0.05)]">
            <div className="flex items-center gap-3 mb-7">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <User size={18} />
              </div>
              <h2 className="font-headline text-base font-bold text-on-surface">
                Personal Information
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <InputField
                label="First Name"
                id="profile-first-name"
                value={name}
                onChange={setName}
                placeholder="Your first name"
                error={fieldErrors.name}
              />
              <InputField
                label="Last Name"
                id="profile-last-name"
                value={lastName}
                onChange={setLastName}
                placeholder="Your last name"
                error={fieldErrors.lastName}
              />
              <InputField
                label="Email Address"
                id="profile-email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="your@email.com"
                className="sm:col-span-2"
                error={fieldErrors.email}
              />
            </div>
          </section>

          {/* Role & Clearance */}
          <section className="glass-panel ghost-border p-7 rounded-2xl shadow-[0_24px_48px_rgba(173,198,255,0.05)]">
            <div className="flex items-center gap-3 mb-7">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <ShieldCheck size={18} />
              </div>
              <h2 className="font-headline text-base font-bold text-on-surface">
                Role &amp; Clearance
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Current role */}
              <div className="flex items-center gap-3 flex-1">
                <span className="bg-secondary/10 text-secondary border border-secondary/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(78,222,163,0.1)] flex-shrink-0">
                  {roleDisplay}
                </span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {roleLabel === 'admin'
                    ? 'Full orchestration privileges across all projects.'
                    : 'Standard access for task execution and project participation.'}
                </p>
              </div>

              {/* Role selector — admin only */}
              {isAdmin && (
                <div className="flex flex-col gap-1.5 sm:w-48 flex-shrink-0">
                  <label
                    htmlFor="profile-role-select"
                    className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.15em]"
                  >
                    Update Role
                  </label>
                  <div className="relative">
                    <select
                      id="profile-role-select"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full bg-surface-container-lowest rounded-lg px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="user">Member</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Project Assignments */}
          <section className="glass-panel ghost-border p-7 rounded-2xl shadow-[0_24px_48px_rgba(173,198,255,0.05)]">
            <div className="flex justify-between items-center mb-7">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-tertiary/10 text-tertiary">
                  <FolderKanban size={18} />
                </div>
                <h2 className="font-headline text-base font-bold text-on-surface">
                  Project Assignments
                </h2>
              </div>
              {isAdmin && (
                <button
                  onClick={() => canCreateProject && setShowCreateProject(true)}
                  disabled={!canCreateProject}
                  title={
                    !canCreateProject ? createProjectBlockedReason : undefined
                  }
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                >
                  <PlusCircle size={14} /> Create Project
                </button>
              )}
            </div>
            {isAdmin && hasActiveProject && (
              <p className="mb-5 text-xs text-on-surface-variant">
                {createProjectBlockedReason}
              </p>
            )}

            {/* Assign to existing project — admin only */}
            {isAdmin && projects.length > 0 && (
              <div className="mb-5">
                {showAssignProject ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        id="profile-assign-project-select"
                        value={assigningProjectId}
                        onChange={(e) => setAssigningProjectId(e.target.value)}
                        className="w-full bg-surface-container-lowest rounded-lg px-4 py-2.5 text-sm text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
                      >
                        <option value="">Select a project…</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                      />
                    </div>
                    <button
                      onClick={handleAssignProject}
                      disabled={!assigningProjectId || isAssigning}
                      className="px-4 py-2.5 rounded-lg text-sm font-bold bg-primary text-on-primary disabled:opacity-50 hover:brightness-110 transition-all"
                    >
                      {isAssigning ? '…' : 'Assign'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAssignProject(false);
                        setAssigningProjectId('');
                      }}
                      className="p-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAssignProject(true)}
                    className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <UserPlus size={14} /> Assign to Project
                  </button>
                )}
              </div>
            )}

            {projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.slice(0, 4).map((project, i) => (
                  <ProjectCard
                    key={project.id}
                    projectId={project.id}
                    title={project.title}
                    description={
                      project.description ?? 'No description provided.'
                    }
                    status={project.status}
                    icon={
                      i === 0 ? (
                        <Rocket size={18} />
                      ) : i === 1 ? (
                        <FolderKanban size={18} />
                      ) : (
                        <Box size={18} />
                      )
                    }
                    iconColor={
                      i === 0
                        ? 'bg-primary/10 text-primary'
                        : i === 1
                          ? 'bg-tertiary/10 text-tertiary'
                          : 'bg-on-surface-variant/10 text-on-surface-variant'
                    }
                  />
                ))}
                {isAdmin && canCreateProject && (
                  <div
                    onClick={() => setShowCreateProject(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && setShowCreateProject(true)
                    }
                    className="bg-surface-container-low p-5 rounded-xl border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition-all cursor-pointer min-h-[140px]"
                  >
                    <PlusCircle size={24} className="text-primary/40" />
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                      New Project
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={
                  canCreateProject
                    ? () => setShowCreateProject(true)
                    : undefined
                }
                role={canCreateProject ? 'button' : undefined}
                tabIndex={canCreateProject ? 0 : undefined}
                onKeyDown={
                  canCreateProject
                    ? (e) => e.key === 'Enter' && setShowCreateProject(true)
                    : undefined
                }
                className={`bg-surface-container-low p-5 rounded-xl border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition-all min-h-[140px] ${
                  canCreateProject
                    ? 'cursor-pointer'
                    : 'cursor-default opacity-60'
                }`}
              >
                <PlusCircle size={24} className="text-primary/40" />
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  {canCreateProject
                    ? 'Create First Project'
                    : isAdmin
                      ? 'Active Project Exists'
                      : 'No Projects Assigned'}
                </span>
              </div>
            )}
          </section>
        </div>

        {/* ── Right column ── */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Security */}
          <section className="glass-panel ghost-border p-7 rounded-2xl shadow-[0_24px_48px_rgba(173,198,255,0.05)]">
            <div className="flex items-center gap-3 mb-7">
              <div className="p-2 rounded-lg bg-tertiary/10 text-tertiary">
                <ShieldCheck size={18} />
              </div>
              <h2 className="font-headline text-base font-bold text-on-surface">
                Security
              </h2>
            </div>

            {pwdSuccess && (
              <div className="mb-5 px-3 py-2.5 rounded-lg bg-secondary/10 border border-secondary/30 text-secondary text-xs font-medium flex items-center gap-2">
                <CheckCircle2 size={14} /> Password updated successfully.
              </div>
            )}
            {pwdError && (
              <div className="mb-5 px-3 py-2.5 rounded-lg bg-error/10 border border-error/30 text-error text-xs">
                {pwdError}
              </div>
            )}

            <div className="space-y-4">
              <PasswordField
                label="New Password"
                id="profile-new-pwd"
                value={newPwd}
                onChange={setNewPwd}
                placeholder="Min. 8 characters"
                error={pwdFieldErrors.newPwd}
              />
              <PasswordField
                label="Confirm New Password"
                id="profile-confirm-pwd"
                value={confirmPwd}
                onChange={setConfirmPwd}
                placeholder="Repeat new password"
                error={pwdFieldErrors.confirmPwd}
              />
              <button
                id="profile-update-creds-btn"
                onClick={handleChangePassword}
                disabled={isChangingPwd}
                className="w-full py-2.5 rounded-lg text-sm font-bold bg-tertiary/10 text-tertiary border border-tertiary/20 hover:bg-tertiary hover:text-on-tertiary transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isChangingPwd ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : null}
                Update Credentials
              </button>
            </div>

            {/* Toggle switches */}
            <div className="mt-7 pt-6 border-t border-outline-variant/20 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    Two-Factor Auth
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    TOTP-based second factor
                  </p>
                </div>
                <Toggle
                  id="profile-2fa-toggle"
                  enabled={twoFactor}
                  onToggle={() => setTwoFactor((v) => !v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    Biometric Access
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    WebAuthn / passkey
                  </p>
                </div>
                <Toggle
                  id="profile-biometric-toggle"
                  enabled={biometric}
                  onToggle={() => setBiometric((v) => !v)}
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onCreated={async () => {
          await refreshProjects();
          setShowCreateProject(false);
        }}
        canCreate={canCreateProject}
        blockedReason={createProjectBlockedReason}
      />
      <AvatarPickerModal
        isOpen={showAvatarPicker}
        selectedAvatar={selectedAvatar}
        currentAvatar={getSelectedAvatar(user?.avatar)}
        isSaving={isSavingAvatar}
        onSelect={setSelectedAvatar}
        onClose={() => {
          if (!isSavingAvatar) {
            setShowAvatarPicker(false);
            setSelectedAvatar(getSelectedAvatar(user?.avatar));
          }
        }}
        onConfirm={handleSaveAvatar}
      />
    </div>
  );
};

export default Profile;
