import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  ShieldCheck,
  FolderKanban,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Crown,
  User,
} from 'lucide-react';
import { usersApi } from '../api/users';
import { projectsApi, type Project } from '../api/projects';

/* ────────────────────── helpers ────────────────────── */

function InputField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  suffix,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
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
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-sm text-on-surface border focus:outline-none focus:ring-2 transition-all placeholder:text-on-surface-variant/40 ${
            error
              ? 'border-error/60 focus:ring-error/40'
              : 'border-outline-variant/20 focus:ring-primary/40'
          }`}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
      </div>
      {error && <p className="text-[11px] text-error">{error}</p>}
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

/* ────────────────────── types ────────────────────── */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/* ═══════════════════════ MODAL ═══════════════════════ */

const CreateUserModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  /* ── personal info ── */
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  /* ── role ── */
  const [role, setRole] = useState<'user' | 'admin'>('user');

  /* ── projects ── */
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [loadingProjects, setLoadingProjects] = useState(false);

  /* ── ui state ── */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ── load projects ── */
  useEffect(() => {
    if (!isOpen) return;
    setLoadingProjects(true);
    projectsApi
      .findAll()
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, [isOpen]);

  /* ── reset on open ── */
  useEffect(() => {
    if (isOpen) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('user');
      setSelectedProjectIds(new Set());
      setSubmitError('');
      setFieldErrors({});
    }
  }, [isOpen]);

  /* ── validation ── */
  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required.';
    else if (firstName.length > 100) e.firstName = 'Maximum 100 characters.';
    if (!lastName.trim()) e.lastName = 'Last name is required.';
    else if (lastName.length > 100) e.lastName = 'Maximum 100 characters.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!EMAIL_RE.test(email)) e.email = 'Must be a valid email.';
    else if (email.length > 255) e.email = 'Maximum 255 characters.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Minimum 8 characters.';
    else if (password.length > 72) e.password = 'Maximum 72 characters.';
    if (!confirmPassword) e.confirmPassword = 'Please confirm the password.';
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  /* ── project toggle ── */
  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const created = await usersApi.createUser({
        name: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });

      // If admin role requested, update role after creation
      if (role === 'admin' && created.id) {
        await usersApi.updateRole(created.id, 'admin');
      }

      // Assign to selected projects
      const projectAssignments = Array.from(selectedProjectIds).map((projectId) =>
        projectsApi.addMember(projectId, created.id),
      );
      if (projectAssignments.length > 0) {
        await Promise.allSettled(projectAssignments);
      }

      onCreated();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create user. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── key handler ── */
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/80 backdrop-blur-md"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Create new user"
    >
      <div className="glass-panel ghost-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-outline-variant/15 sticky top-0 bg-surface-container/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="font-headline font-bold text-on-surface text-lg">Provision New User</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Create a new identity node within the network
              </p>
            </div>
          </div>
          <button
            id="create-user-modal-close"
            type="button"
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
            className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form id="create-user-form" onSubmit={handleSubmit} noValidate>
          <div className="px-7 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left column */}
            <div className="md:col-span-7 space-y-6">
              {/* Personal Information */}
              <section className="bg-surface-container-high/40 rounded-xl p-5 border border-outline-variant/10">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="p-1.5 rounded bg-primary/10 text-primary">
                    <User size={14} />
                  </div>
                  <h3 className="font-headline font-bold text-sm text-on-surface">
                    Personal Information
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="First Name"
                      id="create-user-first-name"
                      value={firstName}
                      onChange={setFirstName}
                      placeholder="Julian"
                      error={fieldErrors.firstName}
                    />
                    <InputField
                      label="Last Name"
                      id="create-user-last-name"
                      value={lastName}
                      onChange={setLastName}
                      placeholder="Vane"
                      error={fieldErrors.lastName}
                    />
                  </div>
                  <InputField
                    label="Email Address"
                    id="create-user-email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="j.vane@example.com"
                    autoComplete="off"
                    error={fieldErrors.email}
                  />
                  <PasswordField
                    label="Initial Password"
                    id="create-user-password"
                    value={password}
                    onChange={setPassword}
                    placeholder="Min. 8 characters"
                    error={fieldErrors.password}
                  />
                  <PasswordField
                    label="Confirm Password"
                    id="create-user-confirm-password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Repeat password"
                    error={fieldErrors.confirmPassword}
                  />
                </div>
              </section>

              {/* Role Assignment */}
              <section className="bg-surface-container-high/40 rounded-xl p-5 border border-outline-variant/10">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="p-1.5 rounded bg-secondary/10 text-secondary">
                    <ShieldCheck size={14} />
                  </div>
                  <h3 className="font-headline font-bold text-sm text-on-surface">
                    Role Assignment
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* User role */}
                  <label
                    htmlFor="create-user-role-user"
                    className={`relative flex flex-col p-4 rounded-xl cursor-pointer transition-all border ${
                      role === 'user'
                        ? 'bg-secondary/10 border-secondary/30 shadow-[0_0_16px_rgba(78,222,163,0.1)]'
                        : 'bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/40'
                    }`}
                  >
                    <input
                      id="create-user-role-user"
                      type="radio"
                      name="create-user-role"
                      value="user"
                      checked={role === 'user'}
                      onChange={() => setRole('user')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User size={14} className={role === 'user' ? 'text-secondary' : 'text-on-surface-variant'} />
                        <span className={`font-bold text-sm ${role === 'user' ? 'text-secondary' : 'text-on-surface'}`}>
                          Member
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          role === 'user' ? 'border-secondary' : 'border-outline-variant'
                        }`}
                      >
                        {role === 'user' && <div className="w-2 h-2 rounded-full bg-secondary" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Scoped access limited to assigned project environments.
                    </p>
                  </label>

                  {/* Admin role */}
                  <label
                    htmlFor="create-user-role-admin"
                    className={`relative flex flex-col p-4 rounded-xl cursor-pointer transition-all border ${
                      role === 'admin'
                        ? 'bg-primary/10 border-primary/30 shadow-[0_0_16px_rgba(173,198,255,0.1)]'
                        : 'bg-surface-container-lowest border-outline-variant/20 hover:border-outline-variant/40'
                    }`}
                  >
                    <input
                      id="create-user-role-admin"
                      type="radio"
                      name="create-user-role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={() => setRole('admin')}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Crown size={14} className={role === 'admin' ? 'text-primary' : 'text-on-surface-variant'} />
                        <span className={`font-bold text-sm ${role === 'admin' ? 'text-primary' : 'text-on-surface'}`}>
                          Admin
                        </span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          role === 'admin' ? 'border-primary' : 'border-outline-variant'
                        }`}
                      >
                        {role === 'admin' && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Full administrative access across all projects and governance.
                    </p>
                  </label>
                </div>
              </section>
            </div>

            {/* Right column */}
            <div className="md:col-span-5 space-y-6">
              {/* Project Provisioning */}
              <section className="bg-surface-container-high/40 rounded-xl p-5 border border-outline-variant/10">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="p-1.5 rounded bg-tertiary/10 text-tertiary">
                    <FolderKanban size={14} />
                  </div>
                  <h3 className="font-headline font-bold text-sm text-on-surface">
                    Project Access
                  </h3>
                </div>

                {loadingProjects ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-12 rounded-lg bg-surface-container-highest/30 animate-pulse"
                      />
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderKanban size={32} className="text-on-surface-variant/30 mx-auto mb-2" />
                    <p className="text-xs text-on-surface-variant/60">No projects available</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {projects.map((project) => {
                      const isChecked = selectedProjectIds.has(project.id);
                      return (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => toggleProject(project.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all border ${
                            isChecked
                              ? 'bg-tertiary/10 border-tertiary/30'
                              : 'bg-surface-container-lowest border-outline-variant/15 hover:border-outline-variant/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-tertiary/10 flex items-center justify-center flex-shrink-0">
                              <FolderKanban size={13} className="text-tertiary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-on-surface truncate">
                                {project.title}
                              </p>
                              <p className="text-[10px] text-on-surface-variant capitalize">
                                {project.status.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ml-2 transition-all ${
                              isChecked
                                ? 'bg-tertiary border-tertiary'
                                : 'border-outline-variant'
                            }`}
                          >
                            {isChecked && (
                              <CheckCircle2 size={10} className="text-on-tertiary" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedProjectIds.size > 0 && (
                  <p className="text-[10px] text-tertiary font-medium mt-3 flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    {selectedProjectIds.size} project{selectedProjectIds.size > 1 ? 's' : ''} selected
                  </p>
                )}
              </section>
            </div>
          </div>

          {/* Error banner */}
          {submitError && (
            <div className="mx-7 mb-4 px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
              {submitError}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-outline-variant/15 sticky bottom-0 bg-surface-container/95 backdrop-blur-md">
            <button
              id="create-user-modal-cancel"
              type="button"
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/20 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="create-user-modal-submit"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg text-sm font-bold bg-primary text-on-primary hover:brightness-110 active:scale-95 transition-all shadow-[0_8px_24px_rgba(173,198,255,0.2)] disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <UserPlus size={15} />
              )}
              {isSubmitting ? 'Provisioning…' : 'Provision User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
