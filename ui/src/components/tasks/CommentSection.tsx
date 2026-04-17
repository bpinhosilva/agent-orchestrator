import React, { useState, useCallback } from 'react';
import { MessagesSquare } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { commentsApi, CommentAuthorType } from '../../api/comments';
import { useAuth } from '../../contexts/AuthContextInstance';
import CommentList from './CommentList';
import CommentEditor from './CommentEditor';
import ConfirmDialog from '../ConfirmDialog';
import { useNotification } from '../../hooks/useNotification';

interface CommentSectionProps {
  taskId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ taskId }) => {
  const [isSending, setIsSending] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const { notifySuccess, notifyApiError } = useNotification();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const data = await commentsApi.findAllByTask(taskId);
      return [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    },
    enabled: Boolean(taskId),
    refetchInterval: 10_000,
  });

  const invalidateComments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
  }, [queryClient, taskId]);

  const handleSendComment = async (content: string) => {
    if (!taskId || !user) return;

    try {
      setIsSending(true);

      await commentsApi.create(taskId, {
        content,
        authorType: CommentAuthorType.USER,
        authorUserId: user.id,
      });

      invalidateComments();
    } catch {
      // axios interceptor handles notification
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setDeleteConfirmId(commentId);
  };

  const confirmDelete = async () => {
    if (!taskId || !deleteConfirmId) return;
    
    try {
      setIsDeleting(true);
      await commentsApi.remove(taskId, deleteConfirmId);
      invalidateComments();
      setDeleteConfirmId(null);
      notifySuccess('Protocol Cleared', 'The comment data has been purged from the orchestration logs.');
    } catch (error) {
      notifyApiError(error, 'Purge Failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 shadow-2xl shadow-primary/5 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-outline-variant/5 flex items-center justify-between bg-surface-container-low/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2.5 rounded-xl shadow-lg shadow-primary/10">
            <MessagesSquare size={22} className="text-secondary stroke-[2.5]" />
          </div>
          <h2 className="text-lg font-headline font-black tracking-tight text-on-surface">Comments & Activity</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/40 font-mono tracking-widest uppercase">
            {comments.length} Logged
          </span>
        </div>
      </div>

      {/* Comment List Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        <CommentList 
          comments={comments} 
          isLoading={isLoading} 
          onDelete={handleDeleteComment} 
        />
      </div>

      {/* Editor Area */}
      <div className="p-6 bg-surface-container-low/50 border-t border-outline-variant/5 backdrop-blur-md">
        <CommentEditor onSend={handleSendComment} isSending={isSending} />
      </div>

      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        onClose={() => !isDeleting && setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Purge Communication Protocol?"
        message="This action will permanently erase the selected entry and all its associated artifacts from the neural stream. This operation is irreversible."
        confirmText="Execute Purge"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
};

export default CommentSection;
