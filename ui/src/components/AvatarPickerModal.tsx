import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { AVATAR_PRESETS, type AvatarPresetKey } from '../lib/avatarPresets';

interface AvatarPickerModalProps {
  isOpen: boolean;
  selectedAvatar: AvatarPresetKey;
  currentAvatar: AvatarPresetKey;
  isSaving: boolean;
  onSelect: (avatar: AvatarPresetKey) => void;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  selectedAvatar,
  currentAvatar,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm">
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
        aria-labelledby="avatar-picker-title"
        className="relative w-full max-w-2xl rounded-3xl border border-outline-variant/20 bg-surface p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-primary/80">
              Avatar presets
            </p>
            <h2
              id="avatar-picker-title"
              className="font-headline text-2xl font-bold text-on-surface"
            >
              Choose your avatar
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Pick one of the built-in presets. Your choice updates everywhere
              your profile picture is shown.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close avatar picker"
            className="rounded-full border border-outline-variant/20 p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {AVATAR_PRESETS.map((preset) => {
            const isSelected = preset.key === selectedAvatar;
            const isCurrent = preset.key === currentAvatar;

            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => onSelect(preset.key)}
                className={`group relative rounded-2xl border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(173,198,255,0.25)]'
                    : 'border-outline-variant/20 bg-surface-container-low hover:border-primary/40 hover:bg-surface-container-high'
                }`}
              >
                <div className="overflow-hidden rounded-2xl bg-surface-container-high">
                  <img
                    src={preset.src}
                    alt={preset.label}
                    className="aspect-square w-full object-cover"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-on-surface">
                    {preset.label}
                  </span>
                  {isSelected ? (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-on-primary">
                      <Check size={14} />
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {isCurrent ? 'Current avatar' : 'Available preset'}
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
            disabled={isSaving || selectedAvatar === currentAvatar}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
            ) : null}
            Save avatar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarPickerModal;
