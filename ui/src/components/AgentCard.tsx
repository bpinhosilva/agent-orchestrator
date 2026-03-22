import React from 'react';
import { MoreVertical, Brain, Sparkles, Activity } from 'lucide-react';

interface AgentCardProps {
  name: string;
  expertise: string;
  model: string;
  status: 'active' | 'idle' | 'updating';
  metricLabel: string;
  metricValue: string;
}

const AgentCard: React.FC<AgentCardProps> = ({ 
  name, 
  expertise, 
  model, 
  status, 
  metricLabel, 
  metricValue 
}) => {
  const statusConfig = {
    active: {
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      dot: 'bg-secondary',
      animate: 'animate-pulse',
      icon: Brain,
    },
    idle: {
      color: 'text-on-surface-variant',
      bg: 'bg-on-surface-variant/10',
      dot: 'bg-on-surface-variant',
      animate: '',
      icon: Sparkles,
    },
    updating: {
      color: 'text-primary',
      bg: 'bg-primary/10',
      dot: 'bg-primary',
      animate: 'animate-ping',
      icon: Activity,
    },
  };

  const config = statusConfig[status];

  return (
    <div className="group relative bg-surface-container-low rounded-xl p-6 transition-all duration-300 hover:translate-y-[-4px] shadow-lg border border-transparent hover:border-outline-variant/20">
      <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg} ${config.color} text-[10px] font-bold tracking-widest uppercase`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${config.animate}`}></span>
        {status}
      </div>

      <div className="flex gap-5">
        <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center ring-1 ring-outline-variant/30 group-hover:ring-primary/50 transition-all">
          <config.icon className={`text-3xl ${config.color}`} size={32} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold font-headline text-white">{name}</h3>
          <p className="text-on-surface-variant text-xs mt-1">{expertise}</p>
          
          <div className="mt-4 flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-on-surface-variant/60 uppercase tracking-tighter">Model</span>
              <span className="text-xs font-semibold text-primary">{model}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-on-surface-variant/60 uppercase tracking-tighter">{metricLabel}</span>
              <span className={`text-xs font-semibold ${config.color}`}>{metricValue}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button className="flex-1 py-2 rounded bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors">
          Configure
        </button>
        <button className="px-3 py-2 rounded bg-surface-container-high text-on-surface-variant hover:text-white transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );
};

export default AgentCard;
