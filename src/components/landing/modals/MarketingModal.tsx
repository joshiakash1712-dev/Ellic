import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

interface MarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const MarketingModal: React.FC<MarketingModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg'
}) => {
  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
          {/* Backdrop with subtle blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Centering wrapper that allows natural document flow when content exceeds viewport */}
          <div className="min-h-[100dvh] w-full flex items-start sm:items-center justify-center p-2.5 sm:p-4 md:p-6 py-3 sm:py-8 pointer-events-none">
            {/* Modal Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              className={`relative w-full ${maxWidth} glass-panel rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 z-10 text-slate-900 dark:text-slate-100 pointer-events-auto border border-slate-200/80 dark:border-slate-800/80`}
            >
              {/* Subtle brand gradient backdrop BEHIND the glass modal */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-600/10 via-slate-900/60 to-teal-600/10 pointer-events-none rounded-2xl sm:rounded-3xl" />

              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3.5 sm:pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="min-w-0 pr-2">
                  <h3
                    id="modal-title"
                    className="text-lg sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white leading-tight"
                  >
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  className="w-9 h-9 sm:w-10 sm:h-10 -mr-1 -mt-1 flex items-center justify-center shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="mt-4 sm:mt-5">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
