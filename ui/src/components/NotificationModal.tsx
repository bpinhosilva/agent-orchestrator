import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';

const NotificationModal: React.FC = () => {
  const { state, closeNotification } = useNotification();
  const { isOpen, type, title, message } = state;

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeNotification();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeNotification]);

  const config = {
    success: {
      icon: <CheckCircle2 className="text-secondary" size={24} />,
      bgIcon: 'bg-secondary/10',
      accent: 'from-secondary/40',
      shadow: 'shadow-secondary/10',
    },
    error: {
      icon: <AlertCircle className="text-error" size={24} />,
      bgIcon: 'bg-error/10',
      accent: 'from-error/40',
      shadow: 'shadow-error/10',
    },
    info: {
      icon: <Info className="text-primary" size={24} />,
      bgIcon: 'bg-primary/10',
      accent: 'from-primary/40',
      shadow: 'shadow-primary/10',
    },
  };

  const currentConfig = config[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeNotification}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
          />

          {/* Modal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className={`relative w-full max-w-sm bg-surface-container-low/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-outline-variant/10 overflow-hidden ${currentConfig.shadow}`}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl ${currentConfig.bgIcon} flex items-center justify-center`}>
                {currentConfig.icon}
              </div>

              {/* Text */}
              <div className="space-y-2">
                <h3 className="text-xl font-headline font-bold text-on-surface tracking-tight">
                  {title}
                </h3>
                <p className="text-sm text-on-surface-variant/70 leading-relaxed font-medium">
                  {message}
                </p>
              </div>

              {/* Action */}
              <button
                onClick={closeNotification}
                className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-2xl transition-all active:scale-95"
              >
                Dismiss
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={closeNotification}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors text-on-surface-variant/20 hover:text-white"
            >
              <X size={16} />
            </button>

            {/* Design Elements */}
            <div className={`absolute top-0 right-0 w-24 h-1 bg-gradient-to-l ${currentConfig.accent} to-transparent opacity-50`} />
            <div className={`absolute bottom-0 left-0 w-16 h-16 ${currentConfig.bgIcon} blur-3xl opacity-20 rounded-full -ml-8 -mb-8`} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;
