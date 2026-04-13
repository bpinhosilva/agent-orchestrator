import { Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextInstance';
import { useNavigate } from 'react-router-dom';
import UserAvatar from './UserAvatar';

const TopAppBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user ? `${user.name} ${user.lastName}`.trim() : 'Agent';

  return (
    <header role="banner" className="w-full top-0 sticky bg-surface flex items-center justify-between px-6 py-3 shadow-[0_8px_32px_rgba(173,198,255,0.06)] z-40">
      <div className="flex items-center gap-8">
        <div className="hidden md:flex items-center gap-6">
          <a
            href="https://github.com/bpinhosilva/agent-orchestrator/blob/main/README.md"
            target="_blank"
            rel="noreferrer"
            className="text-on-surface-variant hover:text-primary transition-colors font-headline text-sm tracking-tight"
          >
            Docs
          </a>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-xs font-bold text-on-surface leading-none">{displayName}</span>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">{user?.email || 'Active Protocol'}</span>
        </div>
        
        <button aria-label="Notifications" className="text-on-surface-variant hover:text-primary transition-all active:scale-95 duration-200">
          <Bell size={20} aria-hidden="true" />
        </button>
        <button
          onClick={() => navigate('/settings')}
          aria-label="Settings"
          className="text-on-surface-variant hover:text-primary transition-all active:scale-95 duration-200"
        >
          <Settings size={20} aria-hidden="true" />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
          <button
            onClick={() => navigate('/profile')}
            aria-label="Open profile"
            title="View profile"
            className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary/20 hover:ring-primary/60 transition-all active:scale-95 duration-200"
          >
            <UserAvatar
              name={displayName}
              avatar={user?.avatar}
              avatarUrl={user?.avatarUrl}
              alt="User avatar"
              className="h-full w-full"
            />
          </button>
          <button 
            onClick={logout}
            className="p-2 text-on-surface-variant hover:text-error transition-all active:scale-95 duration-200 rounded-lg hover:bg-error/10"
            title="Terminate Session"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopAppBar;
