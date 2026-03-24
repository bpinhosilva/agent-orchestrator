import React from 'react';
import { FileText, Image as ImageIcon, Download, Eye } from 'lucide-react';

interface AttachmentItemProps {
  name: string;
  size?: string;
  type: 'pdf' | 'png' | 'jpg' | 'svg' | string;
}

const AttachmentItem: React.FC<AttachmentItemProps> = ({ name, size, type }) => {
  const isImage = ['png', 'jpg', 'jpeg', 'svg', 'gif'].includes(type.toLowerCase());

  return (
    <div className="flex items-center gap-4 p-3 bg-surface-container-highest/40 rounded-lg border border-outline-variant/10 group hover:border-primary/20 transition-all cursor-pointer">
      <div className={`h-10 w-10 rounded shadow-inner flex items-center justify-center ${isImage ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
        {isImage ? <ImageIcon size={20} /> : <FileText size={20} />}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-on-surface truncate">{name}</p>
        <p className="text-[10px] text-on-surface-variant/60 font-medium uppercase tracking-tighter">{size || 'Unknown Size'}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 hover:bg-surface-container-highest rounded text-on-surface-variant hover:text-primary transition-colors">
          {isImage ? <Eye size={14} /> : <Download size={14} />}
        </button>
      </div>
    </div>
  );
};

export default AttachmentItem;
