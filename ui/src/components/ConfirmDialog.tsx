import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'primary' | 'success' | 'warning';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  showCheckbox?: boolean;
  checkboxLabel?: string;
  onCheckboxChange?: (checked: boolean) => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
  showCheckbox = false,
  checkboxLabel = "Don't show this again",
  onCheckboxChange,
}) => {
  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-error/10',
      iconColor: 'text-error',
      buttonBg: 'bg-error hover:bg-error/90',
      buttonText: 'text-white',
      ring: 'ring-error/20',
    },
    primary: {
      icon: Info,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      buttonBg: 'bg-primary hover:bg-primary/90',
      buttonText: 'text-on-primary',
      ring: 'ring-primary/20',
    },
    success: {
      icon: CheckCircle2,
      iconBg: 'bg-secondary/10',
      iconColor: 'text-secondary',
      buttonBg: 'bg-secondary hover:bg-secondary/90',
      buttonText: 'text-surface',
      ring: 'ring-secondary/20',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-tertiary/10', // using tertiary for warning style
      iconColor: 'text-tertiary',
      buttonBg: 'bg-tertiary hover:bg-tertiary/90',
      buttonText: 'text-surface',
      ring: 'ring-tertiary/20',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-surface/60 backdrop-blur-md"
        />

        {/* Dialog Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-surface-container-low rounded-2xl shadow-2xl overflow-hidden ring-1 ring-outline-variant/10 p-6 flex flex-col gap-6"
        >
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${config.iconBg} ${config.iconColor}`}>
              <Icon size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black font-headline text-white tracking-tight mb-2">
                {title}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {message}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-on-surface-variant hover:text-white transition-colors h-fit p-1"
            >
              <X size={20} />
            </button>
          </div>
          
          {showCheckbox && (
            <div className="flex items-center gap-3 px-1 mt-[-12px]">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    onChange={(e) => onCheckboxChange?.(e.target.checked)}
                    className="peer appearance-none w-5 h-5 rounded border border-outline-variant/30 bg-surface-container-highest checked:bg-primary checked:border-primary transition-all cursor-pointer"
                  />
                  <CheckCircle2 size={14} className="absolute inset-0 m-auto text-on-primary opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <span className="text-xs font-bold text-on-surface-variant group-hover:text-white transition-colors uppercase tracking-wider">
                  {checkboxLabel}
                </span>
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant hover:text-white hover:bg-surface-container-highest transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all ${config.buttonBg} ${config.buttonText} ${config.ring} hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed`}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmDialog;
