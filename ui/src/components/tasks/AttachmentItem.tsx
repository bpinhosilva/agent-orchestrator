import React from 'react';
import { FileText, Download } from 'lucide-react';

interface AttachmentItemProps {
  name: string;
  size?: string;
  type: 'pdf' | 'png' | 'jpg' | 'svg' | 'jpeg' | 'gif' | string;
  filePath: string;
}

const AttachmentItem: React.FC<AttachmentItemProps> = ({ name, size, type, filePath }) => {
  const isImage = ['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(type.toLowerCase());
  // The backend uses api/v1 global prefix and uploads/artifacts as the controller path.
  // We use a relative path starting with /api/v1 to hit the Vite proxy correctly.
  const artifactUrl = filePath.startsWith('http') ? filePath : `/api/v1/${filePath}`;

  return (
    <div 
      className="flex items-center gap-4 p-3 bg-surface-container-highest/40 rounded-lg border border-outline-variant/10 group hover:border-primary/20 transition-all cursor-pointer"
      onClick={() => window.open(artifactUrl, '_blank')}
    >
      <div className={`h-10 w-10 rounded shadow-inner flex items-center justify-center overflow-hidden ${isImage ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
        {isImage ? (
          <img src={artifactUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <FileText size={20} />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-on-surface truncate">{name}</p>
        <p className="text-[10px] text-on-surface-variant/60 font-medium uppercase tracking-tighter">{size || 'Artifact'}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant hover:text-primary transition-colors">
          <Download size={14} />
        </button>
      </div>
    </div>
  );
};

export default AttachmentItem;
