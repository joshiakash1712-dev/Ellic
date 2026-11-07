import { useEffect, useCallback } from 'react';

export interface KeyboardNavigationOptions {
  onSelectView?: (viewId: string) => void;
  onToggleShortcutsModal?: () => void;
  onCloseModals?: () => void;
  enabled?: boolean;
}

/**
 * Focuses the sidebar navigation, preferring the currently active page item or first button.
 */
export const focusSidebarNavigation = (): boolean => {
  const sidebar = document.getElementById('sidebar-nav');
  if (!sidebar) return false;

  const activeItem = sidebar.querySelector<HTMLElement>('[aria-current="page"], [aria-selected="true"]');
  if (activeItem) {
    activeItem.focus();
    return true;
  }

  const firstButton = sidebar.querySelector<HTMLElement>('nav button, button');
  if (firstButton) {
    firstButton.focus();
    return true;
  }

  sidebar.focus();
  return true;
};

/**
 * Focuses the main workstage, preferring a primary input/search or the container itself.
 */
export const focusMainWorkstage = (): boolean => {
  const workstage = document.getElementById('main-workstage');
  if (!workstage) return false;

  // Look for prominent primary inputs (e.g., barcode scan input, search filter)
  const primaryInput = workstage.querySelector<HTMLElement>(
    'input[type="text"]:not([disabled]), input[type="search"]:not([disabled]), input:not([type="hidden"]):not([disabled])'
  );

  if (primaryInput) {
    primaryInput.focus();
    return true;
  }

  const firstInteractive = workstage.querySelector<HTMLElement>(
    'button:not([disabled]), a[href]:not([disabled]), [tabindex="0"]'
  );

  if (firstInteractive) {
    firstInteractive.focus();
    return true;
  }

  workstage.focus();
  return true;
};

/**
 * Focuses the top header bar, preferring notifications or first interactive control.
 */
export const focusAppHeader = (): boolean => {
  const header = document.getElementById('app-header');
  if (!header) return false;

  const target = header.querySelector<HTMLElement>(
    '#btn-nav-return-website, #btn-nav-notifications, #btn-hamburger-menu, button'
  );

  if (target) {
    target.focus();
    return true;
  }

  header.focus();
  return true;
};

export const useKeyboardShortcuts = ({
  onSelectView,
  onToggleShortcutsModal,
  onCloseModals,
  enabled = true,
}: KeyboardNavigationOptions) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // 1. ESCAPE: Close modals, dropdowns, or blur active inputs
      if (e.key === 'Escape') {
        if (onCloseModals) {
          onCloseModals();
        }
        if (isInput && target) {
          target.blur();
        }
        return;
      }

      // 2. SHORTCUTS MODAL: Shift + ? or Alt + /
      if (
        (e.key === '?' && !isInput && !e.altKey && !e.ctrlKey && !e.metaKey) ||
        (e.altKey && (e.key === '/' || e.key === '?'))
      ) {
        e.preventDefault();
        onToggleShortcutsModal?.();
        return;
      }

      // 3. ALT / OPTION KEY SHORTCUTS (Works everywhere, even when inputs are focused)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();

        switch (key) {
          // Alt + S or Alt + 1: Focus Sidebar
          case 's':
          case '1':
            e.preventDefault();
            focusSidebarNavigation();
            break;

          // Alt + M or Alt + 2: Focus Main Workstage
          case 'm':
          case '2':
            e.preventDefault();
            focusMainWorkstage();
            break;

          // Alt + H or Alt + 3: Focus Header
          case 'h':
          case '3':
            e.preventDefault();
            focusAppHeader();
            break;

          // Alt + P: Quick view POS Billing
          case 'p':
            e.preventDefault();
            onSelectView?.('pos');
            setTimeout(focusMainWorkstage, 60);
            break;

          // Alt + I: Quick view Inventory
          case 'i':
            e.preventDefault();
            onSelectView?.('inventory');
            setTimeout(focusMainWorkstage, 60);
            break;

          // Alt + D: Quick view Dashboard
          case 'd':
            e.preventDefault();
            onSelectView?.('dashboard');
            setTimeout(focusMainWorkstage, 60);
            break;

          // Alt + C: Quick view CRM / Customers
          case 'c':
            e.preventDefault();
            onSelectView?.('crm');
            setTimeout(focusMainWorkstage, 60);
            break;

          // Alt + R: Quick view Reports & GST
          case 'r':
            e.preventDefault();
            onSelectView?.('reports');
            setTimeout(focusMainWorkstage, 60);
            break;

          default:
            break;
        }
      }
    },
    [enabled, onSelectView, onToggleShortcutsModal, onCloseModals]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};
