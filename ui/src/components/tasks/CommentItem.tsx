import React from 'react';
import { CommentAuthorType } from '../../api/comments';
import type { TaskComment } from '../../api/comments';
import AttachmentItem from './AttachmentItem';
import { Bot, User, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

dayjs.extend(relativeTime);

interface CommentItemProps {
  comment: TaskComment;
  onDelete?: (id: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onDelete }) => {
  const isAgent = comment.authorType === CommentAuthorType.AGENT;
  const authorName = isAgent ? comment.authorAgent?.name : comment.authorUser?.username;
  const avatarUrl = isAgent ? comment.authorAgent?.avatarUrl : comment.authorUser?.avatarUrl;

  return (
    <div className="flex gap-4 group">
      {/* Avatar */}
      <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center border transition-all ${
        isAgent 
          ? 'bg-tertiary/10 border-tertiary/20 text-tertiary shadow-[0_0_15px_rgba(221,183,255,0.1)]' 
          : 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_15px_rgba(173,198,255,0.1)]'
      }`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={authorName} className="h-full w-full object-cover p-1" />
        ) : (
          isAgent ? <Bot size={20} /> : <User size={20} />
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-headline font-bold ${isAgent ? 'text-tertiary' : 'text-primary'}`}>
              {authorName || 'Anonymous'}
            </span>
            {isAgent && (
              <span className="px-1.5 py-0.5 bg-tertiary/10 text-tertiary text-[9px] font-black uppercase tracking-widest rounded border border-tertiary/20">
                Agent
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-on-surface-variant/40 lowercase">
              {dayjs(comment.createdAt).format('MMM DD, YYYY HH:mm:ss')}
            </span>
            {onDelete && (
              <button 
                onClick={() => onDelete(comment.id)}
                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-error/10 text-on-surface-variant/40 hover:text-error rounded-lg transition-all"
                title="Delete comment"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="bg-surface-container-high/40 border border-outline-variant/5 p-4 rounded-xl shadow-sm group-hover:bg-surface-container-high/60 transition-colors">
          <div className="prose prose-invert prose-xs max-w-none text-on-surface leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {comment.content}
            </ReactMarkdown>
          </div>
          
          {comment.artifacts && comment.artifacts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-outline-variant/10">
              {comment.artifacts.map((artifact) => (
                <AttachmentItem 
                  key={artifact.id}
                  name={artifact.originalName}
                  type={artifact.mimeType.split('/')[1] || 'file'}
                  filePath={artifact.filePath}
                  size="Artifact" 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
