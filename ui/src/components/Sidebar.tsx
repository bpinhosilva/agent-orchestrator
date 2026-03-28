import { useState } from 'react';
import { 
  Plus, 
  HelpCircle, 
  LogOut, 
  LayoutDashboard, 
  Calendar, 
  Network, 
  Bot,
  Server,
  Layout,
  Briefcase
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useProject } from '../hooks/useProject';
import { useAuth } from '../contexts/AuthContextInstance';
import CreateProjectModal from './CreateProjectModal';

const Sidebar = () => {
  const { activeProject, loading, refreshProjects } = useProject();
  const { logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Task Manager', path: '/' },
    { icon: Calendar, label: 'Scheduler', path: '/scheduler' },
    { icon: Bot, label: 'Agents', path: '/agents' },
    { icon: Network, label: 'Flow Builder', path: '/flow' },
    { icon: Server, label: 'Providers', path: '/providers' },
  ];

  return (
    <aside className="h-screen w-64 sticky top-0 bg-surface-container-low flex flex-col py-6 shadow-xl z-50 transition-all duration-300">
      <div className="px-6 mb-8">
        <h1 className="text-lg font-black text-primary font-headline tracking-tight uppercase">Orchestrator</h1>
        <p className="text-[10px] text-on-surface-variant font-medium tracking-[0.2em] mt-1">AI CONTROL CENTER</p>
      </div>

      {/* Project Selector Block */}
      <div className="px-3 mb-8">
        {loading ? (
          <div className="mx-3 h-16 bg-surface-container-highest/20 rounded-xl animate-pulse border border-outline-variant/10"></div>
        ) : activeProject ? (
          <NavLink 
            to={`/projects/${activeProject.id}`}
            className={({ isActive }) => `group relative mx-2 p-4 rounded-xl bg-surface-container-high border transition-all cursor-pointer overflow-hidden block ${
              isActive ? 'border-primary shadow-lg shadow-primary/5 ring-1 ring-primary/20' : 'border-outline-variant/10 hover:border-primary/30'
            }`}
          >
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
              <Briefcase size={24} className="text-primary" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Layout size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 leading-none mb-1">Active Sector</p>
                <h3 className="text-xs font-bold text-white truncate">{activeProject.title}</h3>
              </div>
            </div>
          </NavLink>
        ) : (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full mx-auto px-4 py-4 rounded-xl bg-secondary/10 border border-secondary/20 hover:bg-secondary/20 hover:border-secondary/40 transition-all group flex flex-col items-center gap-2 text-center"
          >
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
              <Plus size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Construct Sector</span>
          </button>
        )}
      </div>

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreated={refreshProjects}
      />

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
        <div className="pt-4 border-t border-outline-variant/20">
          <a href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface transition-all">
            <HelpCircle size={20} />
            <span className="font-body text-sm">Help</span>
          </a>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface transition-all"
          >
            <LogOut size={20} />
            <span className="font-body text-sm">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
