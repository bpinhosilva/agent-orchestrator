import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paperclip } from 'lucide-react';
import { type RecurrentTaskExec, ExecStatus } from '../api/recurrent-tasks';
import AttachmentItem from './tasks/AttachmentItem';
import MarkdownField from './MarkdownField';

interface ExecLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  exec: RecurrentTaskExec | null;
}

const statusConfig: Record<
  ExecStatus,
  { label: string; dot: string; badge: string }
> = {
  [ExecStatus.SUCCESS]: {
    label: 'Success',
    dot: 'bg-secondary',
    badge: 'text-secondary bg-secondary/10 border-secondary/20',
  },
  [ExecStatus.FAILURE]: {
    label: 'Failure',
    dot: 'bg-error',
    badge: 'text-error bg-error/10 border-error/20',
  },
  [ExecStatus.RUNNING]: {
    label: 'Running',
    dot: 'bg-tertiary animate-pulse',
    badge: 'text-tertiary bg-tertiary/10 border-tertiary/20',
  },
  [ExecStatus.CANCELED]: {
    label: 'Canceled',
    dot: 'bg-on-surface-variant',
    badge: 'text-on-surface-variant bg-surface-container-highest border-outline-variant/30',
  },
};

const getMimeExtension = (mimeType: string): string => {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'text/csv': 'csv',
    'application/json': 'json',
  };
  return map[mimeType] ?? mimeType.split('/').pop() ?? 'file';
};

const ExecLogModal: React.FC<ExecLogModalProps> = ({ isOpen, onClose, exec }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const status = exec ? (statusConfig[exec.status] ?? statusConfig[ExecStatus.CANCELED]) : null;
  const artifacts = exec?.artifacts?.filter(Boolean) ?? [];

  return (
    <AnimatePresence>
      {isOpen && exec && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface/60 backdrop-blur-md"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-surface-container-low rounded-3xl shadow-2xl ring-1 ring-outline-variant/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-8 py-6 border-b border-outline-variant/10 flex-shrink-0">
              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-mono">
                    #EXEC-{exec.id.split('-')[0].toUpperCase()}
                  </span>
                  {status && (
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${status.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-headline font-black text-white tracking-tight">
                  Execution Log
                </h2>
                <p className="text-[10px] text-on-surface-variant/50 font-mono">
                  {new Date(exec.createdAt).toLocaleString()}
                  {exec.latencyMs != null && (
                    <span className="ml-4 text-on-surface-variant/40">
                      {exec.latencyMs >= 60000
                        ? `${Math.floor(exec.latencyMs / 60000)}m ${String(Math.floor((exec.latencyMs % 60000) / 1000)).padStart(2, '0')}s`
                        : `${Math.floor(exec.latencyMs / 1000)}s`}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 rounded-xl text-on-surface-variant hover:text-white hover:bg-surface-container-highest transition-all active:scale-90"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-8">
              {/* Result section */}
              <section>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface-variant/40 mb-4">
                  Result
                </p>
                <div className="bg-surface-container-highest/20 rounded-2xl border border-outline-variant/10 px-6 py-5">
                  {exec.result ? (
                    <MarkdownField readOnly value={exec.result} />
                  ) : (
                    <p className="text-xs text-on-surface-variant/30 italic font-mono uppercase tracking-widest">
                      No output recorded for this execution.
                    </p>
                  )}
                </div>
              </section>

              {/* Artifacts section */}
              {artifacts.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Paperclip size={14} className="text-on-surface-variant/40" />
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface-variant/40">
                      Artifacts
                      <span className="ml-2 text-primary/60">{artifacts.length}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {artifacts.map((artifact) => (
                      <AttachmentItem
                        key={artifact.id}
                        name={artifact.originalName}
                        type={getMimeExtension(artifact.mimeType)}
                        filePath={artifact.filePath}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExecLogModal;
