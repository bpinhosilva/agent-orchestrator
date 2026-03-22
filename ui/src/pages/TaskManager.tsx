import React from 'react';
import { ListPlus, Sparkles, ArrowRight } from 'lucide-react';
import TaskBoard from '../components/tasks/TaskBoard';

const TaskManager: React.FC = () => {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-white">Agentic Task Canvas</h1>
          <p className="text-outline text-sm mt-1">Orchestrating 24 parallel node operations</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-CQEOfCg78FmG8tnrDBiR02s2dF98y1-Z7PhmmMYPH_K_NYgfcE-fhiNfKLXaXsiuxEXoDR2u9yuiQCVjZo4-2BLKNaRVFwnzH2u4TXPnS1hOsxCBQE8utcAiKKtho-ieNeSuR_xKEfCR2c5uPNJAvueVNit7rIFxfhpH8-m88HfcFFNlGZrZKLjzf418J8kXdzbmwvzOAAHp4B9tBJBR0BHYuncp2NlHwMXjMap0_E5fogA-t6GCNbKrcVuQMi-sXwzJh2wqni8" 
              alt="Agent 1" 
              className="h-8 w-8 rounded-full border-2 border-surface bg-surface-container-high" 
            />
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJCR6ENLO64agkwt0HJ8WHILDIrXZLGsaCDo2PkT5YntojuH_Rw_rCCnurKRm_F5l2_NhFIodzf1yy97Y056dMDjD6ZE6iOXdiMBMQ1XAryHYmxTomOPTne2JqbSeOLr_acjG1vrJ-NuXNGN7fObkh8Sb9XhkiMEa_2YZK7lHKtn3mGD5NoztdcNgFYB_gIoUFBqcBN-6Oqduvxu2yeJWVns2Vmefc9Ii94szog1W9-sdzRJW8rbQT8au2xDl4GlCucRfEvFKEwF8"
              alt="Agent 2" 
              className="h-8 w-8 rounded-full border-2 border-surface bg-surface-container-high" 
            />
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOAqOJaG5FC1DTq_2Gak3eYdpgr7Td3PfbCIv2PJ1bKqysIHsduSBRBE7RWN4FJMfToKEkfqVHE7eesFVMU-x8AmjFcJb-5EkbV_u3gKMBd3RMzp_5LYfEaLWgHwv-Un89Ar5bgcu4aqX63WBHGgSpbjj8reW0NUYLLiwGNXRp7WmpaTvWRHa-MdnV-N7IVa-o2x9RVh2zzhu7j5s9ZSWAnF5cTpNCqqZLHb8l_FtwtpOgPzXkm8r1gJavxvdB8PDS6MqAw4Pe4WQ"
              alt="Agent 3" 
              className="h-8 w-8 rounded-full border-2 border-surface bg-surface-container-high" 
            />
            <div className="h-8 w-8 rounded-full border-2 border-surface bg-surface-container-highest flex items-center justify-center text-[10px] font-bold text-primary">
              +9
            </div>
          </div>
          <button className="bg-primary hover:bg-primary/90 text-on-primary px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold text-sm transition-all shadow-lg shadow-primary/10">
            <ListPlus size={18} />
            New Task
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <TaskBoard />

      {/* Bento Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-outline-variant/10 col-span-1 md:col-span-2 flex flex-col md:flex-row justify-between items-center gap-6" style={{ background: 'rgba(34, 42, 61, 0.4)', backdropFilter: 'blur(12px)' }}>
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface">Efficiency Matrix</h3>
            <p className="text-outline text-sm">Throughput increased by 14% this epoch.</p>
            <div className="mt-4 flex gap-6">
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-primary">0.42ms</span>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Avg Latency</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold text-secondary">99.8%</span>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Node Success</span>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-48 h-24 bg-surface-container-highest/30 rounded-lg relative overflow-hidden flex items-end px-2 gap-1">
            <div className="w-full bg-primary/20 h-1/2 rounded-t"></div>
            <div className="w-full bg-primary/30 h-2/3 rounded-t"></div>
            <div className="w-full bg-primary/40 h-1/3 rounded-t"></div>
            <div className="w-full bg-primary/50 h-3/4 rounded-t"></div>
            <div className="w-full bg-primary h-full rounded-t"></div>
            <div className="w-full bg-primary/70 h-1/2 rounded-t"></div>
            <div className="w-full bg-primary/40 h-1/4 rounded-t"></div>
            <div className="absolute inset-0 pointer-events-none opacity-30 flex items-center justify-center">
              <span className="text-primary text-xs font-mono uppercase tracking-[1em]">Optimizing</span>
            </div>
          </div>
        </div>

        <div className="bg-tertiary-container/10 p-6 rounded-2xl border border-tertiary/10 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-tertiary/5 text-8xl transition-transform group-hover:scale-110">
            <Sparkles size={80} />
          </div>
          <h3 className="font-headline font-bold text-tertiary">AI Suggestions</h3>
          <p className="text-on-surface-variant text-sm mt-2 relative z-10">I recommend re-assigning #NODE-402 to Fin-Oracle for faster vector execution.</p>
          <button className="mt-4 text-xs font-bold text-tertiary flex items-center gap-1 hover:underline relative z-10">
            Apply System Change
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskManager;
