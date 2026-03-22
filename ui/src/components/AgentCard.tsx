import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Brain, Sparkles, Activity, Settings, Terminal, Trash2, XCircle } from 'lucide-react';

interface AgentCardProps {
  id: string;
  name: string;
  expertise: string;
  model: string;
  status: 'active' | 'idle' | 'updating' | 'inactive';
  metricLabel: string;
  metricValue: string;
  onProbe?: (id: string) => void;
  onConfigure?: (id: string) => void;
  onDelete?: (id: string) => void;
  onActivate?: (id: string) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ 
  id,
  name, 
  expertise, 
  model, 
  status, 
  metricLabel, 
  metricValue,
  onProbe,
  onConfigure,
  onDelete,
  onActivate
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    inactive: {
      color: 'text-error/60',
      bg: 'bg-error/5',
      dot: 'bg-error/40',
      animate: '',
      icon: XCircle,
    },
  };

  const config = statusConfig[status];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

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
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onConfigure?.(id);
          }}
          className="flex-1 py-2 rounded bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-highest transition-colors"
        >
          Configure
        </button>
        <div className="relative" ref={menuRef}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className={`px-3 py-2 rounded bg-surface-container-high text-on-surface-variant hover:text-white transition-colors h-full ${isMenuOpen ? 'bg-surface-container-highest text-white' : ''}`}
          >
            <MoreVertical size={16} />
          </button>

          {isMenuOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 bg-surface-container-highest rounded-lg shadow-2xl py-2 ring-1 ring-outline-variant/20 animate-in fade-in slide-in-from-bottom-2 duration-200 z-20">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onProbe?.(id);
                  setIsMenuOpen(false);
                }}
                disabled={status === 'inactive'}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-on-surface-variant hover:text-white hover:bg-primary/10 transition-colors group disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
              >
                <Terminal size={14} className="group-hover:text-primary" />
                Probe Agent
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigure?.(id);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-on-surface-variant hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings size={14} />
                Control Matrix
              </button>
              <div className="my-1 border-t border-outline-variant/10" />
              {status === 'inactive' ? (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onActivate?.(id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-secondary/60 hover:text-secondary hover:bg-secondary/10 transition-colors"
                >
                  <Brain size={14} />
                  Activate Node
                </button>
              ) : (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-error/60 hover:text-error hover:bg-error/10 transition-colors"
                >
                  <Trash2 size={14} />
                  Decommission
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentCard;
