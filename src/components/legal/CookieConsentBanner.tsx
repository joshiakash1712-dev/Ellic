import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck } from 'lucide-react';
import {
  getSavedCookiePreferences,
  saveCookiePreferences,
  LegalPageSlug,
} from '../../config/legal.config';

interface CookieConsentBannerProps {
  onOpenLegalPage: (slug: LegalPageSlug) => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onOpenLegalPage,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = getSavedCookiePreferences();
    if (!saved) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleEssentialOnly = () => {
    saveCookiePreferences({
      functionalPreferences: true,
      analyticsAndDiagnostics: false,
    });
    setVisible(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ellix-cookie-updated'));
    }
  };

  const handleAcceptAll = () => {
    saveCookiePreferences({
      functionalPreferences: true,
      analyticsAndDiagnostics: true,
    });
    setVisible(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ellix-cookie-updated'));
    }
  };

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Notice"
      className="fixed bottom-3 left-3 right-16 sm:bottom-5 sm:left-6 sm:right-auto sm:max-w-md z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl text-xs text-slate-600 dark:text-slate-300 space-y-2 sm:space-y-3"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
          <Cookie className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>Cookies, Offline Storage &amp; Privacy Notice</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
          </div>
          <p className="leading-relaxed text-[11px] text-slate-600 dark:text-slate-400">
            We use strictly necessary browser storage for secure authentication and offline POS synchronization, plus optional diagnostics. Review our{' '}
            <button
              type="button"
              onClick={() => onOpenLegalPage('privacy-policy')}
              className="text-blue-600 dark:text-sky-400 font-semibold hover:underline"
            >
              Privacy Policy
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={() => onOpenLegalPage('cookie-policy')}
              className="text-blue-600 dark:text-sky-400 font-semibold hover:underline"
            >
              Cookie Policy
            </button>.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => onOpenLegalPage('cookie-policy')}
          className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Preferences
        </button>
        <button
          type="button"
          onClick={handleEssentialOnly}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold transition-colors"
        >
          Essential Only
        </button>
        <button
          type="button"
          onClick={handleAcceptAll}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-colors shadow-sm"
        >
          Accept All
        </button>
      </div>
    </div>
  );
};
