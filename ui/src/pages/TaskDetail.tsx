import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  ArrowLeftRight, 
  Settings2, 
  Zap, 
  Wallet, 
  ShieldCheck
} from 'lucide-react';
import CommentSection from '../components/tasks/CommentSection';
import MarkdownField from '../components/MarkdownField';

const TaskDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [description, setDescription] = useState('Execute comprehensive linguistic analysis across social channels to determine bullish/bearish divergence for $ALPHA asset class. Correlate with 24h volume spikes.');

  return (
    <div className="max-w-7xl mx-auto w-full space-y-8">
      {/* Breadcrumb & Header Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="flex items-center space-x-2 text-sm text-on-surface-variant font-medium">
          <span 
            className="hover:text-primary transition-colors cursor-pointer"
            onClick={() => navigate('/')}
          >
            Task Manager
          </span>
          <ChevronRight size={16} />
          <span className="text-on-surface">Node-{taskId}</span>
        </nav>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-semibold text-error hover:bg-error/10 transition-colors rounded-md active:scale-95">
            Delete Task
          </button>
          <button className="px-4 py-2 text-sm font-semibold text-on-surface bg-surface-container-high hover:bg-surface-container-highest transition-colors rounded-md active:scale-95">
            Stop Task
          </button>
          <button className="px-6 py-2 text-sm font-semibold bg-primary text-on-primary rounded-md shadow-lg shadow-primary/10 hover:brightness-110 transition-all active:scale-95">
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Primary Task Details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Task Definition Card */}
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-xl">
            <div className="flex items-start justify-between mb-8">
              <div className="space-y-1">
                <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-primary/70">Task Identifier</label>
                <h2 className="text-2xl font-headline font-extrabold text-on-surface">#NODE-395: Analyze Market Sentiment</h2>
              </div>
              <div className="flex items-center px-3 py-1.5 bg-secondary-container/20 rounded-full border border-secondary/20">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                </span>
                <span className="text-[0.75rem] font-bold text-secondary uppercase tracking-tight">In-Progress</span>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant">Task Name</label>
                  <input 
                    className="w-full bg-surface-container-lowest border-none rounded-md px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary transition-all outline-none" 
                    type="text" 
                    defaultValue="Analyze Market Sentiment"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-on-surface-variant">Priority</label>
                  <select className="w-full bg-surface-container-lowest border-none rounded-md px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary transition-all outline-none">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              
              <MarkdownField
                label="Task Description"
                value={description}
                onChange={setDescription}
                placeholder="Enter task description..."
                height="h-44"
                helperText="Supports GitHub Flavored Markdown"
              />
              

            </div>
          </div>
          
          {/* Comments & Activity Section */}
          <div className="flex-1 min-h-0">
            <CommentSection taskId={taskId || 'demo-task'} />
          </div>
        </div>
        
        {/* Right Column: Meta & Resources */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Agent Assignment Card */}
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-xl">
            <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-tertiary/80 block mb-4">Assigned Agent</label>
            <div className="flex items-center gap-4 p-4 bg-surface-container-high rounded-lg border border-tertiary/10 group cursor-pointer hover:border-tertiary/30 transition-all">
              <div className="h-12 w-12 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary overflow-hidden">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDp6ceGvjIWcKUOGQqu7b6bJfrKx-zgT8f78mrALcWkwvPnWEZnyMcGAlFseocznia1WrvgpCYtpq2R8aWS0sP0-UydRZbDps7huwsGEIwlKandzP4-zOSrHmYm_Pw8L2LiQzkSQBiwejCbJscG_DSwhWRCG8DuCjF7ZYR6bj_DMW_b940XTMgRs2dK_I2hZ-IA4RiiI7WLZqDlOhSWjioCjc6RGDjAfKeOvLgl5_Wj5lt0SPrNgoMb25fexA-0nPWxODr_dva2Pek"
                  alt="Agent Icon" 
                  className="w-full h-full p-1"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-headline font-bold text-on-surface">Fin-Oracle v2.4</h4>
                <p className="text-xs text-on-surface-variant">Financial Logic Specialist</p>
              </div>
              <ArrowLeftRight className="text-on-surface-variant group-hover:text-tertiary transition-colors" size={20} />
            </div>
            <button className="w-full mt-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center gap-2">
              <Settings2 size={14} />
              Configure Agent Parameters
            </button>
          </div>
          
          {/* Resource Usage Widgets */}
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 shadow-xl">
            <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant block mb-6">Real-time Resources</label>
            <div className="space-y-6">
              
              {/* Token Usage */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-on-surface">Token Usage</span>
                  <span className="text-sm font-mono text-primary">12,402 / 50k</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '24.8%' }}></div>
                </div>
              </div>
              
              {/* Latency */}
              <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="text-secondary" size={16} />
                  <span className="text-sm text-on-surface-variant">Avg. Latency</span>
                </div>
                <span className="text-sm font-mono text-on-surface">420ms</span>
              </div>
              
              {/* Cost */}
              <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-lg">
                <div className="flex items-center gap-3">
                  <Wallet className="text-tertiary" size={16} />
                  <span className="text-sm text-on-surface-variant">Current Cost</span>
                </div>
                <span className="text-sm font-mono text-on-surface">$0.342</span>
              </div>
              
            </div>
          </div>
          
          {/* Health Indicator Widget */}
          <div className="bg-gradient-to-br from-[#131b2e] to-[#222a3d] p-6 rounded-xl border border-secondary/10 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-secondary/80">Node Health</span>
                <span className="px-1.5 py-0.5 bg-secondary/20 text-secondary text-[0.6rem] font-bold rounded">OPTIMAL</span>
              </div>
              <div className="text-3xl font-headline font-extrabold text-on-surface">99.8%</div>
              <p className="text-xs text-on-surface-variant mt-1 italic">No anomalies detected in execution stream.</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
