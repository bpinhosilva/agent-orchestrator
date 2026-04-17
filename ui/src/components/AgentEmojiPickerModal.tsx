import React, { useEffect } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import {
  AGENT_EMOJI_OPTIONS,
  type AgentEmojiValue,
} from '../lib/agentEmojis';

interface AgentEmojiPickerModalProps {
  isOpen: boolean;
  selectedEmoji: AgentEmojiValue;
  currentEmoji: AgentEmojiValue;
  isSaving: boolean;
  onSelect: (emoji: AgentEmojiValue) => void;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

const AgentEmojiPickerModal: React.FC<AgentEmojiPickerModalProps> = ({
  isOpen,
  selectedEmoji,
  currentEmoji,
  isSaving,
  onSelect,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-md">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={() => {
          if (!isSaving) {
            onClose();
          }
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-emoji-picker-title"
        className="relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-outline-variant/20 bg-surface shadow-[0_35px_120px_rgba(0,0,0,0.55)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(173,198,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(197,255,191,0.12),transparent_32%)]" />

        <div className="relative border-b border-outline-variant/10 px-6 py-5">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.32em] text-primary">
                <Sparkles size={12} />
                Agent identity
              </div>
              <h2
                id="agent-emoji-picker-title"
                className="font-headline text-2xl font-black tracking-tight text-on-surface"
              >
                Choose an emoji signature
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant">
                Pick one of the built-in native emojis to mark this agent across
                the fleet, tasks, and comments.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              aria-label="Close emoji picker"
              className="rounded-full border border-outline-variant/20 p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="relative p-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {AGENT_EMOJI_OPTIONS.map((option) => {
              const isSelected = option.value === selectedEmoji;
              const isCurrent = option.value === currentEmoji;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelect(option.value)}
                  className={`group relative overflow-hidden rounded-3xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-[0_18px_35px_rgba(173,198,255,0.16)]'
                      : 'border-outline-variant/20 bg-surface-container-low/80 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-surface-container-high'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`${option.label} emoji ${option.value}`}
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/5 bg-surface-container-high text-4xl shadow-inner shadow-black/20">
                    <span aria-hidden="true">{option.value}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        {option.label}
                      </p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {option.hint}
                      </p>
                    </div>
                    {isSelected ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary">
                        <Check size={14} />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant/60">
                    {isCurrent ? 'Current' : 'Available'}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-outline-variant/20 px-5 py-2.5 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void onConfirm()}
              disabled={isSaving || selectedEmoji === currentEmoji}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
              ) : null}
              Save emoji
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentEmojiPickerModal;
