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
      </div>
    </div>
  );
};

export default Shell;
