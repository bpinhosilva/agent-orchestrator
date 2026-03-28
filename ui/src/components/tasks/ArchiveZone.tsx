import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Archive } from 'lucide-react';

interface ArchiveZoneProps {
  isDragging: boolean;
}

const ArchiveZone: React.FC<ArchiveZoneProps> = ({ isDragging }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'archive' });
  
  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 flex items-center gap-4 px-6 py-3 rounded-2xl border-2 border-dashed transition-all duration-500 min-w-[240px]
        ${isOver 
          ? 'bg-error/20 border-error text-error scale-[1.02] shadow-xl shadow-error/10 z-50' 
          : isDragging
            ? 'bg-article-container/40 border-primary/40 text-primary animate-pulse shadow-lg'
            : 'bg-surface-container-low/20 border-outline-variant/10 text-on-surface-variant/40 hover:bg-surface-container-low/40 hover:border-outline-variant/30'
        }
      `}
    >
      <div className={`
         w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500
         ${isOver ? 'bg-error text-white rotate-12' : isDragging ? 'bg-primary/20 text-primary' : 'bg-surface-container-highest/50'}
      `}>
        <Archive size={20} />
      </div>
      <div className="flex flex-col flex-1">
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none transition-colors ${isOver ? 'text-error' : isDragging ? 'text-primary' : 'text-on-surface-variant/60'}`}>
          {isOver ? 'Authorization Required' : 'Archival Logic Sink'}
        </span>
        <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest mt-1.5 whitespace-nowrap">
          {isOver ? 'Release to decommissioning' : isDragging ? 'Drag node here to decommission' : 'Sector dormant'}
        </span>
      </div>
      
      {isDragging && !isOver && (
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-1 h-1 rounded-full bg-primary/40 animate-ping" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchiveZone;
