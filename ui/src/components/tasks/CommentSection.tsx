import React, { useState, useEffect, useCallback } from 'react';
import { MessagesSquare } from 'lucide-react';
import { commentsApi, CommentAuthorType } from '../../api/comments';
import type { TaskComment } from '../../api/comments';
import { usersApi } from '../../api/users';
import type { User } from '../../api/users';
import CommentList from './CommentList';
import CommentEditor from './CommentEditor';
import ConfirmDialog from '../ConfirmDialog';
import { useNotification } from '../../hooks/useNotification';

interface CommentSectionProps {
  taskId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ taskId }) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { notifySuccess, notifyApiError } = useNotification();

  const fetchComments = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await commentsApi.findAllByTask(taskId);
      setComments([...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [taskId]);

  const fetchUser = useCallback(async () => {
    try {
      const users = await usersApi.findAll();
      if (users.length > 0) {
        // We'll use the user with "bruno" in it if available, as that's the current user's workspace
        const bruno = users.find(u => u.username.toLowerCase().includes('bruno'));
        setCurrentUser(bruno || users[0]);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);


  useEffect(() => {
    fetchComments();
    fetchUser();

    // Small polling to "fill the section" with agent updates if they happen
    const interval = setInterval(() => fetchComments(true), 10000);
    return () => clearInterval(interval);
  }, [fetchComments, fetchUser]);

  const handleSendComment = async (content: string) => {
    if (!taskId || !currentUser) return;

    try {
      setIsSending(true);
      
      const newComment = await commentsApi.create(taskId, {
        content,
        authorType: CommentAuthorType.USER, // Default to user for manual comments
        authorUserId: currentUser.id,
      });

      setComments((prev) => [newComment, ...prev]);
    } catch (error) {
      console.error('Failed to send comment:', error);
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
      
      // Update local state
      setComments((prev) => prev.filter((c) => c.id !== deleteConfirmId));
      
      setDeleteConfirmId(null);
      notifySuccess('Protocol Cleared', 'The comment data has been purged from the orchestration logs.');
    } catch (error) {
      console.error('Failed to delete comment:', error);
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
