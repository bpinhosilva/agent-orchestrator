import React from 'react';
import type { TaskComment } from '../../api/comments';
import CommentItem from './CommentItem';

interface CommentListProps {
  comments: TaskComment[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
}

const CommentList: React.FC<CommentListProps> = ({ comments, isLoading, onDelete }) => {
  const content = (() => {
    if (isLoading) {
      return (
        <div className="space-y-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 w-10 bg-surface-container-highest rounded-xl"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 w-1/4 bg-surface-container-highest rounded"></div>
                <div className="h-20 w-full bg-surface-container-highest rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (comments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 bg-surface-container-high/20 rounded-2xl border border-dashed border-outline-variant/20">
          <div className="h-12 w-12 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant/40">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-on-surface">No comments yet</p>
            <p className="text-xs text-on-surface-variant/60">Start the conversation by adding a comment below.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} onDelete={onDelete} />
        ))}
      </div>
    );
  })();

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
      {content}
    </div>
  );
};

export default CommentList;
