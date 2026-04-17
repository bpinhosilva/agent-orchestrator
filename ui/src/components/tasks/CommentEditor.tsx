import React, { useState } from 'react';
import { Send } from 'lucide-react';
import MarkdownField from '../MarkdownField';

interface CommentEditorProps {
  onSend: (content: string) => void;
  isSending: boolean;
}

const CommentEditor: React.FC<CommentEditorProps> = ({ onSend, isSending }) => {
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (content.trim() && !isSending) {
      onSend(content);
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSend();
    }
  };

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 shadow-2xl shadow-primary/5 focus-within:border-primary/30 transition-all space-y-4">
      <MarkdownField
        value={content}
        onChange={setContent}
        onKeyDown={handleKeyDown}
        placeholder="Write a comment..."
        height="min-h-[120px]"
      />
      
      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/5">
        <div className="flex items-center gap-1">
          {/* Toolbar buttons removed as MarkdownField handles preview/write */}
        </div>

        <button
          onClick={handleSend}
          disabled={!content.trim() || isSending}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
            content.trim() 
              ? 'bg-gradient-to-r from-primary to-primary/80 text-on-primary shadow-lg shadow-primary/20 hover:brightness-110' 
              : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
          }`}
        >
          {isSending ? (
            <div className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin"></div>
          ) : (
            <>
              Send
              <Send size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CommentEditor;
