import { 
  Plus, 
  HelpCircle, 
  LogOut, 
  LayoutDashboard, 
  Calendar, 
  Network, 
  Bot,
  Server
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Task Manager', path: '/' },
    { icon: Calendar, label: 'Scheduler', path: '/scheduler' },
    { icon: Bot, label: 'Agents', path: '/agents' },
    { icon: Network, label: 'Flow Builder', path: '/flow' },
    { icon: Server, label: 'Providers', path: '/providers' },
  ];

  return (
    <aside className="h-screen w-64 sticky top-0 bg-surface-container-low flex flex-col py-6 shadow-xl z-50 transition-all duration-300">
      <div className="px-6 mb-10">
        <h1 className="text-lg font-black text-primary font-headline tracking-tight uppercase">Orchestrator</h1>
        <p className="text-[10px] text-on-surface-variant font-medium tracking-[0.2em] mt-1">AI CONTROL CENTER</p>
      </div>

      <nav className="flex-1 px-3 space-y-2">
        {navItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
              isActive 
                ? 'text-secondary border-r-2 border-secondary bg-gradient-to-r from-secondary/10 to-transparent' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <item.icon size={20} />
            <span className="font-body text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 space-y-2 pt-6">
        <button className="w-full bg-primary text-on-primary py-2.5 rounded-md font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/10">
          <Plus size={18} />
          New Agent
        </button>

        <div className="pt-4 border-t border-outline-variant/20">
          <a href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface transition-all">
            <HelpCircle size={20} />
            <span className="font-body text-sm">Help</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface transition-all">
            <LogOut size={20} />
            <span className="font-body text-sm">Logout</span>
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
