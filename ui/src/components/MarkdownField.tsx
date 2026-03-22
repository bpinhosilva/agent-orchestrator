import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Code as CodeIcon, Sparkles } from 'lucide-react';

interface MarkdownFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  helperText?: string;
  maxLength?: number;
}

const MarkdownField: React.FC<MarkdownFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  height = 'h-40',
  helperText,
  maxLength
}) => {
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
          {label}
        </label>
        <div className="flex items-center gap-1 bg-surface-container-high/50 p-1 rounded-lg ring-1 ring-outline-variant/10">
          <button
            onClick={() => setMode('write')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black tracking-widest uppercase transition-all ${
              mode === 'write' 
                ? 'bg-primary text-surface shadow-lg shadow-primary/20' 
                : 'text-on-surface-variant/60 hover:text-white'
            }`}
          >
            <CodeIcon size={12} />
            Write
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black tracking-widest uppercase transition-all ${
              mode === 'preview' 
                ? 'bg-secondary text-surface shadow-lg shadow-secondary/20' 
                : 'text-on-surface-variant/60 hover:text-white'
            }`}
          >
            <Eye size={12} />
            Preview
          </button>
        </div>
      </div>

      <div className={`relative group bg-surface-container-highest/30 rounded-lg ring-1 ring-outline-variant/10 focus-within:ring-primary/40 transition-all ${height} overflow-hidden`}>
        {mode === 'write' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            className="w-full h-full bg-transparent border-none text-xs text-on-surface p-4 focus:outline-none placeholder:text-on-surface-variant/30 resize-none leading-relaxed font-mono"
          />
        ) : (
          <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar prose prose-invert prose-xs max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value || '*Nothing to preview*'}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        {helperText ? (
          <div className="flex items-center gap-1.5 px-1 py-0.5 rounded bg-tertiary/10 text-[9px] font-black text-tertiary tracking-widest uppercase w-fit">
            <Sparkles size={10} />
            {helperText}
          </div>
        ) : <div />}
        
        {maxLength && (
          <div className="text-[10px] font-bold text-on-surface-variant/40 lowercase tracking-widest">
            {value.length} / {maxLength}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownField;
