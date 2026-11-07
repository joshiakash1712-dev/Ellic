import React, { useEffect, useRef } from 'react';
import { X, Keyboard, Compass, Receipt, Boxes, LayoutDashboard, Command, Sparkles } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  icon: React.ReactNode;
  shortcuts: {
    keys: string[];
    description: string;
    badge?: string;
  }[];
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap & Escape listener
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on open
    setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Trap Tab key
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Navigation & Focus',
      icon: <Compass className="w-4 h-4 text-sky-400" />,
      shortcuts: [
        { keys: ['Alt', 'S'], description: 'Focus Sidebar Navigation (or Alt + 1)' },
        { keys: ['Alt', 'M'], description: 'Focus Main Workstage (or Alt + 2)' },
        { keys: ['Alt', 'H'], description: 'Focus Header Navigation (or Alt + 3)' },
        { keys: ['Tab'], description: 'Move forward to next interactive element' },
        { keys: ['Shift', 'Tab'], description: 'Move backward to previous element' },
      ],
    },
    {
      title: 'Sidebar Arrow Key Traversal',
      icon: <Command className="w-4 h-4 text-emerald-400" />,
      shortcuts: [
        { keys: ['↓'], description: 'Move to next sidebar item' },
        { keys: ['↑'], description: 'Move to previous sidebar item' },
        { keys: ['Home'], description: 'Jump to first sidebar item' },
        { keys: ['End'], description: 'Jump to last sidebar item' },
        { keys: ['→'], description: 'Exit sidebar into main workstage' },
        { keys: ['Enter'], description: 'Activate highlighted view' },
      ],
    },
    {
      title: 'Direct View Switching',
      icon: <LayoutDashboard className="w-4 h-4 text-blue-400" />,
      shortcuts: [
        { keys: ['Alt', 'P'], description: 'Go to POS Billing Counter' },
        { keys: ['Alt', 'I'], description: 'Go to Inventory & Restock Manager' },
        { keys: ['Alt', 'D'], description: 'Go to Retailer Dashboard' },
        { keys: ['Alt', 'C'], description: 'Go to Customer CRM & Digital Khata' },
        { keys: ['Alt', 'R'], description: 'Go to Reports & GST Analytics' },
      ],
    },
    {
      title: 'Retail POS Counter Actions',
      icon: <Receipt className="w-4 h-4 text-amber-400" />,
      shortcuts: [
        { keys: ['F2'], description: 'Start new sale / Reset cart' },
        { keys: ['F3'], description: 'Focus barcode scanner / product search' },
        { keys: ['F4'], description: 'Select Cash payment method' },
        { keys: ['F8'], description: 'Complete transaction & issue receipt' },
        { keys: ['F9'], description: 'Select Dynamic UPI QR payment' },
        { keys: ['F10'], description: 'Select Card payment method' },
        { keys: ['Esc'], description: 'Cancel payment modal or clear search' },
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] bg-[#0E1526] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#090D18]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sky-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="keyboard-shortcuts-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>Keyboard Shortcuts Guide</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-sky-300 text-[10px] font-semibold">
                  Accessibility
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Navigate the entire Ellic platform without reaching for your mouse.
              </p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
            aria-label="Close shortcuts dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 max-h-[calc(90vh-130px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {shortcutGroups.map((group, gIdx) => (
              <div
                key={gIdx}
                className="p-4 rounded-xl bg-[#141C30]/70 border border-slate-800/80 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  {group.icon}
                  <span>{group.title}</span>
                </div>

                <div className="space-y-2">
                  {group.shortcuts.map((sc, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-800/50 last:border-0"
                    >
                      <span className="text-slate-300 pr-2">{sc.description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keys.map((k, kIdx) => (
                          <React.Fragment key={kIdx}>
                            <kbd className="px-2 py-1 rounded bg-[#090D18] border border-slate-700 text-sky-300 font-mono text-[11px] font-bold shadow-sm">
                              {k}
                            </kbd>
                            {kIdx < sc.keys.length - 1 && (
                              <span className="text-slate-500 text-[10px]">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/20 text-xs text-sky-200/90 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white">Pro Tip for Store Operators:</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300 font-mono text-[10px]">Alt+S</kbd> to jump straight into the sidebar, use <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300 font-mono text-[10px]">↑/↓</kbd> to pick your module, and press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300 font-mono text-[10px]">→</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300 font-mono text-[10px]">Enter</kbd> to work. You can toggle this dialog anytime with <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300 font-mono text-[10px]">Alt+/</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300 font-mono text-[10px]">Shift+?</kbd>.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#090D18] flex items-center justify-between text-xs text-slate-400">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Esc</kbd> anytime to exit</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
