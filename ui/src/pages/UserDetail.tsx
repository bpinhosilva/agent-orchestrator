import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User as UserIcon,
  ShieldCheck,
  FolderKanban,
  Save,
  X,
  CheckCircle2,
  ChevronLeft,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { usersApi, type User } from '../api/users';
import { projectsApi, type Project } from '../api/projects';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../contexts/AuthContextInstance';

/* ─────────────────────────── helpers ─────────────────────────── */

function InputField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
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
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-surface-container-lowest rounded-lg px-4 py-3 text-sm text-on-surface border focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-on-surface-variant/40 ${
          error
            ? 'border-error/60 focus:ring-error/40'
            : 'border-outline-variant/20 focus:ring-primary/40'
        }`}
      />
      {error && <p className="text-[11px] text-error mt-0.5">{error}</p>}
    </div>
  );
}

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [user, setUser] = useState<User | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [u, allP, userP] = await Promise.all([
        usersApi.findOne(id),
        projectsApi.findAll(undefined, true),
        projectsApi.findAll(id),
      ]);
      setUser(u);
      setAllProjects(allP.data);
      setUserProjects(userP.data);
      
      setName(u.name);
      setLastName(u.last_name);
      setEmail(u.email);
      setRole(u.role || 'user');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveInfo = async () => {
    if (!id) return;
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      await usersApi.updateRole(id, role);
      // If we wanted to update other info, we'd need a general update endpoint
      // For now, let's assume we can at least update the role.
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save user changes');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProject = async (projectId: string, isAssigned: boolean) => {
    if (!id) return;
    try {
      if (isAssigned) {
        await projectsApi.removeMember(projectId, id);
      } else {
        await projectsApi.addMember(projectId, id);
      }
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update project membership');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-4">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-2">Access Restricted</h2>
        <p className="text-on-surface-variant max-w-md">
          This area is only accessible to system administrators.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors font-bold text-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm font-medium text-on-surface-variant animate-pulse">Initializing user matrix...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle size={48} className="text-error mb-4 opacity-20" />
        <h2 className="text-2xl font-bold text-on-surface mb-2">User Not Found</h2>
        <button
          onClick={() => navigate('/users')}
          className="mt-6 px-6 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors font-bold text-sm"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const displayName = `${name} ${lastName}`.trim() || 'Agent';

  return (
    <div className="min-h-full pb-16">
      {/* ── Header ── */}
      <header className="mb-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
        <div className="flex-shrink-0">
          <UserAvatar
            name={displayName}
            avatar={user.avatar}
            className="h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-surface ring-2 ring-outline-variant/10 shadow-xl"
          />
        </div>

        <div className="text-center sm:text-left flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
             <Link to="/users" className="text-on-surface-variant hover:text-primary transition-colors">
              <ChevronLeft size={20} />
             </Link>
             <h1 className="font-headline text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
               {displayName}
             </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 justify-center sm:justify-start">
            <span className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
              {role.toUpperCase()}
            </span>
            <span className="text-on-surface-variant text-sm font-body">
              {user.email}
            </span>
          </div>
        </div>

        <div className="flex gap-3 sm:ml-auto flex-shrink-0">
          <button
            onClick={() => navigate('/users')}
            className="px-5 py-2 rounded-lg font-bold text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/20 transition-colors text-sm flex items-center gap-1.5"
          >
            <X size={15} /> Cancel
          </button>
          <button
            onClick={handleSaveInfo}
            disabled={isSaving}
            className="px-6 py-2 rounded-lg font-bold bg-primary text-on-primary hover:brightness-110 active:scale-95 transition-all shadow-lg text-sm disabled:opacity-60 flex items-center gap-1.5"
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
          <CheckCircle2 size={16} /> User updated successfully.
        </div>
      )}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm font-medium flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* User Info */}
        <div className="lg:col-span-12 flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="glass-panel ghost-border p-7 rounded-2xl">
              <div className="flex items-center gap-3 mb-7 font-headline">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <UserIcon size={18} />
                </div>
                <h2 className="text-base font-bold text-on-surface">Identity Matrix</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField
                  label="Name"
                  id="user-name"
                  value={name}
                  onChange={setName}
                  disabled
                />
                <InputField
                  label="Last Name"
                  id="user-lastname"
                  value={lastName}
                  onChange={setLastName}
                  disabled
                />
                <div className="sm:col-span-2">
                  <InputField
                    label="Email"
                    id="user-email"
                    value={email}
                    onChange={setEmail}
                    disabled
                  />
                </div>
              </div>
            </section>

            <section className="glass-panel ghost-border p-7 rounded-2xl">
              <div className="flex items-center gap-3 mb-7 font-headline">
                <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                  <ShieldCheck size={18} />
                </div>
                <h2 className="text-base font-bold text-on-surface">Administrative Clearance</h2>
              </div>
              <div className="flex flex-col gap-4">
                 <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.15em]">
                   Clearance Level
                 </label>
                 <div className="grid grid-cols-2 gap-4">
                   <button
                     onClick={() => setRole('user')}
                     className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                       role === 'user'
                         ? 'bg-surface-container-highest border-primary/40 ring-1 ring-primary/20'
                         : 'bg-surface-container-lowest border-outline-variant/10 hover:border-outline-variant/30'
                     }`}
                   >
                     <div className="text-left">
                       <p className="text-sm font-bold text-on-surface">Member</p>
                       <p className="text-[10px] text-on-surface-variant">Standard access</p>
                     </div>
                     {role === 'user' && <CheckCircle2 size={16} className="text-primary" />}
                   </button>

                   <button
                     onClick={() => setRole('admin')}
                     className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                       role === 'admin'
                         ? 'bg-surface-container-highest border-primary/40 ring-1 ring-primary/20'
                         : 'bg-surface-container-lowest border-outline-variant/10 hover:border-outline-variant/30'
                     }`}
                   >
                     <div className="text-left">
                       <p className="text-sm font-bold text-on-surface">Admin</p>
                       <p className="text-[10px] text-on-surface-variant">Full privileges</p>
                     </div>
                     {role === 'admin' && <CheckCircle2 size={16} className="text-primary" />}
                   </button>
                 </div>
                 <p className="text-[11px] text-on-surface-variant mt-2 italic leading-relaxed">
                   * Administrators can manage all projects, members, and system settings.
                 </p>
              </div>
            </section>
          </div>

          <section className="glass-panel ghost-border p-7 rounded-2xl">
            <div className="flex items-center justify-between mb-7 font-headline">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-tertiary/10 text-tertiary">
                  <FolderKanban size={18} />
                </div>
                <h2 className="text-base font-bold text-on-surface">Project Vector Assignments</h2>
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-3 py-1 rounded bg-surface-container-high border border-outline-variant/10">
                {userProjects.length} / {allProjects.length} Assigned
              </span>
            </div>

            {allProjects.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                <FolderKanban size={48} strokeWidth={1} />
                <p className="mt-4 text-sm font-medium">No projects found in the orchestrator.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {allProjects.map((project) => {
                  const isAssigned = userProjects.some((up) => up.id === project.id);
                  return (
                    <div
                      key={project.id}
                      className={`group flex flex-col h-full rounded-xl border transition-all duration-300 p-5 ${
                        isAssigned
                          ? 'bg-surface-container-highest border-primary/30 shadow-[0_8px_32px_rgba(173,198,255,0.05)]'
                          : 'bg-surface-container-lowest border-outline-variant/10 opacity-70 hover:opacity-100 hover:border-outline-variant/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg ${isAssigned ? 'bg-primary/20 text-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                          <FolderKanban size={16} />
                        </div>
                        <button
                          onClick={() => toggleProject(project.id, isAssigned)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isAssigned
                              ? 'bg-error/10 text-error hover:bg-error hover:text-on-error'
                              : 'bg-primary/10 text-primary hover:bg-primary hover:text-on-primary shadow-sm shadow-primary/20'
                          }`}
                          title={isAssigned ? 'Remove from project' : 'Assign to project'}
                        >
                          {isAssigned ? <Trash2 size={16} /> : <Plus size={16} />}
                        </button>
                      </div>
                      <h3 className="text-sm font-bold text-on-surface mb-1">{project.title}</h3>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed flex-grow">
                        {project.description || 'No project scope defined.'}
                      </p>
                      <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                         <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                           project.status === 'active' ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-high text-on-surface-variant'
                         }`}>
                           {project.status}
                         </span>
                         {isAssigned && (
                           <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold">
                             <CheckCircle2 size={12} /> Assigned
                           </div>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
