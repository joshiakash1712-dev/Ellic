import React from 'react';
import { focusMainWorkstage, focusSidebarNavigation, focusAppHeader } from '../../hooks/useKeyboardShortcuts';

interface SkipLinksProps {
  onOpenShortcuts?: () => void;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ onOpenShortcuts }) => {
  return (
    <nav
      aria-label="Skip navigation links"
      className="fixed top-2 left-2 z-[9999] pointer-events-none"
    >
      <div className="flex flex-wrap items-center gap-2">
        <a
          href="#main-workstage"
          onClick={(e) => {
            e.preventDefault();
            focusMainWorkstage();
          }}
          className="pointer-events-auto transform -translate-y-24 focus:translate-y-0 transition-transform duration-200 px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-2xl border border-sky-400 outline-none ring-4 ring-blue-500/30 flex items-center gap-2"
        >
          <span>Skip to Main Workstage</span>
          <kbd className="px-1.5 py-0.5 rounded bg-blue-800 text-[10px] font-mono">Alt+M</kbd>
        </a>

        <a
          href="#sidebar-nav"
          onClick={(e) => {
            e.preventDefault();
            focusSidebarNavigation();
          }}
          className="pointer-events-auto transform -translate-y-24 focus:translate-y-0 transition-transform duration-200 px-3.5 py-2 rounded-xl bg-slate-900 text-sky-300 font-bold text-xs shadow-2xl border border-slate-700 outline-none ring-4 ring-sky-500/30 flex items-center gap-2"
        >
          <span>Skip to Sidebar Navigation</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">Alt+S</kbd>
        </a>

        <a
          href="#app-header"
          onClick={(e) => {
            e.preventDefault();
            focusAppHeader();
          }}
          className="pointer-events-auto transform -translate-y-24 focus:translate-y-0 transition-transform duration-200 px-3.5 py-2 rounded-xl bg-slate-900 text-slate-200 font-bold text-xs shadow-2xl border border-slate-700 outline-none ring-4 ring-slate-500/30 flex items-center gap-2"
        >
          <span>Skip to Header</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">Alt+H</kbd>
        </a>

        {onOpenShortcuts && (
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="pointer-events-auto transform -translate-y-24 focus:translate-y-0 transition-transform duration-200 px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs shadow-2xl border border-slate-700 outline-none ring-4 ring-blue-500/30 flex items-center gap-2"
          >
            <span>All Keyboard Shortcuts</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 text-sky-400 text-[10px] font-mono">Alt+/</kbd>
          </button>
        )}
      </div>
    </nav>
  );
};
