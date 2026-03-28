import { Search, Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContextInstance';

const TopAppBar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="w-full top-0 sticky bg-surface flex items-center justify-between px-6 py-3 shadow-[0_8px_32px_rgba(173,198,255,0.06)] z-40">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 bg-surface-container-low px-4 py-1.5 rounded-full ring-1 ring-outline-variant/20">
          <Search size={18} className="text-primary" />
          <input 
            type="text" 
            placeholder="Search agent fleet..." 
            className="bg-transparent border-none text-sm text-on-surface focus:outline-none w-48 placeholder:text-on-surface-variant/50"
          />
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors font-headline text-sm tracking-tight">Docs</a>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors font-headline text-sm tracking-tight">Support</a>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end mr-2">
          <span className="text-xs font-bold text-on-surface leading-none">{user?.username || 'Agent'}</span>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">{user?.email || 'Active Protocol'}</span>
        </div>
        
        <button className="text-on-surface-variant hover:text-primary transition-all active:scale-95 duration-200">
          <Bell size={20} />
        </button>
        <button className="text-on-surface-variant hover:text-primary transition-all active:scale-95 duration-200">
          <Settings size={20} />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
          <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary/20">
            <img 
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Felix'}`}
              alt="User avatar" 
              className="w-full h-full object-cover"
            />
          </div>
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
