import React from 'react';
import Sidebar from '../components/Sidebar';
import TopAppBar from '../components/TopAppBar';

interface ShellProps {
  children: React.ReactNode;
}

const Shell: React.FC<ShellProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-surface text-on-surface overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative overflow-hidden">
        <TopAppBar />
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </main>

        {/* Floating System Indicator */}
        <div className="fixed bottom-8 right-8 flex items-center gap-3 px-5 py-3 rounded-full bg-surface-container-highest shadow-2xl ring-1 ring-outline-variant/30 backdrop-blur-xl pointer-events-none">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-secondary ring-2 ring-surface"></div>
            <div className="w-6 h-6 rounded-full bg-primary ring-2 ring-surface"></div>
            <div className="w-6 h-6 rounded-full bg-tertiary ring-2 ring-surface"></div>
          </div>
          <span className="text-[10px] font-bold text-white uppercase tracking-tighter">System Synchronized</span>
        </div>
      </div>
    </div>
  );
};

export default Shell;
